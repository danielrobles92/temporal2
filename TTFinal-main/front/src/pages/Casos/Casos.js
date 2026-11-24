import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  addCaseMessage,
  blockCaseChat,
  blockCaseCounterpart,
  getCaseDetails,
  getCasesByUser,
  reportCaseChat,
  unblockCaseChat,
  unblockUser,
  updateCaseStatus,
} from '../../services/platformService';
import { caseStatusTag, isCaseClosed } from '../../constants/cardTags';
import { REPORT_REASONS } from '../../constants/chatSafety';
import { formatDate, formatDateTime, timeAgo } from '../../utils/dateFormat';
import './Casos.css';

const typeLabel = {
  ADOPTION: 'Adopción',
  LOST: 'Perro perdido',
};

const sectionLabel = {
  ADOPTION: 'Adopción',
  LOST: 'Perros perdidos',
};

// Varios casos pueden ser del mismo perro (dos personas quieren adoptarlo, o varios
// avisos sobre el mismo reporte). Se agrupan por perro/reporte para distinguir a cada persona.
const groupKey = (item) => {
  if (item.caseType === 'ADOPTION' && item.petId) return `pet-${item.petId}`;
  if (item.caseType === 'LOST' && item.reportId) return `report-${item.reportId}`;
  return `case-${item.caseId}`;
};

const byRequestDate = (a, b) => new Date(a.requestedAt || a.createdAt) - new Date(b.requestedAt || b.createdAt);

// Con quien se lleva el caso, visto desde el usuario actual.
const counterpart = (item, userId) => {
  const iAmOwner = Number(item.ownerId) === Number(userId);
  if (iAmOwner) {
    return {
      name: item.participantName || item.participantEmail || 'Sin nombre',
      role: item.caseType === 'ADOPTION' ? 'Solicitante' : 'Quien avisó',
    };
  }
  return {
    name: item.ownerName || item.ownerEmail || 'Sin nombre',
    role: item.caseType === 'ADOPTION' ? 'Publicador' : 'Dueño del reporte',
  };
};

// Pasos del avance de un caso, con su fecha.
const buildTimeline = (item) => {
  const isAdoption = item.caseType === 'ADOPTION';
  const closed = isCaseClosed(item.status);
  const finalTag = caseStatusTag(item.status, item.caseType);
  return [
    { label: isAdoption ? 'Perro publicado' : 'Reporte publicado', date: item.publishedAt },
    { label: isAdoption ? 'Solicitud enviada' : 'Aviso recibido', date: item.requestedAt },
    { label: 'Caso abierto (contacto)', date: item.createdAt },
    { label: 'Último movimiento', date: item.updatedAt },
    closed
      ? { label: `Finalizado: ${finalTag.label}`, date: item.closedAt || item.updatedAt, tone: finalTag.tone }
      : { label: 'Finalizado', date: null, pendingText: 'En curso' },
  ];
};

// Mensajes que deja el sistema (cierre automatico, chat bloqueado...): no son de nadie.
const isSystemMessage = (item) => item.senderId == null && item.senderName === 'Aviso automatico';

// Id de la otra persona del caso, visto desde el usuario actual.
const counterpartId = (item, userId) => (
  Number(item.ownerId) === Number(userId) ? item.participantId : item.ownerId
);

// Si en el caso no se puede escribir: chat bloqueado o bloqueo entre las dos personas.
const writingBlocked = (item) => Boolean(item?.chatBlocked || item?.blockedByMe || item?.blockedMe);

const REPORT_FORM_INITIAL = { reason: '', details: '', blockUser: false };

const StatusTag = ({ status, caseType }) => {
  const tag = caseStatusTag(status, caseType);
  return <span className={`card-tag card-tag--${tag.tone}`}>{tag.label}</span>;
};

const statusToast = (status, caseType) => {
  if (status === 'ADOPTED') return 'Marcaste el caso como adoptado';
  if (status === 'RESOLVED') return 'Caso marcado como resuelto';
  if (status === 'CANCELLED' && caseType === 'LOST') return 'Marcaste el caso como "No es mi perro"';
  if (status === 'CANCELLED') return 'Caso de adopción cancelado';
  return 'Caso actualizado';
};

