import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { FaRoute, FaClock, FaSpinner } from "react-icons/fa";

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

const FollowCollector = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), { animate: true });
    }
  }, [map, position]);

  return null;
};

const FitBounds = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, bounds]);

  return null;
};

const LiveCollectorTracker = ({ pickup, collectorLocation, routeData }) => {
  const pickupCoords = pickup?.location?.coordinates;
  const hasPickup = isValidCoordinates(pickupCoords);

  if (!hasPickup) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-400">Pickup location not available</p>
      </div>
    );
  }

  const [pickLng, pickLat] = pickupCoords;
  const pickupPos = [pickLat, pickLng];

  const hasCollector = collectorLocation?.latitude != null && collectorLocation?.longitude != null;
  const collectorPos = hasCollector ? [collectorLocation.latitude, collectorLocation.longitude] : null;

  const hasRoute = routeData?.geometry?.length > 0;
  const routeGeometry = hasRoute ? routeData.geometry : null;

  let bounds = null;
  if (hasRoute) {
    bounds = L.latLngBounds(routeGeometry);
  } else if (hasCollector) {
    bounds = L.latLngBounds([collectorPos, pickupPos]);
  }

  const center = collectorPos || pickupPos;

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      {hasCollector && routeData && (
        <div className="flex items-center gap-3 bg-brand-50 px-4 py-2.5 border-b border-brand-100">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            <FaRoute className="h-3.5 w-3.5" />
            {routeData.distance} km
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            <FaClock className="h-3.5 w-3.5" />
            {formatDuration(routeData.duration)}
          </div>
        </div>
      )}

      {!hasCollector && (
        <div className="flex items-center justify-center bg-brand-50 px-4 py-2 border-b border-brand-100">
          <FaSpinner className="h-4 w-4 animate-spin text-brand-600 mr-2" />
          <span className="text-sm font-medium text-brand-700">Waiting for collector's GPS...</span>
        </div>
      )}

      {hasCollector && !routeData && (
        <div className="flex items-center justify-center bg-brand-50 px-4 py-2 border-b border-brand-100">
          <FaSpinner className="h-4 w-4 animate-spin text-brand-600 mr-2" />
          <span className="text-sm font-medium text-brand-700">Calculating route...</span>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={14}
        style={{ height: "280px", width: "100%" }}
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
        {hasCollector && <Marker position={collectorPos} icon={collectorIcon} />}
        <Marker position={pickupPos} icon={pickupIcon} />
        {routeGeometry && (
          <>
            <Polyline
              positions={routeGeometry}
              pathOptions={{ color: "#3b82f6", weight: 5, opacity: 0.8 }}
            />
            <FitBounds bounds={bounds} />
          </>
        )}
        {!hasRoute && bounds && <FitBounds bounds={bounds} />}
        {hasCollector && <FollowCollector position={collectorPos} />}
      </MapContainer>
    </div>
  );
};

export default LiveCollectorTracker;
