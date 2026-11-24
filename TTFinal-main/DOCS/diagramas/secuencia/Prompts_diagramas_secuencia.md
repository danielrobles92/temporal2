# Prompts para los diagramas de secuencia - Plataforma Perreque

Fuente: DOCS/Especificaciones_CU_v1.1.docx (fichas del 28/10/2026), verificadas contra el código.
Uso: copia un prompt completo, pégalo en el asistente de IA, y pega el código PlantUML que devuelva en https://www.plantuml.com/plantuml (o en tu editor de PlantUML) para exportar la imagen.

Diagramas generados: CU-XX.puml (código), CU-XX.png y CU-XX.svg en esta carpeta, y todos juntos en Diagramas_secuencia.docx.

## CU-01. Registrarse en la plataforma

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-01. Registrarse en la plataforma» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-01 Registrarse en la plataforma
Participantes (declaración PlantUML, en este orden):
actor "Usuario general" as U
participant "Interfaz web\n(Registro)" as W
participant "API REST\n(UserController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario no ha iniciado sesión y no existe una cuenta con el mismo correo electrónico (RN-03).
Postcondición: la cuenta queda registrada como Usuario general (activa, sin permiso para publicar) y disponible para iniciar sesión (CU-02).

Flujo principal (en este orden):
1. U -> W: Seleccionar «Regístrate aquí» en la pantalla de inicio de sesión
2. W --> U: Formulario «Crear Cuenta»
3. U -> W: Capturar nombre de usuario, correo, teléfono, contraseña y confirmación; aceptar términos y seleccionar «Crear Cuenta»
4. W -> W: Validar campos (usuario ≥ 3 caracteres, correo válido, teléfono válido, contraseña ≥ 6 con mayúsculas, minúsculas y números, confirmación igual)
5. W -> A: Registrar cuenta (POST /users {username, email, phone, password})
6. A -> A: Forzar el rol USER (el registro público nunca asigna otro rol)
7. A -> DB: Buscar usuario por correo (users)
8. DB --> A: Sin coincidencias
9. A -> A: Cifrar la contraseña (BCrypt)
10. A -> DB: Registrar usuario (INSERT users: rol USER, cuenta activa, sin permiso para publicar)
11. DB --> A: Usuario creado
12. A --> W: 200 Datos de la cuenta
13. W --> U: «Registro completado correctamente. Ya puedes iniciar sesión.» y muestra la pantalla de inicio de sesión

Flujos alternos (insértalos donde se indica):
- Tras el paso 3, break [FA-01-B: no aceptó los términos y condiciones]: W --> U: solicita aceptarlos y no envía el formulario.
- Tras el paso 4, break [FA-01-A: dato faltante o con formato inválido]: W --> U: señala cada campo con su error y conserva los demás datos.
- Tras el paso 8, alt [FA-01-C: el correo ya está registrado]: A --> W: 409 «Este correo ya fue registrado»; W --> U: muestra el error y el enlace «Inicia sesión aquí». else [correo disponible]: pasos 9 a 13.
- Envolviendo los pasos 5 a 12, alt [FA-01-D: no hay conexión o falla el servidor]: W --> U: informa que no se pudo completar el registro y conserva los datos.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-02. Iniciar sesión

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-02. Iniciar sesión» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-02 Iniciar sesión
Participantes (declaración PlantUML, en este orden):
actor "Usuario\n(general, Refugio o Administrador)" as U
participant "Interfaz web\n(Inicio de sesión)" as W
participant "API REST\n(LoginController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor cuenta con una cuenta registrada (CU-01 o CU-36).
Postcondición: existe una sesión activa (token JWT) con los permisos del rol del actor.

Flujo principal (en este orden):
1. U -> W: Acceder a la pantalla de inicio de sesión
2. W --> U: Solicitar correo y contraseña
3. U -> W: Capturar credenciales, marcar opcionalmente «Recordarme» y seleccionar «Iniciar Sesión»
4. W -> W: Validar formato (correo válido, contraseña ≥ 6 caracteres)
5. W -> A: Autenticar (POST /auth/login {email, password, rememberMe})
6. A -> A: Verificar que el correo no esté bloqueado por intentos fallidos (LoginAttemptService)
7. A -> DB: Buscar usuario por correo (users)
8. DB --> A: Datos del usuario
9. A -> A: Verificar que la cuenta esté activa
10. A -> A: Verificar la contraseña (BCrypt)
11. A -> A: Reiniciar el contador de intentos y generar el token JWT (rol, id, permiso para publicar; vigencia 4 h, o 7 días con «Recordarme»)
12. A --> W: 200 {success, token, role, publishingAuthorized}
13. W -> W: Guardar la sesión en el navegador y, si marcó «Recordarme», recordar el correo
14. W --> U: Página de inicio con el menú del rol

Flujos alternos (insértalos donde se indica):
- Antes del paso 3, opt [FA-02-H: marcó «Recordarme» en su acceso anterior]: W --> U: muestra el correo precargado.
- Antes del paso 3, opt [FA-02-G: olvidó su contraseña]: ref CU-43 Recuperar contraseña.
- Tras el paso 4, break [FA-02-A: formato inválido]: W --> U: señala el campo con el error.
- Tras el paso 6, alt [FA-02-C: cinco intentos fallidos, bloqueo de 15 minutos]: A --> W: «Demasiados intentos fallidos. Intenta de nuevo en unos minutos.»; W --> U: muestra el mensaje.
- Tras el paso 8, alt [FA-02-B: correo no registrado]: A -> A registrar intento fallido; A --> W: «Correo o contraseña incorrectos» (mensaje genérico).
- Tras el paso 9, alt [FA-02-D: cuenta desactivada por el Administrador]: A --> W: «Cuenta desactivada».
- Tras el paso 10, alt [FA-02-B: contraseña incorrecta]: A -> A registrar intento fallido; A --> W: «Correo o contraseña incorrectos».
- Envolviendo los pasos 5 a 12, alt [FA-02-E: sin conexión con el servidor]: W --> U: informa la falla e invita a intentarlo de nuevo.
- Al final, nota [FA-02-F]: al vencer el token, la interfaz cierra la sesión y pide iniciar sesión de nuevo.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-03. Consultar perros en adopción

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-03. Consultar perros en adopción» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-03 Consultar perros en adopción
Participantes (declaración PlantUML, en este orden):
actor "Usuario general" as U
participant "Interfaz web\n(Adopción)" as W
participant "API REST\n(PetsController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión.
Postcondición: el usuario consulta la información de los perros en adopción sin modificarla.

Flujo principal (en este orden):
1. U -> W: Acceder a la sección «Adopción»
2. W -> A: Consultar publicaciones (GET /pets?size=9999)
3. A -> DB: Consultar perros con fotos y responsable (pets, pet_images, users)
4. DB --> A: Publicaciones
5. A --> W: 200 Lista de perros
6. W -> W: Aplicar el filtro por omisión (estado Disponible)
7. W --> U: Carrusel con fotografía, nombre, sexo, edad, raza y ubicación
8. U -> W: Recorrer el carrusel con «Anterior» y «Siguiente» y seleccionar «Ver detalle»
9. W --> U: Detalle: fotografías, raza, sexo, edad, tamaño, color, ubicación, quién lo publicó y descripción

Flujos alternos (insértalos donde se indica):
- Tras el paso 6, alt [FA-03-A: no hay perros registrados]: W --> U: «No hay perros disponibles.».
- Envolviendo los pasos 2 a 5, alt [FA-03-B: error al consultar]: W --> U: muestra el mensaje de error en lugar del listado.
- Tras el paso 7, opt [FA-03-C: el usuario aplica filtros]: ref CU-04 Filtrar publicaciones.
- Tras el paso 9, opt [FA-03-D: solicitar la adopción]: ref CU-05 Realizar solicitud de adopción.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-04. Filtrar publicaciones

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-04. Filtrar publicaciones» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-04 Filtrar publicaciones
Participantes (declaración PlantUML, en este orden):
actor "Usuario general" as U
participant "Interfaz web\n(Adopción)" as W

Precondición: el usuario está en la sección «Adopción» con las publicaciones ya consultadas (CU-03).
Postcondición: el listado muestra solo los perros que cumplen los criterios seleccionados.
Indicación especial: el filtrado se hace en la interfaz sobre los datos ya cargados; no hay mensajes hacia la API ni hacia la base de datos. Inicia con ref CU-03 Consultar perros en adopción.

Flujo principal (en este orden):
1. W --> U: Panel «Filtros de búsqueda»
2. U -> W: Capturar o seleccionar criterios: nombre o raza, estado (disponibles o adoptados), sexo, tamaño (pequeño, mediano o grande), edad aproximada (cachorro 0-1, joven 2-3, adulto 4-7, senior 8+) y ubicación
3. U -> W: Seleccionar «Aplicar filtros»
4. W -> W: loop [para cada perro consultado]: comparar con todos los criterios
5. W -> W: Regresar el carrusel al inicio
6. W --> U: Perros que cumplen todos los criterios

Flujos alternos (insértalos donde se indica):
- Tras el paso 4, alt [FA-04-A: ningún perro cumple]: W --> U: «No se encontraron mascotas con esos filtros.» y sugiere ajustar los criterios.
- Tras el paso 2, opt [FA-04-B: selecciona «Limpiar»]: W -> W restablecer filtros; W --> U: perros disponibles.
- Nota junto al paso 4 [FA-04-C y FA-04-D]: las publicaciones inactivas nunca se muestran; al filtrar por tamaño se excluyen los perros sin tamaño registrado.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-05. Realizar solicitud de adopción

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-05. Realizar solicitud de adopción» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-05 Realizar solicitud de adopción
Participantes (declaración PlantUML, en este orden):
actor "Usuario general" as U
participant "Interfaz web\n(Adopción)" as W
participant "API REST\n(AdoptionRequestController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión y existe un perro disponible publicado por otro usuario.
Postcondición: la solicitud queda pendiente y el responsable de la publicación recibe una notificación (CU-15).

Flujo principal (en este orden):
1. ref CU-03: el usuario consulta el detalle de un perro
2. U -> W: Seleccionar «Solicitar adopción»
3. W --> U: Formulario con nombre, correo y teléfono precargados y campo de mensaje
4. U -> W: Revisar datos, escribir mensaje (opcional) y seleccionar «Enviar solicitud»
5. W -> W: Verificar nombre y correo obligatorios y que el perro esté disponible
6. W -> A: Registrar solicitud (POST /adoption-requests {petId, contactName, contactEmail, contactPhone, message})
7. A -> A: Tomar al solicitante del token JWT (RN-01)
8. A -> DB: ¿Existe una solicitud del usuario para el perro? (adoption_requests)
9. DB --> A: No existe
10. A -> DB: Consultar el perro (pets)
11. DB --> A: Responsable y estado del perro
12. A -> A: Verificar que no sea su propia publicación y que el estado sea Disponible
13. A -> DB: Registrar solicitud (INSERT adoption_requests, estado PENDING)
14. DB --> A: Solicitud registrada
15. A ->> DB: Registrar notificación para el responsable «Nueva solicitud de adopción para [perro]» (INSERT notifications)
16. A --> W: 200 Solicitud
17. W --> U: «Solicitud enviada correctamente» y cierra el detalle

Flujos alternos (insértalos donde se indica):
- Antes del paso 2, alt [FA-05-A / FA-05-B: el perro no está disponible o la publicación es propia]: W --> U: la opción «Solicitar adopción» aparece deshabilitada (break).
- Tras el paso 4, opt [FA-05-F: selecciona «Cancelar»]: W --> U: oculta el formulario sin enviar.
- Tras el paso 5, break [FA-05-C: falta nombre o correo, o correo inválido]: W --> U: solicita corregirlo.
- Tras el paso 9, alt [FA-05-D: ya existe una solicitud]: A --> W: 400 «Ya realizaste una solicitud para este perro»; W --> U: muestra el mensaje.
- Tras el paso 12, alt [FA-05-A: el perro dejó de estar disponible]: A --> W: 400 «Este perro ya no está disponible para adopción».
- Envolviendo los pasos 6 a 16, alt [FA-05-E: error del servidor]: W --> U: informa la falla y conserva los datos.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-06. Consultar solicitudes realizadas

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-06. Consultar solicitudes realizadas» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-06 Consultar solicitudes realizadas
Participantes (declaración PlantUML, en este orden):
actor "Usuario general" as U
participant "Interfaz web\n(Solicitudes)" as W
participant "API REST\n(AdoptionRequestController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión.
Postcondición: el usuario conoce el estado de sus solicitudes sin modificarlas.

Flujo principal (en este orden):
1. U -> W: Seleccionar «Solicitudes» en su menú
2. W -> A: Consultar solicitudes del usuario (GET /adoption-requests/user/{userId})
3. A -> DB: Consultar solicitudes con el perro y su responsable (adoption_requests, pets, users)
4. DB --> A: Solicitudes
5. A --> W: 200 Lista de solicitudes
6. W --> U: Tarjetas con fotografía y nombre del perro, responsable, fecha, mensaje y estado («Pendiente», «En contacto», «Adoptado» o «Cancelada»)
7. U -> W: Seleccionar el filtro «realizadas» o «pendientes»
8. W --> U: Listado filtrado
9. U -> W: Seleccionar una solicitud
10. W --> U: Detalle: estado, fecha y hora, publicador, datos de contacto enviados, mensaje y notas de la decisión

