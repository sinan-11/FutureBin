import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../utils/constants";
import store from "../store/store";

/**
 * Role-aware Socket.IO hook with smart polling fallback.
 *
 * @param {Object} options
 * @param {Object} options.collectorEvents - Map of event → handler for collector role
 * @param {Object} options.residentEvents  - Map of event → handler for resident role
 * @param {Function} options.onReconnect   - Called once after successful reconnection
 * @returns {{ socketRef, isConnected }}
 */
const useSocket = ({ collectorEvents = {}, residentEvents = {}, onReconnect } = {}) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const collectorEventsRef = useRef(collectorEvents);
  const residentEventsRef = useRef(residentEvents);
  const onReconnectRef = useRef(onReconnect);
  const hasReconnectedRef = useRef(false);

  useEffect(() => {
    collectorEventsRef.current = collectorEvents;
  }, [collectorEvents]);

  useEffect(() => {
    residentEventsRef.current = residentEvents;
  }, [residentEvents]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    const token = store.getState().auth.accessToken;
    const userRole = store.getState().auth.user?.role;

    if (!token || !userRole) return;

    const socket = io(API_BASE_URL.replace("/api", ""), {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on("connect", () => {
      console.log("[SOCKET] Connected:", socket.id);
      setIsConnected(true);

      if (hasReconnectedRef.current) {
        console.log("[SOCKET] Reconnected — syncing data");
        if (onReconnectRef.current) {
          onReconnectRef.current();
        }
        hasReconnectedRef.current = false;
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[SOCKET] Disconnected:", reason);
      setIsConnected(false);
      hasReconnectedRef.current = true;
    });

    socket.on("connect_error", (err) => {
      console.warn("[SOCKET] Connection error:", err.message);
    });

    const events = userRole === "collector"
      ? collectorEventsRef.current
      : residentEventsRef.current;

    for (const [event, handler] of Object.entries(events)) {
      socket.on(event, handler);
    }

    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  return { socketRef, isConnected };
};

export default useSocket;
