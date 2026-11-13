# DOCUMENTO TÉCNICO Y DOCUMENTACIÓN DE WEB SERVICES: SMARTTRIP RD

**Asignatura:** Desarrollo Web / Arquitectura de Software  
**Institución:** Universidad APEC (UNAPEC)  
**Proyecto:** SmartTrip RD — Planificador y Calculador de Presupuesto de Viajes en República Dominicana  
**Año:** 2026  

---

## ÍNDICE DEL DOCUMENTO

1. ¿De qué trata la aplicación?
2. ¿Qué es OpenRouteService (ORS) API y Leaflet.js?
3. Base del cálculo
4. Referencias y URLs de los Web Services
   - 4.1. Servicio propio
   - 4.2. Servicios externos consumidos
   - 4.3. Frontend consume el servicio
   - 4.4. URLs y Endpoints
5. Detalles de los servicios creados
6. Imagen de la pantalla inicial
7. Imagen de la pantalla luego de utilizar el Web Service de Calcular Ruta y Costos
8. Respuesta JSON del servicio de cálculo
9. Código completo del archivo de Web Service
10. Explicación del código completo del archivo de Web Service parte por parte
    - 10.1. Librerías importadas y configuración de Express
    - 10.2. Web Service 1: Health Check (`GET /api/health`) y diagnóstico
    - 10.3. Web Service 2: Listado de ciudades de RD (`GET /api/cities`)
    - 10.4. Web Service 3: Trazado de ruta (`POST /api/trips/route`) y validación
    - 10.5. Web Service 4: Calculador de costos (`POST /api/trips/calculate`) y validación
    - 10.6. Cálculo de galones de combustible necesarios
    - 10.7. Cálculo del costo de combustible en DOP
    - 10.8. Cálculo del costo de peajes en DOP
    - 10.9. Cálculo del presupuesto total del viaje en DOP
    - 10.10. Cálculo de la tarifa dividida por pasajero
    - 10.11. Consumo del servicio externo (OpenRouteService API) y Fallback Haversine
    - 10.12. Construcción de los parámetros del Payload JSON y manejo de respuestas
    - 10.13. Inicialización del servidor Express y Middleware CORS / JSON
    - 10.14. Cómo se consumen los servicios desde el frontend en `app.js`

---

## 1. ¿De qué trata la aplicación?

**SmartTrip RD** es una aplicación web *full-stack* de planificación vial diseñada específicamente para el contexto geográfico y económico de la República Dominicana. Su objetivo principal es permitir a los usuarios (conductores, viajeros interurbanos y familias) calcular el presupuesto financiero real necesario para viajar en vehículo privado entre diferentes provincias y ciudades del país.

La aplicación integra:
- **Mapa interactivo:** Visualización espacial de la geografía dominicana mediante **Leaflet.js**.
- **Cálculo de rutas y distancias viales:** Trazado de polígonos GeoJSON a lo largo de las autopistas nacionales mediante **OpenRouteService (ORS)**.
- **Calculador presupuestario en DOP:** Desglose automatizado del consumo de combustible en Pesos Dominicanos (DOP), peajes de las autopistas del país (como Autopista Duarte, Coral, Las Américas, etc.) y división equitativa del gasto total por cantidad de pasajeros.
- **Resiliencia técnica:** Algoritmo estimador basado en **Haversine** que actúa como motor de respaldo de alta disponibilidad si los servicios de mapas externos no están disponibles.

---

## 2. ¿Qué es OpenRouteService (ORS) API y Leaflet.js?

### OpenRouteService (ORS) API
**OpenRouteService** es un servicio web internacional basado en la base de datos abierta **OpenStreetMap (OSM)**. Proporciona servicios geográficos de enrutamiento API RESTful para vehículos, peatones y bicicletas. En SmartTrip RD se consume el endpoint `/v2/directions/driving-car` para:
- Recibir las coordenadas exactas `[longitud, latitud]` de la trayectoria por carretera.
- Obtener la distancia real de conducción en kilómetros y la duración estimada en minutos según las velocidades máximas de las autopistas dominicanas.

### Leaflet.js
**Leaflet.js** es una librería open-source en Vanilla JavaScript optimizada para renderizar mapas interactivos ligeros y responsivos en clientes web. En este proyecto se utiliza para:
- Inicializar el contenedor del mapa centrado en la República Dominicana (`18.7357, -70.1627`).
- Renderizar capas de azulejos (tiles) de OpenStreetMap.
- Dibujar capas GeoJSON dinámicas (`L.geoJSON`) que muestran la ruta seleccionada en color azul neón sobre el mapa.

---

## 3. Base del cálculo

