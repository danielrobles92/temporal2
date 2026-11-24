import { toSuggestion, toSuggestions } from './geocoding';

// Resultados reales de Photon (photon.komoot.io) para la CDMX, recortados a lo que se usa.
const feature = (properties, coordinates = [-99.16, 19.41]) => ({ properties, geometry: { coordinates } });

const insurgentes = feature({
  name: 'Avenida Insurgentes Sur', type: 'street', osm_key: 'highway', osm_value: 'secondary',
  district: 'Ciudad de México', locality: 'Colonia Roma Norte', postcode: '06700',
});
const carranza52 = feature({
  street: 'Calle Presidente Venustiano Carranza', housenumber: '52', type: 'house', osm_key: 'place', osm_value: 'house',
  district: 'Coyoacán', locality: 'Colonia La Concepción', postcode: '04020',
});
const metroUniversidad = feature({
  name: 'Universidad', street: 'Avenida Doctor Antonio Delfín Madrigal', type: 'house', osm_key: 'railway', osm_value: 'station',
  district: 'Coyoacán', locality: 'Copilco', postcode: '04510',
});
const unamPlace = feature({
  name: 'Universidad Nacional Autónoma de México', street: 'Avenida del IMAN', type: 'house', osm_key: 'amenity', osm_value: 'university',
  district: 'Coyoacán', locality: 'Colonia Torres de Maurel', postcode: '04535',
});
const nezaStreet = feature({
  name: 'Av. Universidad Nacional', type: 'street', osm_key: 'highway', osm_value: 'tertiary',
  locality: 'Colonia Impulsora', city: 'Nezahualcóyotl', county: 'Nezahualcóyotl', postcode: '57130',
});
const lazaroBenitoJuarez = feature({
  name: 'Avenida Lázaro Cárdenas', type: 'street', osm_key: 'highway', osm_value: 'primary',
  district: 'Benito Juárez', locality: 'Colonia Portales Norte', postcode: '03300',
});

describe('toSuggestion', () => {
  it('calle: el nombre es el titulo y la colonia y CP van en los detalles', () => {
    const s = toSuggestion(insurgentes);
    expect(s.kind).toBe('street');
    expect(s.title).toBe('Avenida Insurgentes Sur');
    // "Ciudad de México" no es alcaldia: se muestra "CDMX" y la alcaldia se completa con el punto del mapa.
    expect(s.subtitle).toBe('Colonia Roma Norte, CDMX, CP 06700');
    expect(s.borough).toBe('');
    expect(s.alcaldia).toBe('');
    expect(s.detail).toBe('Avenida Insurgentes Sur, Colonia Roma Norte');
  });

  it('ignora una calle con la direccion completa revuelta', () => {
    const s = toSuggestion(feature({
      name: 'Mano Santa Mezcal', street: 'ManoAv. Insurgentes Sur 219, Roma Nte., Cuauhtémoc, 06700 Ciudad de México',
      type: 'house', osm_key: 'amenity', osm_value: 'bar', district: 'Ciudad de México', locality: 'Colonia Roma Norte', postcode: '06700',
    }));
    expect(s.subtitle).toBe('Colonia Roma Norte, CDMX, CP 06700');
  });

  it('reconoce estaciones etiquetadas como edificio de estacion', () => {
    const s = toSuggestion(feature({
      name: 'Metro Chabacano L2', type: 'house', osm_key: 'building', osm_value: 'train_station',
      district: 'Ciudad de México', locality: 'Colonia Vista Alegre',
    }));
    expect(s.kind).toBe('station');
    expect(s.title).toBe('Metro Chabacano L2'); // ya dice "Metro": sin prefijo "Estación"
  });

  it('direccion con numero: calle y numero como titulo; alcaldia del catalogo sin acentos', () => {
    const s = toSuggestion(carranza52);
    expect(s.kind).toBe('address');
    expect(s.title).toBe('Calle Presidente Venustiano Carranza 52');
    expect(s.subtitle).toBe('Colonia La Concepción, Coyoacán, CP 04020');
    expect(s.alcaldia).toBe('Coyoacan');
    expect(s.detail).toBe('Calle Presidente Venustiano Carranza 52, Colonia La Concepción');
  });

  it('estacion y lugar: el nombre como titulo y la calle en los detalles', () => {
    const station = toSuggestion(metroUniversidad);
    expect(station.kind).toBe('station');
    expect(station.title).toBe('Estación Universidad');
    expect(station.subtitle).toBe('Avenida Doctor Antonio Delfín Madrigal, Copilco, Coyoacán, CP 04510');

    const place = toSuggestion(unamPlace);
    expect(place.kind).toBe('place');
    expect(place.detail).toBe('Universidad Nacional Autónoma de México, Avenida del IMAN, Colonia Torres de Maurel');
  });

  it('fuera de la CDMX: muestra el municipio pero no asigna alcaldia', () => {
    const s = toSuggestion(nezaStreet);
    expect(s.subtitle).toBe('Colonia Impulsora, Nezahualcóyotl, CP 57130');
    expect(s.alcaldia).toBe('');
  });

  it('reconoce alcaldias con acentos y espacios', () => {
    expect(toSuggestion(lazaroBenitoJuarez).alcaldia).toBe('Benito Juarez');
  });

  it('usa las coordenadas [lon, lat] de GeoJSON', () => {
    const s = toSuggestion(feature({ name: 'X', type: 'street', osm_key: 'highway' }, [-99.2, 19.3]));
    expect(s.lat).toBe(19.3);
    expect(s.lng).toBe(-99.2);
  });
});

describe('toSuggestions', () => {
  it('quita tramos repetidos de la misma calle y colonia y limita a 6', () => {
    const repeated = [insurgentes, insurgentes, carranza52, metroUniversidad, unamPlace, nezaStreet, lazaroBenitoJuarez,
      feature({ name: 'Otra calle', type: 'street', osm_key: 'highway', district: 'Tlalpan', locality: 'Centro' })];
    const list = toSuggestions(repeated);
    expect(list).toHaveLength(6);
    expect(list.filter((s) => s.title === 'Avenida Insurgentes Sur')).toHaveLength(1);
  });

  it('descarta resultados sin titulo o sin coordenadas', () => {
    expect(toSuggestions([{ properties: {}, geometry: { coordinates: [] } }])).toHaveLength(0);
  });
});
