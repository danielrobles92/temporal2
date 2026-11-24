import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MascotaCard from '../../components/MascotaCard/MascotaCard';
import SightingForm from '../../components/SightingForm/SightingForm';
import { limpiarTelefono } from '../../utils/telefono';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getPetsLost, mapBackendToFrontend } from '../../services/petsService';
import { createReportSighting, getMySightings, getReports, updateReportSighting } from '../../services/platformService';
import { sightingStatusTag } from '../../constants/cardTags';
import { formatDate, formatDateTime, timeAgo } from '../../utils/dateFormat';
import { formatearEdad } from '../../utils/edad';
import { DOG_BREEDS, DOG_BREED_OPTIONS, DOG_COLORS, MEXICO_CITY_LOCATIONS, OTHER_BREED } from '../../constants/dogOptions';
import './MascotasPerdidas.css';

const SIZE_FETCH_ALL = 9999;
const VISIBLE_CARDS = 3;

const FILTROS_INICIALES = {
  busqueda: '',
  raza: '',
  sexo: '',
  color: '',
  ubicacion: '',
  tipoReporte: '',
  estadoReporte: '',
  publicaciones: '',
};

// Compara sin acentos ni mayúsculas ("Pastor Alemán" = "pastor aleman").
const norm = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const CATALOG_BREEDS = DOG_BREEDS.map(norm);

