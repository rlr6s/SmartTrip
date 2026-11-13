document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos del DOM
  const originCitySelect = document.getElementById('originCitySelect');
  const destinationCitySelect = document.getElementById('destinationCitySelect');
  
  const tripForm = document.getElementById('tripForm');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnText = btnSubmit ? btnSubmit.querySelector('.btn-text') : null;
  const btnLoader = btnSubmit ? btnSubmit.querySelector('.btn-loader') : null;
  
  const distanceKmInput = document.getElementById('distanceKm');
  const durationMinutesInput = document.getElementById('durationMinutes');
  
  const toastContainer = document.getElementById('toastContainer');
  const toastMessage = document.getElementById('toastMessage');
  const btnCloseToast = document.getElementById('btnCloseToast');
  
  const resultsSection = document.getElementById('resultsSection');
  const mapOverlay = document.getElementById('mapOverlay');

  // Elementos dinámicos de la cabecera e itinerario
  const routeTitleText = document.getElementById('routeTitleText');
  const headerDurationText = document.getElementById('headerDurationText');
  const headerDistanceText = document.getElementById('headerDistanceText');
  const cardRouteDuration = document.getElementById('cardRouteDuration');
  const cardRouteSub = document.getElementById('cardRouteSub');
  const stopOriginCity = document.getElementById('stopOriginCity');
  const stopDestCity = document.getElementById('stopDestCity');

  // Métricas de presupuesto
  const resTotalCost = document.getElementById('resTotalCost');
  const resCostPerPassenger = document.getElementById('resCostPerPassenger');
  const resPassengerSubtext = document.getElementById('resPassengerSubtext');
  const resGallonsNeeded = document.getElementById('resGallonsNeeded');
  const resFuelCostSubtext = document.getElementById('resFuelCostSubtext');
  const resTotalTollCost = document.getElementById('resTotalTollCost');
  const resTollsSubtext = document.getElementById('resTollsSubtext');
  const resDistance = document.getElementById('resDistance');
  const resDurationSubtext = document.getElementById('resDurationSubtext');

  // URL base de la API backend
  const getApiBaseUrl = () => {
    const origin = window.location.origin;
    if (origin && origin.startsWith('http')) {
      return origin;
    }
    return 'http://localhost:3000';
  };

  // Control de pestañas
  const switchTab = (tabName) => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    tabPanes.forEach(pane => {
      const isActive = pane.id === `tab-${tabName}`;
      pane.classList.toggle('active', isActive);
      pane.classList.toggle('anim-up', isActive);
    });
  };

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Botón para compartir itinerario
  const btnShareTrip = document.getElementById('btnShareTrip');
  if (btnShareTrip) {
    btnShareTrip.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({
          title: 'SmartTrip RD',
          text: `Ruta: ${routeTitleText ? routeTitleText.textContent : 'SmartTrip RD'}`,
          url: window.location.href
        }).catch(() => {});
      } else {
        showToast('Resumen de viaje copiado al portapapeles.');
      }
    });
  }

  // Funciones de formato de datos
  const formatCurrencyDOP = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'RD$ 0.00';
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `RD$ ${formatted}`;
  };

  const formatDurationText = (rawMinutes) => {
    const minutes = Math.round(rawMinutes);
    if (isNaN(minutes) || minutes <= 0) return '0 min';
    
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;

    if (hours === 0) return `${remainingMins}m`;
    if (remainingMins === 0) return `${hours}h`;
    return `${hours}h ${remainingMins}m`;
  };

  const formatDistanceText = (distance) => {
    if (typeof distance !== 'number' || isNaN(distance)) return '0.0 km';
    return `${distance.toFixed(1)} km`;
  };

  // Notificaciones Toast
  let toastTimeout = null;

  const showToast = (message) => {
    if (!toastMessage || !toastContainer) return;
    toastMessage.textContent = message;
    toastContainer.classList.remove('hidden');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(hideToast, 6000);
  };

  const hideToast = () => {
    if (toastContainer) toastContainer.classList.add('hidden');
  };

  if (btnCloseToast) {
    btnCloseToast.addEventListener('click', hideToast);
  }

  // Control de estados de carga
  const setLoadingState = (isLoading) => {
    if (btnSubmit) btnSubmit.disabled = isLoading;
    if (originCitySelect) originCitySelect.disabled = isLoading;
    if (destinationCitySelect) destinationCitySelect.disabled = isLoading;

    if (btnText && btnLoader) {
      btnText.classList.toggle('hidden', isLoading);
      btnLoader.classList.toggle('hidden', !isLoading);
    }
  };

  const setMapLoading = (isLoading) => {
    if (mapOverlay) mapOverlay.classList.toggle('hidden', !isLoading);
  };

  // Inicialización del Mapa Leaflet
  const drCenter = [18.7357, -70.1627];
  const map = L.map('map', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView(drCenter, 8);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_583s_1_ec04fd5dbfbbfb5b184ed2be', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
 
  }).addTo(map);

  let currentRouteLayer = null;
  let originMarker = null;
  let destinationMarker = null;

  const updateRouteLabels = (originText, destText, distanceKm, durationMins) => {
    if (routeTitleText) routeTitleText.textContent = `${originText} → ${destText}`;
    if (stopOriginCity) stopOriginCity.textContent = originText;
    if (stopDestCity) stopDestCity.textContent = destText;

    if (distanceKm && durationMins) {
      const durText = formatDurationText(durationMins);
      const distText = formatDistanceText(distanceKm);

      if (headerDurationText) headerDurationText.textContent = durText;
      if (headerDistanceText) headerDistanceText.textContent = distText;
      if (cardRouteDuration) cardRouteDuration.textContent = durText;
      if (cardRouteSub) cardRouteSub.textContent = `${distText} · Vía Carretera Principal RD`;
    }
  };

  // Consulta de trazado de ruta en el servidor
  const updateRouteOnMap = async () => {
    const originCity = originCitySelect.value;
    const destinationCity = destinationCitySelect.value;

    const originText = originCitySelect.options[originCitySelect.selectedIndex].text;
    const destText = destinationCitySelect.options[destinationCitySelect.selectedIndex].text;

    updateRouteLabels(originText, destText);

    if (originCity === destinationCity) {
      showToast('La ciudad de origen y destino no pueden ser iguales.');
      return;
    }

    hideToast();
    setMapLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/trips/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originCity, destinationCity })
      });

      const jsonResult = await response.json();

      if (!response.ok || !jsonResult.success) {
        throw new Error(jsonResult.message || 'Error al solicitar el trazado de la ruta.');
      }

      const { data, origin, destination } = jsonResult;

      if (distanceKmInput) distanceKmInput.value = data.distanceKm;
      if (durationMinutesInput) durationMinutesInput.value = data.durationMinutes;

      updateRouteLabels(originText, destText, data.distanceKm, data.durationMinutes);

      if (currentRouteLayer) map.removeLayer(currentRouteLayer);
      if (originMarker) map.removeLayer(originMarker);
      if (destinationMarker) map.removeLayer(destinationMarker);

      originMarker = L.marker([origin.lat, origin.lng])
        .addTo(map)
        .bindPopup(`<b>Origen:</b> ${originText}`)
        .openPopup();

      destinationMarker = L.marker([destination.lat, destination.lng])
        .addTo(map)
        .bindPopup(`<b>Destino:</b> ${destText}`);

      currentRouteLayer = L.geoJSON(data.geometry, {
        style: {
          color: '#007AFF',
          weight: 7,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }
      }).addTo(map);

      map.invalidateSize();
      map.fitBounds(currentRouteLayer.getBounds(), { padding: [50, 50] });

    } catch (err) {
      console.error('Route Fetch Error:', err);
      showToast(`Error de Mapa: ${err.message}`);
    } finally {
      setMapLoading(false);
    }
  };

  if (originCitySelect) originCitySelect.addEventListener('change', updateRouteOnMap);
  if (destinationCitySelect) destinationCitySelect.addEventListener('change', updateRouteOnMap);

  updateRouteOnMap();

  // Cálculo de presupuesto al enviar formulario
  if (tripForm) {
    tripForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideToast();

      const distanceKm = parseFloat(distanceKmInput ? distanceKmInput.value : 0);
      const durationMinutes = parseFloat(durationMinutesInput ? durationMinutesInput.value : 0) || 0;
      const passengers = parseInt(document.getElementById('passengers').value, 10) || 1;
      const tollCount = parseInt(document.getElementById('tollCount').value, 10) || 0;
      const vehicleEfficiency = parseFloat(document.getElementById('vehicleEfficiency').value) || 35.0;
      const fuelPricePerGallon = parseFloat(document.getElementById('fuelPricePerGallon').value) || 293.60;

      if (isNaN(distanceKm) || distanceKm <= 0) {
        showToast('Por favor ingresa una distancia válida mayor a 0 km.');
        return;
      }

      const payload = {
        distanceKm,
        durationMinutes,
        passengers,
        tollCount,
        vehicleEfficiency,
        fuelPricePerGallon
      };

      try {
        setLoadingState(true);

        const response = await fetch(`${getApiBaseUrl()}/api/trips/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const jsonResult = await response.json();

        if (!response.ok || !jsonResult.success) {
          throw new Error(jsonResult.message || `Error del servidor (${response.status})`);
        }

        const { summary, consumption, tolls, financials } = jsonResult.data;

        if (resTotalCost) resTotalCost.textContent = formatCurrencyDOP(financials.totalCostDOP);
        if (resCostPerPassenger) resCostPerPassenger.textContent = formatCurrencyDOP(financials.costPerPassengerDOP);
        if (resPassengerSubtext) resPassengerSubtext.textContent = `Dividido entre ${summary.passengers} ${summary.passengers === 1 ? 'persona' : 'personas'}`;
        
        if (resGallonsNeeded) resGallonsNeeded.textContent = `${consumption.gallonsNeeded} gal`;
        if (resFuelCostSubtext) resFuelCostSubtext.textContent = `${formatCurrencyDOP(financials.fuelCostDOP)} en gasolina`;
        
        if (resTotalTollCost) resTotalTollCost.textContent = formatCurrencyDOP(financials.tollCostDOP);
        if (resTollsSubtext) resTollsSubtext.textContent = `${tolls.tollCount} ${tolls.tollCount === 1 ? 'peaje en la ruta' : 'peajes en la ruta'}`;
        
        if (resDistance) resDistance.textContent = formatDistanceText(summary.distanceKm);
        if (resDurationSubtext) resDurationSubtext.textContent = `${formatDurationText(summary.durationMinutes)} de viaje`;

        if (resultsSection) resultsSection.classList.remove('hidden');
        switchTab('steps');

      } catch (err) {
        console.error('Calculation Error:', err);
        showToast(`Error al calcular presupuesto: ${err.message}`);
      } finally {
        setLoadingState(false);
      }
    });
  }
});
