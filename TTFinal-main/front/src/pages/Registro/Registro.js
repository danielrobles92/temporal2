import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PasswordInput from '../../components/PasswordInput/PasswordInput';
import { ATRIBUTOS_TELEFONO, MENSAJE_TELEFONO, limpiarTelefono, telefonoValido } from '../../utils/telefono';
import './Registro.css';
import { guideToFirstError } from '../../utils/formGuide';

const Registro = () => {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'USER', // Por defecto USER, puede ser USER o ADMIN
  });

  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const handleChange = (e) => {
    const { name } = e.target;
    // El teléfono solo admite dígitos (máximo 10).
    const value = name === 'phone' ? limpiarTelefono(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Limpiar errores cuando el usuario empieza a escribir
    if (errores[name]) {
      setErrores({
        ...errores,
        [name]: '',
      });
    }
    if (errorGeneral) {
      setErrorGeneral('');
    }
  };

  const validateForm = () => {
    const nuevosErrores = {};

    if (!formData.username.trim()) {
      nuevosErrores.username = 'El nombre de usuario es requerido';
    } else if (formData.username.trim().length < 3) {
      nuevosErrores.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }

    if (!formData.email.trim()) {
      nuevosErrores.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nuevosErrores.email = 'El email no es válido';
    }

    if (!formData.phone.trim()) {
      nuevosErrores.phone = 'El teléfono es requerido';
    } else if (!telefonoValido(formData.phone)) {
      nuevosErrores.phone = MENSAJE_TELEFONO;
    }

    if (!formData.password) {
      nuevosErrores.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      nuevosErrores.password = 'La contraseña debe contener mayúsculas, minúsculas y números';
    }

    if (!formData.confirmPassword) {
      nuevosErrores.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      nuevosErrores.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!aceptaTerminos) {
      nuevosErrores.terminos = 'Confirma que tienes 18 años o más y acepta los términos y el aviso de privacidad';
    }

    setErrores(nuevosErrores);
    guideToFirstError(nuevosErrores);
    const firstError = Object.values(nuevosErrores)[0];
    if (firstError) showToast(firstError, 'error');
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGeneral('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // TODO: Esta función register() está definida en AuthContext
    // Cuando integres con el backend, la función register en AuthContext
    // hará la llamada real al endpoint POST /api/auth/register
    const result = await register(formData);

    setLoading(false);

    if (result.success) {
      // Redirigir al usuario después del registro exitoso a la pantalla principal
      showToast('Registro completado correctamente. Ya puedes iniciar sesion.', 'success');
      navigate('/login');
    } else {
      const message = result.error || 'Error al registrar usuario. Por favor, intenta de nuevo.';
      setErrorGeneral(message);
      showToast(message, 'error');
    }
  };

  return (
    <div className="registro-page">
      <div className="registro-container auth-card">
        <div className="registro-header">
          <h1>Crear Cuenta</h1>
          <p>Únete a Perreque y ayuda a las mascotas</p>
        </div>

        <form onSubmit={handleSubmit} className="registro-form" noValidate>
          {errorGeneral && (
            <div className="error-alert">
              <span className="error-icon">⚠️</span>
              <span>{errorGeneral}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Nombre de Usuario *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errores.username ? 'error' : ''}
              placeholder="juanperez"
              disabled={loading}
            />
            {errores.username && <span className="error-message">{errores.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errores.email ? 'error' : ''}
              placeholder="tu@email.com"
              disabled={loading}
            />
            {errores.email && <span className="error-message">{errores.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono *</label>
            <input
              {...ATRIBUTOS_TELEFONO}
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errores.phone ? 'error' : ''}
              placeholder="5512345678"
              disabled={loading}
            />
            {errores.phone && <span className="error-message">{errores.phone}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Contraseña *</label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errores.password ? 'error' : ''}
                placeholder="••••••••"
                disabled={loading}
              />
              {errores.password && <span className="error-message">{errores.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errores.confirmPassword ? 'error' : ''}
                placeholder="••••••••"
                disabled={loading}
              />
              {errores.confirmPassword && <span className="error-message">{errores.confirmPassword}</span>}
            </div>
          </div>

          {/* Solo mostrar selector de rol si el usuario actual es administrador */}
          {user && user.isAdmin && (
            <div className="form-group">
              <label htmlFor="role">Tipo de Usuario</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
                className="select-role"
              >
                <option value="USER">Usuario</option>
                <option value="ADMIN">Administrador</option>
              </select>
              <small className="role-hint">Solo los administradores pueden crear otros administradores</small>
            </div>
          )}

          <div className={`form-terms${errores.terminos ? ' has-error' : ''}`} data-field="terminos">
            <label className="checkbox-label">
              <input
                type="checkbox"
                id="acepta-terminos"
                checked={aceptaTerminos}
                onChange={(e) => {
                  setAceptaTerminos(e.target.checked);
                  if (e.target.checked && errores.terminos) setErrores((prev) => ({ ...prev, terminos: '' }));
                }}
                disabled={loading}
                required
              />
              <span>
                Tengo 18 años o más y acepto los{' '}
                {/* En otra pestaña, para no perder lo que ya se escribió en el formulario */}
                <a href="/terminos" target="_blank" rel="noopener noreferrer" className="link-terms">
                  términos y condiciones
                </a>{' '}
                y el{' '}
                <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="link-terms">
                  aviso de privacidad
                </a>
              </span>
            </label>
            {errores.terminos && <span className="error-message" role="alert">{errores.terminos}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-submit"
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>

          <div className="form-footer">
            <p>
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="link-login">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registro;
