"""Compara el porcentaje de coincidencia anterior (Foto 40 · Ubicación 35 · Raza 15 · Sexo 5 · Color 5)
con el reparto 80/20: «Lo que dice la foto» (parecido 40, raza 20, tamaño 8, etapa 4, colores 8) y
«Lo que capturaron» (ubicación 12, sexo 4, raza y color capturados 4), con sus topes.

Datos: fotos de MPDD (query x gallery) analizadas por el servicio en marcha (POST /analyze, el mismo
análisis que recibe el backend: vector, raza con certeza, tamaño, etapa y colores).
  mismo_perro      misma identidad, otra foto
  misma_raza       perros distintos con la misma raza detectada (certeza >= 0.4 en ambos)
  otro_perro       perros distintos (cualquier raza)

La distancia y el sexo no vienen en MPDD: se simulan escenarios (mismo perro cerca; perros distintos
a varias distancias) para contar cuántas veces se avisaría (porcentaje > 40).
Uso: python experiments/banco_puntaje_80_20.py [--url local | http://localhost:8000]
"""
import argparse
import json
import random
import sys
from pathlib import Path

import numpy as np
try:
    import requests
except ImportError:  # solo hace falta con --url http://...
    requests = None

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT.parent / "imagesDS" / "MPDD" / "MPDD" / "pytorch"
CACHE = ROOT.parent / "imagesDS" / "_v2cache" / "banco_80_20_mpdd.json"
OUT = Path(__file__).with_name("resultados_puntaje_80_20.json")
random.seed(11)

SIMILAR = [{"blanco", "crema"}, {"crema", "dorado"}, {"dorado", "cafe"}]
STRIP = str.maketrans("áéíóúÁÉÍÓÚ", "aeiouAEIOU")
norm = lambda s: (s or "").translate(STRIP).strip().lower()  # noqa: E731


def _local_describe():
    """Mismo análisis que POST /analyze, pero cargado en este proceso (app.main.describe_raw)."""
    import asyncio
    sys.path.insert(0, str(ROOT))
    from app import main as svc  # noqa: E402
    cm = svc.lifespan(svc.app)
    asyncio.run(cm.__aenter__())

    def run(raw):
        vectors, descs = svc.describe_raw(raw)
        for v, d in zip(vectors, descs):
            d["embedding"] = list(map(float, v))
        return descs
    return run


def analyze_all(url, paths):
    if CACHE.exists():
        return json.loads(CACHE.read_text(encoding="utf-8"))
    out = {}
    local = _local_describe() if url == "local" else None
    for i in range(0, len(paths), 8):
        chunk = paths[i:i + 8]
        if local is not None:
            items = local([p.read_bytes() for p in chunk])
        else:
            files = [("files", (p.name, p.read_bytes(), "image/jpeg")) for p in chunk]
            r = requests.post(f"{url}/analyze", files=files, timeout=300)
            r.raise_for_status()
            items = r.json()["items"]
        for p, it in zip(chunk, items):
            v = np.asarray(it["embedding"], dtype=np.float32)
            v /= np.linalg.norm(v) + 1e-9
            cols = [c["name"] for c in (it.get("colors") or []) if c.get("share", 0) >= 0.2]
            if not cols and it.get("colors"):
                cols = [it["colors"][0]["name"]]
            out[p.name] = {"vec": v.round(6).tolist(), "is_dog": it.get("is_dog", True),
                           "breed": it.get("breed") if it.get("in_catalog") else None,
                           "conf": it.get("breed_confidence") or 0.0, "size": it.get("size"),
                           "stage": it.get("age"), "colors": cols}
        print(f"  {min(i + 8, len(paths))}/{len(paths)}", end="\r")
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps(out), encoding="utf-8")
    return out


def photo_frac(cos):
    return min(1.0, max(0.0, (cos - 0.40) / 0.30))


def colors_pts(a, b, full, near):
    a, b = {norm(x) for x in a}, {norm(x) for x in b}
    if not a or not b:
        return 0
    if a & b:
        return full
    return near if any({x, y} in SIMILAR for x in a for y in b) else 0


def loc_old(km):
    return 35 if km <= 1 else 30 if km <= 2 else 25 if km <= 3 else 17 if km <= 5 else 8 if km <= 10 else 3 if km <= 20 else 0


def loc_new(km):
    return 12 if km <= 1 else 10 if km <= 2 else 8 if km <= 3 else 6 if km <= 5 else 3 if km <= 10 else 1 if km <= 20 else 0


