/**
 * SmartTrip RD - OpenRouteService (ORS) Route Integration
 * 
 * Clean Architecture Service Layer
 * Fetches real driving routes, distance (km), duration (minutes), and GeoJSON geometries.
 * Includes Haversine fallback estimation if ORS API Key is unconfigured or rate-limited.
 */

const axios = require('axios');

// Predefined Dominican Republic Cities Coordinates (lat, lng)
const DR_CITIES = {
  'santo_domingo': { name: 'Santo Domingo', lat: 18.4861, lng: -69.9312 },
  'santiago': { name: 'Santiago de los Caballeros', lat: 19.4517, lng: -70.6970 },
  'puerto_plata': { name: 'Puerto Plata', lat: 19.7808, lng: -70.6871 },
  'punta_cana': { name: 'Punta Cana', lat: 18.5601, lng: -68.3725 },
  'la_romana': { name: 'La Romana', lat: 18.4273, lng: -68.9728 },
  'barahona': { name: 'Barahona', lat: 18.2085, lng: -71.1008 },
  'samana': { name: 'Samaná', lat: 19.2056, lng: -69.3364 },
  'san_cristobal': { name: 'San Cristóbal', lat: 18.4167, lng: -70.1000 },
  'constanza': { name: 'Constanza', lat: 18.9092, lng: -70.7449 },
  'las_terrenas': { name: 'Las Terrenas', lat: 19.3211, lng: -69.5161 }
};

/**
 * Calculates Haversine direct distance between two lat/lng coordinates in km.
 */
function haversineDistance(coords1, coords2) {
  const R = 6371; // Earth radius in kilometers
  const dLat = (coords2.lat - coords1.lat) * (Math.PI / 180);
  const dLng = (coords2.lng - coords1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.lat * (Math.PI / 180)) *
      Math.cos(coords2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates an estimated DR highway route polyline and distance metrics
 * used as a resilient fallback when external API services are unavailable.
 */
function generateFallbackRoute(origin, destination) {
  const directKm = haversineDistance(origin, destination);
  const roadDistanceKm = Number((directKm * 1.22).toFixed(1)); // ~22% curvature factor for DR highways
  const durationMinutes = Math.round((roadDistanceKm / 72) * 60); // 72 km/h average highway speed

  // Generate intermediate points for smooth map polyline rendering
  const points = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    // Add subtle arc for realistic map visualization
    const lat = origin.lat + (destination.lat - origin.lat) * ratio + Math.sin(ratio * Math.PI) * 0.04;
    const lng = origin.lng + (destination.lng - origin.lng) * ratio;
    points.push([lng, lat]); // GeoJSON expects [lng, lat]
  }

  return {
    distanceKm: roadDistanceKm,
    durationMinutes,
    geometry: {
      type: 'LineString',
      coordinates: points
    },
    isFallback: true,
    provider: 'Haversine DR Highway Estimator'
  };
}

/**
 * Fetches driving route metrics and GeoJSON geometry between two coordinate points.
 * 
 * @param {Object} originCoords - { lat: number, lng: number }
 * @param {Object} destinationCoords - { lat: number, lng: number }
 * @returns {Promise<Object>} Route metrics and GeoJSON geometry
 */
async function getRoute(originCoords, destinationCoords) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  // Validate API key presence
  if (!apiKey || apiKey === 'your_openrouteservice_api_key_here') {
    console.warn('[WARN] OpenRouteService API Key not set in .env. Using intelligent fallback estimation.');
    return generateFallbackRoute(originCoords, destinationCoords);
  }

  try {
    const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
    const response = await axios.get(url, {
      headers: {
        'Authorization': apiKey,
        'Accept': 'application/json, application/geo+json'
      },
      params: {
        start: `${originCoords.lng},${originCoords.lat}`,
        end: `${destinationCoords.lng},${destinationCoords.lat}`
      },
      timeout: 6000
    });

    if (response.data && response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      const summary = feature.properties.summary;

      return {
        distanceKm: Number((summary.distance / 1000).toFixed(1)),
        durationMinutes: Math.round(summary.duration / 60),
        geometry: feature.geometry,
        isFallback: false,
        provider: 'OpenRouteService API'
      };
    }
  } catch (error) {
    const status = error.response ? error.response.status : 'NETWORK_ERROR';
    console.warn(`[WARN] OpenRouteService API call failed [Status: ${status}]. Using fallback route estimation.`);
  }

  // Graceful fallback execution
  return generateFallbackRoute(originCoords, destinationCoords);
}

module.exports = {
  getRoute,
  DR_CITIES,
  haversineDistance
};
