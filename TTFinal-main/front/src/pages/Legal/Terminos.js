import React from 'react';
import { Link } from 'react-router-dom';
import { CORREO_CONTACTO } from '../../constants/contacto';
import LegalPage, { VerSeccion } from './LegalPage';

// Alineado con la sección 4.4.4.2 del TT2 (usos prohibidos, uso de imágenes, carácter de sugerencia de los
// resultados, moderación y contacto), la Tabla 26 (delimitación de responsabilidades) y el alcance del
// capítulo 1 (reglas de las fotos y aclaración de términos). Incluye además las reglas de los chats,
// la adopción gratuita, la edad mínima y la edición de solicitudes y avisos.

const correo = <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>;

const secciones = [
  {
    id: 'que-es',
    titulo: '¿Qué es PERREQUE?',
    contenido: (
      <>
        <p>
          Una plataforma web con dos propósitos: encontrarles casa a perros en adopción y ayudar a que los perros
          perdidos vuelvan con su familia. Conecta a quienes quieren adoptar con refugios, rescatistas y personas
          autorizadas para publicar, y compara con una red neuronal las fotos de perros perdidos y encontrados para
          sugerir posibles coincidencias.
        </p>
        <p>
          PERREQUE es solo el punto de encuentro. No somos un refugio ni una autoridad, no participamos en los acuerdos
          que hagas con otras personas y no cobramos ni procesamos pagos de ningún tipo.
        </p>
      </>
    ),
  },
  {
    id: 'aceptacion',
    titulo: 'Al usar PERREQUE aceptas estos términos',
    contenido: (
      <p>
        Al crear tu cuenta marcas una casilla con la que aceptas estos términos y el{' '}
        <Link to="/privacidad">Aviso de privacidad</Link>. Cada vez que publicas un anuncio confirmas, además, que los
        datos son verdaderos y que tienes permiso para usar las fotos. Si no estás de acuerdo con algo de lo que dice
        aquí, te pedimos no crear una cuenta.
      </p>
    ),
  },
  {
    id: 'quien-puede',
    titulo: '¿Quién puede usarlo?',
    contenido: (
      <p>
        Necesitas tener <strong>18 años o más</strong>. En los casos se comparten teléfonos y correos, y a veces se
        acuerda una cita en persona para conocer o entregar a un perro, así que la plataforma no es para menores de
        edad. Al registrarte confirmas tu edad; si el administrador se da cuenta de que una cuenta es de un menor, la
        desactiva.
      </p>
    ),
  },
  {
    id: 'cuenta',
    titulo: 'Tu cuenta',
    contenido: (
      <>
        <p>
          Hay tres tipos de cuenta: usuario, refugio y administrador. Con cualquier cuenta puedes reportar perros
          perdidos o encontrados y solicitar una adopción. Para publicar perros en adopción necesitas ser refugio o
          tener la autorización del administrador.
        </p>
        <ul>
          <li>Registra datos reales y actualízalos en «Mi perfil» si cambian.</li>
          <li>Tu contraseña es solo tuya: eres responsable de lo que se haga con tu cuenta.</li>
          <li>Puedes eliminar tu cuenta cuando quieras desde «Mi perfil».</li>
          <li>El administrador puede desactivar las cuentas que no respeten estos términos.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'publicaciones',
    titulo: 'Lo que publicas y tus fotos',
    contenido: (
      <>
        <p>
          Lo que publicas, reportas o envías a otras personas es tu responsabilidad. Por eso, antes de publicar te
          pedimos confirmar que los datos son verdaderos y que las fotos son tuyas o tienes permiso para subirlas.
        </p>
        <ul>
          <li>
            Las fotos siguen siendo tuyas. Solo nos permites mostrarlas en tu publicación y analizarlas para buscar
            coincidencias mientras estén publicadas. No las usamos para publicidad ni se las damos a nadie más.
          </li>
          <li>
            Cada foto debe ser de un solo perro, clara y con buena luz. Si la red detecta un gato, un peluche, otro
            animal, un objeto o más de un perro, no permite publicarla.
          </li>
          <li>El administrador revisa las publicaciones y puede desactivar o borrar las que no cumplan estas reglas.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'reconocimiento',
    titulo: 'Cómo funciona el reconocimiento de imágenes',
    contenido: (
      <>
        <p>
          Cuando subes una foto, la red neuronal comprueba que sea de un perro y sugiere su raza (entre 20 razas, u
          «Otro» si no la reconoce), su tamaño, si es cachorro o adulto y su color. La raza es aproximada y no equivale
          a un dictamen veterinario. Puedes corregir cualquiera de esos datos antes de publicar.
        </p>
        <p>
          En los reportes, la red compara cada perro perdido con los encontrados, y viceversa, y te muestra los más
          parecidos, cada uno con un porcentaje de coincidencia. La mayor parte (80 de 100) sale de lo que la red ve en
          las fotos: qué tanto se parecen y si coinciden la raza, el tamaño, la etapa (cachorro o adulto) y los colores
          que detecta; el resto (20 de 100) sale de lo que se capturó: qué tan cerca están los lugares, el sexo, la raza
          y el color. No es la probabilidad de que sea el mismo perro ni una identificación oficial. Solo te mostramos
          los que coinciden más de 40 % y tienen algún rasgo en común (fotos parecidas, raza, tamaño, etapa o color), y
          si un reporte nuevo cumple eso con el tuyo, te avisamos. Las que no te sirvan las puedes descartar.
          El resultado depende mucho de la foto: la calidad, la luz y el ángulo cambian lo que la red alcanza a ver.
        </p>
        <p>
          Por eso no podemos prometerte que vas a encontrar a tu perro. La plataforma sugiere y las personas deciden:
          confirmar que se trata del mismo perro te corresponde a ti, de preferencia en persona.
        </p>
      </>
    ),
  },
  {
    id: 'prohibido',
    titulo: 'Lo que no está permitido',
    contenido: (
      <>
        <p>Queremos que PERREQUE sea un lugar seguro para las personas y para los perros. Por eso no se permite:</p>
        <ul>
          <li>Publicar contenido que fomente el maltrato o el abandono de animales.</li>
          <li>Vender, comprar o intercambiar animales.</li>
          <li>Hacerse pasar por otra persona, por un refugio o por el dueño de un perro.</li>
          <li>Publicar información falsa o difamatoria.</li>
          <li>Compartir datos personales de otras personas sin su permiso.</li>
          <li>
            Pedir dinero a cambio de un perro (lo explicamos en <VerSeccion id="gratuita">Adoptar es gratis</VerSeccion>).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'gratuita',
    titulo: 'Adoptar es gratis',
    contenido: (
      <>
        <p>
          En PERREQUE, publicar un perro en adopción y adoptarlo no cuesta nada. Nadie puede cobrar, pedir ni exigir
          pagos, cuotas, depósitos o anticipos a cambio de un perro, ni condicionar la adopción o la entrega a un pago,
          ya sea en la publicación o en el chat.
        </p>
        <p>
          Con los perros perdidos sucede lo mismo: no se puede pedir una «recompensa» ni ningún otro pago para entregar
          o devolver un perro, ni condicionar su devolución a que te paguen.
        </p>
        <p>
          Si alguien te pide dinero, no pagues y repórtalo desde el chat (ve{' '}
          <VerSeccion id="reportar">Reportar y bloquear</VerSeccion>).
        </p>
      </>
    ),
  },
  {
    id: 'adopciones',
    titulo: 'Adopciones y casos entre usuarios',
    contenido: (
      <>
        <p>
          Cuando quien publicó atiende tu solicitud de adopción o tu aviso sobre un perro, se abre un caso con un chat
          entre ustedes dos.
        </p>
        <ul>
          <li>
            Envía una sola solicitud por perro y un solo aviso por reporte. Si te equivocaste, corrígelo desde
            «Solicitudes» en lugar de mandar otro.
          </li>
          <li>
            Mientras nadie la atiende puedes corregir todo. Con el caso abierto solo puedes cambiar tus datos de
            contacto; lo demás coméntalo en el chat.
          </li>
          <li>Si vuelves a ver al perro, agrégalo como otro avistamiento en tu mismo aviso.</li>
          <li>Quien publicó puede ver que corregiste tu solicitud o tu aviso y la fecha del cambio.</li>
        </ul>
        <p>
          PERREQUE no realiza adopciones con valor legal, no certifica quién es el dueño de un perro y no sustituye los
          trámites formales de adopción ni las denuncias ante las autoridades. Lo que se acuerde en un caso es
          responsabilidad de las personas involucradas. Las recomendaciones por raza que mostramos al contactar son
          informativas y no reemplazan la opinión de un médico veterinario.
        </p>
      </>
    ),
  },
  {
    id: 'chats',
    titulo: 'Cómo usar los chats',
    contenido: (
      <>
        <p>El chat de cada caso es para hablar de ese perro. En él no se permite:</p>
        <ul>
          <li>Insultar, decir groserías o usar lenguaje ofensivo o discriminatorio.</li>
          <li>Acosar, amenazar, presionar o seguir insistiendo cuando la otra persona ya dijo que no.</li>
          <li>Pedir o exigir dinero o cualquier otro pago.</li>
          <li>
            Engañar: ofrecer un perro que no existe o que no es el del reporte, enviar fotos ajenas o decir que eres el
            dueño sin serlo.
          </li>
          <li>Enviar spam, publicidad o enlaces que no tengan que ver con el perro.</li>
          <li>Compartir datos personales de otras personas sin su permiso.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'reportar',
    titulo: 'Reportar y bloquear',
    contenido: (
      <>
        <p>Si algo no va bien en un chat, cualquiera de las dos personas del caso puede, desde el mismo chat:</p>
        <ul>
          <li>
            <strong>Reportar al administrador.</strong> Eliges el motivo y, si quieres, el mensaje concreto. Para que
            pueda revisarlo guardamos una copia de los últimos mensajes de la persona reportada, a quien no le avisamos
            del reporte.
          </li>
          <li>
            <strong>Bloquear el chat.</strong> Nadie puede escribir en ese caso hasta que quien lo bloqueó, o el
            administrador, lo desbloquee.
          </li>
          <li>
            <strong>Bloquear a la otra persona.</strong> Ninguno de los dos podrá escribirle al otro en ningún caso ni
            enviarle solicitudes de adopción o avisos. Puedes ver y quitar tus bloqueos en «Mi perfil».
          </li>
        </ul>
        <p>Eso sí: hacer reportes falsos o usarlos para molestar a alguien también es una falta.</p>
      </>
    ),
  },
  {
    id: 'moderacion',
    titulo: 'Qué hace el administrador',
    contenido: (
      <>
        <p>
          El administrador modera las publicaciones, las solicitudes, los avisos y las conversaciones. Cuando recibe un
          reporte de mal uso revisa la conversación y, según la gravedad, puede descartar el reporte si no encuentra una
          falta, bloquear el chat del caso, desactivar o eliminar publicaciones, solicitudes o avisos, o desactivar la
          cuenta de quien no respetó estos términos. Quien hizo el reporte recibe una notificación cuando ya se revisó.
        </p>
        <p>
          Si hubo un intento de extorsión, fraude, amenazas o maltrato animal, además de reportarlo aquí te
          recomendamos presentar una denuncia ante las autoridades, por ejemplo ante la Fiscalía o la Policía
          Cibernética. PERREQUE no sustituye esa denuncia.
        </p>
      </>
    ),
  },
  {
    id: 'seguridad',
    titulo: 'Consejos para cuidarte',
    contenido: (
      <ul>
        <li>Si te piden dinero para recibir o recuperar un perro, no pagues ni deposites.</li>
        <li>No compartas datos bancarios, contraseñas ni códigos que te lleguen por correo o mensaje.</li>
        <li>Si vas a conocer o entregar a un perro, haz la cita en un lugar público, de día y, si puedes, ve acompañado.</li>
        <li>
          Antes de la cita, pide fotos recientes o señas que solo el dueño conoce: cicatrices, collar, placa o cartilla.
        </li>
        <li>Desconfía de quien te presiona o tiene mucha prisa, y mantén la conversación en el chat de PERREQUE.</li>
      </ul>
    ),
  },
  {
    id: 'responsabilidad',
    titulo: 'Hasta dónde llega nuestra responsabilidad',
    contenido: (
      <>
        <p>
          PERREQUE es una herramienta que conecta a personas, no un organismo oficial. No respondemos por los actos de
          los usuarios ni podemos garantizar que los resultados de la red sean exactos. Así se reparten las
          responsabilidades:
        </p>
        <table className="legal-tabla">
          <thead>
            <tr>
              <th>La plataforma</th>
              <th>Tú, como usuario</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Proporcionar una herramienta tecnológica que funcione.</td>
              <td>Asegurarte de que lo que publicas es verdadero y de que cuentas con los permisos necesarios.</td>
            </tr>
            <tr>
              <td>Generar una lista de posibles coincidencias basadas en el parecido visual de las fotos.</td>
              <td>Hacer la verificación final, en persona, de que se trata del mismo perro.</td>
            </tr>
            <tr>
              <td>Cuidar la privacidad y la seguridad de tus datos conforme a la LFPDPPP.</td>
              <td>Usar la plataforma de forma ética, sin publicaciones falsas o difamatorias.</td>
            </tr>
            <tr>
              <td>Mantener en funcionamiento la infraestructura tecnológica.</td>
              <td>Entender que la plataforma es un intermediario y no un organismo oficial de identificación.</td>
            </tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    id: 'propiedad',
    titulo: 'Propiedad intelectual',
    contenido: (
      <p>
        El código, el diseño y la documentación de PERREQUE pertenecen a sus desarrolladores. La red neuronal se
        construyó con modelos preentrenados y conjuntos de datos públicos, que se usan solo con fines académicos y según
        sus propias licencias. Las fotos y los textos que publicas siguen siendo tuyos (ve{' '}
        <VerSeccion id="publicaciones">Lo que publicas y tus fotos</VerSeccion>).
      </p>
    ),
  },
  {
    id: 'cambios',
    titulo: 'Si cambiamos estos términos',
    contenido: <p>Publicaremos la nueva versión en esta misma página, con su fecha de actualización.</p>,
  },
  {
    id: 'contacto',
    titulo: 'Dudas y quejas',
    contenido: (
      <p>
        Si el problema es en un chat, repórtalo desde ahí mismo (ve{' '}
        <VerSeccion id="reportar">Reportar y bloquear</VerSeccion>). Para cualquier otra duda o queja, o para reportar
        una publicación indebida, escríbenos a {correo}. El administrador atiende los reportes y las quejas.
      </p>
    ),
  },
];

const Terminos = () => (
  <LegalPage
    titulo="Términos y condiciones de uso"
    intro={
      <p>
        Antes de usar PERREQUE, tómate unos minutos para leer esto. Intentamos escribirlo lo más claro posible: qué
        puedes esperar de la plataforma, qué esperamos de ti y qué pasa cuando alguien no respeta las reglas.
      </p>
    }
    secciones={secciones}
    cierre={
      <p className="legal-cierre">
        Consulta también el <Link to="/privacidad">Aviso de privacidad</Link>.
      </p>
    }
  />
);

export default Terminos;
