# Servicio de reconocimiento de imagenes (FastAPI + PyTorch) para el servidor en la nube.
# Corre en CPU. Sirve en procesadores x86 y ARM (Oracle Cloud gratis usa ARM).
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TORCH_HOME=/app/.cache/torch \
    MLSERVICE_DEVICE=cpu

WORKDIR /app

# PyTorch solo CPU: en x86 viene del indice de PyTorch (sin CUDA, mucho mas ligero);
# en ARM la version de PyPI ya es solo CPU.
RUN if [ "$(uname -m)" = "x86_64" ]; then \
      pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.5.1 torchvision==0.20.1; \
    else \
      pip install --no-cache-dir torch==2.5.1 torchvision==0.20.1; \
    fi

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt numpy==2.4.4

# Pesos preentrenados de torchvision (EfficientNetB0, SSDLite y DeepLabV3): se descargan al
# construir la imagen para que el servicio arranque sin depender de internet.
RUN python -c "from torchvision.models import EfficientNet_B0_Weights as E; \
from torchvision.models.detection import SSDLite320_MobileNet_V3_Large_Weights as S; \
from torchvision.models.segmentation import DeepLabV3_MobileNet_V3_Large_Weights as D; \
[w.get_state_dict(progress=False) for w in (E.IMAGENET1K_V1, S.DEFAULT, D.COCO_WITH_VOC_LABELS_V1)]"

COPY app ./app
COPY models ./models

EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
