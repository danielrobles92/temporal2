import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DOG_BREED_OPTIONS, DOG_COLORS, DOG_SIZES, MEXICO_CITY_LOCATIONS } from '../../constants/dogOptions';
import { createPet, mapFrontendToBackend } from '../../services/petsService';
import { createReport, getReportMatches } from '../../services/platformService';
import CartillaForm, { emptyCartilla } from '../../components/CartillaForm/CartillaForm';
import ImageSlots from '../../components/ImageSlots/ImageSlots';
import DogPhotoAnalysis from '../../components/DogPhotoAnalysis/DogPhotoAnalysis';
import MatchSuggestions from '../../components/MatchSuggestions/MatchSuggestions';
import { ATRIBUTOS_TELEFONO, MENSAJE_TELEFONO, limpiarTelefono, telefonoValido } from '../../utils/telefono';
import MapPicker from '../../components/MapPicker/MapPicker';
import { ATRIBUTOS_EDAD, ETIQUETA_EDAD } from '../../utils/edad';
import { guideToFirstError, missingText } from '../../utils/formGuide';
import './PublicarMascota.css';

// Motivo debajo del dato que falta (el recuadro rojo lo pone theme.css).
const FieldError = ({ msg }) => (msg ? <span className="error-message" role="alert">{msg}</span> : null);

// Orden en pantalla: la guía lleva al primero que falte.
const FIELD_ORDER = ['nombre', 'raza', 'otraRaza', 'sexo', 'color', 'otroColor', 'edad', 'tamano', 'ubicacion', 'telefono', 'imagenes', 'declaracion'];

const initialForm = {
  tipo: 'adopcion',
  nombre: '',
  raza: '',
  otraRaza: '',
  sexo: '',
  color: '',
  otroColor: '',
  tamano: '',
  edad: '',
  ubicacion: '',
  detalleUbicacion: '',
  latitude: '',
  longitude: '',
  descripcion: '',
  telefono: '',
  imagenes: [],
  cartilla: emptyCartilla(),
};