Flujos alternos (insértalos donde se indica):
- Tras el paso 8, alt [FA-06-A: no hay solicitudes para el filtro]: W --> U: «No hay solicitudes para este filtro».
- Envolviendo los pasos 2 a 5, alt [FA-06-B: error al consultar]: W --> U: muestra el mensaje de error.
- Tras el paso 10, opt [FA-06-C: la solicitud está pendiente]: ref CU-26 Cancelar solicitud de adopción.
- Tras el paso 10, opt [FA-06-D: la solicitud está «En contacto»]: ref CU-28 Dar seguimiento a casos.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-07. Registrar reporte de perro extraviado

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-07. Registrar reporte de perro extraviado» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-07 Registrar reporte de perro extraviado
Participantes (declaración PlantUML, en este orden):
actor "Usuario general" as U
participant "Interfaz web\n(Publicar Anuncio)" as W
participant "OpenStreetMap\n(Nominatim)" as MAP
participant "API REST\n(ReportsController)" as A
participant "Servicio de IA\n(ml-service DogNet v2)" as IA
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión.
Postcondición: el reporte queda publicado en «Mascotas Perdidas» con sus fotografías y disponible para la búsqueda de coincidencias.

Flujo principal (en este orden):
1. U -> W: Seleccionar «Publicar Anuncio» y el tipo «Perro perdido»
2. U -> W: Capturar nombre, raza, sexo, color y ubicación (alcaldía) y, de forma opcional, edad, referencia o colonia, descripción y teléfono
3. U -> W: Marcar el punto en el mapa (clic, arrastrar el marcador o «Mi ubicación»)
4. W -> MAP: Obtener la dirección del punto (GET /reverse lat, lon)
5. MAP --> W: Calle, colonia y alcaldía
6. W --> U: Completar referencia o colonia y alcaldía
7. U -> W: Adjuntar de 1 a 4 fotografías y elegir la principal
8. loop [para cada fotografía]: ref CU-41 Analizar fotografía con la red neuronal (W --> U muestra los atributos detectados)
9. U -> W: Seleccionar «Publicar Anuncio»
10. W -> W: Validar datos obligatorios y que todas las fotos sean de perro
11. W -> A: Registrar reporte (POST /reports multipart: report + images[1..4], tipo LOST)
12. A -> IA: Verificar que cada foto sea de un perro (POST /describe)
13. IA --> A: Todas son perros
14. A -> A: Guardar los archivos de las fotos
15. A -> DB: Registrar reporte (INSERT lost_pets: estado OPEN, foto principal y lista de fotos)
16. DB --> A: reportId
17. loop [para cada fotografía]: A -> IA obtener vector de 1,280 valores y raza (POST /analyze); IA --> A vector y raza; A -> DB guardar (INSERT report_image_embeddings)
18. A --> W: 200 Reporte registrado
19. W --> U: «Reporte publicado correctamente»
20. ref CU-31 Consultar coincidencias sugeridas

Flujos alternos (insértalos donde se indica):
- Tras el paso 3, opt [FA-07-D: busca una dirección]: U -> W escribe la dirección y selecciona «Buscar»; W -> MAP GET /search (limitado a la Ciudad de México); MAP --> W resultados; alt [sin resultados] W --> U «No se encontró esa dirección en la Ciudad de México…»; else U -> W elige un resultado.
- Tras el paso 5, alt [FA-07-E: no se obtiene la dirección]: W --> U: conserva el punto y permite escribir la referencia a mano.
- Tras el paso 7, alt [FA-07-B: una foto supera 3 MB]: W --> U: «Cada imagen no debe superar 3MB» y la rechaza.
- Dentro del paso 8, alt [FA-07-C: la foto no es de un perro]: W --> U: indica el motivo y no permite publicar hasta quitarla.
- Tras el paso 10, break [FA-07-A: falta un dato obligatorio, la edad no es número o no hay fotos]: W --> U: señala el campo.
- Tras el paso 13, alt [FA-07-C: el servicio de IA detecta una foto que no es de perro]: A --> W: 422 con el motivo; W --> U: muestra el motivo.
- Envolviendo los pasos 11 a 18, alt [FA-07-F: error al almacenar]: W --> U: informa la falla y conserva el formulario.
- Tras el paso 2, opt [FA-07-G: selecciona «Cancelar»]: W --> U: regresa a la pantalla anterior sin registrar.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-08. Registrar reporte de perro encontrado

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-08. Registrar reporte de perro encontrado» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-08 Registrar reporte de perro encontrado
Participantes (declaración PlantUML, en este orden):
actor "Usuario general / Refugio" as U
participant "Interfaz web\n(Publicar Anuncio)" as W
participant "OpenStreetMap\n(Nominatim)" as MAP
participant "API REST\n(ReportsController)" as A
participant "Servicio de IA\n(ml-service DogNet v2)" as IA
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor (Usuario general o Refugio) ha iniciado sesión.
Postcondición: el reporte queda publicado en «Mascotas Perdidas»; quien crea que es su perro puede enviar un aviso (CU-30).

Flujo principal (en este orden):
1. U -> W: Seleccionar «Publicar Anuncio» y el tipo «Perro encontrado»
2. U -> W: Capturar la información observada: un nombre para identificarlo, raza, sexo, color y ubicación (alcaldía) y, de forma opcional, edad, referencia o colonia, descripción y teléfono
3. U -> W: Marcar en el mapa el punto donde lo encontró (clic, arrastrar el marcador o «Mi ubicación»)
4. W -> MAP: Obtener la dirección del punto (GET /reverse lat, lon)
5. MAP --> W: Calle, colonia y alcaldía
6. W --> U: Completar referencia o colonia y alcaldía
7. U -> W: Adjuntar de 1 a 4 fotografías y elegir la principal
8. loop [para cada fotografía]: ref CU-41 Analizar fotografía con la red neuronal
9. U -> W: Seleccionar «Publicar Anuncio»
10. W -> W: Validar datos obligatorios y que todas las fotos sean de perro
11. W -> A: Registrar reporte (POST /reports multipart: report + images[1..4], tipo FOUND)
12. A -> IA: Verificar que cada foto sea de un perro (POST /describe)
13. IA --> A: Todas son perros
14. A -> A: Guardar los archivos de las fotos
15. A -> DB: Registrar reporte (INSERT lost_pets: estado OPEN, foto principal y lista de fotos)
16. DB --> A: reportId
17. loop [para cada fotografía]: A -> IA POST /analyze; IA --> A vector de 1,280 valores y raza; A -> DB INSERT report_image_embeddings
18. A --> W: 200 Reporte registrado
19. W --> U: «Reporte publicado correctamente»
20. ref CU-31 Consultar coincidencias sugeridas

Flujos alternos (insértalos donde se indica):
- Tras el paso 3, opt [FA-08-D: busca una dirección]: W -> MAP GET /search; MAP --> W resultados; alt [sin resultados] W --> U informa que no se encontró en la Ciudad de México.
- Tras el paso 5, alt [FA-08-E: no se obtiene la dirección]: W --> U: conserva el punto y permite escribir la referencia a mano.
- Tras el paso 7, alt [FA-08-B: una foto supera 3 MB]: W --> U: «Cada imagen no debe superar 3MB».
- Dentro del paso 8, alt [FA-08-C: la foto no es de un perro]: W --> U: indica el motivo y bloquea la publicación.
- Tras el paso 10, break [FA-08-A: falta un dato obligatorio o no hay fotos]: W --> U: señala el campo.
- Tras el paso 13, alt [FA-08-C: alguna foto no es de perro]: A --> W: 422 con el motivo.
- Envolviendo los pasos 11 a 18, alt [FA-08-F: error al almacenar]: W --> U: informa la falla y conserva el formulario.
- Tras el paso 2, opt [FA-08-G: selecciona «Cancelar»]: W --> U: regresa sin registrar.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-09. Solicitar autorización para publicar perro en adopción

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-09. Solicitar autorización para publicar perro en adopción» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-09 Solicitar autorización para publicar perro en adopción
Participantes (declaración PlantUML, en este orden):
actor "Usuario general" as U
participant "Interfaz web\n(Mi Perfil)" as W
participant "API REST\n(AuthorizationController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión como Usuario general, sin autorización vigente ni solicitud pendiente.
Postcondición: la solicitud queda pendiente de revisión por el Administrador (CU-22).

Flujo principal (en este orden):
1. U -> W: Acceder a «Mi Perfil»
2. W -> A: Consultar sus solicitudes de autorización (GET /publication-authorizations/user/{userId})
3. A -> DB: Consultar solicitudes (publication_authorization_requests)
4. DB --> A: Solicitudes
5. A --> W: 200 Lista
6. W -> W: Revisar el estado de la última solicitud y el permiso de la sesión
7. W --> U: Opción «Solicitar permiso para publicar»
8. U -> W: Seleccionar la opción
9. W -> A: Registrar solicitud (POST /publication-authorizations {userId, reason})
10. A -> DB: Consultar el usuario y si tiene solicitudes pendientes (users, publication_authorization_requests)
11. DB --> A: Sin autorización ni solicitud pendiente
12. A -> DB: Registrar solicitud (INSERT publication_authorization_requests, estado PENDING, motivo «Deseo publicar perros en adopción dentro de la plataforma.»)
13. DB --> A: Solicitud registrada
14. A --> W: 200 Solicitud
15. W --> U: «Solicitud de autorización enviada» y la opción cambia a «Autorización pendiente» (deshabilitada)

Flujos alternos (insértalos donde se indica):
- Antes del paso 1, nota [FA-09-A]: también se llega desde «Solicitar autorización para publicar» en «Mis Anuncios» o desde el aviso del formulario «Publicar Anuncio».
- Tras el paso 6, alt [FA-09-B: tiene una solicitud pendiente]: W --> U: la opción aparece como «Autorización pendiente», deshabilitada (break). else [FA-09-C: ya autorizado, o es Refugio o Administrador]: W --> U: no muestra la opción (break). else [FA-09-D: la última fue rechazada o no tiene solicitudes]: continúa en el paso 7.
- Tras el paso 11, alt [FA-09-E: ya tiene autorización o solicitud pendiente]: A --> W: 400 «El usuario ya cuenta con autorización o tiene una solicitud pendiente».
- Envolviendo los pasos 9 a 14, alt [FA-09-F: error al registrar]: W --> U: informa la falla.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-10. Publicar perro en adopción autorizado

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-10. Publicar perro en adopción autorizado» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-10 Publicar perro en adopción autorizado
Participantes (declaración PlantUML, en este orden):
actor "Usuario general\n(autorizado)" as U
participant "Interfaz web\n(Publicar Anuncio)" as W
participant "OpenStreetMap\n(Nominatim)" as MAP
participant "API REST\n(PetsController)" as A
participant "Servicio de IA\n(ml-service DogNet v2)" as IA
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión como Usuario general con autorización vigente otorgada por el Administrador (CU-22).
Postcondición: la publicación queda disponible en «Adopción» y sus fotografías se usan como candidatas en la búsqueda de coincidencias.

Flujo principal (en este orden):
1. U -> W: Seleccionar «Publicar Anuncio»
2. W -> W: Verificar en la sesión el permiso para publicar
3. W --> U: Formulario con el tipo «Perro en adopción» seleccionado
4. U -> W: Capturar nombre, raza, sexo, color, tamaño (pequeño, mediano o grande) y ubicación (alcaldía) y, de forma opcional, edad, referencia o colonia y descripción
5. U -> W: Marcar el punto en el mapa
6. W -> MAP: Obtener la dirección del punto (GET /reverse)
7. MAP --> W: Calle, colonia y alcaldía
8. W --> U: Completar referencia o colonia y alcaldía
9. U -> W: Adjuntar de 1 a 4 fotografías y elegir la principal
10. loop [para cada fotografía]: ref CU-41 Analizar fotografía con la red neuronal
11. U -> W: Seleccionar «Usar datos detectados (raza, color y tamaño)» (opcional) y capturar la cartilla de salud (opcional)
12. U -> W: Seleccionar «Publicar Anuncio»
13. W -> W: Validar datos obligatorios, tamaño y fotos
14. W -> A: Registrar publicación (POST /pets multipart: pet + images[1..4], con token JWT)
15. A -> A: Verificar en el token el rol PUBLISHER (autorización vigente)
16. A -> IA: Verificar que cada foto sea de un perro (POST /describe)
17. IA --> A: Todas son perros
18. A -> A: Guardar los archivos de las fotos
19. A -> DB: Registrar perro (INSERT pets estado AVAILABLE con tamaño, pet_images y pet_vaccines)
20. DB --> A: petId
21. loop [para cada fotografía]: A -> IA POST /analyze; IA --> A vector de 1,280 valores y raza; A -> DB INSERT pet_image_embeddings
22. A --> W: 200 Publicación registrada
23. W --> U: «Anuncio publicado correctamente» y muestra «Adopción»

