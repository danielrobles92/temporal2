"""Banco de pruebas: revisar la foto completa (centro + secciones) en vez de solo el centro.

El preprocesamiento de ImageNet (lado corto a 256 + recorte central de 224) tira las orillas:
un perro pegado a la orilla de una foto ancha no aparece y la foto se rechazaba como "no es
perro". app/views.py agrega secciones que cubren todos los pixeles. Aqui se mide, con las
mismas reglas de app/analyzer.py, que se gana y que se pierde con cada forma de juntar las vistas:

  centro           solo el recorte central (como antes)
  A_centro_primero si el centro ve un perro se usa el centro; si no, la seccion mas segura
  B_mejor_vista    la vista (centro o seccion) con mayor P(perro)
  C_promedio       promedio de las vistas que ven perro, pesado por P(perro)
Cada una con un umbral de "no es perro" para las secciones (t_sec): igual al del centro o mas
estricto (pedir mas seguridad a las secciones evita aceptar gatos o peluches por una seccion).

Grupos:
  val                 split de validacion de DogNet v2 (modelo dognet_v2_val: no lo vio)
  compuestas_perro    perro de validacion (20 razas) pegado a la orilla de una foto 16:9 con fondo
                      de COCO sin animales (modelo dognet_v2_val)
  compuestas_no_perro lo mismo con un gato, peluche u otro animal de validacion
  oi_orilla_natural   Open Images: un perro con menos de la mitad dentro del centro
  oi_orilla_recorte   Open Images recortadas a 16:9 con el perro pegado a la orilla (la misma foto
                      recortada distinto); menos del 30 % del perro queda en el centro
  oi_todas            Open Images: 1756 fotos de un perro (rechazos por error en fotos reales)
  coco_orilla_natural COCO: 187 fotos de un perro con menos de la mitad dentro del centro
  coco_orilla_recorte COCO recortadas a 16:9 con el perro pegado a la orilla
  coco_un_perro       COCO: 400 fotos de un perro al azar (rechazos por error en escenas reales)
  coco_no_perro       COCO val2017: otros animales, escenas sin animales y objetos (peluches, sillas)
  app                 fotos subidas a la app (back/uploads): cuantas cambian de veredicto
Los grupos que no son de validacion usan el modelo desplegado (dognet_v2), que no vio Open
Images, COCO val2017 ni las fotos de la app.

Uso:  python experiments/banco_vistas.py [--rehacer]
Escribe experiments/resultados_vistas.json
"""
from __future__ import annotations

import argparse
import csv
import json
import pickle
import random
import sys
from collections import Counter
from pathlib import Path

import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision.models import EfficientNet_B0_Weights, efficientnet_b0

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "experiments"))

import v2_meta as M  # noqa: E402
from train_v2 import load_rows  # noqa: E402
from app.dognet import DogNetV2  # noqa: E402
from app.views import central_box, make_views  # noqa: E402

DS = ROOT.parent / "imagesDS"
V2 = DS / "_v2cache"
OI_IMG = V2 / "openimages"
OI_CSV = DS / "_downloads" / "openimages"
COCO = DS / "_downloads" / "coco_pruebas"
COCO_V = DS / "_downloads" / "coco_vistas"
APP = [ROOT.parent / "back" / "uploads" / "pets", ROOT.parent / "back" / "uploads" / "reports"]
OUT = ROOT / "experiments" / "resultados_vistas.json"
THRESHOLDS = json.loads((ROOT / "models" / "dognet_v2_thresholds.json").read_text(encoding="utf-8"))
TEDDY, WILD0, WILD1, DOG0, DOG1 = 850, 269, 281, 151, 269
N_COMPUESTAS = 400
random.seed(7)


# --------------------------------------------------------------------------------- datos
def inside(b, z) -> float:
    ix = max(0.0, min(b[2], z[2]) - max(b[0], z[0]))
    iy = max(0.0, min(b[3], z[3]) - max(b[1], z[1]))
    return ix * iy / max(1e-9, (b[2] - b[0]) * (b[3] - b[1]))


