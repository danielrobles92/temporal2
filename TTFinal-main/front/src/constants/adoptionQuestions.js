// Preguntas que contesta quien quiere adoptar antes de enviar su solicitud. Las respuestas
// llegan a quien publicó al perro (Solicitudes y chat del caso).
//
// Para que no haya dudas al leer las respuestas:
//  - cada pregunta trata UNA sola cosa y se contesta eligiendo una opción fija;
//  - las opciones marcadas con `platicar` se señalan a quien publicó como tema para platicar
//    (no descartan a nadie: solo avisan que conviene hablarlo).
// Las preguntas de cada raza y el motivo (con su fuente) están en breedProfiles.js (`preguntas`).

export const ADOPTION_QUESTIONS = {
  cuidador: {
    corta: 'Lo cuida',
    texto: '¿Quién se encargará del perro todos los días?',
    opciones: [
      { valor: 'Yo' },
      { valor: 'Otra persona que vive conmigo' },
      { valor: 'Varias personas de la casa, por turnos' },
    ],
  },
  horas_solo: {
    corta: 'Horas solo',
    texto: 'En un día normal, ¿cuántas horas seguidas se quedaría solo?',
    opciones: [
      { valor: 'Menos de 4 horas' },
      { valor: 'De 4 a 8 horas' },
      { valor: 'Más de 8 horas', platicar: true },
    ],
  },
  vivienda: {
    corta: 'Vivienda',
    texto: '¿Dónde vivirá el perro?',
    opciones: [
      { valor: 'Casa con patio' },
      { valor: 'Casa sin patio' },
      { valor: 'Departamento' },
    ],
  },
  otras_mascotas: {
    corta: 'Otras mascotas',
    texto: '¿Hay otras mascotas en tu casa?',
    opciones: [
      { valor: 'No' },
      { valor: 'Sí, perros' },
      { valor: 'Sí, gatos' },
      { valor: 'Sí, perros y gatos' },
      { valor: 'Sí, otros animales' },
    ],
  },
  vacunas: {
    corta: 'Vacunas',
    texto: '¿Mantendrás al día sus vacunas, incluida la antirrábica cada año?',
    opciones: [{ valor: 'Sí' }, { valor: 'No', platicar: true }],
  },
  desparasitacion: {
    corta: 'Desparasitación',
    texto: '¿Podrás desparasitarlo cada vez que el veterinario lo indique?',
    opciones: [{ valor: 'Sí' }, { valor: 'No', platicar: true }],
  },
  revision: {
    corta: 'Veterinario',
    texto: '¿Podrás llevarlo al veterinario al menos una vez al año?',
    opciones: [{ valor: 'Sí' }, { valor: 'No', platicar: true }],
  },

  // --- según la raza ---
  ninos: {
    corta: 'Niños',
    texto: '¿Viven niños menores de 12 años en tu casa?',
    opciones: [{ valor: 'No' }, { valor: 'Sí', platicar: true }],
  },
  visitas: {
    corta: 'Visitas',
    texto: '¿Cada cuánto recibes visitas en casa?',
    opciones: [
      { valor: 'Casi nunca' },
      { valor: 'Algunas veces al mes' },
      { valor: 'Cada semana' },
    ],
  },
  cepillado: {
    corta: 'Dientes',
    texto: '¿Podrás cepillarle los dientes?',
    opciones: [
      { valor: 'Sí, todos los días' },
      { valor: 'Sí, algunas veces por semana' },
      { valor: 'No', platicar: true },
    ],
  },
  sombra: {
    corta: 'Sombra',
    texto: '¿Tendrá un lugar fresco y con sombra durante todo el día?',
    opciones: [{ valor: 'Sí' }, { valor: 'No', platicar: true }],
  },
  vet_extra: {
    corta: 'Consultas extra',
    texto: 'Además de la revisión anual, ¿podrás pagar consultas extra si las necesita?',
    opciones: [{ valor: 'Sí' }, { valor: 'No', platicar: true }],
  },
  patio_seguro: {
    corta: 'Patio cerrado',
    texto: '¿Tu casa tiene un patio o espacio cerrado del que no pueda escaparse?',
    opciones: [{ valor: 'Sí' }, { valor: 'No', platicar: true }],
  },
  experiencia: {
    corta: 'Experiencia',
    texto: '¿Has tenido perro antes?',
    opciones: [
      { valor: 'No, sería el primero' },
      { valor: 'Sí, de tamaño pequeño o mediano' },
      { valor: 'Sí, de tamaño grande' },
    ],
  },
  entrenamiento: {
    corta: 'Entrenamiento',
    texto: '¿Cómo lo entrenarás?',
    opciones: [
      { valor: 'Yo, por mi cuenta' },
      { valor: 'Con ayuda de un entrenador' },
      { valor: 'No planeo entrenarlo', platicar: true },
    ],
  },
  ejercicio: {
    corta: 'Paseo y juego',
    texto: '¿Cuánto tiempo al día podrás pasearlo o jugar con él?',
    opciones: [
      { valor: 'Menos de 30 minutos', platicar: true },
      { valor: 'De 30 a 60 minutos' },
      { valor: 'Más de 1 hora' },
    ],
  },
  porciones: {
    corta: 'Porciones',
    texto: '¿Medirás cada porción de su comida (con taza o báscula)?',
    opciones: [{ valor: 'Sí' }, { valor: 'No', platicar: true }],
  },
  cardiaco: {
    corta: 'Revisión del corazón',
    texto: '¿Podrás pagar cada año una revisión del corazón (Holter de 24 horas y ecocardiograma)?',
    opciones: [{ valor: 'Sí' }, { valor: 'No', platicar: true }],
  },
};

/** Se preguntan siempre, sea cual sea la raza. */
export const GENERAL_QUESTION_IDS = [
  'cuidador', 'horas_solo', 'vivienda', 'otras_mascotas', 'vacunas', 'desparasitacion', 'revision',
];

/**
 * Preguntas para una raza: las generales y luego las de la raza. `preguntasRaza` viene del
 * perfil ([{ id, porque: { texto, fuente } }]); si una pregunta general también aplica a la raza
 * (p. ej. otras mascotas), se queda en su lugar y lleva el motivo.
 */
export const questionsFor = (preguntasRaza = []) => {
  const motivo = Object.fromEntries(preguntasRaza.map((p) => [p.id, p.porque]));
  const ids = [...GENERAL_QUESTION_IDS, ...preguntasRaza.map((p) => p.id)
    .filter((id) => !GENERAL_QUESTION_IDS.includes(id))];
  return ids.filter((id) => ADOPTION_QUESTIONS[id])
    .map((id) => ({ id, ...ADOPTION_QUESTIONS[id], porque: motivo[id] || null }));
};

/** Respuestas para enviar: [{ id, question, answer, flag }] en el orden de las preguntas. */
export const buildAnswers = (questions, values) => questions
  .filter((q) => values[q.id])
  .map((q) => ({
    id: q.id,
    question: q.texto,
    answer: values[q.id],
    flag: Boolean(q.opciones.find((o) => o.valor === values[q.id])?.platicar),
  }));

/** Preguntas que faltan por contestar. */
export const missingAnswers = (questions, values) => questions.filter((q) => !values[q.id]);

/** Valores del formulario a partir de respuestas guardadas ({ id: respuesta }). */
export const answersToValues = (answers) => Object.fromEntries((answers || []).map((a) => [a.id, a.answer]));
