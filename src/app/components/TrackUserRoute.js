"use client"; // Mark this file as a Client Component

"use client"; // Mark this file as a Client Component

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // Ensure your Supabase client is configured properly

// Utility function to generate a UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const TrackUserRoute = () => {
  const [route, setRoute] = useState([]); // To store the route as a list of coordinates
  const [tracking, setTracking] = useState(false); // State to track whether we're watching the location
  const [routeId, setRouteId] = useState(null); // Unique ID to group locations for a route
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null); // State to store the unique user/device ID

  // Function to save each location update to Supabase
  const saveLocationToSupabase = async (latitude, longitude) => {
    console.log("Attempting to save location with user_id:", userId); // Log user_id

    if (!userId) {
      console.error("User ID is null or undefined!");
      return; // Exit if user_id is not available
    }

    try {
      // Save each location to the 'user_route' table with a unique route ID and device-specific user_id
      const { data, error } = await supabase
        .from("user_route")
        .insert([{ latitude, longitude, route_id: routeId, user_id: userId }]);

      if (error) {
        console.error("Supabase Insert Error:", error.message);
        setError("Error saving location to Supabase: " + error.message);
      } else {
        console.log("Location saved successfully:", data);
      }
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

  // On component mount, generate or retrieve user_id and start tracking
  useEffect(() => {
    // Check if the user_id is already stored in localStorage
    let storedUserId = localStorage.getItem("user_id");

    // If no user_id exists, generate a new one and store it
    if (!storedUserId) {
      storedUserId = generateUUID();
      localStorage.setItem("user_id", storedUserId);
      console.log("Generated new user_id:", storedUserId);
    } else {
      console.log("Using existing user_id:", storedUserId);
    }

    // Set the user_id in state
    setUserId(storedUserId);
  }, []); // This useEffect only runs once on component mount

  // Start tracking after userId is set
  useEffect(() => {
    if (userId) {
      console.log("User ID is set, starting tracking...");
      startTracking(); // Only start tracking when userId is available
    }
  }, [userId]); // This useEffect runs when userId changes

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
