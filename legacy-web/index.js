async function initMap() {
  // Request needed libraries.
  const { Map } = await google.maps.importLibrary("maps");
  const myLatlng = { lat: 39.8283, lng: -98.5795 };
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: myLatlng,
  });
  // Create the initial InfoWindow.
  let infoWindow = new google.maps.InfoWindow({
    content: "Click the map to get Lat/Lng!",
    position: myLatlng,
  });

  // Configure the click listener.
  map.addListener("click", (mapsMouseEvent) => {
    // Close the current InfoWindow.
    infoWindow.close();
    // Create a new InfoWindow.
    infoWindow = new google.maps.InfoWindow({
      position: mapsMouseEvent.latLng,
    });
    infoWindow.setContent(
      JSON.stringify(mapsMouseEvent.latLng.toJSON(), null, 2)
    );
    infoWindow.open(map);
    // Fill in lat/long inputs from map click
    document.getElementById("latitude").value =
      mapsMouseEvent.latLng.toJSON()["lat"];
    document.getElementById("longitude").value =
      mapsMouseEvent.latLng.toJSON()["lng"];
  });

  infoWindow.open(map);
}

function validate_coordinates(lat, lng) {
  const num_lat = Number(lat);
  const num_lng = Number(lng);
  if (lat === "" || lng === "" || isNaN(num_lat) || isNaN(num_lng)) {
    document.getElementById("search-message").innerHTML =
      "Coordinates must be a valid number";
    return false;
  } else if (num_lat < -90 || num_lat > 90) {
    document.getElementById("search-message").innerHTML =
      "Latitude must be between -90 and 90";
    return false;
  } else if (num_lng < -180 || num_lng > 180) {
    document.getElementById("search-message").innerHTML =
      "Longitude must be between -180 and 180";
    return false;
  } else {
    document.getElementById(
      "search-message"
    ).innerHTML = `Getting weather forecast for coordinates: (${lat}, ${lng})`;
    return true;
  }
}

async function get_grid_info(lat, lng) {
  // Fetch NWS API to get grid office and x/y coordinates
  try {
    // Setup URL
    const url = `https://api.weather.gov/points/${lat},${lng}`;
    // Pull data from API using lat,lng parameters
    const response = await fetch(url);

    // If the API response status code is not 200 (OK) then throw an error
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    // Place the response in a JSON
    const result = await response.json();
    // Parse the data to return the office, grid_x, and grid_y
    const office = result.properties.gridId;
    const grid_x = result.properties.gridX;
    const grid_y = result.properties.gridY;
    return [office, grid_x, grid_y];
  } catch (error) {
    // Display an error message if grid fetch fails
    document.getElementById("search-message").innerHTML =
      "Failed to get grid information.";
    console.error(error.message);
    return false;
  }
}

async function get_weather_forecast(grid_info) {
  // Fetch NWS API to get weather forecast
  try {
    // First check that the office and grid coordinates are set
    const [office, grid_x, grid_y] = grid_info;
    if (!(office && grid_x && grid_y)) {
      document.getElementById("search-message").innerHTML =
        "Grid information not set.";
      return new Map();
    }

    // Setup Forecast URL
    const url = `https://api.weather.gov/gridpoints/${office}/${grid_x},${grid_y}/forecast`;
    // Fetch the Weather forecast
    const response = await fetch(url);
    // If the API response status code is not 200 (OK) then throw an error
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    // Store the result in a JSON and return it
    const result = await response.json();
    return result;
  } catch (error) {
    document.getElementById("search-message").innerHTML =
      "Failed to get forecast information.";
    console.error(error.message);
    return false;
  }
}

async function display_forecast(forecast_data, grid_data, lat, lng) {
  // Check that there forecast data to parse
  if (!forecast_data) {
    document.getElementById("search-message").innerHTML =
      "No forecast data available.";
    return;
  }

  // Parse the JSON for the periods attribute
  const periods = forecast_data.properties.periods;
  if (!periods) {
    document.getElementById("search-message").innerHTML =
      "No forecast periods found.";
    console.error("No forecast periods found in JSON.");
    return;
  }

  const forecastContainer = document.getElementById("forecast");

  // Add forecast meta data div
  const metaContainer = document.createElement("div");
  metaContainer.id = "forecastmeta";
  forecastContainer.append(metaContainer);

  // Add the meta data elements to the div
  const office = grid_data[0];
  const grid_x = grid_data[1];
  const grid_y = grid_data[2];

  const forecast_info = document.createElement("p");
  forecast_info.innerHTML = `Weather forecast for (${lat}, ${lng})`;

  const grid_info = document.createElement("p");
  grid_info.innerHTML = `<strong>Office: </strong>${office}, <strong>Grid: </strong>(${grid_x}, ${grid_y})`;

  metaContainer.appendChild(forecast_info);
  metaContainer.appendChild(grid_info);

  // Create the divs for 5 periods within the forecast container
  const periodsContainer = document.createElement("div");
  periodsContainer.id = "forecast-periods";
  periods.slice(0, 5).forEach((period) => {
    const div = document.createElement("div");
    div.classList.add("period"); // add period class to each div

    // Set the data for each period
    div.innerHTML = `
            <h2>${period.name || "Unknown"}</h2>
            <p><strong>Temperature:</strong> ${period.temperature || "N/A"}°${
      period.temperatureUnit || "F"
    }</p>
            <p><strong>Wind:</strong> ${period.windSpeed || "N/A"} ${
      period.windDirection || "N/A"
    }</p>
            <p><strong>Forecast:</strong> ${period.shortForecast || "N/A"}</p>
        `;

    // Append to the container
    periodsContainer.appendChild(div);
  });

  // Then add the entire card grid
  forecastContainer.appendChild(periodsContainer);

  // Add animation to indicate forecast was successful
  const success_div = document.createElement("div");
  success_div.id = "success";
  forecastContainer.appendChild(success_div);
  const success_msg = document.createElement("p");
  success_msg.innerHTML = `<strong>Forecast completed successfully!</strong>`;
  success_div.append(success_msg);
}

async function run_forecast() {
  // Get lat/lng coordiantes
  const lat = document.getElementById("latitude").value;
  const lng = document.getElementById("longitude").value;

  // Display submit button until forecast is displayed or there is an error
  const submitBtn = document.getElementById("submit");
  submitBtn.disabled = true; // prevent double-clicks

  // Clear the forecast to place the new one
  document.getElementById("forecast").innerHTML = "";

  // Clear the search message to place the new one
  document.getElementById("search-message").innerHTML = "";

  // Step 0 — validate coordinates first
  if (!validate_coordinates(lat, lng)) {
    console.log("Invalid coordinates.");
    submitBtn.disabled = false;
    return false;
  }

  // Step 1 — get grid info
  const gridInfo = await get_grid_info(lat, lng);
  if (!gridInfo) {
    console.log("Failed to get grid info.");
    submitBtn.disabled = false;
    return false;
  }

  // Step 2 — get forecast JSON
  const forecastData = await get_weather_forecast(gridInfo);
  if (!forecastData) {
    console.log("Failed to get weather forecast.");
    submitBtn.disabled = false;
    return false;
  }

  // Step 3 — display it
  display_forecast(forecastData, gridInfo, lat, lng);
  document.getElementById("search-message").innerHTML = ""; // Remove the searching message
  submitBtn.disabled = false; // re-enable button
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submit");
  submitBtn.addEventListener("click", run_forecast);
});
