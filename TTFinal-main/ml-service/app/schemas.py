"""Modelos de entrada/salida (contratos de la API)."""
from typing import List, Optional

from pydantic import BaseModel, Field


class EmbeddingItem(BaseModel):
    """Embedding generado para una imagen."""

    filename: str = Field(..., description="Nombre del archivo recibido")
    dim: int = Field(..., description="Dimension del vector de embedding")
    embedding: List[float] = Field(..., description="Vector de caracteristicas")


class EmbeddingResponse(BaseModel):
    """Respuesta del endpoint /embeddings."""

    model: str = Field(..., description="Modelo usado como extractor de caracteristicas")
    dim: int = Field(..., description="Dimension de cada embedding")
    normalized: bool = Field(..., description="Si los embeddings estan normalizados (L2)")
    count: int = Field(..., description="Numero de embeddings generados")
    embeddings: List[EmbeddingItem]


class BreedScore(BaseModel):
    breed: str
    score: float


class WeightRange(BaseModel):
    min: float
    max: float


class ColorShare(BaseModel):
    name: str
    share: float


class ViewInfo(BaseModel):
    """Parte de la foto de la que salen los datos (app/views.py)."""

    kind: str = Field(..., description="centro | seccion")
    index: int = Field(..., description="0 = centro; 1..n = secciones a lo largo del lado largo")
    total: int = Field(..., description="Vistas revisadas (centro + secciones)")
    box: List[float] = Field(..., description="[x1, y1, x2, y2] de la vista en la foto, de 0 a 1")


class DogDescription(BaseModel):
    """Descripcion del perro (modelo v2). Si no es perro solo vienen is_dog/animal/message:
    nunca se dice que es en su lugar (gato, peluche, etc.)."""

    is_dog: bool = Field(True, description="False si la imagen no es un perro")
    animal: str = Field("dog", description="dog | not_dog (v1: wild_canid | other)")
    dog_probability: Optional[float] = Field(None, description="P(es perro) del modelo v2 (la mayor "
                                                                "entre las vistas revisadas)")
    message: Optional[str] = Field(None, description="Aviso para el usuario (no es perro / Otro)")
    breed: Optional[str] = Field(None, description="Una de las 20 razas, 'Otro' o null si no es perro")
    in_catalog: bool = Field(True, description="True si la raza es una de las 20 del catalogo")
    size: Optional[str] = Field(None, description="pequeno | mediano | grande")
    size_confidence: Optional[float] = None
    weight_kg: Optional[WeightRange] = Field(None, description="Rango de peso orientativo")
    age: Optional[str] = Field(None, description="Etapa: cachorro (menos de 1 anio) | adulto")
    age_confidence: Optional[float] = Field(None, description="Probabilidad de la etapa elegida")
    puppy_probability: Optional[float] = Field(None, description="P(cachorro) del modelo de etapa")
    color: Optional[str] = Field(None, description="Color predominante (paleta del front)")
    color_secondary: Optional[str] = None
    color_label: Optional[str] = Field(None, description="Sugerencia para el select de color")
    colors: List[ColorShare] = []
    dog_count: Optional[int] = Field(None, description="Perros detectados en la foto (solo /describe; "
                                                       "null si no se conto). Con 2 o mas el backend rechaza la foto")
    view: Optional[ViewInfo] = Field(None, description="Vista de la foto donde se vio al perro")


class DescribeItem(DogDescription):
    filename: str
    breed_confidence: float = 0.0
    breed_top: List[BreedScore] = []


class DescribeResponse(BaseModel):
    model: str
    count: int
    items: List[DescribeItem]


class BreedResult(DogDescription):
    filename: str = Field(..., description="Nombre del archivo recibido")
    confidence: float = Field(0.0, description="Confianza de la raza top-1 (0..1)")
    top: List[BreedScore] = Field([], description="Top-k razas con su score")
    dog_score: float = Field(0.0, description="Prob. ImageNet de perro domestico")


class ClassifyResponse(BaseModel):
    model: str
    count: int
    results: List[BreedResult]


class AnalyzeItem(DogDescription):
    filename: str
    embedding: List[float] = Field(..., description="Embedding individual (crudo, 1280)")
    breed_confidence: float = 0.0
    breed_top: List[BreedScore] = []
    dog_score: float = 0.0


class AnalyzeResponse(BaseModel):
    embedding_model: str
    breed_model: str
    dim: int
    normalized: bool
    count: int
    items: List[AnalyzeItem]


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    model: str
    breed_model: str
    device: str
    embedding_dim: int
    model_loaded: bool
    breed_loaded: bool
    dog_crop: bool = False
    breeds: List[str] = []
    dognet: Optional[dict] = Field(None, description="Modelo v2: metricas y umbrales")
