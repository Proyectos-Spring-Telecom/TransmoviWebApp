/**
 * Estilos para ocultar POI (Points of Interest) y establecimientos en Google Maps
 * Se aplica a todos los mapas del sistema para mantenerlos limpios
 */
export const MAP_STYLES_NO_POI: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.business',
    elementType: 'all',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.attraction',
    elementType: 'all',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.place_of_worship',
    elementType: 'all',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.school',
    elementType: 'all',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.sports_complex',
    elementType: 'all',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  }
];
