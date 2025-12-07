import React from "react";
import { VideoCall } from "./components/VideoCall";

function App() {
  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>WebRTC 1:1 Call</h1>
      <VideoCall />
    </div>
  );
}

export default App;