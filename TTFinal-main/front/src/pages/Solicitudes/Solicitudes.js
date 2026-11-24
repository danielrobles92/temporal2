import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import BreedRecommendations from '../../components/BreedRecommendations/BreedRecommendations';
import AdoptionAnswers from '../../components/AdoptionQuestions/AdoptionAnswers';
import AdoptionQuestions, { questionsForBreed } from '../../components/AdoptionQuestions/AdoptionQuestions';
import { answersToValues, buildAnswers, missingAnswers } from '../../constants/adoptionQuestions';
import SightingForm from '../../components/SightingForm/SightingForm';
import { formatDate, formatDateTime, timeAgo } from '../../utils/dateFormat';
import { ATRIBUTOS_TELEFONO, MENSAJE_TELEFONO, limpiarTelefono, telefonoValido } from '../../utils/telefono';
import { reportTypeTag, sightingStatusTag } from '../../constants/cardTags';
import {
  cancelAdoptionRequest,
  createAdoptionCase,
  createReportSighting,
  decideAdoptionRequest,
  getAdoptionRequestsByOwner,
  getAdoptionRequestsByUser,
  getMySightings,
  updateAdoptionRequest,
  updateReportSighting,
} from '../../services/platformService';
import './Solicitudes.css';

const statusMeta = {
  PENDING: { label: 'Pendiente', tone: 'pending' },
  APPROVED: { label: 'En contacto', tone: 'approved' },
  REJECTED: { label: 'Cancelada', tone: 'rejected' },
};

// El estado del caso de contacto manda: si se cerro, la solicitud termino ahi.
const getRequestMeta = (request) => {
  if (request?.decisionNotes === 'PET_ADOPTED_BY_OTHER') return { label: 'Adoptado por otra persona', tone: 'rejected' };
  if (request?.caseStatus === 'ADOPTED' || request?.decisionNotes === 'ADOPTED') return { label: 'Adoptado', tone: 'approved' };
  if (['CANCELLED', 'CLOSED'].includes(request?.caseStatus) || request?.decisionNotes?.startsWith?.('CANCELLED')) {
    return { label: 'Cancelada', tone: 'rejected' };
  }
  return statusMeta[request?.status] || { label: request?.status, tone: 'pending' };
};

const decisionNoteLabel = {
  CONTACT_CASE_OPENED: 'Caso de adopción abierto para contacto.',
  ADOPTED: 'El perro fue marcado como adoptado.',
  CANCELLED_BY_OWNER: 'La solicitud fue cancelada por el publicador.',
  CANCELLED_AFTER_CONTACT: 'El caso fue cancelado después del contacto.',
  PET_ADOPTED_BY_OTHER: 'El perro fue adoptado por otro solicitante; la solicitud se cerró automáticamente.',
};

// Fechas del avance de la solicitud, de la publicacion del perro al cierre.
const requestTimeline = (request) => {
  const meta = getRequestMeta(request);
  const finished = request.finishedAt;
  return [
    { key: 'published', label: 'Perro publicado', date: request.petPublishedAt },
    { key: 'requested', label: 'Solicitud enviada', date: request.createdAt },
    { key: 'contact', label: 'Inicio del contacto', date: request.caseOpenedAt, pendingText: request.status === 'PENDING' ? 'Sin respuesta aún' : '—' },
    { key: 'finished', label: finished ? `Finalizada: ${meta.label}` : 'Finalizada', date: finished, pendingText: 'En curso' },
  ];
};

// Que puede corregir quien envio la solicitud o el aviso (editMode del backend).
const editLabel = {
  FULL: 'Editar',
  CONTACT: 'Corregir mis datos',
};

const EditedTag = ({ date, label = 'Editada' }) => (date ? (
  <span className="card-tag card-tag--pending" title={formatDateTime(date)}>{label} {timeAgo(date)}</span>
) : null);

