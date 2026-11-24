// Teléfonos de México: 10 dígitos, sin espacios ni signos.
export const TELEFONO_DIGITOS = 10;
export const MENSAJE_TELEFONO = `El teléfono debe tener ${TELEFONO_DIGITOS} dígitos`;

/** Deja solo dígitos y corta a 10 (se usa al escribir y al cargar un teléfono guardado). */
export const limpiarTelefono = (valor) => String(valor ?? '').replace(/\D/g, '').slice(0, TELEFONO_DIGITOS);

/** true si el teléfono, ya limpio, tiene exactamente 10 dígitos. */
export const telefonoValido = (valor) => new RegExp(`^\\d{${TELEFONO_DIGITOS}}$`).test(limpiarTelefono(valor));

/** Atributos comunes para los <input> de teléfono. */
export const ATRIBUTOS_TELEFONO = {
  type: 'tel',
  inputMode: 'numeric',
  autoComplete: 'tel-national',
  maxLength: TELEFONO_DIGITOS,
};
