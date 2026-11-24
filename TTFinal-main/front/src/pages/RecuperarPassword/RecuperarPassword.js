import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { confirmPasswordReset, requestPasswordReset } from '../../services/platformService';
import '../Login/Login.css';

import PasswordInput from '../../components/PasswordInput/PasswordInput';
import { guideToFirstError } from '../../utils/formGuide';
/**
 * CU-43: el usuario pide un codigo de 6 digitos a su correo y con el elige una
 * contrasena nueva (mismas reglas que el registro).
 */
const RecuperarPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ code: '', password: '', confirmPassword: '' });
  const [errores, setErrores] = useState({});
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'code' ? value.replace(/\D/g, '').slice(0, 6) : value });
    if (errores[name]) setErrores({ ...errores, [name]: '' });
  };

  const sendCode = async (e) => {
    e?.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrores({ email: 'Escribe un correo electrónico válido' });
      return;
    }
    setLoading(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setInfo(result?.message || 'Si el correo está registrado, te enviamos un código.');
      setStep('code');
    } catch (err) {
      showToast(err.message || 'No se pudo enviar el código', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateNewPassword = () => {
    const nuevosErrores = {};
    if (form.code.length !== 6) nuevosErrores.code = 'El código tiene 6 dígitos';
    if (!form.password) {
      nuevosErrores.password = 'La contraseña es requerida';
    } else if (form.password.length < 6) {
      nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      nuevosErrores.password = 'La contraseña debe contener mayúsculas, minúsculas y números';
    }
    if (form.password !== form.confirmPassword) nuevosErrores.confirmPassword = 'Las contraseñas no coinciden';
    setErrores(nuevosErrores);
    guideToFirstError(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!validateNewPassword()) return;
    setLoading(true);
    try {
      const result = await confirmPasswordReset(email.trim(), form.code, form.password);
      showToast(result?.message || 'Contraseña actualizada. Ya puedes iniciar sesión.', 'success');
      navigate('/login');
    } catch (err) {
      setErrores({ general: err.message || 'No se pudo cambiar la contraseña' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container auth-card">
        <div className="login-header">
          <h1>Recuperar contraseña</h1>
          <p>
            {step === 'email'
              ? 'Te enviaremos un código a tu correo para crear una contraseña nueva.'
              : `Escribe el código que enviamos a ${email.trim()}.`}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={sendCode} className="login-form">
            <div className="form-group">
              <label htmlFor="reset-email">Email *</label>
              <input
                type="email"
                id="reset-email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrores({}); }}
                className={errores.email ? 'error' : ''}
                placeholder="tu@email.com"
                disabled={loading}
                autoFocus
              />
              {errores.email && <span className="error-message">{errores.email}</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form onSubmit={changePassword} className="login-form">
            {info && <div className="reset-info">{info}</div>}
            {errores.general && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                <span>{errores.general}</span>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="reset-code">Código de 6 dígitos *</label>
              <input
                id="reset-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={form.code}
                onChange={handleFormChange}
                className={errores.code ? 'error' : ''}
                placeholder="123456"
                disabled={loading}
                autoFocus
              />
              {errores.code && <span className="error-message">{errores.code}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="reset-password">Nueva contraseña *</label>
              <PasswordInput
                id="reset-password"
                name="password"
                value={form.password}
                onChange={handleFormChange}
                className={errores.password ? 'error' : ''}
                placeholder="••••••••"
                disabled={loading}
              />
              {errores.password && <span className="error-message">{errores.password}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="reset-confirm">Confirmar contraseña *</label>
              <PasswordInput
                id="reset-confirm"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleFormChange}
                className={errores.confirmPassword ? 'error' : ''}
                placeholder="••••••••"
                disabled={loading}
              />
              {errores.confirmPassword && <span className="error-message">{errores.confirmPassword}</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
            <div className="form-options">
              <button type="button" className="link-button" onClick={sendCode} disabled={loading}>
                Reenviar código
              </button>
              <button type="button" className="link-button" onClick={() => { setStep('email'); setErrores({}); }} disabled={loading}>
                Usar otro correo
              </button>
            </div>
          </form>
        )}

        <div className="form-footer">
          <p>
            <Link to="/login" className="link-register">Volver a iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecuperarPassword;
