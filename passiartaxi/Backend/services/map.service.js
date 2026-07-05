const axios = require("axios");
const captainModel = require("../models/captain.model");

const DEV_LOCATIONS = {
  "taiky str, ha noi": { ltd: 21.0285, lng: 105.8542 },
  "13 woodburn": { ltd: 21.0245, lng: 105.8412 },
  "43 hang bai": { ltd: 21.0267, lng: 105.8521 },
  "noi bai airport": { ltd: 21.2212, lng: 105.8072 },
  "west lake": { ltd: 21.0558, lng: 105.8342 },
};

const DEV_SUGGESTIONS = [
  "43 Hang Bai, Hoan Kiem, Ha Noi, Viet Nam",
  "Taiky str, Ha Noi, Viet Nam",
  "13 woodburn, Ha Noi, Viet Nam",
  "Noi Bai International Airport, Ha Noi, Viet Nam",
  "West Lake, Tay Ho, Ha Noi, Viet Nam",
];

function hasMapsApiKey() {
  return Boolean(process.env.GOOGLE_MAPS_API && process.env.GOOGLE_MAPS_API.trim());
}

function devCoordinateLookup(address) {
  const key = address.toLowerCase();
  for (const [needle, coords] of Object.entries(DEV_LOCATIONS)) {
    if (key.includes(needle)) {
      return coords;
    }
  }
  return { ltd: 21.0285, lng: 105.8542 };
}

module.exports.getAddressCoordinate = async (address) => {
  if (!hasMapsApiKey()) {
    return devCoordinateLookup(address);
  }

  const apiKey = process.env.GOOGLE_MAPS_API;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      const location = response.data.results[0].geometry.location;
      return {
        ltd: location.lat,
        lng: location.lng,
      };
    }
    throw new Error("Unable to fetch coordinates");
  } catch (error) {
    console.error(error.message);
    return devCoordinateLookup(address);
  }
};

module.exports.getDistanceTime = async (origin, destination) => {
  if (!origin || !destination) {
    throw new Error("Origin and destination are required");
  }

  if (!hasMapsApiKey()) {
    return {
      distance: { text: "4.2 km", value: 4200 },
      duration: { text: "12 mins", value: 720 },
      status: "OK",
    };
  }

  const apiKey = process.env.GOOGLE_MAPS_API;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
    origin
  )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      if (response.data.rows[0].elements[0].status === "ZERO_RESULTS") {
        throw new Error("No routes found");
      }
      return response.data.rows[0].elements[0];
    }
    throw new Error("Unable to fetch distance and time");
  } catch (err) {
    console.error(err.message);
    return {
      distance: { text: "4.2 km", value: 4200 },
      duration: { text: "12 mins", value: 720 },
      status: "OK",
    };
  }
};

module.exports.getAutoCompleteSuggestions = async (input) => {
  if (!input) {
    throw new Error("query is required");
  }

  if (!hasMapsApiKey()) {
    const query = input.toLowerCase();
    return DEV_SUGGESTIONS.filter((item) =>
      item.toLowerCase().includes(query)
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API;
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      return response.data.predictions
        .map((prediction) => prediction.description)
        .filter((value) => value);
    }
    throw new Error("Unable to fetch suggestions");
  } catch (err) {
    console.log(err.message);
    const query = input.toLowerCase();
    return DEV_SUGGESTIONS.filter((item) =>
      item.toLowerCase().includes(query)
    );
  }
};

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius, vehicleType) => {
  try {
    const captains = await captainModel.find({
      location: {
        $geoWithin: {
          $centerSphere: [[lng, ltd], radius / 6371],
        },
      },
      "vehicle.type": vehicleType,
    });
    return captains;
  } catch (error) {
    throw new Error("Error in getting captain in radius: " + error.message);
  }
};
