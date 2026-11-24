// Etiquetas que indican de que trata cada tarjeta con un perro y en que estado esta.
// `tone` corresponde a las clases .card-tag--* de styles/theme.css.

export const petStatusTag = (status) => ({
  AVAILABLE: { label: 'En adopción', tone: 'adoption' },
  ADOPTED: { label: 'Adoptado', tone: 'approved' },
  LOST: { label: 'Perdido', tone: 'lost' },
  INACTIVE: { label: 'Inactivo', tone: 'inactive' },
}[status] || { label: 'En adopción', tone: 'adoption' });

export const reportTypeTag = (type) => (type === 'FOUND'
  ? { label: 'Reporte: encontrado', tone: 'found' }
  : { label: 'Reporte: perdido', tone: 'lost' });

export const reportStatusTag = (status) => ({
  OPEN: { label: 'Abierto', tone: 'pending' },
  RESOLVED: { label: 'Resuelto', tone: 'approved' },
  INACTIVE: { label: 'Inactivo', tone: 'inactive' },
}[status] || { label: status || 'Abierto', tone: 'pending' });

export const sightingStatusTag = (status) => ({
  NEW: { label: 'Nuevo aviso', tone: 'pending' },
  REPLIED: { label: 'Respondido', tone: 'adoption' },
  CASE_OPENED: { label: 'Caso abierto', tone: 'approved' },
  DISMISSED: { label: 'No es mi perro', tone: 'rejected' },
}[status] || { label: 'Nuevo aviso', tone: 'pending' });

export const caseStatusTag = (status, caseType) => {
  if (status === 'CANCELLED' && caseType === 'LOST') return { label: 'No era el perro', tone: 'rejected' };
  // El backend cierra (CLOSED) los casos de los demas solicitantes cuando el perro se adopta.
  if (status === 'CLOSED' && caseType === 'ADOPTION') return { label: 'Adoptado por otra persona', tone: 'inactive' };
  return ({
    OPEN: { label: 'En curso', tone: 'pending' },
    ADOPTED: { label: 'Adoptado', tone: 'approved' },
    RESOLVED: { label: 'Resuelto', tone: 'approved' },
    CANCELLED: { label: 'Cancelado', tone: 'rejected' },
    CLOSED: { label: 'Cerrado', tone: 'inactive' },
  }[status] || { label: status || 'En curso', tone: 'pending' });
};

export const CLOSED_CASE_STATUSES = ['ADOPTED', 'CANCELLED', 'RESOLVED', 'CLOSED'];
export const isCaseClosed = (status) => CLOSED_CASE_STATUSES.includes(status);
