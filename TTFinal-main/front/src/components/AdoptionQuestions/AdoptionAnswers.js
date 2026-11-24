import React from 'react';
import { ADOPTION_QUESTIONS } from '../../constants/adoptionQuestions';
import { Reason, questionsForBreed } from './AdoptionQuestions';
import './AdoptionQuestions.css';

/**
 * Respuestas del solicitante a las preguntas de cuidados y de la raza.
 *
 * props:
 *  - answers: [{ id, question, answer, flag }] (del backend; vacío en solicitudes anteriores)
 *  - breed: raza del perro (para el motivo de cada pregunta de raza)
 *  - name: nombre del solicitante
 *  - compact: versión corta para la tarjeta (solo lo que conviene platicar)
 *  - mine: las ve quien las envió (cambia los textos)
 */
const AdoptionAnswers = ({ answers, breed, name, compact = false, mine = false }) => {
  const list = answers || [];
  const questions = questionsForBreed(breed);
  const reasonOf = Object.fromEntries(questions.map((q) => [q.id, q.porque]));
  const flagged = list.filter((a) => a.flag);
  const who = mine ? 'tú' : (name || 'el solicitante');

  if (compact) {
    if (!list.length) return null;
    return (
      <div className="adoption-a-compact">
        <strong>{list.length} respuestas</strong>
        {flagged.length ? (
          <span>
            {' · Para platicar: '}
            {flagged.map((a) => `${ADOPTION_QUESTIONS[a.id]?.corta || a.question} (${a.answer})`).join(', ')}
          </span>
        ) : (
          <span> · Nada marcado para platicar</span>
        )}
      </div>
    );
  }

  if (!list.length) {
    return (
      <div className="adoption-a">
        <h4>Respuestas a las preguntas</h4>
        <p className="adoption-a-empty">
          {mine
            ? 'Enviaste esta solicitud antes de que existieran las preguntas.'
            : `Esta solicitud se envió antes de que existieran las preguntas. Puedes hacérselas a ${who} en el chat del caso:`}
        </p>
        {!mine && (
          <ul className="adoption-a-todo">
            {questions.map((q) => <li key={q.id}>{q.texto}</li>)}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="adoption-a">
      <h4>{mine ? 'Tus respuestas' : `Lo que respondió ${who}`}</h4>
      {!mine && (
        <p className="adoption-a-help">
          {flagged.length
            ? `${flagged.length} respuesta${flagged.length === 1 ? '' : 's'} marcada${flagged.length === 1 ? '' : 's'} "Para platicar": no descartan a nadie, son temas para hablar en el chat.`
            : 'Ninguna respuesta quedó marcada para platicar.'}
        </p>
      )}
      <dl className="adoption-a-list">
        {list.map((a) => (
          <div key={a.id} className={`adoption-a-row${a.flag ? ' is-flagged' : ''}`}>
            <dt>{a.question}</dt>
            <dd>
              <strong>{a.answer}</strong>
              {a.flag && <span className="adoption-a-tag">Para platicar</span>}
              {!mine && <Reason porque={reasonOf[a.id]} />}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default AdoptionAnswers;
