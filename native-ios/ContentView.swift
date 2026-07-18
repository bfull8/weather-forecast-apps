//
//  ContentView.swift
//  week6
//
//  Created by Ben Fullenkamp on 12/2/25.
//

import SwiftUI
import MapKit

// -------------------------
// getGridInfo JSON structs
// -------------------------
// Inner keys inside properties
struct GridInfo: Decodable {
    let gridId: String
    let gridX: Int
    let gridY: Int
}

// Top level properties key
struct PointsResponse: Decodable {
    let properties: GridInfo
}

// -------------------------------
// getWeatherForecast JSON structs
// -------------------------------
// Inner keys inside period
struct ForecastPeriodItem: Decodable {
    let name: String
    let temperature: Int
    let windSpeed: String
    let windDirection: String
    let shortForecast: String
}
// Period items inside properties (array)
struct ForecastProperties: Decodable {
    let periods: [ForecastPeriodItem]
}
// Properties key
struct ForecastResponse: Decodable {
    let properties: ForecastProperties
}

struct ContentView: View {
    
    // Variables to display in the body and forecast modal
    @State private var latitude: String = ""
    @State private var longitude: String = ""
    @State private var office: String = ""
    @State private var gridX: Int = 0
    @State private var gridY: Int = 0
    @State private var forecastData: ForecastResponse? = nil
    
    // Controls view of camera on map
    @State private var camera: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 39.5, longitude: -98.35),
            span: MKCoordinateSpan(latitudeDelta: 55, longitudeDelta: 55)
        )
    )
    
    // Controls Forecast Sheet and error messages
    @State private var showForecast: Bool = false
    @State private var errorMessage: String = ""
    @State private var loading: Bool = false
    
    // --------------------
    // VALIDATE COORDINATES
    // --------------------
    func validateCoordinates(lat: String, lng: String) -> Bool {
        guard let numLat = Double(lat),
              let numLng = Double(lng) else {
            errorMessage = "Invalid coordinate values. Check latitude and longitude."
            return false
        }
        
        guard (-90...90).contains(numLat) else {
            errorMessage = "Latitude must be between -90 and 90."
            return false
        }
        guard (-180...180).contains(numLng) else {
            errorMessage = "Longtiude must be between -180 and 180."
            return false
        }
        
        return true
    }
    
    // --------------------
    // Get Grid Info
    // --------------------
    func getGridInfo(lat: String, lng: String) async throws -> (String, Int, Int) {
        // Set up URL String
        let urlString = "https://api.weather.gov/points/\(lat),\(lng)"
        // Store as a URL
        guard let url = URL(string: urlString) else {
            throw URLError(.badURL)
        }
        // Store the data and response
        let (data, response) = try await URLSession.shared.data(from: url)
        // If error code is returned, display error message in console
        guard let http = response as? HTTPURLResponse,
              (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        // Decode JSON into a swift struct
        let result = try JSONDecoder().decode(PointsResponse.self, from: data)
        
        // Store in state variables
        office = result.properties.gridId
        gridX = result.properties.gridX
        gridY = result.properties.gridY
        
        //Return the grid office + x and y coordinates
        return (result.properties.gridId,
                result.properties.gridX,
                result.properties.gridY)
    }
    
    
    // --------------------
    // Get Weather Forecast
    // --------------------
    func getWeatherForecast(office: String, gridX: Int, gridY: Int) async throws -> ForecastResponse {
        // Set up URL String
        let urlString = "https://api.weather.gov/gridpoints/\(office)/\(gridX),\(gridY)/forecast"
        // Store as a URL
        guard let url = URL(string: urlString) else {
            throw URLError(.badURL)
        }
        // Store the data and response
        let (data, response) = try await URLSession.shared.data(from: url)
        // If error code is returned, display error message in console
        guard let http = response as? HTTPURLResponse,
              (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        // Decode JSON into Swift structs
        let forecast = try JSONDecoder().decode(ForecastResponse.self, from: data)
        
        // Return the forecast struct
        return forecast
    }
    
    // --------------------
    // fetchForecast Driver
    // --------------------
    func fetchForecast() {
        Task {
            // Reset error and forecast - begin loading
            errorMessage = ""
            loading = true
            forecastData = nil
            
            // STEP 1 — validate coords. Sets error message in the function
            guard validateCoordinates(lat: latitude, lng: longitude) else {
                loading = false
                return
            }
            
            // STEP 2 - Show Forecast Sheet
            showForecast = true
            
            // STEP 3 - Get the Grid Info. Return an error if not found
            do {
                (office, gridX, gridY) = try await getGridInfo(lat: latitude, lng: longitude)
            } catch {
                errorMessage = "Failed to retrieve grid information"
                loading = false
                showForecast = false
                return
            }
                
            // STEP 4 — Get the Weather Forecast and - return error if failed to fetch
            do {
                let result = try await getWeatherForecast(office: office, gridX: gridX, gridY: gridY)
                forecastData = result
            } catch {
                errorMessage = "Failed to fetch forecast"
                loading = false
                showForecast = false
                return
            }
        
            // STEP 5 — validate forecast content
            if forecastData == nil {
                errorMessage = "Failed to get forecast information"
                loading = false
                return
            }
            if forecastData?.properties.periods == nil {
                errorMessage = "Failed to get forecast periods"
                loading = false
                return
            }
            loading = false
        }
    }
    
    var body: some View {
        VStack {
            // ---- Top Half: Map ----
            MapReader { proxy in
                Map(position: $camera)
                    .frame(maxHeight: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .contentShape(Rectangle())
                    .highPriorityGesture(
                        DragGesture(minimumDistance: 0)
                            .onEnded { value in
                                let location = value.location
                                if let coordinate = proxy.convert(location, from: .local) {
                                    latitude  = String(format: "%.6f", coordinate.latitude)
                                    longitude = String(format: "%.6f", coordinate.longitude)
                                    
                                }
                            }
                    )
            }
            .padding()
            
            // ---- Text Inputs ----
            HStack {
                TextField("Latitude", text: $latitude)
                    .textFieldStyle(.roundedBorder)
                
                TextField("Longitude", text: $longitude)
                    .textFieldStyle(.roundedBorder)
            }
            .padding(.horizontal)
            
            // ---- Button to fetch the forecast ----
            Button("Get Forecast") {
                fetchForecast()
            }
            .buttonStyle(.borderedProminent)
            .padding(10)
            .bold()
            .tint(.green)
            .controlSize(.large)
            .sheet(isPresented: $showForecast) {
                    ForecastView(lat: latitude, lng: longitude, office: office, gridX: gridX, gridY: gridY, forecast: forecastData, loading: loading)
            }
            
            // Show error message
            if !errorMessage.isEmpty {
                Text(errorMessage)
                    .font(.subheadline)
                    .foregroundColor(.red)
                    .padding(4)
            }
        }
    }
}
    
#Preview {
    ContentView()
}

