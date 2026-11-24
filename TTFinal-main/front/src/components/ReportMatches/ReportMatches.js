import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { getReportMatches, refreshReportMatches, updateMatchStatus } from '../../services/platformService';
import MatchScore from '../MatchSuggestions/MatchScore';
import { matchLink } from '../MatchSuggestions/MatchSuggestions';
import './ReportMatches.css';

/**
 * «Coincidencias potenciales» de un reporte: se cargan al abrir (GET /reports/{id}/matches) y se
 * muestran en tarjetas con el porcentaje y «En el análisis se identificó». La misma vista se usa en
 * el detalle del reporte y al editarlo en Mis anuncios.
 *
 * props:
 *  - reportId
 *  - canDecide: autor del reporte o admin (puede «Volver a comparar» y «Descartar»)
 *  - newTab: abrir «Ver publicación» en otra pestaña (dentro de un formulario abierto)
 *  - hint: texto extra bajo la nota (p. ej. «si cambiaste algo, guarda primero»)
 *  - disabled: deshabilita los botones (p. ej. mientras se guarda el formulario)
 */
const ReportMatches = ({ reportId, canDecide = false, newTab = false, hint, disabled = false }) => {
  const { showToast } = useToast();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [updatingMatchId, setUpdatingMatchId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getReportMatches(reportId)
      .catch(() => [])
      .then((data) => { if (active) setMatches(data || []); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reportId]);

  // Vuelve a analizar las fotos del reporte y lo compara otra vez con los perros guardados.
  const compareAgain = async () => {
    setComparing(true);
    try {
      const fresh = await refreshReportMatches(reportId);
      setMatches(fresh);
      showToast(fresh.length ? `Comparación lista: ${fresh.length} coincidencia${fresh.length === 1 ? '' : 's'}` : 'Comparación lista: sin coincidencias por ahora', 'success');
    } catch (err) {
      showToast(err.message || 'No se pudo volver a comparar', 'error');
    } finally {
      setComparing(false);
    }
  };

  // Descartar: la coincidencia se quita de la lista y ya no se vuelve a mostrar ni a avisar.
  const discardMatch = async (matchId) => {
    setUpdatingMatchId(matchId);
    try {
      await updateMatchStatus(matchId, 'DISCARDED');
      setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
      showToast('Coincidencia descartada: ya no se mostrará', 'success');
    } catch (err) {
      showToast(err.message || 'No se pudo descartar la coincidencia', 'error');
    } finally {
      setUpdatingMatchId(null);
    }
  };

  const tab = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <section className="matches-section">
      <div className="matches-section-head">
        <h2>Coincidencias potenciales</h2>
        {canDecide && (
          <button type="button" className="btn btn-secondary" onClick={compareAgain} disabled={comparing || loading || disabled}>
            {comparing ? 'Comparando...' : 'Volver a comparar'}
          </button>
        )}
      </div>
      <p className="matches-section-note">
        Solo se muestran coincidencias media o alta (más de 40 %) con algún rasgo en común según el
        análisis de las fotos. El porcentaje no es la probabilidad de ser el mismo perro; da clic en
        un perro para ver su publicación.
        {hint && <> {hint}</>}
      </p>
      {loading ? (
        <p className="empty-text">Buscando coincidencias...</p>
      ) : matches.length === 0 ? (
        <p className="empty-text">No hay coincidencias potenciales por ahora.</p>
      ) : (
        <div className="match-grid">
          {matches.map((match) => {
            const to = matchLink(match);
            return (
              <article key={match.matchId ?? `${match.petId}-${match.matchedReportId}`} className="match-card">
                {match.imageUrl && (to ? (
                  <Link to={to} {...tab} className="match-thumb-link" aria-label={`Ver publicación de ${match.petName}`}>
                    <img className="match-thumb" src={match.imageUrl} alt={match.petName} />
                  </Link>
                ) : (
                  <img className="match-thumb" src={match.imageUrl} alt={match.petName} />
                ))}
                <div className="match-head">
                  {to ? <Link to={to} {...tab} className="match-name"><strong>{match.petName}</strong></Link>
                    : <strong>{match.petName}</strong>}
                </div>
                {match.breed && <span className="match-breed">🐾 {match.breed}</span>}
                <MatchScore
                  score={match.score}
                  visualScore={match.visualScore}
                  reportAi={match.reportAi}
                  candidateAi={match.candidateAi}
                  labels={['Este reporte', 'Candidato']}
                />
                {(to || (match.matchId && canDecide)) && (
                  <div className="match-actions">
                    {to && <Link to={to} {...tab} className="btn btn-primary">Ver publicación</Link>}
                    {match.matchId && canDecide && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={updatingMatchId === match.matchId || disabled}
                        onClick={() => discardMatch(match.matchId)}
                      >
                        {updatingMatchId === match.matchId ? 'Descartando...' : 'Descartar'}
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ReportMatches;
