import React, { useEffect, useState } from 'react';
import MapPicker from '../MapPicker/MapPicker';
import DogPhotoAnalysis from '../DogPhotoAnalysis/DogPhotoAnalysis';
import { ATRIBUTOS_TELEFONO, MENSAJE_TELEFONO, limpiarTelefono, telefonoValido } from '../../utils/telefono';
import './SightingForm.css';
import { guideToFirstError } from '../../utils/formGuide';

const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

/**
 * Formulario del aviso sobre un perro perdido o encontrado.
 *
 * mode:
 *  - 'new'     primer aviso: datos de contacto, mapa, informacion y fotos.
 *  - 'entry'   la misma persona vuelve a ver al perro: mapa, informacion y fotos (se agrega
 *              a su mismo aviso o al chat de su caso).
 *  - 'edit'    corregir el aviso (sin caso abierto): todo, incluidas las fotos que ya subio.
 *  - 'contact' corregir solo los datos de contacto (el caso ya esta abierto).
 *
 * onSubmit recibe { contactName, contactEmail, contactPhone, location, latitude, longitude,
 * message, imageFiles, keepImageUrls }.
 */
const SightingForm = ({ mode = 'new', tipoReporte, initial = {}, sending = false, onSubmit, onCancel, onError, submitDisabled = false }) => {
  const [form, setForm] = useState(() => ({
    contactName: initial.contactName || '',
    contactEmail: initial.contactEmail || '',
    contactPhone: limpiarTelefono(initial.contactPhone),
    // En 'entry' el lugar es del nuevo avistamiento: empieza vacio.
    location: mode === 'edit' ? initial.location || '' : '',
    latitude: mode === 'edit' && initial.latitude != null ? initial.latitude : '',
    longitude: mode === 'edit' && initial.longitude != null ? initial.longitude : '',
    message: mode === 'edit' ? initial.message || '' : '',
  }));
  const [keptPhotos, setKeptPhotos] = useState(mode === 'edit' ? initial.imageUrls || [] : []);
  const [newPhotos, setNewPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  // Revision de las fotos nuevas: no se aceptan fotos con varios perros.
  const [photoCheck, setPhotoCheck] = useState({ analyzing: false, blocked: false });
  // Datos que faltan o están mal: se marcan en rojo y la pantalla lleva al primero.
  const [errors, setErrors] = useState({});

  const found = tipoReporte === 'FOUND';
  const showContact = mode !== 'entry';
  const showDetails = mode !== 'contact';
  const freeSlots = MAX_PHOTOS - keptPhotos.length;

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const handleChange = (event) => {
    const { name } = event.target;
    const value = name === 'contactPhone' ? limpiarTelefono(event.target.value) : event.target.value;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
  };

  // El mapa manda primero el punto y luego la direccion ya resuelta.
  const handleMapChange = ({ latitude, longitude, address }) => {
    setForm((current) => ({
      ...current,
      latitude,
      longitude,
      ...(address ? { location: address.slice(0, 255) } : {}),
    }));
  };

  const handlePhotos = (event) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/')).slice(0, freeSlots);
    event.target.value = '';
    if (files.some((file) => file.size > MAX_PHOTO_BYTES)) {
      onError?.('Cada foto debe pesar menos de 3 MB');
      return;
    }
    setNewPhotos(files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const removeKept = (url) => setKeptPhotos((current) => current.filter((item) => item !== url));

  const handleSubmit = (event) => {
    event.preventDefault();
    const missing = {};
    if (showContact && !form.contactName.trim()) missing.contactName = 'Escribe tu nombre';
    if (showContact && form.contactPhone && !telefonoValido(form.contactPhone)) missing.contactPhone = MENSAJE_TELEFONO;
    if (showDetails && !form.message.trim()) missing.message = 'Escribe la información del avistamiento';
    if (showDetails && photoCheck.blocked) missing.photos = 'Hay fotos con varios perros: quítalas o recórtalas para que se vea un solo perro';
    setErrors(missing);
    const first = Object.values(missing)[0];
    if (first) {
      guideToFirstError(missing, { root: event.currentTarget });
      onError?.(first);
      return;
    }
    onSubmit({
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      ...(showDetails ? {
        location: form.location.trim(),
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        message: form.message.trim(),
        imageFiles: newPhotos,
      } : {}),
      ...(mode === 'edit' ? { keepImageUrls: keptPhotos } : {}),
    });
  };

  const intro = {
    new: found
      ? ['¿Crees que es tu perro?', 'Envía datos y fotos para avisar a quien lo encontró.']
      : ['¿Viste un perro parecido?', 'Envía ubicación, datos y fotos para avisar a quien lo busca.'],
    entry: found
      ? ['Agregar más información', 'Se suma a tu mismo aviso con la fecha de hoy. Tus datos de contacto no cambian.']
      : ['Otro avistamiento', 'Se suma a tu mismo aviso con la fecha de hoy, así no apareces como otra persona. Tus datos de contacto no cambian.'],
    edit: ['Corregir mi aviso', 'Cambia lo que esté mal. Quien publicó verá que lo editaste.'],
    contact: ['Corregir mis datos de contacto', 'Tu caso ya está abierto: aquí solo cambias nombre, correo y teléfono. Lo demás escríbelo en el chat del caso.'],
  }[mode];

  const submitLabel = {
    new: ['Enviar aviso', 'Enviando...'],
    entry: [found ? 'Agregar información' : 'Agregar avistamiento', 'Agregando...'],
    edit: ['Guardar cambios', 'Guardando...'],
    contact: ['Guardar cambios', 'Guardando...'],
  }[mode];

  return (
    <form className="sighting-form" onSubmit={handleSubmit} noValidate>
      <div className="sighting-form-intro">
        <strong>{intro[0]}</strong>
        <span>{intro[1]}</span>
      </div>

      {showContact && (
        <>
          <div className="form-group" data-field="contactName">
            <label htmlFor={`sf-name-${mode}`}>Tu nombre</label>
            <input id={`sf-name-${mode}`} name="contactName" value={form.contactName} onChange={handleChange} disabled={sending} required className={errors.contactName ? 'error' : ''} />
            {errors.contactName && <span className="error-message" role="alert">{errors.contactName}</span>}
          </div>
          <div className="form-group">
            <label htmlFor={`sf-email-${mode}`}>Correo</label>
            <input id={`sf-email-${mode}`} name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} disabled={sending} />
          </div>
          <div className="form-group" data-field="contactPhone">
            <label htmlFor={`sf-phone-${mode}`}>Teléfono</label>
            <input
              {...ATRIBUTOS_TELEFONO}
              placeholder="5512345678"
              id={`sf-phone-${mode}`}
              name="contactPhone"
              value={form.contactPhone}
              onChange={handleChange}
              disabled={sending}
              className={errors.contactPhone ? 'error' : ''}
            />
            {errors.contactPhone && <span className="error-message" role="alert">{errors.contactPhone}</span>}
          </div>
        </>
      )}

      {showDetails && (
        <>
          <div className="form-group sighting-form-full">
            <label>{found && mode !== 'entry' ? '¿Dónde se perdió tu perro?' : '¿Dónde lo viste?'}</label>
            <small className="sighting-form-help">
              Busca la calle o haz clic en el mapa; puedes arrastrar el marcador para afinar el punto exacto.
              {mode === 'edit' && form.location ? ` Punto actual: ${form.location}.` : ''}
            </small>
            <MapPicker latitude={form.latitude} longitude={form.longitude} onChange={handleMapChange} disabled={sending} />
          </div>
          <div className="form-group sighting-form-full" data-field="message">
            <label htmlFor={`sf-message-${mode}`}>Información</label>
            <small id={`sf-message-help-${mode}`} className="sighting-form-help">
              {found && mode !== 'entry'
                ? 'Da el mayor detalle posible y sé muy específico: cuándo y dónde se perdió, señas que solo tú conoces (cicatrices, collar o placa, manchas) y cómo puedes comprobar que es tuyo (fotos, cartilla).'
                : 'Da el mayor detalle posible y sé muy específico: fecha y hora, el lugar exacto con referencias, hacia dónde iba, señas (collar, manchas, heridas, tamaño) y cómo se comportaba.'}
            </small>
            <textarea
              id={`sf-message-${mode}`}
              name="message"
              rows="5"
              value={form.message}
              onChange={handleChange}
              aria-describedby={`sf-message-help-${mode}`}
              maxLength={2000}
              placeholder={found && mode !== 'entry'
                ? 'Ej. Se perdió el 3 de noviembre en la colonia Del Valle. Tiene una cicatriz en la oreja derecha, collar azul con placa "Max" y le falta un colmillo. Puedo mandar fotos y su cartilla.'
                : 'Ej. Lo vi hoy a las 7:30 p. m. en la esquina de Av. Tláhuac y Calle 5, afuera de la farmacia. Iba hacia el metro, cojeaba de la pata trasera izquierda, traía collar rojo sin placa y tiene una mancha blanca en el pecho.'}
              disabled={sending}
              required
              className={errors.message ? 'error' : ''}
            />
            {errors.message && <span className="error-message" role="alert">{errors.message}</span>}
          </div>
          <div className={`form-group sighting-form-full${errors.photos ? ' has-error' : ''}`} data-field="photos">
            <label>Fotos del posible perro</label>
            {errors.photos && <span className="error-message" role="alert">{errors.photos}</span>}
            {keptPhotos.length > 0 && (
              <div className="sighting-form-previews">
                {keptPhotos.map((url, index) => (
                  <figure key={url}>
                    <img src={url} alt={`Foto actual ${index + 1}`} />
                    <button type="button" onClick={() => removeKept(url)} disabled={sending} aria-label={`Quitar foto ${index + 1}`}>
                      Quitar
                    </button>
                  </figure>
                ))}
              </div>
            )}
            {freeSlots > 0 ? (
              <label className="sighting-form-picker">
                <input type="file" accept="image/*" multiple onChange={handlePhotos} disabled={sending} />
                <span>{keptPhotos.length > 0 ? 'Agregar fotos' : 'Seleccionar fotos'}</span>
                <strong>{keptPhotos.length + newPhotos.length}/{MAX_PHOTOS} fotos</strong>
              </label>
            ) : (
              <small className="sighting-form-help">Ya tienes 4 fotos; quita alguna para cambiarla.</small>
            )}
            {previews.length > 0 && (
              <div className="sighting-form-previews">
                {previews.map((url, index) => (
                  <figure key={url}>
                    <img src={url} alt={`Foto nueva ${index + 1}`} />
                  </figure>
                ))}
              </div>
            )}
            {newPhotos.length > 0 && (
              <button
                type="button"
                className="sighting-form-clear"
                onClick={() => { setNewPhotos([]); setPreviews([]); setPhotoCheck({ analyzing: false, blocked: false }); }}
                disabled={sending}
              >
                Quitar fotos nuevas
              </button>
            )}
            {newPhotos.length > 0 && (
              <DogPhotoAnalysis
                images={newPhotos.map((file) => ({ file }))}
                onStatusChange={setPhotoCheck}
                disabled={sending}
                requireDog={false}
                showChips={false}
              />
            )}
          </div>
        </>
      )}

      <div className="sighting-form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={sending}>Cancelar</button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={sending || submitDisabled || (showDetails && (photoCheck.analyzing || photoCheck.blocked))}
        >
          {sending ? submitLabel[1] : submitLabel[0]}
        </button>
      </div>
    </form>
  );
};

export default SightingForm;
