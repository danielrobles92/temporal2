"""Banco de pruebas del contador de perros (bloquear fotos con 2 o mas perros).

La red de clasificacion (EfficientNet) no cuenta perros: ve la foto completa. Para saber
cuantos perros hay se usa el detector SSDLite (COCO, ya en torchvision) y cada recuadro
se confirma con DogNet. Este banco mide cuantas fotos de UN perro se rechazarian por error
y cuantas de VARIOS perros se detectan, y elige las reglas en una mitad (dev) para medirlas
en la otra (test).

Datos (todos con la cantidad real de perros, salvo donde se indica):
  - Open Images V7: fotos en cache (imagesDS/_v2cache/openimages) con las cajas "Dog"
    anotadas por personas (bbox_*.csv). 1 caja = un perro; 2+ cajas grandes o IsGroupOf = varios.
  - COCO varios_perros: 200 fotos con 2-4 perros, cada uno >= 4 % de la foto.
  - R3P0 (dataset de razas): 300 fotos (15 por raza, semilla 7). Revisadas a mano las que el
    detector marcaba con 2+: VARIOS_R3P0 tiene las que de verdad traen varios perros.
  - Fotos reales subidas a la app (back/uploads/pets y reports). Revisadas a mano: VARIOS_APP.

Uso:
  python experiments/banco_varios_perros.py            # detecta (con cache) y evalua
  python experiments/banco_varios_perros.py --rehacer  # vuelve a correr el detector
Escribe experiments/resultados_varios_perros.json
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import itertools
import json
import pickle
import random
import sys
from pathlib import Path

import torch
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.config import get_settings  # noqa: E402
from app.counter import DogCounter, count_dogs  # noqa: E402
from app.analyzer import DogAnalyzer  # noqa: E402
from app.model import resolve_device  # noqa: E402

DS = ROOT.parent / "imagesDS"
OI_IMG = DS / "_v2cache" / "openimages"
OI_CSV = DS / "_downloads" / "openimages"
COCO = DS / "_downloads" / "coco_pruebas"
R3P0 = DS / "R3P0"
APP = [ROOT.parent / "back" / "uploads" / "pets", ROOT.parent / "back" / "uploads" / "reports"]
CACHE = DS / "_v2cache" / "banco_varios_perros.pkl"
# DogCounter.candidates(multi_view=...). "cuatro_vistas" (sin descartar perros partidos en la linea de
# corte) se midio el 2026-11-10: 12.4 % de fotos de un perro rechazadas por error; se reemplazo por esta.
VARIANTES = {"una_vista": False, "cuatro_vistas_corte": True}
OUT = ROOT / "experiments" / "resultados_varios_perros.json"
DOG = "/m/0bt9lr"
MIN_SECOND = 0.03   # Open Images: el segundo perro debe ocupar >= 3 % de la foto para contar como "varios"

# Revisadas a mano (2026-11-10): fotos del muestreo de R3P0 y de la app con 2+ perros reales.
VARIOS_R3P0 = {
    "sd_n02108915-French_bulldog_n02108915_7115.jpg", "sd_n02085620-Chihuahua_n02085620_1152.jpg",
    "sd_n02107142-Doberman_n02107142_7311.jpg", "sd_n02107142-Doberman_n02107142_16424.jpg",
    "sd_n02099601-golden_retriever_n02099601_6980.jpg", "sd_n02099712-Labrador_retriever_n02099712_8242.jpg",
    "sd_n02099712-Labrador_retriever_n02099712_6248.jpg",
    "sd_n02093428-American_Staffordshire_terrier_n02093428_5926.jpg",
    "sd_n02093428-American_Staffordshire_terrier_n02093428_592.jpg", "sd_n02112018-Pomeranian_n02112018_150.jpg",
    "sd_n02113799-standard_poodle_n02113799_1344.jpg", "sd_n02113624-toy_poodle_n02113624_7102.jpg",
    "sd_n02113712-miniature_poodle_n02113712_936.jpg", "sd_n02110958-pug_n02110958_13721.jpg",
    "sd_n02106550-Rottweiler_n02106550_2725.jpg", "sd_n02097209-standard_schnauzer_n02097209_3151.jpg",
    "sd_n02094433-Yorkshire_terrier_n02094433_7827.jpg",
}
VARIOS_APP = {"f6a507e2-a379-4f3b-bdb4-90d6fe9b4810.jpg"}
# Open Images anotadas con un solo perro que al revisarlas traen varios (anotacion incompleta).
VARIOS_OI_REVISADAS = {"2dd254c1c98af716", "c37c2b1f4c1ba592", "79024fed40784cf1"}


def split_of(name: str) -> str:
    return "dev" if int(hashlib.md5(name.encode()).hexdigest(), 16) % 2 == 0 else "test"


def open_images():
    boxes = {}
    for split in ("train", "val", "test"):
        path = OI_CSV / f"bbox_{split}.csv"
        if not path.exists():
            continue
        with path.open(encoding="utf-8") as fh:
            for r in csv.reader(fh):
                if len(r) < 11 or r[2] != DOG:
                    continue
                xmin, xmax, ymin, ymax = (float(v) for v in r[4:8])
                boxes.setdefault(r[0], []).append(((xmax - xmin) * (ymax - ymin), r[10] == "1"))
    items = []
    for p in sorted(OI_IMG.glob("*.jpg")):
        b = boxes.get(p.stem)
        if not b:
            continue
        areas = sorted((a for a, _ in b), reverse=True)
        group = any(g for _, g in b)
        if p.stem in VARIOS_OI_REVISADAS:
            label = "varios"
        elif len(b) == 1 and not group:
            label = "uno"
        elif group or (len(areas) > 1 and areas[1] >= MIN_SECOND):
            label = "varios"
        else:
            label = None           # segundo perro diminuto: no cuenta para ninguna metrica
        if label:
            items.append(("openimages", p, label))
    return items


def datasets():
    items = open_images()
    items += [("coco_varios", p, "varios") for p in sorted((COCO / "varios_perros").glob("*.jpg"))]
    random.seed(7)
    r3p0 = [p for b in sorted(x for x in R3P0.iterdir() if x.is_dir())
            for p in random.sample(sorted(b.glob("*.jpg")), 15)]
    items += [("r3p0", p, "varios" if p.name in VARIOS_R3P0 else "uno") for p in r3p0]
    for folder in APP:
        items += [("app", p, "varios" if p.name in VARIOS_APP else "uno") for p in sorted(folder.glob("*.jpg"))]
    return items


def detect_all(counter: DogCounter, items, rehacer: bool, multi_view: bool, tag: str):
    """{ruta: candidatos}. La cache guarda las dos variantes (clave 'ruta|una_vista' o '|cuatro_vistas')."""
    store = {}
    if CACHE.exists() and not rehacer:
        store = pickle.loads(CACHE.read_bytes())
        store = {(k if "|" in k else k + "|una_vista"): v for k, v in store.items()}
    cache = {k.rsplit("|", 1)[0]: v for k, v in store.items() if k.endswith("|" + tag)}
    for k, (_, path, _) in enumerate(items, 1):
        key = str(path)
        if key in cache:
            continue
        try:
            img = Image.open(path).convert("RGB")
        except Exception:  # noqa: BLE001
            continue
        cache[key] = store[key + "|" + tag] = counter.candidates(img, multi_view=multi_view)
        if k % 200 == 0:
            print(f"  {k}/{len(items)}", flush=True)
            CACHE.write_bytes(pickle.dumps(store))
    CACHE.write_bytes(pickle.dumps(store))
    return cache


def evaluate(items, cache, params, split=None):
    stats = {}
    for source, path, label in items:
        if split and split_of(path.name) != split:
            continue
        cands = cache.get(str(path))
        if cands is None:
            continue
        n = count_dogs(cands, **params)
        s = stats.setdefault(source, {"uno": [0, 0], "varios": [0, 0]})
        s[label][0] += n >= 2
        s[label][1] += 1
    tot = {"uno": [0, 0], "varios": [0, 0]}
    for s in stats.values():
        for lab in tot:
            tot[lab][0] += s[lab][0]
            tot[lab][1] += s[lab][1]
    return stats, tot


def rate(pair):
    return pair[0] / pair[1] if pair[1] else 0.0


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser()
    ap.add_argument("--rehacer", action="store_true")
    args = ap.parse_args()

    s = get_settings()
    device = resolve_device(s.device)
    dognet = DogAnalyzer(ROOT / s.dognet_weights_path, device, ROOT / s.dognet_thresholds_path,
                         with_color=False, with_age=False)
    counter = DogCounter(dognet, device)
    items = datasets()
    print(f"Fotos: {len(items)} -> " + ", ".join(
        f"{src}: {sum(1 for i in items if i[0] == src and i[2] == 'uno')} de un perro / "
        f"{sum(1 for i in items if i[0] == src and i[2] == 'varios')} de varios"
        for src in ("openimages", "coco_varios", "r3p0", "app")))
    resultados = {}
    for nombre, multi in VARIANTES.items():
        print(f"\n===== Variante: {nombre} =====")
        cache = detect_all(counter, items, args.rehacer, multi, nombre)
        resultados[nombre] = elegir_y_medir(items, cache)
    OUT.write_text(json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nGuardado en {OUT}")


def elegir_y_medir(items, cache):
    grid = {
        "min_score": [0.3, 0.4, 0.5, 0.6],
        "merge_inside": [0.6, 0.7, 0.8, 1.01],
        "min_rel_area": [0.0, 0.1, 0.2],
        "min_area": [0.0, 0.01, 0.02],
        "min_dog_prob": [0.0, 0.5],
    }
    rows = []
    for combo in itertools.product(*grid.values()):
        params = dict(zip(grid.keys(), combo))
        _, tot = evaluate(items, cache, params, "dev")
        rows.append((rate(tot["uno"]), rate(tot["varios"]), params))
    # "Que falle lo menos posible": maximo de fotos con varios perros detectadas con a lo mas
    # 1 % de fotos de un perro rechazadas por error (en dev).
    ok = [r for r in rows if r[0] <= 0.01]
    best = max(ok, key=lambda r: (r[1], -r[0])) if ok else min(rows, key=lambda r: r[0])
    print(f"\nMejor en dev (<= 1 % de falsos rechazos): {best[2]}")
    print(f"  dev: un perro rechazado {best[0]:.2%} | varios detectados {best[1]:.2%}")
    frente = []
    for fpr_max in (0.005, 0.01, 0.02, 0.03, 0.05):
        cand = [r for r in rows if r[0] <= fpr_max]
        if cand:
            b = max(cand, key=lambda r: (r[1], -r[0]))
            frente.append({"max_falso_rechazo_dev": fpr_max, "falso_rechazo_dev": b[0],
                           "deteccion_dev": b[1], "params": b[2]})

    stats, tot = evaluate(items, cache, best[2], "test")
    print("\nTest (la otra mitad, nunca usada para elegir):")
    for src, st in stats.items():
        print(f"  {src:<12} un perro rechazado {st['uno'][0]}/{st['uno'][1]} ({rate(st['uno']):.1%}) | "
              f"varios detectados {st['varios'][0]}/{st['varios'][1]} ({rate(st['varios']):.1%})")
    print(f"  TOTAL        un perro rechazado {tot['uno'][0]}/{tot['uno'][1]} ({rate(tot['uno']):.2%}) | "
          f"varios detectados {tot['varios'][0]}/{tot['varios'][1]} ({rate(tot['varios']):.1%})")
    base = {"min_score": 0.3, "merge_inside": 1.01, "min_rel_area": 0.0, "min_area": 0.0, "min_dog_prob": 0.0}
    bstats, btot = evaluate(items, cache, base, "test")
    print(f"  Sin filtros (solo detector, umbral 0.3): un perro rechazado {rate(btot['uno']):.2%} | "
          f"varios detectados {rate(btot['varios']):.1%}")
    return {
        "elegidos": best[2], "dev": {"falso_rechazo": best[0], "deteccion": best[1]},
        "test": {"por_fuente": stats, "total": tot,
                 "falso_rechazo": rate(tot["uno"]), "deteccion": rate(tot["varios"])},
        "test_sin_filtros": {"por_fuente": bstats, "total": btot,
                             "falso_rechazo": rate(btot["uno"]), "deteccion": rate(btot["varios"])},
        "frente_dev": frente, "grid": grid,
    }


if __name__ == "__main__":
    main()
