import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { FaDirections } from "react-icons/fa";

import { generateGoogleMapsLink, isValidCoordinates } from "../../utils/map";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

const getTileUrl = () => {
  const isDark = document.documentElement.classList.contains("dark");
  const style = isDark ? "dark-v11" : "streets-v4";
  return `https://api.maptiler.com/maps/${style}/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;
};

const PickupLocationMap = ({ pickup }) => {
  const coords = pickup?.location?.coordinates;

  if (!isValidCoordinates(coords)) {
    return (
      <div className="rounded-xl border border-surface-100 dark:border-surface-200/60 bg-surface-50 dark:bg-surface-200/40 p-4 text-center">
        <p className="text-sm text-surface-400 dark:text-surface-500">Location not available</p>
      </div>
    );
  }

  const [lng, lat] = coords;
  const position = [lat, lng];
  const mapsLink = generateGoogleMapsLink(lat, lng);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-surface-100 dark:border-surface-200/60">
      <MapContainer
        center={position}
        zoom={16}
        style={{ height: "250px", width: "100%" }}
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
        <Marker position={position} />
      </MapContainer>

      <a
        href={mapsLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
      >
        <FaDirections className="h-3.5 w-3.5" />
        Navigate
      </a>
    </div>
  );
};

export default PickupLocationMap;