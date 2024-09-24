"use client"; // Mark this file as a Client Component
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // Make sure supabaseClient.js is correctly configured

const CaptureLocation = () => {
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [error, setError] = useState(null);
  const [locationSaved, setLocationSaved] = useState(false);

  // Function to save location to Supabase
  const saveLocationToSupabase = async (latitude, longitude) => {
    try {
      console.log("Attempting to save location to Supabase:", {
        latitude,
        longitude,
      });
      const { data, error } = await supabase
        .from("user_locations") // Insert into 'user_locations' table
        .insert([{ latitude, longitude }]);

      if (error) throw error;

      console.log("Location saved successfully:", data);
      setLocationSaved(true);
    } catch (err) {
      console.error("Error saving location to Supabase:", err.message);
      setError("Error saving location to Supabase: " + err.message);
    }
  };

  // Function to get the user's current location
  const getLocation = () => {
    if (navigator.geolocation) {
      console.log("Getting location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Location received:", { latitude, longitude });
          setLocation({ latitude, longitude });
          // Once we have the location, save it to Supabase
          saveLocationToSupabase(latitude, longitude);
        },
        (err) => {
          console.error("Error getting location:", err.message);
          setError("Error getting location: " + err.message);
        }
      );
    } else {
      console.error("Geolocation not supported by this browser.");
      setError("Geolocation is not supported by this browser.");
    }
  };

  // Run the getLocation function when the component loads
  useEffect(() => {
    getLocation();
  }, []);

  return (
    <div>
      <h2>Capture User Location</h2>
      {location.latitude && location.longitude ? (
        <p>
          Latitude: {location.latitude}, Longitude: {location.longitude}
        </p>
      ) : (
        <p>Loading location...</p>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {locationSaved && <p>Location saved successfully to Supabase!</p>}
    </div>
  );
};

export default CaptureLocation;
