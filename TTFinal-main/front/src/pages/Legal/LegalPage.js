import React from 'react';
import { FECHA_DOCUMENTOS_LEGALES } from '../../constants/contacto';
import './Legal.css';

// Plantilla común de /terminos y /privacidad (TT2, sección 6.4): título, fecha de actualización,
// aviso de que es un prototipo académico, índice de secciones y el contenido.

const irASeccion = (e, id) => {
  e.preventDefault();
  const destino = document.getElementById(id);
  if (!destino) return;
  destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Mueve el foco al título para que el teclado y los lectores de pantalla sigan al salto.
  destino.querySelector('h2')?.focus({ preventScroll: true });
};

// Enlace a otra sección de la misma página.
export const VerSeccion = ({ id, children }) => (
  <a href={`#${id}`} onClick={(e) => irASeccion(e, id)}>
    {children}
  </a>
);

const LegalPage = ({ titulo, intro, secciones, cierre }) => (
  <div className="legal-page">
    <article className="legal-card">
      <h1>{titulo}</h1>
      <p className="legal-meta">Última actualización: {FECHA_DOCUMENTOS_LEGALES}</p>

      <p className="legal-nota">
        PERREQUE es un prototipo académico, desarrollado como Trabajo Terminal (2026-B014) en la Escuela Superior de
        Cómputo del IPN. Es gratuito, no tiene fines comerciales y, como todo prototipo, puede fallar o cambiar sin
        aviso previo.
      </p>

      {intro}

      <nav className="legal-indice" aria-label="Contenido de la página">
        <p className="legal-indice-titulo">En esta página</p>
        <ol>
          {secciones.map((s) => (
            <li key={s.id}>
              <VerSeccion id={s.id}>{s.titulo}</VerSeccion>
            </li>
          ))}
        </ol>
      </nav>

      {secciones.map((s, i) => (
        <section key={s.id} id={s.id} className="legal-seccion">
          <h2 tabIndex={-1}>
            {i + 1}. {s.titulo}
          </h2>
          {s.contenido}
        </section>
      ))}

      {cierre}
    </article>
  </div>
);

export default LegalPage;
