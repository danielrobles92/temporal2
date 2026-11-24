"""Descarga fotos de COCO con UN perro para banco_vistas.py (perro en la orilla de la foto).

Ninguna foto de COCO con perro se uso para entrenar DogNet v2 (solo gatos, peluches,
personas, escenas y otros animales; ver prepare_pruebas_coco.py).

  orilla   todas las fotos de un perro (>= 3 % de la foto) con menos de la mitad del perro
           dentro del recorte central que usaba la red (Resize 256 + CenterCrop 224)
  un_perro 400 fotos de un perro al azar (semilla 7): para recortarlas con el perro pegado a
           la orilla y para medir rechazos por error en fotos reales

Salida: imagesDS/_downloads/coco_vistas/<grupo>/<id>.jpg y coco_vistas.json (caja del perro).
Uso: python experiments/prepare_vistas_coco.py
"""
import json
import random
import sys
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from app.views import central_box  # noqa: E402

DS = ROOT.parent / "imagesDS" / "_downloads"
ANN = DS / "coco_ann" / "annotations"
OUT = DS / "coco_vistas"
URL = "http://images.cocodataset.org/{split}/{file}"
DOG = 18
N_RANDOM = 400
random.seed(7)


def inside(b, z) -> float:
    ix = max(0.0, min(b[2], z[2]) - max(b[0], z[0]))
    iy = max(0.0, min(b[3], z[3]) - max(b[1], z[1]))
    return ix * iy / max(1e-9, (b[2] - b[0]) * (b[3] - b[1]))


def main():
    meta, jobs = {}, []
    pool = []
    for split in ("val2017", "train2017"):
        d = json.loads((ANN / f"instances_{split}.json").read_text(encoding="utf-8"))
        imgs = {i["id"]: i for i in d["images"]}
        dogs, crowd = defaultdict(list), set()
        for a in d["annotations"]:
            if a["category_id"] == DOG:
                dogs[a["image_id"]].append(a["bbox"])
                if a.get("iscrowd"):
                    crowd.add(a["image_id"])
        for i, boxes in dogs.items():
            if len(boxes) != 1 or i in crowd:
                continue
            im = imgs[i]
            w, h = im["width"], im["height"]
            x, y, bw, bh = boxes[0]
            if bw * bh / (w * h) < 0.03:
                continue
            box = (x, y, x + bw, y + bh)
            pool.append((split, im["file_name"], box, inside(box, central_box(w, h)) < 0.5))
    edge = [p for p in pool if p[3]]
    rest = [p for p in pool if not p[3]]
    chosen = [("orilla", p) for p in edge] + [("un_perro", p) for p in random.sample(rest, N_RANDOM)]
    for group, (split, file, box, _) in chosen:
        dst = OUT / group / file
        meta[f"{group}/{file}"] = {"box": box, "split": split}
        if not dst.exists():
            jobs.append((URL.format(split=split, file=file), dst))
    print(f"{len(edge)} en la orilla, {N_RANDOM} al azar; por descargar {len(jobs)}")

    def get(job):
        url, dst = job
        dst.parent.mkdir(parents=True, exist_ok=True)
        try:
            urllib.request.urlretrieve(url, dst)
            return True
        except Exception as exc:  # noqa: BLE001
            print("  !", url, exc)
            return False

    with ThreadPoolExecutor(8) as ex:
        ok = sum(ex.map(get, jobs))
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "coco_vistas.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print(f"descargadas {ok}/{len(jobs)} -> {OUT}")


if __name__ == "__main__":
    main()
