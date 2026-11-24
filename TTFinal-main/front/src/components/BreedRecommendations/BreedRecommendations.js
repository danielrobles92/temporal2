import React from 'react';
import {
  BREED_SOURCES,
  GENERAL_PROFILE,
  MUTTS_LIFESPAN,
  getBreedProfile,
} from '../../constants/breedProfiles';
import './BreedRecommendations.css';

const sourceIds = (item) => [].concat(item?.fuente || []);

/**
 * Resumen de lo que dicen estudios veterinarios y estándares oficiales sobre la raza
 * (constants/breedProfiles.js, campo `resumen`). Lo ve quien quiere adoptar antes de enviar su
 * solicitud y quien publicó antes de contactar al solicitante. Cada dato lleva el número de su
 * fuente y dice contra quién se compara.
 *
 * props:
 *  - breed: raza del perro (texto libre; "Otro" o desconocida muestra solo lo que aplica a cualquier perro)
 */
const BreedRecommendations = ({ breed }) => {
  const profile = getBreedProfile(breed);

  // Numeración de fuentes en orden de aparición.
  const order = [];
  const ref = (item) => {
    const nums = sourceIds(item).map((id) => {
      if (!order.includes(id)) order.push(id);
      return order.indexOf(id) + 1;
    });
    return nums.length ? <sup className="breed-rec-ref">[{nums.join(', ')}]</sup> : null;
  };
  const list = (items) => items.map((item) => <li key={item.texto}>{item.texto} {ref(item)}</li>);

  const general = GENERAL_PROFILE.resumen;
  const cuidados = [...(profile?.resumen?.cuidados || []), ...general.cuidados];
  const fallbackTitle = !breed ? 'Raza no especificada' : breed === 'Otro' ? 'Otra raza o mestizo' : breed;
  const lifespan = { fuente: 'mcmillan2024' };
  let vidaTexto;
  if (!profile) {
    vidaTexto = `La mitad de los perros mestizos vive más de ${MUTTS_LIFESPAN.mediana.toFixed(1)} años.`;
  } else if (profile.vida) {
    vidaTexto = `La mitad de los perros de esta raza vive más de ${profile.vida.mediana.toFixed(1)} años `
      + `(perros mestizos: ${MUTTS_LIFESPAN.mediana.toFixed(1)} años).`;
  } else {
    vidaTexto = 'No hay un estudio con la esperanza de vida de esta raza.';
  }

  return (
    <section className="breed-rec">
      <header className="breed-rec-header">
        <span className="breed-rec-eyebrow">Lo que dicen los estudios sobre la raza</span>
        <h3>{profile ? profile.nombre : fallbackTitle}</h3>
        <ul className="breed-rec-facts">
          {profile && (
            <li>
              <strong>Tamaño {profile.tamano.toLowerCase()}:</strong> {profile.medidas.texto} {ref(profile.medidas)}
            </li>
          )}
          <li>
            <strong>Esperanza de vida:</strong> {vidaTexto} {(profile?.vida || !profile) && ref(lifespan)}
          </li>
        </ul>
        {!profile && (
          <p className="breed-rec-muted">
            No hay datos científicos de esta raza (o es &quot;Otro&quot; o mestizo): se muestra lo que aplica a cualquier perro.
          </p>
        )}
      </header>

      {profile && (
        <div className="breed-rec-block">
          <h4>Datos de la raza</h4>
          <ul>{list(profile.resumen.puntos)}</ul>
        </div>
      )}

      <div className="breed-rec-block">
        <h4>Cuidados que necesitará</h4>
        <ul>{list(cuidados)}</ul>
      </div>

      <p className="breed-rec-note">{general.puntos[0].texto} {ref(general.puntos[0])}</p>

      <details className="breed-rec-sources">
        <summary>Fuentes científicas ({order.length})</summary>
        <ol>
          {order.map((id) => (
            <li key={id}>
              {BREED_SOURCES[id].cita}{' '}
              <a href={BREED_SOURCES[id].url} target="_blank" rel="noopener noreferrer">Ver fuente</a>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
};

export default BreedRecommendations;