Flujos alternos (insértalos donde se indica):
- Tras el paso 2, alt [FA-10-A: sin autorización vigente]: W --> U: el tipo «Perro en adopción» aparece deshabilitado con el aviso para solicitarla (ref CU-09) (break).
- Tras el paso 7, alt [FA-10-E: no se obtiene la dirección]: W --> U: conserva el punto y permite escribir la referencia.
- Tras el paso 9, alt [FA-10-C: una foto supera 3 MB]: W --> U: «Cada imagen no debe superar 3MB».
- Dentro del paso 10, alt [FA-10-D: la foto no es de un perro]: W --> U: indica el motivo y bloquea la publicación.
- Tras el paso 13, break [FA-10-B: falta un dato obligatorio o no hay fotos]: W --> U: señala el campo.
- Tras el paso 15, alt [el token no tiene permiso para publicar]: A --> W: 403 (break).
- Tras el paso 17, alt [FA-10-D: alguna foto no es de perro]: A --> W: 422 con el motivo.
- Envolviendo los pasos 14 a 22, alt [FA-10-F: error al almacenar]: W --> U: informa la falla y conserva el formulario.
- Tras el paso 4, opt [FA-10-G: selecciona «Cancelar»]: W --> U: regresa sin registrar.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-11. Publicar perro en adopción

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-11. Publicar perro en adopción» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-11 Publicar perro en adopción
Participantes (declaración PlantUML, en este orden):
actor "Refugio" as U
participant "Interfaz web\n(Publicar Anuncio)" as W
participant "OpenStreetMap\n(Nominatim)" as MAP
participant "API REST\n(PetsController)" as A
participant "Servicio de IA\n(ml-service DogNet v2)" as IA
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el Refugio ha iniciado sesión con una cuenta activa de rol Refugio, creada o asignada por el Administrador (CU-36 o CU-20).
Postcondición: la publicación queda disponible en «Adopción» y asociada al Refugio, que recibe las solicitudes (CU-15).

Flujo principal (en este orden):
1. U -> W: Seleccionar «Publicar Anuncio»
2. W --> U: Formulario con el tipo «Perro en adopción» seleccionado
3. U -> W: Capturar nombre, raza, sexo, color, tamaño y ubicación (alcaldía) y, de forma opcional, edad, referencia o colonia y descripción
4. U -> W: Marcar el punto en el mapa
5. W -> MAP: Obtener la dirección del punto (GET /reverse)
6. MAP --> W: Calle, colonia y alcaldía
7. W --> U: Completar referencia o colonia y alcaldía
8. U -> W: Adjuntar de 1 a 4 fotografías y elegir la principal
9. loop [para cada fotografía]: ref CU-41 Analizar fotografía con la red neuronal
10. U -> W: «Usar datos detectados (raza, color y tamaño)» (opcional) y cartilla de salud (opcional)
11. U -> W: Seleccionar «Publicar Anuncio»
12. W -> W: Validar datos obligatorios, tamaño y fotos
13. W -> A: Registrar publicación (POST /pets multipart: pet + images[1..4], con token JWT)
14. A -> A: Verificar en el token el rol SHELTER, que otorga el permiso PUBLISHER
15. A -> IA: Verificar que cada foto sea de un perro (POST /describe)
16. IA --> A: Todas son perros
17. A -> A: Guardar los archivos de las fotos
18. A -> DB: Registrar perro (INSERT pets estado AVAILABLE, pet_images, pet_vaccines)
19. DB --> A: petId
20. loop [para cada fotografía]: A -> IA POST /analyze; IA --> A vector y raza; A -> DB INSERT pet_image_embeddings
21. A --> W: 200 Publicación registrada
22. W --> U: «Anuncio publicado correctamente» y muestra «Adopción»

Flujos alternos (insértalos donde se indica):
- Tras el paso 6, alt [FA-11-D: no se obtiene la dirección]: W --> U: conserva el punto y permite escribir la referencia.
- Tras el paso 8, alt [FA-11-B: una foto supera 3 MB]: W --> U: «Cada imagen no debe superar 3MB».
- Dentro del paso 9, alt [FA-11-C: la foto no es de un perro]: W --> U: indica el motivo y bloquea la publicación.
- Tras el paso 12, break [FA-11-A: falta un dato obligatorio o no hay fotos]: W --> U: señala el campo.
- Tras el paso 16, alt [FA-11-C: alguna foto no es de perro]: A --> W: 422 con el motivo.
- Envolviendo los pasos 13 a 21, alt [FA-11-E: error al almacenar]: W --> U: informa la falla y conserva el formulario.
- Tras el paso 3, opt [FA-11-F: selecciona «Cancelar»]: W --> U: regresa sin registrar.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-12. Gestionar perros en adopción

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-12. Gestionar perros en adopción» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-12 Gestionar perros en adopción
Participantes (declaración PlantUML, en este orden):
actor "Responsable de la publicación\n(Refugio o Usuario general autorizado)" as U
participant "Interfaz web\n(Mis Anuncios)" as W
participant "API REST\n(PetsController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor ha iniciado sesión como Refugio o como Usuario general con autorización vigente.
Postcondición: el actor consulta sus publicaciones y puede administrarlas.

Flujo principal (en este orden):
1. U -> W: Acceder a «Mis Anuncios» y seleccionar la pestaña «Publicaciones de adopción»
2. W -> A: Consultar sus publicaciones (GET /pets/owner/{ownerId})
3. A -> DB: Consultar perros del responsable (pets, pet_images)
4. DB --> A: Publicaciones
5. A --> W: 200 Lista
6. W --> U: Cada publicación con fotografía, nombre, estado (Disponible, Adoptado o Inactivo), raza y ubicación
7. U -> W: Seleccionar una publicación
8. W --> U: Detalle: fotografías, raza, sexo, edad, tamaño, color, ubicación, estado y descripción
9. alt [«Editar»]: ref CU-13 Editar publicación. else [«Desactivar» o «Eliminar»]: ref CU-14 Eliminar o desactivar publicación

Flujos alternos (insértalos donde se indica):
- Tras el paso 5, alt [FA-12-A: no tiene publicaciones]: W --> U: «No tienes publicaciones de adopción.» y la opción «Publicar» (ref CU-10 o CU-11).
- Envolviendo los pasos 2 a 5, alt [FA-12-B: error al consultar]: W --> U: «No se pudieron cargar tus anuncios».
- Tras el paso 6, opt [FA-12-C: no tiene autorización para publicar]: W --> U: muestra «Solicitar autorización para publicar» en lugar de «Publicar» y lo dirige a su perfil (ref CU-09).

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-13. Editar publicación

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-13. Editar publicación» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-13 Editar publicación
Participantes (declaración PlantUML, en este orden):
actor "Responsable de la publicación" as U
participant "Interfaz web\n(Mis Anuncios)" as W
participant "OpenStreetMap\n(Nominatim)" as MAP
participant "API REST\n(PetsController)" as A
participant "Servicio de IA\n(ml-service DogNet v2)" as IA
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor es el responsable de la publicación o el Administrador (RN-09) y la publicación existe (CU-12).
Postcondición: la publicación queda actualizada; si su estado cambia a Adoptado o Inactivo, deja de mostrarse como disponible.

Flujo principal (en este orden):
1. U -> W: Seleccionar «Editar» en una publicación
2. W --> U: Formulario «Editar publicación» con los datos actuales
3. U -> W: Modificar nombre, raza, color, edad, tamaño, estado (Disponible, Adoptado o Inactivo), ubicación, referencia o colonia y descripción
4. U -> W: Ajustar el punto en el mapa (opcional)
5. W -> MAP: Obtener la dirección del punto (GET /reverse)
6. MAP --> W: Calle, colonia y alcaldía
7. U -> W: Seleccionar hasta 4 fotografías nuevas (opcional; reemplazan a las actuales)
8. U -> W: Seleccionar «Guardar cambios»
9. W -> A: Actualizar publicación (PUT /pets/updatePet/{id}; JSON, o multipart si hay fotos nuevas)
10. A -> DB: Consultar la publicación (pets)
11. DB --> A: Responsable de la publicación
12. A -> A: Verificar que sea el responsable o el Administrador (RN-09)
13. opt [hay fotos nuevas]: A -> IA verificar que sean perros (POST /describe); IA --> A resultado; A -> A guardar los archivos
14. A -> DB: Actualizar publicación (UPDATE pets; reemplaza pet_images si hay fotos nuevas)
15. DB --> A: Publicación actualizada
16. opt [hay fotos nuevas]: loop [para cada foto] A -> IA POST /analyze; IA --> A vector y raza; A -> DB INSERT pet_image_embeddings
17. A --> W: 200 Publicación
18. W --> U: «Publicación actualizada»

Flujos alternos (insértalos donde se indica):
- Tras el paso 7, alt [FA-13-A: más de 4 fotos o alguna de más de 5 MB]: W --> U: «Selecciona máximo 4 fotos» (conserva las 4 primeras) o «Cada foto debe pesar menos de 5 MB».
- Nota en el paso 7 [FA-13-B]: si no elige fotos nuevas, se conservan las actuales.
- Tras el paso 8, opt [FA-13-E: selecciona «Cancelar»]: W --> U: cierra el formulario sin guardar (break).
- Tras el paso 12, alt [FA-13-D: no es el responsable ni el Administrador]: A --> W: 403 «No autorizado».
- Dentro del paso 13, alt [FA-13-C: una foto nueva no es de perro]: A --> W: 422 con el motivo; W --> U: muestra el motivo.
- Envolviendo los pasos 9 a 17, alt [FA-13-F: error al guardar]: W --> U: «No se pudo actualizar la publicación» y conserva el formulario.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-14. Eliminar o desactivar publicación

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-14. Eliminar o desactivar publicación» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-14 Eliminar o desactivar publicación
Participantes (declaración PlantUML, en este orden):
actor "Responsable de la publicación" as U
participant "Interfaz web\n(Mis Anuncios)" as W
participant "API REST\n(PetsController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor es el responsable de la publicación o el Administrador (RN-09) y la publicación existe (CU-12).
Postcondición: la publicación queda eliminada o inactiva según la acción elegida.

Flujo principal (en este orden):
1. U -> W: Seleccionar «Eliminar» en una publicación
2. W --> U: Confirmación «Esta acción eliminará definitivamente la publicación de adopción.»
3. U -> W: Seleccionar «Eliminar definitivamente»
4. W -> A: Eliminar publicación (DELETE /pets/{id})
5. A -> DB: Consultar la publicación (pets)
6. DB --> A: Responsable de la publicación
7. A -> A: Verificar que sea el responsable o el Administrador
8. A -> DB: Eliminar (DELETE pets; en cascada pet_images, pet_image_embeddings, pet_vaccines y adoption_requests)
9. DB --> A: Eliminada
10. A --> W: 200
11. W --> U: «Publicación eliminada» y actualiza el listado

Flujos alternos (insértalos donde se indica):
- En lugar de los pasos 1 a 11, alt [FA-14-A: selecciona «Desactivar»]: W -> A PATCH /pets/{id}/deactivate; A -> DB consultar; A -> A verificar responsable o Administrador; A -> DB UPDATE pets SET status = INACTIVE; A --> W 200; W --> U «Publicación desactivada». Nota: deja de mostrarse en «Adopción» y en la búsqueda de coincidencias.
- Nota [FA-14-B]: si la publicación ya está inactiva, la opción «Desactivar» no se muestra; se reactiva cambiando su estado a Disponible (ref CU-13).
- Tras el paso 2, alt [FA-14-C: selecciona «Cancelar»]: W --> U: conserva la publicación sin cambios (break).
- Tras el paso 7, alt [no es el responsable ni el Administrador]: A --> W: 403 «No autorizado».
- Envolviendo los pasos 4 a 10, alt [FA-14-D: error al eliminar o desactivar]: W --> U: informa la falla y conserva la publicación.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-15. Revisar solicitudes de adopción

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-15. Revisar solicitudes de adopción» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-15 Revisar solicitudes de adopción
Participantes (declaración PlantUML, en este orden):
actor "Responsable de la publicación\n(Refugio o Usuario general autorizado)" as U
participant "Interfaz web\n(Solicitudes)" as W
participant "API REST\n(AdoptionRequestController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor ha iniciado sesión como Refugio o como Usuario general con autorización vigente, y existe al menos una solicitud sobre sus publicaciones (CU-05).
Postcondición: el actor conoce las solicitudes recibidas y su estado.

Flujo principal (en este orden):
1. U -> W: Seleccionar «Solicitudes» en su menú o la notificación de nueva solicitud (ref CU-27)
2. W -> W: Verificar que puede revisar solicitudes (rol Refugio, Administrador o permiso para publicar)
3. W -> A: Consultar solicitudes recibidas (GET /adoption-requests/owner/{ownerId})
4. A -> DB: Consultar los perros del responsable (pets)
5. DB --> A: Identificadores de sus perros
6. A -> DB: Consultar las solicitudes de esos perros (adoption_requests)
7. DB --> A: Solicitudes
8. A --> W: 200 Lista
9. U -> W: Seleccionar el filtro «recibidas»
10. W --> U: Cada solicitud con el perro, solicitante, fecha, mensaje, correo, teléfono y estado
11. U -> W: Seleccionar una solicitud
12. W --> U: Detalle: estado, fecha y hora, solicitante, correo, teléfono, mensaje y notas de la decisión

Flujos alternos (insértalos donde se indica):
- Tras el paso 10, alt [FA-15-A: no hay solicitudes para el filtro]: W --> U: «No hay solicitudes para este filtro».
- Envolviendo los pasos 3 a 8, alt [FA-15-B: error al consultar]: W --> U: muestra el mensaje de error.
- Tras el paso 12, opt [FA-15-C: la solicitud está pendiente]: alt [«Contactar»] ref CU-16 Aprobar solicitud y contactar al adoptante; else [«Cancelar»] ref CU-17 Rechazar solicitud de adopción.
- Nota [FA-15-D]: si el solicitante cancela su solicitud pendiente (CU-26), deja de aparecer en el listado.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-16. Aprobar solicitud y contactar al adoptante

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-16. Aprobar solicitud y contactar al adoptante» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-16 Aprobar solicitud y contactar al adoptante
Participantes (declaración PlantUML, en este orden):
actor "Responsable de la publicación" as U
participant "Interfaz web\n(Solicitudes)" as W
participant "API REST\n(CasesController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor es el responsable de la publicación (Refugio o Usuario general autorizado) y existe una solicitud pendiente.
Postcondición: la solicitud queda «En contacto» (APPROVED) y existe un caso de adopción entre el responsable y el solicitante.

