# 📍 SmartTrip RD - Planificador y Calculador de Presupuesto de Viajes

> **Proyecto Académico** desarrollado para la asignatura de **Desarrollo Web / Arquitectura de Software** — **Universidad APEC (UNAPEC)**.

SmartTrip RD es una aplicación web full-stack diseñada para la República Dominicana que permite a los usuarios calcular el costo total estimado de viajar entre ciudades del país. Integra mapa interactivo con **Leaflet.js**, cálculo de distancia y rutas mediante **OpenRouteService (ORS)**, consumo de peajes, consumo de combustible en pesos dominicanos (DOP), y desglose de gastos por pasajero.

---

## 🏗️ Arquitectura Desacoplada del Proyecto

El proyecto sigue una arquitectura **Clean Architecture & Decoupled Client-Server**:

```text
Smarttrip/
├── backend/                 # Módulo del Servidor API RESTful (Node.js & Express)
│   ├── services/            # Capa de Lógica de Negocio
│   │   ├── calculator.js    # Servicio de cálculo de combustible, peajes y costos en DOP
│   │   └── routeService.js  # Integración con OpenRouteService API y algoritmo Haversine
│   ├── .env                 # Variables de entorno locales (PORT, OPENROUTESERVICE_API_KEY)
│   ├── .env.example         # Plantilla de configuración de variables de entorno
│   ├── node_modules/        # Dependencias del servidor Node.js
│   ├── package.json         # Scripts de inicio y manifiesto de paquetes backend
│   ├── package-lock.json    # Lockfile de versiones de dependencias
│   └── server.js            # Punto de entrada del servidor Express y rutas API
├── frontend/                # Módulo de Interfaz de Usuario (Cliente)
│   ├── app.js               # Orquestación de mapa Leaflet.js, formateo e integración Fetch
│   ├── index.html           # Estructura de la aplicación web y contenedor del mapa
│   └── styles.css           # Tema oscuro moderno con Glassmorphism y CSS Grid responsivo
├── .gitignore               # Reglas de exclusión para Git (node_modules, .env)
└── README.md                # Documentación oficial del proyecto
```

---

## 🛠️ Tecnologías Utilizadas

### Backend (`backend/`)
* **Node.js**: Entorno de ejecución para JavaScript en el servidor.
* **Express.js** (`v4.21.2`): Framework web minimalista para la construcción de la API RESTful.
* **Axios** (`v1.7.9`): Cliente HTTP basado en promesas para consumir la API de OpenRouteService.
* **CORS** (`v2.8.5`): Middleware para permitir peticiones seguras entre dominios cruzados.
* **Dotenv** (`v16.4.7`): Carga dinámica de variables de entorno desde `backend/.env`.
* **Nodemon** (`v3.1.9`): Herramienta de desarrollo para reinicio automático del servidor.

### Frontend (`frontend/`)
* **HTML5**: Estructura semántica de la interfaz.
* **CSS3**: Diseño responsivo avanzado con CSS Grid, Flexbox, variables CSS y estilo Glassmorphism.
* **Vanilla JavaScript (ES6+)**: Lógica del cliente, manejo asíncrono con `async/await`, consumo de Fetch API y formateo dinámico (`Intl.NumberFormat`).
* **Leaflet.js** (`v1.9.4`): Librería open-source para mapas interactivos y representación de capas GeoJSON.

---

## 🚀 Instalación y Ejecución Paso a Paso

### 1. Requisitos Previos
- Tener instalado **Node.js** (versión 16.x o superior).
- Tener instalado **npm** (incluido con Node.js).

### 2. Navegar al Módulo del Backend
```bash
cd Smarttrip/backend
```

### 3. Instalar Dependencias del Backend
Ejecuta el siguiente comando para instalar las dependencias dentro de `backend/`:
```bash
npm install
```

### 4. Configurar Variables de Entorno
Crea un archivo `.env` dentro de `backend/` basándote en `.env.example`:
```bash
cp .env.example .env
```
Contenido de `backend/.env`:
```env
PORT=3000
OPENROUTESERVICE_API_KEY=your_openrouteservice_api_key_here
```
*(Nota: Si no se proporciona una clave válida de OpenRouteService, el sistema utilizará automáticamente el **Algoritmo Estimador Haversine** integrado para garantizar la funcionalidad del mapa sin interrupciones).*

### 5. Iniciar el Servidor de Desarrollo
Ejecuta el script de desarrollo con autorecarga (`nodemon`):
```bash
npm run dev
```

Salida esperada en consola:
```text
=================================
🚀 SmartTrip RD Server Active (Backend Module)
📡 URL: http://localhost:3000
🏥 Health Check: http://localhost:3000/api/health
🗺️ Route Endpoint: http://localhost:3000/api/trips/route (POST)
🧮 Calculator Endpoint: http://localhost:3000/api/trips/calculate (POST)
=================================
```

### 6. Acceder a la Aplicación Frontend
El servidor Express sirve automáticamente los archivos estáticos de `frontend/`. Abre tu navegador e ingresa a:
[http://localhost:3000](http://localhost:3000)

---

## 📡 Documentación de Endpoints del API REST

| Método | Endpoint | Descripción | Payload de Entrada (JSON) | Respuesta (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Diagnóstico de salud e informe de tiempo de actividad | Ninguno | `{ "status": "OK", "uptime": "...", "timestamp": "..." }` |
| `GET` | `/api/cities` | Obtiene el diccionario de ciudades dominicanas | Ninguno | `{ "success": true, "cities": { "santo_domingo": {...} } }` |
| `POST` | `/api/trips/route` | Trazado de ruta y cálculo de distancia/tiempo | `{ "originCity": "santo_domingo", "destinationCity": "santiago" }` | `{ "success": true, "data": { "distanceKm": 163.7, "durationMinutes": 136, "geometry": {...} } }` |
| `POST` | `/api/trips/calculate` | Cálculo de costos de combustible, peajes y por pasajero | `{ "distanceKm": 155.5, "durationMinutes": 135, "passengers": 4, "tollCount": 2 }` | `{ "success": true, "data": { "financials": { "totalCostDOP": 1504.42, "costPerPassengerDOP": 376.11 } } }` |

---

## 🎓 Créditos Académicos

Proyecto universitario desarrollado para la asignatura de **Desarrollo Web / Arquitectura de Software** en la **Universidad APEC (UNAPEC)**.

**Autor**: Estudiante UNAPEC  
**Año**: 2026  
**Licencia**: ISC
