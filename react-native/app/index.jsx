import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import ForecastModal from "./ForecastModal";

export default function Index() {
  // Forecast States needed to show in the forecast
  const [coords, setCoords] = useState({
    latitude: "",
    longitude: "",
  });
  const [office, setOffice] = useState("");
  const [gridX, setGridX] = useState(0);
  const [gridY, setGridY] = useState(0);
  const [forecastData, setForecastData] = useState(null);

  // Helper states
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Event handlers for a tap on the MapView
  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCoords({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
    });
  };
  const handleLatChange = (text) => {
    setCoords((prev) => ({ ...prev, latitude: text }));
  };
  const handleLonChange = (text) => {
    setCoords((prev) => ({ ...prev, longitude: text }));
  };

  // --------------------------------------
  // VALIDATE COORDINATES
  // --------------------------------------
  function validateCoordinates(lat, lng) {
    const numLat = Number(lat);
    const numLng = Number(lng);

    if (isNaN(numLat) || isNaN(numLng)) {
      setErrorMessage(
        "Invalid coordinate values. Check latitude and longitude."
      );
      return false;
    }

    if (numLat < -90 || numLat > 90) {
      setErrorMessage("Latitude must be between -90 and 90.");
      return false;
    }

    if (numLng < -180 || numLng > 180) {
      setErrorMessage("Longitude must be between -180 and 180.");
      return false;
    }

    return true;
  }

  // --------------------------------------
  // GET GRID INFO
  // --------------------------------------
  async function getGridInfo(lat, lng) {
    // Fetch NWS API to get grid office and x/y coordinates
    try {
      // Setup URL
      const url = `https://api.weather.gov/points/${lat},${lng}`;
      // Pull data from API using lat,lng parameters
      const response = await fetch(url);

      // If the API response status code is not 200 (OK) then throw an error
      if (!response.ok) {
        setErrorMessage("Failed to retrieve grid information");
        return null;
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
      setErrorMessage("Failed to retrieve grid information.");
      console.error(error.message);
      return null;
    }
  }

  // --------------------------------------
  // GET WEATHER FORECAST
  // --------------------------------------
  async function getWeatherForecast(office, grid_x, grid_y) {
    // Fetch NWS API to get weather forecast
    try {
      // First check that the office and grid coordinates are set
      if (!(office && grid_x && grid_y)) {
        setErrorMessage("Failed to retrieve grid information.");
      }

      // Setup Forecast URL
      const url = `https://api.weather.gov/gridpoints/${office}/${grid_x},${grid_y}/forecast`;
      // Fetch the Weather forecast
      const response = await fetch(url);
      // If the API response status code is not 200 (OK) then throw an error
      if (!response.ok) {
        setErrorMessage("Failed to retrieve forecast information");
        return null;
      }
      // Store the result in a JSON and return it
      const result = await response.json();
      return result;
    } catch (error) {
      setErrorMessage("Failed to retrieve forecast information.");
      console.error(error.message);
      return false;
    }
  }

  // --------------------------------------
  // FETCH FORECAST DRIVER
  // --------------------------------------
  async function fetchForecast() {
    // Reset
    setErrorMessage("");
    setForecastData(null);
    setLoading(true);

    // Step 1 — Validate coordinates
    if (!validateCoordinates(coords.latitude, coords.longitude)) {
      setLoading(false);
      return;
    }

    // Step 2 - Show the forecast Modal
    setModalVisible(true);

    // Step 3 - Get Grid Info
    const grid = await getGridInfo(coords.latitude, coords.longitude);
    if (!grid) {
      setLoading(false);
      setModalVisible(false);
      return;
    }

    // Step 4 — Fetch forecast
    const forecast = await getWeatherForecast(grid[0], grid[1], grid[2]);
    if (!forecast) {
      setErrorMessage("Failed to retrieve forecast information.");
      setLoading(false);
      setModalVisible(false);
      return;
    }
    if (!forecast.properties?.periods) {
      setErrorMessage("Failed to get forecast periods.");
      setLoading(false);
      setModalVisible(false);
      return;
    }
    // Set state variables
    setOffice(grid[0]);
    setGridX(grid[1]);
    setGridY(grid[2]);
    setForecastData(forecast);
    setLoading(false);
  }
  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.container}>
          {/* React Native MapView Component */}
          <MapView
            style={styles.map}
            onPress={handleMapPress}
            initialRegion={{
              latitude: 39.5,
              longitude: -98.35,
              latitudeDelta: 55,
              longitudeDelta: 55,
            }}
          />
          {/* Text Inputs for Latitude and Longitude */}
          <View style={styles.inputsWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Latitude"
              value={coords.latitude}
              onChangeText={handleLatChange}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Longitude"
              value={coords.longitude}
              onChangeText={handleLonChange}
              placeholderTextColor="#999"
            />
          </View>
          {/* Button to display the forecat modal */}
          <TouchableOpacity
            style={styles.forecastbtn}
            onPress={() => {
              // forecast logic here
              fetchForecast(coords.latitude, coords.longitude);
            }}
          >
            <Text style={styles.forecastbtnText}>Get Forecast</Text>
          </TouchableOpacity>

          {errorMessage !== "" && (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          )}
        </View>
      </SafeAreaView>
      {/* Pass required forecast information to forecast modal
        Allow the modal to know whether it should be visible witht the modalVisible state
        Pressing the close button will set the state to false
      */}
      <ForecastModal
        modalVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        lat={coords.latitude}
        lng={coords.longitude}
        office={office}
        gridX={gridX}
        gridY={gridY}
        forecast={forecastData}
        loading={loading}
      />
    </>
  );
}

{
  /* Styles */
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "transparent",
    alignItems: "center",
    width: "100%",
  },
  map: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
  },
  inputsWrapper: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    fontSize: 16,
  },
  forecastbtn: {
    backgroundColor: "#34C759",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignSelf: "center", // makes it not stretch full width
    marginVertical: 10,
  },

  forecastbtnText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  errorMessage: {
    color: "red",
    justifyContent: "center",
    alignItems: "center",
  },
});
