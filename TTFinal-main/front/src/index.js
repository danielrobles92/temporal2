import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { installNativeGuide } from './utils/formGuide';

// Campos con `required`: además del aviso del navegador, el recuadro rojo (utils/formGuide.js).
installNativeGuide();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


