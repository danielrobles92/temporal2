# Diagrama de clases (UML 2.5) de la Plataforma Perreque, dibujado como SVG con posiciones
# y rutas ortogonales fijas para que ninguna línea cruce el diagrama. Fuente: entidades JPA.
import sys
from PIL import ImageFont

OUT = sys.argv[1]
F = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 12)
FB = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 13)
FI = ImageFont.truetype("C:/Windows/Fonts/ariali.ttf", 11)
BLUE, HEAD, BODY, INK, LINE = "#1565C0", "#D6E6FA", "#F7FAFE", "#0D2B4E", "#1565C0"
FONT = "Arial, Helvetica, sans-serif"
LH, HEAD_H, PADX = 16, 28, 10


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


CLASSES = {
    "Usuario": (["id : int", "nombreUsuario : String", "correo : String", "telefono : String",
                 "contrasena : String", "rol : RolUsuario", "permisoPublicar : boolean",
                 "cuentaActiva : boolean", "fechaCreacion : DateTime"],
                ["registrarse()", "iniciarSesion(recordarme : boolean)", "recuperarContrasena(correo : String)",
                 "actualizarPerfil()", "cambiarContrasena()", "cambiarRol(rol : RolUsuario)",
                 "cambiarPermisoPublicar(permiso : boolean)", "cambiarEstadoCuenta(activa : boolean)",
                 "eliminar()"]),
    "Mascota": (["id : int", "nombre : String", "especie : Especie", "raza : String", "sexo : Sexo",
                 "color : String", "tamano : Tamano", "edad : int", "descripcion : String", "ubicacion : String",
                 "latitud : double", "longitud : double", "estado : EstadoMascota", "fechaNacimiento : Date",
                 "pesoKg : double", "esterilizado : boolean", "microchip : String",
                 "ultimaDesparasitacion : Date", "veterinario : String", "notasMedicas : String",
                 "fechaCreacion : DateTime"],
                ["publicar()", "editar()", "desactivar()", "eliminar()", "buscarCoincidencias()"]),
    "ImagenMascota": (["id : int", "url : String", "esPrincipal : boolean", "posicion : int",
                       "fechaCarga : DateTime"], []),
    "VectorImagenMascota": (["id : int", "modelo : String", "dimension : int = 1280", "vector : float[1280]",
                             "razaDetectada : String", "confianzaRaza : float", "colores : String",
                             "tamano : String", "etapa : String", "fechaCreacion : DateTime"], []),
    "Vacuna": (["id : int", "nombre : String", "fechaAplicacion : Date", "proximaDosis : Date",
                "veterinario : String", "lote : String", "fechaCreacion : DateTime"], []),
    "SolicitudAdopcion": (["id : int", "nombreContacto : String", "correoContacto : String",
                           "telefonoContacto : String", "mensaje : String", "respuestas : String",
                           "estado : EstadoSolicitud", "notasDecision : String", "fechaCreacion : DateTime", "fechaActualizacion : DateTime"],
                          ["enviar()", "cancelar()", "aprobarYContactar()", "rechazar()", "eliminar()"]),
    "SolicitudAutorizacion": (["id : int", "motivo : String", "estado : EstadoAutorizacion",
                               "notasRevision : String", "fechaCreacion : DateTime",
                               "fechaActualizacion : DateTime"],
                              ["enviar()", "aprobar()", "rechazar()", "eliminar()"]),
    "Notificacion": (["id : int", "tipo : TipoNotificacion", "titulo : String", "mensaje : String",
                      "enlace : String", "leida : boolean", "fechaCreacion : DateTime"],
                     ["marcarLeida()", "_marcarTodasLeidas(usuario : Usuario)"]),
    "CodigoRecuperacion": (["id : int", "codigoCifrado : String", "venceEn : DateTime", "intentos : int",
                            "usado : boolean", "fechaCreacion : DateTime"],
                           ["verificar(codigo : String) : boolean"]),
    "Reporte": (["id : int", "tipo : TipoReporte", "nombre : String", "especie : Especie", "raza : String",
                 "sexo : Sexo", "color : String", "edad : int", "ubicacion : String", "latitud : double",
                 "longitud : double", "descripcion : String", "telefonoContacto : String",
                 "fotos : String[1..4]", "estado : EstadoReporte", "notasModeracion : String",
                 "fechaCreacion : DateTime", "fechaActualizacion : DateTime"],
                ["registrar()", "editar()", "desactivar()", "eliminar()", "buscarCoincidencias()",
                 "volverAComparar()", "moderar(estado : EstadoReporte, notas : String)"]),
    "VectorImagenReporte": (["id : int", "urlFoto : String", "modelo : String", "dimension : int = 1280",
                             "vector : float[1280]", "razaDetectada : String", "confianzaRaza : float",
                             "colores : String", "tamano : String", "etapa : String",
                             "fechaCreacion : DateTime"], []),
    "Aviso": (["id : int", "nombreContacto : String", "correoContacto : String", "telefonoContacto : String",
               "lugar : String", "mensaje : String", "fotos : String[0..4]", "estado : EstadoAviso",
               "respuesta : String", "fechaRespuesta : DateTime", "fechaAperturaCaso : DateTime",
               "fechaCreacion : DateTime"],
              ["enviar()", "responder(texto : String)", "descartar()"]),
    "Caso": (["id : int", "tipo : TipoCaso", "titulo : String", "estado : EstadoCaso", "ultimoMensaje : String",
              "fechaCreacion : DateTime", "fechaActualizacion : DateTime"],
             ["abrir()", "enviarMensaje(texto : String, fotos : File[0..4])", "cerrar(estado : EstadoCaso)",
              "eliminar()"]),
    "MensajeCaso": (["id : int", "nombreRemitente : String", "mensaje : String", "fotos : String[0..4]",
                     "fechaCreacion : DateTime"], []),
    "Coincidencia": (["id : int", "puntaje : float", "puntajeVisual : float", "puntajeAtributos : int",
                      "probabilidad : float", "motivo : String", "estado : EstadoCoincidencia",
                      "fechaCreacion : DateTime", "fechaActualizacion : DateTime"], ["validar()", "rechazar()"]),
}

