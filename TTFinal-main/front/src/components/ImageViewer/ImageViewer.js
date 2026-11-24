import React, { useEffect } from 'react';
import './ImageViewer.css';

/**
 * Visor de fotos a pantalla completa: muestra la foto completa (sin recortar), con flechas para
 * pasar a la anterior o la siguiente. Se cierra con la X, con Esc o tocando fuera de la foto.
 *
 * props:
 *  - images: lista de URLs
 *  - index: foto que se muestra
 *  - onChange(nuevoIndice)
 *  - onClose()
 *  - alt: texto base para las fotos (por ejemplo, el nombre del perro)
 */
const ImageViewer = ({ images, index, onChange, onClose, alt = 'Foto' }) => {
  const total = images.length;
  const prev = () => onChange((index - 1 + total) % total);
  const next = () => onChange((index + 1) % total);

  useEffect(() => {
    // Fase de captura: el visor atiende Esc y las flechas antes que la ventana de detalle que lo abrió.
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft' && total > 1) onChange((index - 1 + total) % total);
      else if (event.key === 'ArrowRight' && total > 1) onChange((index + 1) % total);
      else return;
      event.stopPropagation();
      event.preventDefault();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [index, total, onChange, onClose]);

  if (!total) return null;

  return (
    <div className="image-viewer" role="dialog" aria-modal="true" aria-label={`${alt}: foto ${index + 1} de ${total}`}
      onClick={(event) => { event.stopPropagation(); onClose(); }}>
      <button type="button" className="image-viewer-close" onClick={onClose} aria-label="Cerrar foto">×</button>
      {total > 1 && (
        <button type="button" className="image-viewer-nav is-prev"
          onClick={(event) => { event.stopPropagation(); prev(); }} aria-label="Foto anterior">‹</button>
      )}
      <img className="image-viewer-img" src={images[index]} alt={`${alt} ${index + 1}`}
        onClick={(event) => event.stopPropagation()} />
      {total > 1 && (
        <button type="button" className="image-viewer-nav is-next"
          onClick={(event) => { event.stopPropagation(); next(); }} aria-label="Foto siguiente">›</button>
      )}
      {total > 1 && <span className="image-viewer-count">{index + 1} de {total}</span>}
    </div>
  );
};

export default ImageViewer;
