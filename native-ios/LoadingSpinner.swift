//
//  LoadingSpinner.swift
//  week6
//
//  Created by Ben Fullenkamp on 12/7/25.
//
import SwiftUI

// Rotating spinner to display inside the forecast Modal
struct LoadingSpinner: View {
    @State private var rotationDegrees: Double = 0
    let lat: String
    let lng: String

    var body: some View {
        Circle()
            .trim(from: 0, to: 0.7)
            .stroke(Color.blue, lineWidth: 5)
            .frame(width: 50, height: 50)
            .rotationEffect(.degrees(rotationDegrees))
            .onAppear {
                withAnimation(.linear(duration: 1).repeatForever(autoreverses: false)) {
                    rotationDegrees = 360
                }
            }
        Text("Loading forecast for (\(lat), \(lng))").font(.headline)
    }
}

#Preview {
    LoadingSpinner(lat:"55",lng:"22")
}
