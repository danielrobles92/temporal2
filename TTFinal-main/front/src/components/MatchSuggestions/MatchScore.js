import React from 'react';
import './MatchSuggestions.css';

// Porcentaje de coincidencia (backend: domain/core/MatchScoring). Solo se muestran las de más
// de 40 % (media o alta) con algún rasgo en común; desde 41 % se avisa a quien publicó.
export const NOTIFY_ABOVE = 40;
export const scoreLevel = (s) => (s >= 70 ? 'high' : s > NOTIFY_ABOVE ? 'mid' : 'low');
export const scoreText = (s) => (s >= 70 ? 'Coincidencia alta' : s > NOTIFY_ABOVE ? 'Coincidencia media' : 'Coincidencia baja');

// Mismos cortes que MatchScoring.photoLabel (coseno entre las fotos).
const PHOTO_ALIKE = 0.55;
const photoText = (cos) => {
  if (cos == null) return 'Sin foto para comparar';
  if (cos >= 0.70) return 'Muy parecidas';
  if (cos >= PHOTO_ALIKE) return 'Parecidas';
  if (cos >= 0.40) return 'Algo parecidas';
  return 'Distintas';
};

const SIZE = { pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande' };
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const breedText = (ai) => {
  if (!ai?.breed) return 'No reconocida';
  if (norm(ai.breed) === 'otro') return 'Otra raza o mestizo';
  const pct = ai.breedConfidence != null ? ` ${Math.round(ai.breedConfidence * 100)} %` : '';
  return `${ai.breed}${pct}`;
};
// Igual que el backend: solo cuenta una raza del catálogo con certeza de 0.4 o más.
const sureBreed = (ai) => ai?.breed && norm(ai.breed) !== 'otro' && (ai.breedConfidence ?? 0) >= 0.4;

/** Filas de «En el análisis se identificó» en cada perro y si coinciden (✓ = rasgo en común). */
const aiRows = (a, b) => [
  {
    label: 'Raza',
    left: breedText(a),
    right: breedText(b),
    same: sureBreed(a) && sureBreed(b) ? norm(a.breed) === norm(b.breed) : null,
  },
  {
    label: 'Tamaño',
    left: SIZE[a?.size] || cap(a?.size) || 'Sin dato',
    right: SIZE[b?.size] || cap(b?.size) || 'Sin dato',
    same: a?.size && b?.size ? a.size === b.size : null,
  },
  {
    label: 'Etapa',
    left: cap(a?.stage) || 'Sin dato',
    right: cap(b?.stage) || 'Sin dato',
    same: a?.stage && b?.stage ? a.stage === b.stage : null,
  },
  {
    label: 'Colores',
    left: a?.colors?.length ? a.colors.join(', ') : 'Sin dato',
    right: b?.colors?.length ? b.colors.join(', ') : 'Sin dato',
    same: a?.colors?.length && b?.colors?.length
      ? a.colors.some((c) => b.colors.map(norm).includes(norm(c))) : null,
  },
];

const Mark = ({ same }) => (
  <>
    {same === true && <span className="match-ai-mark" aria-label="coincide">✓</span>}
    {same === false && <span className="match-ai-mark" aria-label="no coincide">≠</span>}
  </>
);

/**
 * Porcentaje de coincidencia y lo que identificó el análisis en cada perro, lado a lado.
 * No es la probabilidad de ser el mismo perro.
 *
 * props: score, visualScore (coseno entre las fotos), reportAi, candidateAi,
 *        labels ([propio, candidato]), compact
 */
const MatchScore = ({ score, visualScore, reportAi, candidateAi, labels = ['Tu reporte', 'Este perro'], compact = false }) => {
  const showAi = reportAi || candidateAi;
  const photosAlike = visualScore != null ? visualScore >= PHOTO_ALIKE : null;
  return (
    <div className={`match-score ${scoreLevel(score)}${compact ? ' is-compact' : ''}`}>
      <div className="match-score-head">
        <span className="match-score-pct">{score}%</span>
        <span className="match-score-text">{scoreText(score)}</span>
      </div>

      {showAi && (
        <table className="match-ai">
          <caption>En el análisis se identificó:</caption>
          <thead>
            <tr><th scope="col" aria-label="Dato" /><th scope="col">{labels[0]}</th><th scope="col">{labels[1]}</th></tr>
          </thead>
          <tbody>
            <tr className={photosAlike ? 'is-same' : ''}>
              <th scope="row"><Mark same={photosAlike ? true : null} />Fotos</th>
              <td colSpan={2}>{photoText(visualScore)}</td>
            </tr>
            {aiRows(reportAi, candidateAi).map((r) => (
              <tr key={r.label} className={r.same === true ? 'is-same' : r.same === false ? 'is-diff' : ''}>
                <th scope="row"><Mark same={r.same} />{r.label}</th>
                <td>{r.left}</td>
                <td>{r.right}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MatchScore;