Flujo principal (en este orden):
1. U -> W: Seleccionar «Contactar» en una solicitud pendiente
2. ref CU-35 Consultar recomendaciones por raza (la interfaz muestra el perfil de la raza del perro)
3. U -> W: Seleccionar «Abrir caso y contactar»
4. W -> A: Abrir caso de adopción (POST /cases/adoption/{requestId})
5. A -> DB: ¿Existe un caso para la solicitud? (cases)
6. DB --> A: No existe
7. A -> DB: Consultar la solicitud y el perro (adoption_requests, pets)
8. DB --> A: Solicitud y perro
9. A -> DB: Crear caso (INSERT cases: tipo ADOPTION, estado OPEN, responsable y solicitante)
10. DB --> A: caseId
11. A -> DB: Cambiar la solicitud a APPROVED con la nota CONTACT_CASE_OPENED (UPDATE adoption_requests)
12. A -> DB: Registrar el mensaje del solicitante como primer mensaje del caso (INSERT case_messages)
13. A --> W: 200 Caso
14. W --> U: «Caso de adopción abierto» y lo dirige al caso
15. ref CU-28 Dar seguimiento a casos

Flujos alternos (insértalos donde se indica):
- Antes del paso 1, alt [FA-16-A: no hay solicitudes para el filtro]: W --> U: «No hay solicitudes para este filtro» (break).
- Tras el paso 2, alt [FA-16-B: selecciona «Volver»]: W --> U: cierra las recomendaciones; la solicitud sigue pendiente (break).
- Tras el paso 6, alt [FA-16-C: ya existe un caso]: A --> W: 200 el caso existente; W --> U: abre el caso existente.
- Envolviendo los pasos 4 a 13, alt [FA-16-D: error al abrir el caso]: W --> U: «No se pudo abrir el caso de adopción»; la solicitud sigue pendiente.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-17. Rechazar solicitud de adopción

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-17. Rechazar solicitud de adopción» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-17 Rechazar solicitud de adopción
Participantes (declaración PlantUML, en este orden):
actor "Responsable de la publicación" as U
participant "Interfaz web\n(Solicitudes)" as W
participant "API REST\n(AdoptionRequestController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor es el responsable de la publicación y existe una solicitud pendiente.
Postcondición: la solicitud queda «Cancelada» (REJECTED) y el solicitante recibe una notificación.

Flujo principal (en este orden):
1. U -> W: Seleccionar «Cancelar» en una solicitud pendiente
2. W -> A: Decidir solicitud (PATCH /adoption-requests/{id}/decision {status: REJECTED, notes: CANCELLED_BY_OWNER})
3. A -> DB: Consultar la solicitud y el perro (adoption_requests, pets)
4. DB --> A: Solicitud y responsable del perro
5. A -> A: Verificar que sea el responsable de la publicación o el Administrador (RN-10)
6. A -> DB: Cambiar el estado a REJECTED (UPDATE adoption_requests)
7. DB --> A: Actualizada
8. A ->> DB: Notificar al solicitante «Tu solicitud de adopción fue rechazada» (INSERT notifications)
9. A --> W: 200 Solicitud
10. W -> A: Recargar solicitudes (GET /adoption-requests/owner/{ownerId})
11. A --> W: 200 Lista
12. W --> U: «Solicitud cancelada» y el listado actualizado

Flujos alternos (insértalos donde se indica):
- Antes del paso 1, alt [FA-17-A: no hay solicitudes para el filtro]: W --> U: «No hay solicitudes para este filtro» (break).
- Tras el paso 5, alt [FA-17-B: no es el responsable]: A --> W: 403 «Solo el responsable de la publicación puede decidir la solicitud».
- Envolviendo los pasos 2 a 9, alt [FA-17-C: error al actualizar]: W --> U: «No se pudo actualizar la solicitud»; conserva el estado.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-19. Supervisar publicaciones

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-19. Supervisar publicaciones» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-19 Supervisar publicaciones
Participantes (declaración PlantUML, en este orden):
actor "Administrador" as U
participant "Interfaz web\n(Panel de administración)" as W
participant "API REST\n(PetsController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor ha iniciado sesión como Administrador.
Postcondición: la publicación revisada se conserva o queda eliminada de la plataforma.

Flujo principal (en este orden):
1. U -> W: Acceder al panel de administración
2. W -> A: Consultar perros registrados (GET /pets?size=9999), junto con las demás consultas del panel (ref CU-39)
3. A -> DB: Consultar perros (pets, pet_images)
4. DB --> A: Perros
5. A --> W: 200 Lista
6. W --> U: Tabla «Perros registrados» con nombre, estado, ubicación, raza y color
7. U -> W: Revisar y seleccionar «Borrar» en una publicación
8. W --> U: Confirmación «Se eliminará esta publicación de perro definitivamente.»
9. U -> W: Seleccionar «Borrar definitivamente»
10. W -> A: Eliminar publicación (DELETE /pets/{id})
11. A -> A: Verificar rol de Administrador
12. A -> DB: Eliminar (DELETE pets; en cascada fotos, embeddings, vacunas y solicitudes)
13. DB --> A: Eliminada
14. A --> W: 200
15. W --> U: «Elemento eliminado correctamente» y actualiza la tabla

Flujos alternos (insértalos donde se indica):
- Tras el paso 6, opt [FA-19-A: selecciona el indicador perros registrados, en adopción o adoptados]: W -> W filtra la tabla; W --> U perros del indicador.
- Tras el paso 6, alt [FA-19-B: no hay perros]: W --> U: «No hay perros registrados.».
- Tras el paso 8, alt [FA-19-C: selecciona «Cancelar»]: W --> U: conserva la publicación (break).
- Envolviendo los pasos 10 a 14, alt [FA-19-D: error al eliminar]: W --> U: «No se pudo eliminar el elemento»; conserva la publicación.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-20. Administrar usuarios

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-20. Administrar usuarios» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-20 Administrar usuarios
Participantes (declaración PlantUML, en este orden):
actor "Administrador" as U
participant "Interfaz web\n(Panel de administración)" as W
participant "API REST\n(UserController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor ha iniciado sesión como Administrador.
Postcondición: la cuenta queda con el rol y los permisos asignados; los cambios se aplican en el siguiente inicio de sesión del usuario.

Flujo principal (en este orden):
1. U -> W: Acceder a la sección «Usuarios» del panel
2. W -> A: Consultar cuentas (GET /users)
3. A -> A: Verificar rol de Administrador
4. A -> DB: Consultar usuarios (users)
5. DB --> A: Usuarios
6. A --> W: 200 Lista
7. W --> U: Cuentas con nombre, correo y rol, y totales de usuarios normales, refugios y administradores
8. U -> W: Buscar por nombre o correo, o seleccionar un total para filtrar por rol
9. W --> U: Cuentas filtradas
10. U -> W: Seleccionar una cuenta
11. W -> W: Armar el historial con los datos ya cargados del panel (solicitudes para publicar, solicitudes de adopción y reportes)
12. W --> U: Detalle: rol, teléfono, permiso para publicar, estado de la cuenta e historial
13. U -> W: Cambiar el rol (Usuario normal, Refugio o Administrador)
14. W -> A: Cambiar rol (PATCH /users/{id}/role {role})
15. A -> DB: Actualizar rol y, si es Refugio o Administrador, otorgar permiso para publicar (UPDATE users)
16. DB --> A: Cuenta actualizada
17. A --> W: 200 Cuenta
18. W --> U: «Rol actualizado correctamente»

Flujos alternos (insértalos donde se indica):
- Tras el paso 12, opt [FA-20-A: «Autorizar publicar» o «Quitar permiso»]: ref CU-22 Autorizar publicación a Usuario general.
- Tras el paso 12, opt [FA-20-B: «Desactivar», «Activar» o «Borrar usuario»]: ref CU-37 Activar, desactivar o eliminar cuenta.
- Tras el paso 9, alt [FA-20-C: ninguna cuenta coincide]: W --> U: listado vacío.
- Envolviendo los pasos 14 a 17, alt [FA-20-D: error al actualizar]: W --> U: «No se pudo actualizar el rol»; conserva el rol anterior.
- Antes del paso 1, opt [FA-20-E: registrar una cuenta nueva]: ref CU-36 Crear usuario.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-21. Administrar contenido

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-21. Administrar contenido» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-21 Administrar contenido
Participantes (declaración PlantUML, en este orden):
actor "Administrador" as U
participant "Interfaz web\n(Panel de administración)" as W
participant "API REST\n(controladores de la plataforma)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor ha iniciado sesión como Administrador.
Postcondición: el contenido queda revisado y, en su caso, actualizado, cerrado, desactivado o eliminado.

Flujo principal (en este orden):
1. U -> W: Acceder al panel de administración
2. par [consultas simultáneas]: W -> A GET /users; W -> A GET /publication-authorizations; W -> A GET /adoption-requests; W -> A GET /reports; W -> A GET /pets?size=9999; W -> A GET /cases
3. A -> DB: Consultar users, publication_authorization_requests, adoption_requests, lost_pets, pets y cases
4. DB --> A: Registros
5. A --> W: 200 Listas
6. W --> U: Reporte general (ref CU-39) y tablas de decisión: perros, casos, autorizaciones, solicitudes de adopción y reportes
7. U -> W: Seleccionar un indicador o un elemento de una tabla
8. W --> U: Detalle del elemento
9. alt [moderar un reporte] ref CU-23; else [eliminar contenido] ref CU-24; else [revisar solicitudes de adopción y casos] ref CU-38; else [atender una autorización] ref CU-22; else [revisar un perro] ref CU-19
10. W -> W: Recargar las tablas
11. W --> U: Tablas actualizadas

Flujos alternos (insértalos donde se indica):
- Tras el paso 6, alt [FA-21-A: una tabla no tiene registros]: W --> U: mensaje vacío de la tabla, por ejemplo «No hay reportes» o «No hay casos registrados».
- Envolviendo los pasos 2 a 5, alt [FA-21-B: error al consultar]: W --> U: muestra el mensaje de error.
- Antes del paso 1, opt [FA-21-C: desde «Mis Anuncios»]: W -> A GET /pets, GET /reports y GET /reports/sightings; W --> U todas las publicaciones, reportes y avisos con «Editar», «Desactivar» y «Eliminar».
- Dentro del paso 9, alt [FA-21-D: error al aplicar la acción]: W --> U: informa la falla y conserva el estado original.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-22. Autorizar publicación a Usuario general

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-22. Autorizar publicación a Usuario general» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-22 Autorizar publicación a Usuario general
Participantes (declaración PlantUML, en este orden):
actor "Administrador" as U
participant "Interfaz web\n(Panel de administración)" as W
participant "API REST\n(AuthorizationController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor ha iniciado sesión como Administrador y existe una solicitud de autorización (CU-09) o una cuenta de Usuario general.
Postcondición: el usuario queda habilitado o no para publicar en adopción; el cambio se aplica en su siguiente inicio de sesión.

Flujo principal (en este orden):
1. U -> W: Acceder a «Autorizaciones para publicar» (cargadas con el panel: GET /publication-authorizations)
2. W --> U: Solicitudes con usuario, motivo, fecha y estado
3. U -> W: Seleccionar una solicitud pendiente
4. W --> U: Usuario, correo, estado, fecha y motivo
5. U -> W: Seleccionar «Aprobar»
6. W -> A: Decidir autorización (PATCH /publication-authorizations/{id}/decision {status: APPROVED})
7. A -> A: Verificar rol de Administrador
8. A -> DB: Cambiar la solicitud a APPROVED (UPDATE publication_authorization_requests)
9. A -> DB: Habilitar el permiso para publicar (UPDATE users SET publishing_authorized = true)
10. A ->> DB: Notificar al usuario «Tu permiso para publicar fue aprobado» (INSERT notifications)
11. A --> W: 200 Solicitud
12. W --> U: «Autorización aprobada» y recarga el panel

Flujos alternos (insértalos donde se indica):
- En el paso 5, alt [FA-22-A: selecciona «Rechazar»]: W -> A PATCH .../decision {status: REJECTED}; A -> DB solicitud REJECTED y publishing_authorized = false; A ->> DB notificación «Tu solicitud de permiso fue rechazada»; W --> U «Autorización rechazada».
- Antes del paso 1, opt [FA-22-B: desde «Usuarios», «Autorizar publicar» o «Quitar permiso»]: W -> A PATCH /users/{id}/publishing-authorization {authorized}; A -> DB UPDATE users; W --> U «Permiso para publicar otorgado» o «Permiso para publicar retirado».
- Tras el paso 2, alt [FA-22-C: no hay solicitudes]: W --> U: «No hay solicitudes de autorización.».
- En el paso 5, opt [FA-22-D: «Borrar solicitud»]: ref CU-24 Eliminar o desactivar contenido inapropiado (DELETE /publication-authorizations/{id}).
- Envolviendo los pasos 6 a 11, alt [FA-22-E: error al actualizar]: W --> U: «No se pudo actualizar la autorización»; conserva el estado.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-23. Moderar reportes

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-23. Moderar reportes» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-23 Moderar reportes
Participantes (declaración PlantUML, en este orden):
actor "Administrador" as U
participant "Interfaz web\n(Panel de administración)" as W
participant "API REST\n(ReportsController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor ha iniciado sesión como Administrador (RN-12) y existen reportes registrados (CU-07 o CU-08).
Postcondición: el reporte queda abierto, cerrado o eliminado según la acción elegida.

