import { useEffect, useState } from "react";
import Loading from "./Loading";

const Forecast = ({ lat, lng, setSearchMessage, loading, setLoading }) => {
  const [gridInfo, setGridInfo] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  // --------------------
  // VALIDATE COORDINATES
  // --------------------
  function validateCoordinates(lat, lng) {
    const num_lat = Number(lat);
    const num_lng = Number(lng);
    if (lat === "" || lng === "" || isNaN(num_lat) || isNaN(num_lng)) {
      setSearchMessage("Coordinates must be a valid number");
      return false;
    } else if (num_lat < -90 || num_lat > 90) {
      setSearchMessage("Latitude must be between -90 and 90");
      return false;
    } else if (num_lng < -180 || num_lng > 180) {
      setSearchMessage("Longitude must be between -180 and 180");
      return false;
    } else {
      return true;
    }
  }

  // --------------------
  // FETCH GRID INFO
  // --------------------
  async function getGridInfo(lat, lng) {
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
      setSearchMessage("Failed to get grid information.");
      console.error(error.message);
      return false;
    }
  }

  // --------------------
  // FETCH FORECAST
  // --------------------
  async function getWeatherForecast(grid_info) {
    // Fetch NWS API to get weather forecast
    try {
      // First check that the office and grid coordinates are set
      const [office, grid_x, grid_y] = grid_info;
      if (!(office && grid_x && grid_y)) {
        setSearchMessage("Failed to get grid information.");
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
      setSearchMessage("Failed to get forecast information.");
      console.error(error.message);
      return false;
    }
  }

  // --------------------
  // MAIN FORECAST EFFECT
  // Runs whenever lat/lng changes
  // --------------------
  useEffect(() => {
    async function fetchForecast() {
      // Reset old data
      setForecastData(null);
      setGridInfo(null);

      // Step 1: Validate coordinates
      if (!validateCoordinates(lat, lng)) {
        return;
      }

      // Loading State
      setLoading(true);
      setSearchMessage(
        `Getting weather forecast for (${Number(lat).toFixed(4)}, ${Number(
          lng
        ).toFixed(4)})`
      );

      // Step 2: Get grid info
      const grid = await getGridInfo(lat, lng);
      if (!grid) {
        setSearchMessage("Failed to get grid information.");
        setLoading(false);
        return;
      }
      setGridInfo(grid);

      // Step 3: Get weather forecast
      const forecast = await getWeatherForecast(grid);
      if (!forecast) {
        setSearchMessage("Failed to get forecast information.");
        setLoading(false);
        return;
      }
      if (!forecast.properties?.periods) {
        setSearchMessage("Failed to get forecast periods.");
        setLoading(false);
        return;
      }

      setForecastData(forecast);
      setLoading(false);
      setSearchMessage(""); // Clear loading message
    }

    fetchForecast();
  }, [lat, lng, setSearchMessage, setLoading]);

  if (loading) {
    return <Loading />;
  }
  if (!forecastData) return null;

  // Variables needed for forecast
  const office = gridInfo[0];
  const grid_x = gridInfo[1];
  const grid_y = gridInfo[2];
  const periods = forecastData.properties.periods;
  // If a forecast is successfully returned, render the elements below
  return (
    <div id="forecast">
      <div id="forecastmeta">
        <p>
          Weather forecast for ({Number(lat).toFixed(4)},{" "}
          {Number(lng).toFixed(4)})
        </p>
        <p>
          <strong>Office: </strong>
          {office}, <strong>Grid: </strong>({grid_x}, {grid_y})
        </p>
      </div>
      <div id="forecast-periods">
        {periods.slice(0, 5).map((p, i) => (
          <div key={i} className="period">
            <h2>{p.name || "Unknown"}</h2>
            <p>
              <strong>Temperature:</strong> {p.temperature || "N/A"}°
              {p.temperatureUnit || "F"}
            </p>
            <p>
              <strong>Wind:</strong> {p.windSpeed || "N/A"}{" "}
              {p.windDirection || "N/A"}
            </p>
            <p>
              <strong>Forecast:</strong> {p.shortForecast || "N/A"}
            </p>
          </div>
        ))}
      </div>
      <div id="success">
        <p>
          <strong>Forecast completed successfully!</strong>
        </p>
      </div>
    </div>
  );
};

export default Forecast;
