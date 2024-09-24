"use client"; // Mark this file as a Client Component

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // Make sure your Supabase client is configured properly

const TrackUserRoute = () => {
  const [route, setRoute] = useState([]); // To store the route as a list of coordinates
  const [tracking, setTracking] = useState(false); // State to track whether we're watching the location
  const [routeId, setRouteId] = useState(null); // Unique ID to group locations for a route
  const [error, setError] = useState(null);

  // Function to save each location update to Supabase
  const saveLocationToSupabase = async (latitude, longitude) => {
    try {
      console.log("Saving location to Supabase:", { latitude, longitude });

      // Save each location to the 'user_route' table with a unique route ID
      const { data, error } = await supabase
        .from("user_route")
        .insert([{ latitude, longitude, route_id: routeId }]);

      if (error) throw error;

      console.log("Location saved successfully:", data);
    } catch (err) {
      console.error("Error saving location to Supabase:", err.message);
      setError("Error saving location to Supabase: " + err.message);
    }
  };

  // Function to start tracking the user's movement
  const startTracking = () => {
    if (navigator.geolocation) {
      // Generate a new unique route ID for each new journey
      const newRouteId = crypto.randomUUID(); // Generate a new UUID (or use another method)
      setRouteId(newRouteId);

      console.log("Starting location tracking...");

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Location update received:", { latitude, longitude });

          // Save the new position in local state
          setRoute((prevRoute) => [...prevRoute, { latitude, longitude }]);

          // Save the new position to Supabase
          saveLocationToSupabase(latitude, longitude);
        },
        (err) => {
          console.error("Error getting location updates:", err.message);
          setError("Error getting location updates: " + err.message);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 } // High accuracy for tracking movement
      );

      // Save the watch ID so we can stop tracking later
      setTracking(watchId);
    } else {
      console.error("Geolocation not supported by this browser.");
      setError("Geolocation is not supported by this browser.");
    }
  };

  // Function to stop tracking the user's movement
  const stopTracking = () => {
    if (tracking) {
      navigator.geolocation.clearWatch(tracking);
      console.log("Stopped tracking location.");
      setTracking(false);
    }
  };

  useEffect(() => {
    // Automatically start tracking when the component mounts
    startTracking();

    // Cleanup function to stop tracking when the component unmounts
    return () => {
      stopTracking();
    };
  }, []);

  return (
    <div>
      <h2>Tracking User Route</h2>
      {route.length > 0 ? (
        <ul>
          {route.map((location, index) => (
            <li key={index}>
              Latitude: {location.latitude}, Longitude: {location.longitude}
            </li>
          ))}
        </ul>
      ) : (
        <p>No route data yet.</p>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={stopTracking} disabled={!tracking}>
        Stop Tracking
      </button>
    </div>
  );
};

export default TrackUserRoute;
