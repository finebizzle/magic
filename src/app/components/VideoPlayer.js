// components/VideoPlayer.js
"use client"; // Mark this file as a Client Component
import QRCode from "react-qr-code";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";

const VideoPlayer = () => {
  const [adData, setAdData] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0); // Track the current media index
  const [showInstruction, setShowInstruction] = useState(false); // State to show the newsletter or QR
  const [error, setError] = useState(null);
  const playerRef = useRef(null); // Reference to the YouTube player

  useEffect(() => {
    const fetchAdData = async () => {
      try {
        // Fetch all media (videos and images) from the 'adverts' table
        const { data, error } = await supabase
          .from("adverts")
          .select("*")
          .order("id", { ascending: true }); // Fetch all rows, ordered by ID

        if (error) throw error;

        if (!data || data.length === 0) {
          throw new Error("No media found in the database");
        }

        setAdData(data); // Store all media in state
      } catch (err) {
        console.error("Supabase fetch error:", err);
        setError(err.message);
      }
    };

    fetchAdData();
  }, []);

  useEffect(() => {
    if (adData.length > 0 && adData[currentMediaIndex].type === "video") {
      loadYouTubePlayer(adData[currentMediaIndex].url);
    }
  }, [currentMediaIndex, adData]);

  const loadYouTubePlayer = (url) => {
    const videoId = extractYoutubeId(url);
    if (videoId) {
      // Create or load the YouTube player
      playerRef.current = new window.YT.Player("player", {
        videoId: videoId,
        events: {
          onStateChange: onPlayerStateChange,
        },
        playerVars: {
          autoplay: 1,
          controls: 0,
        },
      });
    }
  };

  const onPlayerStateChange = (event) => {
    // Check if the video has ended
    if (event.data === window.YT.PlayerState.ENDED) {
      handleMediaEnd();
    }
  };

  const handleMediaEnd = () => {
    setShowInstruction(false); // Hide any instruction when media ends

    if (currentMediaIndex < adData.length - 1) {
      // Move to the next video or image
      setCurrentMediaIndex(currentMediaIndex + 1);
    } else {
      // If no more media, show some kind of ending message or poll
      setShowInstruction(false);
    }
  };

  const showInstructionContent = () => {
    const instruction = adData[currentMediaIndex]?.instruction;

    if (instruction === "newsletter" || instruction === "qr") {
      setShowInstruction(true); // Show newsletter or QR code after image duration
    } else {
      handleMediaEnd(); // Automatically move to the next media if no instruction
    }
  };

  const handleUserAction = () => {
    setShowInstruction(false);
    handleMediaEnd(); // Move to the next media after user action
  };

  useEffect(() => {
    // Load YouTube IFrame API if it's not already loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading media</h2>
        <p>{error}</p>
      </div>
    );
  }

  const currentMedia = adData[currentMediaIndex]; // Get the current media data

  return (
    <div className="media-container">
      {currentMedia && currentMedia.type === "video" && (
        <>
          {/* YouTube player container */}
          <div id="player" style={{ width: "100%", height: "100%" }}></div>
        </>
      )}

      {currentMedia && currentMedia.type === "image" && (
        <>
          {/* Show the image */}
          <div className="image-wrapper">
            <img
              src={currentMedia.url}
              alt="Advertisement"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onLoad={() => {
                // Use the `duration` field to control how long the image is displayed
                const displayDuration = currentMedia.duration
                  ? currentMedia.duration * 1000
                  : 5000; // Default to 5 seconds if no duration
                setTimeout(showInstructionContent, displayDuration); // Show newsletter or QR after the image is displayed
              }}
            />

            {/* Newsletter or QR overlay */}
            {showInstruction && currentMedia.instruction === "newsletter" && (
              <div className="newsletter-overlay">
                <div className="relative isolate overflow-hidden bg-gray-900 py-16 sm:py-24 lg:py-32">
                  <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="max-w-xl lg:max-w-lg">
                      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Subscribe to our newsletter.
                      </h2>
                      <p className="mt-4 text-lg leading-8 text-gray-300">
                        Stay updated with our latest articles and promotions. No
                        spam, we promise.
                      </p>
                      <div className="mt-6 flex max-w-md gap-x-4">
                        <label htmlFor="email-address" className="sr-only">
                          Email address
                        </label>
                        <input
                          id="email-address"
                          name="email"
                          type="email"
                          required
                          className="min-w-0 flex-auto rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                          placeholder="Enter your email"
                        />
                        <button
                          type="submit"
                          className="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                          onClick={handleUserAction}
                        >
                          Subscribe
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code overlay - Positioned Bottom-Right */}
            {showInstruction &&
              currentMedia.instruction === "qr" &&
              currentMedia.value && (
                <div className="qr-overlay">
                  <div className="qr-code-container">
                    <h2>Scan Me</h2>
                    <QRCode
                      size={80}
                      style={{
                        height: "auto",
                        maxWidth: "100%",
                        width: "100%",
                      }}
                      value={currentMedia.value} // Value fetched from Supabase
                      viewBox={`0 0 256 256`}
                    />
                    <button onClick={handleUserAction}>Continue</button>
                  </div>
                </div>
              )}
          </div>
        </>
      )}

      <style jsx>{`
        .media-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: black;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .newsletter-overlay,
        .qr-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(
            0,
            0,
            0,
            0.6
          ); /* Add a transparent background overlay */
        }

        .qr-overlay {
          justify-content: flex-end;
          align-items: flex-end;
          padding: 20px; /* Padding to move the QR code off the corner */
        }

        .qr-code-container {
          height: 150px;
          width: 100px;
          background: white;
          padding: 5px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .qr-code-container img {
          margin-bottom: 10px;
        }

        .error-container {
          color: red;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
      `}</style>
    </div>
  );
};

// Helper function to extract YouTube ID from URL
const extractYoutubeId = (url) => {
  const regExp =
    /^.*(youtu.be\/|v\/|\/u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export default VideoPlayer;
