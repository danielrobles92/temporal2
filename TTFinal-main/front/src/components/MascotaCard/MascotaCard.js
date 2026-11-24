import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatDateTime, timeAgo } from '../../utils/dateFormat';
import './MascotaCard.css';

// Que es la tarjeta: adopcion, perdido o encontrado (y si ya fue adoptado/resuelto).
const categoryTag = ({ tipoReporte, estadoBackend, estadoReporte }) => {
  if (tipoReporte === 'FOUND') return { label: estadoReporte === 'RESOLVED' ? 'Encontrado · resuelto' : 'Encontrado', tone: 'found' };
  if (tipoReporte === 'LOST' || estadoBackend === 'LOST') {
    return { label: estadoReporte === 'RESOLVED' ? 'Perdido · resuelto' : 'Perdido', tone: 'lost' };
  }
  if (estadoBackend === 'ADOPTED') return { label: 'Adoptado', tone: 'adopted' };
  if (estadoBackend === 'INACTIVE') return { label: 'Inactivo', tone: 'inactive' };
  return { label: 'En adopción', tone: 'adoption' };
};

const reportStatusLabels = {
  OPEN: 'Abierto',
  RESOLVED: 'Resuelto',
};

const truncate = (text, max = 110) => {
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max).trim()}…`;
};

const MascotaCard = ({ mascota, variant, onDetalle }) => {
  const {
    id,
    nombre,
    tipo,
    raza,
    edad,
    sexo,
    imagen,
    descripcion,
    estado,
    tipoReporte,
    estadoReporte,
    ownerName,
    ubicacion,
    createdAt,
    imagenes = [],
  } = mascota;

  const isReport = String(id).startsWith('reporte-');
  const isAdopcionVariant = variant === 'adopcion' || variant === 'perdidas';

  const reportTypeLabel =
    tipoReporte === 'FOUND' ? 'Encontrado' : tipoReporte === 'LOST' ? 'Perdido' : null;
  const badgeLabel =
    reportTypeLabel ||
    (estado === 'adopcion' ? 'En Adopcion' : estado === 'encontrada' ? 'Encontrada' : 'Perdida');
  const reportStatusLabel = reportStatusLabels[estadoReporte];

  // El tipo (perdido/encontrado/adopcion) va como etiqueta sobre la foto.
  const tags = [isAdopcionVariant ? null : reportTypeLabel, sexo, edad, raza].filter(Boolean);
  const ctaLabel = variant === 'perdidas' ? 'Ver detalle' : 'Ver detalle';
  const category = categoryTag(mascota);

  const adopcionContent = (
    <>
      <div className="mascota-card-image mascota-card-image--adopcion">
        {imagen ? (
          <img src={imagen} alt={nombre} />
        ) : (
          <div className="mascota-card-placeholder">
            <span className="placeholder-icon">🐕</span>
          </div>
        )}
        <span className={`mascota-card-category mascota-card-category--${category.tone}`}>{category.label}</span>
      </div>

      {imagenes.length > 1 && (
        <div className="mascota-card-thumbs">
          {imagenes.slice(1, 4).map((imageUrl, index) => (
            <img key={`${imageUrl}-${index}`} src={imageUrl} alt={`${nombre} ${index + 2}`} />
          ))}
        </div>
      )}

      <div className="mascota-card-content mascota-card-content--adopcion">
        <h3 className="mascota-card-nombre">{nombre}</h3>

        {tags.length > 0 && (
          <div className="mascota-card-tags">
            {tags.map((tag) => (
              <span key={tag} className="mascota-card-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {ubicacion && (
          <p className="mascota-card-ubicacion">
            <span aria-hidden="true">📍</span> {ubicacion}
          </p>
        )}

        {descripcion && (
          <p className="mascota-card-descripcion">{truncate(descripcion)}</p>
        )}

        {createdAt && (
          <p className="mascota-card-fecha" title={formatDateTime(createdAt)}>
            Publicado el {formatDate(createdAt)} · {timeAgo(createdAt)}
          </p>
        )}

        {onDetalle ? (
          <button
            type="button"
            className="mascota-card-cta"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDetalle(mascota);
            }}
          >
            {ctaLabel}
          </button>
        ) : (
          <span className="mascota-card-cta">{ctaLabel}</span>
        )}
      </div>
    </>
  );

  const defaultContent = (
    <>
      <div className="mascota-card-image">
        {imagen ? (
          <img src={imagen} alt={nombre} />
        ) : (
          <div className="mascota-card-placeholder">
            <span className="placeholder-icon">P</span>
          </div>
        )}
        <span className={`mascota-card-badge ${estado}`}>{badgeLabel}</span>
      </div>

      <div className="mascota-card-content">
        <h3 className="mascota-card-nombre">{nombre}</h3>
        <div className="mascota-card-info">
          <span className="info-item">
            <span className="info-label">Tipo:</span> {tipo}
          </span>
          {raza && (
            <span className="info-item">
              <span className="info-label">Raza:</span> {raza}
            </span>
          )}
          {edad && (
            <span className="info-item">
              <span className="info-label">Edad:</span> {edad}
            </span>
          )}
          {ubicacion && (
            <span className="info-item">
              <span className="info-label">Ubicacion:</span> {ubicacion}
            </span>
          )}
          {ownerName && (
            <span className="info-item">
              <span className="info-label">Publicado por:</span> {ownerName}
            </span>
          )}
          {isReport && reportStatusLabel && (
            <span className={`report-card-status status-${String(estadoReporte).toLowerCase()}`}>
              Estado: {reportStatusLabel}
            </span>
          )}
        </div>
      </div>
    </>
  );

  const content = isAdopcionVariant ? adopcionContent : defaultContent;
  const cardClass = [
    'mascota-card',
    isAdopcionVariant && 'mascota-card--adopcion',
    onDetalle && 'mascota-card--clickable',
  ]
    .filter(Boolean)
    .join(' ');

  const openDetalle = () => onDetalle?.(mascota);

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetalle();
    }
  };

  if (isReport && !onDetalle) {
    const reportId = String(id).replace('reporte-', '');
    return (
      <Link to={`/reporte/${reportId}`} className={cardClass}>
        {content}
      </Link>
    );
  }

  if (onDetalle) {
    return (
      <article
        className={cardClass}
        role="button"
        tabIndex={0}
        onClick={openDetalle}
        onKeyDown={handleCardKeyDown}
        aria-label={`Ver detalle de ${nombre || 'mascota'}`}
      >
        {content}
      </article>
    );
  }

  return (
    <Link to={`/mascota/${id}`} className={cardClass}>
      {content}
    </Link>
  );
};

export default MascotaCard;