Flujo principal (en este orden):
1. U -> W: Acceder a la tabla «Reportes» del panel (cargada con GET /reports)
2. W --> U: Reportes con fotografía, nombre, tipo, ubicación, autor, fecha y estado («Abierto», «Cerrado» o «Inactivo»)
3. U -> W: Seleccionar un reporte
4. W --> U: Detalle: autor, correo, ubicación, fecha, raza, sexo, color, teléfono y descripción
5. U -> W: Seleccionar «Cerrar caso»
6. W -> A: Moderar reporte (PATCH /reports/{id}/moderation {status: RESOLVED, notes: «Reporte marcado como resuelto.»})
7. A -> A: Verificar rol de Administrador (RN-12)
8. A -> DB: Actualizar estado y nota (UPDATE lost_pets)
9. DB --> A: Reporte actualizado
10. A --> W: 200 Reporte
11. W --> U: «Reporte actualizado correctamente» y recarga la tabla

Flujos alternos (insértalos donde se indica):
- En el paso 5, alt [FA-23-A: el reporte ya está cerrado, selecciona «Reabrir»]: W -> A PATCH .../moderation {status: OPEN, notes: «Caso reabierto por administración.»}; A -> DB UPDATE lost_pets; W --> U «Reporte actualizado correctamente».
- En el paso 5, opt [FA-23-B: «Ir al detalle»]: ref CU-32 Validar o rechazar coincidencia (detalle del reporte con sus coincidencias).
- En el paso 5, opt [FA-23-C: «Borrar»]: ref CU-24 Eliminar o desactivar contenido inapropiado.
- Tras el paso 2, opt [FA-23-D: selecciona «perdidos», «encontrados» o «reportes abiertos»]: W -> W filtra; alt [sin registros] W --> U «No hay reportes.».
- Envolviendo los pasos 6 a 10, alt [FA-23-E: error al actualizar]: W --> U: muestra el error; conserva el estado.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-24. Eliminar o desactivar contenido inapropiado

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-24. Eliminar o desactivar contenido inapropiado» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-24 Eliminar o desactivar contenido inapropiado
Participantes (declaración PlantUML, en este orden):
actor "Administrador" as U
participant "Interfaz web\n(Panel de administración)" as W
participant "API REST\n(controlador del elemento)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor ha iniciado sesión como Administrador y el contenido existe.
Postcondición: el contenido queda eliminado o inactivo según la acción elegida.

Flujo principal (en este orden):
1. U -> W: Localizar el contenido en el panel: perro, reporte, solicitud de adopción, solicitud de autorización, caso o cuenta
2. U -> W: Seleccionar «Borrar» en el elemento o en su detalle
3. W --> U: Confirmación «Acción definitiva» con la descripción del elemento
4. U -> W: Seleccionar «Borrar definitivamente»
5. alt [perro] W -> A DELETE /pets/{id}; else [reporte] W -> A DELETE /reports/{id}; else [solicitud de adopción] W -> A DELETE /adoption-requests/{id}/admin; else [solicitud de autorización] W -> A DELETE /publication-authorizations/{id}; else [caso] W -> A DELETE /cases/{id}; else [cuenta] W -> A DELETE /users/{id}
6. A -> A: Verificar rol de Administrador
7. A -> DB: Eliminar el registro y en cascada sus dependientes (por ejemplo fotos de un perro, avisos de un reporte o mensajes de un caso)
8. DB --> A: Eliminado
9. A --> W: 200
10. W --> U: «Elemento eliminado correctamente» y recarga el panel

Flujos alternos (insértalos donde se indica):
- Tras el paso 3, alt [FA-24-A: selecciona «Cancelar»]: W --> U: conserva el contenido (break).
- Antes del paso 1, opt [FA-24-B: desactivar en lugar de eliminar, desde «Mis Anuncios»]: U -> W «Desactivar»; W -> A PATCH /reports/{id}/deactivate o PATCH /pets/{id}/deactivate; A -> DB UPDATE status = INACTIVE; W --> U «Reporte desactivado» o «Publicación desactivada»; nota: deja de mostrarse al público y en coincidencias.
- Envolviendo los pasos 5 a 9, alt [FA-24-C: error al eliminar]: W --> U: «No se pudo eliminar el elemento»; conserva el contenido.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-25. Gestionar perfil

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-25. Gestionar perfil» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-25 Gestionar perfil
Participantes (declaración PlantUML, en este orden):
actor "Usuario\n(general o Refugio)" as U
participant "Interfaz web\n(Mi Perfil)" as W
participant "API REST\n(UserController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión.
Postcondición: la información de la cuenta queda actualizada; en caso de eliminación, la cuenta deja de existir y la sesión se cierra.

Flujo principal (en este orden):
1. U -> W: Acceder a «Mi Perfil»
2. W -> A: Consultar la cuenta (GET /users/find/{email})
3. A -> DB: Consultar usuario (users)
4. DB --> A: Usuario
5. A --> W: 200 Cuenta
6. W -> A: Consultar estadísticas (GET /pets/owner/{id} y GET /reports/user/{id})
7. A --> W: 200 Publicaciones y reportes
8. W --> U: Nombre de usuario, correo, teléfono y estadísticas (publicaciones, adoptados, reportes resueltos)
9. U -> W: Seleccionar «Editar perfil»
10. W --> U: Habilita nombre de usuario y teléfono (el correo no se puede modificar)
11. U -> W: Modificar datos y seleccionar «Guardar cambios»
12. W -> W: Validar datos
13. W -> A: Actualizar cuenta (PUT /users/update/{id} {username, phone})
14. A -> A: Verificar que sea el propio usuario o un Administrador
15. A -> DB: Actualizar usuario (UPDATE users)
16. DB --> A: Usuario actualizado
17. A --> W: 200 Cuenta
18. W --> U: «Perfil actualizado exitosamente»

Flujos alternos (insértalos donde se indica):
- En el paso 9, alt [FA-25-A: «Cambiar contraseña»]: U -> W nueva contraseña y confirmación; W -> W validar (≥ 6 y coinciden); W -> A PUT /users/update/password/{id} {newPassword}; A -> A BCrypt; A -> DB UPDATE users; W --> U «Contraseña actualizada exitosamente».
- En el paso 9, alt [FA-25-B: «Eliminar cuenta»]: W --> U confirmación (no se puede deshacer); U -> W confirma; W -> A DELETE /users/{id}; A -> A verificar propio usuario o Administrador; A -> DB DELETE users; W -> W cerrar sesión; W --> U pantalla de inicio de sesión.
- Tras el paso 10, opt [FA-25-C: «Cancelar»]: W --> U: descarta los cambios y muestra los datos guardados.
- Tras el paso 12, break [FA-25-D: nombre vacío o con menos de dos caracteres, o teléfono inválido]: W --> U: señala el campo.
- Envolviendo los pasos 13 a 17, alt [FA-25-E: error al guardar]: W --> U: informa la falla y conserva los datos.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-26. Cancelar solicitud de adopción

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-26. Cancelar solicitud de adopción» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-26 Cancelar solicitud de adopción
Participantes (declaración PlantUML, en este orden):
actor "Usuario general" as U
participant "Interfaz web\n(Solicitudes)" as W
participant "API REST\n(AdoptionRequestController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión y la solicitud le pertenece y está pendiente.
Postcondición: la solicitud se elimina y deja de mostrarse al responsable de la publicación.

Flujo principal (en este orden):
1. ref CU-06 Consultar solicitudes realizadas
2. U -> W: Seleccionar «Cancelar solicitud» en una solicitud pendiente
3. W -> A: Cancelar solicitud (DELETE /adoption-requests/{id}?userId={userId})
4. A -> DB: Consultar la solicitud (adoption_requests)
5. DB --> A: Solicitud
6. A -> A: Verificar que sea de quien la creó (o un Administrador) y que siga en estado PENDING
7. A -> DB: Eliminar la solicitud (DELETE adoption_requests)
8. DB --> A: Eliminada
9. A --> W: 200
10. W -> A: Recargar solicitudes (GET /adoption-requests/user/{userId})
11. A --> W: 200 Lista
12. W --> U: «Solicitud cancelada» y el listado actualizado

Flujos alternos (insértalos donde se indica):
- Antes del paso 2, nota [FA-26-A]: si la solicitud ya fue atendida, la opción «Cancelar solicitud» no se muestra.
- Tras el paso 6, alt [FA-26-B: no es quien la creó]: A --> W: 403 «Solo quien creó la solicitud puede cancelarla». else [ya no está pendiente]: A --> W: 400 «Solo puedes cancelar solicitudes pendientes».
- Envolviendo los pasos 3 a 9, alt [FA-26-C: error al cancelar]: W --> U: «No se pudo cancelar la solicitud»; la conserva.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-27. Consultar notificaciones

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-27. Consultar notificaciones» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-27 Consultar notificaciones
Participantes (declaración PlantUML, en este orden):
actor "Usuario\n(cualquier rol)" as U
participant "Interfaz web\n(Encabezado)" as W
participant "API REST\n(NotificationsController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión.
Postcondición: las notificaciones consultadas quedan marcadas como leídas.

Flujo principal (en este orden):
1. loop [cada 30 segundos mientras la sesión esté activa]: W -> A consultar resumen (GET /cases/notifications/{userId}); W -> A consultar notificaciones (GET /notifications/user/{userId}); A -> DB consultar las 50 más recientes (notifications); DB --> A notificaciones; A --> W 200 lista; W --> U contador de no leídas en el ícono
2. U -> W: Seleccionar el ícono de notificaciones
3. W --> U: Lista con título y mensaje (solicitudes recibidas, decisiones, avisos y respuestas, mensajes o cambios en casos, coincidencias con alta probabilidad)
4. U -> W: Seleccionar una notificación
5. W -> A: Marcar como leída (PATCH /notifications/{id}/read)
6. A -> DB: Actualizar (UPDATE notifications SET is_read = true)
7. DB --> A: Actualizada
8. A --> W: 200
9. W --> U: Abre la sección relacionada (enlace de la notificación)

Flujos alternos (insértalos donde se indica):
- Tras el paso 3, alt [FA-27-A: no hay notificaciones]: W --> U: «No tienes notificaciones.».
- En el paso 4, alt [FA-27-B: «Marcar todas leídas»]: W -> A PATCH /notifications/user/{userId}/read-all; A -> DB UPDATE notifications; W --> U retira el contador.
- Dentro del paso 1, alt [FA-27-C: no se pudo consultar]: W -> W muestra la lista vacía y reintenta en la siguiente consulta.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-28. Dar seguimiento a casos

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-28. Dar seguimiento a casos» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-28 Dar seguimiento a casos
Participantes (declaración PlantUML, en este orden):
actor "Participante del caso\n(Usuario general o Refugio)" as U
participant "Interfaz web\n(Casos)" as W
participant "API REST\n(CasesController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión y participa en un caso abierto desde una solicitud (CU-16) o desde un aviso (CU-34).
Postcondición: el mensaje queda registrado en el caso y el otro participante recibe una notificación.

Flujo principal (en este orden):
1. U -> W: Acceder a «Casos»
2. W -> A: Consultar sus casos (GET /cases/user/{userId})
3. A -> DB: Consultar casos donde es responsable o participante (cases)
4. DB --> A: Casos
5. A --> W: 200 Lista
6. W --> U: Casos agrupados por tipo (adopción o perdido) con su estado
7. U -> W: Seleccionar un caso
8. W -> A: Consultar detalle (GET /cases/{caseId})
9. A -> DB: Consultar caso y mensajes (cases, case_messages)
10. DB --> A: Caso con historial
11. A --> W: 200 Caso
12. W --> U: Detalle del caso e historial de mensajes
13. U -> W: Escribir mensaje, adjuntar hasta 4 fotos (opcional) y seleccionar «Enviar mensaje»
14. W -> A: Registrar mensaje (POST /cases/{caseId}/messages; multipart si hay fotos)
15. A -> A: Guardar las fotos adjuntas
16. A -> DB: Registrar mensaje y actualizar el último mensaje del caso (INSERT case_messages, UPDATE cases)
17. A ->> DB: Notificar al otro participante (INSERT notifications)
18. A --> W: 200 Caso actualizado
19. W --> U: «Mensaje enviado» y el historial actualizado

Flujos alternos (insértalos donde se indica):
- Tras el paso 6, opt [FA-28-A: filtro todos, adopción, perdidos, abiertos o cerrados]: W -> W filtra; W --> U casos del filtro.
- Tras el paso 6, alt [FA-28-B: sin casos para el filtro]: W --> U: «Sin casos para este filtro».
- Tras el paso 13, alt [FA-28-C: una foto pesa más de 5 MB]: W --> U: «Cada foto debe pesar menos de 5 MB».
- Tras el paso 13, alt [FA-28-D: sin texto ni fotos]: W --> U: «Escribe un mensaje o adjunta fotos para el caso» (break).
- Tras el paso 12, opt [FA-28-E: el usuario es el responsable del caso]: ref CU-42 Cerrar caso.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-29. Consultar reportes de perros perdidos y encontrados

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-29. Consultar reportes de perros perdidos y encontrados» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-29 Consultar reportes de perros perdidos y encontrados
Participantes (declaración PlantUML, en este orden):
actor "Usuario general" as U
participant "Interfaz web\n(Mascotas Perdidas)" as W
participant "API REST\n(ReportsController / PetsController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión.
Postcondición: el usuario consulta los reportes sin modificarlos.

