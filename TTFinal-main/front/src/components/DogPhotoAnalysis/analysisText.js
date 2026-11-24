// Textos para mostrar la respuesta de /images/analyze (red neuronal DogNet v2).

export const SIZE_TEXT = { pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande' };
export const AGE_TEXT = { cachorro: 'Cachorro (menos de 1 año)', adulto: 'Adulto (1 año o más)' };

export const pct = (v) => `${Math.round((v || 0) * 100)}%`;

export const breedText = (d) => {
  if (d.inCatalog) return `${d.breed} (${pct(d.breedConfidence)})`;
  const similar = d.breedTop?.[0];
  return `Otro: raza fuera del catálogo o mestizo${similar ? ` · parecido a ${similar.breed}` : ''}`;
};

export const sizeText = (d) => {
  if (!d.size) return null;
  const weight = d.weightMinKg != null ? ` · ${d.weightMinKg}-${d.weightMaxKg} kg aprox.` : '';
  return `${SIZE_TEXT[d.size] || d.size}${weight}`;
};

/** "Cachorro (menos de 1 año) · 87 %": etapa de vida que estima la red. */
export const ageText = (d) => (d.age ? `${AGE_TEXT[d.age] || d.age} · ${pct(d.ageConfidence)}` : null);

/** "Negro, Blanco y Cafe" */
const joinNames = (names) => (names.length <= 1 ? names.join('')
  : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`);

/** Todos los colores que detecto la red, del que más pelaje cubre al que menos.
 *  withShare = true agrega la parte del pelaje de cada uno ("Negro 60% · Blanco 40%"). */
export const colorText = (d, withShare = false) => {
  const list = d.colors?.length ? d.colors
    : [d.color, d.colorSecondary].filter(Boolean).map((name) => ({ name }));
  if (!list.length) return null;
  const text = withShare
    ? list.map((c) => (c.share != null ? `${c.name} ${pct(c.share)}` : c.name)).join(' · ')
    : joinNames(list.map((c) => c.name));
  const prefix = list.length > 1 ? 'Colores' : 'Color';
  return `${prefix}: ${d.colorLabel === 'Tricolor' ? `Tricolor (${text})` : text}`;
};

/** Parte de la foto donde la red vio al perro: "Centro de la foto" o "Sección 1 de 3 (izquierda)". */
export const viewText = (d) => {
  const v = d.view;
  if (!v) return null;
  if (v.kind === 'centro') return 'Centro de la foto';
  const sections = v.total - 1;
  if (sections <= 1) return 'Foto completa';
  const [x1, y1, x2, y2] = v.box;
  const wide = y2 - y1 > 0.99; // las secciones de una foto ancha tienen el alto completo
  const mid = wide ? (x1 + x2) / 2 : (y1 + y2) / 2;
  const side = wide ? ['izquierda', 'derecha'] : ['arriba', 'abajo'];
  const where = mid < 0.4 ? side[0] : mid > 0.6 ? side[1] : 'centro';
  return `Sección ${v.index} de ${sections} (${where})`;
};

/** Solo los colores, sin el prefijo "Color:" (para tablas con su propia etiqueta). */
export const colorValue = (d, withShare = false) => colorText(d, withShare)?.replace(/^Colores?: /, '') ?? null;
