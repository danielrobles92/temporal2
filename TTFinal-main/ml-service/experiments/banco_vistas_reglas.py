"""Explora reglas para juntar las vistas, sobre lo que ya calculo banco_vistas.py (cache).

Una seccion (vista fuera del centro) cuenta como perro si:
  - DogNet: P(no es perro) < t_sec (con el rescate y el peluche de ImageNet, como el centro),
  - ImageNet: P(perro domestico) >= g_min en esa seccion (segunda opinion independiente),
  - y, con centro_animal=True, el centro NO ve otro animal, gato o peluche (P de esos tipos
    < 0.5): si el centro ya ve un gato, una seccion que "ve perro" suele ver parte del mismo gato.
Datos de la vista elegida: el centro si ve al perro y ninguna seccion lo ve con mas de `margen`
de P(perro) por encima; si no, la seccion con mayor P(perro).

Uso: python experiments/banco_vistas_reglas.py
"""
from __future__ import annotations

import itertools
import json
import pickle
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "experiments"))
import banco_vistas as B  # noqa: E402
import v2_meta as M  # noqa: E402

OUT = ROOT / "experiments" / "resultados_vistas_reglas.json"
GATO, PELUCHE, ANIMAL = (M.IDX_NOT_DOG + M.NOT_DOG.index(k) for k in ("gato", "peluche", "animal"))


def overlap(det_box, sec_box) -> float:
    """Fraccion de la caja del detector (0-1) dentro de la seccion (0-1)."""
    return B.inside(det_box, sec_box)


def decide(views, t_sec, g_min, centro_animal, margen, det=None, s_min=None, sec_boxes=None):
    """det: cajas de perro del detector SSDLite [{"box", "score"}] en 0-1; con s_min, una seccion
    solo vale si el centro no ve perro y el detector encuentra un perro (>= s_min) dentro de ella."""
    t_nd = B.THRESHOLDS["not_dog"]
    pdog = [1.0 - float(v["p"][M.IDX_NOT_DOG:].sum()) for v in views]
    c = views[0]
    center_dog = B.view_dog(c, t_nd)
    blocked = centro_animal and not center_dog and float(c["p"][[GATO, PELUCHE, ANIMAL]].sum()) >= 0.5
    secs = [] if blocked else [i for i, v in enumerate(views) if i > 0 and B.view_dog(v, t_sec)
                               and float(v["g"][2]) >= g_min]
    if s_min is not None and not center_dog:
        secs = [i for i in secs if any(d["score"] >= s_min and overlap(d["box"], sec_boxes[i]) >= 0.5
                                       for d in det)]
    if not center_dog and not secs:
        return False, M.IDX_NOT_DOG, -1
    best = max(secs, key=lambda i: pdog[i]) if secs else None
    i = 0 if center_dog and (best is None or pdog[best] - pdog[0] <= margen) else best
    return True, B.breed_of(views[i]["p"]), int(views[i]["size"].argmax())


def score(items, res, cfg, dets=None):
    dog_n = dog_ok = nd_n = nd_ok = br_n = br_ok = 0
    for k, (it, v) in enumerate(zip(items, res)):
        if v is None:
            continue
        if dets is not None and len(cfg) > 4 and cfg[4] is not None:
            det, boxes = dets[k]
            is_dog, cls, _ = decide(v, *cfg[:4], det=det, s_min=cfg[4], sec_boxes=boxes)
        else:
            is_dog, cls, _ = decide(v, *cfg[:4])
        lab = it["label"]
        if lab >= M.IDX_NOT_DOG:
            nd_n += 1
            nd_ok += not is_dog
        else:
            dog_n += 1
            dog_ok += is_dog
            if 0 <= lab < M.IDX_OTRO:
                br_n += 1
                br_ok += cls == lab
    f = lambda a, b: round(100 * a / b, 2) if b else None  # noqa: E731
    return {"perro": f(dog_ok, dog_n), "no_perro": f(nd_ok, nd_n), "raza": f(br_ok, br_n)}


