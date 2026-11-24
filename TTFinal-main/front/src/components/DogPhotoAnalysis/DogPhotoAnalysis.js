import React, { useEffect, useRef, useState } from 'react';
import { DOG_COLORS, OTHER_BREED } from '../../constants/dogOptions';
import { analyzeDogImage } from '../../services/platformService';
import { ageText, breedText, colorText, sizeText } from './analysisText';
import './DogPhotoAnalysis.css';

/** Sugerencia para el formulario a partir de la foto principal (o la primera que sea perro). */
const toSuggestion = (d) => ({
  raza: d.inCatalog ? d.breed : OTHER_BREED,
  color: DOG_COLORS.includes(d.colorLabel) ? d.colorLabel : '',
  tamano: d.size || '',
});

/** La foto tiene 2 o mas perros: el sistema analiza un solo perro por foto. */
const multipleDogs = (d) => Boolean(d?.isDog && d.dogCount >= 2);

/**
 * Analiza con la red neuronal cada foto elegida: avisa si no es un perro o si tiene
 * varios perros (no se puede publicar) y sugiere raza (u "Otro"), tamaño, etapa y color.
 *
 * props:
 *  - images: [{ file, preview }] (mismo valor que ImageSlots)
 *  - onApply(sugerencia): { raza, color, tamano } para autollenar el formulario
 *  - applyLabel: texto del boton (por omision "Usar datos detectados (raza y color)")
 *  - onStatusChange({ analyzing, blocked }): blocked = alguna foto no se puede usar
 *  - requireDog: false en los avisos (se aceptan fotos sin perro, p. ej. del lugar),
 *    pero nunca fotos con varios perros
 *  - showChips: false para mostrar solo los problemas (sin raza, tamaño, etc.)
 */
const DogPhotoAnalysis = ({
  images, onApply, onStatusChange, disabled, applyLabel = 'Usar datos detectados (raza y color)',
  requireDog = true, showChips = true,
}) => {
  const cache = useRef(new Map()); // File -> { status, data | error }
  const mounted = useRef(true);
  const [, setTick] = useState(0);
  const files = (images || []).map((im) => im.file).filter(Boolean);

  // StrictMode (desarrollo) monta, desmonta y vuelve a montar: hay que reactivar la bandera
  // al montar, o los resultados nunca se pintan y la foto se queda en "Analizando…".
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    files.forEach((file) => {
      if (cache.current.has(file)) return;
      cache.current.set(file, { status: 'loading' });
      analyzeDogImage(file)
        .then((data) => cache.current.set(file, { status: 'done', data }))
        .catch((err) => cache.current.set(file, { status: 'error', error: err.message }))
        .finally(() => mounted.current && setTick((n) => n + 1));
    });
  }); // se revisa en cada render; el cache evita repetir peticiones

  const results = files.map((file) => cache.current.get(file) || { status: 'loading' });
  const analyzing = results.some((r) => r.status === 'loading');
  const blocked = results.some((r) => r.status === 'done' && r.data
    && ((requireDog && r.data.isDog === false) || multipleDogs(r.data)));

  useEffect(() => {
    onStatusChange?.({ analyzing, blocked });
  }, [analyzing, blocked]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!files.length) return null;

  const firstDog = results.find((r) => r.status === 'done' && r.data?.isDog && !multipleDogs(r.data));
  const suggestion = firstDog ? toSuggestion(firstDog.data) : null;

  return (
    <div className="dog-analysis">
      <div className="dog-analysis-title">Análisis automático de las fotos</div>
      {results.map((r, i) => {
        const d = r.data;
        const state = r.status !== 'done' ? r.status
          : multipleDogs(d) ? 'not-dog'
            : d.isDog ? (d.inCatalog ? 'dog' : 'other')
              : requireDog ? 'not-dog' : 'other';
        return (
          <div className={`dog-analysis-row is-${state}`} key={i}>
            <span className="dog-analysis-num">Foto {i + 1}</span>
            {r.status === 'loading' && <span className="dog-analysis-muted">Analizando…</span>}
            {r.status === 'error' && (
              <span className="dog-analysis-muted">No se pudo analizar ({r.error})</span>
            )}
            {r.status === 'done' && !d.isDog && requireDog && <strong className="dog-analysis-reject">✖ {d.message}</strong>}
            {r.status === 'done' && !d.isDog && !requireDog && (
              <span className="dog-analysis-muted">No se ve un perro en esta foto (se puede enviar).</span>
            )}
            {r.status === 'done' && multipleDogs(d) && (
              <strong className="dog-analysis-reject">
                ✖ La foto tiene {d.dogCount} perros: sube una donde aparezca un solo perro (puedes recortarla).
              </strong>
            )}
            {r.status === 'done' && d.isDog && !multipleDogs(d) && !showChips && (
              <span className="dog-analysis-muted">Foto válida.</span>
            )}
            {r.status === 'done' && d.isDog && !multipleDogs(d) && showChips && (
              <span className="dog-analysis-chips">
                <span className="dog-chip dog-chip-breed">{breedText(d)}</span>
                {sizeText(d) && <span className="dog-chip">{sizeText(d)}</span>}
                {ageText(d) && <span className="dog-chip">{ageText(d)}</span>}
                {colorText(d) && <span className="dog-chip">{colorText(d)}</span>}
              </span>
            )}
          </div>
        );
      })}
      {blocked && (
        <div className="dog-analysis-block">
          Quita las fotos marcadas con ✖: {requireDog ? 'cada foto debe mostrar a un solo perro.' : 'cada foto puede mostrar a lo más un perro.'}
        </div>
      )}
      {suggestion && onApply && (
        <button type="button" className="dog-analysis-apply" onClick={() => onApply(suggestion)} disabled={disabled}>
          {applyLabel}
        </button>
      )}
      {showChips && (
        <small className="dog-analysis-note">
          Sugerencia de la red neuronal: revisa y corrige los datos antes de publicar.
        </small>
      )}
    </div>
  );
};

export default DogPhotoAnalysis;