ENUMS = [
    ("RolUsuario", ["USER", "SHELTER", "ADMIN"]),
    ("EstadoMascota", ["AVAILABLE", "ADOPTED", "LOST", "INACTIVE"]),
    ("Especie", ["DOG", "CAT", "OTHER"]),
    ("Sexo", ["MALE", "FEMALE"]),
    ("Tamano", ["pequeno", "mediano", "grande"]),
    ("TipoReporte", ["LOST", "FOUND"]),
    ("EstadoReporte", ["OPEN", "RESOLVED", "INACTIVE"]),
    ("EstadoSolicitud", ["PENDING", "APPROVED", "REJECTED"]),
    ("EstadoAutorizacion", ["PENDING", "APPROVED", "REJECTED"]),
    ("EstadoCoincidencia", ["SUGGESTED", "VALIDATED", "REJECTED", "DISCARDED"]),
    ("EstadoAviso", ["NEW", "REPLIED", "CASE_OPENED", "DISMISSED"]),
    ("TipoCaso", ["ADOPTION", "LOST"]),
    ("EstadoCaso", ["OPEN", "ADOPTED", "CANCELLED", "RESOLVED"]),
    ("TipoNotificacion", ["ADOPTION_REQUEST", "ADOPTION_DECISION", "AUTHORIZATION_DECISION", "CASE_MESSAGE",
                          "CASE_STATUS", "SIGHTING", "SIGHTING_REPLY", "MATCH_FOUND"]),
]


