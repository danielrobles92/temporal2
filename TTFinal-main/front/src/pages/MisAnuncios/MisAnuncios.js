import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DOG_BREEDS, DOG_BREED_OPTIONS, DOG_COLORS, DOG_SIZES, MEXICO_CITY_LOCATIONS, sizeLabel } from '../../constants/dogOptions';
import ReportMatches from '../../components/ReportMatches/ReportMatches';
import MapPicker from '../../components/MapPicker/MapPicker';
import { petStatusTag, reportStatusTag, reportTypeTag, sightingStatusTag } from '../../constants/cardTags';
import { elapsedLabel, formatDateTime, timeAgo } from '../../utils/dateFormat';
import { ATRIBUTOS_EDAD, ETIQUETA_EDAD, formatearEdad } from '../../utils/edad';
import {
  getAllPets,
  deletePet,
  mapBackendToFrontend,
  mapFrontendToBackendUpdate,
  updatePet,
} from '../../services/petsService';
import {
  deactivatePet,
  createSightingCase,
  deleteReport,
  getAllReportSightings,
  getReports,
  getPetsByOwner,
  getReportSightingsByOwner,
  getReportsByUser,
  deactivateReport,
  replyReportSighting,
  updateReport,
  updateReportSightingCase,
} from '../../services/platformService';
import { guideToFirstError, missingText } from '../../utils/formGuide';
import './MisAnuncios.css';

// Datos obligatorios al editar (se marcan en rojo y la pantalla lleva al primero).
const reportMissing = (f) => {
  const m = {};
  if (!f.name?.trim()) m.name = 'Escribe el nombre';
  if (!f.breed) m.breed = 'Selecciona la raza';
  if (!f.color) m.color = 'Selecciona el color';
  if (!f.alcaldia) m.alcaldia = 'Selecciona la alcaldía';
  return m;
};
const petMissing = (f) => {
  const m = {};
  if (!f.nombre?.trim()) m.nombre = 'Escribe el nombre';
  if (!f.raza) m.raza = 'Selecciona la raza';
  if (!f.color) m.color = 'Selecciona el color';
  if (!f.ubicacion) m.ubicacion = 'Selecciona la ubicación';
  return m;
};
// Una vez marcados, los errores se quitan solos cuando se corrige el dato.
const stillMissing = (flagged, now) => Object.fromEntries(Object.keys(flagged).filter((k) => now[k]).map((k) => [k, now[k]]));
const FieldError = ({ msg }) => (msg ? <span className="error-message" role="alert">{msg}</span> : null);

const reportTypeLabel = {
  LOST: 'Perdido',
  FOUND: 'Encontrado',
};

// La ubicacion se guarda como "Alcaldia - referencia"; aqui se separa y se vuelve a unir.
const splitLocation = (value) => {
  const text = String(value || '');
  const label = MEXICO_CITY_LOCATIONS.find((location) => text.toLowerCase().startsWith(location.label.toLowerCase()))?.label;
  if (!label) return { alcaldia: text, detalle: '' };
  return { alcaldia: label, detalle: text.slice(label.length).replace(/^\s*-\s*/, '') };
};
const joinLocation = (alcaldia, detalle) => (detalle?.trim() ? `${alcaldia} - ${detalle.trim()}` : alcaldia);

const reportSexLabel = { MALE: 'Macho', FEMALE: 'Hembra' };

const petStatusLabel = {
  AVAILABLE: 'Disponible',
  ADOPTED: 'Adoptado',
  LOST: 'Perdido',
  INACTIVE: 'Inactivo',
};

const Tag = ({ tag }) => <span className={`card-tag card-tag--${tag.tone}`}>{tag.label}</span>;

const mapLink = (lat, lng) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

// Etiqueta con el tiempo que lleva la publicacion ("3 días", "5 horas"); la fecha exacta va abajo.
const AgeTag = ({ date, prefix = 'Publicado hace' }) => {
  const label = elapsedLabel(date);
  if (!label) return null;
  return (
    <span className="card-tag card-tag--time" title={formatDateTime(date)}>
      ⏱ {prefix} {label}
    </span>
  );
};

