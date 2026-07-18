//
//  ForecastView.swift
//  week6
//
//  Created by Ben Fullenkamp on 12/4/25.
//

import SwiftUI
import Foundation

// Struct for data housed in each forecast period
struct ForecastPeriod: Identifiable {
    let id = UUID()
    let name: String
    let temperature: Int
    let shortForecast: String
    let windSpeed: String
    let windDirection: String
}

// Struct for the forecast cards - allows for reusing same card
struct ForecastCard: View {
    let period: ForecastPeriod
    
    var body: some View {
        VStack(alignment: .leading) {
            // Forecast Period Name
            Text(period.name)
                .font(.title2)
                .bold()
            
            // Temperature
            Text("\(period.temperature)°F")
                .font(.system(size: 36, weight: .semibold))
            
            // Short Forecast
            Text(period.shortForecast)
                .font(.headline)
            
            Divider().padding(.vertical, 2)
            
            // Wind speed
            VStack(alignment: .leading) {
                Text("Wind: \(period.windSpeed) \(period.windDirection)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(.thinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .shadow(radius: 1)
        .padding(.horizontal)
    }
}


struct ForecastView: View {
    // Variables to display in the forecast modal
    let lat: String
    let lng: String
    let office: String
    let gridX: Int
    let gridY: Int
    let forecast: ForecastResponse?
    let loading: Bool
    
    // Parse the Forecast Response to store each Period in the struct defined above
    var periods: [ForecastPeriod] {
            guard let forecast else { return [] }

            return forecast.properties.periods.map { p in
                ForecastPeriod(
                    name: p.name,
                    temperature: p.temperature,
                    shortForecast: p.shortForecast,
                    windSpeed: p.windSpeed,
                    windDirection: p.windDirection
                )
            }
        }
    
    var body: some View {
        ZStack {
            // Show loading spinner until valid forecast data is returned
            if loading || forecast == nil {
                VStack {
                    Spacer()
                    LoadingSpinner(lat: lat, lng: lng)
                    Spacer()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.clear)
            } else {
                // Forecast Content (hidden when loading)
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        
                        // --- Header ---
                        VStack(alignment: .leading, spacing: 4) {
                            Text("5-Period Forecast")
                                .font(.largeTitle)
                                .bold()
                                .padding(.top)
                            
                            HStack(spacing: 0) {
                                Text("Lat: ").bold()
                                Text("\(lat), ")
                                Text("Lng: ").bold()
                                Text("\(lng)")
                            }
                            .font(.subheadline)
                            
                            HStack(spacing: 0) {
                                Text("Office: ").bold()
                                Text("\(office) ")
                                Text("Grid: ").bold()
                                Text("(\(gridX),\(gridY))")
                            }
                            .font(.subheadline)
                        }
                        .padding(.horizontal)
                        
                        // --- Forecast Cards ---
                        ForEach(periods.prefix(5)) {
                            period in ForecastCard(period: period)
                        }
                    }
                }
            }
        }
    }
}

#Preview {
    ForecastView(
        lat: "39.5",
        lng: "-98.35",
        office: "TOP",
        gridX: 45,
        gridY: 67,
        forecast: nil,
        loading: false    
    )
}
