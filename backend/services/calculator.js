/**
 * SmartTrip RD - Trip Cost Calculator Service
 * 
 * Clean Architecture Business Logic Layer
 * Contains pure functions for calculating trip economics in Dominican Republic (DOP).
 */

// Default constants for Dominican Republic context
const DEFAULT_FUEL_PRICE_DOP = 293.60; // Approximate price per gallon in DOP (Gasolina Regular)
const DEFAULT_KM_PER_GALLON = 35.0;     // Average vehicle fuel efficiency (km/gal)
const DEFAULT_TOLL_PRICE_DOP = 100.0;   // Average toll booth fee in DOP
const DEFAULT_PASSENGERS = 1;

/**
 * Calculates trip fuel requirements, total financial cost, and per-passenger breakdown.
 * 
 * @param {Object} params
 * @param {number} params.distanceKm - Total route distance in kilometers (required)
 * @param {number} [params.durationMinutes] - Estimated trip duration in minutes
 * @param {number} [params.fuelPricePerGallon] - Fuel price per gallon in DOP
 * @param {number} [params.vehicleEfficiency] - Vehicle fuel efficiency in km/gallon
 * @param {number} [params.tollCount] - Number of toll booths on the route
 * @param {number} [params.tollPricePerBooth] - Cost per toll booth in DOP
 * @param {number} [params.passengers] - Number of passengers sharing the trip
 * 
 * @returns {Object} Calculated trip costs breakdown
 */
function calculateTripCosts({
  distanceKm,
  durationMinutes = 0,
  fuelPricePerGallon = DEFAULT_FUEL_PRICE_DOP,
  vehicleEfficiency = DEFAULT_KM_PER_GALLON,
  tollCount = 0,
  tollPricePerBooth = DEFAULT_TOLL_PRICE_DOP,
  passengers = DEFAULT_PASSENGERS
}) {
  // 1. Parameter Validation
  if (typeof distanceKm !== 'number' || isNaN(distanceKm) || distanceKm <= 0) {
    throw new Error('Invalid parameter: distanceKm must be a positive number.');
  }

  if (typeof vehicleEfficiency !== 'number' || isNaN(vehicleEfficiency) || vehicleEfficiency <= 0) {
    throw new Error('Invalid parameter: vehicleEfficiency must be greater than zero.');
  }

  if (typeof fuelPricePerGallon !== 'number' || isNaN(fuelPricePerGallon) || fuelPricePerGallon < 0) {
    throw new Error('Invalid parameter: fuelPricePerGallon must be a non-negative number.');
  }

  if (typeof tollCount !== 'number' || isNaN(tollCount) || tollCount < 0) {
    throw new Error('Invalid parameter: tollCount must be a non-negative integer.');
  }

  if (typeof passengers !== 'number' || isNaN(passengers) || passengers < 1) {
    throw new Error('Invalid parameter: passengers must be at least 1.');
  }

  // 2. Perform Financial Calculations
  const gallonsNeeded = distanceKm / vehicleEfficiency;
  const fuelCostDOP = gallonsNeeded * fuelPricePerGallon;
  const tollCostDOP = tollCount * tollPricePerBooth;
  const totalCostDOP = fuelCostDOP + tollCostDOP;
  const costPerPassengerDOP = totalCostDOP / passengers;

  const breakdown = {
    fuelCostDOP: Number(fuelCostDOP.toFixed(2)),
    tollCostDOP: Number(tollCostDOP.toFixed(2)),
    totalCostDOP: Number(totalCostDOP.toFixed(2)),
    costPerPassengerDOP: Number(costPerPassengerDOP.toFixed(2)),
    gallonsNeeded: Number(gallonsNeeded.toFixed(2)),
    currency: 'DOP'
  };

  // 3. Return Formatted & Rounded Financial Breakdown
  return {
    summary: {
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMinutes: Math.round(durationMinutes),
      passengers: Math.floor(passengers)
    },
    breakdown,
    consumption: {
      vehicleEfficiencyKmPerGal: Number(vehicleEfficiency.toFixed(1)),
      gallonsNeeded: Number(gallonsNeeded.toFixed(2)),
      fuelPricePerGallonDOP: Number(fuelPricePerGallon.toFixed(2))
    },
    tolls: {
      tollCount: Math.floor(tollCount),
      tollPricePerBoothDOP: Number(tollPricePerBooth.toFixed(2)),
      totalTollCostDOP: Number(tollCostDOP.toFixed(2))
    },
    financials: breakdown
  };
}

module.exports = {
  calculateTripCosts,
  DEFAULT_FUEL_PRICE_DOP,
  DEFAULT_KM_PER_GALLON,
  DEFAULT_TOLL_PRICE_DOP
};