Flujo principal (en este orden):
1. U -> W: Acceder a «Mascotas Perdidas»
2. W -> A: Consultar perros marcados como perdidos (GET /pets?status=LOST&size=9999)
3. W -> A: Consultar reportes (GET /reports)
4. A -> DB: Consultar pets y lost_pets con su autor
5. DB --> A: Registros
6. A --> W: 200 Listas
7. W -> W: Excluir los reportes desactivados por su autor (INACTIVE)
8. W --> U: Tarjetas con fotografía, nombre, tipo (perdido o encontrado) y ubicación
9. U -> W: Aplicar filtros: nombre o raza, ubicación, tipo y estado (abierto o resuelto)
10. W --> U: Reportes que cumplen los filtros
11. U -> W: Seleccionar un reporte
12. W --> U: Detalle: fotografías, datos del perro, ubicación y quién lo publicó

Flujos alternos (insértalos donde se indica):
- Tras el paso 10, alt [FA-29-A: ningún reporte cumple]: W --> U: «No se encontraron mascotas con esos filtros».
- En el paso 9, opt [FA-29-B: «Limpiar»]: W -> W restablece filtros; W --> U todos los reportes.
- Tras el paso 12, opt [FA-29-C: enviar un aviso al autor]: ref CU-30 Enviar aviso de avistamiento.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-30. Enviar aviso de avistamiento

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-30. Enviar aviso de avistamiento» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-30 Enviar aviso de avistamiento
Participantes (declaración PlantUML, en este orden):
actor "Usuario general" as U
participant "Interfaz web\n(Mascotas Perdidas)" as W
participant "API REST\n(ReportsController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión y existe un reporte de perro extraviado o encontrado.
Postcondición: el aviso queda registrado como nuevo y el autor del reporte recibe una notificación.

Flujo principal (en este orden):
1. ref CU-29: el usuario consulta el detalle de un reporte
2. U -> W: Seleccionar la opción para enviar un aviso
3. W --> U: Formulario «¿Viste un perro parecido?» (reporte LOST) o «¿Crees que es tu perro?» (reporte FOUND)
4. U -> W: Capturar nombre, correo, teléfono, lugar e información, y adjuntar fotos (opcional, hasta 4 de 3 MB)
5. W -> W: Validar nombre e información obligatorios
6. W -> A: Enviar aviso (POST /reports/{reportId}/sightings multipart)
7. A -> DB: Consultar el reporte (lost_pets)
8. DB --> A: Reporte y autor
9. A -> A: Validar nombre y mensaje; guardar hasta 4 fotos
10. A -> DB: Registrar aviso (INSERT report_sightings, estado NEW)
11. DB --> A: Aviso registrado
12. A ->> DB: Notificar al autor del reporte (INSERT notifications)
13. A --> W: 200 Aviso
14. W --> U: «Aviso enviado al reporte»

Flujos alternos (insértalos donde se indica):
- Tras el paso 5, break [FA-30-A: falta el nombre o la información]: W --> U: «Agrega tu nombre y la información del posible perro».
- Tras el paso 4, alt [una foto supera 3 MB]: W --> U: «Cada imagen no debe superar 3MB».
- Envolviendo los pasos 6 a 13, alt [FA-30-B: error al registrar]: W --> U: «No se pudo enviar el aviso» y conserva los datos.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-31. Consultar coincidencias sugeridas

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-31. Consultar coincidencias sugeridas» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-31 Consultar coincidencias sugeridas
Participantes (declaración PlantUML, en este orden):
actor "Usuario general / Refugio" as U
participant "Interfaz web\n(Publicar Anuncio)" as W
participant "API REST\n(ReportsController)" as A
participant "Servicio de IA\n(ml-service DogNet v2)" as IA
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario acaba de registrar un reporte de perro extraviado o encontrado (CU-07 o CU-08); este caso de uso es incluido por ellos.
Postcondición: las coincidencias quedan registradas como sugeridas y no se consideran confirmadas hasta su validación (RN-11).

Flujo principal (en este orden):
1. W -> A: Consultar coincidencias del reporte (GET /reports/{reportId}/matches)
2. A -> DB: Consultar el reporte (lost_pets)
3. DB --> A: Reporte
4. opt [faltan vectores de alguna foto del reporte]: A -> IA POST /analyze por foto; IA --> A vector y raza; A -> DB INSERT report_image_embeddings
5. A -> DB: Consultar los vectores y la raza de las fotos del reporte (report_image_embeddings)
6. A -> DB: Consultar candidatos: perros en adopción o perdidos con sus vectores (pets, pet_image_embeddings) y reportes del tipo opuesto no inactivos con sus vectores (lost_pets, report_image_embeddings)
7. DB --> A: Candidatos
8. loop [para cada candidato]: A -> A calcular el puntaje híbrido (0 a 100): raza 0-40, mayor similitud visual entre pares de fotos 0-40 (a la mitad si la raza no coincide), ubicación a 2 km o menos o misma alcaldía 0-10, sexo y color 0-10; y la probabilidad calibrada de ser el mismo perro
9. opt [dentro del loop, puntaje de 20 o más]: A -> DB registrar o actualizar la coincidencia conservando la decisión del usuario (INSERT/UPDATE matches)
10. opt [dentro del loop, coincidencia nueva con probabilidad de 70 % o más]: A ->> DB notificar al autor «Posible coincidencia para [perro]» (INSERT notifications)
11. A -> A: Ordenar de mayor a menor puntaje y tomar las 10 primeras
12. A --> W: 200 Coincidencias
13. W --> U: Ventana «Posibles coincidencias»: fotografía, raza, porcentaje de ser el mismo perro y nivel («Muy probable», «Posible» o «Poco probable»)
14. U -> W: Seleccionar «Ver mi reporte» o «Continuar»

Flujos alternos (insértalos donde se indica):
- Tras el paso 11, alt [FA-31-A: ningún candidato alcanza 20 puntos]: W --> U: «No encontramos coincidencias por ahora»; el reporte queda publicado.
- Dentro del paso 8, alt [FA-31-B: el candidato no tiene foto comparable]: A -> A puntaje solo con atributos; W muestra «Sin foto comparable».
- Nota en el paso 10 [FA-31-C]: la notificación solo se envía la primera vez que aparece la coincidencia.
- Tras el paso 14, alt [FA-31-D: «Ver mi reporte»]: ref CU-32 Validar o rechazar coincidencia. else [«Continuar»]: W --> U muestra «Mascotas Perdidas».

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-32. Validar o rechazar coincidencia

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-32. Validar o rechazar coincidencia» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-32 Validar o rechazar coincidencia
Participantes (declaración PlantUML, en este orden):
actor "Autor del reporte" as U
participant "Interfaz web\n(Detalle del reporte)" as W
participant "API REST\n(ReportsController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: existen coincidencias sugeridas para el reporte (CU-31); solo el autor del reporte o el Administrador pueden validarlas o rechazarlas (RN-09).
Postcondición: la coincidencia queda validada o rechazada; si se recalculan las coincidencias, se conserva la decisión.

Flujo principal (en este orden):
1. U -> W: Abrir el detalle de su reporte con «Ver mi reporte», con «Ver coincidencias» en «Mis Anuncios» o desde la notificación de coincidencia
2. W -> A: Consultar el reporte (GET /reports/{reportId})
3. A --> W: 200 Reporte
4. W -> A: Consultar coincidencias (GET /reports/{reportId}/matches)
5. ref over W, A, DB: CU-31 Consultar coincidencias sugeridas (cálculo)
6. A --> W: 200 Coincidencias
7. W -> W: Verificar si el usuario es el autor del reporte o el Administrador
8. W --> U: Coincidencias con porcentaje, puntaje, motivo y estado, con «Validar» y «Rechazar»
9. U -> W: Seleccionar «Validar» en una coincidencia
10. W -> A: Cambiar estado (PATCH /reports/matches/{matchId}/status {status: VALIDATED})
11. A -> DB: Consultar la coincidencia y su reporte (matches, lost_pets)
12. DB --> A: Coincidencia y autor del reporte
13. A -> A: Verificar que sea el autor o el Administrador
14. A -> DB: Actualizar estado (UPDATE matches)
15. DB --> A: Coincidencia actualizada
16. A --> W: 200 Coincidencia
17. W --> U: Estado «Validada» y aviso «Coincidencia validada»

Flujos alternos (insértalos donde se indica):
- En el paso 9, alt [selecciona «Rechazar»]: W -> A PATCH .../status {status: REJECTED}; mismos pasos 11 a 16; W --> U estado «Rechazada» y aviso «Coincidencia rechazada».
- Tras el paso 6, alt [FA-32-A: no hay coincidencias]: W --> U: «No hay coincidencias potenciales registradas.».
- Nota en el paso 8 [FA-32-B]: si la coincidencia ya tiene el estado elegido, el botón correspondiente aparece deshabilitado.
- Tras el paso 7, alt [FA-32-D: no es el autor ni el Administrador]: W --> U: muestra las coincidencias sin «Validar» ni «Rechazar» (break).
- Tras el paso 13, alt [sin sesión o usuario ajeno]: A --> W: 401 o 403.
- Envolviendo los pasos 10 a 16, alt [FA-32-C: error al actualizar]: W --> U: «No se pudo actualizar la coincidencia»; conserva el estado anterior.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-33. Gestionar mis reportes

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-33. Gestionar mis reportes» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-33 Gestionar mis reportes
Participantes (declaración PlantUML, en este orden):
actor "Autor del reporte\n(Usuario general o Refugio)" as U
participant "Interfaz web\n(Mis Anuncios)" as W
participant "OpenStreetMap\n(Nominatim)" as MAP
participant "API REST\n(ReportsController)" as A
participant "Servicio de IA\n(ml-service DogNet v2)" as IA
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión y tiene al menos un reporte; solo el autor o el Administrador pueden modificarlo (RN-09).
Postcondición: el reporte queda actualizado, inactivo o eliminado según la acción elegida.

Flujo principal (en este orden):
1. U -> W: Acceder a «Mis Anuncios»
2. W -> A: Consultar sus reportes (GET /reports/user/{userId})
3. A -> DB: Consultar reportes del autor (lost_pets)
4. DB --> A: Reportes
5. A --> W: 200 Lista
6. W --> U: Reportes registrados
7. U -> W: Seleccionar «Editar» en un reporte
8. W --> U: Formulario con los datos y fotografías actuales
9. U -> W: Modificar datos y ajustar el punto en el mapa
10. W -> MAP: Obtener la dirección del punto (GET /reverse)
11. MAP --> W: Dirección; W actualiza la ubicación
12. U -> W: Seleccionar hasta 4 fotografías nuevas (opcional) y «Guardar cambios»
13. W -> A: Actualizar reporte (PUT /reports/{id}; JSON, o multipart con images[1..4] si hay fotos nuevas)
14. A -> DB: Consultar el reporte (lost_pets)
15. DB --> A: Reporte y autor
16. A -> A: Verificar que sea el autor o el Administrador
17. opt [hay fotos nuevas]: A -> IA verificar que sean perros (POST /describe); IA --> A resultado; A -> A guardar los archivos
18. A -> DB: Actualizar reporte (UPDATE lost_pets; reemplaza la lista de fotos si hay nuevas)
19. opt [hay fotos nuevas]: loop [para cada foto] A -> IA POST /analyze; IA --> A vector y raza; A -> DB reemplazar report_image_embeddings
20. A --> W: 200 Reporte
21. W --> U: «Reporte actualizado»

Flujos alternos (insértalos donde se indica):
- En el paso 7, alt [FA-33-A: «Desactivar»]: W -> A PATCH /reports/{id}/deactivate; A -> A verificar autor o Administrador; A -> DB UPDATE lost_pets SET status = INACTIVE; W --> U «Reporte desactivado»; nota: deja de mostrarse en «Mascotas Perdidas» y en coincidencias.
- En el paso 7, alt [FA-33-B: «Eliminar»]: W --> U confirmación; U -> W «Eliminar definitivamente»; W -> A DELETE /reports/{id}; A -> DB DELETE lost_pets (en cascada avisos, vectores y coincidencias); W --> U «Reporte eliminado».
- En el paso 7, opt [FA-33-E: «Ver coincidencias»]: ref CU-32 Validar o rechazar coincidencia.
- Tras el paso 12, alt [FA-33-F: más de 4 fotos o alguna de más de 5 MB]: W --> U: «Selecciona máximo 4 fotos» o «Cada foto debe pesar menos de 5 MB».
- Nota en el paso 12 [FA-33-G]: si no elige fotos nuevas, se conservan las actuales.
- Dentro del paso 17, alt [FA-33-C: una foto nueva no es de perro]: A --> W: 422 con el motivo; W --> U muestra el motivo.
- Envolviendo los pasos 13 a 20, alt [FA-33-D: error al guardar]: W --> U: «No se pudo actualizar el reporte» y conserva los datos.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-34. Revisar avisos recibidos

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-34. Revisar avisos recibidos» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-34 Revisar avisos recibidos
Participantes (declaración PlantUML, en este orden):
actor "Autor del reporte\n(Usuario general o Refugio)" as U
participant "Interfaz web\n(Mis Anuncios – Avisos recibidos)" as W
participant "API REST\n(ReportsController / CasesController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario ha iniciado sesión y tiene al menos un aviso sobre sus reportes (CU-30).
Postcondición: el aviso queda respondido, con un caso abierto o descartado.

