// Motivos para reportar el mal uso de un chat (mismos valores que ChatSafetyController.REASONS).
export const REPORT_REASONS = [
  {
    value: 'OFFENSIVE_LANGUAGE',
    label: 'Insultos o malas palabras',
    hint: 'Te ofendió, usó groserías o lenguaje agresivo.',
  },
  {
    value: 'MONEY_REQUEST',
    label: 'Pide dinero a cambio del perro',
    hint: 'Pide pago, "recompensa" o depósito para devolver o entregar al perro.',
  },
  {
    value: 'FAKE_DOG',
    label: 'El perro no existe o la información es falsa',
    hint: 'Dice tener un perro que no corresponde, manda fotos falsas o engaña.',
  },
  {
    value: 'HARASSMENT',
    label: 'Acoso o amenazas',
    hint: 'Insiste aunque le pediste que no, te amenaza o te presiona.',
  },
  {
    value: 'SPAM',
    label: 'Spam o publicidad',
    hint: 'Manda enlaces, promociones o mensajes que no tienen que ver con el perro.',
  },
  {
    value: 'OTHER',
    label: 'Otro motivo',
    hint: 'Cuéntanos qué pasó.',
  },
];

export const reportReasonLabel = (value) =>
  REPORT_REASONS.find((reason) => reason.value === value)?.label || value;

export const CHAT_REPORT_STATUS = {
  PENDING: { label: 'Pendiente', css: 'pending' },
  REVIEWED: { label: 'Atendido', css: 'approved' },
  DISMISSED: { label: 'Descartado', css: 'inactive' },
};
