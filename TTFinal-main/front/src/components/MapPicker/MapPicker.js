import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  CDMX_CENTER,
  MIN_CHARS,
  alcaldiaFrom,
  fetchSuggestions,
  foldChar,
  formatAddress,
  formatDetail,
  normalize,
  reverseLookup,
} from './geocoding';
import './MapPicker.css';

// Espera breve tras cada tecla antes de pedir sugerencias.
const DEBOUNCE_MS = 300;

const hasValue = (value) => value !== '' && value !== null && value !== undefined && !Number.isNaN(Number(value));

const pinIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

/** Resalta en negritas las palabras escritas que aparecen en el texto (sin importar acentos). */
const highlight = (text, query) => {
  const words = normalize(query).split(/\s+/).filter((word) => word.length >= 2);
  const chars = Array.from(String(text || ''));
  if (!words.length || !chars.length) return text;
  const folded = chars.map(foldChar).join('');
  const marked = new Array(chars.length).fill(false);
  words.forEach((word) => {
    let from = folded.indexOf(word);
    while (from !== -1) {
      for (let i = from; i < from + word.length; i += 1) marked[i] = true;
      from = folded.indexOf(word, from + word.length);
    }
  });
  const parts = [];
  let start = 0;
  for (let i = 1; i <= chars.length; i += 1) {
    if (i === chars.length || marked[i] !== marked[start]) {
      const piece = chars.slice(start, i).join('');
      parts.push(marked[start] ? <mark key={start}>{piece}</mark> : <React.Fragment key={start}>{piece}</React.Fragment>);
      start = i;
    }
  }
  return parts;
};

const kindIcon = {
  street: '🛣️',
  address: '🏠',
  place: '📍',
  station: '🚇',
};

/**
 * Selector de ubicacion: escribir una direccion (con sugerencias mientras se escribe),
 * clic en el mapa o arrastrar el marcador para fijar el punto, o usar la ubicacion actual.
 *
 * props:
 *  - latitude, longitude: punto actual ('' o null si no hay)
 *  - onChange({ latitude, longitude, address, detail, alcaldia }): cuando se resuelve la
 *    direccion del punto llegan address (completa), detail (calle y colonia, sin la
 *    alcaldia) y alcaldia (del catalogo, o '' si el punto no es de la CDMX)
 */