const PublicarMascota = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Publicar en adopcion requiere autorizacion vigente (RN-07); los reportes, solo sesion.
  const canPublishAdoption = Boolean(user?.isAdmin || user?.role === 'SHELTER' || user?.publishingAuthorized);
  const [formData, setFormData] = useState(() => (
    canPublishAdoption ? initialForm : { ...initialForm, tipo: 'perdida' }
  ));
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [matchModal, setMatchModal] = useState({ open: false, reportId: null, matches: [], loading: false });
  const [photoCheck, setPhotoCheck] = useState({ analyzing: false, blocked: false });
  // Declaración de veracidad y de permiso sobre las fotos (TT2, sección 4.4.4.2); se valida solo en la interfaz.
  const [aceptaDeclaracion, setAceptaDeclaracion] = useState(false);

  // Autollenado con lo que detecto la red neuronal (raza, color y tamano se
  // reemplazan porque el usuario lo pidio con el boton).
  const applyDetected = ({ raza, color, tamano }) => {
    setFormData((current) => ({
      ...current,
      raza: raza || current.raza,
      color: color || current.color,
      tamano: current.tipo === 'adopcion' && tamano ? tamano : current.tamano,
    }));
    setErrores((prev) => ({ ...prev, raza: '', color: '', tamano: '' }));
    showToast('Datos sugeridos aplicados. Revisalos antes de publicar.', 'success');
  };

  const handleChange = (e) => {
    const { name } = e.target;
    const value = name === 'telefono' ? limpiarTelefono(e.target.value) : e.target.value;
    const nextData = { ...formData, [name]: value };

    if (name === 'ubicacion') {
      const selectedLocation = MEXICO_CITY_LOCATIONS.find((location) => location.label === value);
      nextData.latitude = selectedLocation?.lat ?? '';
      nextData.longitude = selectedLocation?.lng ?? '';
    }

    setFormData(nextData);
    if (errores[name]) {
      setErrores({ ...errores, [name]: '' });
    }
  };

  const validateForm = () => {
    const nuevosErrores = {};

    if (!formData.nombre.trim()) nuevosErrores.nombre = 'El nombre es requerido';
    if (!formData.raza) nuevosErrores.raza = 'Selecciona una raza';
    if (formData.raza === 'Otro' && !formData.otraRaza.trim()) nuevosErrores.otraRaza = 'Especifica la raza';
    if (!formData.sexo) nuevosErrores.sexo = 'Selecciona el sexo';
    if (!formData.color) nuevosErrores.color = 'Selecciona un color';
    if (formData.color === 'Otro' && !formData.otroColor.trim()) nuevosErrores.otroColor = 'Especifica el color';
    if (formData.tipo === 'adopcion' && !formData.tamano) nuevosErrores.tamano = 'Selecciona el tamaño';
    if (!formData.ubicacion) nuevosErrores.ubicacion = 'Selecciona una ubicacion';
    if (formData.edad && !(parseInt(formData.edad) >= 1)) nuevosErrores.edad = 'Escribe la edad en años; pon 1 si tiene un año o menos';
    if (!formData.imagenes.length) nuevosErrores.imagenes = 'Agrega al menos una foto (recomendado 4)';
    if (photoCheck.blocked) nuevosErrores.imagenes = 'Hay fotos que no se pueden usar (no son de un perro o tienen varios perros): quítalas para continuar';
    if (formData.tipo !== 'adopcion' && formData.telefono && !telefonoValido(formData.telefono)) nuevosErrores.telefono = MENSAJE_TELEFONO;
    if (!aceptaDeclaracion) nuevosErrores.declaracion = 'Marca la declaración para poder publicar';

    setErrores(nuevosErrores);
    const n = guideToFirstError(nuevosErrores, { order: FIELD_ORDER });
    if (n) showToast(`${missingText(n)} por completar o corregir. Te llevamos al primero; están marcados en rojo.`, 'error');
    return n === 0;
  };

  // Punto elegido en el mapa: si se conoce la direccion, llena la referencia y la alcaldia.
  const handleMapChange = ({ latitude, longitude, address, detail, alcaldia }) => {
    setFormData((current) => ({
      ...current,
      latitude,
      longitude,
      ...(address ? { detalleUbicacion: alcaldia ? detail || address : address } : {}),
      ...(alcaldia ? { ubicacion: alcaldia } : {}),
    }));
    if (alcaldia) setErrores((prev) => ({ ...prev, ubicacion: '' }));
  };

  const buildPetData = () => ({
    ownerId: user?.id,
    nombre: formData.nombre.trim(),
    tipoAnimal: 'Perro',
    raza: formData.raza === 'Otro' ? formData.otraRaza.trim() : formData.raza,
    sexo: formData.sexo,
    color: formData.color === 'Otro' ? formData.otroColor.trim() : formData.color,
    tamano: formData.tipo === 'adopcion' ? formData.tamano : '',
    edad: formData.edad ? parseInt(formData.edad) : null,
    edadNumero: formData.edad ? parseInt(formData.edad) : null,
    descripcion: formData.descripcion.trim(),
    ubicacion: formData.detalleUbicacion.trim()
      ? `${formData.ubicacion} - ${formData.detalleUbicacion.trim()}`
      : formData.ubicacion,
    tipo: formData.tipo,
    imagenUrl: formData.imagenes[0]?.preview || '',
    imagenFile: formData.imagenes[0]?.file || null,
    imagenFiles: formData.imagenes.map((image) => image.file).filter(Boolean),
    latitude: formData.latitude === '' ? null : Number(formData.latitude),
    longitude: formData.longitude === '' ? null : Number(formData.longitude),
    cartilla: formData.cartilla,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (!canPublishAdoption && formData.tipo === 'adopcion') {
        const message = 'Necesitas autorizacion vigente para publicar perros en adopcion.';
        showToast(message, 'warning');
        setLoading(false);
        return;
      }

      const petData = buildPetData();
      const backendPet = mapFrontendToBackend(petData);

      if (formData.tipo === 'adopcion') {
        await createPet(backendPet);
        showToast('Anuncio publicado correctamente', 'success');
        navigate('/adopcion');
      } else {
        const created = await createReport({
          reporterId: user?.id,
          type: formData.tipo === 'encontrada' ? 'FOUND' : 'LOST',
          name: petData.nombre,
          species: 'DOG',
          breed: petData.raza,
          sex: backendPet.sex,
          color: petData.color,
          age: petData.edad,
          location: petData.ubicacion,
          latitude: petData.latitude,
          longitude: petData.longitude,
          description: petData.descripcion,
          contactPhone: formData.telefono || limpiarTelefono(user?.phone),
          imageUrl: '',
          imageFiles: petData.imagenFiles,
          status: 'OPEN',
        });
        showToast('Reporte publicado correctamente', 'success');
        // Mostrar posibles coincidencias antes de continuar
        setMatchModal({ open: true, reportId: created?.reportId, matches: [], loading: true });
        const matches = await getReportMatches(created?.reportId).catch(() => []);
        setMatchModal((prev) => ({ ...prev, matches, loading: false }));
      }
    } catch (error) {
      const message = error.message || 'Error al publicar el anuncio. Por favor, intenta de nuevo.';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publicar-mascota-page">
      <div className="page-header">
        <h1>Publicar Anuncio</h1>
        <p>Registra perros en adopcion, perdidos o encontrados con datos controlados</p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="publicar-form" noValidate>
          <div className="form-section">
            <h2>Tipo de Anuncio</h2>
            <div className="tipo-anuncio-buttons">
              {[
                ['adopcion', 'Perro en adopcion'],
                ['perdida', 'Perro perdido'],
                ['encontrada', 'Perro encontrado'],
              ].map(([value, label]) => {
                const locked = value === 'adopcion' && !canPublishAdoption;
                return (
                  <label
                    className={`tipo-anuncio-button ${formData.tipo === value ? 'active' : ''} ${locked ? 'locked' : ''}`}
                    key={value}
                    title={locked ? 'Necesitas autorizacion del administrador para publicar en adopcion' : undefined}
                  >
                    <input type="radio" name="tipo" value={value} checked={formData.tipo === value} onChange={handleChange} disabled={loading || locked} />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
            {!canPublishAdoption && (
              <small className="tipo-anuncio-hint">
                Para publicar perros en adopcion necesitas autorizacion del administrador.{' '}
                <button type="button" className="link-button" onClick={() => navigate('/perfil')}>Solicitala desde tu perfil</button>.
              </small>
            )}
          </div>

          <div className="form-section">
            <h2>Informacion del Perro</h2>

            <div className="form-group" data-field="nombre">
              <label htmlFor="nombre">Nombre *</label>
              <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} className={errores.nombre ? 'error' : ''} placeholder="Nombre del perro" disabled={loading} />
              <FieldError msg={errores.nombre} />
            </div>

            <div className="form-row">
              <div className="form-group" data-field="raza">
                <label htmlFor="raza">Raza *</label>
                <select id="raza" name="raza" value={formData.raza} onChange={handleChange} className={errores.raza ? 'error' : ''} disabled={loading}>
                  <option value="">Selecciona...</option>
                  {DOG_BREED_OPTIONS.map((breed) => <option key={breed} value={breed}>{breed}</option>)}
                </select>
                {formData.raza === 'Otro' && (
                  <input type="text" name="otraRaza" value={formData.otraRaza} onChange={handleChange} className={errores.otraRaza ? 'error' : ''} placeholder="Especifica la raza" disabled={loading} />
                )}
                <FieldError msg={errores.raza || errores.otraRaza} />
              </div>

              <div className="form-group" data-field="sexo">
                <label htmlFor="sexo">Sexo *</label>
                <select id="sexo" name="sexo" value={formData.sexo} onChange={handleChange} className={errores.sexo ? 'error' : ''} disabled={loading}>
                  <option value="">Selecciona...</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
                <FieldError msg={errores.sexo} />
              </div>

              <div className="form-group" data-field="color">
                <label htmlFor="color">Color *</label>
                <select id="color" name="color" value={formData.color} onChange={handleChange} className={errores.color ? 'error' : ''} disabled={loading}>
                  <option value="">Selecciona...</option>
                  {DOG_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
                </select>
                {formData.color === 'Otro' && (
                  <input type="text" name="otroColor" value={formData.otroColor} onChange={handleChange} className={errores.otroColor ? 'error' : ''} placeholder="Especifica el color" disabled={loading} />
                )}
                <FieldError msg={errores.color || errores.otroColor} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" data-field="edad">
                <label htmlFor="edad">{ETIQUETA_EDAD}</label>
                <input {...ATRIBUTOS_EDAD} id="edad" name="edad" value={formData.edad} onChange={handleChange} placeholder="Ej. 3" className={errores.edad ? 'error' : ''} disabled={loading} />
                <FieldError msg={errores.edad} />
              </div>

              {formData.tipo === 'adopcion' && (
                <div className="form-group" data-field="tamano">
                  <label htmlFor="tamano">Tamaño *</label>
                  <select id="tamano" name="tamano" value={formData.tamano} onChange={handleChange} className={errores.tamano ? 'error' : ''} disabled={loading}>
                    <option value="">Selecciona...</option>
                    {DOG_SIZES.map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
                  </select>
                  <FieldError msg={errores.tamano} />
                </div>
              )}

              <div className="form-group" data-field="ubicacion">
                <label htmlFor="ubicacion">Ubicacion *</label>
                <select id="ubicacion" name="ubicacion" value={formData.ubicacion} onChange={handleChange} className={errores.ubicacion ? 'error' : ''} disabled={loading}>
                  <option value="">Selecciona alcaldia...</option>
                  {MEXICO_CITY_LOCATIONS.map((location) => <option key={location.label} value={location.label}>{location.label}</option>)}
                </select>
                <FieldError msg={errores.ubicacion} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="detalleUbicacion">Referencia o colonia</label>
              <input
                type="text"
                id="detalleUbicacion"
                name="detalleUbicacion"
                value={formData.detalleUbicacion}
                onChange={handleChange}
                placeholder="Ej. Col. Centro, cerca del parque..."
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="descripcion">Descripcion</label>
              <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} rows="5" placeholder="Caracteristicas, comportamiento o referencias utiles..." disabled={loading} />
            </div>

            {/* En adopcion el contacto pasa por solicitudes y casos; el telefono solo aplica a reportes. */}
            {formData.tipo !== 'adopcion' && (
              <div className="form-row">
                <div className="form-group" data-field="telefono">
                  <label htmlFor="telefono">Telefono de contacto</label>
                  <input {...ATRIBUTOS_TELEFONO} id="telefono" name="telefono" value={formData.telefono || limpiarTelefono(user?.phone)} onChange={handleChange} placeholder="5512345678" className={errores.telefono ? 'error' : ''} disabled={loading} />
                  <FieldError msg={errores.telefono} />
                </div>
              </div>
            )}

            <div className={`form-group${errores.imagenes ? ' has-error' : ''}`} data-field="imagenes">
              <label>Fotos del perro</label>
              <small>Sube de 1 a 4 fotos. Reordénalas y elige la principal (la que se vea mejor). 4 fotos mejoran el reconocimiento.</small>
              <ImageSlots
                value={formData.imagenes}
                onChange={(imagenes) => {
                  setFormData((current) => ({ ...current, imagenes }));
                  if (errores.imagenes) setErrores((prev) => ({ ...prev, imagenes: '' }));
                }}
                disabled={loading}
                onError={(msg) => showToast(msg, 'error')}
              />
              <DogPhotoAnalysis
                images={formData.imagenes}
                onApply={applyDetected}
                onStatusChange={setPhotoCheck}
                disabled={loading}
                applyLabel={formData.tipo === 'adopcion' ? 'Usar datos detectados (raza, color y tamaño)' : undefined}
              />
              <FieldError msg={errores.imagenes} />
            </div>

            <div className="form-group">
              <label>Ubicación en el mapa</label>
              <MapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={handleMapChange}
                disabled={loading}
              />
            </div>
          </div>

          {formData.tipo === 'adopcion' && (
            <div className="form-section">
              <h2>Cartilla / Salud</h2>
              <small>Datos opcionales del historial de salud y vacunas del perro.</small>
              <CartillaForm
                value={formData.cartilla}
                onChange={(cartilla) => setFormData((current) => ({ ...current, cartilla }))}
                disabled={loading}
              />
            </div>
          )}

          <div className={`form-declaracion${errores.declaracion ? ' has-error' : ''}`} data-field="declaracion">
            <label className="checkbox-label">
              <input
                type="checkbox"
                id="acepta-declaracion"
                checked={aceptaDeclaracion}
                onChange={(e) => {
                  setAceptaDeclaracion(e.target.checked);
                  if (e.target.checked && errores.declaracion) setErrores((prev) => ({ ...prev, declaracion: '' }));
                }}
                disabled={loading}
                required
              />
              <span>
                Declaro que los datos son verdaderos y que las fotos son mías o tengo permiso para publicarlas, y acepto
                los{' '}
                {/* En otra pestaña, para no perder lo que ya se capturó en el formulario */}
                <a href="/terminos" target="_blank" rel="noopener noreferrer" className="link-terms">
                  términos y condiciones
                </a>{' '}
                y el{' '}
                <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="link-terms">
                  aviso de privacidad
                </a>
                .
              </span>
            </label>
            <FieldError msg={errores.declaracion} />
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary" disabled={loading}>Cancelar</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Publicando...' : 'Publicar Anuncio'}
            </button>
          </div>
        </form>
      </div>

      {matchModal.open && (
        <div className="modal-overlay" onClick={() => navigate('/mascotas-perdidas')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Posibles coincidencias</h2>
            </div>
            <div className="modal-body">
              {matchModal.loading ? (
                <p>Buscando coincidencias con la base de datos...</p>
              ) : (
                <>
                  <p>Revisa si tu perro está entre estas posibles coincidencias antes de continuar:</p>
                  <MatchSuggestions matches={matchModal.matches} />
                </>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/mascotas-perdidas')}>
                Continuar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!matchModal.reportId}
                onClick={() => navigate(`/reporte/${matchModal.reportId}`)}
              >
                Ver mi reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicarMascota;
