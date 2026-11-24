import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { updateMatchStatus } from '../../services/platformService';
import MatchScore from './MatchScore';
import './MatchSuggestions.css';

/**
 * Página del perro sugerido: su publicación del catálogo (petId) o su reporte (matchedReportId).
 * reportId es el reporte propio, por eso nunca se usa aquí.
 */
export const matchLink = (m) => {
  if (m.petId != null) return `/mascota/${m.petId}`;
  return m.matchedReportId != null ? `/reporte/${m.matchedReportId}` : null;
};

/**
 * Lista de coincidencias potenciales (más de 40 % y algún rasgo en común): foto, nombre, raza,
 * porcentaje y lo que identificó el análisis en cada perro. Clic en el perro o en "Ver publicación"
 * abre su detalle; "Descartar" la quita (solo las guardadas, con matchId, de un reporte propio).
 * Se usa al publicar un reporte, al "Volver a comparar" y en la publicación de un perro perdido.
 *
 * props: matches, newTab (abrir el detalle en otra pestaña, p. ej. dentro de un formulario abierto)
 */
const MatchSuggestions = ({ matches, newTab = false }) => {
  const { showToast } = useToast();
  const [discarded, setDiscarded] = useState(() => new Set());
  const [busyId, setBusyId] = useState(null);
  const visible = (matches || []).filter((m) => !discarded.has(m.matchId));

  const discard = async (matchId) => {
    setBusyId(matchId);
    try {
      await updateMatchStatus(matchId, 'DISCARDED');
      setDiscarded((prev) => new Set(prev).add(matchId));
      showToast('Coincidencia descartada: ya no se mostrará', 'success');
    } catch (err) {
      showToast(err.message || 'No se pudo descartar la coincidencia', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (visible.length === 0) {
    return (
      <p className="ms-empty">
        No encontramos coincidencias por ahora. Tu reporte queda publicado y revisaremos
        nuevas mascotas conforme se registren.
      </p>
    );
  }

  const tab = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <div className="match-suggestions">
      {visible.map((m) => {
        const to = matchLink(m);
        return (
          <article key={m.matchId ?? `${m.reportId}-${m.petId}-${m.matchedReportId}`} className="ms-card">
            {to ? (
              <Link to={to} {...tab} className="ms-thumb-link" aria-label={`Ver publicación de ${m.petName}`}>
                {m.imageUrl ? <img className="ms-thumb" src={m.imageUrl} alt={m.petName} />
                  : <div className="ms-thumb ms-thumb-empty">🐾</div>}
              </Link>
            ) : (
              m.imageUrl ? <img className="ms-thumb" src={m.imageUrl} alt={m.petName} />
                : <div className="ms-thumb ms-thumb-empty">🐾</div>
            )}
            <div className="ms-body">
              <div className="ms-head">
                {to ? <Link to={to} {...tab} className="ms-name"><strong>{m.petName}</strong></Link>
                  : <strong>{m.petName}</strong>}
                {m.breed && <span className="ms-breed">{m.breed}</span>}
              </div>
              <MatchScore score={m.score} visualScore={m.visualScore} reportAi={m.reportAi} candidateAi={m.candidateAi} compact />
              <div className="ms-actions">
                {to && <Link to={to} {...tab} className="btn btn-primary">Ver publicación</Link>}
                {m.matchId != null && (
                  <button type="button" className="btn btn-secondary" disabled={busyId === m.matchId}
                    onClick={() => discard(m.matchId)}>
                    {busyId === m.matchId ? 'Descartando...' : 'Descartar'}
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default MatchSuggestions;
