/**
 * SmartTrip RD - Base Express Server
 * 
 * Decoupled Architecture - Backend Entry Point
 * Handles environment configuration, static frontend serving, REST endpoints for health check,
 * Dominican Republic city list, OpenRouteService routing, and trip cost calculation.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { calculateTripCosts } = require('./services/calculator');
const { getRoute, DR_CITIES } = require('./services/routeService');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from the '../frontend' directory
app.use(express.static(path.join(__dirname, '../frontend')));

// ==========================================
// ROUTES & ENDPOINTS
// ==========================================

/**
 * @route   GET /api/health
 * @desc    Health check endpoint to verify server availability and uptime
 * @access  Public
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'SmartTrip RD API is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`
  });
});

/**
 * @route   GET /api/cities
 * @desc    Get preloaded Dominican Republic cities and coordinates
 * @access  Public
 */
app.get('/api/cities', (req, res) => {
  res.status(200).json({
    success: true,
    cities: DR_CITIES
  });
});

/**
 * @route   POST /api/trips/route
 * @desc    Get OpenRouteService routing geometry, distance, and duration between cities or coordinates
 * @access  Public
 */
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

/**
 * @route   POST /api/trips/calculate
 * @desc    Calculate fuel consumption, toll fees, total trip cost, and cost per passenger
 * @access  Public
 */
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

/**
 * @route   ALL *
 * @desc    404 handler for unhandled routes returning JSON error
 * @access  Public
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// ==========================================
// SERVER INITIALIZATION
// ==========================================

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`SmartTrip RD Server Active (Backend Module)`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`Route Endpoint: http://localhost:${PORT}/api/trips/route (POST)`);
  console.log(`Calculator Endpoint: http://localhost:${PORT}/api/trips/calculate (POST)`);
  console.log(`=================================`);
});
