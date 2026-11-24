# ml-service — Generador de embeddings (EfficientNetB0)

Microservicio **FastAPI** que convierte imagenes de perros en vectores de
caracteristicas (*embeddings*) usando **EfficientNetB0** preentrenado en ImageNet.

Forma parte de la plataforma PERREQUE (TT1 2026-B014). Es un servicio **sin
estado**: no accede a la base de datos. El backend Spring Boot lo consume por
HTTP, recibe los vectores y los persiste en PostgreSQL (`pgvector`) para luego
hacer la busqueda de similitud (coseno / top-k).

## Que hace

- `GET /` — informacion basica del servicio.
- `GET /health` — estado y metadatos del modelo.
- `POST /embeddings` — recibe una o varias imagenes (`multipart/form-data`,
  campo `files`) y devuelve, por cada una, un vector de **1280** dimensiones.
- `GET /docs` — documentacion interactiva (Swagger UI).

Los embeddings se normalizan con norma L2, de modo que la **similitud del
coseno** equivale al producto punto (ideal para `pgvector` con distancia coseno).

## Requisitos

- Python 3.11

## Instalacion (Windows / PowerShell)

```powershell
cd ml-service
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip

# 1) PyTorch + torchvision (CPU)
pip install torch==2.5.1 torchvision==0.20.1 --index-url https://download.pytorch.org/whl/cpu

# 2) Resto de dependencias
pip install fastapi==0.115.6 "uvicorn[standard]==0.34.0" python-multipart==0.0.20 pydantic-settings==2.7.1 pillow==11.1.0
```

> En la primera ejecucion, `torchvision` descarga los pesos de EfficientNetB0
> (~20 MB) y los cachea en `%USERPROFILE%\.cache\torch`.

## Ejecutar

```powershell
cd ml-service
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

El servicio queda en `http://localhost:8000` (Swagger en `/docs`).

## Probar con curl

Comprobacion de salud:

```bash
curl http://localhost:8000/health
```

Generar el embedding de una imagen (una mascota ya subida en el backend):

```bash
curl -X POST http://localhost:8000/embeddings \
  -F "files=@../back/uploads/pets/06535cbe-3609-4798-a134-31e38e9f30bd.jpg"
```

Varias imagenes en una sola peticion:

```bash
curl -X POST http://localhost:8000/embeddings \
  -F "files=@perro1.jpg" \
  -F "files=@perro2.jpg"
```

Respuesta (resumida):

```json
{
  "model": "efficientnet_b0",
  "dim": 1280,
  "normalized": true,
  "count": 1,
  "embeddings": [
    { "filename": "06535cbe-...jpg", "dim": 1280, "embedding": [0.013, -0.007, ...] }
  ]
}
```

## Analizar una foto desde la terminal (sin servidor)

`analizar.py` carga los mismos modelos y el mismo codigo que el servicio, sin backend ni
pagina, y explica paso a paso que hace la red: vistas de la foto (centro + secciones), vector
de 1280, decision perro/no-perro, probabilidades de raza, tamano, etapa, colores y el resultado final.

```powershell
cd C:\TTS\PERREQUE\ml-service
.\.venv\Scripts\python.exe analizar.py C:\ruta\foto.jpg
# dos o mas fotos: coseno y probabilidad calibrada de ser el mismo perro
.\.venv\Scripts\python.exe analizar.py foto1.jpg foto2.jpg --comparar
# varios perros en la foto: analiza cada uno y guarda mapas de calor (Grad-CAM) en analisis\
.\.venv\Scripts\python.exe analizar.py foto.jpg --perros --calor
# arma una foto con dos perros lado a lado y la analiza
.\.venv\Scripts\python.exe analizar.py --juntar perroA.jpg perroB.jpg --perros --calor
# solo el JSON (mismo formato que /analyze)
.\.venv\Scripts\python.exe analizar.py foto.jpg --json
```

### Fotos con varios perros: contador (`app/counter.py`)

Desde 2026-11-10 `/describe` devuelve `dog_count` y el backend rechaza (422 `MULTIPLE_DOGS`)
las fotos con 2 o mas perros al publicar, al reportar y en los avisos. El detector SSDLite
(MobileNetV3, COCO, 3.4 M parametros, pesos de torchvision) propone recuadros de "perro"; se
quitan los repetidos (muy encimados o uno casi completo dentro de otro) y se cuentan los demas.
Los parametros salen de `experiments/banco_varios_perros.py` (Open Images, COCO, R3P0 y fotos
reales de la app, con la cantidad de perros revisada) y se guardan en `models/contador_perros.json`;
`MLSERVICE_COUNT_DOGS=false` lo apaga.

