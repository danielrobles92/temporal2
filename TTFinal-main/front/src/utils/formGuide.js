/**
 * Guía de formularios: cuando falta un dato, lleva a la persona hasta él (lo centra en pantalla,
 * lo enfoca y lo hace parpadear) para que sepa exactamente qué corregir. El recuadro rojo lo pone
 * el CSS de styles/theme.css (`.has-error` o un campo con la clase `error`).
 *
 * Cómo se encuentra un dato: `[data-field="clave"]`, luego `#clave` y luego `[name="clave"]`.
 */

const FIELD_SELECTOR = 'input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])';

const findField = (key, root) => {
  const scope = root || document;
  const safe = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(key) : key;
  return scope.querySelector(`[data-field="${key}"]`)
    || scope.querySelector(`#${safe}`)
    || scope.querySelector(`[name="${key}"]`);
};

/** Contenedor visible del dato: el que se marca en rojo. */
export const boxOf = (el) => (el && (el.closest('[data-field]') || el.closest('.form-group')
  || el.closest('.checkbox-label') || el)) || null;

/** Lleva a la persona al dato `key` (o al elemento dado). Devuelve false si no lo encontró. */
export function guideTo(keyOrElement, root) {
  const el = typeof keyOrElement === 'string' ? findField(keyOrElement, root) : keyOrElement;
  if (!el) return false;
  const box = boxOf(el);
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const input = el.matches?.(FIELD_SELECTOR) ? el : box.querySelector(FIELD_SELECTOR);
  if (input) setTimeout(() => input.focus({ preventScroll: true }), 350);
  box.classList.remove('field-attention');
  void box.offsetWidth; // reinicia la animación si ya estaba
  box.classList.add('field-attention');
  setTimeout(() => box.classList.remove('field-attention'), 1700);
  return true;
}

/**
 * Lleva al primer dato con error. `errors` es { clave: mensaje }; se respeta el orden de
 * `order` (el de la pantalla) o, si no se da, el orden en que se agregaron los errores.
 */
export function guideToFirstError(errors, { order, root } = {}) {
  const keys = (order || Object.keys(errors)).filter((k) => errors[k]);
  // Espera a que React pinte las marcas rojas antes de desplazarse.
  setTimeout(() => keys.some((k) => guideTo(k, root)), 30);
  return keys.length;
}

/** «Falta 1 dato» / «Faltan 3 datos», para el aviso que acompaña a las marcas. */
export const missingText = (n) => (n === 1 ? 'Falta 1 dato' : `Faltan ${n} datos`);

/**
 * Campos con `required` que valida el propio navegador: además de su globo con el motivo,
 * se marca el recuadro en rojo y se quita en cuanto el dato es válido. Se instala una sola vez.
 */
export function installNativeGuide() {
  if (typeof document === 'undefined' || window.__perrequeFormGuide) return;
  window.__perrequeFormGuide = true;
  let first = true;
  document.addEventListener('invalid', (event) => {
    const el = event.target;
    if (!(el instanceof HTMLElement)) return;
    const box = boxOf(el);
    box.classList.add('has-error');
    if (first) {
      first = false;
      setTimeout(() => { first = true; }, 300);
      guideTo(el);
    }
    const clear = () => {
      if (el.checkValidity()) {
        box.classList.remove('has-error');
        el.removeEventListener('input', clear);
        el.removeEventListener('change', clear);
      }
    };
    el.addEventListener('input', clear);
    el.addEventListener('change', clear);
  }, true);
}
