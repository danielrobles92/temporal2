"""Analiza fotos con la red neuronal de PERREQUE directamente desde la terminal.

Carga los mismos modelos y el mismo codigo que el ml-service (app/), pero sin servidor,
sin backend y sin la pagina: se le pasa una foto y explica paso a paso que hace la red
y que devuelve. El resultado final es exactamente el que recibiria el backend.

Uso (desde la carpeta ml-service):
  .venv\\Scripts\\python.exe analizar.py FOTO.jpg
  .venv\\Scripts\\python.exe analizar.py FOTO1.jpg FOTO2.jpg --comparar
  .venv\\Scripts\\python.exe analizar.py FOTO.jpg --perros --calor
  .venv\\Scripts\\python.exe analizar.py --juntar PERRO_A.jpg PERRO_B.jpg --perros --calor
  .venv\\Scripts\\python.exe analizar.py FOTO.jpg --json

Opciones:
  --comparar   compara las fotos entre si como lo hace la busqueda de coincidencias
               (coseno de los vectores y probabilidad calibrada de ser el mismo perro).
  --perros     analiza por separado cada perro que cuenta el contador (para ver que diria la
               red de cada uno; la plataforma rechaza las fotos con 2 o mas perros).
  --calor      guarda mapas de calor (Grad-CAM): en que parte de la foto se fijo la red para
               decidir la raza. Se guardan en ml-service/analisis/.
  --juntar A B arma una foto con los perros A y B lado a lado y la analiza.
  --json       imprime solo el resultado en JSON (el mismo formato de /analyze).
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torchvision.models import EfficientNet_B0_Weights

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from app.analyzer import DogAnalyzer  # noqa: E402
from app.color import DogSegmenter, VOC_DOG, _MEAN, _STD  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.counter import DogCounter, select_dogs  # noqa: E402
from app.model import EfficientNetEmbedder, load_image, resolve_device  # noqa: E402
from app.views import SIDE, central_box, make_views  # noqa: E402

OUT_DIR = ROOT / "analisis"
IMAGENET_NAMES = EfficientNet_B0_Weights.IMAGENET1K_V1.meta["categories"]
# Calibracion del backend (ImageEmbeddingService.java): P(mismo perro) = sigmoid(W*cos + B).
CALIB_W, CALIB_B = 30.9448, -23.0951


def pct(x: float) -> str:
    return f"{x * 100:.1f} %"


def conf_text(p: float) -> str:
    """Mismas etiquetas que la pagina (MatchSuggestions.js)."""
    return "Muy probable" if p >= 0.7 else "Posible" if p >= 0.3 else "Poco probable"


def same_dog_probability(cos: float) -> float:
    return 1.0 / (1.0 + math.exp(-(CALIB_W * cos + CALIB_B)))


class Red:
    """Los mismos modelos que carga el ml-service al arrancar (app/main.py)."""

    def __init__(self) -> None:
        s = get_settings()
        self.device = resolve_device(s.device)
        self.embedder = EfficientNetEmbedder(device=s.device, l2_normalize=s.l2_normalize)
        self.dognet = DogAnalyzer(ROOT / s.dognet_weights_path, self.device,
                                  ROOT / s.dognet_thresholds_path, with_color=s.dognet_color,
                                  age_path=ROOT / s.dognet_age_path, with_age=s.dognet_age,
                                  views_path=ROOT / s.dognet_views_path)
        self.preprocess = EfficientNet_B0_Weights.IMAGENET1K_V1.transforms()
        # El mismo contador de perros que usa /describe (app/counter.py).
        self.counter = DogCounter(self.dognet, self.device, ROOT / s.dog_counter_path)

    # --- lo mismo que /analyze ---------------------------------------------------------
    def servicio(self, img: Image.Image):
        """(vector, descripcion) exactamente como /analyze (foto completa: centro + secciones)."""
        desc = self.dognet.describe([img], imagenet=self.embedder.run, detector=self.counter.detect)[0]
        desc.pop("_detections", None)
        return desc.pop("_vector"), desc

    # --- valores intermedios para explicar la decision ------------------------------------
    @torch.inference_mode()
    def vistas(self, img: Image.Image):
        """Cada vista (app/views.py) con lo que ve DogNet y la segunda opinion de ImageNet."""
        a = self.dognet
        vs = make_views(img)
        x = torch.stack([v.tensor for v in vs])
        probs, size_p = a._dognet(x)
        _, gates = self.embedder.run(x)
        strict = set(a._strict_sections(probs, gates))
        out = []
        for i, v in enumerate(vs):
            if i == 0:
                estado = "ve perro" if a._is_dog(probs[0], gates[0], a.thresholds["not_dog"]) else "no ve perro"
            elif i in strict:
                estado = "ve perro (DogNet muy seguro + ImageNet)"
            elif a._is_dog(probs[i], gates[i], a.view_params["detector_no_perro"]):
                estado = "quiza perro (necesita al detector)"
            else:
                estado = "no ve perro"
            out.append({"view": v, "p": probs[i], "size": size_p[i], "gate": gates[i], "estado": estado})
        return out

    @torch.inference_mode()
    def imagenet_top(self, x: torch.Tensor, k: int = 3):
        m = self.embedder.model
        x = x.unsqueeze(0).to(self.device)
        probs = torch.softmax(m.classifier(torch.flatten(m.avgpool(m.features(x)), 1)), 1)[0]
        top = torch.topk(probs, k)
        return [(IMAGENET_NAMES[int(i)], float(p)) for p, i in zip(top.values, top.indices)]

    @torch.inference_mode()
    def pixeles_de_perro(self, img: Image.Image):
        """Fraccion de la foto que el segmentador del color marca como 'perro'."""
        seg = self.dognet.segmenter
        if seg is None:
            return None
        small = DogSegmenter._resize(img)
        x = torch.from_numpy(np.asarray(small, dtype=np.float32) / 255.0).permute(2, 0, 1)
        x = ((x - _MEAN) / _STD).unsqueeze(0).to(self.device)
        return float((seg.model(x)["out"].argmax(1)[0].cpu().numpy() == VOC_DOG).mean())

    def contar_perros(self, img: Image.Image):
        """(candidatos del detector, perros que cuenta el contador) como en /describe."""
        w, h = img.size
        cands = self.counter.candidates(img, multi_view=self.counter.multi_view,
                                        verify=self.counter.params.get("min_dog_prob", 0.0) > 0)
        kept = select_dogs(cands, **self.counter.params)
        to_px = lambda c: (c["box"][0] * w, c["box"][1] * h, c["box"][2] * w, c["box"][3] * h)  # noqa: E731
        kept = sorted(kept, key=lambda c: -c["area"])
        return cands, [(to_px(c), c["score"], c["dog_prob"]) for c in kept]

    # --- Grad-CAM -----------------------------------------------------------------------
    def mapa_de_calor(self, x: torch.Tensor, clase: int) -> np.ndarray:
        """Grad-CAM de DogNet para una clase: que zonas de la vista empujan esa respuesta."""
        m = self.dognet.model
        x = x.unsqueeze(0).to(self.device)
        with torch.enable_grad():
            fmap = m.features(x)                                   # [1, 1280, 7, 7]
            fmap.retain_grad()
            logit = m.cls_head(torch.flatten(m.avgpool(fmap), 1))[0, clase]
            logit.backward()
        w = fmap.grad.mean(dim=(2, 3), keepdim=True)
        cam = torch.relu((w * fmap).sum(1))[0].detach().cpu().numpy()
        return cam / cam.max() if cam.max() > 0 else cam


def dentro(box, zona) -> float:
    ix = max(0.0, min(box[2], zona[2]) - max(box[0], zona[0]))
    iy = max(0.0, min(box[3], zona[3]) - max(box[1], zona[1]))
    return ix * iy / max(1e-6, (box[2] - box[0]) * (box[3] - box[1]))


def lo_que_ve_la_red(img: Image.Image, box) -> Image.Image:
    """La vista (centro o seccion) tal como la recibe la red: 224 x 224 px."""
    return img.crop(tuple(round(v) for v in box)).resize((SIDE, SIDE), Image.BICUBIC)


def nombre_vista(v, i: int, total: int) -> str:
    return "centro" if v.kind == "centro" else f"seccion {i} de {total - 1}"


def guardar_calor(base: Image.Image, cam: np.ndarray, path: Path) -> None:
    heat = Image.fromarray((cam * 255).astype(np.uint8)).resize(base.size, Image.BICUBIC)
    v = np.asarray(heat, dtype=np.float32) / 255.0
    rgb = np.stack([np.clip(1.5 - abs(4 * v - 3), 0, 1),       # rojo   (zonas mas importantes)
                    np.clip(1.5 - abs(4 * v - 2), 0, 1),       # verde
                    np.clip(1.5 - abs(4 * v - 1), 0, 1)], -1)  # azul   (zonas que no importan)
    over = (0.55 * np.asarray(base, dtype=np.float32) + 0.45 * rgb * 255).clip(0, 255).astype(np.uint8)
    side = Image.new("RGB", (base.width * 2 + 8, base.height), "white")
    side.paste(base, (0, 0))
    side.paste(Image.fromarray(over), (base.width + 8, 0))
    side.save(path)


def juntar(a: Path, b: Path) -> Path:
    ia, ib = Image.open(a).convert("RGB"), Image.open(b).convert("RGB")
    hgt = 400
    ia = ia.resize((round(ia.width * hgt / ia.height), hgt))
    ib = ib.resize((round(ib.width * hgt / ib.height), hgt))
    out = Image.new("RGB", (ia.width + ib.width, hgt), "white")
    out.paste(ia, (0, 0))
    out.paste(ib, (ia.width, 0))
    OUT_DIR.mkdir(exist_ok=True)
    path = OUT_DIR / f"juntas_{a.stem}__{b.stem}.jpg"
    out.save(path, quality=95)
    return path


def resumen(d: dict) -> str:
    if not d["is_dog"]:
        return "NO ES PERRO"
    raza = d["breed"] if d["in_catalog"] else f"Otro (la mas parecida: {d['breed_top'][0]['breed']})"
    partes = [f"{raza} {pct(d['breed_confidence'])}", f"tamano {d['size']}"]
    if d.get("age"):
        partes.append(d["age"])
    if d.get("colors"):
        partes.append("colores " + ", ".join(c["name"] for c in d["colors"]))
    return " | ".join(partes)


def explicar(red: Red, path: Path, args) -> dict:
    img = load_image(path.read_bytes())
    w, h = img.size
    vec, d = red.servicio(img)
    vistas = red.vistas(img)
    a, t = red.dognet, red.dognet.thresholds
    elegida = d["view"]["index"] if d["is_dog"] else 0
    v = vistas[elegida]
    print("=" * 78)
    print(f"IMAGEN: {path}  ({w} x {h} px)")
    print("=" * 78)

    zona = central_box(w, h)
    visible = (zona[2] - zona[0]) * (zona[3] - zona[1]) / (w * h)
    n_sec = len(vistas) - 1
    lado = min(w, h)
    print(f"\n[1] Preprocesamiento: la red recibe {SIDE} x {SIDE} px; la foto se revisa COMPLETA en "
          f"{len(vistas)} vistas")
    print(f"    - Centro: el lado corto se lleva a 256 px y se recorta el centro de {SIDE} x {SIDE} px "
          f"({pct(visible)} del area de la foto).")
    if n_sec == 1:
        print(f"    - Seccion: la foto completa (casi cuadrada) reducida a {SIDE} x {SIDE} px.")
    else:
        print(f"    - Secciones: {n_sec} cuadros de {lado} x {lado} px a lo largo del lado largo, encimados al"
              f" menos a la mitad, cada uno reducido a {SIDE} x {SIDE} px.")
    print("      Entre todas cubren el 100 % de los pixeles: un perro en la orilla tambien se revisa.")
    print("    - Cada pixel se normaliza con la media y desviacion de ImageNet.")
    vp = a.view_params
    print("    - P(perro) de DogNet y de ImageNet en cada vista:")
    for i, x in enumerate(vistas):
        b = [round(c) for c in x["view"].box]
        p_nd = float(x["p"][a.i_nd:].sum())
        marca = "  <- de aqui salen los datos" if d["is_dog"] and i == elegida else ""
        print(f"      {nombre_vista(x['view'], i, len(vistas)):<16} x {b[0]}-{b[2]}, y {b[1]}-{b[3]} px:"
              f" DogNet {pct(1 - p_nd)}, ImageNet {pct(x['gate']['dog_score'])} -> {x['estado']}{marca}")
    print(f"    - Regla: es perro si el centro lo ve (P(no es perro) < {pct(t['not_dog'])}) o si una seccion lo ve")
    print(f"      con DogNet muy seguro (P(no es perro) < {pct(vp['estricta_no_perro'])}) e ImageNet >= "
          f"{pct(vp['estricta_imagenet_perro'])},")
    print(f"      o con P(no es perro) < {pct(vp['detector_no_perro'])} y el detector SSDLite encuentra un perro"
          f" (>= {vp['detector_min']}) dentro de esa seccion.")
    print("      Asi un perro en la orilla se acepta sin aceptar partes de un gato u otro animal como perro.")
    print("    - Los datos salen del centro si ahi se ve al perro; si no, de la seccion mas segura.")

    print("\n[2] EfficientNet-B0 base (ImageNet): huella visual del perro")
    print(f"    - Vector de {len(vec)} numeros (promedio de un mapa 7 x 7 x 1280), norma L2 = "
          f"{float(np.linalg.norm(vec)):.3f}.")
    print(f"    - Primeros valores: {', '.join(f'{x:+.3f}' for x in vec[:6])} ...")
    print("    - Este vector es el que se guarda y se compara con el coseno para encontrar al MISMO perro.")
    print("      Sale del centro si ahi se ve al perro (como estan guardadas las demas fotos); si no, de la"
          " seccion donde esta.")
    g = v["gate"]
    print(f"    - Segunda opinion de ImageNet ({nombre_vista(v['view'], elegida, len(vistas))}): perro "
          f"{pct(g['dog_score'])}, canido salvaje {pct(g['wild_score'])}, peluche {pct(g['teddy_score'])}")
    print("    - Lo que ImageNet cree que es: "
          + ", ".join(f"{n} {pct(p)}" for n, p in red.imagenet_top(v["view"].tensor)))

    probs, size_p = v["p"], v["size"]
    p_nd = probs[a.i_nd:]
    print(f"\n[3] DogNet v2: ¿es un perro? ({nombre_vista(v['view'], elegida, len(vistas))}, promedio de la"
          " vista y su espejo)")
    print(f"    - P(no es perro) = {pct(float(p_nd.sum()))}")
    print(f"    - Decision: {'ES PERRO' if d['is_dog'] else 'NO ES PERRO -> ' + (d['message'] or '')}")

    if d["is_dog"]:
        dog_p = probs[: a.i_otro + 1]
        dog_p = dog_p / dog_p.sum()
        order = torch.argsort(dog_p, descending=True)[:5]
        print("\n[4] Raza: P(clase | es perro), las 5 mas altas")
        for j in order:
            name = "Otro (otra raza o mestizo)" if int(j) == a.i_otro else a.breeds[int(j)]
            print(f"      {name:<34} {pct(float(dog_p[j])):>8}")
        print(f"    - Regla: si la mas alta es una raza y llega a {pct(t['breed_min'])}, esa es la raza;")
        print("      si no, se responde 'Otro'.")
        print(f"    - Decision: {d['breed']} ({pct(d['breed_confidence'])})")
        second = float(dog_p[order[1]]) if len(order) > 1 else 0.0
        if second >= 0.2:
            print(f"      Aviso: la segunda opcion tiene {pct(second)}; la red duda entre dos razas"
                  " (pasa cuando hay dos perros distintos o una mezcla).")

        print("\n[5] Tamano")
        print("      " + ", ".join(f"{n} {pct(float(p))}" for n, p in zip(a.sizes, size_p))
              + f"  -> {d['size']} ({d['weight_kg']['min']}-{d['weight_kg']['max']} kg aprox.)")
        if d.get("puppy_probability") is not None:
            print("\n[6] Etapa (red aparte, cachorro = menos de 1 anio, misma vista)")
            print(f"      P(cachorro) = {pct(d['puppy_probability'])}  (umbral {pct(a.puppy_threshold)})"
                  f" -> {d['age']}")

    # Contador de perros: el mismo que /describe (detector SSDLite, app/counter.py).
    cands, boxes = red.contar_perros(img) if d["is_dog"] else ([], [])
    frac = red.pixeles_de_perro(img)
    if frac is not None:
        print("\n[7] Color (segmentacion DeepLabV3: pixeles de perro + agrupamiento k-means)")
        print(f"    - Pixeles de perro: {pct(frac)} de la foto.")
        if len(boxes) > 1:
            print("      Aviso: hay mas de un perro; el color mezcla los pixeles de todos.")
        if d["is_dog"]:
            print(f"    - Colores (todos los detectados): "
                  f"{', '.join(c['name'] + ' ' + pct(c['share']) for c in d.get('colors', [])) or 'sin dato'}"
                  f" -> sugerencia para el formulario: {d.get('color_label')}")

    if d["is_dog"]:
        prm = red.counter.params
        vistas = "foto + espejo + 2 mitades" if red.counter.multi_view else "foto completa"
        print("\n[8] ¿Cuantos perros hay? Contador (detector SSDLite entrenado en COCO)")
        print(f"    - El detector propone {len(cands)} recuadro(s) de perro ({vistas}).")
        extra = f", que DogNet confirma como perro (>= {pct(prm['min_dog_prob'])})" if prm["min_dog_prob"] > 0 else ""
        print(f"    - Se queda con los de puntaje >= {prm['min_score']}{extra},")
        print(f"      sin repetidos (encimados o con {pct(prm['merge_inside'])} de uno dentro de otro).")
        n = max(1, len(boxes))
        print(f"    - Perros contados: {n}")
        if n >= 2:
            print(f"    - Decision: SE RECHAZA. Mensaje: \"La foto tiene {n} perros. Sube una foto donde "
                  "aparezca un solo perro (puedes recortarla).\"")
        else:
            print("    - Decision: un solo perro, se acepta.")
    detectados = []
    if args.perros:
        crops = []
        for k, (box, score, _) in enumerate(boxes, 1):
            x1, y1, x2, y2 = box
            px, py = (x2 - x1) * 0.08, (y2 - y1) * 0.08
            crop = img.crop((max(0, x1 - px), max(0, y1 - py), min(w, x2 + px), min(h, y2 + py)))
            cv, cd = red.servicio(crop)
            crops.append(cv)
            area = (x2 - x1) * (y2 - y1) / (w * h)
            cos = float(np.dot(vec, cv))
            detectados.append({"perro": k, "caja": [round(v) for v in box], "deteccion": round(score, 3),
                               "area_foto": round(area, 3), "dentro_del_centro": round(dentro(box, zona), 3),
                               "coseno_con_foto_completa": round(cos, 3), "resultado": cd})
            print(f"    Perro {k}: caja {[round(v) for v in box]}, ocupa {pct(area)} de la foto, "
                  f"{pct(dentro(box, zona))} dentro del recorte central")
            print(f"             analizado solo: {resumen(cd)}")
            print(f"             parecido de la foto completa con este perro: coseno {cos:.3f}")
        if len(boxes) > 1:
            mas = max(range(len(detectados)), key=lambda i: detectados[i]["coseno_con_foto_completa"])
            print(f"    -> La foto completa se parece mas al perro {mas + 1}: su vector es una mezcla de los"
                  " perros, dominada por el que ocupa mas espacio en el centro.")

    if args.calor and d["is_dog"]:
        OUT_DIR.mkdir(exist_ok=True)
        base = lo_que_ve_la_red(img, v["view"].box)
        base.save(OUT_DIR / f"{path.stem}_lo_que_ve_la_red.png")
        # Las dos razas del catalogo mas probables (sin "Otro"): con dos perros distintos,
        # cada mapa suele iluminar a un perro diferente.
        clases = [int(j) for j in torch.argsort(probs[: a.i_otro], descending=True)[:2]]
        print("\n[9] Mapas de calor (Grad-CAM): rojo = zonas que mas empujan esa respuesta")
        for j in clases:
            name = "Otro" if j == a.i_otro else a.breeds[j]
            out = OUT_DIR / f"{path.stem}_calor_{name.replace(' ', '_')}.png"
            guardar_calor(base, red.mapa_de_calor(v["view"].tensor, j), out)
            print(f"    - {name}: {out}")
        print(f"    - Lo que ve la red ({nombre_vista(v['view'], elegida, len(vistas))}, 224 x 224): "
              f"{OUT_DIR / (path.stem + '_lo_que_ve_la_red.png')}")

    print("\n[RESULTADO] lo que recibe el backend (resumido):")
    print("    " + resumen(d))
    if not d["is_dog"]:
        print("    El backend rechaza la foto con el mensaje: " + (d["message"] or ""))
    elif len(boxes) >= 2:
        print(f"    El backend rechaza la foto: tiene {len(boxes)} perros.")
    item = {"filename": path.name, "embedding_dim": len(vec), "embedding_primeros": [round(v, 4) for v in vec[:8]],
            **{k: v for k, v in d.items() if k != "colors"}, "colors": d.get("colors", []),
            "dog_count": max(1, len(boxes)) if d["is_dog"] else None}
    if detectados:
        item["perros_detectados"] = detectados
    print()
    return {"item": item, "vector": vec, "desc": d}


def comparar(resultados) -> None:
    print("=" * 78)
    print("COMPARACION (como la busqueda de coincidencias del backend)")
    print("=" * 78)
    for i in range(len(resultados)):
        for j in range(i + 1, len(resultados)):
            a, b = resultados[i], resultados[j]
            cos = float(np.dot(a["vector"], b["vector"]))
            p = same_dog_probability(cos)
            ra, rb = a["desc"].get("breed"), b["desc"].get("breed")
            misma = bool(ra and rb and ra == rb and a["desc"]["in_catalog"] and b["desc"]["in_catalog"])
            distinta = bool(a["desc"].get("in_catalog") and b["desc"].get("in_catalog") and ra != rb)
            print(f"{a['item']['filename']}  vs  {b['item']['filename']}")
            print(f"    coseno = {cos:.3f}   (1 = identicas, ~0.25 = perros distintos en promedio)")
            print(f"    P(mismo perro) = sigmoid({CALIB_W:.2f} x {cos:.3f} {CALIB_B:+.2f}) = {pct(p)}"
                  f" -> {conf_text(p)}  (frontera 50 % en coseno 0.75)")
            if distinta:
                print(f"    Razas distintas ({ra} / {rb}): el backend multiplica la probabilidad x 0.15 -> "
                      f"{pct(p * 0.15)} ({conf_text(p * 0.15)})")
            puntos = (40 if misma else 0) + round(cos * (0.5 if distinta else 1) * 40)
            print(f"    Puntos de raza + imagen en el puntaje del backend: {puntos} de 80 "
                  "(faltan ubicacion 10 y sexo/color 10)")
            print()


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Analiza fotos con la red neuronal de PERREQUE.")
    ap.add_argument("fotos", nargs="*", type=Path)
    ap.add_argument("--comparar", action="store_true")
    ap.add_argument("--perros", action="store_true")
    ap.add_argument("--calor", action="store_true")
    ap.add_argument("--juntar", nargs=2, type=Path, metavar=("A", "B"))
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    fotos = list(args.fotos)
    if args.juntar:
        fotos.append(juntar(*args.juntar))
    if not fotos:
        ap.error("indica al menos una foto (o --juntar A B)")
    for f in fotos:
        if not f.exists():
            ap.error(f"no existe: {f}")

    red = Red()
    if args.json:
        import contextlib
        import io
        with contextlib.redirect_stdout(io.StringIO()):
            res = [explicar(red, f, args) for f in fotos]
        print(json.dumps([r["item"] for r in res], ensure_ascii=False, indent=2))
        return
    print(f"Modelos cargados en {red.device} (EfficientNet-B0 base, DogNet v2, etapa, segmentador).\n")
    res = [explicar(red, f, args) for f in fotos]
    if args.comparar and len(res) >= 2:
        comparar(res)


if __name__ == "__main__":
    main()
