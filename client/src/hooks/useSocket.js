import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

export const useSocket = (onIncidentUpdate) => {
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    const socket = io(socketUrl, { transports: ["websocket"] });

    socket.on("connect", () => setStatus("Live"));
    socket.on("disconnect", () => setStatus("Reconnecting..."));
    socket.on("connect_error", () => setStatus("Offline"));

    if (onIncidentUpdate) {
      socket.on("incident.update", onIncidentUpdate);
    }

    return () => {
      socket.disconnect();
    };
  }, [onIncidentUpdate]);

  return { status };
};
