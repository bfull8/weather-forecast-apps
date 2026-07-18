import React, { useState } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

const MapComponent = ({ setCoords, coords }) => {
  const handleMapClick = ({ detail: { latLng } }) => {
    if (!latLng) return;

    const clicked = { lat: latLng.lat, lng: latLng.lng };

    setCoords({
      lat: clicked.lat,
      lng: clicked.lng,
    });
  };

  const hasValidCoords =
    coords.lat !== "" &&
    coords.lng !== "" &&
    !isNaN(coords.lat) &&
    !isNaN(coords.lng);

  return (
    <APIProvider apiKey="AIzaSyBDjiIQkSY3OCX4qq7RssWqKHM240ALUqA">
      <Map
        defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
        defaultZoom={4}
        style={{ width: "100%", height: "400px" }}
        gestureHandling={"greedy"}
        mapId="MyWeatherMap"
        onClick={handleMapClick}
      >
        {hasValidCoords && (
          <AdvancedMarker
            position={{
              lat: Number(coords.lat),
              lng: Number(coords.lng),
            }}
          />
        )}
      </Map>
    </APIProvider>
  );
};

export default MapComponent;
