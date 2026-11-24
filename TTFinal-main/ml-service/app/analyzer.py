"""DogAnalyzer: describe al perro de una foto con DogNet v2.

La foto se revisa COMPLETA (app/views.py): el recorte central de siempre y secciones que
cubren todos los pixeles, para que un perro pegado a la orilla no se pierda. Para cada foto:
  1. si ES un perro en alguna vista (si no, solo se dice "no se identifica como un perro";
     nunca que es en su lugar),
  2. la raza entre las 20 del catalogo o "Otro" (otra raza o mestizo),
  3. tamano (+ rango de peso orientativo) y etapa: cachorro (< 1 anio) o adulto,
  4. colores del pelaje (segmentacion + k-means, ver color.py).
Los datos 2-3 salen de la vista elegida (ver _choose_view).

Una seccion lateral puede ver "perro" en parte de un gato u otro animal; por eso, cuando el
centro no ve al perro, la seccion necesita una segunda opinion: ImageNet (con DogNet muy
seguro) o el detector SSDLite del contador de perros. Asi se recuperan los perros de la orilla
casi sin aceptar mas fotos que no son de perro (medido en experiments/banco_vistas_reglas.py,
parametros en models/vistas.json).

Los umbrales se calibran con experiments/eval_v2.py y se guardan en
models/dognet_v2_thresholds.json; si no existe se usan valores por defecto.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Callable, List, Optional, Tuple

import torch
from PIL import Image
from torchvision.models import EfficientNet_B0_Weights

from .color import DogSegmenter, coat_colors
from .dognet import AgeNet, DogNetV2
from .views import make_views

log = logging.getLogger(__name__)

# Unica respuesta cuando la foto no es de un perro: no se dice si parece gato, peluche, etc.
NOT_DOG_MESSAGE = "La imagen no se identifica como un perro. No se puede procesar."
DEFAULT_THRESHOLDS = {"not_dog": 0.5, "breed_min": 0.4, "teddy_imagenet": 0.5, "wild_imagenet": 1.01,
                      "rescue_imagenet": 0.7, "rescue_max_not_dog": 0.8}
# Reglas de las secciones (vistas fuera del centro); models/vistas.json las sobreescribe.
DEFAULT_VIEW_PARAMS = {"estricta_no_perro": 0.1, "estricta_imagenet_perro": 0.1,
                       "detector_no_perro": 0.5, "detector_min": 0.3, "detector_dentro": 0.5,
                       "margen_centro": 0.1}
VIEW_BATCH = 32                    # vistas por pasada (x2 con el espejo)
ImagenetFn = Callable[[torch.Tensor], Tuple[List[List[float]], List[dict]]]
# detector(foto) -> [{"box": (x1, y1, x2, y2) de 0 a 1, "score": float}] (DogCounter.detect)
DetectorFn = Callable[[Image.Image], List[dict]]


def _frac_inside(a, b) -> float:
    """Fraccion de la caja a dentro de la caja b."""
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    area = (a[2] - a[0]) * (a[3] - a[1])
    return ix * iy / area if area > 0 else 0.0


class DogAnalyzer:
    def __init__(self, weights_path: Path, device: torch.device,
                 thresholds_path: Optional[Path] = None, with_color: bool = True,
                 age_path: Optional[Path] = None, with_age: bool = True,
                 views_path: Optional[Path] = None) -> None:
        self.device = device
        self.view_params = dict(DEFAULT_VIEW_PARAMS)
        if views_path is not None and views_path.exists():
            self.view_params.update(json.loads(views_path.read_text(encoding="utf-8")).get("params", {}))
        ckpt = torch.load(weights_path, map_location="cpu", weights_only=True)
        self.meta = ckpt["meta"]
        self.classes: List[str] = self.meta["classes"]
        self.breeds: List[str] = self.meta["breeds"]
        self.i_otro: int = self.meta["otro_index"]
        self.i_nd: int = self.meta["not_dog_index"]
        self.not_dog_types: List[str] = self.meta["not_dog_types"]
        self.sizes: List[str] = self.meta["sizes"]
        self.ages: List[str] = self.meta["ages"]

        model = DogNetV2(len(self.classes), len(self.sizes), len(self.ages), pretrained=False)
        model.load_state_dict(ckpt["state_dict"])
        self.model = model.eval().to(device)
        self.preprocess = EfficientNet_B0_Weights.IMAGENET1K_V1.transforms()

        # Etapa de vida: red EfficientNetB0 propia (experiments/train_puppy.py) con dos
        # salidas, cachorro (< 12.5 meses) y adulto. La cabeza age_head de DogNet v2 (etapas
        # de DogAge, joven = 0-2 anios) ya no se usa: confundia cachorros con adultos.
        self.puppy_net, self.age_meta = None, None
        if with_age and age_path is not None and age_path.exists():
            age_ckpt = torch.load(age_path, map_location="cpu", weights_only=True)
            if age_ckpt["meta"].get("kind") != "binary":
                log.warning("%s no es un modelo cachorro/adulto: se ignora", age_path.name)
            else:
                self.age_meta = age_ckpt["meta"]
                net = AgeNet(n_bins=2, hidden=self.age_meta["hidden"])
                net.load_state_dict(age_ckpt["state_dict"])
                self.puppy_net = net.eval().to(device)
        self.puppy_threshold = (self.age_meta or {}).get("threshold", 0.5)

        self.thresholds = dict(DEFAULT_THRESHOLDS)
        if thresholds_path is not None and thresholds_path.exists():
            self.thresholds.update(json.loads(thresholds_path.read_text(encoding="utf-8")))
        self.segmenter = None
        if with_color:
            try:
                self.segmenter = DogSegmenter(device)
            except Exception as exc:  # noqa: BLE001 - sin pesos de segmentacion: sin color
                log.warning("Segmentador no disponible, no se estimara el color: %s", exc)

    @torch.inference_mode()
    def _dognet(self, x: torch.Tensor):
        """P(clase) y P(tamano) por vista, promedio de la vista y su espejo (TTA: +0.3 pts
        en raza y "Otro" y menos perros rechazados por error, experiments/eval_v2.py)."""
        P, S = [], []
        for chunk in torch.split(x, VIEW_BATCH):
            chunk = chunk.to(self.device)
            n = len(chunk)
            logits, size_logits, _ = self.model.heads(self.model.embed(
                torch.cat([chunk, torch.flip(chunk, dims=[3])])))   # age_head (DogAge) ya no se usa
            for lg, acc in ((logits, P), (size_logits, S)):
                pr = torch.softmax(lg.float(), 1)
                acc.append(((pr[:n] + pr[n:]) / 2).cpu())
        return torch.cat(P), torch.cat(S)

    @torch.inference_mode()
    def _puppy(self, x: torch.Tensor) -> List[Optional[float]]:
        """P(cachorro) por vista (mismo TTA)."""
        if self.puppy_net is None or not len(x):
            return [None] * len(x)
        out: List[Optional[float]] = []
        for chunk in torch.split(x, VIEW_BATCH):
            chunk = chunk.to(self.device)
            n = len(chunk)
            pr = torch.softmax(self.puppy_net(torch.cat([chunk, torch.flip(chunk, dims=[3])])).float(), 1)
            out += ((pr[:n] + pr[n:]) / 2)[:, 0].cpu().tolist()
        return out

    @torch.inference_mode()
    def describe(self, images: List[Image.Image], imagenet: Optional[ImagenetFn] = None,
                 detector: Optional[DetectorFn] = None, full_photo: bool = True) -> List[dict]:
        """Describe al perro de cada foto.

        imagenet(vistas) -> (vectores, compuertas): EfficientNet crudo sobre las mismas vistas
        (EfficientNetEmbedder.run). Da la segunda opinion de ImageNet (peluches, cachorros que
        DogNet duda) y la huella visual: cada resultado trae "_vector" (ver _vector_view).
        detector(foto): cajas de perro de SSDLite; solo se llama si el centro no ve al perro y
        una seccion lo necesita. Si se llamo, el resultado trae "_detections" (para contar perros
        sin volver a correr el detector).
        full_photo=False revisa solo el recorte central (como antes de app/views.py).
        """
        if not images:
            return []
        views = [make_views(img) for img in images]
        if not full_photo:
            views = [vs[:1] for vs in views]
        flat = torch.stack([v.tensor for vs in views for v in vs])
        probs, size_p = self._dognet(flat)
        if imagenet is not None:
            vectors, gates = imagenet(flat)
        else:
            vectors, gates = [None] * len(flat), [{}] * len(flat)

        picks, found, start = [], [], 0
        for img, vs in zip(images, views):
            idx = list(range(start, start + len(vs)))
            start += len(vs)
            c, dets = self._choose_view(img, vs, [probs[k] for k in idx], [gates[k] for k in idx], detector)
            picks.append((idx, c))
            found.append(dets)
        chosen = [idx[c] for idx, c in picks if c is not None]
        p_puppy = dict(zip(chosen, self._puppy(flat[chosen]))) if chosen else {}

        out = []
        for img, vs, (idx, c), dets in zip(images, views, picks, found):
            if c is None:                                      # ninguna vista ve un perro
                res = self._empty(is_dog=False)
                res["dog_probability"] = round(max(self._p_dog(probs[k]) for k in idx), 4)
                res["dog_score"] = gates[idx[0]].get("dog_score")
                res["_vector"] = vectors[idx[0]]
                out.append(res)
                continue
            k = idx[c]
            res = self._describe_dog(probs[k], size_p[k])
            w, h = img.size
            x1, y1, x2, y2 = vs[c].box
            box = [round(x1 / w, 4), round(y1 / h, 4), round(x2 / w, 4), round(y2 / h, 4)]
            res["view"] = {"kind": vs[c].kind, "index": c, "total": len(vs), "box": box}
            res["dog_score"] = gates[k].get("dog_score")
            v = self._vector_view([probs[j] for j in idx], [gates[j] for j in idx], c)
            res["_vector"] = vectors[idx[v]]
            if p_puppy.get(k) is not None:
                puppy = p_puppy[k] >= self.puppy_threshold
                res["age"] = "cachorro" if puppy else "adulto"
                res["age_confidence"] = round(p_puppy[k] if puppy else 1.0 - p_puppy[k], 4)
                res["puppy_probability"] = round(p_puppy[k], 4)
            if dets is not None:
                res["_detections"] = dets
            out.append(res)

        dogs = [(img, r) for img, r in zip(images, out) if r["is_dog"]]
        if self.segmenter is not None and dogs:               # colores: pixeles del perro
            segs = self.segmenter.masks([img for img, _ in dogs],
                                        [self._color_zone(img, r, detector) for img, r in dogs])
            for (_, r), (small, mask, _) in zip(dogs, segs):
                r.update(coat_colors(small, mask))
        return out

    def _color_zone(self, img, res: dict, detector: Optional[DetectorFn]):
        """Respaldo del color si el segmentador no encuentra al perro: la caja del perro del
        detector dentro de la vista elegida o, sin ella, la vista elegida (se calcula solo si hace
        falta; las cajas quedan en res["_detections"] para contar perros)."""
        def zone():
            view = res["view"]["box"]
            if detector is None:
                return view
            if res.get("_detections") is None:
                res["_detections"] = detector(img)
            boxes = [d for d in res["_detections"]
                     if d["score"] >= self.view_params["detector_min"] and _frac_inside(d["box"], view) >= 0.5]
            return max(boxes, key=lambda d: d["score"])["box"] if boxes else view
        return zone

    # --- reglas -------------------------------------------------------------------------
    def _p_dog(self, p) -> float:
        return 1.0 - float(p[self.i_nd:].sum())

    def _is_dog(self, p, gate: dict, t_not_dog: float) -> bool:
        """Regla calibrada en experiments/eval_v2.py (sobre el recorte central)."""
        t = self.thresholds
        p_not_dog = float(p[self.i_nd:].sum())
        is_dog = p_not_dog < t_not_dog
        # Rescate: la cabeza ImageNet esta segura de que es un perro (y no un peluche),
        # p. ej. cachorros de pelo esponjado que DogNet confunde con peluche.
        if (not is_dog and gate.get("dog_score", 0.0) >= t["rescue_imagenet"]
                and gate.get("teddy_score", 0.0) < min(t["teddy_imagenet"], 0.5)
                and p_not_dog < t["rescue_max_not_dog"]):
            is_dog = True
        # Segunda opinion de la cabeza ImageNet: peluches y canidos salvajes.
        if is_dog and gate.get("teddy_score", 0.0) >= t["teddy_imagenet"]:
            is_dog = False
        if is_dog and gate.get("wild_score", 0.0) >= t["wild_imagenet"]:
            is_dog = False
        return is_dog

    def _strict_sections(self, probs, gates) -> List[int]:
        """Secciones donde DogNet esta muy seguro de que hay un perro y ImageNet tambien lo ve."""
        P = self.view_params
        return [i for i in range(1, len(probs))
                if self._is_dog(probs[i], gates[i], P["estricta_no_perro"])
                and gates[i].get("dog_score", 0.0) >= P["estricta_imagenet_perro"]]

    def _choose_view(self, img, views, probs, gates, detector):
        """(indice de la vista de la que salen los datos o None si no es perro, cajas del
        detector si se corrio). Reglas y mediciones en models/vistas.json."""
        P = self.view_params
        pdog = [self._p_dog(p) for p in probs]
        strict = self._strict_sections(probs, gates)
        best = max(strict, key=lambda i: pdog[i]) if strict else None
        if self._is_dog(probs[0], gates[0], self.thresholds["not_dog"]):       # el centro ve al perro
            return (best if best is not None and pdog[best] - pdog[0] > P["margen_centro"] else 0), None
        if best is not None:
            return best, None
        loose = [i for i in range(1, len(probs)) if self._is_dog(probs[i], gates[i], P["detector_no_perro"])]
        if not loose or detector is None:
            return None, None
        dets = detector(img)                    # segunda opinion: el detector ve toda la foto
        w, h = img.size
        ok = []
        for i in loose:
            x1, y1, x2, y2 = views[i].box
            sec = (x1 / w, y1 / h, x2 / w, y2 / h)
            if any(d["score"] >= P["detector_min"] and _frac_inside(d["box"], sec) >= P["detector_dentro"]
                   for d in dets):
                ok.append(i)
        return (max(ok, key=lambda i: pdog[i]) if ok else None), dets

    def _vector_view(self, probs, gates, chosen: int) -> int:
        """Vista de la huella visual (matching): el centro si ve al perro, como se midio en
        MPDD y como estan guardadas las fotos ya indexadas; si no, la vista elegida."""
        return 0 if self._is_dog(probs[0], gates[0], self.thresholds["not_dog"]) else chosen

    def _empty(self, is_dog: bool) -> dict:
        return {"is_dog": is_dog, "dog_probability": None, "animal": "dog" if is_dog else "not_dog",
                "message": None if is_dog else NOT_DOG_MESSAGE,
                "breed": None, "breed_confidence": 0.0, "in_catalog": False, "breed_top": [],
                "size": None, "size_confidence": None, "weight_kg": None,
                "age": None, "age_confidence": None, "puppy_probability": None,
                "color": None, "color_secondary": None, "color_label": None, "colors": [], "view": None}

    def _describe_dog(self, p, size_p) -> dict:
        t = self.thresholds
        res = self._empty(is_dog=True)
        res["dog_probability"] = round(self._p_dog(p), 4)
        dog_p = p[: self.i_otro + 1]
        dog_p = dog_p / dog_p.sum()                       # P(clase | es perro)
        top = torch.topk(dog_p[: self.i_otro], 3)          # top-3 de las 20 razas
        res["breed_top"] = [{"breed": self.breeds[int(j)], "score": round(float(dog_p[j]), 4)}
                            for j in top.indices]
        best = int(dog_p.argmax())
        if best != self.i_otro and float(dog_p[best]) >= t["breed_min"]:
            res.update(breed=self.breeds[best], breed_confidence=round(float(dog_p[best]), 4),
                       in_catalog=True)
        else:
            res.update(breed="Otro", breed_confidence=round(float(dog_p[self.i_otro]), 4),
                       in_catalog=False,
                       message="Perro de una raza fuera del catalogo o mestizo (Otro).")

        si = int(size_p.argmax())
        res["size"], res["size_confidence"] = self.sizes[si], round(float(size_p[si]), 4)
        lo, hi = self.meta["size_weight_kg"][self.sizes[si]]
        res["weight_kg"] = {"min": lo, "max": hi}
        return res
