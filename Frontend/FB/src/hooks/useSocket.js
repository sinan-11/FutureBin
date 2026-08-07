import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../utils/constants";
import store from "../store/store";
import { getRefreshedToken } from "../api/axiosInstance";
import { setAccessToken, selectIsAuthenticated } from "../store/slices/authSlice";

const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const TOKEN_REFRESH_MARGIN_MS = 2 * 60 * 1000;

const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const isTokenExpiredOrExpiring = (token, marginMs = TOKEN_REFRESH_MARGIN_MS) => {
  const expiresAt = getTokenExpiry(token);
  return expiresAt === null || expiresAt - Date.now() < marginMs;
};

const useSocket = ({ collectorEvents = {}, residentEvents = {}, onReconnect } = {}) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector((state) => state.auth.user?.role);

  const collectorEventsRef = useRef(collectorEvents);
  const residentEventsRef = useRef(residentEvents);
  const onReconnectRef = useRef(onReconnect);
  const hasReconnectedRef = useRef(false);
  const refreshingRef = useRef(false);

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
    if (!isAuthenticated || !userRole) return;

    const ensureFreshToken = () => {
      const current = store.getState().auth.accessToken;
      if (!current || !isTokenExpiredOrExpiring(current)) {
        return Promise.resolve(current);
      }
      if (refreshingRef.current) {
        return Promise.resolve(store.getState().auth.accessToken);
      }
      refreshingRef.current = true;
      return getRefreshedToken()
        .then((freshToken) => {
          if (freshToken) {
            store.dispatch(setAccessToken(freshToken));
          }
          return store.getState().auth.accessToken;
        })
        .catch(() => store.getState().auth.accessToken)
        .finally(() => {
          refreshingRef.current = false;
        });
    };

    const socket = io(SOCKET_URL, {
      // Auth callback is invoked on every connection/reconnection attempt, so
      // the latest (possibly rotated) access token is always used.
      auth: (cb) => cb({ token: store.getState().auth.accessToken }),
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    socket.on("connect", () => {
      setIsConnected(true);

      if (hasReconnectedRef.current) {
        hasReconnectedRef.current = false;
        if (onReconnectRef.current) {
          onReconnectRef.current();
        }
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      hasReconnectedRef.current = true;
    });

    const applyFreshToken = () => {
      ensureFreshToken();
    };

    socket.on("connect_error", (err) => {
      console.warn("[SOCKET] Connection error:", err.message);
      applyFreshToken();
    });

    socket.io.on("reconnect_attempt", applyFreshToken);

    const eventNames = new Set([
      ...Object.keys(collectorEventsRef.current),
      ...Object.keys(residentEventsRef.current),
    ]);

    const dispatch = (event) => (...args) => {
      const map = userRole === "collector"
        ? collectorEventsRef.current
        : residentEventsRef.current;
      const handler = map[event];
      if (typeof handler === "function") {
        handler(...args);
      }
    };

    for (const event of eventNames) {
      socket.on(event, dispatch(event));
    }

    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, userRole]);

  return { socketRef, isConnected };
};

export default useSocket;