const RequestCard = ({ request, onContact, onDecision, onCancel, onEdit, onOpenDetails }) => {
  const meta = getRequestMeta(request);
  const petTitle = request.petName || 'Mascota sin nombre';
  const mode = request.viewMode;

  return (
    <article className={`request-card request-card-${meta.tone}`} onClick={() => onOpenDetails(request)}>
      <div className="request-card-head">
        <span className="request-eyebrow">{mode === 'received' ? 'Solicitud recibida' : 'Solicitud realizada'}</span>
        <span className={`status-pill ${meta.tone}`}>{meta.label}</span>
      </div>

      <div className="request-card-top">
        {request.petImageUrl && (
          <img className="request-pet-image" src={request.petImageUrl} alt={petTitle} />
        )}
        <div className="request-card-title">
          <h3>{petTitle}</h3>
          {mode === 'received' && <small>Solicitante: {request.contactName}</small>}
          {request.petOwnerName && <small>Refugio/publicador: {request.petOwnerName}</small>}
        </div>
      </div>

      <div className="card-tags request-card-tags">
        <span className="card-tag card-tag--adoption">Adopción</span>
        <span className="card-tag card-tag--time" title={formatDateTime(request.createdAt)}>
          Solicitud {timeAgo(request.createdAt)}
        </span>
        <EditedTag date={request.editedAt} />
      </div>

      <dl className="request-meta-grid">
        {requestTimeline(request).map((step) => (
          <div key={step.key} className={step.date ? '' : 'pending'}>
            <dt>{step.label}</dt>
            <dd>{step.date ? formatDate(step.date) : step.pendingText}</dd>
          </div>
        ))}
      </dl>

      <p className="request-message">{request.message || 'Sin mensaje adicional.'}</p>

      {mode === 'received' && <AdoptionAnswers answers={request.answers} compact />}

      {mode === 'received' && (
        <div className="request-contact">
          <span>{request.contactEmail}</span>
          {request.contactPhone && <span>{request.contactPhone}</span>}
        </div>
      )}

      {request.decisionNotes && <p className="request-notes">{decisionNoteLabel[request.decisionNotes] || request.decisionNotes}</p>}

      {mode === 'received' && request.status === 'PENDING' && (
        <div className="request-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-primary" onClick={() => onContact(request)}>Contactar</button>
          <button className="btn btn-danger" onClick={() => onDecision(request.requestId, 'REJECTED', 'CANCELLED_BY_OWNER')}>Cancelar</button>
        </div>
      )}

      {mode === 'mine' && (request.status === 'PENDING' || editLabel[request.editMode]) && (
        <div className="request-actions" onClick={(e) => e.stopPropagation()}>
          {editLabel[request.editMode] && (
            <button className="btn btn-primary" onClick={() => onEdit(request)}>{editLabel[request.editMode]}</button>
          )}
          {request.status === 'PENDING' && (
            <button className="btn btn-secondary" onClick={() => onCancel(request.requestId)}>Cancelar solicitud</button>
          )}
        </div>
      )}
    </article>
  );
};

// Aviso que el usuario envio sobre un perro perdido o encontrado.
const SentSightingCard = ({ sighting, onEdit, onAddEntry, onOpenCase }) => {
  const status = sightingStatusTag(sighting.status);
  const typeTag = reportTypeTag(sighting.reportType);
  const entries = sighting.entries || [];
  const tone = status.tone === 'approved' ? 'request-card-approved' : status.tone === 'rejected' ? 'request-card-rejected' : '';
  return (
    <article className={`request-card sent-sighting-card ${tone}`}>
      <div className="request-card-head">
        <span className="request-eyebrow">Aviso enviado</span>
        <span className={`card-tag card-tag--${status.tone}`}>{status.label}</span>
      </div>

      <div className="request-card-top">
        {sighting.reportImageUrl && (
          <img className="request-pet-image" src={sighting.reportImageUrl} alt={sighting.reportName || 'Perro'} />
        )}
        <div className="request-card-title">
          <h3>{sighting.reportName || 'Perro perdido'}</h3>
          {sighting.reportOwnerName && <small>Publicado por {sighting.reportOwnerName}</small>}
        </div>
      </div>

      <div className="card-tags request-card-tags">
        <span className={`card-tag card-tag--${typeTag.tone}`}>{typeTag.label}</span>
        <span className="card-tag card-tag--time" title={formatDateTime(sighting.createdAt)}>Enviado {timeAgo(sighting.createdAt)}</span>
        {entries.length > 0 && <span className="card-tag card-tag--sighting">{entries.length + 1} avistamientos</span>}
        <EditedTag date={sighting.editedAt} label="Editado" />
      </div>

      <p className="request-message">{sighting.message}</p>
      {sighting.location && <p className="sent-sighting-location">📍 {sighting.location}</p>}
      {entries.length > 0 && (
        <p className="sent-sighting-last">
          Último avistamiento: {formatDate(entries[entries.length - 1].createdAt)}
          {entries[entries.length - 1].location ? ` · ${entries[entries.length - 1].location}` : ''}
        </p>
      )}
      {sighting.ownerReply && <p className="request-notes">Respuesta de quien publicó: {sighting.ownerReply}</p>}

      <div className="request-actions">
        {editLabel[sighting.editMode] && (
          <button className="btn btn-secondary" onClick={() => onEdit(sighting)}>
            {sighting.editMode === 'FULL' ? 'Corregir' : 'Corregir mis datos'}
          </button>
        )}
        <button className="btn btn-primary" onClick={() => onAddEntry(sighting)}>
          {sighting.reportType === 'FOUND' ? 'Agregar información' : 'Otro avistamiento'}
        </button>
        {sighting.caseId && (
          <button className="btn btn-secondary" onClick={() => onOpenCase(sighting.caseId)}>Ver caso</button>
        )}
      </div>
    </article>
  );
};

