"""Distribucion del parecido de fotos (coseno del vector de 1280) para elegir el puntaje de
coincidencia entre reportes (ReportsController / MatchScoring en el backend).

  mismo_perro         MPDD query vs gallery, mismo id (otra foto, otra pose)
  otro_perro          MPDD query vs gallery, distinto id
  misma_raza_distinto R3P0: pares de fotos de la misma raza (perros distintos en su mayoria)
  otra_raza           R3P0: pares de razas distintas

Usa el mismo embedder que el servicio (EfficientNet-B0 crudo, recorte central).
Uso: python experiments/banco_puntaje_coincidencia.py
"""
import json
import random
import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from app.model import EfficientNetEmbedder  # noqa: E402

DS = ROOT.parent / "imagesDS"
MPDD = DS / "MPDD" / "MPDD" / "pytorch"
R3P0 = DS / "R3P0"
random.seed(7)


def embed(emb, paths, batch=32):
    out = []
    for i in range(0, len(paths), batch):
        imgs = [Image.open(p).convert("RGB") for p in paths[i:i + batch]]
        out += emb.embed(imgs)
    return np.array(out, dtype=np.float32)


def stats(x):
    x = np.asarray(x)
    q = np.quantile(x, [0.05, 0.25, 0.5, 0.75, 0.95])
    return {"n": int(len(x)), "media": round(float(x.mean()), 3), "p5": round(float(q[0]), 3), "p25": round(float(q[1]), 3),
            "p50": round(float(q[2]), 3), "p75": round(float(q[3]), 3), "p95": round(float(q[4]), 3)}


def main():
    emb = EfficientNetEmbedder(device="auto")
    q = sorted(MPDD.joinpath("query").glob("*.jpg"))
    g = sorted(MPDD.joinpath("gallery").glob("*.jpg"))
    pid = lambda p: p.name.split("_")[0]  # noqa: E731
    Q, G = embed(emb, q), embed(emb, g)
    S = Q @ G.T
    same, diff = [], []
    for i, a in enumerate(q):
        for j, b in enumerate(g):
            (same if pid(a) == pid(b) else diff).append(float(S[i, j]))
    diff = random.sample(diff, min(20000, len(diff)))

    breeds = sorted(d for d in R3P0.iterdir() if d.is_dir())
    per = {b.name: random.sample(sorted(b.glob("*.*")), 25) for b in breeds}
    paths = [p for b in per.values() for p in b]
    E = embed(emb, paths)
    lab = [b for b, ps in per.items() for _ in ps]
    C = E @ E.T
    same_breed, other_breed = [], []
    for i in range(len(paths)):
        for j in range(i + 1, len(paths)):
            (same_breed if lab[i] == lab[j] else other_breed).append(float(C[i, j]))
    other_breed = random.sample(other_breed, 20000)

    res = {"mismo_perro": stats(same), "otro_perro": stats(diff),
           "misma_raza_distinto": stats(same_breed), "otra_raza": stats(other_breed)}
    for k, v in res.items():
        print(f"{k:22s} {v}")
    (ROOT / "experiments" / "resultados_puntaje_coincidencia.json").write_text(json.dumps(res, indent=1), encoding="utf-8")


if __name__ == "__main__":
    with torch.inference_mode():
        main()