Lo que NO funciono (medido): confirmar cada recorte con DogNet baja la deteccion (76 % -> 60 %)
sin reducir los rechazos por error; correr el detector tambien en dos mitades de la foto encuentra
mas perros, pero cuenta como perros distintos los pedazos de uno solo (12 % de rechazos por error).

Con varios perros en una foto, el servicio NO los separa: la red ve el recorte central de
224 x 224 (o la seccion donde esta el perro, ver "Foto completa"), el vector de 1280 es el promedio de todo lo que aparece (mezcla de los perros,
dominada por el que ocupa mas espacio en el centro) y la raza es una sola respuesta; si los
perros son de razas distintas, la probabilidad se reparte y suele salir "Otro". Medido en 200
fotos de COCO con 2-4 perros (prueba PI-12): 96 % aceptadas como perro, 64.5 % "Otro", la foto
grupal encuentra a uno de sus perros en el top-1 el 87.5 % de las veces (63 % al mas grande).

## Configuracion

Variables de entorno (prefijo `MLSERVICE_`), ver `.env.example`:

| Variable | Por defecto | Descripcion |
|---|---|---|
| `MLSERVICE_DEVICE` | `cpu` | `cpu` o `cuda` |
| `MLSERVICE_L2_NORMALIZE` | `true` | Normaliza los embeddings (coseno) |
| `MLSERVICE_MAX_BATCH_SIZE` | `8` | Maximo de imagenes por peticion |
| `MLSERVICE_MAX_IMAGE_BYTES` | `5242880` | Tamano maximo por imagen (5 MB) |
| `MLSERVICE_DOGNET_WEIGHTS_PATH` | `models/dognet_v2.pt` | Modelo v2 (si no existe se usa mx20) |
| `MLSERVICE_DOGNET_THRESHOLDS_PATH` | `models/dognet_v2_thresholds.json` | Umbrales perro/no-perro, raza/Otro |
| `MLSERVICE_DOGNET_COLOR` | `true` | Estimar color (descarga DeepLabV3 ~42 MB la 1a vez) |
| `MLSERVICE_DOGNET_AGE` | `true` | Devolver la etapa cachorro/adulto (`models/dognet_puppy.pt`) |
| `MLSERVICE_DOGNET_AGE_PATH` | `models/dognet_puppy.pt` | Modelo de etapa cachorro/adulto |
| `MLSERVICE_DOGNET_VIEWS_PATH` | `models/vistas.json` | Reglas para aceptar un perro visto solo en una seccion lateral |

## Modelo v2 (DogNet v2): descripcion del perro

Un EfficientNetB0 afinado con tres cabezas que, para cada foto, responde:

- **¿Es un perro?** Si no, solo eso: `is_dog=false`, `animal="not_dog"` y el mensaje
  *"La imagen no se identifica como un perro. No se puede procesar."* (internamente la red
  distingue gato, peluche, otro animal u objeto, pero la respuesta nunca dice que es).
- **Raza**: una de las 20 del catalogo (R3P0) u **"Otro"** (otra raza o mestizo).
- **Tamano** (pequeno/mediano/grande + peso orientativo).
- **Etapa de vida**: `cachorro` (menos de 1 anio) o `adulto`, con `puppy_probability`
  (red aparte, ver "Etapa cachorro / adulto" abajo). La edad en meses/anios se desactivo.
- **Colores** del pelaje (segmentacion DeepLabV3 de torchvision + k-means): `colors` trae
  todos los detectados con la parte del pelaje que cubre cada uno; `color_label` es la
  sugerencia para el select del formulario.

### Foto completa: centro + secciones (`app/views.py`)

EfficientNet recibe 224 x 224 px. El preprocesamiento de ImageNet (lado corto a 256 + recorte
central) tira las orillas: en una foto 16:9 la red solo veia el 49 % central del ancho, y un perro
pegado a la orilla salia como "no es un perro". Ahora cada foto se revisa en varias vistas: el
mismo recorte central de siempre y **secciones** del lado corto recorridas a lo largo del lado
largo (traslape de al menos la mitad, cada una reducida a 224 x 224) que juntas cubren todos los
pixeles. La respuesta trae `view` (`centro` o `seccion`, indice, total y caja de 0 a 1).

Una seccion lateral puede "ver perro" en parte de un gato u otro animal, asi que, si el centro no
ve al perro, la seccion necesita una segunda opinion (`models/vistas.json`): DogNet muy seguro
(P(no es perro) < 10 %) con ImageNet viendo perro, o el detector SSDLite del contador
encontrando un perro dentro de esa seccion. Los datos salen del centro si ve al perro; la huella
(embedding) tambien, asi que las fotos ya indexadas no cambian. Medido con
`experiments/banco_vistas.py` y `banco_vistas_reglas.py` (fotos que la red no vio):

