import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MascotaCard from '../../components/MascotaCard/MascotaCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAllPets, mapBackendToFrontend } from '../../services/petsService';
import { ATRIBUTOS_TELEFONO, MENSAJE_TELEFONO, limpiarTelefono, telefonoValido } from '../../utils/telefono';
import { createAdoptionRequest, getAdoptionRequestsByUser, updateAdoptionRequest } from '../../services/platformService';
import { DOG_SIZES, sizeLabel } from '../../constants/dogOptions';
import { formatDate, formatDateTime, timeAgo } from '../../utils/dateFormat';
import BreedRecommendations from '../../components/BreedRecommendations/BreedRecommendations';
import AdoptionQuestions, { questionsForBreed } from '../../components/AdoptionQuestions/AdoptionQuestions';
import ImageViewer from '../../components/ImageViewer/ImageViewer';
import { guideTo } from '../../utils/formGuide';
import { answersToValues, buildAnswers, missingAnswers } from '../../constants/adoptionQuestions';
import './Adopcion.css';

const SIZE_FETCH_ALL = 9999;
const VISIBLE_CARDS = 3;

const FILTROS_INICIALES = {
  busqueda: '',
  estado: 'AVAILABLE',
  sexo: '',
  tamano: '',
  edad: '',
  ubicacion: '',
};

const ADOPTION_FORM_INITIAL = {
  nombreCompleto: '',
  correo: '',
  telefono: '',
  mensaje: '',
};

const matchEdadFiltro = (edadNumero, filtroEdad) => {
  if (!filtroEdad) return true;
  if (edadNumero == null || edadNumero === '') return true;
  const age = Number(edadNumero);
  if (Number.isNaN(age)) return true;

  switch (filtroEdad) {
    case 'cachorro':
      return age <= 1;
    case 'joven':
      return age >= 2 && age <= 3;
    case 'adulto':
      return age >= 4 && age <= 7;
    case 'senior':
      return age >= 8;
    default:
      return true;
  }
};