const Solicitudes = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mine, setMine] = useState([]);
  const [received, setReceived] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  // Solicitud a punto de contactarse: antes se muestran las recomendaciones de la raza.
  const [contactRequest, setContactRequest] = useState(null);
  const [openingCase, setOpeningCase] = useState(false);
  // Avisos enviados sobre perros perdidos/encontrados y su edicion.
  const [sightings, setSightings] = useState([]);
  const [editingSighting, setEditingSighting] = useState(null); // { sighting, mode }
  const [savingSighting, setSavingSighting] = useState(false);
  // Correccion de una solicitud de adopcion propia.
  const [editingRequest, setEditingRequest] = useState(null);
  const [requestForm, setRequestForm] = useState(null);
  const [savingRequest, setSavingRequest] = useState(false);
  // Respuestas a las preguntas de la solicitud que se corrige ({ idPregunta: opción }).
  const [answerValues, setAnswerValues] = useState({});
  const [showMissingAnswers, setShowMissingAnswers] = useState(false);

  const canReview = user?.isAdmin || user?.role === 'SHELTER' || user?.publishingAuthorized;

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const [ownRequests, sentSightings] = await Promise.all([
        getAdoptionRequestsByUser(user.id),
        getMySightings().catch(() => []),
      ]);
      setMine(ownRequests || []);
      setSightings(sentSightings || []);
      if (canReview) {
        const ownerRequests = await getAdoptionRequestsByOwner(user.id);
        setReceived(ownerRequests || []);
      }
    } catch (err) {
      const message = err.message || 'No se pudieron cargar las solicitudes';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const stats = useMemo(() => ({
    minePending: mine.filter((request) => request.status === 'PENDING').length,
    receivedPending: received.filter((request) => request.status === 'PENDING').length,
  }), [mine, received]);

  const allRequests = useMemo(() => ([
    ...mine.map((request) => ({ ...request, viewMode: 'mine', viewKey: `mine-${request.requestId}` })),
    ...received.map((request) => ({ ...request, viewMode: 'received', viewKey: `received-${request.requestId}` })),
  ]), [mine, received]);

  const filteredRequests = useMemo(() => {
    if (activeFilter === 'mine') return allRequests.filter((request) => request.viewMode === 'mine');
    if (activeFilter === 'received') return allRequests.filter((request) => request.viewMode === 'received');
    if (activeFilter === 'pending') return allRequests.filter((request) => request.status === 'PENDING');
    return allRequests;
  }, [activeFilter, allRequests]);

  const decide = async (requestId, status, notes = '') => {
    try {
      await decideAdoptionRequest(requestId, status, notes);
      showToast(notes === 'ADOPTED' ? 'Adopcion marcada como completada' : status === 'APPROVED' ? 'Caso de adopcion abierto' : 'Solicitud cancelada', 'success');
      setSelectedRequest(null);
      await load();
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar la solicitud', 'error');
    }
  };

  const openAdoptionCase = async (requestId) => {
    setOpeningCase(true);
    try {
      const newCase = await createAdoptionCase(requestId);
      showToast('Caso de adopcion abierto', 'success');
      setSelectedRequest(null);
      setContactRequest(null);
      await load();
      navigate(`/casos?case=${newCase.caseId}`);
    } catch (err) {
      showToast(err.message || 'No se pudo abrir el caso de adopcion', 'error');
    } finally {
      setOpeningCase(false);
    }
  };

  const startContact = (request) => {
    setSelectedRequest(null);
    setContactRequest(request);
  };

  const cancel = async (requestId) => {
    try {
      await cancelAdoptionRequest(requestId, user.id);
      showToast('Solicitud cancelada', 'success');
      setSelectedRequest(null);
      await load();
    } catch (err) {
      showToast(err.message || 'No se pudo cancelar la solicitud', 'error');
    }
  };

  const openRequestEditor = (request) => {
    setSelectedRequest(null);
    setEditingRequest(request);
    setRequestForm({
      contactName: request.contactName || '',
      contactEmail: request.contactEmail || '',
      contactPhone: limpiarTelefono(request.contactPhone),
      message: request.message || '',
    });
    setAnswerValues(answersToValues(request.answers));
    setShowMissingAnswers(false);
  };

  const handleRequestFormChange = (event) => {
    const { name } = event.target;
    const value = name === 'contactPhone' ? limpiarTelefono(event.target.value) : event.target.value;
    setRequestForm((current) => ({ ...current, [name]: value }));
  };

  const saveRequest = async (event) => {
    event.preventDefault();
    if (!requestForm.contactName.trim() || !requestForm.contactEmail.trim()) {
      showToast('Escribe tu nombre y tu correo', 'warning');
      return;
    }
    if (requestForm.contactPhone && !telefonoValido(requestForm.contactPhone)) {
      showToast(MENSAJE_TELEFONO, 'warning');
      return;
    }
    const contactOnly = editingRequest.editMode === 'CONTACT';
    // Las respuestas se corrigen mientras la solicitud está pendiente. Una solicitud anterior a las
    // preguntas puede guardarse sin contestarlas; si se empiezan a contestar, van todas.
    const questions = questionsForBreed(editingRequest.petBreed);
    const answering = !contactOnly && (editingRequest.answers?.length > 0 || Object.keys(answerValues).length > 0);
    const missing = answering ? missingAnswers(questions, answerValues) : [];
    if (missing.length) {
      setShowMissingAnswers(true);
      showToast(`Te falta${missing.length === 1 ? '' : 'n'} ${missing.length} pregunta${missing.length === 1 ? '' : 's'} por contestar`, 'warning');
      return;
    }
    setSavingRequest(true);
    try {
      await updateAdoptionRequest(editingRequest.requestId, {
        contactName: requestForm.contactName.trim(),
        contactEmail: requestForm.contactEmail.trim(),
        contactPhone: requestForm.contactPhone.trim(),
        message: contactOnly ? null : requestForm.message.trim(),
        answers: answering ? buildAnswers(questions, answerValues) : null,
      });
      showToast('Solicitud actualizada. Quien publicó verá que la corregiste.', 'success');
      setEditingRequest(null);
      setRequestForm(null);
      await load();
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar la solicitud', 'error');
    } finally {
      setSavingRequest(false);
    }
  };

  const saveSighting = async (data) => {
    const { sighting, mode } = editingSighting;
    setSavingSighting(true);
    try {
      if (mode === 'entry') {
        await createReportSighting(sighting.reportId, data);
        showToast(sighting.caseId && !['RESOLVED', 'ADOPTED'].includes(sighting.caseStatus)
          ? 'Avistamiento agregado al chat de tu caso'
          : 'Avistamiento agregado a tu mismo aviso', 'success');
      } else {
        await updateReportSighting(sighting.sightingId, data);
        showToast('Tu aviso se actualizó. Quien publicó verá que lo corregiste.', 'success');
      }
      setEditingSighting(null);
      await load();
    } catch (err) {
      showToast(err.message || 'No se pudo guardar el aviso', 'error');
    } finally {
      setSavingSighting(false);
    }
  };

  const selectedMeta = selectedRequest ? getRequestMeta(selectedRequest) : null;

  return (
    <div className="solicitudes-page">
      <div className="solicitudes-hero">
        <div>
          <span>Adopciones y avisos</span>
          <h1>Solicitudes</h1>
          <p>
            Revisa el avance de tus solicitudes de adopción y de los avisos que enviaste sobre perros perdidos.
            Si te equivocaste en algo, corrígelo aquí en lugar de enviar otro.
          </p>
        </div>
        <div className="solicitudes-stats">
          <button className={activeFilter === 'all' ? 'active' : ''} type="button" onClick={() => setActiveFilter('all')}>
            <strong>{allRequests.length}</strong><span>todas</span>
          </button>
          <button className={activeFilter === 'mine' ? 'active' : ''} type="button" onClick={() => setActiveFilter('mine')}>
            <strong>{mine.length}</strong><span>realizadas</span>
          </button>
          {canReview && (
            <button className={activeFilter === 'received' ? 'active' : ''} type="button" onClick={() => setActiveFilter('received')}>
              <strong>{received.length}</strong><span>recibidas</span>
            </button>
          )}
          <button className={activeFilter === 'pending' ? 'active' : ''} type="button" onClick={() => setActiveFilter('pending')}>
            <strong>{stats.minePending + stats.receivedPending}</strong><span>pendientes</span>
          </button>
          <button className={activeFilter === 'sightings' ? 'active' : ''} type="button" onClick={() => setActiveFilter('sightings')}>
            <strong>{sightings.length}</strong><span>avisos enviados</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">Cargando solicitudes...</div>
      ) : error ? (
        <div className="error-alert">{error}</div>
      ) : (
        <>
          {activeFilter !== 'sightings' && (
            <div className="request-grid">
              {filteredRequests.length === 0 ? (
                <div className="empty-panel">
                  <h2>No hay solicitudes para este filtro</h2>
                  <p>Cuando exista movimiento, aparecera aqui con su estado y datos de contacto.</p>
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <RequestCard
                    key={request.viewKey}
                    request={request}
                    onContact={startContact}
                    onDecision={decide}
                    onCancel={cancel}
                    onEdit={openRequestEditor}
                    onOpenDetails={setSelectedRequest}
                  />
                ))
              )}
            </div>
          )}

          {(activeFilter === 'sightings' || (activeFilter === 'all' && sightings.length > 0)) && (
            <section className="sent-sightings" aria-labelledby="sent-sightings-title">
              <h2 id="sent-sightings-title" className="sent-sightings-title">
                Avisos enviados sobre perros perdidos y encontrados
                <span>{sightings.length}</span>
              </h2>
              {sightings.length === 0 ? (
                <div className="empty-panel">
                  <h2>Aún no envías avisos</h2>
                  <p>Cuando avises que viste a un perro perdido, aparecerá aquí y podrás corregirlo o agregar otro avistamiento.</p>
                </div>
              ) : (
                <div className="request-grid">
                  {sightings.map((sighting) => (
                    <SentSightingCard
                      key={sighting.sightingId}
                      sighting={sighting}
                      onEdit={(item) => setEditingSighting({ sighting: item, mode: item.editMode === 'FULL' ? 'edit' : 'contact' })}
                      onAddEntry={(item) => setEditingSighting({ sighting: item, mode: 'entry' })}
                      onOpenCase={(caseId) => navigate(`/casos?case=${caseId}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {selectedRequest && (
        <div className="request-modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="request-modal" onClick={(e) => e.stopPropagation()}>
            <div className="request-modal-header">
              <div>
                <span>Detalle de solicitud</span>
                <h2>{selectedRequest.petName || 'Mascota sin nombre'}</h2>
              </div>
              <button type="button" onClick={() => setSelectedRequest(null)}>x</button>
            </div>

            <div className="request-modal-body">
              {selectedRequest.petImageUrl && (
                <img className="request-modal-image" src={selectedRequest.petImageUrl} alt={selectedRequest.petName || 'Mascota'} />
              )}
              <div className="request-detail-grid">
                <div><span>Estado</span><strong>{selectedMeta.label}</strong></div>
                <div><span>Publicado por</span><strong>{selectedRequest.petOwnerName || 'No registrado'}</strong></div>
                <div><span>Solicitante</span><strong>{selectedRequest.contactName || 'No registrado'}</strong></div>
                <div><span>Correo</span><strong>{selectedRequest.contactEmail || 'No registrado'}</strong></div>
                <div><span>Teléfono</span><strong>{selectedRequest.contactPhone || 'No registrado'}</strong></div>
                <div><span>Raza</span><strong>{selectedRequest.petBreed || 'No registrada'}</strong></div>
                {selectedRequest.editedAt && (
                  <div><span>Editada por quien la envió</span><strong>{formatDateTime(selectedRequest.editedAt)}</strong></div>
                )}
              </div>

              <div className="request-timeline">
                <span>Fechas</span>
                <ol>
                  {requestTimeline(selectedRequest).map((step) => (
                    <li key={step.key} className={step.date ? 'done' : 'pending'}>
                      <em>{step.label}</em>
                      <strong>{step.date ? formatDateTime(step.date) : step.pendingText}</strong>
                    </li>
                  ))}
                </ol>
              </div>

              {selectedRequest.status === 'APPROVED' && (
                <div className="adoption-case-board">
                  <span>Caso de adopcion abierto</span>
                <p>Usa estos datos para conectar al refugio/publicador con el solicitante. Aqui queda reunida la informacion del perro, quien publico y quien quiere adoptar.</p>
                  <div>
                    <strong>Perro:</strong> {selectedRequest.petName || 'Mascota sin nombre'}
                  </div>
                  <div>
                    <strong>Refugio/publicador:</strong> {selectedRequest.petOwnerName || 'No registrado'}
                  </div>
                  <div>
                    <strong>Solicitante:</strong> {selectedRequest.contactName || 'No registrado'} - {selectedRequest.contactEmail || 'Sin correo'}
                  </div>
                </div>
              )}

              <div className="request-modal-message">
                <span>Mensaje</span>
                <p>{selectedRequest.message || 'Sin mensaje adicional.'}</p>
              </div>

              <div className="request-modal-answers">
                <AdoptionAnswers
                  answers={selectedRequest.answers}
                  breed={selectedRequest.petBreed}
                  name={selectedRequest.contactName}
                  mine={selectedRequest.viewMode === 'mine'}
                />
              </div>

              {selectedRequest.decisionNotes && (
                <div className="request-modal-message">
                  <span>Notas de decision</span>
                  <p>{decisionNoteLabel[selectedRequest.decisionNotes] || selectedRequest.decisionNotes}</p>
                </div>
              )}
            </div>

            <div className="request-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedRequest(null)}>Cerrar</button>
              {selectedRequest.caseId && (
                <button type="button" className="btn btn-primary" onClick={() => navigate(`/casos?case=${selectedRequest.caseId}`)}>Ver caso</button>
              )}
              {selectedRequest.viewMode === 'mine' && editLabel[selectedRequest.editMode] && (
                <button type="button" className="btn btn-primary" onClick={() => openRequestEditor(selectedRequest)}>
                  {editLabel[selectedRequest.editMode]}
                </button>
              )}
              {selectedRequest.viewMode === 'mine' && selectedRequest.status === 'PENDING' && (
                <button type="button" className="btn btn-danger" onClick={() => cancel(selectedRequest.requestId)}>Cancelar solicitud</button>
              )}
              {selectedRequest.viewMode === 'received' && selectedRequest.status === 'PENDING' && (
                <>
                  <button type="button" className="btn btn-primary" onClick={() => startContact(selectedRequest)}>Contactar</button>
                  <button type="button" className="btn btn-danger" onClick={() => decide(selectedRequest.requestId, 'REJECTED', 'CANCELLED_BY_OWNER')}>Cancelar</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {contactRequest && (
        <div className="request-modal-overlay" onClick={() => !openingCase && setContactRequest(null)}>
          <div className="request-modal" onClick={(e) => e.stopPropagation()}>
            <div className="request-modal-header">
              <div>
                <span>Antes de contactar al solicitante</span>
                <h2>{contactRequest.petName || 'Mascota sin nombre'}{contactRequest.petBreed ? ` · ${contactRequest.petBreed}` : ''}</h2>
              </div>
              <button type="button" onClick={() => setContactRequest(null)} disabled={openingCase}>x</button>
            </div>

            <div className="request-modal-body">
              <p className="request-contact-intro">
                Compara lo que respondió {contactRequest.contactName || 'el solicitante'} con el resumen de la raza.
                Antes de enviar su solicitud, {contactRequest.contactName || 'el solicitante'} leyó este mismo resumen.
              </p>
              <AdoptionAnswers
                answers={contactRequest.answers}
                breed={contactRequest.petBreed}
                name={contactRequest.contactName}
              />
              <div className="request-contact-breed">
                <BreedRecommendations breed={contactRequest.petBreed} />
              </div>
            </div>

            <div className="request-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setContactRequest(null)} disabled={openingCase}>Volver</button>
              <button type="button" className="btn btn-primary" onClick={() => openAdoptionCase(contactRequest.requestId)} disabled={openingCase}>
                {openingCase ? 'Abriendo caso...' : 'Abrir caso y contactar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRequest && requestForm && (
        <div className="request-modal-overlay" onClick={() => !savingRequest && setEditingRequest(null)}>
          <div className="request-modal" role="dialog" aria-modal="true" aria-labelledby="edit-request-title" onClick={(e) => e.stopPropagation()}>
            <div className="request-modal-header">
              <div>
                <span>{editingRequest.editMode === 'CONTACT' ? 'Corregir mis datos' : 'Corregir solicitud'}</span>
                <h2 id="edit-request-title">{editingRequest.petName || 'Mascota sin nombre'}</h2>
              </div>
              <button type="button" onClick={() => setEditingRequest(null)} disabled={savingRequest}>x</button>
            </div>
            <form onSubmit={saveRequest}>
              <div className="request-modal-body request-edit-form">
                <p className="request-edit-note">
                  {editingRequest.editMode === 'CONTACT'
                    ? 'Tu caso ya está abierto: aquí solo cambias tu nombre, correo y teléfono. Lo demás escríbelo en el chat del caso.'
                    : `Corrige lo que esté mal. Tu solicitud conserva su fecha y ${editingRequest.petOwnerName || 'quien publicó'} verá que la editaste.`}
                </p>
                <div className="form-group">
                  <label htmlFor="edit-request-name">Nombre</label>
                  <input id="edit-request-name" name="contactName" value={requestForm.contactName} onChange={handleRequestFormChange} disabled={savingRequest} required />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-request-email">Correo</label>
                  <input id="edit-request-email" name="contactEmail" type="email" value={requestForm.contactEmail} onChange={handleRequestFormChange} disabled={savingRequest} required />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-request-phone">Teléfono</label>
                  <input
                    {...ATRIBUTOS_TELEFONO}
                    placeholder="5512345678"
                    id="edit-request-phone"
                    name="contactPhone"
                    value={requestForm.contactPhone}
                    onChange={handleRequestFormChange}
                    disabled={savingRequest}
                  />
                </div>
                {editingRequest.editMode !== 'CONTACT' && (
                  <div className="form-group request-edit-full">
                    <label htmlFor="edit-request-message">Mensaje</label>
                    <textarea
                      id="edit-request-message"
                      name="message"
                      rows="4"
                      maxLength={1000}
                      value={requestForm.message}
                      onChange={handleRequestFormChange}
                      placeholder="Cuenta por qué quieres adoptar y cómo cuidarías al perro"
                      disabled={savingRequest}
                    />
                  </div>
                )}
                {editingRequest.editMode !== 'CONTACT' && (
                  <div className="request-edit-full">
                    <span className="request-edit-label">Respuestas a las preguntas</span>
                    {!editingRequest.answers?.length && (
                      <p className="request-edit-note">
                        Enviaste esta solicitud antes de las preguntas. Puedes contestarlas ahora (opcional);
                        si empiezas, hay que contestarlas todas.
                      </p>
                    )}
                    <AdoptionQuestions
                      questions={questionsForBreed(editingRequest.petBreed)}
                      values={answerValues}
                      onChange={setAnswerValues}
                      disabled={savingRequest}
                      showMissing={showMissingAnswers}
                    />
                  </div>
                )}
              </div>
              <div className="request-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingRequest(null)} disabled={savingRequest}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={savingRequest}>
                  {savingRequest ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingSighting && (
        <div className="request-modal-overlay" onClick={() => !savingSighting && setEditingSighting(null)}>
          <div className="request-modal request-modal-wide" role="dialog" aria-modal="true" aria-labelledby="edit-sighting-title" onClick={(e) => e.stopPropagation()}>
            <div className="request-modal-header">
              <div>
                <span>Aviso sobre</span>
                <h2 id="edit-sighting-title">{editingSighting.sighting.reportName || 'Perro perdido'}</h2>
              </div>
              <button type="button" onClick={() => setEditingSighting(null)} disabled={savingSighting}>x</button>
            </div>
            <div className="request-modal-body">
              <SightingForm
                key={`${editingSighting.sighting.sightingId}-${editingSighting.mode}`}
                mode={editingSighting.mode}
                tipoReporte={editingSighting.sighting.reportType}
                initial={editingSighting.sighting}
                sending={savingSighting}
                onSubmit={saveSighting}
                onCancel={() => setEditingSighting(null)}
                onError={(message) => showToast(message, 'warning')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Solicitudes;
