import React from 'react';
import { BREED_SOURCES, getBreedProfile } from '../../constants/breedProfiles';
import { questionsFor } from '../../constants/adoptionQuestions';
import './AdoptionQuestions.css';

/** Preguntas para la raza del perro (generales + las de su raza, con el motivo). */
export const questionsForBreed = (breed) => questionsFor(getBreedProfile(breed)?.preguntas);

/** Motivo de una pregunta de raza, con el enlace a su fuente. */
export const Reason = ({ porque }) => {
  if (!porque) return null;
  const source = BREED_SOURCES[[].concat(porque.fuente)[0]];
  return (
    <small className="adoption-q-reason">
      Por qué se pregunta: {porque.texto}
      {source && (
        <>
          {' '}
          <a href={source.url} target="_blank" rel="noopener noreferrer" title={source.cita}>Fuente</a>
        </>
      )}
    </small>
  );
};

/**
 * Preguntas que contesta quien quiere adoptar (una opción por pregunta).
 *
 * props:
 *  - questions: questionsForBreed(raza)
 *  - values: { idPregunta: opción elegida }
 *  - onChange(values)
 *  - showMissing: marca las que faltan (después de intentar enviar)
 */
const AdoptionQuestions = ({ questions, values, onChange, disabled, showMissing = false }) => (
  <div className="adoption-q">
    {questions.map((q, index) => {
      const missing = showMissing && !values[q.id];
      return (
        <fieldset key={q.id} className={`adoption-q-item${missing ? ' is-missing' : ''}`} disabled={disabled}>
          <legend>
            <span className="adoption-q-num">{index + 1}.</span> {q.texto}
          </legend>
          <div className="adoption-q-options" role="radiogroup">
            {q.opciones.map((o) => (
              <label key={o.valor} className={`adoption-q-option${values[q.id] === o.valor ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name={`adoption-q-${q.id}`}
                  value={o.valor}
                  checked={values[q.id] === o.valor}
                  onChange={() => onChange({ ...values, [q.id]: o.valor })}
                />
                {o.valor}
              </label>
            ))}
          </div>
          <Reason porque={q.porque} />
          {missing && <small className="adoption-q-missing">Elige una opción.</small>}
        </fieldset>
      );
    })}
  </div>
);

export default AdoptionQuestions;