const MascotasPerdidas = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [detalle, setDetalle] = useState(null);
  // Formulario del aviso: null (cerrado), 'new', 'entry' (otro avistamiento), 'edit' o 'contact'.
  const [formMode, setFormMode] = useState(null);
  const [sendingSighting, setSendingSighting] = useState(false);
  // Avisos que ya envio el usuario, por reporte (una persona = un aviso por reporte).
  const [mySightings, setMySightings] = useState({});
  const navigate = useNavigate();
  const [filtrosDraft, setFiltrosDraft] = useState(FILTROS_INICIALES);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const loadPets = async () => {
    try {
      setLoading(true);
      setError('');
      const [response, lostReports] = await Promise.all([
        getPetsLost(SIZE_FETCH_ALL),
        getReports(),
      ]);
      const content = Array.isArray(response) ? response : (response.content || []);
      const lostPetCards = content.map((pet) => {
        const mappedPet = mapBackendToFrontend(pet);
        return {
          ...mappedPet,
          estado: 'perdida',
          tipoReporte: 'LOST',
          estadoReporte: 'OPEN',
        };
      });
      // Los reportes desactivados por su autor no se muestran al publico.
      const reportCards = (lostReports || []).filter((report) => report.status !== 'INACTIVE').map((report) => ({
        id: `reporte-${report.reportId}`,
        nombre: report.name,
        tipo: 'Perro',
        raza: report.breed || '',
        sexo: report.sex === 'MALE' ? 'Macho' : report.sex === 'FEMALE' ? 'Hembra' : '',
        color: report.color || '',
        edad: formatearEdad(report.age),
        edadNumero: report.age,
        descripcion: report.description || '',
        ubicacion: report.location || '',
        estado: 'perdida',
        tipoReporte: report.type,
        estadoReporte: report.status,
        imagen: report.imageUrl || '',
        imagenes: report.imageUrls?.length ? report.imageUrls : (report.imageUrl ? [report.imageUrl] : []),
        ownerName: report.reporterName || '',
        ownerId: report.reporterId,
        createdAt: report.createdAt,
        reporterEmail: report.reporterEmail || '',
        contactPhone: report.contactPhone || '',
      }));
      setMascotas([...lostPetCards, ...reportCards]);
    } catch (err) {
      setError(err.message || 'Error al cargar las mascotas perdidas');
      console.error('Error al cargar mascotas perdidas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMySightings = async () => {
    if (!user?.id) {
      setMySightings({});
      return;
    }
    try {
      const list = await getMySightings();
      setMySightings(Object.fromEntries((list || []).map((item) => [item.reportId, item])));
    } catch {
      // Sin la lista se sigue pudiendo avisar; el backend une los avisos repetidos.
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  useEffect(() => {
    loadMySightings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const mascotasFiltradas = mascotas.filter((mascota) => {
    // Ubicación: la alcaldía del catálogo con la que empieza "Alcaldía - referencia".
    const coincideUbicacion = !filtros.ubicacion || norm(mascota.ubicacion).startsWith(norm(filtros.ubicacion));
    const coincideBusqueda =
      !filtros.busqueda ||
      norm(mascota.nombre).includes(norm(filtros.busqueda)) ||
      norm(mascota.raza).includes(norm(filtros.busqueda));
    // "Otro": cualquier raza fuera del catálogo (o mestizo).
    const coincideRaza = !filtros.raza || (filtros.raza === OTHER_BREED
      ? !CATALOG_BREEDS.includes(norm(mascota.raza))
      : norm(mascota.raza) === norm(filtros.raza));
    const coincideSexo = !filtros.sexo || mascota.sexo === filtros.sexo;
    const coincideColor = !filtros.color || norm(mascota.color).includes(norm(filtros.color));
    const estadoReporte = String(mascota.estadoReporte || '').toUpperCase();
    const tipoReporte = String(mascota.tipoReporte || '').toUpperCase();
    const coincideEstado = !filtros.estadoReporte || estadoReporte === filtros.estadoReporte;
    const coincideTipo = !filtros.tipoReporte || tipoReporte === filtros.tipoReporte;
    const coincidePublicacion = filtros.publicaciones !== 'mias'
      || (user?.id != null && Number(mascota.ownerId) === Number(user.id));

    return coincideUbicacion && coincideBusqueda && coincideRaza && coincideSexo && coincideColor
      && coincideEstado && coincideTipo && coincidePublicacion;
  });

  const maxCarouselIndex = Math.max(0, mascotasFiltradas.length - VISIBLE_CARDS);

  useEffect(() => {
    if (carouselIndex > maxCarouselIndex) {
      setCarouselIndex(maxCarouselIndex);
    }
  }, [carouselIndex, maxCarouselIndex]);

  useEffect(() => {
    if (!detalle) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDetalle(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [detalle]);

  useEffect(() => {
    setFormMode(null);
  }, [detalle]);

  const handleFiltroChange = (event) => {
    const { name, value } = event.target;
    setFiltrosDraft((prev) => ({ ...prev, [name]: value }));
  };

  const aplicarFiltros = (event) => {
    event.preventDefault();
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

  const reportIdFromDetalle = () => {
    const id = String(detalle?.id || '');
    return id.startsWith('reporte-') ? Number(id.replace('reporte-', '')) : null;
  };

  const detalleReportId = detalle ? reportIdFromDetalle() : null;
  const mySighting = detalleReportId ? mySightings[detalleReportId] : null;

  const handleSightingSubmit = async (data) => {
    const reportId = reportIdFromDetalle();
    if (!reportId) {
      showToast('Este registro no tiene un reporte asociado para contactar', 'warning');
      return;
    }

    setSendingSighting(true);
    try {
      if (formMode === 'edit' || formMode === 'contact') {
        await updateReportSighting(mySighting.sightingId, data);
        showToast('Tu aviso se actualizó. Quien publicó verá que lo corregiste.', 'success');
      } else {
        await createReportSighting(reportId, { userId: user?.id || null, ...data });
        if (formMode === 'entry') {
          showToast(mySighting?.caseId && !['RESOLVED', 'ADOPTED'].includes(mySighting.caseStatus)
            ? 'Avistamiento agregado al chat de tu caso'
            : 'Avistamiento agregado a tu mismo aviso', 'success');
        } else {
          showToast('Aviso enviado al reporte', 'success');
        }
      }
      setFormMode(null);
      setDetalle(null);
      await loadMySightings();
    } catch (err) {
      showToast(err.message || 'No se pudo guardar el aviso', 'error');
    } finally {
      setSendingSighting(false);
    }
  };

  // Datos iniciales del formulario: los del aviso propio o los del perfil.
  const formInitial = mySighting && formMode !== 'new'
    ? mySighting
    : {
      contactName: user?.name || user?.username || '',
      contactEmail: user?.email || '',
      contactPhone: limpiarTelefono(user?.phone),
    };

  return (
    <div className="perdidas-page">
      <div className="perdidas-layout">
        <aside className="perdidas-filtros-card">
          <h2 className="perdidas-filtros-title">Filtros de busqueda</h2>
          <form className="perdidas-filtros-form" onSubmit={aplicarFiltros}>
            <div className="form-group">
              <label htmlFor="busqueda-perdidas">Buscar por nombre o raza</label>
              <input
                id="busqueda-perdidas"
                type="text"
                name="busqueda"
                className="perdidas-input"
                placeholder="Ej. Max, mestizo"
                value={filtrosDraft.busqueda}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="raza-perdidas">Raza</label>
              <select id="raza-perdidas" name="raza" className="perdidas-input" value={filtrosDraft.raza} onChange={handleFiltroChange}>
                <option value="">Todas</option>
                {DOG_BREED_OPTIONS.map((breed) => <option key={breed} value={breed}>{breed}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sexo-perdidas">Sexo</label>
              <select id="sexo-perdidas" name="sexo" className="perdidas-input" value={filtrosDraft.sexo} onChange={handleFiltroChange}>
                <option value="">Todos</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="color-perdidas">Color</label>
              <select id="color-perdidas" name="color" className="perdidas-input" value={filtrosDraft.color} onChange={handleFiltroChange}>
                <option value="">Todos</option>
                {DOG_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ubicacion-perdidas">Alcaldía</label>
              <select id="ubicacion-perdidas" name="ubicacion" className="perdidas-input" value={filtrosDraft.ubicacion} onChange={handleFiltroChange}>
                <option value="">Todas</option>
                {MEXICO_CITY_LOCATIONS.map((location) => (
                  <option key={location.label} value={location.label}>{location.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tipo-reporte">Tipo</label>
              <select id="tipo-reporte" name="tipoReporte" className="perdidas-input" value={filtrosDraft.tipoReporte} onChange={handleFiltroChange}>
                <option value="">Todos</option>
                <option value="LOST">Perdidos</option>
                <option value="FOUND">Encontrados</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="estado-reporte">Estado</label>
              <select id="estado-reporte" name="estadoReporte" className="perdidas-input" value={filtrosDraft.estadoReporte} onChange={handleFiltroChange}>
                <option value="">Todos</option>
                <option value="OPEN">Abierto</option>
                <option value="RESOLVED">Resuelto</option>
              </select>
            </div>

            {user?.id && (
              <div className="form-group">
                <label htmlFor="publicaciones-perdidas">Publicaciones</label>
                <select id="publicaciones-perdidas" name="publicaciones" className="perdidas-input" value={filtrosDraft.publicaciones} onChange={handleFiltroChange}>
                  <option value="">Todas</option>
                  <option value="mias">Solo las mías</option>
                </select>
              </div>
            )}

            <div className="perdidas-filtros-actions">
              <button type="submit" className="btn btn-primary btn-block">Aplicar filtros</button>
              <button type="button" className="btn btn-secondary btn-block" onClick={limpiarFiltros}>Limpiar</button>
            </div>
          </form>
        </aside>

        <section className="perdidas-resultados">
          <div className="perdidas-resultados-header">
            <button type="button" className="perdidas-carousel-side-button" onClick={() => moverCarrusel(-1)} disabled={carouselIndex === 0}>
              Anterior
            </button>
            <h1>Perros perdidos y encontrados</h1>
            <button type="button" className="perdidas-carousel-side-button" onClick={() => moverCarrusel(1)} disabled={carouselIndex >= maxCarouselIndex}>
              Siguiente
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">Cargando reportes...</div>
            </div>
          ) : error ? (
            <div className="error-alert"><span>{error}</span></div>
          ) : mascotasFiltradas.length > 0 ? (
            <div className="perdidas-carousel">
              <div
                className="perdidas-carousel-track"
                style={{ transform: `translateX(calc(-${carouselIndex} * ((100% - 40px) / 3 + 20px)))` }}
              >
                {mascotasFiltradas.map((mascota) => (
                  <div className="perdidas-carousel-slide" key={mascota.id}>
                    <MascotaCard mascota={mascota} variant="perdidas" onDetalle={setDetalle} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="perdidas-mascotas-grid">
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

      {detalle && (
        <div className="perdidas-modal-overlay" onClick={() => setDetalle(null)}>
          <div className="perdidas-modal" onClick={(event) => event.stopPropagation()}>
            <div className="perdidas-modal-header">
              <div>
                <span>Detalle del perro</span>
                <h2>{detalle.nombre || 'Perro sin nombre'}</h2>
              </div>
              <button type="button" onClick={() => setDetalle(null)} aria-label="Cerrar detalle">
                x
              </button>
            </div>
            <div className="perdidas-modal-body">
              <div className="perdidas-modal-gallery">
                {detalle.imagen ? (
                  <img src={detalle.imagen} alt={detalle.nombre} />
                ) : (
                  <div className="perdidas-modal-placeholder">Sin imagen</div>
                )}
                {detalle.imagenes?.length > 1 && (
                  <div className="perdidas-modal-thumbs">
                    {detalle.imagenes.slice(1, 4).map((imageUrl, index) => (
                      <img
                        key={`${imageUrl}-${index}`}
                        src={imageUrl}
                        alt={`${detalle.nombre} ${index + 2}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="perdidas-modal-info">
                {detalle.tipoReporte && (
                  <InfoItem
                    label="Tipo"
                    value={detalle.tipoReporte === 'FOUND' ? 'Encontrado' : 'Perdido'}
                  />
                )}
                {detalle.estadoReporte && (
                  <InfoItem
                    label="Estado del reporte"
                    value={detalle.estadoReporte === 'RESOLVED' ? 'Resuelto' : 'Abierto'}
                  />
                )}
                <InfoItem label="Raza" value={detalle.raza || 'No especificada'} />
                <InfoItem label="Sexo" value={detalle.sexo || 'No especificado'} />
                <InfoItem label="Edad" value={detalle.edad || 'No especificada'} />
                <InfoItem label="Color" value={detalle.color || 'No especificado'} />
                <InfoItem label="Ubicacion" value={detalle.ubicacion || 'No registrada'} />
                <InfoItem label="Publicado por" value={detalle.ownerName || 'No registrado'} />
                <InfoItem label="Publicado el" value={detalle.createdAt ? `${formatDateTime(detalle.createdAt)} (${timeAgo(detalle.createdAt)})` : 'Sin fecha'} />
              </div>
              <div className="perdidas-modal-description">
                <span>Descripcion</span>
                <p>{detalle.descripcion || 'Sin descripcion adicional.'}</p>
              </div>

              {mySighting && (
                <div className="perdidas-my-sighting" role="status">
                  <p>
                    <strong>Ya enviaste un aviso sobre este perro</strong> el {formatDate(mySighting.createdAt)}
                    {' · '}{sightingStatusTag(mySighting.status).label}
                    {mySighting.entries?.length > 0 && ` · ${mySighting.entries.length + 1} avistamientos`}
                    {mySighting.editedAt && ` · editado ${timeAgo(mySighting.editedAt)}`}
                  </p>
                  <small>
                    Si te equivocaste en algo, corrígelo; si lo volviste a ver, agrégalo a tu mismo aviso para no aparecer como otra persona.
                  </small>
                </div>
              )}

              <div className="perdidas-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDetalle(null)}
                >
                  Cerrar
                </button>
                {mySighting ? (
                  <>
                    {mySighting.caseId && (
                      <button type="button" className="btn btn-secondary" onClick={() => navigate(`/casos?case=${mySighting.caseId}`)}>
                        Ver mi caso
                      </button>
                    )}
                    {mySighting.editMode === 'FULL' && (
                      <button type="button" className="btn btn-secondary" onClick={() => setFormMode(formMode === 'edit' ? null : 'edit')}>
                        Corregir mi aviso
                      </button>
                    )}
                    {mySighting.editMode === 'CONTACT' && (
                      <button type="button" className="btn btn-secondary" onClick={() => setFormMode(formMode === 'contact' ? null : 'contact')}>
                        Corregir mis datos
                      </button>
                    )}
                    <button type="button" className="btn btn-primary" onClick={() => setFormMode(formMode === 'entry' ? null : 'entry')}>
                      {detalle.tipoReporte === 'FOUND' ? 'Agregar información' : 'Agregar otro avistamiento'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setFormMode(formMode === 'new' ? null : 'new')}
                  >
                    Contactar
                  </button>
                )}
              </div>

              {formMode && (
                <SightingForm
                  key={`${detalle.id}-${formMode}`}
                  mode={formMode}
                  tipoReporte={detalle.tipoReporte}
                  initial={formInitial}
                  sending={sendingSighting}
                  submitDisabled={!detalleReportId}
                  onSubmit={handleSightingSubmit}
                  onCancel={() => setFormMode(null)}
                  onError={(message) => showToast(message, 'warning')}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="perdidas-modal-info-item">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export default MascotasPerdidas;