class Box:
    def __init__(self, name, attrs, ops, enum=False):
        self.name, self.attrs, self.ops, self.enum = name, attrs, ops, enum
        self.attr_txt = attrs if enum else [f"- {a}" for a in attrs]
        # Una operación con prefijo "_" es de clase (static): UML la subraya.
        self.static = {f"+ {o[1:]}" for o in ops if o.startswith("_")}
        self.op_txt = [f"+ {o.lstrip('_')}" for o in ops]
        texts = [F.getlength(t) for t in self.attr_txt + self.op_txt] + [FB.getlength(name)]
        if enum:
            texts.append(FI.getlength("«enumeration»"))
        self.w = int(max(texts) + 2 * PADX + 4)
        self.head = HEAD_H + (14 if enum else 0)
        self.h = self.head + len(self.attr_txt) * LH + 10 + ((len(self.op_txt) * LH + 10) if self.op_txt else 0)
        self.x = self.y = 0

    left = property(lambda s: s.x)
    right = property(lambda s: s.x + s.w)
    top = property(lambda s: s.y)
    bottom = property(lambda s: s.y + s.h)
    cx = property(lambda s: s.x + s.w / 2)
    cy = property(lambda s: s.y + s.h / 2)

    def svg(self):
        x, y, w, h = self.x, self.y, self.w, self.h
        o = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{BODY}" stroke="{BLUE}" stroke-width="1.2"/>',
             f'<rect x="{x}" y="{y}" width="{w}" height="{self.head}" fill="{HEAD}" stroke="{BLUE}" stroke-width="1.2"/>']
        ty = y + 19
        if self.enum:
            o.append(f'<text x="{x + w / 2}" y="{y + 15}" font-family="{FONT}" font-size="11" font-style="italic" '
                     f'fill="{INK}" text-anchor="middle">«enumeration»</text>')
            ty = y + 32
        o.append(f'<text x="{x + w / 2}" y="{ty}" font-family="{FONT}" font-size="13" font-weight="bold" '
                 f'fill="{INK}" text-anchor="middle">{esc(self.name)}</text>')
        cy = y + self.head + 5
        for t in self.attr_txt:
            o.append(f'<text x="{x + PADX}" y="{cy + 12}" font-family="{FONT}" font-size="12" fill="{INK}">{esc(t)}</text>')
            cy += LH
        if self.op_txt:
            cy += 5
            o.append(f'<line x1="{x}" y1="{cy}" x2="{x + w}" y2="{cy}" stroke="{BLUE}" stroke-width="1"/>')
            cy += 5
            for t in self.op_txt:
                deco = ' text-decoration="underline"' if t in self.static else ""
                o.append(f'<text x="{x + PADX}" y="{cy + 12}" font-family="{FONT}" font-size="12" fill="{INK}"'
                         f'{deco}>{esc(t)}</text>')
                cy += LH
        return o


B = {n: Box(n, a, op) for n, (a, op) in CLASSES.items()}
E = [Box(n, v, [], enum=True) for n, v in ENUMS]

# ---------- Distribución en columnas y filas ----------
M, GX = 40, 120
cols = [["ImagenMascota", "VectorImagenMascota", "Vacuna"], ["Mascota"],
        ["SolicitudAdopcion", "SolicitudAutorizacion"],
        ["Usuario", "Caso", "MensajeCaso", "Notificacion", "Coincidencia"],
        ["Aviso", "CodigoRecuperacion"], ["Reporte"], ["VectorImagenReporte"]]
col_x, x = [], M
for c in cols:
    width = max(B[n].w for n in c)
    col_x.append((x, width))
    for n in c:
        B[n].x = int(x + (width - B[n].w) / 2)
    x += width + GX
WIDTH = x - GX + M

y_r0 = 70
for n in ("SolicitudAutorizacion", "Notificacion", "CodigoRecuperacion"):
    B[n].y = y_r0
h_r0 = max(B[n].h for n in ("SolicitudAutorizacion", "Notificacion", "CodigoRecuperacion"))
y_r1 = y_r0 + h_r0 + 80
for n in ("Usuario", "Mascota", "Reporte", "ImagenMascota", "VectorImagenReporte"):
    B[n].y = y_r1