Flujo principal (en este orden):
1. U -> W: Seleccionar la pestaña «Avisos recibidos» de «Mis Anuncios»
2. W -> A: Consultar avisos (GET /reports/sightings/owner/{ownerId})
3. A -> DB: Consultar avisos de sus reportes (report_sightings, lost_pets)
4. DB --> A: Avisos
5. A --> W: 200 Lista
6. W --> U: Avisos con datos de contacto, lugar, información y fotografías
7. U -> W: Seleccionar un aviso
8. U -> W: Escribir una respuesta y seleccionar «Responder»
9. W -> A: Responder aviso (PATCH /reports/sightings/{id}/reply {reply, status: REPLIED})
10. A -> DB: Guardar respuesta y estado REPLIED (UPDATE report_sightings)
11. DB --> A: Aviso actualizado
12. A ->> DB: Notificar a quien envió el aviso (INSERT notifications)
13. A --> W: 200 Aviso
14. W --> U: «Respuesta enviada»

Flujos alternos (insértalos donde se indica):
- En el paso 8, alt [FA-34-A: «Abrir caso»]: W -> A POST /cases/sighting/{sightingId}; A -> DB INSERT cases (tipo LOST, estado OPEN) e INSERT case_messages; A -> DB UPDATE report_sightings SET status = CASE_OPENED; A --> W 200 Caso; W --> U «Caso abierto»; ref CU-28 Dar seguimiento a casos.
- En el paso 8, alt [FA-34-B: «No es mi perro»]: W -> A PATCH /reports/sightings/{id}/case {status: DISMISSED}; A -> DB UPDATE report_sightings; W --> U «Aviso descartado».
- Tras el paso 8, break [FA-34-C: respuesta vacía]: W --> U: «Escribe una respuesta para quien envió el aviso».
- Tras el paso 6, alt [FA-34-D: no hay avisos]: W --> U: «Aún no tienes avisos sobre tus perros perdidos.».

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-35. Consultar recomendaciones por raza

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-35. Consultar recomendaciones por raza» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-35 Consultar recomendaciones por raza
Participantes (declaración PlantUML, en este orden):
actor "Responsable de la publicación" as U
participant "Interfaz web\n(Solicitudes)" as W
participant "Catálogo de razas\n(breedProfiles, en la interfaz)" as CAT

Precondición: el responsable seleccionó «Contactar» en una solicitud pendiente (CU-16); este caso de uso es incluido por CU-16.
Postcondición: el responsable cuenta con información de referencia para decidir si continúa con el contacto.
Indicación especial: el catálogo de razas forma parte de la interfaz; no hay mensajes a la API ni a la base de datos.