def breed_info(a, b):
    ok_a = a["breed"] and a["conf"] >= 0.4
    ok_b = b["breed"] and b["conf"] >= 0.4
    same = ok_a and ok_b and a["breed"] == b["breed"]
    mismatch = (a["breed"] and b["breed"] and a["conf"] >= 0.6 and b["conf"] >= 0.6 and a["breed"] != b["breed"])
    return same, bool(mismatch), (min(a["conf"], b["conf"]) if same else 0.0)


def photo_group(a, b, cos):
    same, mismatch, conf = breed_info(a, b)
    parecido = round(photo_frac(cos) * (0.5 if mismatch else 1.0) * 40)
    raza = round(20 * conf) if same else 0
    tam = 8 if a["size"] and a["size"] == b["size"] else 0
    eta = 4 if a["stage"] and a["stage"] == b["stage"] else 0
    col = colors_pts(a["colors"], b["colors"], 8, 5)
    return parecido + raza + tam + eta + col, mismatch


def score_old(a, b, cos, km, same_sex):
    same, mismatch, _ = breed_info(a, b)
    conf_ok = a["conf"] >= 0.6 and b["conf"] >= 0.6
    photo = round(photo_frac(cos) * (0.5 if mismatch else 1.0) * 40)
    breed = 15 if same and conf_ok else 0
    total = photo + loc_old(km) + breed + (5 if same_sex else 0) + colors_pts(a["colors"], b["colors"], 5, 3)
    if not same_sex:
        total = min(total, 30)
    if mismatch and cos < 0.70:
        total = min(total, 35)
    return total


def score_new(a, b, cos, km, same_sex, caps):
    ia, mismatch = photo_group(a, b, cos)
    captured = 4  # raza y color capturados: se supone que la gente los llena igual (cota alta)
    total = ia + loc_new(km) + (4 if same_sex else 0) + captured
    if not same_sex:
        total = min(total, 30)
    if mismatch and cos < 0.70:
        total = min(total, 35)
    if caps == "20km":
        if km > 20:
            total = min(total, 35)
    elif caps == "10y20km" and cos < 0.70:
        if km > 20:
            total = min(total, 30)
        elif km > 10:
            total = min(total, 40)
    return total


def pct(x):
    return round(100.0 * float(np.mean(x)), 1) if len(x) else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="local", help="local (en este proceso) o la URL del servicio")
    args = ap.parse_args()
    q = sorted((DS / "query").glob("*.jpg"))
    g = sorted((DS / "gallery").glob("*.jpg"))
    data = analyze_all(args.url, q + g)
    pid = lambda p: p.name.split("_")[0]  # noqa: E731
    pairs = {"mismo_perro": [], "misma_raza": [], "otro_perro": []}
    for a in q:
        da = data[a.name]
        for b in g:
            db = data[b.name]
            if not (da["is_dog"] and db["is_dog"]):
                continue
            cos = float(np.dot(da["vec"], db["vec"]))
            if pid(a) == pid(b):
                pairs["mismo_perro"].append((da, db, cos))
            else:
                same, _, _ = breed_info(da, db)
                pairs["misma_raza" if same else "otro_perro"].append((da, db, cos))
    for k in ("misma_raza", "otro_perro"):
        if len(pairs[k]) > 6000:
            pairs[k] = random.sample(pairs[k], 6000)

    res = {"pares": {k: len(v) for k, v in pairs.items()}, "foto_80": {}, "aviso_mas_de_40": {}}
    for k, v in pairs.items():
        ia = [photo_group(a, b, c)[0] for a, b, c in v]
        q5, q50, q95 = np.quantile(ia, [0.05, 0.5, 0.95])
        res["foto_80"][k] = {"p5": float(q5), "mediana": float(q50), "p95": float(q95)}

    # Escenarios: mismo perro a 0.3-3 km y mismo sexo; perros distintos a 0.5-40 km (log) y sexo al azar.
    scen = {"mismo_perro": lambda: (random.uniform(0.3, 3.0), True),
            "misma_raza": lambda: (float(np.exp(random.uniform(np.log(0.5), np.log(40)))), random.random() < 0.5),
            "otro_perro": lambda: (float(np.exp(random.uniform(np.log(0.5), np.log(40)))), random.random() < 0.5)}
    for k, v in pairs.items():
        rows = []
        for a, b, c in v:
            km, ss = scen[k]()
            rows.append((score_old(a, b, c, km, ss) > 40, score_new(a, b, c, km, ss, "20km") > 40,
                         score_new(a, b, c, km, ss, "10y20km") > 40))
        rows = np.array(rows)
        res["aviso_mas_de_40"][k] = {"anterior": pct(rows[:, 0]), "80_20_tope_20km": pct(rows[:, 1]),
                                     "80_20_topes_10_y_20km": pct(rows[:, 2])}
    OUT.write_text(json.dumps(res, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
