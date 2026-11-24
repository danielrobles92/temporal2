"""Vistas de la foto que revisa la red: el centro y secciones que cubren TODA la foto.

Las redes (EfficientNet-B0) reciben 224 x 224 px. El preprocesamiento de ImageNet
(lado corto a 256 px + recorte central de 224 px) tira las orillas: en una foto 16:9 la
red ve solo el 49 % central del ancho y un perro pegado a la orilla no aparece.

Por eso cada foto se revisa en varias vistas:
  - "centro":  el mismo recorte central de siempre (con el que se calibraron los umbrales).
  - "seccion": cuadros del alto (o ancho) completo de la foto, recorridos a lo largo del
    lado largo con al menos la mitad de traslape, cada uno reducido a 224 x 224 sin recortar.
    Juntas cubren todos los pixeles de la foto, y cualquier cosa de hasta medio cuadro de
    ancho queda completa dentro de alguna seccion (no se parte entre dos).
    Si la foto es casi cuadrada (lado largo <= 1.15 x lado corto) hay una sola seccion:
    la foto completa ajustada a 224 x 224 (deformacion de a lo mas 15 %; el entrenamiento
    usa recortes con proporciones de 3:4 a 4:3).
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Tuple

import torch
from PIL import Image
from torchvision.transforms import functional as F
from torchvision.transforms import InterpolationMode

SIDE = 224                       # entrada de EfficientNet-B0
RESIZE = 256                     # lado corto antes del recorte central (ImageNet)
MEAN, STD = [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]
SQUARE_TOLERANCE = 1.15          # hasta esta proporcion la foto completa es una sola seccion
MAX_SECTIONS = 5                 # fotos panoramicas: se reduce el traslape, nunca la cobertura

Box = Tuple[float, float, float, float]


@dataclass
class View:
    kind: str           # "centro" | "seccion"
    box: Box            # (x1, y1, x2, y2) en pixeles de la foto original
    tensor: torch.Tensor


def central_box(w: int, h: int) -> Box:
    """Rectangulo de la foto original que queda tras Resize(256) + CenterCrop(224)."""
    c = SIDE * min(w, h) / RESIZE
    x0, y0 = (w - c) / 2, (h - c) / 2
    return (max(0.0, x0), max(0.0, y0), min(float(w), x0 + c), min(float(h), y0 + c))


def section_boxes(w: int, h: int) -> List[Box]:
    """Cuadros que cubren toda la foto (ver el docstring del modulo)."""
    short, long_ = min(w, h), max(w, h)
    r = long_ / short
    if r <= SQUARE_TOLERANCE:
        return [(0.0, 0.0, float(w), float(h))]
    n = math.ceil(2 * r - 1 - 1e-9)                    # paso <= medio cuadro
    n = min(n, max(MAX_SECTIONS, math.ceil(r)))       # nunca menos de los que cubren todo
    starts = [i * (long_ - short) / (n - 1) for i in range(n)]
    if w >= h:
        return [(s, 0.0, s + short, float(h)) for s in starts]
    return [(0.0, s, float(w), s + short) for s in starts]


def _to_tensor(img: Image.Image) -> torch.Tensor:
    return F.normalize(F.to_tensor(img), MEAN, STD)


def center_tensor(img: Image.Image) -> torch.Tensor:
    """Igual que EfficientNet_B0_Weights.IMAGENET1K_V1.transforms() (bicubica, 256 -> 224)."""
    x = F.resize(img, RESIZE, interpolation=InterpolationMode.BICUBIC, antialias=True)
    return _to_tensor(F.center_crop(x, SIDE))


def make_views(img: Image.Image) -> List[View]:
    """[centro, seccion 1, ..., seccion n] de una foto RGB."""
    w, h = img.size
    views = [View("centro", central_box(w, h), center_tensor(img))]
    for box in section_boxes(w, h):
        crop = img.crop(tuple(round(v) for v in box))
        crop = crop.resize((SIDE, SIDE), Image.BICUBIC)
        views.append(View("seccion", box, _to_tensor(crop)))
    return views