const Casos = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [message, setMessage] = useState('');
  const [messageImages, setMessageImages] = useState([]);
  const [messagePreviews, setMessagePreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  // Marcar adoptado cierra los casos de los demas solicitantes: se confirma antes.
  const [confirmAdopt, setConfirmAdopt] = useState(false);
  // Seguridad del chat: { type: 'report' | 'blockChat' | 'blockUser', message? }
  const [safetyDialog, setSafetyDialog] = useState(null);
  const [reportForm, setReportForm] = useState(REPORT_FORM_INITIAL);

  useEffect(() => {
    setConfirmAdopt(false);
    setSafetyDialog(null);
  }, [selectedCase?.caseId]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getCasesByUser(user.id);
      setCases(data || []);
      const query = new URLSearchParams(location.search);
      const caseId = query.get('case');
      if (caseId) {
        const detail = await getCaseDetails(caseId);
        setSelectedCase(detail);
      }
    } catch (err) {
      showToast(err.message || 'No se pudieron cargar los casos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id, location.search]);

  const filteredCases = useMemo(() => {
    if (filter === 'ALL') return cases;
    if (filter === 'OPEN') return cases.filter((item) => !isCaseClosed(item.status));
    if (filter === 'CLOSED') return cases.filter((item) => isCaseClosed(item.status));
    return cases.filter((item) => item.caseType === filter);
  }, [cases, filter]);

  // Secciones por tipo (Adopción / Perros perdidos) y, dentro, un grupo por perro.
  const sections = useMemo(() => ['ADOPTION', 'LOST']
    .map((type) => {
      const groups = new Map();
      filteredCases.filter((item) => item.caseType === type).forEach((item) => {
        const key = groupKey(item);
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            caseType: type,
            petName: item.petName || item.title,
            imageUrl: item.imageUrl,
            location: item.location,
            publishedAt: item.publishedAt,
            ownerId: item.ownerId,
            ownerName: item.ownerName || item.ownerEmail,
            items: [],
          });
        }
        groups.get(key).items.push(item);
      });
      const list = Array.from(groups.values()).map((group) => ({
        ...group,
        items: [...group.items].sort(byRequestDate),
        lastUpdate: group.items.reduce((max, item) => (new Date(item.updatedAt) > new Date(max) ? item.updatedAt : max), group.items[0].updatedAt),
      }));
      list.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
      return { type, groups: list, total: list.reduce((sum, group) => sum + group.items.length, 0) };
    })
    .filter((section) => section.groups.length > 0), [filteredCases]);

  // Los demas casos del mismo perro (para cambiar de solicitante dentro del detalle).
  const siblingCases = useMemo(() => {
    if (!selectedCase) return [];
    const key = groupKey(selectedCase);
    return cases.filter((item) => groupKey(item) === key).sort(byRequestDate);
  }, [cases, selectedCase]);

  const openCase = async (caseId) => {
    try {
      const detail = await getCaseDetails(caseId);
      setSelectedCase(detail);
      setMessage('');
      setMessageImages([]);
      setMessagePreviews([]);
    } catch (err) {
      showToast(err.message || 'No se pudo abrir el caso', 'error');
    }
  };

  const sendMessage = async () => {
    if (!selectedCase || (!message.trim() && messageImages.length === 0)) {
      showToast('Escribe un mensaje o adjunta fotos para el caso', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await addCaseMessage(selectedCase.caseId, user.id, message.trim(), messageImages);
      setSelectedCase(updated);
      setMessage('');
      setMessageImages([]);
      setMessagePreviews([]);
      await load();
      showToast('Mensaje enviado', 'success');
    } catch (err) {
      showToast(err.message || 'No se pudo enviar el mensaje', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessageImagesChange = (event) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/')).slice(0, 4);

    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      showToast('Cada foto debe pesar menos de 5 MB', 'warning');
      event.target.value = '';
      return;
    }

    setMessageImages(files);
    setMessagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  // Vuelve a leer el caso abierto y la lista (despues de bloquear, reportar, etc.).
  const refreshSelected = async (caseId) => {
    const detail = await getCaseDetails(caseId);
    setSelectedCase(detail);
    await load();
  };

  const runSafetyAction = async (action, successMessage) => {
    if (!selectedCase) return;
    setActionLoading(true);
    try {
      await action(selectedCase.caseId);
      setSafetyDialog(null);
      await refreshSelected(selectedCase.caseId);
      showToast(successMessage, 'success');
    } catch (err) {
      showToast(err.message || 'No se pudo completar la acción', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openReport = (reportedMessage = null) => {
    setReportForm(REPORT_FORM_INITIAL);
    setSafetyDialog({ type: 'report', message: reportedMessage });
  };

  const submitReport = async (event) => {
    event.preventDefault();
    if (!selectedCase) return;
    if (!reportForm.reason) {
      showToast('Elige el motivo del reporte', 'warning');
      return;
    }
    if (reportForm.reason === 'OTHER' && !reportForm.details.trim()) {
      showToast('Describe qué pasó para que el administrador pueda revisarlo', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      const result = await reportCaseChat(selectedCase.caseId, {
        reason: reportForm.reason,
        details: reportForm.details.trim(),
        messageId: safetyDialog?.message?.messageId || null,
        blockUser: reportForm.blockUser,
      });
      setSafetyDialog(null);
      await refreshSelected(selectedCase.caseId);
      showToast(
        result?.blocked
          ? 'Reporte enviado al administrador y bloqueaste a esta persona.'
          : 'Reporte enviado. El administrador lo revisará.',
        'success'
      );
    } catch (err) {
      showToast(err.message || 'No se pudo enviar el reporte', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const clearMessageImages = () => {
    setMessageImages([]);
    setMessagePreviews([]);
  };

  const changeStatus = async (status, defaultMessage) => {
    if (!selectedCase) return;
    setActionLoading(true);
    try {
      const updated = await updateCaseStatus(selectedCase.caseId, status, user.id, message.trim() || defaultMessage);
      setSelectedCase(updated);
      setMessage('');
      setConfirmAdopt(false);
      await load();
      showToast(
        status === 'ADOPTED' && otherOpenApplicants > 0
          ? `Marcaste el caso como adoptado. Se cerraron los casos de ${otherOpenApplicants} ${otherOpenApplicants === 1 ? 'solicitante más' : 'solicitantes más'} y se les avisó.`
          : statusToast(status, selectedCase.caseType),
        'success'
      );
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar el caso', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const selectedCounterpart = selectedCase ? counterpart(selectedCase, user?.id) : null;
  const iAmSelectedOwner = selectedCase && Number(selectedCase.ownerId) === Number(user?.id);
  const selectedClosed = selectedCase && isCaseClosed(selectedCase.status);
  const otherOpenApplicants = selectedCase
    ? siblingCases.filter((item) => item.caseId !== selectedCase.caseId && !isCaseClosed(item.status)).length
    : 0;
  const selectedCounterpartId = selectedCase ? counterpartId(selectedCase, user?.id) : null;
  // Reportar y bloquear: solo quienes participan en el caso y si la otra persona tiene cuenta.
  const canUseSafety = Boolean(selectedCase && selectedCounterpartId
    && (iAmSelectedOwner || Number(selectedCase.participantId) === Number(user?.id)));
  const selectedWritingBlocked = writingBlocked(selectedCase);

  return (
    <div className="casos-page">
      <section className="casos-hero">
        <div>
          <span>Seguimiento</span>
          <h1>Casos</h1>
          <p>Centraliza conversaciones de adopción y avisos de perros perdidos.</p>
        </div>
        <div className="casos-filters">
          {[
            ['ALL', 'Todos'],
            ['ADOPTION', 'Adopción'],
            ['LOST', 'Perdidos'],
            ['OPEN', 'Abiertos'],
            ['CLOSED', 'Cerrados'],
          ].map(([value, label]) => (
            <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="loading-container">Cargando casos...</div>
      ) : sections.length === 0 ? (
        <div className="casos-empty">
          <h2>Sin casos para este filtro</h2>
          <p>Cuando contactes por adopción o abras un aviso de perro perdido, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="casos-sections">
          {sections.map((section) => (
            <section key={section.type} className="casos-section">
              <h2 className="casos-section-title">
                {sectionLabel[section.type] || section.type}
                <span className="casos-section-count">{section.total}</span>
              </h2>
              <div className="casos-grid">
                {section.groups.map((group) => {
                  const iAmOwner = Number(group.ownerId) === Number(user?.id);
                  const peopleLabel = section.type === 'ADOPTION'
                    ? `${group.items.length} ${group.items.length === 1 ? 'solicitante' : 'solicitantes'}`
                    : `${group.items.length} ${group.items.length === 1 ? 'aviso' : 'avisos'}`;
                  return (
                    <article key={group.key} className="caso-card">
                      <div className="caso-card-media">
                        {group.imageUrl ? (
                          <img src={group.imageUrl} alt={group.petName || 'Perro'} />
                        ) : (
                          <div className="caso-card-placeholder" aria-hidden="true">🐕</div>
                        )}
                        <span className={`caso-card-type ${section.type === 'ADOPTION' ? 'adoption' : 'lost'}`}>
                          {typeLabel[section.type]}
                        </span>
                      </div>
                      <div className="caso-card-body">
                        <h3>{group.petName || 'Perro'}</h3>
                        <p className="caso-card-owner">
                          {iAmOwner ? 'Tu publicación' : `Publicado por ${group.ownerName || 'No registrado'}`}
                          {group.location ? ` · ${group.location}` : ''}
                        </p>
                        <div className="card-tags">
                          <span className="card-tag">{peopleLabel}</span>
                          {group.publishedAt && (
                            <span className="card-tag card-tag--time" title={formatDateTime(group.publishedAt)}>
                              Publicado {timeAgo(group.publishedAt)}
                            </span>
                          )}
                        </div>

                        <ul className="caso-people">
                          {group.items.map((item) => {
                            const person = counterpart(item, user?.id);
                            return (
                              <li key={item.caseId}>
                                <button type="button" className="caso-person" onClick={() => openCase(item.caseId)}>
                                  <span className="caso-person-avatar" aria-hidden="true">
                                    {String(person.name).charAt(0).toUpperCase()}
                                  </span>
                                  <span className="caso-person-main">
                                    <span className="caso-person-role">{person.role}</span>
                                    <strong>{person.name}</strong>
                                    <small>
                                      {section.type === 'ADOPTION' ? 'Solicitó' : 'Avisó'} {formatDate(item.requestedAt || item.createdAt)}
                                      {' · '}movimiento {timeAgo(item.updatedAt)}
                                    </small>
                                    <em>{item.lastMessage || 'Sin mensajes todavía.'}</em>
                                  </span>
                                  <span className="caso-person-tags">
                                    <StatusTag status={item.status} caseType={item.caseType} />
                                    {writingBlocked(item) && <span className="card-tag card-tag--rejected">Bloqueado</span>}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectedCase && (
        <div className="caso-modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="caso-modal" onClick={(event) => event.stopPropagation()}>
            <div className="caso-modal-header">
              <div>
                <span>{typeLabel[selectedCase.caseType] || selectedCase.caseType}</span>
                <h2>{selectedCase.title}</h2>
                <p className="caso-modal-sub">
                  {selectedCounterpart.role}: <strong>{selectedCounterpart.name}</strong>
                  {' '}<StatusTag status={selectedCase.status} caseType={selectedCase.caseType} />
                </p>
              </div>
              <button type="button" onClick={() => setSelectedCase(null)} aria-label="Cerrar">x</button>
            </div>

            <div className="caso-modal-body">
              <aside className="caso-detail-panel">
                {selectedCase.imageUrl && <img src={selectedCase.imageUrl} alt={selectedCase.petName || selectedCase.title} />}

                <section className="caso-timeline" aria-label="Avance del caso">
                  <h3>Avance</h3>
                  <ol>
                    {buildTimeline(selectedCase).map((step) => (
                      <li key={step.label} className={step.date ? `done ${step.tone || ''}` : 'pending'}>
                        <span>{step.label}</span>
                        <strong>{step.date ? formatDateTime(step.date) : (step.pendingText || 'Sin fecha')}</strong>
                      </li>
                    ))}
                  </ol>
                </section>

                <div><span>Perro</span><strong>{selectedCase.petName || 'No registrado'}</strong></div>
                <div><span>Ubicación</span><strong>{selectedCase.location || 'No registrada'}</strong></div>
                <div><span>Publicador</span><strong>{selectedCase.ownerName || selectedCase.ownerEmail || 'No registrado'}</strong></div>
                <div>
                  <span>{selectedCase.caseType === 'ADOPTION' ? 'Solicitante' : 'Quien avisó'}</span>
                  <strong>{selectedCase.participantName || 'No registrado'}</strong>
                  {selectedCase.participantEmail && <small>{selectedCase.participantEmail}</small>}
                  {selectedCase.participantPhone && <small>{selectedCase.participantPhone}</small>}
                </div>

                {canUseSafety && (
                  <section className="caso-safety" aria-label="Seguridad del chat">
                    <h3>Seguridad del chat</h3>
                    <p>
                      Si {selectedCounterpart.name} te insulta, te pide dinero o el perro no existe,
                      repórtalo al administrador o bloquéalo.
                    </p>
                    <button type="button" className="caso-safety-btn report" onClick={() => openReport()} disabled={actionLoading}>
                      Reportar al administrador
                    </button>
                    {selectedCase.chatBlocked ? (
                      selectedCase.chatBlockedByMe && (
                        <button type="button" className="caso-safety-btn" onClick={() => runSafetyAction(unblockCaseChat, 'Chat desbloqueado')} disabled={actionLoading}>
                          Desbloquear chat
                        </button>
                      )
                    ) : (
                      <button type="button" className="caso-safety-btn" onClick={() => setSafetyDialog({ type: 'blockChat' })} disabled={actionLoading}>
                        Bloquear chat
                      </button>
                    )}
                    {selectedCase.blockedByMe ? (
                      <button type="button" className="caso-safety-btn" onClick={() => runSafetyAction(() => unblockUser(selectedCounterpartId), `Desbloqueaste a ${selectedCounterpart.name}`)} disabled={actionLoading}>
                        Desbloquear a {selectedCounterpart.name}
                      </button>
                    ) : (
                      <button type="button" className="caso-safety-btn danger" onClick={() => setSafetyDialog({ type: 'blockUser' })} disabled={actionLoading}>
                        Bloquear a {selectedCounterpart.name}
                      </button>
                    )}
                  </section>
                )}
              </aside>

              <section className="caso-thread">
                {iAmSelectedOwner && siblingCases.length > 1 && (
                  <div className="caso-switcher">
                    <span>
                      {selectedCase.caseType === 'ADOPTION'
                        ? `Solicitantes de ${selectedCase.petName || 'este perro'} (${siblingCases.length})`
                        : `Avisos sobre ${selectedCase.petName || 'este reporte'} (${siblingCases.length})`}
                    </span>
                    <div className="caso-switcher-list">
                      {siblingCases.map((item) => (
                        <button
                          key={item.caseId}
                          type="button"
                          className={item.caseId === selectedCase.caseId ? 'active' : ''}
                          onClick={() => item.caseId !== selectedCase.caseId && openCase(item.caseId)}
                          disabled={actionLoading}
                        >
                          <strong>{item.participantName || item.participantEmail || 'Sin nombre'}</strong>
                          <small>{formatDate(item.requestedAt || item.createdAt)}</small>
                          <StatusTag status={item.status} caseType={item.caseType} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="caso-messages">
                  {(selectedCase.messages || []).length === 0 ? (
                    <p className="caso-message-empty">Sin mensajes todavía.</p>
                  ) : (
                    selectedCase.messages.map((item) => (
                      <div
                        key={item.messageId}
                        className={`caso-message ${item.senderId === user.id ? 'mine' : ''} ${isSystemMessage(item) ? 'system' : ''}`}
                      >
                        <div className="caso-message-head">
                          <strong>{item.senderName || 'Contacto'}</strong>
                          {canUseSafety && item.senderId != null && Number(item.senderId) === Number(selectedCounterpartId) && (
                            <button
                              type="button"
                              className="caso-message-report"
                              onClick={() => openReport(item)}
                              disabled={actionLoading}
                              title="Reportar este mensaje al administrador"
                            >
                              Reportar
                            </button>
                          )}
                        </div>
                        <p>{item.message}</p>
                        {item.imageUrls?.length > 0 && (
                          <div className="caso-message-images">
                            {item.imageUrls.map((url, index) => (
                              <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer">
                                <img src={url} alt={`Adjunto ${index + 1}`} />
                              </a>
                            ))}
                          </div>
                        )}
                        <span>{formatDateTime(item.createdAt)}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="caso-compose">
                  {selectedWritingBlocked && (
                    <div className="caso-blocked-banner" role="status">
                      {selectedCase.chatBlocked ? (
                        selectedCase.chatBlockedByMe ? (
                          <>
                            <p><strong>Bloqueaste este chat.</strong> Ninguno de los dos puede enviar mensajes aquí.</p>
                            <button type="button" className="btn btn-secondary" onClick={() => runSafetyAction(unblockCaseChat, 'Chat desbloqueado')} disabled={actionLoading}>
                              Desbloquear chat
                            </button>
                          </>
                        ) : (
                          <p>
                            <strong>Este chat está bloqueado.</strong> Ya no se pueden enviar mensajes.
                            {canUseSafety && ' Si hubo mal uso, puedes reportarlo al administrador.'}
                          </p>
                        )
                      ) : selectedCase.blockedByMe ? (
                        <>
                          <p>
                            <strong>Bloqueaste a {selectedCounterpart.name}.</strong> No pueden enviarse mensajes,
                            solicitudes ni avisos. También puedes desbloquearlo desde tu perfil.
                          </p>
                          <button type="button" className="btn btn-secondary" onClick={() => runSafetyAction(() => unblockUser(selectedCounterpartId), `Desbloqueaste a ${selectedCounterpart.name}`)} disabled={actionLoading}>
                            Desbloquear
                          </button>
                        </>
                      ) : (
                        <p><strong>{selectedCounterpart.name} ya no acepta mensajes tuyos.</strong></p>
                      )}
                    </div>
                  )}
                  {!selectedWritingBlocked && (
                  <>
                  <textarea
                    rows="4"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Escribe actualización, punto de encuentro, dudas o cierre del caso"
                    disabled={actionLoading}
                  />
                  <div className="caso-attachment-row">
                    <label className="caso-attachment-picker">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMessageImagesChange}
                        disabled={actionLoading}
                      />
                      Adjuntar fotos
                    </label>
                    {messageImages.length > 0 && (
                      <button type="button" className="caso-clear-attachments" onClick={clearMessageImages} disabled={actionLoading}>
                        Quitar fotos
                      </button>
                    )}
                  </div>
                  {messagePreviews.length > 0 && (
                    <div className="caso-attachment-previews">
                      {messagePreviews.map((url, index) => (
                        <img key={`${url}-${index}`} src={url} alt={`Foto por enviar ${index + 1}`} />
                      ))}
                    </div>
                  )}
                  </>
                  )}
                  {confirmAdopt && (
                    <div className="caso-confirm" role="alert">
                      <p>
                        <strong>{selectedCounterpart.name}</strong> quedará como adoptante de {selectedCase.petName || 'este perro'}
                        {' '}y la publicación pasará a "Adoptado".{' '}
                        {otherOpenApplicants > 0
                          ? `Se cerrarán automáticamente los casos de ${otherOpenApplicants} ${otherOpenApplicants === 1 ? 'solicitante más' : 'solicitantes más'} y las solicitudes pendientes; a todos se les avisará.`
                          : 'Si otras personas tienen solicitudes pendientes, se cerrarán y se les avisará.'}
                      </p>
                      <div>
                        <button type="button" className="btn btn-secondary" onClick={() => setConfirmAdopt(false)} disabled={actionLoading}>Volver</button>
                        <button type="button" className="btn btn-success" onClick={() => changeStatus('ADOPTED', 'Adopción completada.')} disabled={actionLoading}>
                          {actionLoading ? 'Guardando...' : 'Sí, marcar adoptado'}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="caso-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setSelectedCase(null)} disabled={actionLoading}>Cerrar</button>
                    {!selectedWritingBlocked && (
                      <button type="button" className="btn btn-primary" onClick={sendMessage} disabled={actionLoading}>Enviar mensaje</button>
                    )}
                    {!selectedClosed && !confirmAdopt && selectedCase.caseType === 'ADOPTION' && iAmSelectedOwner && (
                      <>
                        <button type="button" className="btn btn-success" onClick={() => setConfirmAdopt(true)} disabled={actionLoading}>Marcar adoptado</button>
                        <button type="button" className="btn btn-danger" onClick={() => changeStatus('CANCELLED', 'Caso de adopción cancelado.')} disabled={actionLoading}>Cancelar caso</button>
                      </>
                    )}
                    {!selectedClosed && selectedCase.caseType === 'LOST' && iAmSelectedOwner && (
                      <>
                        <button type="button" className="btn btn-success" onClick={() => changeStatus('RESOLVED', 'Caso resuelto.')} disabled={actionLoading}>Caso resuelto</button>
                        <button type="button" className="btn btn-danger" onClick={() => changeStatus('CANCELLED', 'No era mi perro.')} disabled={actionLoading}>No es mi perro</button>
                      </>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {safetyDialog && (
              <div className="caso-safety-overlay" onClick={() => !actionLoading && setSafetyDialog(null)}>
                <div className="caso-safety-dialog" role="dialog" aria-modal="true" aria-labelledby="caso-safety-title" onClick={(event) => event.stopPropagation()}>
                  {safetyDialog.type === 'report' && (
                    <form onSubmit={submitReport}>
                      <h3 id="caso-safety-title">Reportar a {selectedCounterpart.name}</h3>
                      <p className="caso-safety-lead">
                        El administrador revisará la conversación. No le avisaremos a {selectedCounterpart.name} que lo reportaste.
                      </p>
                      {safetyDialog.message && (
                        <blockquote className="caso-safety-quote">
                          <small>Mensaje reportado · {formatDateTime(safetyDialog.message.createdAt)}</small>
                          {safetyDialog.message.message}
                        </blockquote>
                      )}
                      <fieldset className="caso-safety-reasons">
                        <legend>¿Qué pasó?</legend>
                        {REPORT_REASONS.map((reason) => (
                          <label key={reason.value} className={reportForm.reason === reason.value ? 'active' : ''}>
                            <input
                              type="radio"
                              name="report-reason"
                              value={reason.value}
                              checked={reportForm.reason === reason.value}
                              onChange={() => setReportForm((current) => ({ ...current, reason: reason.value }))}
                              disabled={actionLoading}
                            />
                            <span>
                              <strong>{reason.label}</strong>
                              <small>{reason.hint}</small>
                            </span>
                          </label>
                        ))}
                      </fieldset>
                      <label className="caso-safety-field" htmlFor="report-details">
                        Detalles {reportForm.reason === 'OTHER' ? '(obligatorio)' : '(opcional)'}
                      </label>
                      <textarea
                        id="report-details"
                        rows="3"
                        maxLength={1000}
                        value={reportForm.details}
                        onChange={(event) => setReportForm((current) => ({ ...current, details: event.target.value }))}
                        placeholder="Ej. Me pidió $2,000 para regresarme al perro y no quiso mandar una foto actual."
                        disabled={actionLoading}
                      />
                      <label className="caso-safety-check">
                        <input
                          type="checkbox"
                          checked={reportForm.blockUser || Boolean(selectedCase.blockedByMe)}
                          onChange={(event) => setReportForm((current) => ({ ...current, blockUser: event.target.checked }))}
                          disabled={actionLoading || Boolean(selectedCase.blockedByMe)}
                        />
                        {selectedCase.blockedByMe
                          ? `Ya bloqueaste a ${selectedCounterpart.name}`
                          : `Bloquear también a ${selectedCounterpart.name}`}
                      </label>
                      <div className="caso-safety-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setSafetyDialog(null)} disabled={actionLoading}>Cancelar</button>
                        <button type="submit" className="btn btn-danger" disabled={actionLoading}>
                          {actionLoading ? 'Enviando...' : 'Enviar reporte'}
                        </button>
                      </div>
                    </form>
                  )}

                  {safetyDialog.type === 'blockChat' && (
                    <>
                      <h3 id="caso-safety-title">¿Bloquear este chat?</h3>
                      <p className="caso-safety-lead">
                        Ni tú ni {selectedCounterpart.name} podrán enviar mensajes en este caso hasta que lo desbloquees.
                        Tus otros casos con esta persona no cambian.
                      </p>
                      <div className="caso-safety-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setSafetyDialog(null)} disabled={actionLoading}>Cancelar</button>
                        <button type="button" className="btn btn-danger" onClick={() => runSafetyAction(blockCaseChat, 'Chat bloqueado')} disabled={actionLoading}>
                          {actionLoading ? 'Bloqueando...' : 'Sí, bloquear chat'}
                        </button>
                      </div>
                    </>
                  )}

                  {safetyDialog.type === 'blockUser' && (
                    <>
                      <h3 id="caso-safety-title">¿Bloquear a {selectedCounterpart.name}?</h3>
                      <p className="caso-safety-lead">
                        No podrán enviarse mensajes en ningún caso, ni solicitudes de adopción o avisos de perros perdidos.
                        Puedes ver y desbloquear a las personas bloqueadas desde tu perfil.
                      </p>
                      <p className="caso-safety-note">
                        Si te insultó o te pidió dinero, también repórtalo para que el administrador pueda actuar.
                      </p>
                      <div className="caso-safety-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setSafetyDialog(null)} disabled={actionLoading}>Cancelar</button>
                        <button type="button" className="btn btn-danger" onClick={() => runSafetyAction(blockCaseCounterpart, `Bloqueaste a ${selectedCounterpart.name}`)} disabled={actionLoading}>
                          {actionLoading ? 'Bloqueando...' : 'Sí, bloquear'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Casos;