B["VectorImagenMascota"].y = B["ImagenMascota"].bottom + 50
B["Vacuna"].y = B["VectorImagenMascota"].bottom + 40
# MensajeCaso va entre Usuario y Caso para que su remitente (Usuario) llegue sin cruzar otras líneas.
B["MensajeCaso"].y = B["Usuario"].bottom + 70
B["Caso"].y = B["MensajeCaso"].bottom + 70
# SolicitudAdopcion y Aviso quedan a una altura que les permite unirse en horizontal con
# Mascota/Reporte (arriba) y con Caso (abajo).
y_side = min(B["Mascota"].bottom, B["Reporte"].bottom) - 14 - 30
for n in ("SolicitudAdopcion", "Aviso"):
    B[n].y = y_side
y_k = max(B[n].bottom for n in ("SolicitudAdopcion", "Caso", "Aviso", "Vacuna")) + 45
B["Coincidencia"].y = y_k + 85

# Enumeraciones: banda inferior, 7 por fila, sin líneas (son tipos de atributos).
y_e = B["Coincidencia"].bottom + 110
per_row = 7
rows = [E[i:i + per_row] for i in range(0, len(E), per_row)]
for row in rows:
    total = sum(b.w for b in row) + 40 * (len(row) - 1)
    ex = (WIDTH - total) / 2
    for b in row:
        b.x, b.y = int(ex), int(y_e)
        ex += b.w + 40
    y_e += max(b.h for b in row) + 30
HEIGHT = int(y_e + 20)
enum_top = rows[0][0].y - 50


def within(y, box, pad=14):
    assert box.top + pad <= y <= box.bottom - pad, (box.name, y, box.top, box.bottom)
    return y


# ---------- Conectores ----------
U, Ma, R, SA, Ca, Av, Co, MC = (B[n] for n in ("Usuario", "Mascota", "Reporte", "SolicitudAdopcion", "Caso",
                                               "Aviso", "Coincidencia", "MensajeCaso"))
