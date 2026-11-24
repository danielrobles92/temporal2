import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  clearNotifications,
  getNotificationSummary,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/platformService';
import { timeAgo } from '../../utils/dateFormat';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bellRef = useRef(null);
  const menuRef = useRef(null);

  // Cerrar la bandeja y el menu al hacer clic fuera de ellos o al presionar Esc.
  useEffect(() => {
    if (!showAlerts && !showMenu) return undefined;
    const handlePointerDown = (event) => {
      if (showAlerts && bellRef.current && !bellRef.current.contains(event.target)) {
        setShowAlerts(false);
        setConfirmClear(false);
      }
      if (showMenu && menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowAlerts(false);
        setConfirmClear(false);
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAlerts, showMenu]);

  // Al cambiar de pagina se cierran ambos menus.
  useEffect(() => {
    setShowAlerts(false);
    setConfirmClear(false);
    setShowMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setNotifications(null);
      setAlerts([]);
      return undefined;
    }

    let active = true;
    const loadNotifications = async () => {
      try {
        const [summary, list] = await Promise.all([
          getNotificationSummary(user.id).catch(() => null),
          getNotifications(user.id).catch(() => []),
        ]);
        if (active) {
          setNotifications(summary);
          setAlerts(list || []);
        }
      } catch (error) {
        if (active) setNotifications(null);
      }
    };

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 30000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [isAuthenticated, user?.id]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const openAlert = async (alert) => {
    setShowAlerts(false);
    if (!alert.read) {
      try {
        await markNotificationRead(alert.notificationId);
        setAlerts((prev) => prev.map((a) => (a.notificationId === alert.notificationId ? { ...a, read: true } : a)));
      } catch (e) { /* no-op */ }
    }
    if (alert.link) navigate(alert.link);
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead(user.id);
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch (e) { /* no-op */ }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await clearNotifications(user.id);
      setAlerts([]);
      setConfirmClear(false);
    } catch (e) { /* no-op */ } finally {
      setClearing(false);
    }
  };

  const toggleAlerts = () => {
    setShowMenu(false);
    setConfirmClear(false);
    setShowAlerts((v) => !v);
  };

  const toggleMenu = () => {
    setShowAlerts(false);
    setConfirmClear(false);
    setShowMenu((v) => !v);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMenu(false);
  };

  // No mostrar header en páginas de login/registro
  if (location.pathname === '/login' || location.pathname === '/registro') {
    return null;
  }

  return (
    <header className="header">
      <div className="header-container">
        <Link to={isAuthenticated ? "/home" : "/login"} className="logo">
          <span className="logo-icon">🐾</span>
          <span className="logo-text">Perreque</span>
        </Link>
        
        <nav className="navigation">
          {isAuthenticated && (
            <>
              <Link 
                to="/home" 
                className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`}
              >
                Inicio
              </Link>
              <Link 
                to="/adopcion" 
                className={`nav-link ${location.pathname === '/adopcion' ? 'active' : ''}`}
              >
                Adopción
              </Link>
              <Link 
                to="/mascotas-perdidas" 
                className={`nav-link ${location.pathname === '/mascotas-perdidas' ? 'active' : ''}`}
              >
                Mascotas Perdidas
              </Link>
              <Link
                to="/casos"
                className={`nav-link nav-link-with-badge ${location.pathname === '/casos' ? 'active' : ''}`}
              >
                Casos
                {notifications?.openCases > 0 && <span className="nav-badge">{notifications.openCases}</span>}
              </Link>
              {/* Todos reportan perros perdidos/encontrados; adopcion requiere autorizacion (se valida en el formulario). */}
              <Link
                to="/publicar"
                className={`nav-link nav-link-primary ${location.pathname === '/publicar' ? 'active' : ''}`}
              >
                Publicar Anuncio
              </Link>
            </>
          )}

          {isAuthenticated && (
            <div className="notif-bell" ref={bellRef}>
              <button
                className="notif-bell-button"
                onClick={toggleAlerts}
                aria-label="Notificaciones"
                aria-expanded={showAlerts}
              >
                <span className="notif-bell-icon">🔔</span>
                {unreadCount > 0 && <span className="notif-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {showAlerts && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-head">
                    <strong>Notificaciones</strong>
                    {unreadCount > 0 && (
                      <button className="notif-markall" onClick={handleMarkAll}>Marcar todas leídas</button>
                    )}
                  </div>
                  {alerts.length === 0 ? (
                    <p className="notif-empty">No tienes notificaciones.</p>
                  ) : (
                    <>
                      <ul className="notif-list">
                        {alerts.map((a) => (
                          <li
                            key={a.notificationId}
                            className={`notif-item ${a.read ? '' : 'unread'}`}
                            onClick={() => openAlert(a)}
                          >
                            <span className="notif-item-title">{a.title}</span>
                            {a.message && <span className="notif-item-msg">{a.message}</span>}
                            {a.createdAt && <span className="notif-item-time">{timeAgo(a.createdAt)}</span>}
                          </li>
                        ))}
                      </ul>
                      <div className="notif-dropdown-foot">
                        {confirmClear ? (
                          <>
                            <span>¿Borrar todas las notificaciones?</span>
                            <div className="notif-foot-actions">
                              <button type="button" className="notif-foot-cancel" onClick={() => setConfirmClear(false)} disabled={clearing}>
                                Cancelar
                              </button>
                              <button type="button" className="notif-foot-danger" onClick={handleClearAll} disabled={clearing}>
                                {clearing ? 'Vaciando...' : 'Sí, vaciar'}
                              </button>
                            </div>
                          </>
                        ) : (
                          <button type="button" className="notif-clear" onClick={() => setConfirmClear(true)}>
                            Vaciar bandeja
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {isAuthenticated ? (
            <div className="user-menu" ref={menuRef}>
              <button
                className="user-menu-button"
                onClick={toggleMenu}
                aria-label="Menú de usuario"
                aria-expanded={showMenu}
              >
                <span className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="user-name">{user?.name || 'Usuario'}</span>
                <span className="menu-arrow">▼</span>
              </button>
              
              {showMenu && (
                <div className="user-dropdown">
                  <Link 
                    to="/perfil" 
                    className="dropdown-item"
                    onClick={() => setShowMenu(false)}
                  >
                    Mi Perfil
                  </Link>
                  <Link 
                    to="/mis-anuncios" 
                    className="dropdown-item"
                    onClick={() => setShowMenu(false)}
                  >
                    Mis Anuncios
                  </Link>
                  <Link
                    to="/solicitudes"
                    className="dropdown-item"
                    onClick={() => setShowMenu(false)}
                  >
                    Solicitudes
                    {notifications?.adoptionRequests > 0 && <span className="dropdown-badge">{notifications.adoptionRequests}</span>}
                  </Link>
                  <Link
                    to="/casos"
                    className="dropdown-item"
                    onClick={() => setShowMenu(false)}
                  >
                    Casos
                    {notifications?.openCases > 0 && <span className="dropdown-badge">{notifications.openCases}</span>}
                  </Link>
                  {notifications?.reportSightings > 0 && (
                    <Link
                      to="/mis-anuncios?tab=avisos"
                      className="dropdown-item"
                      onClick={() => setShowMenu(false)}
                    >
                      Avisos recibidos
                      <span className="dropdown-badge">{notifications.reportSightings}</span>
                    </Link>
                  )}
                  {/* Solo mostrar opción de crear usuario si es administrador */}
                  {user?.isAdmin && (
                    <>
                      <div className="dropdown-divider"></div>
                      <Link 
                        to="/admin" 
                        className="dropdown-item"
                        onClick={() => setShowMenu(false)}
                      >
                        Administracion
                      </Link>
                      <Link 
                        to="/crear-usuario" 
                        className="dropdown-item"
                        onClick={() => setShowMenu(false)}
                      >
                        Crear Usuario
                      </Link>
                    </>
                  )}
                  <div className="dropdown-divider"></div>
                  <button 
                    className="dropdown-item dropdown-item-danger"
                    onClick={handleLogout}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
};

export default Header;