La lógica de negocio de SmartTrip RD procesa los gastos viales mediante fórmulas financieras precisas basadas en los parámetros de entrada del usuario o en valores por defecto representativos del mercado dominicano:

### 1. Galones de combustible requeridos ($G$)
$$G = \frac{\text{Distancia (km)}}{\text{Rendimiento del Vehículo (km/gal)}}$$

### 2. Costo total de combustible en Pesos Dominicanos ($C_{\text{combustible}}$)
$$C_{\text{combustible}} = G \times \text{Precio por Galón en DOP}$$
*(Valor por defecto: RD$ 293.60 / galón de Gasolina Regular)*.

### 3. Costo total de peajes ($C_{\text{peajes}}$)
$$C_{\text{peajes}} = \text{Cantidad de Peajes} \times \text{Costo por Estación de Peaje}$$
*(Valor por defecto: RD$ 100.00 por estación de peaje en RD)*.

### 4. Presupuesto total del viaje ($C_{\text{total}}$)
$$C_{\text{total}} = C_{\text{combustible}} + C_{\text{peajes}}$$

### 5. Costo distribuido por pasajero ($C_{\text{pasajero}}$)
$$C_{\text{pasajero}} = \frac{C_{\text{total}}}{\text{Cantidad de Pasajeros}}$$

---

## 4. Referencias y URLs de los Web Services

### 4.1. Servicio propio
El servicio propio está construido sobre **Node.js** con el framework **Express.js** en una arquitectura desacoplada (*Decoupled REST API*). Se ejecuta localmente en el puerto `3000` (o el definido en las variables de entorno).

### 4.2. Servicios externos consumidos
1. **OpenRouteService API:**  
   `https://api.openrouteservice.org/v2/directions/driving-car`
2. **OpenStreetMap Tile Server:**  
   `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

### 4.3. Frontend consume el servicio
La capa cliente (`frontend/app.js`) realiza peticiones asíncronas HTTP utilizando la API nativa de JavaScript `window.fetch()` hacia el servidor local para realizar las consultas viales y el procesamiento financiero.

### 4.4. URLs y Endpoints
- **Salud del Servidor:** `GET http://localhost:3000/api/health`
- **Listado de Ciudades:** `GET http://localhost:3000/api/cities`
- **Trazado de Ruta:** `POST http://localhost:3000/api/trips/route`
- **Cálculo Financiero:** `POST http://localhost:3000/api/trips/calculate`

---

## 5. Detalles de los servicios creados

El backend se organiza en una arquitectura limpia dividida en módulos de responsabilidad única:

```text
backend/
├── services/
│   ├── calculator.js   # Servicio de cálculo financiero en DOP (Combustible, Peajes, Pasajeros)
│   └── routeService.js # Servicio de consumo de OpenRouteService API y Algoritmo Haversine
├── .env                # Configuración de variables de entorno (PORT, API Keys)
├── server.js           # Punto de entrada de la aplicación Express y definición de endpoints
└── package.json        # Manifiesto de dependencias (express, cors, axios, dotenv)
```

---

## 6. Imagen de la pantalla inicial

*(Descripción para inclusión en el reporte académico)*  
La pantalla inicial muestra una interfaz con tema oscuro y estilo *Glassmorphism*. En el panel izquierdo se presenta el formulario de configuración donde el usuario puede seleccionar la ciudad de origen (ej. Santo Domingo) y ciudad de destino (ej. Santiago de los Caballeros), junto con los parámetros opcionales de precio de combustible, eficiencia del vehículo y número de pasajeros. En el panel derecho se renderiza el mapa interactivo de Leaflet enfocado en la República Dominicana.

---

## 7. Imagen de la pantalla luego de utilizar el Web Service de Calcular Ruta y Costos

*(Descripción para inclusión en el reporte académico)*  
Tras pulsar el botón **"Planificar Viaje y Calcular Costos"**, el cliente ejecuta las llamadas a los Web Services `POST /api/trips/route` y `POST /api/trips/calculate`. En el mapa se dibuja la trayectoria vial en color azul neón uniendo ambas ciudades. Debajo del formulario se despliegan las tarjetas de resultados mostrando la distancia total (km), duración estimada (min), costo total del viaje en DOP, costo por pasajero, galones necesarios y desglose de peajes.

---

## 8. Respuesta JSON del servicio de cálculo

### Petición `POST /api/trips/calculate`
**Payload de entrada:**
```json
{
  "distanceKm": 163.7,
  "durationMinutes": 136,
  "fuelPricePerGallon": 293.60,
  "vehicleEfficiency": 35,
  "tollCount": 2,
  "tollPricePerBooth": 100,
  "passengers": 4
}
```

