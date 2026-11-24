import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Login.css';

import PasswordInput from '../../components/PasswordInput/PasswordInput';
import { guideToFirstError } from '../../utils/formGuide';
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  
  // "Recordarme": sesion de 7 dias y el correo queda precargado en el siguiente acceso.
  const rememberedEmail = (() => {
    try {
      return localStorage.getItem('rememberedEmail') || '';
    } catch (e) {
      return '';
    }
  })();

  const [formData, setFormData] = useState({
    email: rememberedEmail,
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail));

  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
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

    if (!formData.email.trim()) {
      nuevosErrores.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nuevosErrores.email = 'El email no es válido';
    }

    if (!formData.password) {
      nuevosErrores.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
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

    // TODO: Esta función login() está definida en AuthContext
    // Cuando integres con el backend, la función login en AuthContext
    // hará la llamada real al endpoint POST /api/auth/login
    const result = await login(formData.email, formData.password, rememberMe);

    setLoading(false);

    if (result.success) {
      try {
        if (rememberMe) localStorage.setItem('rememberedEmail', formData.email.trim());
        else localStorage.removeItem('rememberedEmail');
      } catch (e) {
        // Sin almacenamiento local solo se pierde el correo precargado.
      }
      // Redirigir al usuario después del login exitoso a la pantalla principal
      navigate('/home');
    } else {
      const message = result.error || 'Error al iniciar sesion. Por favor, intenta de nuevo.';
      setErrorGeneral(message);
      showToast(message, 'error');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container auth-card">
        <div className="login-header">
          <h1>Iniciar Sesión</h1>
          <p>Bienvenido de vuelta a Perreque</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {errorGeneral && (
            <div className="error-alert">
              <span className="error-icon">⚠️</span>
              <span>{errorGeneral}</span>
            </div>
          )}

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

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span title="Mantiene la sesión iniciada 7 días y recuerda tu correo">Recordarme</span>
            </label>
            <Link to="/recuperar-password" className="forgot-password">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-submit"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          <div className="form-footer">
            <p>
              ¿No tienes una cuenta?{' '}
              <Link to="/registro" className="link-register">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