yU1 = U.top + 46
yU2 = U.bottom - 46
yC1, yC2 = Co.top + 50, Co.top + 100
y_orig = within((Ca.top + min(SA.bottom, Av.bottom)) // 2, Ca)
# responsable y participante bajan rectas de Usuario a Caso, a los lados de MensajeCaso.
d = min(U.w, Ca.w) / 2 - 15
assert d - MC.w / 2 >= 30, (d, MC.w)
_vt = max(B["Vacuna"].top, B["Mascota"].top) + 14
_vb = min(B["Vacuna"].bottom, B["Mascota"].bottom) - 14
assert _vt <= _vb, "Vacuna ya no queda a la altura de Mascota"
y_vac = (_vt + _vb) / 2
links = [
    # (puntos, tipo, multiplicidad inicio, multiplicidad fin, etiqueta, rol inicio, lado de los textos)
    ([(U.left, yU1), (Ma.right, yU1)], "a", "1", "0..*", "◂ publica"),
    ([(U.right, yU1), (R.left, yU1)], "a", "1", "0..*", "registra ▸"),
    ([(U.left, yU2), (SA.cx, yU2), (SA.cx, SA.top)], "a", "1", "0..*", "◂ envía"),
    ([(U.right, yU2), (Av.cx, yU2), (Av.cx, Av.top)], "a", "0..1", "0..*", "envía ▸"),
    ([(Ma.right, within(SA.top + 24, Ma)), (SA.left, SA.top + 24)], "a", "1", "0..*", "recibe ▸"),
    ([(R.left, within(Av.top + 24, R)), (Av.right, Av.top + 24)], "c", "1", "0..*", "◂ recibe"),
    ([(U.cx, U.top), (U.cx, B["Notificacion"].bottom)], "a", "1", "0..*", "recibe ▴"),
    ([(U.left + 40, U.top), (U.left + 40, U.top - 30), (B["SolicitudAutorizacion"].cx, U.top - 30),
      (B["SolicitudAutorizacion"].cx, B["SolicitudAutorizacion"].bottom)], "a", "1", "0..*", "◂ solicita"),
    ([(U.right - 40, U.top), (U.right - 40, U.top - 30), (B["CodigoRecuperacion"].cx, U.top - 30),
      (B["CodigoRecuperacion"].cx, B["CodigoRecuperacion"].bottom)], "a", "1", "0..*", "solicita ▸"),
    ([(U.cx - d, U.bottom), (U.cx - d, Ca.top)], "a", "1", "0..*", None, "responsable", "L"),
    ([(U.cx + d, U.bottom), (U.cx + d, Ca.top)], "a", "0..1", "0..*", None, "participante"),
    ([(U.cx, U.bottom), (U.cx, MC.top)], "a", "0..1", "0..*", None, "remitente"),
    ([(Ca.cx, Ca.top), (Ca.cx, MC.bottom)], "c", "1", "1..*", None),
    ([(SA.right, within(y_orig, SA)), (Ca.left, y_orig)], "a", "0..1", "0..1", "origina ▸"),
    ([(Av.left, within(y_orig, Av)), (Ca.right, y_orig)], "a", "0..1", "0..1", "◂ origina"),
    ([(Ca.left + 30, Ca.bottom), (Ca.left + 30, y_k), (Ma.cx + 50, y_k), (Ma.cx + 50, Ma.bottom)],
     "a", "0..*", "0..1", "◂ trata sobre"),
    ([(Ca.right - 30, Ca.bottom), (Ca.right - 30, y_k), (R.cx - 50, y_k), (R.cx - 50, R.bottom)],
     "a", "0..*", "0..1", "trata sobre ▸"),
    ([(Ma.left, B["ImagenMascota"].top + 40), (B["ImagenMascota"].right, B["ImagenMascota"].top + 40)],
     "c", "1", "1..4", None),
    ([(B["ImagenMascota"].cx, B["ImagenMascota"].bottom), (B["ImagenMascota"].cx, B["VectorImagenMascota"].top)],
     "c", "1", "0..1", None),
    # linea recta a la altura donde Vacuna y Mascota se traslapan (Vacuna baja si los vectores crecen)
    ([(Ma.left, y_vac), (B["Vacuna"].right, y_vac)], "c", "1", "0..*", None),
    ([(R.right, R.top + 46), (B["VectorImagenReporte"].left, R.top + 46)], "c", "1", "0..4", None),
    ([(Ma.cx, Ma.bottom), (Ma.cx, yC1), (Co.left, yC1)], "a", "0..1", "0..*", "◂ candidata"),
    ([(R.cx, R.bottom), (R.cx, yC1), (Co.right, yC1)], "a", "1", "0..*", "◂ genera"),
    ([(R.cx + 50, R.bottom), (R.cx + 50, yC2), (Co.right, yC2)], "a", "0..1", "0..*", "◂ candidato"),
]

# Nota UML con la restricción {xor} de Coincidencia (mascota del catálogo u otro reporte).
NOTE = ["{xor}", "Cada coincidencia apunta a una mascota", "del catálogo o a otro reporte, nunca a ambos."]
nw = int(max(F.getlength(t) for t in NOTE) + 2 * PADX)
nh = len(NOTE) * LH + 14
nx, ny = Co.left - 60 - nw, yC1 + 30
ncy = within(ny + nh / 2, Co)
note_svg = [
    f'<line x1="{nx + nw}" y1="{ncy}" x2="{Co.left}" y2="{ncy}" stroke="{LINE}" stroke-width="1.2" '
    f'stroke-dasharray="5,4"/>',
    f'<polygon points="{nx},{ny} {nx + nw - 10},{ny} {nx + nw},{ny + 10} {nx + nw},{ny + nh} {nx},{ny + nh}" '
    f'fill="{BODY}" stroke="{BLUE}" stroke-width="1.2"/>',
    f'<polyline points="{nx + nw - 10},{ny} {nx + nw - 10},{ny + 10} {nx + nw},{ny + 10}" fill="none" '
    f'stroke="{BLUE}" stroke-width="1.2"/>',
]
for i, t in enumerate(NOTE):
    note_svg.append(f'<text x="{nx + PADX}" y="{ny + 19 + i * LH}" font-family="{FONT}" font-size="12" '
                    f'fill="{INK}">{esc(t)}</text>')


def text(x, y, t, anchor="start", size=12, weight="normal", style="normal"):
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" '
            f'font-style="{style}" fill="{INK}" text-anchor="{anchor}">{esc(t)}</text>')