def detections(groups):
    """Por foto: (cajas de perro del detector SSDLite en 0-1, cajas de las vistas en 0-1). Cache."""
    import torch
    from PIL import Image
    sys.path.insert(0, str(ROOT))
    from app.counter import DogCounter
    from app.views import central_box, section_boxes
    cache = B.V2 / "banco_vistas_detector.pkl"
    out = pickle.loads(cache.read_bytes()) if cache.exists() else {}
    counter = None
    for g, items in groups.items():
        if g in out and len(out[g]) == len(items):
            continue
        if counter is None:
            counter = DogCounter(None, torch.device("cuda" if torch.cuda.is_available() else "cpu"))
        print(f"  detector: {g} ({len(items)})", flush=True)
        rows = []
        for it in items:
            try:
                img = B.open_item(it["src"])
            except Exception:  # noqa: BLE001
                rows.append(([], []))
                continue
            w, h = img.size
            det = [{"box": c["box"], "score": c["score"]} for c in counter.candidates(img, verify=False)]
            boxes = [central_box(w, h)] + section_boxes(w, h)
            rows.append((det, [(b[0] / w, b[1] / h, b[2] / w, b[3] / h) for b in boxes]))
        out[g] = rows
        cache.write_bytes(pickle.dumps(out))
    return out


def main():
    groups = B.build_items()
    res = {}
    for g, items in groups.items():
        mname = {"val": "dognet_v2_val", "compuestas_perro": "dognet_v2_val",
                 "compuestas_no_perro": "dognet_v2_val"}.get(g, "dognet_v2")
        res[g] = pickle.loads((B.V2 / f"banco_vistas_{g}_{mname}.pkl").read_bytes())
    groups.pop("app")
    oa = [k for k, it in enumerate(groups["coco_no_perro"]) if it["sub"].startswith("otros_animales")]
    groups["coco_otros_animales"] = [groups["coco_no_perro"][k] for k in oa]
    res["coco_otros_animales"] = [res["coco_no_perro"][k] for k in oa]
    dets0 = detections({g: v for g, v in groups.items() if g != "coco_otros_animales"})
    dets0["coco_otros_animales"] = [dets0["coco_no_perro"][k] for k in oa]

    dets = dets0
    rows = []
    grid = list(itertools.product((0.5, 0.3, 0.2, 0.1), (0.0, 0.1, 0.3, 0.5), (False, True), (0.0, 0.1, 0.3, 1.0)))
    grid = [g + (None,) for g in grid]
    grid += [(t, gm, False, 0.1, sm) for t, gm in ((0.5, 0.0), (0.5, 0.1), (0.3, 0.0), (0.3, 0.1), (0.2, 0.1))
             for sm in (0.2, 0.3, 0.4, 0.5)]
    for cfg in [(-1.0, 2.0, False, 1.0, None)] + grid:   # el primero = solo centro (secciones nunca)
        m = {g: score(items, res[g], cfg, dets[g]) for g, items in groups.items()}
        rows.append({"cfg": dict(zip(("t_sec", "g_min", "centro_animal", "margen", "detector_min"), cfg)), **m})
    OUT.write_text(json.dumps(rows, indent=1), encoding="utf-8")

    orilla = ("compuestas_perro", "oi_orilla_recorte", "coco_orilla_natural", "coco_orilla_recorte")
    perros = ("val", "oi_todas", "coco_un_perro")
    noperro = ("val", "compuestas_no_perro", "coco_no_perro", "coco_otros_animales")
    print("cfg | orilla: " + " ".join(orilla) + " | perros acept.: " + " ".join(perros)
          + " | no-perro detect.: " + " ".join(noperro) + " | raza val, compuestas")
    for r in rows:
        print(f"{json.dumps(r['cfg']):70s} | " + " ".join(f"{r[g]['perro']}" for g in orilla)
              + " | " + " ".join(f"{r[g]['perro']}" for g in perros)
              + " | " + " ".join(f"{r[g]['no_perro']}" for g in noperro)
              + f" | {r['val']['raza']} {r['compuestas_perro']['raza']}")


if __name__ == "__main__":
    main()
