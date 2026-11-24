"""Contador de perros: cuantos perros hay en una foto.

La red de clasificacion (EfficientNet / DogNet) mira la foto completa y no puede contar.
Para no aceptar fotos con 2 o mas perros:

  1. El detector SSDLite (MobileNetV3, entrenado en COCO, pesos de torchvision) propone
     recuadros de la clase "perro" con su puntaje; se quedan los que llegan al minimo.
  2. Se quitan recuadros repetidos del mismo perro: los que se enciman mucho (IoU) o los que
     quedan casi completos dentro de otro (acercamientos que el detector marca dos veces).
  3. Opcional (min_dog_prob > 0): DogNet confirma que cada recorte es un perro, y opcional
     (min_area / min_rel_area): ignorar perros diminutos. El banco mostro que confirmar con
     DogNet BAJA la deteccion (los recortes del segundo perro suelen ser parciales) sin reducir
     los rechazos por error, asi que la configuracion elegida no lo usa.

Los parametros los elige experiments/banco_varios_perros.py (minimo de fotos de un perro
rechazadas por error) y se guardan en models/contador_perros.json.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

import torch
from PIL import Image
from torchvision.models.detection import (SSDLite320_MobileNet_V3_Large_Weights,
                                          ssdlite320_mobilenet_v3_large)

COCO_DOG_LABEL = 18
CANDIDATE_MIN_SCORE = 0.2
MAX_CANDIDATES = 10
CROP_PAD = 0.08

DEFAULT_PARAMS = {"min_score": 0.5, "merge_inside": 0.7, "min_rel_area": 0.2, "min_area": 0.02,
                  "min_dog_prob": 0.5}
DEFAULT_MULTI_VIEW = False


def _iou(a, b) -> float:
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union > 0 else 0.0


def _inside(a, b) -> float:
    """Fraccion del recuadro MAS CHICO que queda dentro del otro."""
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    small = min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1]))
    return ix * iy / small if small > 0 else 0.0


def select_dogs(candidates: List[dict], min_score: float, merge_inside: float, min_rel_area: float,
                min_area: float, min_dog_prob: float) -> List[dict]:
    """Los recuadros que cuentan como perros distintos (ver DogCounter.candidates).

    candidates: [{"box": (x1, y1, x2, y2) normalizado 0-1, "score": float, "area": float,
                  "dog_prob": float}]
    """
    kept: List[dict] = []
    for c in sorted(candidates, key=lambda c: -c["score"]):
        if c["score"] < min_score or c["dog_prob"] < min_dog_prob:
            continue
        if any(_iou(c["box"], k["box"]) >= 0.5 or _inside(c["box"], k["box"]) >= merge_inside for k in kept):
            continue
        kept.append(c)
    if not kept:
        return []
    largest = max(k["area"] for k in kept)
    return [k for k in kept if k["area"] == largest
            or (k["area"] >= min_area and k["area"] >= min_rel_area * largest)]


def count_dogs(candidates: List[dict], **params) -> int:
    """Cuantos perros distintos hay segun los recuadros candidatos."""
    return len(select_dogs(candidates, **params))


class DogCounter:
    def __init__(self, dognet, device: torch.device, params_path: Optional[Path] = None) -> None:
        """dognet: el DogAnalyzer ya cargado (se reutiliza su red para confirmar cada recorte)."""
        self.device = device
        self.dognet = dognet
        weights = SSDLite320_MobileNet_V3_Large_Weights.DEFAULT
        self.transform = weights.transforms()
        self.detector = ssdlite320_mobilenet_v3_large(weights=weights).eval().to(device)
        # Por omision SSDLite revisa sus 90 clases desde puntaje 0.001: miles de operaciones
        # pequenas (en GPU mas lento que en CPU). Lo que esta debajo de CANDIDATE_MIN_SCORE ya se
        # descartaba y no puede suprimir recuadros de mayor puntaje: mismos recuadros, ~2x mas rapido.
        self.detector.score_thresh = CANDIDATE_MIN_SCORE
        self.params = dict(DEFAULT_PARAMS)
        self.multi_view = DEFAULT_MULTI_VIEW
        if params_path is not None and params_path.exists():
            saved = json.loads(params_path.read_text(encoding="utf-8"))
            self.params.update(saved.get("params", {}))
            self.multi_view = bool(saved.get("multi_view", self.multi_view))

    @staticmethod
    def _views(img: Image.Image, multi_view: bool):
        """(imagen, funcion que pasa un recuadro a la foto completa, funcion que dice si el
        recuadro toca la linea de corte de esa vista: ahi el perro queda partido)."""
        w, h = img.size
        never = lambda b: False  # noqa: E731
        views = [(img, lambda b: b, never)]
        if not multi_view:
            return views
        views.append((img.transpose(Image.FLIP_LEFT_RIGHT), lambda b: (w - b[2], b[1], w - b[0], b[3]), never))
        # Dos mitades (con 20 % de traslape) a mayor escala: el detector trabaja a 320 px y
        # se le escapan perros chicos o encimados en la foto completa. Un recuadro que toca
        # la linea de corte es un perro partido (ya lo ve la foto completa): se descarta.
        if w >= h:
            cut, m = round(0.6 * w), 0.02 * w
            views.append((img.crop((0, 0, cut, h)), lambda b: b, lambda b, c=cut, m=m: b[2] >= c - m))
            views.append((img.crop((w - cut, 0, w, h)), lambda b, o=w - cut: (b[0] + o, b[1], b[2] + o, b[3]),
                          lambda b, m=m: b[0] <= m))
        else:
            cut, m = round(0.6 * h), 0.02 * h
            views.append((img.crop((0, 0, w, cut)), lambda b: b, lambda b, c=cut, m=m: b[3] >= c - m))
            views.append((img.crop((0, h - cut, w, h)), lambda b, o=h - cut: (b[0], b[1] + o, b[2], b[3] + o),
                          lambda b, m=m: b[1] <= m))
        return views

    @torch.inference_mode()
    def candidates(self, img: Image.Image, multi_view: bool = False, verify: bool = True) -> List[dict]:
        """Recuadros de perro. verify=False no corre DogNet en cada recorte (dog_prob = 1)."""
        w, h = img.size
        views = self._views(img, multi_view)
        outs = self.detector([self.transform(v).to(self.device) for v, _, _ in views])
        found = []
        for (_, to_full, on_cut), out in zip(views, outs):
            for box, label, score in zip(out["boxes"], out["labels"], out["scores"]):
                if int(label) != COCO_DOG_LABEL or float(score) < CANDIDATE_MIN_SCORE:
                    continue
                local = tuple(float(v) for v in box)
                if on_cut(local):
                    continue
                x1, y1, x2, y2 = to_full(local)
                if x2 - x1 >= 2 and y2 - y1 >= 2:
                    found.append(((x1, y1, x2, y2), float(score)))
        boxes = []                                   # el mismo perro visto en varias vistas: uno
        for box, score in sorted(found, key=lambda bs: -bs[1]):
            if all(_iou(box, k) < 0.5 for k, _ in boxes):
                boxes.append((box, score))
            if len(boxes) >= MAX_CANDIDATES:
                break
        if not boxes:
            return []
        crops = []
        for (x1, y1, x2, y2), _ in boxes:
            px, py = (x2 - x1) * CROP_PAD, (y2 - y1) * CROP_PAD
            crops.append(img.crop((max(0, x1 - px), max(0, y1 - py), min(w, x2 + px), min(h, y2 + py))))
        dog_probs = self._dog_probability(crops) if verify else [1.0] * len(crops)
        return [{"box": (x1 / w, y1 / h, x2 / w, y2 / h), "score": round(s, 4),
                 "area": round((x2 - x1) * (y2 - y1) / (w * h), 5), "dog_prob": round(p, 4)}
                for ((x1, y1, x2, y2), s), p in zip(boxes, dog_probs)]

    @torch.inference_mode()
    def _dog_probability(self, crops: List[Image.Image]) -> List[float]:
        """P(es perro) de DogNet para cada recorte (foto + espejo, como en DogAnalyzer)."""
        a = self.dognet
        batch = torch.stack([a.preprocess(c) for c in crops]).to(self.device)
        logits, _, _ = a.model.heads(a.model.embed(torch.cat([batch, torch.flip(batch, dims=[3])])))
        p = torch.softmax(logits.float(), 1)
        n = len(crops)
        p = (p[:n] + p[n:]) / 2
        return (1.0 - p[:, a.i_nd:].sum(1)).cpu().tolist()

    def detect(self, img: Image.Image) -> List[dict]:
        """Recuadros candidatos con la configuracion elegida (los que usa count)."""
        verify = self.params.get("min_dog_prob", 0.0) > 0
        return self.candidates(img, multi_view=self.multi_view, verify=verify)

    def count(self, img: Image.Image, candidates: Optional[List[dict]] = None) -> int:
        """candidates: los de detect() si ya se calcularon para esta foto."""
        return count_dogs(self.detect(img) if candidates is None else candidates, **self.params)
