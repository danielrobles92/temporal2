// La edad del perro se captura en años enteros; el 1 significa "1 año o menos" (cachorro).

export const ETIQUETA_EDAD = 'Edad aproximada (en años; 1 = un año o menos)';

// Atributos del campo numérico de edad.
export const ATRIBUTOS_EDAD = { type: 'number', min: 1, step: 1, inputMode: 'numeric' };

// Texto para mostrar la edad guardada: 1 (o 0 de registros anteriores) -> "1 año o menos".
export const formatearEdad = (anios) => {
  if (anios === null || anios === undefined || anios === '') return '';
  const n = Number(anios);
  if (Number.isNaN(n) || n < 0) return '';
  return n <= 1 ? '1 año o menos' : `${n} años`;
};
