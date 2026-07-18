import { useState } from "react";
import MapComponent from "./MapComponent";
import Forecast from "./Forecast";

function App() {
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [submittedCoords, setSubmittedCoords] = useState(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Function to get browser location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setSearchMessage("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Position returned:", position.coords);
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCoords(newCoords);
        setSubmittedCoords(newCoords);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setSearchMessage("Location permission denied.");
            break;
          case error.POSITION_UNAVAILABLE:
            setSearchMessage("Location unavailable.");
            break;
          case error.TIMEOUT:
            setSearchMessage("Location request timed out.");
            break;
          default:
            setSearchMessage("Failed to get location.");
        }
      }
    );
  };

  return (
    <>
      <div id="header">
        <h1>Weather Forecast Application</h1>
        {/* Map component sets coordinates when clicked */}
        <MapComponent setCoords={setCoords} coords={coords} />
        <div className="coordinates">
          {/* Latitude Input */}
          <label htmlFor="latitude">Latitude</label>
          <input
            type="text"
            id="latitude"
            value={coords.lat}
            onChange={(e) => setCoords({ ...coords, lat: e.target.value })}
          />
          {/* Longitude Input */}
          <label htmlFor="longitude">Longitude</label>
          <input
            type="text"
            id="longitude"
            value={coords.lng}
            onChange={(e) => setCoords({ ...coords, lng: e.target.value })}
          />
          <div id="btns">
            <button
              onClick={() => setSubmittedCoords(coords)}
              disabled={loading}
              id="submit"
            >
              {loading ? "Loading..." : "Get Forecast"}
            </button>
            <button
              id="mylocation"
              onClick={getUserLocation}
              disabled={loading}
            >
              {loading ? "Loading..." : "Get My Location Forecast"}
            </button>
          </div>
        </div>
        {/* Message under the submit button */}
        {searchMessage && <p id="search-message">{searchMessage}</p>}
        <hr />
      </div>
      {/* Only show forecast AFTER clicking submit */}
      {submittedCoords && (
        <Forecast
          lat={submittedCoords.lat}
          lng={submittedCoords.lng}
          setSearchMessage={setSearchMessage}
          loading={loading}
          setLoading={setLoading}
        />
      )}
    </>
  );
}

export default App;