def end_label(p, q, label, side, diamond_end=False):
    """Multiplicidad junto al extremo p del segmento p->q, fuera de la clase (y del rombo, si lo hay)."""
    (x1, y1), (x2, y2) = p, q
    if y1 == y2:  # horizontal
        d = 1 if x2 > x1 else -1
        gap = 24 if diamond_end else 8
        return text(x1 + d * gap, y1 - 6, label, "start" if d > 0 else "end")
    d = 1 if y2 > y1 else -1
    y = y1 + d * 16 + (0 if d > 0 else 4)
    dx = 10 if diamond_end else 6
    return text(x1 - dx, y, label, "end") if side == "L" else text(x1 + dx, y, label)


def diamond(p, q):
    (x1, y1), (x2, y2) = p, q
    if y1 == y2:
        d = 1 if x2 > x1 else -1
        pts = [(x1, y1), (x1 + d * 9, y1 - 6), (x1 + d * 18, y1), (x1 + d * 9, y1 + 6)]
    else:
        d = 1 if y2 > y1 else -1
        pts = [(x1, y1), (x1 - 6, y1 + d * 9), (x1, y1 + d * 18), (x1 + 6, y1 + d * 9)]
    return '<polygon points="' + " ".join(f"{a:.1f},{b:.1f}" for a, b in pts) + f'" fill="{LINE}"/>'


svg_links = []
for link in links:
    pts, kind, m1, m2, label = link[:5]
    role = link[5] if len(link) > 5 else None
    side = link[6] if len(link) > 6 else "R"
    path = " ".join(f"{a:.1f},{b:.1f}" for a, b in pts)
    svg_links.append(f'<polyline points="{path}" fill="none" stroke="{LINE}" stroke-width="1.3"/>')
    if kind == "c":
        svg_links.append(diamond(pts[0], pts[1]))
    svg_links.append(end_label(pts[0], pts[1], m1, side, kind == "c"))
    svg_links.append(end_label(pts[-1], pts[-2], m2, side))
    if role:
        (x1, y1) = pts[0]
        if side == "L":
            svg_links.append(text(x1 - 6, y1 + 32, role, "end", size=11, style="italic"))
        else:
            svg_links.append(text(x1 + 6, y1 + 32, role, size=11, style="italic"))
    if label:
        # etiqueta centrada sobre el segmento más largo
        segs = list(zip(pts, pts[1:]))
        (a, b) = max(segs, key=lambda s: abs(s[0][0] - s[1][0]) + abs(s[0][1] - s[1][1]))
        if a[1] == b[1]:
            svg_links.append(text((a[0] + b[0]) / 2, a[1] - 6, label, "middle", 11, style="italic"))
        else:
            svg_links.append(text(a[0] + 8, (a[1] + b[1]) / 2 + 4, label, "start", 11, style="italic"))

out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">',
       f'<rect width="{WIDTH}" height="{HEIGHT}" fill="#FFFFFF"/>',
       text(M, 40, "Diagrama de clases de la Plataforma Perreque", size=18, weight="bold"),
       f'<line x1="{M}" y1="{enum_top}" x2="{WIDTH - M}" y2="{enum_top}" stroke="{BLUE}" stroke-width="1" stroke-dasharray="6,4"/>',
       text(M, enum_top + 24, "Enumeraciones (tipos de los atributos)", size=13, weight="bold")]
out += svg_links + note_svg
for b in list(B.values()) + E:
    out += b.svg()
out.append("</svg>")
open(OUT, "w", encoding="utf-8").write("\n".join(out))
print(OUT, WIDTH, HEIGHT)