const Adopcion = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [mascotaDetalle, setMascotaDetalle] = useState(null);
  // Galería del detalle: foto principal elegida y visor a pantalla completa (null = cerrado).
  const [fotoActiva, setFotoActiva] = useState(0);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [showAdoptionForm, setShowAdoptionForm] = useState(false);
  const [adoptionForm, setAdoptionForm] = useState(ADOPTION_FORM_INITIAL);
  const [sendingRequest, setSendingRequest] = useState(false);
  // Solicitud nueva en dos pasos: 'info' (resumen de la raza) y 'form' (datos y preguntas).
  const [adoptionStep, setAdoptionStep] = useState('info');
  const [readInfo, setReadInfo] = useState(false);
  // Respuestas a las preguntas de cuidados y de la raza ({ idPregunta: opción }).
  const [answerValues, setAnswerValues] = useState({});
  const [showMissing, setShowMissing] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  // Solicitudes que ya envio el usuario, por perro: si existe, se corrige en vez de mandar otra.
  const [myRequests, setMyRequests] = useState({});
  const navigate = useNavigate();
  const [filtrosDraft, setFiltrosDraft] = useState(FILTROS_INICIALES);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const loadPets = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllPets(SIZE_FETCH_ALL);
      const content = Array.isArray(response) ? response : (response.content || []);
      setMascotas(content.map((pet) => mapBackendToFrontend(pet)));
    } catch (err) {
      setError(err.message || 'Error al cargar las mascotas');
      console.error('Error al cargar mascotas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyRequests = async () => {
    if (!user?.id) {
      setMyRequests({});
      return;
    }
    try {
      const list = await getAdoptionRequestsByUser(user.id);
      setMyRequests(Object.fromEntries((list || []).map((item) => [Number(item.petId), item])));
    } catch {
      // Sin la lista se puede seguir; el backend no deja mandar dos solicitudes.
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  useEffect(() => {
    loadMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const myRequest = mascotaDetalle ? myRequests[Number(mascotaDetalle.id)] : null;
  const editingMine = Boolean(myRequest);
  const contactOnly = myRequest?.editMode === 'CONTACT';
  const questions = questionsForBreed(mascotaDetalle?.raza);
  const publisher = mascotaDetalle?.ownerName || 'quien publicó';
  const fotosDetalle = mascotaDetalle?.imagenes?.length
    ? mascotaDetalle.imagenes
    : (mascotaDetalle?.imagen ? [mascotaDetalle.imagen] : []);

  const mascotasFiltradas = mascotas.filter((mascota) => {
    const coincideUbicacion =
      !filtros.ubicacion ||
      mascota.ubicacion?.toLowerCase().includes(filtros.ubicacion.toLowerCase());
    const coincideBusqueda =
      !filtros.busqueda ||
      mascota.nombre?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      (mascota.raza && mascota.raza.toLowerCase().includes(filtros.busqueda.toLowerCase()));
    const coincideSexo = !filtros.sexo || mascota.sexo === filtros.sexo;
    const coincideTamano = !filtros.tamano || mascota.tamano === filtros.tamano;
    const coincideEdad = matchEdadFiltro(mascota.edadNumero, filtros.edad);
    const coincideEstado = !filtros.estado || mascota.estadoBackend === filtros.estado;

    return coincideUbicacion && coincideBusqueda && coincideSexo && coincideTamano && coincideEdad && coincideEstado;
  });

  const maxCarouselIndex = Math.max(0, mascotasFiltradas.length - VISIBLE_CARDS);

  useEffect(() => {
    if (carouselIndex > maxCarouselIndex) {
      setCarouselIndex(maxCarouselIndex);
    }
  }, [carouselIndex, maxCarouselIndex]);

  useEffect(() => {
    setFotoActiva(0);
    setFotoAmpliada(null);
  }, [mascotaDetalle?.id]);

  useEffect(() => {
    if (!mascotaDetalle) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMascotaDetalle(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mascotaDetalle]);

  useEffect(() => {
    if (!mascotaDetalle) {
      setShowAdoptionForm(false);
      setAdoptionForm(ADOPTION_FORM_INITIAL);
      return;
    }

    const existing = myRequests[Number(mascotaDetalle.id)];
    setAdoptionStep(existing ? 'form' : 'info');
    setReadInfo(false);
    setShowMissing(false);
    setAnswerValues(answersToValues(existing?.answers));
    setAdoptionForm(existing
      ? {
        nombreCompleto: existing.contactName || '',
        correo: existing.contactEmail || '',
        telefono: limpiarTelefono(existing.contactPhone),
        mensaje: existing.message || '',
      }
      : {
        nombreCompleto: user?.name || user?.username || '',
        correo: user?.email || '',
        telefono: limpiarTelefono(user?.phone),
        mensaje: '',
      });
  }, [mascotaDetalle, user, myRequests]);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltrosDraft((prev) => ({ ...prev, [name]: value }));
  };

  const aplicarFiltros = (e) => {
    e.preventDefault();
    setFiltros({ ...filtrosDraft });
    setCarouselIndex(0);
  };

  const limpiarFiltros = () => {
    setFiltrosDraft(FILTROS_INICIALES);
    setFiltros(FILTROS_INICIALES);
    setCarouselIndex(0);
  };

  const moverCarrusel = (direction) => {
    setCarouselIndex((current) => {
      const next = current + direction;
      return Math.min(maxCarouselIndex, Math.max(0, next));
    });
  };

  const handleAdoptionFormChange = (event) => {
    const { name } = event.target;
    const value = name === 'telefono' ? limpiarTelefono(event.target.value) : event.target.value;
    setAdoptionForm((current) => ({ ...current, [name]: value }));
  };

  const handleAdoptionRequest = async (event) => {
    event.preventDefault();

    if (!mascotaDetalle || !user?.id) {
      showToast('Inicia sesion para solicitar adopcion', 'warning');
      return;
    }

    if (mascotaDetalle.ownerId && Number(mascotaDetalle.ownerId) === Number(user.id)) {
      showToast('No puedes solicitar adopcion de tu propia publicacion', 'warning');
      return;
    }

    if (adoptionForm.telefono && !telefonoValido(adoptionForm.telefono)) {
      setPhoneError(MENSAJE_TELEFONO);
      guideTo('adoption-phone');
      showToast(MENSAJE_TELEFONO, 'warning');
      return;
    }
    setPhoneError('');

    // Preguntas: obligatorias al enviar. Al corregir una solicitud anterior a las preguntas se
    // pueden dejar sin contestar, pero si se empiezan se contestan todas. Con el caso abierto no se tocan.
    const answering = !contactOnly
      && (!editingMine || myRequest.answers?.length > 0 || Object.keys(answerValues).length > 0);
    const missing = answering ? missingAnswers(questions, answerValues) : [];
    if (missing.length) {
      setShowMissing(true);
      // Lleva a la primera pregunta sin contestar (ya marcada en rojo).
      setTimeout(() => guideTo(document.querySelector('.adoption-q-item.is-missing')), 30);
      showToast(`Te falta${missing.length === 1 ? '' : 'n'} ${missing.length} pregunta${missing.length === 1 ? '' : 's'} por contestar (marcada${missing.length === 1 ? '' : 's'} en rojo). Te llevamos a la primera.`, 'warning');
      return;
    }
    const answers = answering ? buildAnswers(questions, answerValues) : null;

    // Ya habia enviado una: se corrige la misma (conserva su fecha y su lugar en la fila).
    if (myRequest) {
      setSendingRequest(true);
      try {
        await updateAdoptionRequest(myRequest.requestId, {
          contactName: adoptionForm.nombreCompleto.trim(),
          contactEmail: adoptionForm.correo.trim(),
          contactPhone: adoptionForm.telefono.trim(),
          message: contactOnly ? null : adoptionForm.mensaje.trim(),
          answers,
        });
        showToast('Solicitud actualizada. Quien publicó verá que la corregiste.', 'success');
        setShowAdoptionForm(false);
        await loadMyRequests();
      } catch (err) {
        showToast(err.message || 'No se pudo actualizar la solicitud', 'error');
      } finally {
        setSendingRequest(false);
      }
      return;
    }

    if (mascotaDetalle.estadoBackend !== 'AVAILABLE') {
      showToast('Este perro ya no esta disponible para adopcion', 'warning');
      return;
    }

    setSendingRequest(true);
    try {
      await createAdoptionRequest({
        petId: Number(mascotaDetalle.id),
        userId: user.id,
        contactName: adoptionForm.nombreCompleto || user.name || user.username || 'Usuario',
        contactEmail: adoptionForm.correo || user.email,
        contactPhone: adoptionForm.telefono || limpiarTelefono(user.phone),
        message: adoptionForm.mensaje || `Me interesa adoptar a ${mascotaDetalle.nombre || 'este perro'}.`,
        answers,
      });
      showToast(`Solicitud enviada. ${publisher} verá tus respuestas.`, 'success');
      setShowAdoptionForm(false);
      setMascotaDetalle(null);
      await loadMyRequests();
    } catch (err) {
      showToast(err.message || 'No se pudo enviar la solicitud', 'error');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="adopcion-page">
      <div className="adopcion-layout">
        <aside className="adopcion-filtros-card">
          <h2 className="adopcion-filtros-title">Filtros de busqueda</h2>
          <form className="adopcion-filtros-form" onSubmit={aplicarFiltros}>
            <div className="form-group">
              <label htmlFor="busqueda">Buscar por nombre o raza</label>
              <input
                id="busqueda"
                type="text"
                name="busqueda"
                className="adopcion-input"
                placeholder="Ej. Max, mestizo"
                value={filtrosDraft.busqueda}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                className="adopcion-input"
                value={filtrosDraft.estado}
                onChange={handleFiltroChange}
              >
                <option value="AVAILABLE">Disponibles</option>
                <option value="ADOPTED">Adoptados</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sexo">Sexo</label>
              <select
                id="sexo"
                name="sexo"
                className="adopcion-input"
                value={filtrosDraft.sexo}
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tamano">Tamaño</label>
              <select
                id="tamano"
                name="tamano"
                className="adopcion-input"
                value={filtrosDraft.tamano}
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                {DOG_SIZES.map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edad">Edad aproximada</label>
              <select
                id="edad"
                name="edad"
                className="adopcion-input"
                value={filtrosDraft.edad}
                onChange={handleFiltroChange}
              >
                <option value="">Todas</option>
                <option value="cachorro">Cachorro (1 año o menos)</option>
                <option value="joven">Joven (2-3 años)</option>
                <option value="adulto">Adulto (4-7 años)</option>
                <option value="senior">Senior (8+ años)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ubicacion">Ubicacion</label>
              <input
                id="ubicacion"
                type="text"
                name="ubicacion"
                className="adopcion-input"
                placeholder="Ej. Iztapalapa"
                value={filtrosDraft.ubicacion}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="adopcion-filtros-actions">
              <button type="submit" className="btn btn-primary btn-block">
                Aplicar filtros
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={limpiarFiltros}
              >
                Limpiar
              </button>
            </div>
          </form>
        </aside>

        <section className="adopcion-resultados">
          <div className="adopcion-resultados-header">
            {mascotasFiltradas.length > VISIBLE_CARDS ? (
              <button
                type="button"
                className="adopcion-carousel-side-button"
                onClick={() => moverCarrusel(-1)}
                disabled={carouselIndex === 0}
                aria-label="Ver perros anteriores"
              >
                Anterior
              </button>
            ) : (
              <span className="adopcion-carousel-side-spacer" />
            )}
            <h1>Mascotas disponibles</h1>
            {mascotasFiltradas.length > VISIBLE_CARDS ? (
              <button
                type="button"
                className="adopcion-carousel-side-button"
                onClick={() => moverCarrusel(1)}
                disabled={carouselIndex >= maxCarouselIndex}
                aria-label="Ver perros siguientes"
              >
                Siguiente
              </button>
            ) : (
              <span className="adopcion-carousel-side-spacer" />
            )}
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">Cargando mascotas...</div>
            </div>
          ) : error ? (
            <div className="error-alert">
              <span className="error-icon">!</span>
              <span>{error}</span>
            </div>
          ) : mascotasFiltradas.length > 0 ? (
            <div className="adopcion-carousel">
              <div
                className="adopcion-carousel-track"
                style={{ transform: `translateX(calc(-${carouselIndex} * ((100% - 40px) / 3 + 20px)))` }}
              >
                {mascotasFiltradas.map((mascota) => (
                  <div className="adopcion-carousel-slide" key={mascota.id}>
                        <MascotaCard
                          mascota={mascota}
                          variant="adopcion"
                          onDetalle={setMascotaDetalle}
                        />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="adopcion-mascotas-grid">
              <div className="no-results">
                {mascotas.length === 0 ? (
                  <p>No hay perros disponibles.</p>
                ) : (
                  <>
                    <p>No se encontraron mascotas con esos filtros.</p>
                    <p>Intenta ajustar tus criterios de busqueda.</p>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {mascotaDetalle && (
        <div className="adopcion-modal-overlay" onClick={() => setMascotaDetalle(null)}>
          <div className="adopcion-modal" onClick={(event) => event.stopPropagation()}>
            <div className="adopcion-modal-header">
              <div>
                <span>Detalle del perro</span>
                <h2>{mascotaDetalle.nombre || 'Perro sin nombre'}</h2>
              </div>
              <button type="button" onClick={() => setMascotaDetalle(null)} aria-label="Cerrar detalle">
                x
              </button>
            </div>

            <div className="adopcion-modal-body">
              <div className="adopcion-modal-gallery">
                {fotosDetalle.length > 0 ? (
                  <button
                    type="button"
                    className="adopcion-modal-photo"
                    onClick={() => setFotoAmpliada(fotoActiva)}
                    aria-label={`Ver la foto ${fotoActiva + 1} en grande`}
                  >
                    <img src={fotosDetalle[fotoActiva] || fotosDetalle[0]} alt={mascotaDetalle.nombre} />
                    <span className="adopcion-modal-zoom">Ver en grande</span>
                  </button>
                ) : (
                  <div className="adopcion-modal-placeholder">Sin imagen</div>
                )}
                {fotosDetalle.length > 1 && (
                  <div className="adopcion-modal-thumbs">
                    {fotosDetalle.map((imageUrl, index) => (
                      <button
                        type="button"
                        key={`${imageUrl}-${index}`}
                        className={index === fotoActiva ? 'is-active' : ''}
                        onClick={() => setFotoActiva(index)}
                        aria-label={`Mostrar la foto ${index + 1}`}
                      >
                        <img src={imageUrl} alt={`${mascotaDetalle.nombre} ${index + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="adopcion-modal-info">
                <InfoItem label="Raza" value={mascotaDetalle.raza || 'No especificada'} />
                <InfoItem label="Sexo" value={mascotaDetalle.sexo || 'No especificado'} />
                <InfoItem label="Edad" value={mascotaDetalle.edad || 'No especificada'} />
                <InfoItem label="Tamaño" value={sizeLabel(mascotaDetalle.tamano) || 'No especificado'} />
                <InfoItem label="Color" value={mascotaDetalle.color || 'No especificado'} />
                <InfoItem label="Ubicacion" value={mascotaDetalle.ubicacion || 'No registrada'} />
                <InfoItem label="Publicado por" value={mascotaDetalle.ownerName || 'No registrado'} />
                <InfoItem label="Publicado el" value={mascotaDetalle.createdAt ? `${formatDateTime(mascotaDetalle.createdAt)} (${timeAgo(mascotaDetalle.createdAt)})` : 'Sin fecha'} />
              </div>

              <div className="adopcion-modal-description">
                <span>Descripcion</span>
                <p>{mascotaDetalle.descripcion || 'Sin descripcion adicional.'}</p>
              </div>

              <div className="adopcion-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setMascotaDetalle(null)}
                >
                  Cerrar
                </button>
                {editingMine ? (
                  <>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/solicitudes')}>
                      Ver en Solicitudes
                    </button>
                    {myRequest.editMode !== 'NONE' && (
                      <button type="button" className="btn btn-primary" onClick={() => setShowAdoptionForm((current) => !current)}>
                        {contactOnly ? 'Corregir mis datos' : 'Editar mi solicitud'}
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowAdoptionForm((current) => !current)}
                    disabled={
                      mascotaDetalle.estadoBackend !== 'AVAILABLE' ||
                      (mascotaDetalle.ownerId && Number(mascotaDetalle.ownerId) === Number(user?.id))
                    }
                    title={mascotaDetalle.estadoBackend !== 'AVAILABLE' ? 'Este perro ya no esta disponible para adopcion' : undefined}
                  >
                    Solicitar adopcion
                  </button>
                )}
              </div>
              {editingMine && (
                <div className="adopcion-my-request" role="status">
                  <p>
                    <strong>Ya enviaste una solicitud para {mascotaDetalle.nombre || 'este perro'}</strong> el {formatDate(myRequest.createdAt)}
                    {myRequest.editedAt ? ` · editada ${timeAgo(myRequest.editedAt)}` : ''}
                  </p>
                  <small>
                    {myRequest.editMode === 'NONE'
                      ? 'Esta solicitud ya terminó; puedes ver su resultado en Solicitudes.'
                      : contactOnly
                        ? 'Tu caso ya está abierto: puedes corregir tus datos de contacto; lo demás escríbelo en el chat del caso.'
                        : 'Si te equivocaste en algo, edítala; no hace falta enviar otra.'}
                  </small>
                </div>
              )}
              {mascotaDetalle.estadoBackend === 'ADOPTED' && (
                <p className="adopcion-modal-note">Este perro ya fue adoptado.</p>
              )}

              {showAdoptionForm && !editingMine && adoptionStep === 'info' && mascotaDetalle.estadoBackend === 'AVAILABLE' && (
                <div className="adopcion-inline-info">
                  <h3 className="adopcion-inline-heading">Datos a considerar</h3>
                  <p className="adopcion-inline-step">
                    Antes de solicitar a {mascotaDetalle.nombre || 'este perro'}, lee lo que indican los censos e
                    investigaciones a la fecha sobre este tipo de mascotas.
                  </p>
                  <p className="adopcion-inline-step">
                    <strong>
                      En el paso 2 contestarás {questions.length} preguntas de opción múltiple y {publisher} verá tus
                      respuestas antes de contactarte.
                    </strong>
                  </p>
                  <BreedRecommendations breed={mascotaDetalle.raza} />
                  <label className="adopcion-read">
                    <input type="checkbox" checked={readInfo} onChange={(e) => setReadInfo(e.target.checked)} />
                    Leí esta información y la tomé en cuenta.
                  </label>
                  <div className="adopcion-inline-form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAdoptionForm(false)}>
                      Cancelar
                    </button>
                    <button type="button" className="btn btn-primary" disabled={!readInfo} onClick={() => setAdoptionStep('form')}>
                      Continuar con la solicitud
                    </button>
                  </div>
                </div>
              )}

              {showAdoptionForm && (editingMine ? myRequest.editMode !== 'NONE' : mascotaDetalle.estadoBackend === 'AVAILABLE' && adoptionStep === 'form') && (
                <form className="adopcion-inline-form" onSubmit={handleAdoptionRequest}>
                  {!editingMine && (
                    <p className="adopcion-inline-step adopcion-inline-form-full">
                      <strong>Paso 2 de 2.</strong> Tus datos, las preguntas para {publisher} y un mensaje.
                    </p>
                  )}
                  <div className="form-group">
                    <label htmlFor="adoption-name">Nombre</label>
                    <input
                      id="adoption-name"
                      name="nombreCompleto"
                      value={adoptionForm.nombreCompleto}
                      onChange={handleAdoptionFormChange}
                      disabled={sendingRequest}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="adoption-email">Correo</label>
                    <input
                      id="adoption-email"
                      name="correo"
                      type="email"
                      value={adoptionForm.correo}
                      onChange={handleAdoptionFormChange}
                      disabled={sendingRequest}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="adoption-phone">Telefono</label>
                    <input
                      {...ATRIBUTOS_TELEFONO}
                      placeholder="5512345678"
                      id="adoption-phone"
                      name="telefono"
                      value={adoptionForm.telefono}
                      onChange={(event) => { setPhoneError(''); handleAdoptionFormChange(event); }}
                      disabled={sendingRequest}
                      className={phoneError ? 'error' : ''}
                    />
                    {phoneError && <span className="error-message" role="alert">{phoneError}</span>}
                  </div>
                  {!contactOnly && (
                    <div className="adopcion-inline-form-full">
                      <span className="adopcion-inline-title">
                        {editingMine ? 'Tus respuestas a las preguntas' : `Preguntas para ${publisher}`}
                      </span>
                      {editingMine && !myRequest.answers?.length && (
                        <p className="adopcion-inline-note">
                          Enviaste esta solicitud antes de las preguntas. Puedes contestarlas ahora (opcional);
                          si empiezas, hay que contestarlas todas.
                        </p>
                      )}
                      <AdoptionQuestions
                        questions={questions}
                        values={answerValues}
                        onChange={setAnswerValues}
                        disabled={sendingRequest}
                        showMissing={showMissing}
                      />
                    </div>
                  )}
                  {!contactOnly && (
                  <div className="form-group adopcion-inline-form-full">
                    <label htmlFor="adoption-message">Mensaje</label>
                    <textarea
                      id="adoption-message"
                      name="mensaje"
                      rows="3"
                      value={adoptionForm.mensaje}
                      onChange={handleAdoptionFormChange}
                      placeholder="Cuenta por qué quieres adoptar y cómo sería un día normal del perro en tu casa"
                      disabled={sendingRequest}
                    />
                  </div>
                  )}
                  <div className="adopcion-inline-form-actions">
                    {editingMine ? (
                      <button type="button" className="btn btn-secondary" onClick={() => setShowAdoptionForm(false)} disabled={sendingRequest}>
                        Cancelar
                      </button>
                    ) : (
                      <button type="button" className="btn btn-secondary" onClick={() => setAdoptionStep('info')} disabled={sendingRequest}>
                        Volver al resumen de la raza
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={sendingRequest}>
                      {sendingRequest
                        ? (editingMine ? 'Guardando...' : 'Enviando...')
                        : (editingMine ? 'Guardar cambios' : 'Enviar solicitud')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {mascotaDetalle && fotoAmpliada !== null && fotosDetalle.length > 0 && (
        <ImageViewer
          images={fotosDetalle}
          index={Math.min(fotoAmpliada, fotosDetalle.length - 1)}
          onChange={(i) => { setFotoAmpliada(i); setFotoActiva(i); }}
          onClose={() => setFotoAmpliada(null)}
          alt={mascotaDetalle.nombre || 'Perro'}
        />
      )}
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="adopcion-modal-info-item">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export default Adopcion;
