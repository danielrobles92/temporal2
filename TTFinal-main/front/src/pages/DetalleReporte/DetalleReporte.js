import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getReportDetails } from '../../services/platformService';
import ReportMatches from '../../components/ReportMatches/ReportMatches';
import { formatearEdad } from '../../utils/edad';
import './DetalleReporte.css';

const typeLabel = {
  LOST: 'Perdido',
  FOUND: 'Encontrado',
};

const statusLabel = {
  OPEN: 'Abierto',
  RESOLVED: 'Resuelto',
  INACTIVE: 'Inactivo',
};

const DetalleReporte = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setActiveImage('');   // al abrir otro reporte desde una coincidencia, empezar por su foto principal
      try {
        const data = await getReportDetails(id);
        setReport(data);
      } catch (err) {
        setError(err.message || 'No se pudo cargar el reporte');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="loading-container">Cargando reporte...</div>;
  }

  if (error || !report) {
    return (
      <div className="detalle-reporte-page">
        <div className="empty-panel">
          <h2>Reporte no encontrado</h2>
          <p>{error || 'El reporte no existe o fue eliminado.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/mascotas-perdidas')}>Volver</button>
        </div>
      </div>
    );
  }

  // Solo el autor del reporte (o un admin) descarta coincidencias o vuelve a comparar.
  const canDecide = user?.isAdmin || Number(report.reporterId) === Number(user?.id);

  return (
    <div className="detalle-reporte-page">
      <button onClick={() => navigate(-1)} className="btn-back">Volver</button>

      <section className="report-detail">
        <div className="report-gallery">
          <div className="report-media">
            {report.imageUrl ? (
              <img src={activeImage || report.imageUrl} alt={report.name} />
            ) : (
              <div className="report-placeholder">Sin imagen</div>
            )}
            <span className={`report-badge ${report.type === 'FOUND' ? 'found' : 'lost'}`}>{typeLabel[report.type]}</span>
          </div>
          {report.imageUrls?.length > 1 && (
            <div className="report-thumbs">
              {report.imageUrls.map((url, index) => (
                <button
                  type="button"
                  key={`${url}-${index}`}
                  className={(activeImage || report.imageUrl) === url ? 'active' : ''}
                  onClick={() => setActiveImage(url)}
                  aria-label={`Ver foto ${index + 1}`}
                >
                  <img src={url} alt={`${report.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="report-info">
          <div className="report-title-row">
            <div>
              <span className="report-kicker">Reporte #{report.reportId}</span>
              <h1>{report.name}</h1>
            </div>
            <span className="report-status">{statusLabel[report.status] || report.status}</span>
          </div>

          <div className="report-data-grid">
            <div><span>Raza</span><strong>{report.breed || 'No especificada'}</strong></div>
            <div><span>Sexo</span><strong>{report.sex === 'MALE' ? 'Macho' : report.sex === 'FEMALE' ? 'Hembra' : 'No especificado'}</strong></div>
            <div><span>Color</span><strong>{report.color || 'No especificado'}</strong></div>
            <div><span>Edad</span><strong>{formatearEdad(report.age) || 'No especificada'}</strong></div>
            <div><span>Contacto</span><strong>{report.contactPhone || 'No especificado'}</strong></div>
            <div><span>Ubicacion</span><strong>{report.location}</strong></div>
          </div>

          {report.description && (
            <div className="report-description">
              <h2>Descripcion</h2>
              <p>{report.description}</p>
            </div>
          )}

          {report.latitude && report.longitude && (
            <div className="report-map">
              <iframe
                title="Mapa del reporte"
                src={`https://maps.google.com/maps?q=${report.latitude},${report.longitude}&z=14&output=embed`}
                loading="lazy"
              />
            </div>
          )}
        </div>
      </section>

      <ReportMatches reportId={id} canDecide={canDecide} />
    </div>
  );
};

export default DetalleReporte;
