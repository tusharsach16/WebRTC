import { useEffect, useRef, useState } from "react";

type CallStatus = "idle" | "connecting" | "waiting" | "in-call" | "disconnected";

type ServerMessage =
  | { type: "waiting_for_peer" }
  | { type: "room_full" }
  | { type: "peer_joined"; otherUserId: string }
  | { type: "peer_disconnected"; userId: string }
  | {
      type: "offer";
      roomId: string;
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "answer";
      roomId: string;
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "ice-candidate";
      roomId: string;
      from: string;
      to: string;
      candidate: RTCIceCandidateInit;
    };

export function useWebRTC() {
  const [status, setStatus] = useState<CallStatus>("idle");

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const userIdRef = useRef<string>(Math.random().toString(36).slice(2));
  const roomIdRef = useRef<string | null>(null);
  const peerIdRef = useRef<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS connected");
    };

    ws.onclose = () => {
      console.log("WS closed");
      setStatus("disconnected");
    };

    ws.onerror = (err) => {
      console.error("WS error", err);
    };

    ws.onmessage = async (event) => {
      const msg: ServerMessage = JSON.parse(event.data);
      console.log("WS message:", msg);

      switch (msg.type) {
        case "waiting_for_peer": {
          setStatus("waiting");
          break;
        }

        case "room_full": {
          alert("Room is full");
          setStatus("idle");
          break;
        }

        case "peer_joined": {
          peerIdRef.current = msg.otherUserId;
          setStatus("connecting");

          const myId = userIdRef.current;
          const otherId = msg.otherUserId;

          const shouldCreateOffer = myId > otherId;

          if (shouldCreateOffer) {
            const pc = pcRef.current;
            if (!pc) return;

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            send({
              type: "offer",
              roomId: roomIdRef.current!,
              from: myId,
              to: otherId,
              sdp: offer,
            });
          }

          break;
        }

        case "offer": {
          const pc = pcRef.current;
          if (!pc) {
            console.error("No RTCPeerConnection for offer");
            return;
          }

          peerIdRef.current = msg.from;

          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          send({
            type: "answer",
            roomId: msg.roomId,
            from: userIdRef.current,
            to: msg.from,
            sdp: answer,
          });

          setStatus("in-call");
          break;
        }

        case "answer": {
          const pc = pcRef.current;
          if (!pc) return;

          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          setStatus("in-call");
          break;
        }

        case "ice-candidate": {
          const pc = pcRef.current;
          if (!pc) return;

          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (err) {
            console.error("Error adding ICE candidate", err);
          }
          break;
        }

        case "peer_disconnected": {
          console.log("Peer disconnected", msg.userId);
          peerIdRef.current = null;
          remoteStreamRef.current = null;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          setStatus("disconnected");
          break;
        }

        default: {
          const _exhaustive: never = msg;
          console.log("Unknown message", _exhaustive);
        }
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  function send(msg: any) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error("WS not ready, cannot send", msg);
      return;
    }
    ws.send(JSON.stringify(msg));
  }

  async function joinRoom(roomId: string) {
    roomIdRef.current = roomId;
    setStatus("connecting");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const peerId = peerIdRef.current;
      if (!peerId) {
        console.log("ICE candidate before peerId, ignoring");
        return;
      }

      send({
        type: "ice-candidate",
        roomId: roomIdRef.current!,
        from: userIdRef.current,
        to: peerId,
        candidate: event.candidate,
      });
    };

    send({
      type: "join",
      roomId,
      userId: userIdRef.current,
    });
  }

  return {
    status,
    localVideoRef,
    remoteVideoRef,
    joinRoom,
  };
}
