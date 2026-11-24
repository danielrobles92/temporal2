// Formatos de fecha compartidos (es-MX). El backend envia LocalDateTime sin zona,
// que el navegador interpreta como hora local (backend y usuarios en CDMX).

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value, fallback = 'Sin fecha') => {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (value, fallback = 'Sin fecha') => {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Tiempo transcurrido en minutos, horas o dias: "5 min", "3 horas", "12 dias".
export const elapsedLabel = (value, now = new Date()) => {
  const date = toDate(value);
  if (!date) return '';
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
  if (minutes < 1) return 'menos de 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'día' : 'días'}`;
};

// "hace 3 días" / "hace 5 horas"
export const timeAgo = (value) => {
  const label = elapsedLabel(value);
  return label ? `hace ${label}` : '';
};