def oi_boxes():
    cached = {p.stem: p for p in OI_IMG.glob("*.jpg")}
    boxes = {}
    for split in ("train", "val", "test"):
        with open(OI_CSV / f"bbox_{split}.csv", encoding="utf-8") as fh:
            for r in csv.reader(fh):
                if r[0] in cached and r[2] == "/m/0bt9lr":
                    boxes.setdefault(r[0], []).append((float(r[4]), float(r[6]), float(r[5]), float(r[7])))
    return {k: (cached[k], v[0]) for k, v in boxes.items() if len(v) == 1}


def edge_crop(w, h, b, left: bool):
    """Ventana 16:9 con el perro pegado a la orilla (None si no cabe)."""
    x1, y1, x2, y2 = b
    bh = y2 - y1
    for ch in (h, 0.85 * h, 0.7 * h, max(bh * 1.1, 0.5 * h)):
        if ch < bh or ch > h:
            continue
        cw = 16 / 9 * ch
        cx = max(0.0, x1 - 0.02 * cw) if left else min(float(w), x2 + 0.02 * cw) - cw
        if cx < 0 or cx + cw > w:
            continue
        cy = min(max(0.0, (y1 + y2) / 2 - ch / 2), h - ch)
        crop = (cx, cy, cx + cw, cy + ch)
        local = (x1 - cx, y1 - cy, x2 - cx, y2 - cy)
        if inside(local, central_box(cw, ch)) < 0.3:
            return crop
    return None