const MapPicker = ({ latitude, longitude, onChange, disabled = false }) => {
  const listId = useId();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);
  const cacheRef = useRef(new Map());
  const pickSeqRef = useRef(0);
  const [query, setQuery] = useState('');
  const [typed, setTyped] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [locating, setLocating] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');

  onChangeRef.current = onChange;
  disabledRef.current = disabled;

  // Fija el punto. Si no se conoce la direccion (clic o arrastre), se obtiene del punto;
  // si se conoce pero falta la alcaldia, solo se completa la alcaldia.
  const pick = useCallback(async (lat, lng, known) => {
    const seq = pickSeqRef.current + 1;
    pickSeqRef.current = seq;
    const point = { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    onChangeRef.current?.(point);

    let resolved = known || null;
    if (!resolved || !resolved.alcaldia) {
      const address = await reverseLookup(lat, lng);
      if (seq !== pickSeqRef.current) return; // ya se eligio otro punto
      if (address) {
        resolved = resolved
          ? { ...resolved, alcaldia: alcaldiaFrom(address), borough: resolved.borough || address.borough || address.city_district || '' }
          : { detail: formatDetail(address), borough: address.borough || address.city_district || address.county || '', alcaldia: alcaldiaFrom(address), full: formatAddress(address) };
      }
    }

    if (resolved) {
      const fullAddress = resolved.full || [resolved.detail, resolved.borough || resolved.alcaldia].filter(Boolean).join(', ');
      onChangeRef.current?.({ ...point, address: fullAddress, detail: resolved.detail, alcaldia: resolved.alcaldia || '' });
      setSelectedAddress(fullAddress);
      setStatus('');
    } else {
      setSelectedAddress('');
      setStatus('Punto marcado. No se pudo obtener la dirección; puedes escribir la referencia a mano.');
    }
  }, []);

  useEffect(() => {
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(CDMX_CENTER, 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; colaboradores de OpenStreetMap',
    }).addTo(map);
    map.on('click', (event) => {
      if (!disabledRef.current) pick(event.latlng.lat, event.latlng.lng);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [pick]);

  // Mantiene el marcador sincronizado con el punto del formulario.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!hasValue(latitude) || !hasValue(longitude)) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }
    const position = [Number(latitude), Number(longitude)];
    if (!markerRef.current) {
      markerRef.current = L.marker(position, { icon: pinIcon, draggable: true }).addTo(map);
      markerRef.current.on('dragend', (event) => {
        const { lat, lng } = event.target.getLatLng();
        pick(lat, lng);
      });
    } else {
      markerRef.current.setLatLng(position);
    }
    if (!map.getBounds().pad(-0.2).contains(position)) {
      map.setView(position, Math.max(map.getZoom(), 14));
    }
  }, [latitude, longitude, pick]);

  useEffect(() => {
    if (markerRef.current?.dragging) {
      if (disabled) markerRef.current.dragging.disable();
      else markerRef.current.dragging.enable();
    }
  }, [disabled, latitude, longitude]);

  // Sugerencias mientras se escribe (con espera breve para no consultar en cada tecla).
  useEffect(() => {
    const text = query.trim();
    if (!typed || text.length < MIN_CHARS) {
      setSuggestions([]);
      setSearching(false);
      setSearchError('');
      return undefined;
    }
    const cacheKey = normalize(text);
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setSuggestions(cached);
      setActiveIndex(-1);
      setSearching(false);
      setSearchError('');
      return undefined;
    }

    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      const bias = hasValue(latitude) && hasValue(longitude) ? [Number(latitude), Number(longitude)] : CDMX_CENTER;
      try {
        const results = await fetchSuggestions(text, bias, controller.signal);
        cacheRef.current.set(cacheKey, results);
        setSuggestions(results);
        setActiveIndex(-1);
        setSearchError('');
      } catch (e) {
        if (e.name !== 'AbortError') {
          setSuggestions([]);
          setSearchError('No se pudieron cargar las sugerencias. Marca el punto directamente en el mapa.');
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // La ubicacion solo orienta la busqueda; no hace falta repetirla si cambia el punto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, typed]);

  const choose = (suggestion) => {
    setTyped(false);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    setQuery([suggestion.title, suggestion.subtitle].filter(Boolean).join(', '));
    mapRef.current?.setView([suggestion.lat, suggestion.lng], suggestion.kind === 'street' ? 16 : 17);
    pick(suggestion.lat, suggestion.lng, {
      detail: suggestion.detail,
      borough: suggestion.borough,
      alcaldia: suggestion.alcaldia,
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      // Dentro de un formulario, Enter elige la sugerencia en lugar de enviar el formulario.
      event.preventDefault();
      if (suggestions.length) choose(suggestions[activeIndex >= 0 ? activeIndex : 0]);
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!suggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    }
  };

  const clearQuery = () => {
    setQuery('');
    setTyped(false);
    setSuggestions([]);
    setOpen(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Tu navegador no permite obtener la ubicación.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude: lat, longitude: lng } = position.coords;
        clearQuery();
        pick(lat, lng);
        mapRef.current?.setView([lat, lng], 16);
      },
      () => {
        setLocating(false);
        setStatus('No se pudo obtener tu ubicación. Revisa el permiso del navegador.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const text = query.trim();
  const showList = open && typed && text.length >= MIN_CHARS;
  const activeId = activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined;

  return (
    <div className="map-picker">
      <div className="map-picker-search">
        <div className="map-picker-combobox">
          <span className="map-picker-search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setTyped(true);
              setOpen(true);
            }}
            onFocus={() => typed && setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe una calle, avenida o lugar (ej. Avenida Insurgentes)"
            disabled={disabled}
            autoComplete="off"
            role="combobox"
            aria-label="Buscar dirección"
            aria-autocomplete="list"
            aria-expanded={showList}
            aria-controls={listId}
            aria-activedescendant={activeId}
          />
          {searching && <span className="map-picker-spinner" aria-hidden="true" />}
          {query && !searching && (
            <button type="button" className="map-picker-clear" onClick={clearQuery} disabled={disabled} aria-label="Borrar búsqueda">
              ×
            </button>
          )}

          {showList && (
            <div className="map-picker-dropdown">
              <ul id={listId} role="listbox" className="map-picker-suggestions">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.id}
                    id={`${listId}-opt-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={index === activeIndex ? 'active' : ''}
                    // mousedown (antes del blur del campo) para que el clic alcance a elegir
                    onMouseDown={(event) => {
                      event.preventDefault();
                      choose(suggestion);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span className="map-picker-suggestion-icon" aria-hidden="true">{kindIcon[suggestion.kind]}</span>
                    <span className="map-picker-suggestion-text">
                      <strong>{highlight(suggestion.title, text)}</strong>
                      {suggestion.subtitle && <small>{suggestion.subtitle}</small>}
                    </span>
                  </li>
                ))}
              </ul>
              {searching && suggestions.length === 0 && <p className="map-picker-dropdown-note">Buscando…</p>}
              {!searching && searchError && <p className="map-picker-dropdown-note">{searchError}</p>}
              {!searching && !searchError && suggestions.length === 0 && (
                <p className="map-picker-dropdown-note">
                  No encontramos esa dirección. Prueba con otra calle o colonia, o marca el punto en el mapa.
                </p>
              )}
              <p className="map-picker-attribution">Sugerencias: Photon · © OpenStreetMap</p>
            </div>
          )}
        </div>
        <button type="button" className="btn btn-secondary" onClick={useMyLocation} disabled={disabled || locating}>
          {locating ? 'Ubicando…' : 'Mi ubicación'}
        </button>
      </div>

      <div ref={containerRef} className="map-picker-map" />
      <small className="map-picker-hint">
        {status || (selectedAddress
          ? <>📍 <strong>{selectedAddress}</strong>. Si no es el punto exacto, arrastra el marcador.</>
          : 'Escribe la dirección y elige una sugerencia, o haz clic en el mapa para fijar el punto.')}
      </small>
    </div>
  );
};

export default MapPicker;
