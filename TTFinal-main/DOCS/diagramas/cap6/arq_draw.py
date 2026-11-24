from PIL import Image, ImageDraw, ImageFont
import math
S = 3
W, H = 1140, 575
img = Image.new('RGB', (W*S, H*S), 'white')
d = ImageDraw.Draw(img)
BLUE = (21, 101, 192); FILL = (214, 230, 250); TXT = (13, 43, 78); LIGHT=(238,245,253)
def F(sz, bold=False):
    return ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf' if bold else 'C:/Windows/Fonts/arial.ttf', int(sz*S))
def box(x0,y0,x1,y1, header=None, lines=(), fill=FILL, hsz=14, bsz=12.5, dashed=False):
    d.rounded_rectangle([x0*S,y0*S,x1*S,y1*S], radius=6*S, fill=fill, outline=BLUE, width=int(1.6*S))
    items = []
    if header: items.append((header, F(hsz, True)))
    for l in lines: items.append((l, F(bsz)))
    hs = [d.textbbox((0,0), t, font=f)[3] for t,f in items]
    gap = 5*S
    total = sum(hs) + gap*(len(items)-1)
    y = ((y0+y1)*S - total)/2
    for (t,f),h in zip(items,hs):
        w = d.textlength(t, font=f)
        d.text(((x0+x1)*S/2 - w/2, y), t, font=f, fill=TXT)
        y += h + gap
def arrow(x0,y0,x1,y1, dashed=False):
    X0,Y0,X1,Y1 = x0*S,y0*S,x1*S,y1*S
    ang = math.atan2(Y1-Y0, X1-X0)
    L = 11*S
    ex, ey = X1 - L*0.6*math.cos(ang), Y1 - L*0.6*math.sin(ang)
    if dashed:
        n = int(math.hypot(ex-X0, ey-Y0) / (7*S))
        for i in range(0, n, 2):
            a = i/n; b = min((i+1)/n, 1)
            d.line([X0+(ex-X0)*a, Y0+(ey-Y0)*a, X0+(ex-X0)*b, Y0+(ey-Y0)*b], fill=BLUE, width=int(1.6*S))
    else:
        d.line([X0,Y0,ex,ey], fill=BLUE, width=int(1.6*S))
    p1 = (X1, Y1)
    p2 = (X1 - L*math.cos(ang-0.38), Y1 - L*math.sin(ang-0.38))
    p3 = (X1 - L*math.cos(ang+0.38), Y1 - L*math.sin(ang+0.38))
    d.polygon([p1,p2,p3], fill=BLUE)
def label(x,y,lines, anchor='l', sz=12):
    f = F(sz)
    for i,t in enumerate(lines):
        w = d.textlength(t, font=f)
        xx = x*S if anchor=='l' else (x*S - w if anchor=='r' else x*S - w/2)
        d.text((xx, y*S + i*(sz+3)*S), t, font=f, fill=(0,0,0))

# Cliente
box(40,20,640,100, 'Cliente: navegador web', ['SPA React 18 (pages, components, services, AuthContext) · puerto 3000'])
# Servicios externos de mapas
box(760,20,1100,100, 'Servicios externos de mapas', ['Teselas OpenStreetMap · Photon (sugerencias)', 'Nominatim (dirección a partir del punto)'], fill=LIGHT)
arrow(640,60,760,60, dashed=True); label(700,38,['HTTPS'],'c',11.5)
# Servidor
d.rounded_rectangle([40*S,180*S,1080*S,335*S], radius=8*S, fill='white', outline=BLUE, width=int(1.8*S))
t='Servidor de aplicación: Spring Boot 4 sobre Java 21 · puerto 8080'
f=F(13.5,True); w=d.textlength(t,font=f)
d.text((1068*S - w, 188*S), t, font=f, fill=TXT)
xs=[(65,280),(320,535),(575,790),(830,1055)]
names=[('security',['JwtFilter','SecurityConfig']),('application',['controladores REST']),('domain',['servicios, puertos,','DTO y reglas']),('infraestructure',['entidades JPA,','EmbeddingHttpClient'])]
for (a,b),(h,ls) in zip(xs,names):
    box(a,220,b,315,h,ls)
for i in range(3):
    arrow(xs[i][1],267,xs[i+1][0],267)
# cliente -> security
arrow(172,100,172,220); label(182,140,['HTTP/JSON y multipart','Authorization: Bearer JWT'])
# fila inferior
box(40,445,270,560,'Servidor SMTP',['códigos de recuperación','de contraseña'], fill=LIGHT)
box(300,445,540,560,'Disco del servidor',['uploads/ (pets, reports,','sightings, case-messages)'])
box(570,445,815,560,'PostgreSQL 18 + PostGIS',['tablas del modelo de datos','vectores real[1280]'])
box(845,445,1100,560,'ml-service (Python)',['FastAPI · puerto 8000','EfficientNetB0 · DogNet v2','red de etapa de vida'])
arrow(155,335,155,445, dashed=True); label(165,375,['SMTP','(Spring Mail)'],'l',11.5)
arrow(420,335,420,445); label(430,375,['archivos','de imagen'],'l',11.5)
arrow(692,335,692,445); label(702,375,['JDBC','(Spring Data JPA)'],'l',11.5)
arrow(972,335,972,445); label(982,375,['HTTP multipart','/describe, /analyze'],'l',11.5)
img.save('arquitectura.png', dpi=(300,300))
print(img.size)