def build_items():
    """{grupo: [ {"src": ..., "label": ...} ]}. label: clase de v2 (0-19 raza, 20 Otro,
    21+ no perro) o -2 = perro sin raza conocida, -3 = sin etiqueta (app)."""
    groups = {}
    val = load_rows("val")
    groups["val"] = [{"src": ("file", str(V2 / r["path"])), "label": r["cls"], "size": r["size"]}
                     for r in val if r["cls"] >= 0]

    bgs = sorted((COCO / "sin_animales").rglob("*.jpg"))
    dogs = [r for r in val if 0 <= r["cls"] < M.IDX_OTRO and r["source"] in ("r3p0", "stanford")]
    nds = [r for r in val if r["cls"] >= M.IDX_NOT_DOG and M.NOT_DOG[r["cls"] - M.IDX_NOT_DOG] != "objeto"]
    for name, pool in (("compuestas_perro", dogs), ("compuestas_no_perro", nds)):
        pick = random.sample(pool, min(N_COMPUESTAS, len(pool)))
        groups[name] = [{"src": ("compuesta", str(V2 / r["path"]), str(random.choice(bgs)), i % 2 == 0),
                         "label": r["cls"], "size": r["size"]} for i, r in enumerate(pick)]

    oi = oi_boxes()
    natural, recorte, todas = [], [], []
    for k, (path, nb) in sorted(oi.items()):
        w, h = Image.open(path).size
        b = (nb[0] * w, nb[1] * h, nb[2] * w, nb[3] * h)
        todas.append({"src": ("file", str(path)), "label": -2})
        if inside(b, central_box(w, h)) < 0.5:
            natural.append({"src": ("file", str(path)), "label": -2})
        crop = edge_crop(w, h, b, left=len(recorte) % 2 == 0) or edge_crop(w, h, b, left=len(recorte) % 2 == 1)
        if crop:
            recorte.append({"src": ("recorte", str(path), crop), "label": -2})
    groups["oi_orilla_natural"], groups["oi_orilla_recorte"], groups["oi_todas"] = natural, recorte, todas

    # COCO (prepare_vistas_coco.py): fotos reales de un perro, ninguna usada para entrenar.
    cv = json.loads((COCO_V / "coco_vistas.json").read_text(encoding="utf-8"))
    groups["coco_orilla_natural"] = [{"src": ("file", str(COCO_V / k)), "label": -2}
                                     for k in sorted(cv) if k.startswith("orilla/")]
    groups["coco_un_perro"] = [{"src": ("file", str(COCO_V / k)), "label": -2}
                               for k in sorted(cv) if k.startswith("un_perro/")]
    rec = []
    for k in sorted(cv):
        w, h = Image.open(COCO_V / k).size
        b = cv[k]["box"]
        crop = edge_crop(w, h, b, left=len(rec) % 2 == 0) or edge_crop(w, h, b, left=len(rec) % 2 == 1)
        if crop:
            rec.append({"src": ("recorte", str(COCO_V / k), crop), "label": -2})
    groups["coco_orilla_recorte"] = rec

    nd_idx = {"otros_animales": M.IDX_NOT_DOG + 2, "sin_animales": M.IDX_NOT_DOG + 3, "objetos": M.IDX_NOT_DOG + 3}
    groups["coco_no_perro"] = [{"src": ("file", str(p)), "label": nd_idx[p.relative_to(COCO).parts[0]],
                                "sub": "/".join(p.relative_to(COCO).parts[:-1])}
                               for sub in nd_idx for p in sorted((COCO / sub).rglob("*.jpg"))]
    groups["app"] = [{"src": ("file", str(p)), "label": -3, "name": p.name}
                     for d in APP for p in sorted(d.glob("*"))
                     if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
    return groups


def open_item(src) -> Image.Image:
    kind = src[0]
    if kind == "file":
        return Image.open(src[1]).convert("RGB")
    if kind == "recorte":
        img = Image.open(src[1]).convert("RGB")
        return img.crop(tuple(round(v) for v in src[2]))
    _, fg_path, bg_path, left = src                 # compuesta 16:9: sujeto en el 32 % de una orilla
    W, H = 640, 360
    bg = Image.open(bg_path).convert("RGB")
    s = max(W / bg.width, H / bg.height)
    bg = bg.resize((round(bg.width * s), round(bg.height * s)), Image.BICUBIC)
    bg = bg.crop(((bg.width - W) // 2, (bg.height - H) // 2, (bg.width - W) // 2 + W, (bg.height - H) // 2 + H))
    fg = Image.open(fg_path).convert("RGB")
    s = min(0.32 * W / fg.width, H / fg.height)
    fg = fg.resize((max(1, round(fg.width * s)), max(1, round(fg.height * s))), Image.BICUBIC)
    bg.paste(fg, (0 if left else W - fg.width, (H - fg.height) // 2))
    return bg


class Items(Dataset):
    def __init__(self, items):
        self.items = items

    def __len__(self):
        return len(self.items)

    def __getitem__(self, i):
        try:
            views = make_views(open_item(self.items[i]["src"]))
        except Exception:  # noqa: BLE001 - archivo ilegible
            return i, None, None
        return i, torch.stack([v.tensor for v in views]), [v.kind for v in views]


# ------------------------------------------------------------------------------ inferencia
def as_list(batch):
    return batch


@torch.inference_mode()
def run(model, imnet, items, device):
    """Por foto: lista de vistas {kind, p[25], size[3], g=(teddy, wild, dog)} (None si no abrio)."""
    out = [None] * len(items)
    loader = DataLoader(Items(items), batch_size=16, num_workers=6, collate_fn=as_list)
    for k, batch in enumerate(loader):
        ok = [b for b in batch if b[1] is not None]
        if not ok:
            continue
        x = torch.cat([b[1] for b in ok]).to(device)
        n = len(x)
        lg, slg, _ = model.heads(model.embed(torch.cat([x, torch.flip(x, dims=[3])])))
        p = torch.softmax(lg.float(), 1)
        p = ((p[:n] + p[n:]) / 2).cpu()
        sp = torch.softmax(slg.float(), 1)
        sp = ((sp[:n] + sp[n:]) / 2).cpu()
        ip = torch.softmax(imnet(x).float(), 1).cpu()
        g = torch.stack([ip[:, TEDDY], ip[:, WILD0:WILD1].sum(1), ip[:, DOG0:DOG1].sum(1)], 1)
        j = 0
        for i, t, kinds in ok:
            out[i] = [{"kind": kinds[v], "p": p[j + v], "size": sp[j + v], "g": g[j + v]} for v in range(len(t))]
            j += len(t)
        if k % 50 == 0:
            print(f"    {k * 16}/{len(items)}", flush=True)
    return out


# ------------------------------------------------------------------------------- reglas
def view_dog(v, t_nd) -> bool:
    """Misma regla que DogAnalyzer._is_dog."""
    t = THRESHOLDS
    p_nd = float(v["p"][M.IDX_NOT_DOG:].sum())
    teddy, wild, dog = (float(x) for x in v["g"])
    is_dog = p_nd < t_nd
    if (not is_dog and dog >= t["rescue_imagenet"] and teddy < min(t["teddy_imagenet"], 0.5)
            and p_nd < t["rescue_max_not_dog"]):
        is_dog = True
    if is_dog and teddy >= t["teddy_imagenet"]:
        is_dog = False
    if is_dog and wild >= t["wild_imagenet"]:
        is_dog = False
    return is_dog


def breed_of(p) -> int:
    dog_p = p[: M.IDX_OTRO + 1] / p[: M.IDX_OTRO + 1].sum()
    best = int(dog_p.argmax())
    return best if best != M.IDX_OTRO and float(dog_p[best]) >= THRESHOLDS["breed_min"] else M.IDX_OTRO


def decide(views, policy: str, t_sec: float):
    """(es_perro, clase final, tamano, indice de la vista elegida o -1 si promedio)."""
    t_nd = THRESHOLDS["not_dog"]
    pdog = [1.0 - float(v["p"][M.IDX_NOT_DOG:].sum()) for v in views]
    if policy == "centro":
        dog_views = [0] if view_dog(views[0], t_nd) else []
    else:
        dog_views = [i for i, v in enumerate(views)
                     if view_dog(v, t_nd if v["kind"] == "centro" else t_sec)]
    if not dog_views:
        return False, M.IDX_NOT_DOG, -1, 0
    if policy in ("centro",) or (policy == "A_centro_primero" and 0 in dog_views):
        i = 0
    elif policy == "C_promedio":
        w = torch.tensor([pdog[i] for i in dog_views])
        p = sum(views[i]["p"] * wi for i, wi in zip(dog_views, w)) / w.sum()
        s = sum(views[i]["size"] * wi for i, wi in zip(dog_views, w)) / w.sum()
        return True, breed_of(p), int(s.argmax()), -1
    else:
        i = max(dog_views, key=lambda k: (pdog[k], k == 0))
    return True, breed_of(views[i]["p"]), int(views[i]["size"].argmax()), i


POLICIES = [("centro", None)] + [(pol, ts) for pol in ("A_centro_primero", "B_mejor_vista", "C_promedio")
                                 for ts in (0.5, 0.4, 0.3, 0.2)]


def metrics(group, items, res, policy, t_sec):
    n = dog = breed_ok = breed_n = otro_ok = otro_n = size_ok = size_n = 0
    nd_ok = nd_n = rej = dog_n = 0
    for it, views in zip(items, res):
        if views is None:
            continue
        n += 1
        is_dog, cls, size, _ = decide(views, policy, t_sec)
        lab = it["label"]
        if lab >= M.IDX_NOT_DOG:
            nd_n += 1
            nd_ok += not is_dog
        elif lab >= -2:
            dog_n += 1
            rej += not is_dog
            if 0 <= lab < M.IDX_OTRO:
                breed_n += 1
                breed_ok += cls == lab
            elif lab == M.IDX_OTRO:
                otro_n += 1
                otro_ok += cls == M.IDX_OTRO
            if it.get("size", -1) >= 0:
                size_n += 1
                size_ok += size == it["size"]
        dog += is_dog
    pct = lambda a, b: round(100 * a / b, 2) if b else None  # noqa: E731
    return {"n": n, "perro_aceptado_%": pct(dog_n - rej, dog_n), "perro_rechazado_%": pct(rej, dog_n),
            "no_perro_detectado_%": pct(nd_ok, nd_n), "raza_correcta_%": pct(breed_ok, breed_n),
            "otro_detectado_%": pct(otro_ok, otro_n), "tamano_correcto_%": pct(size_ok, size_n),
            "fotos_perro_%": pct(dog, n)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rehacer", action="store_true")
    args = ap.parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    imnet = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1).eval().to(device)
    models = {}
    for name in ("dognet_v2_val", "dognet_v2"):
        ck = torch.load(ROOT / "models" / f"{name}.pt", map_location="cpu", weights_only=True)
        m = DogNetV2(M.N_CLASSES, pretrained=False)
        m.load_state_dict(ck["state_dict"])
        models[name] = m.eval().to(device)

    groups = build_items()
    print({g: len(v) for g, v in groups.items()})
    model_of = {"val": "dognet_v2_val", "compuestas_perro": "dognet_v2_val", "compuestas_no_perro": "dognet_v2_val"}
    results, cache_all = {}, {}
    for g, items in groups.items():
        mname = model_of.get(g, "dognet_v2")
        cache = V2 / f"banco_vistas_{g}_{mname}.pkl"
        if cache.exists() and not args.rehacer:
            res = pickle.loads(cache.read_bytes())
        else:
            print(f"[{g}] {len(items)} fotos con {mname}")
            res = run(models[mname], imnet, items, device)
            cache.write_bytes(pickle.dumps(res))
        cache_all[g] = res
        nviews = Counter(len(v) for v in res if v)
        results[g] = {"modelo": mname, "vistas_por_foto": dict(sorted(nviews.items())),
                      "politicas": {f"{p}" + (f"@{ts}" if ts else ""): metrics(g, items, res, p, ts)
                                    for p, ts in POLICIES}}
        if g == "coco_no_perro":
            for sub in sorted({it["sub"].split("/")[0] for it in items}):
                idx = [k for k, it in enumerate(items) if it["sub"].startswith(sub)]
                results[g][sub] = {f"{p}" + (f"@{ts}" if ts else ""):
                                   metrics(g, [items[k] for k in idx], [res[k] for k in idx], p, ts)["no_perro_detectado_%"]
                                   for p, ts in POLICIES}
        if g == "app":
            for p, ts in POLICIES[1:]:
                changed = [it["name"] for it, v in zip(items, res) if v
                           and decide(v, "centro", None)[0] != decide(v, p, ts)[0]]
                results[g]["politicas"][f"{p}@{ts}"]["cambian_de_veredicto"] = changed

    OUT.write_text(json.dumps(results, indent=1, ensure_ascii=False), encoding="utf-8")
    keys = ["perro_aceptado_%", "no_perro_detectado_%", "raza_correcta_%", "otro_detectado_%", "tamano_correcto_%"]
    for g, r in results.items():
        print(f"\n== {g} ({r['modelo']}, vistas por foto {r['vistas_por_foto']})")
        for pol, m in r["politicas"].items():
            print(f"  {pol:22s} " + "  ".join(f"{k.split('_')[0]}{'' if k.startswith('perro') else ''}={m[k]}"
                                               for k in keys if m[k] is not None))
        for sub in ("otros_animales", "sin_animales", "objetos"):
            if sub in r:
                print(f"   {sub}: " + " ".join(f"{k}={v}" for k, v in r[sub].items()))


if __name__ == "__main__":
    main()