| Grupo | Solo centro | Foto completa |
|---|---|---|
| COCO, perro con menos de la mitad dentro del centro (187) | 49.7 % perro | 79.1 % |
| COCO recortadas a 16:9 con el perro en la orilla (130) | 33.1 % | 83.1 % |
| Perro de validacion pegado a la orilla de una foto 16:9 (400) | 13.5 % | 76.3 % |
| COCO, un perro al azar (400) | 92.5 % | 95.3 % |
| COCO sin perro: otros animales, escenas, objetos (739) | 95.26 % no-perro | 94.99 % |
| Validacion: no-perro detectado / raza correcta | 97.6 % / 87.9 % | 96.6 % / 88.2 % |

Usar el umbral normal en las secciones daba mas perros en la orilla (82-88 %) pero aceptaba el
doble de otros animales como perro (COCO 92.8 % -> 85.6 %); se descarto. El tiempo por foto no
cambia (337 ms en la RTX 3050 Ti con color y contador).

Endpoints: `POST /describe` (sin embedding, lo usa el front via backend
`POST /images/analyze`), y `/classify` y `/analyze` ahora devuelven los mismos
campos. Si `models/dognet_v2.pt` no existe, el servicio usa el clasificador
anterior (mx20).

Validacion (10,038 fotos que el modelo no vio, `models/dognet_v2_val.pt`, umbrales finales):

| Tarea | Resultado |
|---|---|
| Raza correcta (20 razas) | 87.6% (los errores van casi siempre a "Otro") |
| "Otro" para otras razas / mestizos | 89.8% |
| No-perro detectado (gato 96.7%, peluche 97.2%, animal 97.0%, objeto 98.7%) | 97.5% |
| Perros reales rechazados por error | 0.2% |
| Tamano | 84.5% |
| Edad (3 clases, cabeza `age_head` que ya no se usa) | 50.4% (44% en fotos de expertos) |

La edad por foto es dificil: la literatura con EfficientNetB7 reporta ~47-49% en DogAge.
El color se estima por pixeles (heuristica): ~72% de color principal plausible por raza.

Datos de entrenamiento (`imagesDS/_v2cache`): R3P0 (20 razas), Oxford-IIIT Pet
(8 de las 20 razas, otras razas y 12 razas de gato), Stanford Dogs (otras 100 razas
-> "Otro"), Dog Breeds Image Dataset (mestizos), Caltech-256 y COCO (peluches,
animales, objetos), DogAge (edad).

### Reentrenar

```powershell
cd ml-service; .\.venv\Scripts\Activate.ps1
# 1) cache + manifiestos (imagesDS/_v2cache). Fuentes: r3p0 oxford stanford archive caltech coco dogage
python experiments/prepare_v2.py --sources r3p0 oxford stanford archive caltech coco dogage
# 2) corrida con validacion -> metricas y umbrales (models/dognet_v2_val*.json)
python experiments/train_v2.py --epochs 14 --out dognet_v2_val
python experiments/eval_v2.py --model dognet_v2_val
# 3) modelo final con todos los datos -> models/dognet_v2.pt
python experiments/train_v2.py --epochs 14 --all-data --out dognet_v2
# 4) pruebas contra el servicio levantado (dataset y/o tus fotos)
python experiments/probar_modelo.py --dataset 10 C:\ruta\a\fotos
```

Los umbrales de decision (`models/dognet_v2_thresholds.json`) se eligen con la
corrida de validacion: un modelo entrenado con `--all-data` ya vio esas fotos.

### Etapa cachorro / adulto (`models/dognet_puppy.pt`)

EfficientNetB0 propio con 2 salidas (`AgeNet`), iniciado con el backbone de
`dognet_v2_val.pt` y reentrenado completo (`experiments/train_puppy.py`): cachorro
(< 12.5 meses) o adulto. Datos: PetFinder.my (edad en meses), Open Images V7
(etiqueta "Puppy" verificada por personas, parte train) y DogAge adultos/seniors
(el grupo "joven" 0-2 anios se descarta por ambiguo); lotes 50 % cachorros / 50 % adultos.
El umbral de P(cachorro) se elige en validacion y se guarda en el modelo.

| Medida (`models/dognet_puppy.json`) | Resultado |
|---|---|
| Open Images V7 test (1,023 fotos ajenas): exactitud balanceada | 72.7 % (cachorros 64.7 %, adultos 80.7 %, AUC 0.78) |
| PetFinder.my val: cachorros de 0-7 meses | 91-99 % |
| PetFinder.my val: 8-12 meses / 13-29 meses | 74 % / 39 % (la frontera de 1 anio es dificil) |
| DogAge val (adultos y seniors) | 94.6 % |

