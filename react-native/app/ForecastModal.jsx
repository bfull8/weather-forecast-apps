import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

///////////////////////////////////////////////
// -------- Forecast Card Component -------- //
///////////////////////////////////////////////
function ForecastCard({ period }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{period.name}</Text>

      <Text style={styles.cardTemp}>{period.temperature}°F</Text>

      <Text style={styles.cardShort}>{period.shortForecast}</Text>

      <View style={styles.divider} />

      <Text style={styles.cardWind}>
        Wind: {period.windSpeed} {period.windDirection}
      </Text>
    </View>
  );
}

// -------- Main Forecast Modal -------- //
export default function ForecastModal({
  modalVisible,
  onClose,
  lat,
  lng,
  office,
  gridX,
  gridY,
  forecast,
  loading,
}) {
  const periods = forecast?.properties?.periods || [];
  return (
    <Modal visible={modalVisible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Close Button - On press, set modalVisibile to false*/}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>

          {/* Show Loading if true */}
          {loading || !forecast ? (
            <View style={styles.container}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingtext}>
                Getting weather forecast for ({lat}, {lng})
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <Text style={styles.title}>5-Period Forecast</Text>

              <View style={styles.row}>
                <Text style={styles.bold}>Lat: </Text>
                <Text>{lat}, </Text>
                <Text style={styles.bold}>Lng: </Text>
                <Text>{lng}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.bold}>Office: </Text>
                <Text>{office} </Text>
                <Text style={styles.bold}>Grid: </Text>
                <Text>
                  ({gridX},{gridY})
                </Text>
              </View>

              {/* Forecast Cards */}
              {periods.slice(0, 5).map((p, index) => (
                <ForecastCard key={index} period={p} />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

{
  /* Styles */
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    height: "90%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
  },

  // Close button
  closeBtn: {
    alignSelf: "flex-end",
    marginBottom: 10,
    padding: 6,
  },
  closeText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },

  // Header
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
  },
  bold: {
    fontWeight: "700",
  },

  // Forecast Card
  card: {
    marginTop: 10,
    backgroundColor: "#F5F5F7",
    padding: 15,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardTemp: {
    fontSize: 36,
    fontWeight: "700",
  },
  cardShort: {
    fontSize: 16,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  cardWind: {
    fontSize: 14,
    color: "#555",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingtext: {
    fontSize: 16,
    fontWeight: 300,
  },
});
