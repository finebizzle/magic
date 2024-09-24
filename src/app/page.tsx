import VideoPlayer from "./components/VideoPlayer"; // Import the VideoPlayer component
import CaptureLocation from "./components/CaptureLocation";
import TrackUserRoute from "./components/TrackUserRoute";

export default function Home() {
  return (
    <div className="w-screen h-screen">
      {/* Render the VideoPlayer component full-screen */}
      <CaptureLocation />
      <VideoPlayer />
      <TrackUserRoute />
    </div>
  );
}
