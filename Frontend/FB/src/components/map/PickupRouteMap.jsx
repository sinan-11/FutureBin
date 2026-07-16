import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import {
  FaRoute, FaClock, FaPlay, FaFlagCheckered,
  FaArrowUp, FaArrowRight, FaArrowLeft, FaChevronRight,
  FaMapMarkerAlt, FaStop, FaCompass,
} from "react-icons/fa";

import { isValidCoordinates } from "../../utils/map";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

const getTileUrl = () => {
  const isDark = document.documentElement.classList.contains("dark");
  const style = isDark ? "dark-v11" : "streets-v4";
  return `https://api.maptiler.com/maps/${style}/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;
};

const collectorIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const pickupIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const LiveTracker = ({ position, navigating }) => {
  const map = useMap();

  useEffect(() => {
    if (!navigating || !position) return;
    map.setView(position, map.getZoom(), { animate: true });
  }, [map, position, navigating]);

  return null;
};

const FitRoute = ({ routeCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !routeCoords || routeCoords.length === 0) return;
    const bounds = L.latLngBounds(routeCoords);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, routeCoords]);

  return null;
};

const OFF_ROUTE_THRESHOLD = 50;

const distToRoute = (point, routeCoords) => {
  const p = L.latLng(point);
  let min = Infinity;
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const a = L.latLng(routeCoords[i]);
    const b = L.latLng(routeCoords[i + 1]);
    const d = p.distanceTo(a);
    if (d < min) min = d;
    const ab = a.distanceTo(b);
    if (ab === 0) continue;
    let t = ((p.lat - a.lat) * (b.lat - a.lat) + (p.lng - a.lng) * (b.lng - a.lng)) / (ab * ab);
    t = Math.max(0, Math.min(1, t));
    const proj = L.latLng(a.lat + t * (b.lat - a.lat), a.lng + t * (b.lng - a.lng));
    const d2 = p.distanceTo(proj);
    if (d2 < min) min = d2;
  }
  return min;
};

const fetchRoute = async (from, to) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes || data.routes.length === 0) return null;
  return data.routes[0];
};

const getDirectionIcon = (modifier) => {
  switch (modifier) {
    case "slight right":
    case "right":
      return <FaArrowRight className="h-3.5 w-3.5 text-brand-600" />;
    case "slight left":
    case "left":
      return <FaArrowLeft className="h-3.5 w-3.5 text-brand-600" />;
    case "uturn":
      return <FaArrowUp className="h-3.5 w-3.5 text-brand-600 rotate-180" />;
    default:
      return <FaArrowUp className="h-3.5 w-3.5 text-brand-600" />;
  }
};

const PickupRouteMap = ({ pickup, collectorLocation }) => {
  const pickupCoords = pickup?.location?.coordinates;
  const collectorCoords = collectorLocation?.coordinates;
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [routeBounds, setRouteBounds] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [livePosition, setLivePosition] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [rerouting, setRerouting] = useState(false);
  const watchIdRef = useRef(null);
  const routeStepsRef = useRef([]);
  const routeGeomRef = useRef([]);
  const pickupPosRef = useRef(null);

  const hasPickup = isValidCoordinates(pickupCoords);
  const hasCollector = isValidCoordinates(collectorCoords);

  const loadRoute = useCallback(async (from, to) => {
    setLoading(true);
    const route = await fetchRoute(from, to);
    if (!route) { setLoading(false); return; }

    const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const polyline = L.polyline(coords);
    const bounds = polyline.getBounds();

    const instructions = [];
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        const maneuverCoords = step.maneuver?.location
          ? [step.maneuver.location[1], step.maneuver.location[0]]
          : null;
        instructions.push({
          text: step.name || step.maneuver?.modifier || "Continue",
          type: step.maneuver?.type || "depart",
          modifier: step.maneuver?.modifier,
          distance: step.distance,
          duration: step.duration,
          maneuverCoords,
        });
      }
    }

    routeStepsRef.current = instructions;
    routeGeomRef.current = coords;
    setRouteGeometry(coords);
    setRouteBounds(bounds);
    setRouteInfo({
      distance: (route.distance / 1000).toFixed(1),
      duration: Math.ceil(route.duration / 60),
      instructions,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!hasPickup || !hasCollector) return;
    const from = [collectorCoords[1], collectorCoords[0]];
    const to = [pickupCoords[1], pickupCoords[0]];
    loadRoute(from, to);
    return () => { setNavigating(false); stopTracking(); };
  }, [hasPickup, hasCollector, pickupCoords?.[0], pickupCoords?.[1], collectorCoords?.[0], collectorCoords?.[1]]);

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const startNavigation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    pickupPosRef.current = [pickupCoords[1], pickupCoords[0]];
    setNavigating(true);
    setShowDirections(true);
    setCurrentStep(0);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setLivePosition(newPos);

        const steps = routeStepsRef.current;
        const routeGeom = routeGeomRef.current;
        if (steps.length > 0) {
          let closest = 0;
          let minDist = Infinity;
          for (let i = 0; i < steps.length; i++) {
            if (!steps[i].maneuverCoords) continue;
            const d = Math.hypot(
              newPos[0] - steps[i].maneuverCoords[0],
              newPos[1] - steps[i].maneuverCoords[1]
            );
            if (d < minDist) { minDist = d; closest = i; }
          }
          setCurrentStep(closest);
        }

        if (routeGeom.length > 0 && !rerouting) {
          const dist = distToRoute(newPos, routeGeom);
          if (dist > OFF_ROUTE_THRESHOLD) {
            setRerouting(true);
            const to = pickupPosRef.current;
            fetchRoute(newPos, to).then((route) => {
              if (!route) { setRerouting(false); return; }
              const newCoords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
              const newInstructions = [];
              for (const leg of route.legs) {
                for (const step of leg.steps) {
                  const maneuverCoords = step.maneuver?.location
                    ? [step.maneuver.location[1], step.maneuver.location[0]]
                    : null;
                  newInstructions.push({
                    text: step.name || step.maneuver?.modifier || "Continue",
                    type: step.maneuver?.type || "depart",
                    modifier: step.maneuver?.modifier,
                    distance: step.distance,
                    duration: step.duration,
                    maneuverCoords,
                  });
                }
              }
              routeStepsRef.current = newInstructions;
              routeGeomRef.current = newCoords;
              setRouteGeometry(newCoords);
              setRouteBounds(L.polyline(newCoords).getBounds());
              setRouteInfo({
                distance: (route.distance / 1000).toFixed(1),
                duration: Math.ceil(route.duration / 60),
                instructions: newInstructions,
              });
              setCurrentStep(0);
              setRerouting(false);
            });
          }
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const stopNavigation = () => {
    setNavigating(false);
    setLivePosition(null);
    setCurrentStep(0);
    setRerouting(false);
    stopTracking();
  };

  if (!hasPickup) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-400">Pickup location not available</p>
      </div>
    );
  }

  const [pickLng, pickLat] = pickupCoords;
  const pickupPos = [pickLat, pickLng];
  const collectorPos = hasCollector ? [collectorCoords[1], collectorCoords[0]] : null;
  const center = livePosition || collectorPos || pickupPos;

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatStepDist = (meters) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-gray-100">
      {hasCollector && routeInfo && (
        <div className="flex items-center gap-3 bg-brand-50 px-4 py-2.5 border-b border-brand-100">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            <FaRoute className="h-3.5 w-3.5" />
            {routeInfo.distance} km
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            <FaClock className="h-3.5 w-3.5" />
            {formatDuration(routeInfo.duration)}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowDirections(!showDirections)}
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition"
            >
              {showDirections ? "Hide" : "Steps"}
              <FaChevronRight className={`h-2.5 w-2.5 transition-transform ${showDirections ? "rotate-90" : ""}`} />
            </button>
            {!navigating ? (
              <button
                onClick={startNavigation}
                className="flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 transition active:scale-[0.97]"
              >
                <FaMapMarkerAlt className="h-3 w-3" />
                Navigate
              </button>
            ) : (
              <button
                onClick={stopNavigation}
                className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition active:scale-[0.97]"
              >
                <FaStop className="h-3 w-3" />
                Stop
              </button>
            )}
          </div>
        </div>
      )}

      {navigating && routeInfo?.instructions?.[currentStep] && (
        <div className="flex items-center gap-3 bg-white px-4 py-3 border-b border-gray-100">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
            {getDirectionIcon(routeInfo.instructions[currentStep].modifier)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {rerouting
                ? "Recalculating..."
                : routeInfo.instructions[currentStep].text || "Continue"}
            </p>
            {!rerouting && routeInfo.instructions[currentStep].distance > 0 && (
              <p className="text-xs text-gray-500">
                for {formatStepDist(routeInfo.instructions[currentStep].distance)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-brand-700">
              {formatDuration(routeInfo.duration)}
            </p>
            <p className="text-[10px] text-gray-400">remaining</p>
          </div>
        </div>
      )}

      {hasCollector && loading && (
        <div className="flex items-center justify-center bg-brand-50 px-4 py-2 border-b border-brand-100">
          <svg className="h-4 w-4 animate-spin text-brand-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="ml-2 text-sm font-medium text-brand-700">Calculating route...</span>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={navigating ? 16 : (hasCollector ? 13 : 16)}
        style={{ height: navigating ? "220px" : "280px", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
          url={getTileUrl()}
          tileSize={256}
          minZoom={1}
          crossOrigin={true}
        />
        {hasCollector && !navigating && <Marker position={collectorPos} icon={collectorIcon} />}
        <Marker position={pickupPos} icon={pickupIcon} />
        {routeGeometry && (
          <>
            <Polyline
              positions={routeGeometry}
              pathOptions={{ color: "#3b82f6", weight: 5, opacity: 0.8 }}
            />
            {!navigating && <FitRoute routeCoords={routeBounds} />}
          </>
        )}
        {navigating && livePosition && (
          <>
            <Marker position={livePosition} icon={userIcon} />
            <Circle
              center={livePosition}
              radius={20}
              pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.15, weight: 1 }}
            />
            <LiveTracker position={livePosition} navigating={navigating} />
          </>
        )}
      </MapContainer>

      {hasCollector && showDirections && routeInfo?.instructions?.length > 0 && (
        <div className="max-h-52 overflow-y-auto border-t border-gray-100 bg-white">
          <div className="p-3">
            {routeInfo.instructions.map((inst, i) => {
              const isFirst = i === 0;
              const isLast = i === routeInfo.instructions.length - 1;
              const isCurrent = navigating && i === currentStep;
              const isPast = navigating && i < currentStep;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                      isCurrent
                        ? "bg-brand-600 text-white ring-2 ring-brand-300"
                        : isPast
                          ? "bg-gray-200 text-gray-400"
                          : isFirst
                            ? "bg-blue-500 text-white"
                            : isLast
                              ? "bg-green-500 text-white"
                              : "bg-gray-400 text-white"
                    }`}>
                      {isFirst ? <FaPlay className="h-2 w-2" /> : isLast ? <FaFlagCheckered className="h-2 w-2" /> : i}
                    </div>
                    {i < routeInfo.instructions.length - 1 && (
                      <div className={`w-px h-3 my-0.5 ${isPast ? "bg-gray-200" : "bg-gray-200"}`} />
                    )}
                  </div>
                  <div className={`flex-1 min-w-0 pb-2 ${isPast ? "opacity-40" : ""}`}>
                    <div className={`flex items-center gap-1.5 text-sm ${isCurrent ? "font-bold text-brand-700" : "text-gray-800"}`}>
                      {!isFirst && !isLast && inst.modifier && getDirectionIcon(inst.modifier)}
                      <span className={isFirst || isLast ? "font-medium" : ""}>
                        {isFirst ? "Head to pickup location" : isLast ? "Arrive at destination" : (inst.text || "Continue")}
                      </span>
                    </div>
                    {inst.distance > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">{formatStepDist(inst.distance)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PickupRouteMap;
