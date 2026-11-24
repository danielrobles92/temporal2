import { MEXICO_CITY_LOCATIONS } from '../../constants/dogOptions';

// Mapa de OpenStreetMap (sin clave de API).
// - Sugerencias mientras se escribe: Photon (komoot), hecho para autocompletar sobre datos de OSM.
// - Direccion de un punto del mapa: Nominatim reverse (una consulta por accion del usuario;
//   su politica de uso no permite usarlo para autocompletar).
const PHOTON = 'https://photon.komoot.io/api/';
const NOMINATIM = 'https://nominatim.openstreetmap.org';
export const CDMX_CENTER = [19.4326, -99.1332];
const CDMX_BBOX = '-99.37,19.04,-98.94,19.60'; // minLon,minLat,maxLon,maxLat (CDMX y alrededores)
// Se omiten paradas, andenes, carriles del Metrobus y estaciones de bicicleta: saturan la
// lista y no son direcciones. Las estaciones de Metro si se conservan.
const EXCLUDED_TAGS = [
  '!highway:bus_stop',
  '!highway:busway',
  '!amenity:bicycle_rental',
  '!railway:stop',
  '!railway:platform',
  '!public_transport:platform',
  '!public_transport:stop_position',
];
const isCdmxName = (value) => normalize(value) === 'ciudad de mexico';
export const MIN_CHARS = 3;
const MAX_SUGGESTIONS = 6;

// Minusculas y sin acentos, caracter por caracter (conserva la longitud para resaltar coincidencias).
export const foldChar = (c) => (c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()[0] || c);
const fold = (text) => Array.from(String(text || '')).map(foldChar).join('');
export const normalize = (text) => fold(text).trim();

/** "Calle 52, Colonia" (sin la alcaldia) a partir de la direccion de Nominatim. */
export const formatDetail = (address = {}) => {
  const street = [address.road || address.pedestrian || address.footway, address.house_number].filter(Boolean).join(' ');
  const area = address.neighbourhood || address.suburb || address.quarter;
  const borough = address.borough || address.city_district || address.county;
  return [street, area !== borough ? area : null].filter(Boolean).join(', ');
};

/** "Calle 52, Colonia, Alcaldía". */
export const formatAddress = (address = {}) => {
  const borough = address.borough || address.city_district || address.county;
  return [formatDetail(address), borough].filter(Boolean).join(', ');
};

/** Alcaldia del catalogo que corresponde a la direccion (o '' si no es de la CDMX). */
export const alcaldiaFrom = (address = {}) => {
  const candidates = [address.borough, address.city_district, address.county, address.suburb].map(normalize).filter(Boolean);
  const match = MEXICO_CITY_LOCATIONS.find((location) => location.lat != null
    && candidates.some((name) => name.includes(normalize(location.label)) || normalize(location.label).includes(name)));
  return match?.label || '';
};

export const reverseLookup = async (lat, lng) => {
  try {
    const response = await fetch(`${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&accept-language=es&lat=${lat}&lon=${lng}`);
    return response.ok ? (await response.json()).address : null;
  } catch (e) {
    return null;
  }
};

/** Convierte un resultado de Photon en una sugerencia: titulo, detalles y datos para el formulario. */
export const toSuggestion = (feature) => {
  const p = feature.properties || {};
  const [lng, lat] = feature.geometry?.coordinates || [];
  // Algunos lugares traen la direccion completa revuelta en "street"; en ese caso se ignora.
  const street = p.street && !p.street.includes(',') ? p.street : '';
  const streetLine = [street, p.housenumber].filter(Boolean).join(' ');
  const isStreet = p.type === 'street' || p.osm_key === 'highway';
  const isStation = (p.osm_key === 'railway' && p.osm_value === 'station')
    || (p.osm_key === 'building' && p.osm_value === 'train_station')
    || (p.osm_key === 'public_transport' && p.osm_value === 'station');
  // En OSM algunas zonas (sobre todo de Cuauhtemoc) traen "Ciudad de México" en lugar de la
  // alcaldia: no se toma como alcaldia y se completa despues con el punto del mapa.
  const borough = [p.district, p.county, p.city].find((name) => name && !isCdmxName(name)) || '';
  const inCdmx = [p.district, p.county, p.city, p.state].some(isCdmxName);
  const colonia = p.locality && p.locality !== borough ? p.locality : '';

  let kind = 'address';
  let title = streetLine || colonia || borough;
  if (isStreet && p.name) {
    kind = 'street';
    title = p.name;
  } else if (p.name) {
    kind = isStation ? 'station' : 'place';
    const alreadySaysStation = /^(metro|estacion|tren|tren ligero)\b/.test(normalize(p.name));
    title = isStation && !alreadySaysStation ? `Estación ${p.name}` : p.name;
  }

  const placeStreet = kind === 'place' || kind === 'station' ? streetLine : '';
  const area = borough || (inCdmx ? 'CDMX' : '');
  const subtitle = [placeStreet, colonia, area, p.postcode ? `CP ${p.postcode}` : ''].filter(Boolean).join(', ');
  const detail = [kind === 'address' ? streetLine : title, placeStreet, colonia].filter(Boolean).join(', ');

  return {
    id: `${p.osm_type || ''}${p.osm_id || ''}-${lat}-${lng}`,
    kind,
    title,
    subtitle,
    lat,
    lng,
    borough,
    detail,
    alcaldia: alcaldiaFrom({ borough: p.district, county: p.county, city_district: p.city }),
  };
};

/** Una avenida larga viene en varios tramos: se deja uno por calle y colonia. */
export const toSuggestions = (features = []) => {
  const seen = new Set();
  return features
    .map(toSuggestion)
    .filter((item) => {
      if (!item.title || item.lat == null) return false;
      const key = normalize(`${item.title}|${item.subtitle}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_SUGGESTIONS);
};

export const fetchSuggestions = async (text, bias, signal) => {
  const params = new URLSearchParams({
    q: text,
    lat: String(bias[0]),
    lon: String(bias[1]),
    limit: '10',
    bbox: CDMX_BBOX,
  });
  EXCLUDED_TAGS.forEach((tag) => params.append('osm_tag', tag));
  const response = await fetch(`${PHOTON}?${params}`, { signal });
  if (!response.ok) throw new Error(`Photon ${response.status}`);
  const data = await response.json();
  return toSuggestions(data.features);
};
