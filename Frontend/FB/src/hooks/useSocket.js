import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../utils/constants";
import store from "../store/store";
import { getRefreshedToken } from "../api/axiosInstance";
import { setAccessToken } from "../store/slices/authSlice";

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
      setIsConnected(true);

      if (hasReconnectedRef.current) {
        if (onReconnectRef.current) {
          onReconnectRef.current();
        }
        hasReconnectedRef.current = false;
      }
    });

    socket.io.on("reconnect_attempt", () => {
      const currentToken = store.getState().auth.accessToken;
      if (!currentToken) return;

      socket.auth = { token: currentToken };

      let expiresAt = null;
      try {
        const payload = JSON.parse(atob(currentToken.split(".")[1]));
        if (payload.exp) {
          expiresAt = payload.exp * 1000;
        }
      } catch {
        // ignore malformed tokens
      }

      if (expiresAt && expiresAt - Date.now() < 2 * 60 * 1000) {
        getRefreshedToken()
          .then((freshToken) => {
            if (freshToken) {
              store.dispatch(setAccessToken(freshToken));
              socket.auth = { token: freshToken };
            }
          })
          .catch(() => {});
      }
    });

    socket.on("disconnect", () => {
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