```powershell
python experiments/train_puppy.py        # -> models/dognet_puppy.pt (+ .json con metricas)
```

### Edad en meses / anios (`models/dognet_age.pt`) — desactivada

Reemplazada por la etapa cachorro/adulto: en fotos reales confundia etapas (en Open
Images test el 56 % de los cachorros salia adulto/senior). Se conserva el codigo de
entrenamiento como referencia; el servicio ya no la carga.

Cabeza aparte (`AgeHead`, `experiments/train_age.py`) sobre el vector de 1280-d de
DogNet v2 congelado: no cambia raza / no-perro / tamano. Predice una distribucion
sobre rangos de edad (0-1.5, 2, 3, 4, 5-7, 8-12 meses, 1-2, 2-6 y 6+ anios) y se
combina con la cabeza cachorro/adulto/senior de DogNet. La respuesta trae la mediana
y el rango 20-80 %: `{"months": 6.1, "text": "6 meses", "range_text": "entre 4 y 9 meses"}`.
Para seniors (mediana > 6 anios) dice "más de 6 años".

Ningun dataset publico trae la edad exacta por foto; se entrena con intervalos:
PetFinder.my (Kaggle, espejo publico de MulTaBench en Hugging Face, 6,429 fotos de
un solo perro, edad en 8 grupos: 0-1, 2, 3, 4, 5-7, 8-12, 13-29, 30+ meses) y DogAge.

Validacion (fotos no vistas, `models/dognet_age_val.json`):

| Medida | Resultado |
|---|---|
| Cachorros (<= 12 meses): error tipico (mediana) | 1 mes |
| Grupo de meses exacto / exacto o vecino (8 grupos PetFinder.my) | 37.5% / 72.6% |
| Cachorro (< 1 anio) vs adulto (30+ meses) | 83.1% |
| Etapa cachorro/adulto/senior, DogAge PetFinder | 55.3% (cabeza anterior 53.1%) |
| Etapa, DogAge fotos de expertos | 41.2% (cabeza anterior 43.5%) |

Es una aproximacion: los meses de cachorro son lo mas fiable; en adultos solo
distingue 1-2 / 2-6 / 6+ anios (no hay datos con edades mas finas).

```powershell
# descarga unica (~414 MB, sin cuenta) en imagesDS/_downloads/petfinder_my/:
#   data.parquet e images-00000..00002.zip de
#   https://huggingface.co/datasets/multabench/core-img-cls-petfinder
pip install pyarrow                                  # solo para leer el parquet
python experiments/prepare_age.py                    # -> imagesDS/_v2cache/age_manifest.csv
python experiments/train_age.py --val                # metricas -> models/dognet_age_val.json
python experiments/train_age.py                      # final -> models/dognet_age.pt
```

`dognet_age.pt` va ligado al backbone con el que se entreno (`dognet_v2.pt`): si se
reentrena DogNet v2 hay que reentrenar tambien la edad (el servicio lo ignora si no
coincide).

## Banco de pruebas (tabla PI-01 a PI-19 de `DOCS/Tabla_Pruebas_Red_Neuronal.docx`)

`experiments/banco_pruebas.py` corre el mismo pipeline del servicio sobre fotos que no
se usaron para entrenar: MPDD (re-identificacion, 191 perros), COCO 2017 (otros
animales, personas, objetos, fotos con varios perros; `prepare_pruebas_coco.py`),
R3P0 (perros distintos de la misma raza y color), DogAge (base grande) y Open Images
(cachorro/adulto). Guarda todo en `experiments/resultados_banco_pruebas.json`.

```powershell
python experiments/banco_pruebas.py                  # todo (~30 min con GPU)
python experiments/banco_pruebas.py --only PI-13 PI-16   # solo algunas pruebas
python experiments/eval_v2.py --model dognet_v2_val --thresholds models/dognet_v2_thresholds.json --no-write  # raza/Otro/tamano
# complementos usados en el anexo del documento (cada uno escribe experiments/resultados_*.json)
python experiments/banco_umbral.py . experiments/resultados_umbral.json                      # PI-17: umbral vs falsa alarma
python experiments/banco_rechazo_por_tamano.py . experiments/resultados_rechazo_por_tamano.json  # PI-22
python experiments/banco_variantes_alta_calidad.py . experiments/resultados_variantes_alta_calidad.json  # PI-06/07/09/11
```

## Siguientes pasos (fuera de este scaffolding)

1. Migracion `pgvector` + tablas `pet_image_embeddings` y `matches` en el backend.
2. Cliente HTTP en Spring (`EmbeddingClient`) + persistencia de vectores.
3. Score hibrido (visual + geografico/atributos) en `ReportsController.getMatches`.
