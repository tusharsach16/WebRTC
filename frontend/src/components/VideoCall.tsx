import React, {useRef} from "react";
import {useWebRTC} from "../hooks/useWebRTC";


export const VideoCall: React.FC = () => {
    const roomInputRef = useRef<HTMLInputElement| null>(null);
    const {localVideoRef, remoteVideoRef, status, joinRoom, toggleMic, toggleCamera, leaveCall} = useWebRTC();

    const handleJoin = () => {
        const roomId = roomInputRef.current?.value.trim();
        if(!roomId) {
            alert("Please enter a room ID");
            return;
        }
        joinRoom(roomId);
    };

    return (
        <div>
            <div style={{ marginBottom: "1rem" }}>
              <input
                ref={roomInputRef}
                placeholder="Enter room id"
                style={{ padding: "0.4rem", marginRight: "0.5rem" }}
              />
              <button onClick={handleJoin}>Join</button>
              <span style={{ marginLeft: "1rem" }}>Status: {status}</span>
            </div>
            <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
              <button onClick={toggleMic}>Mute / Unmute</button>
              <button onClick={toggleCamera}>Camera On / Off</button>
              <button onClick={leaveCall}>Leave</button>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "45%", border: "1px solid #333" }}
              />
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: "45%", border: "1px solid #333" }}
              />
            </div>
        </div>
    );
};