**Respuesta recibida (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "distanceKm": 163.7,
      "durationMinutes": 136,
      "passengers": 4
    },
    "breakdown": {
      "fuelCostDOP": 1373.06,
      "tollCostDOP": 200.00,
      "totalCostDOP": 1573.06,
      "costPerPassengerDOP": 393.27,
      "gallonsNeeded": 4.68,
      "currency": "DOP"
    },
    "consumption": {
      "vehicleEfficiencyKmPerGal": 35.0,
      "gallonsNeeded": 4.68,
      "fuelPricePerGallonDOP": 293.60
    },
    "tolls": {
      "tollCount": 2,
      "tollPricePerBoothDOP": 100.00,
      "totalTollCostDOP": 200.00
    },
    "financials": {
      "fuelCostDOP": 1373.06,
      "tollCostDOP": 200.00,
      "totalCostDOP": 1573.06,
      "costPerPassengerDOP": 393.27,
      "gallonsNeeded": 4.68,
      "currency": "DOP"
    }
  }
}
```

---

## 9. Código completo del archivo de Web Service

### 9.1. `backend/server.js` (Servidor Express Principal)
```javascript
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { calculateTripCosts } = require('./services/calculator');
const { getRoute, DR_CITIES } = require('./services/routeService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'SmartTrip RD API is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`
  });
});

app.get('/api/cities', (req, res) => {
  res.status(200).json({
    success: true,
    cities: DR_CITIES
  });
});

app.post('/api/trips/route', async (req, res) => {
  try {
    const { originCity, destinationCity, originCoords, destinationCoords } = req.body;

    let start = originCoords;
    let end = destinationCoords;

    if (!start && originCity && DR_CITIES[originCity]) {
      start = { lat: DR_CITIES[originCity].lat, lng: DR_CITIES[originCity].lng };
    }

    if (!end && destinationCity && DR_CITIES[destinationCity]) {
      end = { lat: DR_CITIES[destinationCity].lat, lng: DR_CITIES[destinationCity].lng };
    }

    const isValidCoords = (c) => c && typeof c.lat === 'number' && !isNaN(c.lat) && typeof c.lng === 'number' && !isNaN(c.lng);

    if (!isValidCoords(start) || !isValidCoords(end)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Origin and Destination coordinates or valid city keys with numeric lat and lng are required.'
      });
    }

    const routeData = await getRoute(start, end);

    return res.status(200).json({
      success: true,
      origin: start,
      destination: end,
      data: routeData
    });

  } catch (error) {
    console.error('Error in /api/trips/route:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch trip route geometry and metrics.'
    });
  }
});

app.post('/api/trips/calculate', (req, res) => {
  try {
    const {
      distanceKm,
      durationMinutes,
      fuelPricePerGallon,
      vehicleEfficiency,
      tollCount,
      tollPricePerBooth,
      passengers
    } = req.body;

    if (distanceKm === undefined || distanceKm === null) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: distanceKm is mandatory.'
      });
    }

    if (typeof distanceKm !== 'number' || isNaN(distanceKm) || distanceKm <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid distanceKm: must be a positive number.'
      });
    }

    const tripBreakdown = calculateTripCosts({
      distanceKm: Number(distanceKm),
      durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : 0,
      fuelPricePerGallon: fuelPricePerGallon !== undefined ? Number(fuelPricePerGallon) : undefined,
      vehicleEfficiency: vehicleEfficiency !== undefined ? Number(vehicleEfficiency) : undefined,
      tollCount: tollCount !== undefined ? Number(tollCount) : 0,
      tollPricePerBooth: tollPricePerBooth !== undefined ? Number(tollPricePerBooth) : undefined,
      passengers: passengers !== undefined ? Number(passengers) : 1
    });

    return res.status(200).json({
      success: true,
      data: tripBreakdown
    });

  } catch (error) {
    if (error.message && (error.message.startsWith('Invalid parameter') || error.message.startsWith('Missing required'))) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    console.error('Error in /api/trips/calculate:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'An error occurred while calculating trip costs.'
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`SmartTrip RD Server running on port ${PORT}`);
});
```

---

## 10. Explicación del código completo del archivo de Web Service parte por parte

### 10.1. Librerías importadas y configuración de Express
En las primeras líneas se importan las librerías necesarias:
- `dotenv`: Carga las variables de entorno desde `.env` (clave API y puerto).
- `express`: Framework para definir los endpoints HTTP.
- `cors`: Habilita solicitudes entre dominios (CORS).
- `path`: Resuelve rutas relativas del sistema de archivos para servir el frontend estático.
- Servicios propios (`calculateTripCosts`, `getRoute`, `DR_CITIES`): Módulos que encapsulan la lógica financiera y de enrutamiento.

### 10.2. Web Service 1: Health Check (`GET /api/health`) y diagnóstico
Endpoint ligero que permite monitorear el estado del servidor. Retorna código HTTP `200 OK` con la marca de tiempo actual (`ISOString`) y el tiempo transcurrido desde el inicio del servidor (`process.uptime()`).

### 10.3. Web Service 2: Listado de ciudades de RD (`GET /api/cities`)
Retorna el objeto JSON `DR_CITIES` que contiene las coordenadas geográficas `(lat, lng)` de las principales ciudades dominicanas (Santo Domingo, Santiago, Puerto Plata, Punta Cana, Barahona, etc.). Permite al frontend poblar los selectores dinámicamente.

### 10.4. Web Service 3: Trazado de ruta (`POST /api/trips/route`) y validación
1. Extrae del cuerpo de la petición (`req.body`) las ciudades o coordenadas de origen y destino.
2. Si se envían claves de ciudad (ej. `"santo_domingo"`), busca sus coordenadas en `DR_CITIES`.
3. Valida mediante la función `isValidCoords` que las coordenadas existan y sean números válidos. Si no se cumple, devuelve `400 Bad Request`.
4. Llama asíncronamente a `getRoute(start, end)` y devuelve la distancia, duración y la geometría en formato GeoJSON.

### 10.5. Web Service 4: Calculador de costos (`POST /api/trips/calculate`) y validación
Recibe los datos del viaje (`distanceKm`, `fuelPricePerGallon`, `vehicleEfficiency`, `tollCount`, `passengers`). Valida que `distanceKm` esté presente y sea un número estrictamente mayor que cero.

### 10.6. Cálculo de galones de combustible necesarios
En `services/calculator.js`, se calcula la cantidad de galones dividiendo la distancia en kilómetros entre el rendimiento del vehículo en kilómetros por galón:
```javascript
const gallonsNeeded = distanceKm / vehicleEfficiency;
```

### 10.7. Cálculo del costo de combustible en DOP
Multiplica los galones requeridos por el precio de la gasolina en DOP:
```javascript
const fuelCostDOP = gallonsNeeded * fuelPricePerGallon;
```

### 10.8. Cálculo del costo de peajes en DOP
Multiplica la cantidad de estaciones de peaje seleccionadas por la tarifa por caseta:
```javascript
const tollCostDOP = tollCount * tollPricePerBooth;
```

### 10.9. Cálculo del presupuesto total del viaje en DOP
Suma el costo total de combustible y el costo total de peajes:
```javascript
const totalCostDOP = fuelCostDOP + tollCostDOP;
```

### 10.10. Cálculo de la tarifa dividida por pasajero
Divide el costo total del viaje entre el número de ocupantes del vehículo:
```javascript
const costPerPassengerDOP = totalCostDOP / passengers;
```

### 10.11. Consumo del servicio externo (OpenRouteService API) y Fallback Haversine
En `services/routeService.js`:
1. Verifica si la clave `OPENROUTESERVICE_API_KEY` está configurada en `.env`.
2. Si está presente, realiza una petición GET con `axios` a OpenRouteService.
3. Si la clave no está presente o la petición falla por red o límite de cuotas, ejecuta la función `generateFallbackRoute()`, la cual calcula la distancia ortodrómica con la fórmula de **Haversine**, aplica un factor de curvatura del 22% para autopistas dominicanas y genera puntos intermedios para dibujar la polilínea en el mapa.

### 10.12. Construcción de los parámetros del Payload JSON y manejo de respuestas
El backend estructura la respuesta financiera redondeando a 2 decimales (`toFixed(2)`) y la retorna dentro de un objeto JSON con estructura `{ success: true, data: { ... } }`. En caso de error, captura la excepción y retorna códigos de estado semánticos (`400` para errores de cliente, `500` para errores de servidor).

### 10.13. Inicialización del servidor Express y Middleware CORS / JSON
Configura el puerto mediante `process.env.PORT || 3000` e inicia el servidor de escucha HTTP mediante `app.listen()`, imprimiendo en consola la URL del servidor y las rutas disponibles.

### 10.14. Cómo se consumen los servicios desde el frontend en `app.js`
En el cliente web (`frontend/app.js`), al hacer clic en el botón de calcular:
1. Lee los valores del formulario HTML.
2. Realiza un `fetch('/api/trips/route', { method: 'POST', body: JSON.stringify(...) })`.
3. Con la distancia obtenida, realiza una segunda llamada a `fetch('/api/trips/calculate', ...)`.
4. Recibe el GeoJSON y lo dibuja en el mapa con `L.geoJSON(data.geometry).addTo(map)`.
5. Actualiza el DOM de la página inyectando los valores financieros en Pesos Dominicanos formateados con `Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' })`.
