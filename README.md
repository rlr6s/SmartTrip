# SmartTrip RD — Travel Planner & Budget Calculator

**SmartTrip RD** is a full-stack web application developed as an academic project for the Web Development / Software Architecture course at **Universidad APEC (UNAPEC)**.

The application helps users estimate the cost of traveling between cities in the Dominican Republic. It combines interactive maps, route information, fuel consumption estimates, toll expenses, and per-passenger cost calculations, displaying all financial results in Dominican pesos (DOP).

---

## Features

- **Route Planning:** Select origin and destination cities from a predefined list of Dominican cities.
- **Interactive Maps:** Visualize routes and locations using Leaflet.js.
- **Distance and Travel Time:** Retrieve route information through OpenRouteService (ORS).
- **Trip Cost Estimation:** Calculate estimated fuel expenses and toll costs.
- **Passenger Cost Breakdown:** Calculate total expenses and cost per passenger.
- **Customizable Parameters:** Adjust passenger count, fuel efficiency, fuel price, and toll settings.
- **Fallback Mechanism:** Uses the Haversine formula when OpenRouteService is unavailable or an API key is not configured.
- **REST API:** Separate backend endpoints for route retrieval and trip cost calculations.

---

## Project Architecture

SmartTrip RD follows a **decoupled client-server architecture**, separating the frontend interface from the backend business logic and REST API.

```text
SmartTrip-RD/
│
├── backend/
│   ├── services/
│   │   ├── calculator.js
│   │   └── routeService.js
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── front/
│   ├── app.js
│   ├── index.html
│   └── styles.css
│
├── .gitignore
└── README.md
```

### Backend

The backend handles API requests, route retrieval, input validation, and trip cost calculations.

- `server.js`: Express server and REST API endpoints.
- `services/calculator.js`: Business logic for fuel, toll, and passenger cost calculations.
- `services/routeService.js`: OpenRouteService integration and Haversine-based fallback mechanism.

### Frontend

The frontend provides the user interface and communicates with the backend through HTTP requests.

- `index.html`: Application structure.
- `styles.css`: Responsive interface styling.
- `app.js`: Application logic, API integration, and interactive map management.

---

## 🛠️ Technologies Used

### Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime environment |
| Express.js 4.22.2 | REST API development |
| Axios 1.19.0 | HTTP requests to external services |
| CORS 2.8.6 | Cross-origin resource sharing |
| Dotenv 16.6.1 | Environment variable management |
| Nodemon 3.1.14 | Automatic server restarting during development |

### Frontend

| Technology | Purpose |
|---|---|
| HTML5 | Web page structure |
| CSS3 | Responsive interface design |
| Vanilla JavaScript (ES6+) | Application logic and asynchronous operations |
| Fetch API | Backend communication |
| Leaflet.js 1.9.4 | Interactive maps |
| GeoJSON | Geographic data representation |

### External Services

- **OpenRouteService (ORS):** Route information, distance, travel time, and route geometry.
- **CARTO:** Map tile provider used with Leaflet.js.

---

## Installation and Setup

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/) (version 18 or higher recommended).
- npm (included with Node.js).
- [Visual Studio Code](https://code.visualstudio.com/).
- [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for VS Code.

### 1. Clone the repository

```bash
git clone https://github.com/rlr6s/SmartTrip.git
cd SmartTrip
```

### 2. Install backend dependencies

Navigate to the backend directory:

```bash
cd backend
```

Install the required packages:

```bash
npm install
```

### 3. Configure environment variables

Create your local `.env` file using the provided example:

```bash
cp .env.example .env
```

Configure the required variables in `backend/.env`:

```env
PORT=3000
OPENROUTESERVICE_API_KEY=your_openrouteservice_api_key_here
```

You can obtain an API key from [OpenRouteService](https://openrouteservice.org/).

**Note:** If a valid API key is not configured or OpenRouteService is unavailable, the application can use its integrated Haversine-based fallback to estimate distances.

Never commit your actual `.env` file or expose your API key.

### 4. Start the backend server

For development with automatic restarting:

```bash
npm run dev
```

Alternatively, start the server normally:

```bash
npm start
```

The backend will run at:

```text
http://localhost:3000
```

You can verify that the API is running by visiting:

```text
http://localhost:3000/api/health
```

### 5. Run the frontend

1. Open the project in Visual Studio Code.
2. Navigate to the `front/` directory.
3. Open `index.html`.
4. Right-click and select **Open with Live Server**.

The frontend will open in your browser, typically at:

```text
http://127.0.0.1:5500
```

Make sure the backend server is running while using the application.

---

## REST API Documentation

The backend exposes the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Checks API status and server uptime. |
| GET | `/api/cities` | Retrieves the predefined list of supported cities. |
| POST | `/api/trips/route` | Retrieves route geometry, distance, and estimated travel time. |
| POST | `/api/trips/calculate` | Calculates fuel expenses, toll costs, and per-passenger costs. |

### Example Requests

**Retrieve a route**

`POST /api/trips/route`

```json
{
  "originCity": "santo_domingo",
  "destinationCity": "santiago"
}
```

**Calculate trip expenses**

`POST /api/trips/calculate`

```json
{
  "distanceKm": 155.5,
  "durationMinutes": 135,
  "passengers": 4,
  "tollCount": 2
}
```

---

##  Academic Project

Developed as an individual academic project for the Web Development / Software Architecture course at **Universidad APEC (UNAPEC)**.

**Author:** Ronald Luis Rodriguez  
**Year:** 2026

---

## License

No open-source license has been assigned to this project yet.
