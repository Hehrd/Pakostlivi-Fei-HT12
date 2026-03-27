"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

const GOOGLE_MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

function createMarkerContent(markerApi, fillColor, scale = 1) {
  return new markerApi.PinElement({
    background: fillColor,
    borderColor: "#ffffff",
    glyphColor: "#ffffff",
    scale,
  });
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
  const markerLibraryRef = useRef(null);
  const [mapError, setMapError] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function setupMap() {
      try {
        const mapsApi = await loadGoogleMaps(["maps", "marker"]);
        const { Map } = await mapsApi.importLibrary("maps");
        const markerLibrary = await mapsApi.importLibrary("marker");

        if (!isMounted || !containerRef.current || mapRef.current) {
          return;
        }

        markerLibraryRef.current = markerLibrary;

        mapRef.current = new Map(containerRef.current, {
          center: userLocation,
          zoom: 14,
          mapId: GOOGLE_MAPS_MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
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
    if (
      !mapRef.current ||
      !window.google?.maps ||
      !markerLibraryRef.current?.AdvancedMarkerElement
    ) {
      return;
    }

    mapRef.current.setCenter(userLocation);

    if (!userMarkerRef.current) {
      userMarkerRef.current = new markerLibraryRef.current.AdvancedMarkerElement({
        map: mapRef.current,
        position: userLocation,
        title: "Your location",
        content: createMarkerContent(markerLibraryRef.current, "#113322", 0.95),
      });
    } else {
      userMarkerRef.current.position = userLocation;
    }
  }, [userLocation]);

  useEffect(() => {
    if (
      !mapRef.current ||
      !window.google?.maps ||
      !markerLibraryRef.current?.AdvancedMarkerElement
    ) {
      return;
    }

    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current = restaurants.map((restaurant) => {
      const isSelected = restaurant.id === selectedRestaurantId;
      const marker = new markerLibraryRef.current.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: restaurant.lat, lng: restaurant.lng },
        title: restaurant.name,
        content: createMarkerContent(
          markerLibraryRef.current,
          isSelected ? "#113322" : "#1f8f57"
        ),
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
