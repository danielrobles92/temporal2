import React from 'react';
import { Link } from 'react-router-dom';
import { CORREO_CONTACTO } from '../../constants/contacto';
import LegalPage, { VerSeccion } from './LegalPage';

// Alineado con la sección 4.4.4 del TT2: LFPDPPP de 2025 y SABG (4.4.4.1), aviso de privacidad con
// consentimiento expreso, derechos ARCO y medidas de seguridad (4.4.4.2 a), uso exclusivo de las imágenes
// (4.4.4.2 b) y canales de atención (4.4.4.2 g). Refleja lo que la plataforma hace con los datos: reportes y
// bloqueos de los chats, punto del mapa de los avisos, edición de solicitudes y avisos, lo que se conserva al
// eliminar la cuenta y los servicios externos que se usan.

const correo = <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>;

const secciones = [
  {
    id: 'responsable',
    titulo: 'Quién es responsable de tus datos',
    contenido: (
      <p>
        El equipo de desarrollo de PERREQUE es el responsable de tratar tus datos personales. Para cualquier asunto
        relacionado con ellos puedes escribirnos a {correo}.
      </p>
    ),
  },
  {
    id: 'datos',
    titulo: 'Qué datos recabamos',
    contenido: (
      <>
        <p>Solo pedimos lo necesario para que la plataforma funcione:</p>
        <ul>
          <li>
            <strong>Tu cuenta:</strong> nombre de usuario, correo electrónico, teléfono y contraseña. La contraseña se
            guarda cifrada (BCrypt), así que nadie puede leerla, ni siquiera nosotros. No pedimos tu fecha de
            nacimiento: solo que confirmes que tienes 18 años o más.
          </li>
          <li>
            <strong>Tus publicaciones y reportes:</strong> los datos y las fotos del perro, la ubicación (alcaldía,
            colonia o punto en el mapa) y el teléfono de contacto que escribas en un reporte. De cada foto guardamos
            también un vector numérico, que es lo que la red usa para compararla con otras.
          </li>
          <li>
            <strong>Tus solicitudes de adopción:</strong> el nombre, el correo, el teléfono y el mensaje que envíes, y
            la fecha en que los corrijas.
          </li>
          <li>
            <strong>Tus avisos de perros perdidos o encontrados:</strong> nombre, correo, teléfono, lo que nos cuentes
            del perro, las fotos, la dirección y el punto del mapa donde lo viste, los otros avistamientos que agregues
            y la fecha en que corrijas el aviso.
          </li>
          <li>
            <strong>Tus casos:</strong> los mensajes y fotos que intercambies con la otra persona y, si alguien bloquea
            el chat, quién lo hizo y cuándo.
          </li>
          <li>
            <strong>La seguridad de los chats:</strong> las personas que bloqueas y los reportes de mal uso que hagas o
            que se hagan sobre ti: el motivo, los detalles, el mensaje señalado y una copia de los últimos mensajes de
            la persona reportada en ese chat.
          </li>
          <li>
            <strong>La ubicación de tu dispositivo,</strong> solo si pulsas «Mi ubicación» en el mapa. Tu navegador te
            pide permiso, la usamos para colocar el punto y solo se guarda si envías el formulario.
          </li>
          <li>
            <strong>En tu navegador</strong> guardamos tu sesión y, si eliges «Recordarme», tu correo. No usamos cookies
            de rastreo ni herramientas de analítica.
          </li>
        </ul>
        <p>No te pedimos datos personales sensibles.</p>
      </>
    ),
  },
  {
    id: 'finalidades',
    titulo: 'Para qué los usamos',
    contenido: (
      <>
        <p>Para darte el servicio necesitamos usar tus datos para:</p>
        <ul>
          <li>Crear y administrar tu cuenta y permitirte iniciar sesión.</li>
          <li>Publicar y mostrar perros en adopción y reportes de perros perdidos o encontrados.</li>
          <li>
            Analizar tus fotos con la red neuronal para comprobar que son de un perro, sugerir sus datos y buscar
            coincidencias. Las fotos no se usan para nada más: ni publicidad ni entrega a terceros.
          </li>
          <li>
            Ponerte en contacto con otras personas mediante solicitudes, avisos y casos, mostrarles las correcciones que
            hagas y enviarte notificaciones.
          </li>
          <li>
            Proteger tu cuenta: bloquear el acceso por un tiempo si hay varios intentos fallidos y enviarte un código
            por correo si olvidas tu contraseña.
          </li>
          <li>
            Mantener segura la plataforma: atender los reportes de mal uso, aplicar bloqueos y prevenir fraudes, cobros
            indebidos, acoso o engaños.
          </li>
          <li>Moderar publicaciones, solicitudes, avisos y conversaciones.</li>
        </ul>
        <p>
          Además, usamos estadísticas que no identifican a nadie para evaluar el prototipo con fines académicos. Si no
          estás de acuerdo con esto, escríbenos; no afecta en nada tu uso de la plataforma.
        </p>
      </>
    ),
  },
  {
    id: 'consentimiento',
    titulo: 'Tu consentimiento',
    contenido: (
      <p>
        Nos das tu consentimiento de forma expresa al marcar la casilla del registro, y lo confirmas cada vez que
        publicas un anuncio. Puedes retirarlo cuando quieras escribiéndonos o eliminando tu cuenta (ve{' '}
        <VerSeccion id="arco">Tus derechos ARCO</VerSeccion>); solo ten en cuenta que, sin él, ya no podremos darte el
        servicio.
      </p>
    ),
  },
  {
    id: 'quien-ve',
    titulo: 'Quién puede ver tus datos',
    contenido: (
      <ul>
        <li>
          <strong>Cualquier visitante, aunque no haya iniciado sesión:</strong> los perros en adopción, con tu nombre de
          usuario como quien publicó, y los reportes de perros perdidos o encontrados con sus fotos, la ubicación y el
          teléfono de contacto del reporte.
        </li>
        <li>
          <strong>Quien publicó un perro:</strong> el nombre, correo, teléfono y mensaje de quien le envía una solicitud
          de adopción, y si la corrigió.
        </li>
        <li>
          <strong>Quien hizo un reporte:</strong> los datos de contacto de quien le envía un aviso, lo que cuenta del
          perro, sus fotos, el punto del mapa, los otros avistamientos y si corrigió el aviso.
        </li>
        <li>
          <strong>Dentro de un caso:</strong> cada persona ve el nombre de la otra, el correo de quien publicó, los
          datos de contacto de quien solicitó o avisó, y los mensajes.
        </li>
        <li>
          <strong>Si bloqueas:</strong> la persona bloqueada verá que ya no aceptas sus mensajes y, si bloqueas un chat,
          en él aparece un aviso de que está bloqueado. A nadie le avisamos que fue reportado.
        </li>
        <li>
          <strong>El administrador:</strong> los datos de las cuentas, las publicaciones, las solicitudes, los avisos y
          las conversaciones de los casos, porque los necesita para administrar y moderar la plataforma. En un reporte
          de mal uso ve quién reportó, a quién, el motivo y la copia de los mensajes.
        </li>
      </ul>
    ),
  },
  {
    id: 'terceros',
    titulo: 'Con quién los compartimos fuera de PERREQUE',
    contenido: (
      <>
        <p>
          No vendemos ni transferimos tus datos personales, y las fotos se analizan en el mismo servidor de la
          plataforma. Para funcionar usamos estos servicios externos, que reciben solo lo indispensable:
        </p>
        <ul>
          <li>
            <strong>OpenStreetMap</strong> (Photon y Nominatim): recibe lo que escribes en el buscador del mapa y las
            coordenadas del punto que eliges, para sugerirte direcciones. El mapa se descarga de sus servidores, que
            ven la dirección IP de tu navegador.
          </li>
          <li>
            <strong>Google (Gmail):</strong> recibe tu correo y el código de recuperación de contraseña para enviártelo.
          </li>
          <li>
            <strong>Cloudflare:</strong> en la versión publicada, la conexión cifrada pasa por su red.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'conservacion',
    titulo: 'Cuánto tiempo los guardamos',
    contenido: (
      <>
        <p>Mientras tu cuenta exista. Si la eliminas desde «Mi perfil»:</p>
        <ul>
          <li>
            Borramos tus datos de cuenta, tus reportes de perros perdidos o encontrados, tus solicitudes de adopción,
            tus notificaciones, las personas que bloqueaste, los reportes de mal uso que hiciste y los casos de tus
            publicaciones y reportes, con sus mensajes.
          </li>
          <li>
            Para que la otra persona no pierda la conversación, se conservan tus mensajes en los casos donde
            solicitaste o avisaste, y los avisos que enviaste sobre perros de otras personas, con los datos de contacto
            que escribiste en ellos. Si quieres que también los borremos, escríbenos.
          </li>
          <li>
            Si publicaste perros en adopción, retíralos desde «Mis anuncios» antes de eliminar tu cuenta o pídele al
            administrador que lo haga.
          </li>
          <li>
            Los reportes de mal uso que se hicieron sobre ti, con la copia de los mensajes, se conservan solo mientras
            sean necesarios para la seguridad de la plataforma.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'arco',
    titulo: 'Tus derechos ARCO',
    contenido: (
      <>
        <p>
          Tienes derecho a Acceder a tus datos, Rectificarlos, Cancelarlos y Oponerte a que los usemos. Así puedes
          hacerlo:
        </p>
        <ul>
          <li>
            <strong>Acceso y rectificación:</strong> en «Mi perfil» puedes ver y corregir tu nombre de usuario y tu
            teléfono, y consultar a quién bloqueaste. En «Solicitudes» puedes ver y corregir tus solicitudes de adopción
            y los avisos que enviaste.
          </li>
          <li>
            <strong>Cancelación:</strong> en «Mi perfil» puedes eliminar tu cuenta.
          </li>
          <li>
            <strong>Oposición, retiro del consentimiento o cualquier otra petición:</strong> escríbenos a {correo} con tu
            nombre de usuario, el correo de tu cuenta, el derecho que quieres ejercer y una descripción de lo que
            necesitas. Te responderemos dentro de los plazos que establece la LFPDPPP.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'proteccion',
    titulo: 'Cómo protegemos tus datos',
    contenido: (
      <>
        <p>
          Las contraseñas se guardan cifradas y tu sesión usa un token que vence a las 4 horas, o a los 7 días si
          eliges «Recordarme». Si alguien falla cinco veces seguidas al intentar entrar con tu correo, el acceso se
          bloquea durante 15 minutos. La versión publicada usa conexión segura (HTTPS), cada tipo de cuenta solo puede
          hacer lo que le corresponde y la conversación de un caso solo la ven quienes participan en ella y el
          administrador.
        </p>
        <p>Ninguna medida es infalible. Si detectas algún problema, avísanos.</p>
      </>
    ),
  },
  {
    id: 'cambios',
    titulo: 'Si cambiamos este aviso',
    contenido: <p>Publicaremos la nueva versión en esta misma página, con su fecha de actualización.</p>,
  },
  {
    id: 'autoridad',
    titulo: 'Ante quién puedes acudir',
    contenido: (
      <p>
        Si consideras que no se respetó tu derecho a la protección de tus datos personales, puedes acudir a la
        Secretaría Anticorrupción y Buen Gobierno (SABG), que desde 2025 es la autoridad en la materia en lugar del
        INAI.
      </p>
    ),
  },
];

const Privacidad = () => (
  <LegalPage
    titulo="Aviso de privacidad"
    intro={
      <p>
        Aquí te contamos qué datos personales usa PERREQUE, para qué, quién puede verlos y cómo puedes pedir que los
        corrijamos o los borremos. Lo hacemos conforme a la Ley Federal de Protección de Datos Personales en Posesión de
        los Particulares (LFPDPPP), vigente desde el 21 de marzo de 2025.
      </p>
    }
    secciones={secciones}
    cierre={
      <p className="legal-cierre">
        Consulta también los <Link to="/terminos">Términos y condiciones</Link>.
      </p>
    }
  />
);

export default Privacidad;
