"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

function createMarkerIcon(mapsApi, fillColor) {
  return {
    path: mapsApi.SymbolPath.CIRCLE,
    fillColor,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 10,
  };
}

export default function GoogleRestaurantsMap({
  restaurants,
  selectedRestaurantId,
  onSelectRestaurant,
  userLocation,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const [mapError, setMapError] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function setupMap() {
      try {
        const mapsApi = await loadGoogleMaps();

        if (!isMounted || !containerRef.current || mapRef.current) {
          return;
        }

        mapRef.current = new mapsApi.Map(containerRef.current, {
          center: userLocation,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          styles: [
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              stylers: [{ visibility: "off" }],
            },
          ],
        });
        setIsMapReady(true);
      } catch (error) {
        if (isMounted) {
          setMapError(error.message || "Google Maps could not be loaded.");
        }
      }
    }

    setupMap();

    return () => {
      isMounted = false;
    };
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) {
      return;
    }

    const mapsApi = window.google.maps;

    mapRef.current.setCenter(userLocation);

    if (!userMarkerRef.current) {
      userMarkerRef.current = new mapsApi.Marker({
        map: mapRef.current,
        position: userLocation,
        title: "Your location",
        icon: createMarkerIcon(mapsApi, "#113322"),
      });
    } else {
      userMarkerRef.current.setPosition(userLocation);
    }
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) {
      return;
    }

    const mapsApi = window.google.maps;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = restaurants.map((restaurant) => {
      const isSelected = restaurant.id === selectedRestaurantId;
      const marker = new mapsApi.Marker({
        map: mapRef.current,
        position: { lat: restaurant.lat, lng: restaurant.lng },
        title: restaurant.name,
        icon: createMarkerIcon(mapsApi, isSelected ? "#113322" : "#1f8f57"),
      });

      marker.addListener("click", () => onSelectRestaurant(restaurant.id));
      return marker;
    });
  }, [onSelectRestaurant, restaurants, selectedRestaurantId]);

  useEffect(() => {
    if (!mapRef.current || !selectedRestaurantId) {
      return;
    }

    const selectedRestaurant = restaurants.find(
      (restaurant) => restaurant.id === selectedRestaurantId
    );

    if (!selectedRestaurant) {
      return;
    }

    mapRef.current.panTo({
      lat: selectedRestaurant.lat,
      lng: selectedRestaurant.lng,
    });
  }, [restaurants, selectedRestaurantId]);

  if (mapError) {
    return (
      <div className="flex h-full min-h-[18rem] items-center justify-center rounded-[2rem] border border-border/70 bg-white/70 p-6 text-center text-sm text-foreground/70">
        {mapError}
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[18rem] overflow-hidden rounded-[2rem] border border-border/70 bg-white/70 shadow-[0_24px_80px_rgba(17,51,34,0.08)]">
      <div ref={containerRef} className="h-full min-h-[18rem] w-full" />
      {!isMapReady ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60 text-sm text-foreground/68 backdrop-blur-sm">
          Loading Google Maps...
        </div>
      ) : null}
    </div>
  );
}