const MisAnuncios = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [pets, setPets] = useState([]);
  const [reports, setReports] = useState([]);
  const [sightings, setSightings] = useState([]);
  const [activeTab, setActiveTab] = useState('todos');
  const [selectedSighting, setSelectedSighting] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  // Foto principal elegida en el detalle del reporte ('' = la primera).
  const [selectedReportImage, setSelectedReportImage] = useState('');
  const [reportToDelete, setReportToDelete] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [reportErrors, setReportErrors] = useState({});
  const [petErrors, setPetErrors] = useState({});
  const [reportEditForm, setReportEditForm] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedPetImage, setSelectedPetImage] = useState('');
  const [petToDelete, setPetToDelete] = useState(null);
  const [editingPet, setEditingPet] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = user?.isAdmin || user?.role === 'ADMIN';
  const canEditPet = (pet) => isAdmin || Number(pet?.ownerId) === Number(user?.id);
  // Quien puede publicar en adopcion: admin, refugio o usuario con autorizacion vigente.
  const canPublish = isAdmin || user?.role === 'SHELTER' || user?.publishingAuthorized;

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tab = query.get('tab');
    setActiveTab(['anuncios', 'reportes', 'avisos'].includes(tab) ? tab : 'todos');
  }, [location.search]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      if (isAdmin) {
        const [petsData, reportsData, sightingData] = await Promise.all([
          getAllPets(9999),
          getReports(),
          getAllReportSightings().catch(() => []),
        ]);
        const petContent = Array.isArray(petsData) ? petsData : (petsData.content || []);
        setPets(petContent.map(mapBackendToFrontend));
        setReports(reportsData || []);
        setSightings(sightingData || []);
        return;
      }

      const [petsData, reportsData] = await Promise.all([
        getPetsByOwner(user.id),
        getReportsByUser(user.id),
      ]);
      setPets((petsData || []).map(mapBackendToFrontend));
      setReports(reportsData || []);
      const sightingData = await getReportSightingsByOwner(user.id).catch(() => []);
      setSightings(sightingData || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus anuncios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id, isAdmin]);

  const removePet = async () => {
    if (!petToDelete) return;
    setActionLoading(true);
    try {
      await deletePet(petToDelete.id);
      showToast('Publicacion eliminada', 'success');
      setPetToDelete(null);
      setSelectedPet(null);
      await load();
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar la publicacion', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const disablePet = async (petId) => {
    setActionLoading(true);
    try {
      await deactivatePet(petId);
      showToast('Publicacion desactivada', 'success');
      await load();
    } catch (err) {
      showToast(err.message || 'No se pudo desactivar la publicacion', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openSighting = (sighting) => {
    setSelectedSighting(sighting);
    setReplyText(sighting.ownerReply || '');
  };

  const openReportEditor = (report) => {
    const { alcaldia, detalle } = splitLocation(report.location);
    setEditingReport(report);
    setReportEditForm({
      alcaldia,
      detalleUbicacion: detalle,
      name: report.name || '',
      breed: report.breed || '',
      sex: report.sex || '',
      color: report.color || '',
      age: report.age || '',
      location: report.location || '',
      description: report.description || '',
      contactPhone: report.contactPhone || user?.phone || '',
      latitude: report.latitude ?? '',
      longitude: report.longitude ?? '',
      imageFiles: [],
      imagePreviews: report.imageUrls?.length ? report.imageUrls : (report.imageUrl ? [report.imageUrl] : []),
    });
  };

  const handleReportImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));
    if (!selectedFiles.length) return;
    if (selectedFiles.length > 4) {
      showToast('Selecciona maximo 4 fotos', 'warning');
    }
    const files = selectedFiles.slice(0, 4);
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      showToast('Cada foto debe pesar menos de 5 MB', 'warning');
      event.target.value = '';
      return;
    }
    setReportEditForm({
      ...reportEditForm,
      imageFiles: files,
      imagePreviews: files.map((file) => URL.createObjectURL(file)),
    });
  };

  // Punto del mapa en el reporte: con direccion conocida actualiza tambien el texto de ubicacion.
  const handleReportMapChange = ({ latitude, longitude, address, detail, alcaldia }) => {
    setReportEditForm((current) => ({
      ...current,
      latitude,
      longitude,
      ...(address ? { detalleUbicacion: alcaldia ? detail || address : address } : {}),
      ...(alcaldia ? { alcaldia } : {}),
    }));
  };

  const updateReportAlcaldia = (value) => {
    const selected = MEXICO_CITY_LOCATIONS.find((location) => location.label === value);
    setReportEditForm((current) => ({
      ...current,
      alcaldia: value,
      ...(selected ? { latitude: selected.lat, longitude: selected.lng } : {}),
    }));
  };

  useEffect(() => {
    setReportErrors((flagged) => (Object.keys(flagged).length && reportEditForm ? stillMissing(flagged, reportMissing(reportEditForm)) : flagged));
  }, [reportEditForm]);

  useEffect(() => {
    setPetErrors((flagged) => (Object.keys(flagged).length && editForm ? stillMissing(flagged, petMissing(editForm)) : flagged));
  }, [editForm]);

  const saveReportEdit = async () => {
    if (!editingReport || !reportEditForm) return;
    const missing = reportMissing(reportEditForm);
    setReportErrors(missing);
    const n = guideToFirstError(missing, { order: ['name', 'breed', 'color', 'alcaldia'] });
    if (n) {
      showToast(`${missingText(n)} por completar. Te llevamos al primero; están marcados en rojo.`, 'error');
      return;
    }
    setActionLoading(true);
    try {
      const { alcaldia, detalleUbicacion, ...reportData } = reportEditForm;
      await updateReport(editingReport.reportId, {
        ...editingReport,
        ...reportData,
        location: joinLocation(alcaldia, detalleUbicacion),
        species: 'DOG',
        sex: reportEditForm.sex || null,
        age: reportEditForm.age === '' ? null : Number(reportEditForm.age),
        latitude: reportEditForm.latitude === '' ? null : Number(reportEditForm.latitude),
        longitude: reportEditForm.longitude === '' ? null : Number(reportEditForm.longitude),
        type: editingReport.type || 'LOST',
        status: editingReport.status || 'OPEN',
        imageUrl: editingReport.imageUrl || '',
      });
      showToast('Reporte actualizado', 'success');
      setEditingReport(null);
      setReportEditForm(null);
      await load();
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar el reporte', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const disableReport = async (reportId) => {
    setActionLoading(true);
    try {
      await deactivateReport(reportId);
      showToast('Reporte desactivado', 'success');
      await load();
    } catch (err) {
      showToast(err.message || 'No se pudo desactivar el reporte', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const removeReport = async () => {
    if (!reportToDelete) return;
    setActionLoading(true);
    try {
      await deleteReport(reportToDelete.reportId);
      showToast('Reporte eliminado', 'success');
      setReportToDelete(null);
      setSelectedReport(null);
      await load();
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar el reporte', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openPetEditor = (pet) => {
    const ageValue = pet.edadNumero ?? pet.age ?? (String(pet.edad || '').match(/\d+/)?.[0] || '');
    const locationMatch = MEXICO_CITY_LOCATIONS.find((location) =>
      String(pet.ubicacion || '').toLowerCase().startsWith(location.label.toLowerCase())
    );

    const { detalle } = splitLocation(pet.ubicacion);

    setEditingPet(pet);
    setEditForm({
      nombre: pet.nombre || '',
      raza: pet.raza || '',
      color: pet.color || '',
      tamano: pet.tamano || '',
      age: ageValue,
      descripcion: pet.descripcion || '',
      ubicacion: locationMatch?.label || pet.ubicacion || '',
      detalleUbicacion: detalle,
      latitude: pet.latitude ?? locationMatch?.lat ?? null,
      longitude: pet.longitude ?? locationMatch?.lng ?? null,
      estadoBackend: pet.estadoBackend || 'AVAILABLE',
      imageFiles: [],
      imagePreviews: pet.imagenes?.length ? pet.imagenes : (pet.imagen ? [pet.imagen] : []),
      activeImagePreview: pet.imagenes?.[0] || pet.imagen || '',
    });
  };

  const openPetDetail = (pet) => {
    setSelectedPet(pet);
    setSelectedPetImage(pet.imagenes?.[0] || pet.imagen || '');
  };

  const updatePetLocation = (value) => {
    const selectedLocation = MEXICO_CITY_LOCATIONS.find((location) => location.label === value);
    setEditForm({
      ...editForm,
      ubicacion: value,
      latitude: selectedLocation?.lat ?? null,
      longitude: selectedLocation?.lng ?? null,
    });
  };

  const handlePetMapChange = ({ latitude, longitude, address, detail, alcaldia }) => {
    setEditForm((current) => ({
      ...current,
      latitude,
      longitude,
      ...(address ? { detalleUbicacion: alcaldia ? detail || address : address } : {}),
      ...(alcaldia ? { ubicacion: alcaldia } : {}),
    }));
  };

  const handleEditImagesChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));

    if (selectedFiles.length > 4) {
      showToast('Selecciona maximo 4 fotos', 'warning');
    }

    const files = selectedFiles.slice(0, 4);
    const oversized = files.find((file) => file.size > 5 * 1024 * 1024);

    if (oversized) {
      showToast('Cada foto debe pesar menos de 5 MB', 'warning');
      event.target.value = '';
      return;
    }

    const previews = files.map((file) => URL.createObjectURL(file));

    setEditForm({
      ...editForm,
      imageFiles: files,
      imagePreviews: previews,
      activeImagePreview: previews[0] || editForm.activeImagePreview,
    });
  };

  const savePetEdit = async () => {
    if (!editingPet || !editForm) return;
    const missing = petMissing(editForm);
    setPetErrors(missing);
    const n = guideToFirstError(missing, { order: ['nombre', 'raza', 'color', 'ubicacion'] });
    if (n) {
      showToast(`${missingText(n)} por completar. Te llevamos al primero; están marcados en rojo.`, 'error');
      return;
    }
    setActionLoading(true);
    try {
      await updatePet(editingPet.id, mapFrontendToBackendUpdate({
        ...editingPet,
        ...editForm,
        // Sin `estado`, el mapeo usa el estado elegido en el selector (estadoBackend).
        estado: undefined,
        ubicacion: joinLocation(editForm.ubicacion, editForm.detalleUbicacion),
      }));
      showToast('Publicacion actualizada', 'success');
      setEditingPet(null);
      setEditForm(null);
      await load();
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar la publicacion', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const replySighting = async (status = 'REPLIED') => {
    if (!selectedSighting || !replyText.trim()) {
      showToast('Escribe una respuesta para quien envio el aviso', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await replyReportSighting(selectedSighting.sightingId, replyText.trim(), status);
      showToast(status === 'CASE_OPENED' ? 'Caso abierto y respuesta enviada' : 'Respuesta enviada', 'success');
      setSelectedSighting(updated);
      await load();
    } catch (err) {
      showToast(err.message || 'No se pudo responder el aviso', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const updateCase = async (status) => {
    if (!selectedSighting) return;
    setActionLoading(true);
    try {
      const updated = status === 'CASE_OPENED'
        ? await createSightingCase(selectedSighting.sightingId)
        : await updateReportSightingCase(selectedSighting.sightingId, status, replyText.trim());
      showToast(
        status === 'CASE_OPENED'
          ? 'Caso abierto'
          : `Marcaste el aviso de ${selectedSighting.contactName || 'esta persona'} como "No es mi perro". Lo verás con la etiqueta roja en Avisos recibidos.`,
        'success'
      );
      if (status === 'DISMISSED') {
        setSelectedSighting(null);
        setReplyText('');
      } else if (status === 'CASE_OPENED') {
        setSelectedSighting(null);
        setReplyText('');
        navigate(`/casos?case=${updated.caseId}`);
      } else {
        setSelectedSighting(updated);
      }
      await load();
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar el caso', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const showSection = (section) => activeTab === 'todos' || activeTab === section;

  return (
    <div className="mis-anuncios-page">
      <div className="page-header">
        <h1>Mis anuncios</h1>
        <p>{isAdmin ? 'Vista admin: gestiona todas las publicaciones, reportes y avisos' : 'Gestiona publicaciones de adopcion y reportes registrados'}</p>
      </div>

      <div className="mis-anuncios-tabs" aria-label="Filtros de anuncios">
        {[
          ['todos', 'Todos'],
          ['anuncios', 'Publicaciones de adopcion'],
          ['reportes', 'Reportes de extravio'],
          ['avisos', `Avisos recibidos${sightings.length ? ` (${sightings.length})` : ''}`],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={activeTab === value ? 'active' : ''}
            onClick={() => {
              setActiveTab(value);
              navigate(value === 'todos' ? '/mis-anuncios' : `/mis-anuncios?tab=${value}`, { replace: true });
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container">Cargando anuncios...</div>
      ) : error ? (
        <div className="error-alert">{error}</div>
      ) : (
        <>
          {showSection('anuncios') && <section className="anuncios-section">
            <div className="section-title-row">
              <h2>Publicaciones de adopcion</h2>
              {!canPublish && (
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/perfil')}
                  title="Necesitas autorizacion del administrador para publicar en adopcion"
                >
                  Solicitar autorizacion para publicar
                </button>
              )}
            </div>
            <div className="anuncios-list">
              {pets.length === 0 ? (
                <p className="empty-state">No tienes publicaciones de adopcion.</p>
              ) : (
                pets.map((pet) => (
                  <article key={pet.id} className="anuncio-card" onClick={() => openPetDetail(pet)}>
                    {pet.imagen && (
                      <img className="anuncio-image" src={pet.imagen} alt={pet.nombre || 'Perro'} />
                    )}
                    <div className="anuncio-card-content">
                      <div className="card-tags anuncio-tags">
                        <Tag tag={petStatusTag(pet.estadoBackend)} />
                        <AgeTag date={pet.createdAt} />
                      </div>
                      <strong>{pet.nombre}</strong>
                      <p>{pet.raza || pet.tipo} - {pet.ubicacion}</p>
                      {isAdmin && pet.ownerName && <span>Publicado por {pet.ownerName}</span>}
                      <small className="anuncio-date">Publicado el {formatDateTime(pet.createdAt)}</small>
                    </div>
                    <div className="actions-row" onClick={(event) => event.stopPropagation()}>
                      {canEditPet(pet) && (
                        <>
                          <button className="btn btn-secondary" onClick={() => openPetEditor(pet)}>Editar</button>
                          {pet.estadoBackend !== 'INACTIVE' && (
                            <button className="btn btn-secondary" onClick={() => disablePet(pet.id)} disabled={actionLoading}>Desactivar</button>
                          )}
                          <button className="btn btn-danger" onClick={() => setPetToDelete(pet)}>Eliminar</button>
                        </>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>}

          {showSection('reportes') && <section className="anuncios-section">
            <h2>Reportes de extravio</h2>
            <div className="anuncios-list">
              {reports.length === 0 ? (
                <p className="empty-state">No tienes reportes registrados.</p>
              ) : (
                reports.map((report) => (
                  <article key={report.reportId} className="anuncio-card" onClick={() => { setSelectedReport(report); setSelectedReportImage(''); }}>
                    {report.imageUrl && (
                      <img className="anuncio-image" src={report.imageUrl} alt={report.name || 'Reporte'} />
                    )}
                    <div className="anuncio-card-content">
                      <div className="card-tags anuncio-tags">
                        <Tag tag={reportTypeTag(report.type)} />
                        <Tag tag={reportStatusTag(report.status)} />
                        <AgeTag date={report.createdAt} />
                      </div>
                      <strong>{report.name}</strong>
                      <p>{report.location}</p>
                      {isAdmin && report.reporterName && <span>Publicado por {report.reporterName}</span>}
                      <small className="anuncio-date">Publicado el {formatDateTime(report.createdAt)}</small>
                    </div>
                    {report.moderationNotes && <small>{report.moderationNotes}</small>}
                    <div className="actions-row" onClick={(event) => event.stopPropagation()}>
                      <button type="button" className="btn btn-secondary" onClick={() => openReportEditor(report)}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => disableReport(report.reportId)} disabled={actionLoading}>
                        Desactivar
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => setReportToDelete(report)}>
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>}

          {showSection('avisos') && <section className="anuncios-section">
            <h2>Avisos recibidos</h2>
            <div className="anuncios-list">
              {sightings.length === 0 ? (
                <p className="empty-state">Aun no tienes avisos sobre tus perros perdidos.</p>
              ) : (
                sightings.map((sighting) => (
                  <article
                    key={sighting.sightingId}
                    className={`anuncio-card sighting-card ${sighting.status === 'DISMISSED' ? 'is-dismissed' : ''}`}
                    onClick={() => openSighting(sighting)}
                  >
                    {sighting.imageUrls?.[0] && (
                      <img className="anuncio-image" src={sighting.imageUrls[0]} alt={sighting.reportName || 'Aviso'} />
                    )}
                    <div className="anuncio-card-content">
                      <div className="card-tags anuncio-tags">
                        <span className="card-tag card-tag--sighting">Aviso recibido</span>
                        <Tag tag={sightingStatusTag(sighting.status)} />
                        <AgeTag date={sighting.createdAt} prefix="Recibido hace" />
                        {sighting.entries?.length > 0 && (
                          <span className="card-tag card-tag--sighting">{sighting.entries.length + 1} avistamientos</span>
                        )}
                        {sighting.editedAt && (
                          <span className="card-tag card-tag--pending" title={formatDateTime(sighting.editedAt)}>
                            Editado {timeAgo(sighting.editedAt)}
                          </span>
                        )}
                      </div>
                      <strong>Sobre: {sighting.reportName || 'Perro perdido'}</strong>
                      <p>{sighting.location || 'Sin ubicacion'} - {sighting.contactName}</p>
                      <small className="anuncio-date">Recibido el {formatDateTime(sighting.createdAt)}</small>
                    </div>
                    <div className="actions-row">
                      <button type="button" className="btn btn-primary" onClick={(event) => { event.stopPropagation(); openSighting(sighting); }}>
                        Ver aviso
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>}
        </>
      )}

      {selectedSighting && (
        <div className="mis-anuncios-modal-overlay" onClick={() => setSelectedSighting(null)}>
          <div className="mis-anuncios-modal" onClick={(event) => event.stopPropagation()}>
            <div className="mis-anuncios-modal-header">
              <div>
                <span>Aviso recibido</span>
                <h2>{selectedSighting.reportName || 'Perro perdido'}</h2>
              </div>
              <button type="button" onClick={() => setSelectedSighting(null)}>x</button>
            </div>

            <div className="mis-anuncios-modal-body">
              {selectedSighting.imageUrls?.length > 0 && (
                <div className="sighting-images">
                  {selectedSighting.imageUrls.map((url, index) => (
                    <img key={`${url}-${index}`} src={url} alt={`Aviso ${index + 1}`} />
                  ))}
                </div>
              )}

              {selectedSighting.status === 'DISMISSED' && (
                <div className="sighting-dismissed-banner" role="status">
                  Marcaste este aviso como <strong>"No es mi perro"</strong>. Quien avisó ya no aparece como pendiente.
                </div>
              )}

              <div className="sighting-detail-grid">
                <div><span>Estado</span><strong>{sightingStatusTag(selectedSighting.status).label}</strong></div>
                <div><span>Recibido</span><strong>{formatDateTime(selectedSighting.createdAt)}</strong></div>
                <div><span>Contacto</span><strong>{selectedSighting.contactName || 'No registrado'}</strong></div>
                <div><span>Correo</span><strong>{selectedSighting.contactEmail || 'No registrado'}</strong></div>
                <div><span>Telefono</span><strong>{selectedSighting.contactPhone || 'No registrado'}</strong></div>
                <div>
                  <span>Ubicacion</span>
                  <strong>{selectedSighting.location || (selectedSighting.latitude != null ? 'Punto marcado en el mapa' : 'No registrada')}</strong>
                  {selectedSighting.latitude != null && selectedSighting.longitude != null && (
                    <a
                      className="sighting-map-link"
                      href={mapLink(selectedSighting.latitude, selectedSighting.longitude)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver en el mapa
                    </a>
                  )}
                </div>
              </div>

              <div className="sighting-message">
                <span>Mensaje recibido</span>
                <p>{selectedSighting.message || 'Sin mensaje.'}</p>
              </div>

              {selectedSighting.editedAt && (
                <p className="sighting-edited-note">
                  {selectedSighting.contactName || 'Quien avisó'} corrigió este aviso el {formatDateTime(selectedSighting.editedAt)}.
                </p>
              )}

              {selectedSighting.entries?.length > 0 && (
                <div className="sighting-entries">
                  <span>Otros avistamientos de {selectedSighting.contactName || 'esta persona'} ({selectedSighting.entries.length})</span>
                  <ol>
                    {selectedSighting.entries.map((entry) => (
                      <li key={entry.entryId}>
                        <strong>{formatDateTime(entry.createdAt)}</strong>
                        {(entry.location || entry.latitude != null) && (
                          <small>
                            📍 {entry.location || 'Punto marcado en el mapa'}
                            {entry.latitude != null && entry.longitude != null && (
                              <>
                                {' · '}
                                <a href={mapLink(entry.latitude, entry.longitude)} target="_blank" rel="noreferrer">Ver en el mapa</a>
                              </>
                            )}
                          </small>
                        )}
                        <p>{entry.message}</p>
                        {entry.imageUrls?.length > 0 && (
                          <div className="sighting-entry-images">
                            {entry.imageUrls.map((url, index) => (
                              <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer">
                                <img src={url} alt={`Avistamiento ${index + 1}`} />
                              </a>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {selectedSighting.status === 'CASE_OPENED' && (
                <div className="sighting-case-board">
                  <span>Caso abierto</span>
                  <p>Este espacio reune la informacion para conectar a quien vio al perro con quien lo busca.</p>
                  <div><strong>Perro:</strong> {selectedSighting.reportName || 'Perro perdido'}</div>
                  <div><strong>Quien aviso:</strong> {selectedSighting.contactName || 'No registrado'} - {selectedSighting.contactEmail || 'Sin correo'}</div>
                  <div><strong>Ubicacion del aviso:</strong> {selectedSighting.location || 'No registrada'}</div>
                  {selectedSighting.ownerReply && (
                    <div><strong>Respuesta enviada:</strong> {selectedSighting.ownerReply}</div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="owner-reply">Respuesta para quien aviso</label>
                <textarea
                  id="owner-reply"
                  rows="4"
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Escribe si crees que puede ser tu perro y como deseas continuar el contacto"
                  disabled={actionLoading}
                />
              </div>
            </div>

            <div className="mis-anuncios-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedSighting(null)} disabled={actionLoading}>Cerrar</button>
              {selectedSighting.status !== 'DISMISSED' && (
                <button type="button" className="btn btn-secondary" onClick={() => updateCase('DISMISSED')} disabled={actionLoading}>No es mi perro</button>
              )}
              <button type="button" className="btn btn-primary" onClick={() => replySighting('REPLIED')} disabled={actionLoading}>Responder</button>
              <button type="button" className="btn btn-success" onClick={() => updateCase('CASE_OPENED')} disabled={actionLoading}>Abrir caso</button>
            </div>
          </div>
        </div>
      )}

      {selectedReport && (
        <div className="mis-anuncios-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="mis-anuncios-modal pet-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="mis-anuncios-modal-header">
              <div>
                <span>Detalle del reporte</span>
                <h2>{selectedReport.name || 'Perro perdido'}</h2>
              </div>
              <button type="button" onClick={() => setSelectedReport(null)}>x</button>
            </div>
            <div className="mis-anuncios-modal-body pet-detail-body">
              {(() => {
                // Fotos a la izquierda (principal + miniaturas para elegir), datos a la derecha.
                const images = selectedReport.imageUrls?.length ? selectedReport.imageUrls
                  : (selectedReport.imageUrl ? [selectedReport.imageUrl] : []);
                const mainImage = selectedReportImage || images[0];
                return (
                  <div className="pet-detail-gallery">
                    {mainImage ? (
                      <img className="pet-detail-main-image" src={mainImage} alt={selectedReport.name || 'Reporte'} />
                    ) : (
                      <div className="pet-detail-main-image report-detail-noimage">Sin foto</div>
                    )}
                    {images.length > 1 && (
                      <div className="pet-detail-thumbs">
                        {images.slice(0, 4).map((url, index) => (
                          <button
                            type="button"
                            key={`${url}-${index}`}
                            className={`pet-thumb-button ${mainImage === url ? 'active' : ''}`}
                            onClick={() => setSelectedReportImage(url)}
                            aria-label={`Ver foto ${index + 1}`}
                          >
                            <img src={url} alt={`Foto ${index + 1} del reporte`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="pet-detail-info-grid">
                <div><span>Tipo</span><strong>{reportTypeLabel[selectedReport.type] || selectedReport.type || 'Perdido'}</strong></div>
                <div><span>Estado</span><strong>{reportStatusTag(selectedReport.status).label}</strong></div>
                <div><span>Raza</span><strong>{selectedReport.breed || 'No registrada'}</strong></div>
                <div><span>Sexo</span><strong>{reportSexLabel[selectedReport.sex] || selectedReport.sex || 'No registrado'}</strong></div>
                <div><span>Edad</span><strong>{formatearEdad(selectedReport.age) || 'No registrada'}</strong></div>
                <div><span>Color</span><strong>{selectedReport.color || 'No registrado'}</strong></div>
                <div className="report-detail-wide"><span>Ubicacion</span><strong>{selectedReport.location || 'No registrada'}</strong></div>
                <div><span>Contacto</span><strong>{selectedReport.contactPhone || user?.phone || 'No registrado'}</strong></div>
                <div><span>Publicado</span><strong>{formatDateTime(selectedReport.createdAt)}</strong></div>
                <div className="report-detail-wide"><span>Tiempo publicado</span><strong>{elapsedLabel(selectedReport.createdAt) || 'Sin fecha'}</strong></div>
              </div>
              <div className="sighting-message">
                <span>Descripcion</span>
                <p>{selectedReport.description || 'Sin descripcion adicional.'}</p>
              </div>
            </div>
            <div className="mis-anuncios-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedReport(null)}>Cerrar</button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(`/reporte/${selectedReport.reportId}`)}>Ver coincidencias</button>
              <button type="button" className="btn btn-primary" onClick={() => { setSelectedReport(null); openReportEditor(selectedReport); }}>Editar</button>
              <button type="button" className="btn btn-danger" onClick={() => setReportToDelete(selectedReport)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {reportToDelete && (
        <div className="mis-anuncios-modal-overlay" onClick={() => !actionLoading && setReportToDelete(null)}>
          <div className="mis-anuncios-modal delete-confirm-modal" onClick={(event) => event.stopPropagation()}>
            <div className="mis-anuncios-modal-header">
              <div>
                <span>Confirmar eliminacion</span>
                <h2>{reportToDelete.name || 'Reporte de extravio'}</h2>
              </div>
              <button type="button" onClick={() => setReportToDelete(null)} disabled={actionLoading}>x</button>
            </div>
            <div className="mis-anuncios-modal-body">
              <div className="sighting-message">
                <span>Eliminar reporte</span>
                <p>Esta accion eliminara definitivamente el reporte de extravio.</p>
              </div>
              <div className="sighting-detail-grid">
                <div><span>Perro</span><strong>{reportToDelete.name || 'Sin nombre'}</strong></div>
                <div><span>Ubicacion</span><strong>{reportToDelete.location || 'No registrada'}</strong></div>
              </div>
            </div>
            <div className="mis-anuncios-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setReportToDelete(null)} disabled={actionLoading}>Cancelar</button>
              <button type="button" className="btn btn-danger" onClick={removeReport} disabled={actionLoading}>
                {actionLoading ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingReport && reportEditForm && (
        <div className="mis-anuncios-modal-overlay" onClick={() => setEditingReport(null)}>
          <div className="mis-anuncios-modal" onClick={(event) => event.stopPropagation()}>
            <div className="mis-anuncios-modal-header">
              <div>
                <span>Editar reporte</span>
                <h2>{editingReport.name || 'Perro perdido'}</h2>
              </div>
              <button type="button" onClick={() => setEditingReport(null)}>x</button>
            </div>
            <div className="mis-anuncios-modal-body edit-pet-modal">
              <div className="form-group" data-field="name">
                <label>Nombre *</label>
                <input value={reportEditForm.name} onChange={(event) => setReportEditForm({ ...reportEditForm, name: event.target.value })} className={reportErrors.name ? 'error' : ''} />
                <FieldError msg={reportErrors.name} />
              </div>
              <div className="form-grid-two">
                <div className="form-group" data-field="breed">
                  <label>Raza *</label>
                  <select value={reportEditForm.breed} onChange={(event) => setReportEditForm({ ...reportEditForm, breed: event.target.value })} className={reportErrors.breed ? 'error' : ''}>
                    <option value="">Selecciona raza</option>
                    {!DOG_BREED_OPTIONS.includes(reportEditForm.breed) && reportEditForm.breed && (
                      <option value={reportEditForm.breed}>{reportEditForm.breed}</option>
                    )}
                    {DOG_BREED_OPTIONS.map((breed) => <option key={breed} value={breed}>{breed}</option>)}
                  </select>
                  <FieldError msg={reportErrors.breed} />
                </div>
                <div className="form-group">
                  <label>Sexo</label>
                  <select value={reportEditForm.sex} onChange={(event) => setReportEditForm({ ...reportEditForm, sex: event.target.value })}>
                    <option value="">Selecciona</option>
                    <option value="MALE">Macho</option>
                    <option value="FEMALE">Hembra</option>
                  </select>
                </div>
                <div className="form-group" data-field="color">
                  <label>Color *</label>
                  <select value={reportEditForm.color} onChange={(event) => setReportEditForm({ ...reportEditForm, color: event.target.value })} className={reportErrors.color ? 'error' : ''}>
                    <option value="">Selecciona color</option>
                    {!DOG_COLORS.includes(reportEditForm.color) && reportEditForm.color && (
                      <option value={reportEditForm.color}>{reportEditForm.color}</option>
                    )}
                    {DOG_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
                  </select>
                  <FieldError msg={reportErrors.color} />
                </div>
                <div className="form-group">
                  <label>{ETIQUETA_EDAD}</label>
                  <input {...ATRIBUTOS_EDAD} placeholder="Ej. 3" value={reportEditForm.age} onChange={(event) => setReportEditForm({ ...reportEditForm, age: event.target.value })} />
                </div>
              </div>
              <div className="form-grid-two">
                <div className="form-group" data-field="alcaldia">
                  <label>Alcaldía *</label>
                  <select value={reportEditForm.alcaldia} onChange={(event) => updateReportAlcaldia(event.target.value)} className={reportErrors.alcaldia ? 'error' : ''}>
                    <option value="">Selecciona alcaldía</option>
                    {!MEXICO_CITY_LOCATIONS.some((location) => location.label === reportEditForm.alcaldia) && reportEditForm.alcaldia && (
                      <option value={reportEditForm.alcaldia}>{reportEditForm.alcaldia}</option>
                    )}
                    {MEXICO_CITY_LOCATIONS.map((location) => (
                      <option key={location.label} value={location.label}>{location.label}</option>
                    ))}
                  </select>
                  <FieldError msg={reportErrors.alcaldia} />
                </div>
                <div className="form-group">
                  <label>Referencia o colonia</label>
                  <input value={reportEditForm.detalleUbicacion} onChange={(event) => setReportEditForm({ ...reportEditForm, detalleUbicacion: event.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Ubicación en el mapa</label>
                <MapPicker latitude={reportEditForm.latitude} longitude={reportEditForm.longitude} onChange={handleReportMapChange} disabled={actionLoading} />
              </div>
              <div className="form-group">
                <label>Telefono de contacto</label>
                <input value={reportEditForm.contactPhone} onChange={(event) => setReportEditForm({ ...reportEditForm, contactPhone: event.target.value })} />
              </div>
              <div className="form-group">
                <label>Descripcion</label>
                <textarea rows="4" value={reportEditForm.description} onChange={(event) => setReportEditForm({ ...reportEditForm, description: event.target.value })} />
              </div>
              <div className="form-group edit-images-field">
                <label>Fotos del reporte</label>
                <input type="file" accept="image/*" multiple onChange={handleReportImageChange} disabled={actionLoading} />
                <small>Selecciona hasta 4 fotos en una sola vez; la primera será la principal. Si no eliges nuevas, se conservan las actuales.</small>
                {reportEditForm.imagePreviews?.length > 0 && (
                  <div className="edit-image-preview-grid">
                    {reportEditForm.imagePreviews.map((url, index) => (
                      <img key={`${url}-${index}`} src={url} alt={`Foto ${index + 1} del reporte`} />
                    ))}
                  </div>
                )}
              </div>
              <div className="report-compare">
                <ReportMatches
                  reportId={editingReport.reportId}
                  canDecide
                  newTab
                  disabled={actionLoading}
                  hint="«Volver a comparar» usa los datos ya guardados: si cambiaste algo, guarda primero."
                />
              </div>
            </div>
            <div className="mis-anuncios-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingReport(null)} disabled={actionLoading}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={saveReportEdit} disabled={actionLoading}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {selectedPet && (
        <div className="mis-anuncios-modal-overlay" onClick={() => setSelectedPet(null)}>
          <div className="mis-anuncios-modal pet-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="mis-anuncios-modal-header">
              <div>
                <span>Detalle del perro</span>
                <h2>{selectedPet.nombre || 'Perro en adopcion'}</h2>
              </div>
              <button type="button" onClick={() => setSelectedPet(null)}>x</button>
            </div>
            <div className="mis-anuncios-modal-body pet-detail-body">
              {(selectedPetImage || selectedPet.imagen) && (
                <div className="pet-detail-gallery">
                  <img className="pet-detail-main-image" src={selectedPetImage || selectedPet.imagen} alt={selectedPet.nombre || 'Perro'} />
                  {selectedPet.imagenes?.length > 1 && (
                    <div className="pet-detail-thumbs">
                      {selectedPet.imagenes.slice(0, 4).map((url, index) => (
                        <button
                          type="button"
                          key={`${url}-${index}`}
                          className={`pet-thumb-button ${(selectedPetImage || selectedPet.imagen) === url ? 'active' : ''}`}
                          onClick={() => setSelectedPetImage(url)}
                          aria-label={`Ver foto ${index + 1}`}
                        >
                          <img src={url} alt={`Foto ${index + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="pet-detail-info-grid">
                <div><span>Raza</span><strong>{selectedPet.raza || 'No registrada'}</strong></div>
                <div><span>Sexo</span><strong>{selectedPet.sexo || 'No registrado'}</strong></div>
                <div><span>Edad</span><strong>{formatearEdad(selectedPet.age) || 'No registrada'}</strong></div>
                <div><span>Tamaño</span><strong>{sizeLabel(selectedPet.tamano) || 'No registrado'}</strong></div>
                <div><span>Color</span><strong>{selectedPet.color || 'No registrado'}</strong></div>
                <div><span>Ubicacion</span><strong>{selectedPet.ubicacion || 'No registrada'}</strong></div>
                <div><span>Estado</span><strong>{petStatusLabel[selectedPet.estadoBackend] || 'Disponible'}</strong></div>
                <div><span>Publicado</span><strong>{formatDateTime(selectedPet.createdAt)}</strong></div>
                <div><span>Tiempo publicado</span><strong>{elapsedLabel(selectedPet.createdAt) || 'Sin fecha'}</strong></div>
                {isAdmin && <div><span>Publicado por</span><strong>{selectedPet.ownerName || 'No registrado'}</strong></div>}
              </div>
              <div className="sighting-message">
                <span>Descripcion</span>
                <p>{selectedPet.descripcion || 'Sin descripcion adicional.'}</p>
              </div>
            </div>
            <div className="mis-anuncios-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedPet(null)}>Cerrar</button>
              {canEditPet(selectedPet) && (
                <>
                  <button type="button" className="btn btn-primary" onClick={() => { setSelectedPet(null); openPetEditor(selectedPet); }}>Editar</button>
                  <button type="button" className="btn btn-danger" onClick={() => setPetToDelete(selectedPet)}>Eliminar</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {petToDelete && (
        <div className="mis-anuncios-modal-overlay" onClick={() => !actionLoading && setPetToDelete(null)}>
          <div className="mis-anuncios-modal delete-confirm-modal" onClick={(event) => event.stopPropagation()}>
            <div className="mis-anuncios-modal-header">
              <div>
                <span>Confirmar eliminacion</span>
                <h2>{petToDelete.nombre || 'Publicacion'}</h2>
              </div>
              <button type="button" onClick={() => setPetToDelete(null)} disabled={actionLoading}>x</button>
            </div>
            <div className="mis-anuncios-modal-body">
              <div className="sighting-message">
                <span>Eliminar publicacion</span>
                <p>Esta accion eliminara definitivamente la publicacion de adopcion.</p>
              </div>
              <div className="sighting-detail-grid">
                <div><span>Perro</span><strong>{petToDelete.nombre || 'Sin nombre'}</strong></div>
                <div><span>Ubicacion</span><strong>{petToDelete.ubicacion || 'No registrada'}</strong></div>
              </div>
            </div>
            <div className="mis-anuncios-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setPetToDelete(null)} disabled={actionLoading}>Cancelar</button>
              <button type="button" className="btn btn-danger" onClick={removePet} disabled={actionLoading}>
                {actionLoading ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingPet && editForm && (
        <div className="mis-anuncios-modal-overlay" onClick={() => setEditingPet(null)}>
          <div className="mis-anuncios-modal" onClick={(event) => event.stopPropagation()}>
            <div className="mis-anuncios-modal-header">
              <div>
                <span>Editar publicacion</span>
                <h2>{editingPet.nombre || 'Perro en adopcion'}</h2>
              </div>
              <button type="button" onClick={() => setEditingPet(null)}>x</button>
            </div>
            <div className="mis-anuncios-modal-body edit-pet-modal">
              <div className="form-group" data-field="nombre">
                <label>Nombre *</label>
                <input value={editForm.nombre} onChange={(event) => setEditForm({ ...editForm, nombre: event.target.value })} className={petErrors.nombre ? 'error' : ''} />
                <FieldError msg={petErrors.nombre} />
              </div>
              <div className="form-grid-two">
                <div className="form-group" data-field="raza">
                  <label>Raza *</label>
                  <select value={editForm.raza} onChange={(event) => setEditForm({ ...editForm, raza: event.target.value })} className={petErrors.raza ? 'error' : ''}>
                    <option value="">Selecciona raza</option>
                    {!DOG_BREEDS.includes(editForm.raza) && editForm.raza && <option value={editForm.raza}>{editForm.raza}</option>}
                    {DOG_BREEDS.map((breed) => <option key={breed} value={breed}>{breed}</option>)}
                  </select>
                  <FieldError msg={petErrors.raza} />
                </div>
                <div className="form-group" data-field="color">
                  <label>Color *</label>
                  <select value={editForm.color} onChange={(event) => setEditForm({ ...editForm, color: event.target.value })} className={petErrors.color ? 'error' : ''}>
                    <option value="">Selecciona color</option>
                    {!DOG_COLORS.includes(editForm.color) && editForm.color && <option value={editForm.color}>{editForm.color}</option>}
                    {DOG_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
                  </select>
                  <FieldError msg={petErrors.color} />
                </div>
                <div className="form-group">
                  <label>{ETIQUETA_EDAD}</label>
                  <input {...ATRIBUTOS_EDAD} placeholder="Ej. 3" value={editForm.age} onChange={(event) => setEditForm({ ...editForm, age: event.target.value })} />
                </div>
                <div className="form-group">
                  <label>Tamaño</label>
                  <select value={editForm.tamano} onChange={(event) => setEditForm({ ...editForm, tamano: event.target.value })}>
                    <option value="">Sin especificar</option>
                    {DOG_SIZES.map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select value={editForm.estadoBackend} onChange={(event) => setEditForm({ ...editForm, estadoBackend: event.target.value })}>
                    <option value="AVAILABLE">Disponible</option>
                    <option value="ADOPTED">Adoptado</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="form-group" data-field="ubicacion">
                <label>Ubicacion *</label>
                <select value={editForm.ubicacion} onChange={(event) => updatePetLocation(event.target.value)} className={petErrors.ubicacion ? 'error' : ''}>
                  <option value="">Selecciona ubicacion</option>
                  {!MEXICO_CITY_LOCATIONS.some((location) => location.label === editForm.ubicacion) && editForm.ubicacion && (
                    <option value={editForm.ubicacion}>{editForm.ubicacion}</option>
                  )}
                  {MEXICO_CITY_LOCATIONS.map((location) => (
                    <option key={location.label} value={location.label}>{location.label}</option>
                  ))}
                </select>
                <FieldError msg={petErrors.ubicacion} />
              </div>
              <div className="form-group">
                <label>Referencia o colonia</label>
                <input value={editForm.detalleUbicacion} onChange={(event) => setEditForm({ ...editForm, detalleUbicacion: event.target.value })} />
              </div>
              <div className="form-group">
                <label>Ubicación en el mapa</label>
                <MapPicker latitude={editForm.latitude} longitude={editForm.longitude} onChange={handlePetMapChange} disabled={actionLoading} />
              </div>
              <div className="form-group">
                <label>Descripcion</label>
                <textarea rows="4" value={editForm.descripcion} onChange={(event) => setEditForm({ ...editForm, descripcion: event.target.value })} />
              </div>
              <div className="form-group edit-images-field">
                <label>Fotos de la publicacion</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleEditImagesChange}
                  disabled={actionLoading}
                />
                <small>Selecciona hasta 4 fotos en una sola vez. Si no eliges nuevas, se conservan las actuales.</small>
                {editForm.imagePreviews?.length > 0 && (
                  <div className="edit-image-picker">
                    <img className="edit-main-preview" src={editForm.activeImagePreview || editForm.imagePreviews[0]} alt="Vista previa seleccionada" />
                    <div className="edit-image-preview-grid">
                      {editForm.imagePreviews.slice(0, 4).map((url, index) => (
                        <button
                          type="button"
                          key={`${url}-${index}`}
                          className={`pet-thumb-button ${(editForm.activeImagePreview || editForm.imagePreviews[0]) === url ? 'active' : ''}`}
                          onClick={() => setEditForm({ ...editForm, activeImagePreview: url })}
                          aria-label={`Ver foto ${index + 1}`}
                        >
                          <img src={url} alt={`Foto ${index + 1}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mis-anuncios-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingPet(null)} disabled={actionLoading}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={savePetEdit} disabled={actionLoading}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisAnuncios;