Flujo principal (en este orden):
1. W -> W: Identificar la raza registrada en la publicación
2. W -> CAT: Buscar el perfil de la raza (getBreedProfile(raza))
3. CAT --> W: Perfil: tamaño según el estándar oficial (FCI), esperanza de vida (VetCompass, McMillan), comportamiento (Darwin's Ark), salud y cuidados, con sus referencias
4. W -> CAT: Comparar con los perros mestizos (compareWithMutts)
5. CAT --> W: Comparación
6. W --> U: Ventana «Antes de contactar al solicitante» con el perfil, las referencias numeradas y preguntas sugeridas para conversar con el solicitante
7. U -> U: Comparar la información con el mensaje del solicitante (vivienda, otras mascotas, tiempo)

Flujos alternos (insértalos donde se indica):
- Tras el paso 3, alt [FA-35-A: la raza es «Otro», no está registrada o no pertenece a las 20 del catálogo]: CAT --> W perfil general (GENERAL_PROFILE); W --> U solo recomendaciones generales.
- Nota en el paso 6 [FA-35-B]: si la raza no tiene dato de esperanza de vida, la ventana lo indica.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-36. Crear usuario

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-36. Crear usuario» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-36 Crear usuario
Participantes (declaración PlantUML, en este orden):
actor "Administrador" as U
participant "Interfaz web\n(Crear usuario)" as W
participant "API REST\n(UserController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor ha iniciado sesión como Administrador.
Postcondición: la cuenta queda registrada con el rol asignado y puede iniciar sesión (CU-02).

Flujo principal (en este orden):
1. U -> W: Seleccionar «Crear usuario» en su menú
2. W --> U: Formulario de alta
3. U -> W: Capturar nombre de usuario, correo, teléfono, contraseña y confirmación, y elegir el tipo: Usuario normal, Refugio o Administrador
4. W -> W: Validar datos (usuario ≥ 3, correo válido, contraseña ≥ 6 con mayúsculas, minúsculas y números, confirmación igual)
5. W -> A: Crear cuenta (POST /users {..., role}, con el token del Administrador)
6. A -> A: Verificar en el token que es Administrador y conservar el rol elegido
7. A -> DB: Buscar usuario por correo (users)
8. DB --> A: Sin coincidencias
9. A -> A: Cifrar la contraseña (BCrypt)
10. A -> DB: Registrar usuario (INSERT users con el rol; permiso para publicar si es Refugio o Administrador)
11. DB --> A: Usuario creado
12. A --> W: 200 Cuenta
13. W --> U: «Usuario [normal | refugio | administrador] creado exitosamente»

Flujos alternos (insértalos donde se indica):
- Tras el paso 4, break [FA-36-A: dato faltante o inválido, o contraseñas distintas]: W --> U: señala el campo.
- Tras el paso 8, alt [FA-36-B: el correo ya está registrado (RN-03)]: A --> W: 409 «Este correo ya fue registrado»; W --> U muestra el error.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-37. Activar, desactivar o eliminar cuenta

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-37. Activar, desactivar o eliminar cuenta» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-37 Activar, desactivar o eliminar cuenta
Participantes (declaración PlantUML, en este orden):
actor "Administrador" as U
participant "Interfaz web\n(Panel de administración)" as W
participant "API REST\n(UserController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor ha iniciado sesión como Administrador y la cuenta existe.
Postcondición: la cuenta queda activa, inactiva o eliminada.

Flujo principal (en este orden):
1. U -> W: Acceder a «Usuarios» del panel
2. W --> U: Cuentas con rol y estado
3. U -> W: Seleccionar «Desactivar» en una cuenta activa
4. W -> A: Cambiar estado (PATCH /users/{id}/status {active: false})
5. A -> A: Verificar rol de Administrador
6. A -> DB: Actualizar estado (UPDATE users SET account_active = false)
7. DB --> A: Cuenta actualizada
8. A --> W: 200 Cuenta
9. W --> U: «Cuenta desactivada» y actualiza el listado

Flujos alternos (insértalos donde se indica):
- En el paso 3, alt [FA-37-A: la cuenta está inactiva, selecciona «Activar»]: W -> A PATCH /users/{id}/status {active: true}; A -> DB UPDATE users; W --> U «Cuenta activada».
- En el paso 3, alt [FA-37-B: «Borrar»]: W --> U confirmación; U -> W «Borrar definitivamente»; W -> A DELETE /users/{id}; A -> DB DELETE users (en cascada sus solicitudes, notificaciones y casos como responsable); W --> U «Elemento eliminado correctamente».
- Nota al final [FA-37-C]: si el titular de una cuenta inactiva intenta iniciar sesión, recibe «Cuenta desactivada» (ref CU-02).
- Envolviendo los pasos 4 a 8, alt [FA-37-D: error al actualizar]: W --> U: «No se pudo actualizar la cuenta»; conserva el estado.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-38. Supervisar solicitudes de adopción y casos

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-38. Supervisar solicitudes de adopción y casos» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-38 Supervisar solicitudes de adopción y casos
Participantes (declaración PlantUML, en este orden):
actor "Administrador" as U
participant "Interfaz web\n(Panel de administración)" as W
participant "API REST\n(AdoptionRequestController / CasesController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor ha iniciado sesión como Administrador.
Postcondición: la solicitud o el caso eliminado deja de existir en la plataforma.

Flujo principal (en este orden):
1. U -> W: Acceder al panel de administración
2. W -> A: Consultar solicitudes y casos (GET /adoption-requests y GET /cases)
3. A -> DB: Consultar adoption_requests y cases
4. DB --> A: Registros
5. A --> W: 200 Listas
6. W --> U: Solicitudes con su estado y casos con su tipo y estado
7. U -> W: Seleccionar una solicitud para ver su detalle (perro, publicador, solicitante, contacto, fecha y mensaje)
8. U -> W: Seleccionar «Borrar solicitud» (o «Borrar caso» en un caso)
9. W --> U: Confirmación «Acción definitiva»
10. U -> W: Seleccionar «Borrar definitivamente»
11. alt [solicitud] W -> A DELETE /adoption-requests/{id}/admin; A -> A verificar Administrador; A -> DB DELETE adoption_requests. else [caso] W -> A DELETE /cases/{id}; A -> DB DELETE cases (en cascada case_messages)
12. A --> W: 200
13. W --> U: «Elemento eliminado correctamente» y actualiza el listado

Flujos alternos (insértalos donde se indica):
- Tras el paso 6, opt [FA-38-A: selecciona el indicador «solicitudes pendientes» o «casos abiertos»]: W -> W filtra la tabla.
- Tras el paso 6, alt [FA-38-B: no hay registros]: W --> U: «No hay solicitudes de adopción» o «No hay casos registrados».
- Tras el paso 9, alt [FA-38-C: selecciona «Cancelar»]: W --> U: conserva el registro (break).

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-39. Consultar reporte general

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-39. Consultar reporte general» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-39 Consultar reporte general
Participantes (declaración PlantUML, en este orden):
actor "Administrador" as U
participant "Interfaz web\n(Panel de administración)" as W
participant "API REST\n(controladores de la plataforma)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor ha iniciado sesión como Administrador.
Postcondición: el Administrador consulta el estado de la plataforma sin modificar la información.

Flujo principal (en este orden):
1. U -> W: Acceder al panel de administración
2. par [consultas simultáneas]: W -> A GET /users; W -> A GET /publication-authorizations; W -> A GET /adoption-requests; W -> A GET /reports; W -> A GET /pets?size=9999; W -> A GET /cases
3. A -> DB: Consultar users, publication_authorization_requests, adoption_requests, lost_pets, pets y cases
4. DB --> A: Registros
5. A --> W: 200 Listas
6. W -> W: Calcular indicadores: perros registrados, en adopción y adoptados; reportes perdidos, encontrados y abiertos; solicitudes pendientes; casos abiertos
7. W --> U: Indicadores, gráficas de perros por estado, de reportes y de casos, y tablas de decisión con los registros recientes
8. U -> W: Seleccionar un indicador
9. W -> W: Filtrar las tablas con los registros del indicador
10. W --> U: Tablas filtradas

Flujos alternos (insértalos donde se indica):
- Tras el paso 6, alt [FA-39-A: no hay registros]: W --> U: indicadores en cero.
- Envolviendo los pasos 2 a 5, alt [FA-39-B: error al consultar]: W --> U: muestra el mensaje de error.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-40. Administrar red neuronal

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-40. Administrar red neuronal» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-40 Administrar red neuronal
Participantes (declaración PlantUML, en este orden):
actor "Administrador" as U
participant "Interfaz web\n(Panel – Red neuronal)" as W
participant "API REST\n(PetsController / ReportsController)" as A
participant "Servicio de IA\n(ml-service DogNet v2)" as IA
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor ha iniciado sesión como Administrador y el servicio de IA (ml-service) está en ejecución.
Postcondición: los análisis de las fotografías quedan actualizados con el modelo vigente y los perros sin tamaño reciben el detectado.

Flujo principal (en este orden):
1. U -> W: Seleccionar «Re-analizar fotos existentes» en la sección «Red neuronal»
2. W -> A: Re-analizar fotos de perros (POST /pets/embeddings/backfill?force=true)
3. A -> A: Verificar rol de Administrador
4. loop [para cada perro y cada una de sus fotos]: A -> IA POST /analyze; IA --> A vector y raza; A -> DB UPDATE pet_image_embeddings
5. opt [dentro del loop, el perro no tiene tamaño]: A -> IA POST /describe (foto principal); IA --> A tamaño; A -> DB UPDATE pets SET size
6. A --> W: 200 {processed}
7. W -> A: Re-analizar fotos de reportes (POST /reports/embeddings/backfill?force=true)
8. loop [para cada reporte y cada una de sus fotos]: A -> IA POST /analyze; IA --> A vector y raza; A -> DB reemplazar report_image_embeddings
9. A --> W: 200 {processed}
10. W --> U: «Fotos re-analizadas correctamente» con la cantidad de fotos de perros y de reportes

Flujos alternos (insértalos donde se indica):
- En el paso 1, alt [FA-40-A: «Probar con tus fotos»]: U -> W sube fotos; loop [para cada foto] W -> A POST /images/analyze; A -> IA POST /describe; IA --> A descripción; A --> W 200; W --> U muestra si es perro, raza u «Otro», tamaño, etapa de vida y color, sin guardar nada.
- Tras el paso 9, alt [FA-40-B: el servicio de IA no está disponible (0 fotos procesadas)]: W --> U: «No se analizó ninguna foto. Verifica que el servicio de IA (ml-service) esté encendido.»; se conservan los análisis anteriores.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-41. Analizar fotografía con la red neuronal

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-41. Analizar fotografía con la red neuronal» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-41 Analizar fotografía con la red neuronal
Participantes (declaración PlantUML, en este orden):
actor "Usuario que publica" as U
participant "Interfaz web\n(formulario con fotos)" as W
participant "API REST\n(ImageAnalysisController / DogImageGuard)" as A
participant "Servicio de IA\n(ml-service: DogNet v2 + etapa de vida)" as IA
database "Base de datos\n(PostgreSQL)" as DB

Precondición: un caso de uso que incluye este análisis envía una o más fotografías: CU-07, CU-08, CU-10, CU-11, CU-13, CU-33 o CU-40.
Postcondición: la fotografía queda validada como imagen de perro, con sus atributos sugeridos y su vector almacenado.

Flujo principal (en este orden):
1. U -> W: Seleccionar una fotografía
2. W -> A: Analizar fotografía (POST /images/analyze, multipart image)
3. A -> IA: Describir imagen (POST /describe)
4. IA -> IA: DogNet v2: determinar si la imagen contiene un perro (o gato, peluche, otro animal u objeto)
5. IA -> IA: Identificar la raza (una de 20 u «Otro») y el tamaño (pequeño, mediano o grande)
6. IA -> IA: Clasificar la etapa de vida (cachorro o adulto) y estimar el color del pelaje
7. IA --> A: Descripción (perro, raza, tamaño, etapa, color y confianzas)
8. A --> W: 200 Descripción
9. W --> U: Atributos sugeridos y la opción «Usar datos detectados»
10. opt [el usuario selecciona «Usar datos detectados»]: W -> W llenar raza, color y, en adopción, tamaño; el usuario puede corregirlos
11. Al guardar la publicación o el reporte: A -> IA verificar de nuevo que sea perro (POST /describe)
12. A -> IA: Obtener el vector (POST /analyze)
13. IA --> A: Vector de 1,280 valores y raza
14. A -> DB: Guardar el vector de la fotografía (INSERT pet_image_embeddings o report_image_embeddings)

Flujos alternos (insértalos donde se indica):
- Tras el paso 7, alt [FA-41-A: la imagen no contiene un perro]: A --> W 200 con el motivo; W --> U muestra el motivo e impide publicar con esa foto; al guardar, la API responde 422.
- Envolviendo los pasos 3 a 7, alt [FA-41-B: el servicio de IA no está disponible]: A --> W: 503 «El reconocimiento de imágenes no está disponible en este momento»; W --> U permite continuar sin el análisis.
- Tras el paso 13, alt [FA-41-C: no se puede generar el vector]: A -> A guarda el registro de todos modos; la foto queda pendiente de analizar (ref CU-40).

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-42. Cerrar caso

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-42. Cerrar caso» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-42 Cerrar caso
Participantes (declaración PlantUML, en este orden):
actor "Responsable del caso" as U
participant "Interfaz web\n(Casos)" as W
participant "API REST\n(CasesController)" as A
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el usuario es el responsable del caso (responsable de la publicación en un caso de adopción o autor del reporte en un caso de perro perdido) y el caso existe (CU-28).
Postcondición: el caso queda adoptado, resuelto o cancelado; en una adopción concluida, el perro deja de mostrarse como disponible.

Flujo principal (en este orden):
1. ref CU-28: el usuario abre el caso
2. W -> W: Verificar que el usuario sea el responsable y mostrar las opciones según el tipo de caso
3. U -> W: Seleccionar «Marcar adoptado» en un caso de adopción
4. W -> A: Cambiar estado (PATCH /cases/{caseId}/status {status: ADOPTED, actorId, message: «Adopción completada.»})
5. A -> DB: Actualizar el caso y registrar el mensaje (UPDATE cases, INSERT case_messages)
6. A -> DB: Cambiar el perro a adoptado (UPDATE pets SET status = ADOPTED)
7. A ->> DB: Notificar al otro participante el nuevo estado (INSERT notifications)
8. A --> W: 200 Caso
9. W --> U: «Caso actualizado» con el nuevo estado

Flujos alternos (insértalos donde se indica):
- En el paso 3, alt [FA-42-A: «Cancelar caso» en adopción]: W -> A PATCH .../status {status: CANCELLED}; A -> DB UPDATE cases; el estado del perro no cambia.
- En el paso 3, alt [FA-42-B: «Caso resuelto» en perro perdido]: W -> A PATCH .../status {status: RESOLVED}; A -> DB UPDATE cases y UPDATE lost_pets SET status = RESOLVED.
- En el paso 3, alt [FA-42-C: «No es mi perro» en perro perdido]: W -> A PATCH .../status {status: CANCELLED}; A -> DB UPDATE cases; el reporte permanece abierto.
- Envolviendo los pasos 4 a 8, alt [FA-42-D: error al actualizar]: W --> U: «No se pudo actualizar el caso»; conserva el estado.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```

## CU-43. Recuperar contraseña

```text
Genera el diagrama de secuencia UML 2.5, en código PlantUML, del caso de uso «CU-43. Recuperar contraseña» de la Plataforma Perreque.

Contexto: Perreque es una plataforma web para la adopción de perros y la reunificación de perros perdidos. Tiene una interfaz web en React, una API REST en Spring Boot con autenticación JWT, una base de datos PostgreSQL y un servicio de IA en Python (FastAPI) con la red neuronal DogNet v2, que reconoce si una foto es de un perro y estima raza, tamaño, etapa de vida y color.

REGLAS DEL DIAGRAMA (UML 2.5, obligatorias)
1. Marco: todo el diagrama va dentro de un marco «sd» con el nombre del caso de uso (en PlantUML: la línea mainframe indicada abajo).
2. Participantes: usa exactamente los indicados, en ese orden de izquierda a derecha y con esos nombres y alias. «actor» se dibuja como monigote, «database» como cilindro y «participant» como rectángulo. No agregues, quites ni renombres participantes.
3. Mensaje síncrono (->): línea continua con punta rellena; el emisor espera respuesta (acciones del actor, peticiones HTTP, consultas a la base de datos, llamadas a servicios).
4. Mensaje de respuesta (-->): línea discontinua con punta abierta, del receptor al emisor, con el resultado (código HTTP y dato, o mensaje en pantalla). Toda petición a la API, a la base de datos o a un servicio externo tiene su respuesta, salvo las marcadas como asíncronas.
5. Mensaje asíncrono (->>): línea continua con punta abierta y sin respuesta; solo donde se indica (registro de notificaciones para otro usuario, envío de correo).
6. Automensaje (X -> X): validaciones y procesos internos de un mismo participante.
7. Barras de activación: activate justo después del mensaje síncrono que recibe el participante y deactivate después de su última respuesta. PlantUML no permite reactivar un participante sin un mensaje de por medio, así que nunca escribas deactivate seguido de activate del mismo participante: dentro de alt y break deja la barra continua a través de los operandos y ciérrala después del último mensaje de ese participante. Ninguna barra queda abierta al final.
8. Numeración: escribe autonumber antes del primer mensaje.
9. Fragmentos combinados (sintaxis PlantUML, cerrados con end):
   - alt / else: caminos excluyentes, cada operando con su guarda.
   - opt: paso opcional.
   - loop: repetición con su condición (por ejemplo, para cada fotografía).
   - break: flujo alterno que termina el caso de uso.
   - par: mensajes simultáneos.
   - ref: otro caso de uso incluido o extendido, sin redibujarlo (ref over X, Y : CU-XX Nombre); si no se indican participantes, cúbrelos todos.
   Escribe la guarda sin corchetes (PlantUML los agrega). Toda guarda de un flujo alterno empieza con su identificador, por ejemplo: alt FA-07-B: la foto supera 3 MB.
10. Notas: la precondición va en «note over <primer participante>, <último participante>» antes del primer mensaje; la postcondición, igual, al final.
11. Ubicación de los flujos alternos: «Tras el paso N» = el fragmento va inmediatamente después del mensaje N. «En el paso N» = alt cuyo primer operando es el paso N y los siguientes son las otras opciones. «Dentro del paso N» = el fragmento va dentro del loop o fragmento del paso N. «Envolviendo los pasos N a M» = alt cuyo primer operando (guarda: operación exitosa) contiene los pasos N a M y cuyo else contiene el flujo alterno. «Antes del paso N» = el fragmento va justo antes del mensaje N. «Nota» = note sobre los participantes involucrados. Si un flujo alterno marcado como alt termina el caso de uso (responde un error, un rechazo o una cancelación y el flujo principal ya no continúa), dibújalo como break; si el flujo principal continúa después, dibújalo como opt o alt.
12. Texto: en español, breve; acciones en infinitivo («Registrar reporte»), respuestas como resultado («200 Reporte registrado»), endpoints y tablas entre paréntesis tal como aparecen, mensajes de pantalla entre comillas latinas «».
13. Fidelidad: usa solo los pasos, endpoints, tablas, mensajes y flujos alternos indicados. No inventes pasos, validaciones ni componentes, y no resumas: el diagrama incluye todos los pasos aunque quede largo.
14. Notación de los pasos de abajo: «X -> Y: texto» es un mensaje síncrono, «X --> Y: texto» una respuesta, «X ->> Y: texto» un mensaje asíncrono y «X -> X: texto» un automensaje. Los pasos sin flecha explícita (ref, loop, opt, par, alt) indican el fragmento que debes dibujar.

ESTILO VISUAL (cópialo tal cual justo después de @startuml; reproduce el estilo de las figuras del TT2)
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam ArrowColor #1565C0
skinparam ArrowThickness 1.3
skinparam sequence {
  LifeLineBorderColor #1565C0
  LifeLineBackgroundColor #D6E6FA
  ParticipantBorderColor #1565C0
  ParticipantBackgroundColor #D6E6FA
  ParticipantFontColor #0D2B4E
  ActorBorderColor #1565C0
  ActorBackgroundColor #D6E6FA
  GroupBorderColor #1565C0
  GroupBackgroundColor #EEF5FD
  GroupHeaderFontStyle bold
  DividerBorderColor #1565C0
  ReferenceBorderColor #1565C0
  ReferenceBackgroundColor #EEF5FD
}
skinparam database {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}
skinparam note {
  BorderColor #1565C0
  BackgroundColor #D6E6FA
}

DATOS DEL CASO DE USO
Marco: mainframe sd CU-43 Recuperar contraseña
Participantes (declaración PlantUML, en este orden):
actor "Usuario\n(cualquier rol)" as U
participant "Interfaz web\n(Recuperar contraseña)" as W
participant "API REST\n(LoginController / PasswordResetService)" as A
participant "Servidor de correo\n(SMTP)" as SMTP
database "Base de datos\n(PostgreSQL)" as DB

Precondición: el actor tiene una cuenta activa con un correo al que tiene acceso.
Postcondición: la contraseña queda actualizada y el actor puede iniciar sesión con ella (CU-02).

Flujo principal (en este orden):
1. U -> W: Seleccionar «¿Olvidaste tu contraseña?» en la pantalla de inicio de sesión
2. W --> U: Solicitar el correo de la cuenta
3. U -> W: Capturar el correo y seleccionar «Enviar código»
4. W -> A: Solicitar código (POST /auth/password-reset/request {email})
5. A -> DB: Buscar usuario activo por correo (users)
6. DB --> A: Usuario
7. A -> DB: Invalidar códigos anteriores y guardar el nuevo código cifrado con vigencia de 15 minutos (UPDATE/INSERT password_reset_codes)
8. A ->> SMTP: Enviar correo con el código de 6 dígitos
9. A --> W: 200 «Si el correo está registrado, te enviamos un código…»
10. W --> U: Mensaje y formulario para el código y la nueva contraseña
11. U -> W: Capturar código, nueva contraseña y confirmación, y seleccionar «Cambiar contraseña»
12. W -> W: Validar código de 6 dígitos y contraseña (≥ 6, mayúsculas, minúsculas y números, confirmación igual)
13. W -> A: Confirmar cambio (POST /auth/password-reset/confirm {email, code, newPassword})
14. A -> DB: Consultar el código vigente del usuario (password_reset_codes)
15. DB --> A: Código
16. A -> A: Verificar el código (BCrypt) y las reglas de la contraseña
17. A -> DB: Actualizar contraseña cifrada (UPDATE users) y marcar el código como usado (UPDATE password_reset_codes)
18. A -> A: Quitar el bloqueo por intentos fallidos, si existía
19. A --> W: 200 «Contraseña actualizada. Ya puedes iniciar sesión.»
20. W --> U: Mensaje y pantalla de inicio de sesión

Flujos alternos (insértalos donde se indica):
- Tras el paso 6, alt [FA-43-A: correo no registrado o cuenta desactivada]: A --> W: 200 con el mismo mensaje, sin generar ni enviar código (no se revela qué correos existen).
- Nota en el paso 8: si el correo no está configurado en el servidor, el código se escribe en el registro del backend (modo de desarrollo).
- Tras el paso 16, alt [FA-43-B: código incorrecto]: A -> DB sumar intento (UPDATE password_reset_codes); A --> W 400 «El código es incorrecto.»; alt [quinto intento] A -> DB invalidar el código; A --> W 400 «Demasiados intentos con este código. Solicita uno nuevo.».
- Tras el paso 15, alt [FA-43-C: el código venció o ya se usó]: A --> W: 400 «El código no es válido o ya venció. Solicita uno nuevo.».
- Tras el paso 12, break [FA-43-D: la contraseña no cumple o no coincide]: W --> U: señala el campo.
- En el paso 11, opt [FA-43-E: «Reenviar código»]: repetir pasos 4 a 9; el código anterior se invalida y no se envía más de un código por minuto.
- En el paso 11, opt [FA-43-F: «Usar otro correo»]: W --> U: vuelve a solicitar el correo.

ENTREGA
Devuelve únicamente un bloque de código que empiece con @startuml y termine con @enduml, sin texto antes ni después. Debe compilar sin errores en https://www.plantuml.com/plantuml. Orden dentro del bloque: el bloque de estilo, la línea mainframe, autonumber, la declaración de participantes, la nota de precondición, los mensajes y la nota de postcondición.
```
