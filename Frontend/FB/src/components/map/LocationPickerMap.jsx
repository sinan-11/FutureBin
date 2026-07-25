import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { FaMapMarkerAlt, FaCrosshairs } from "react-icons/fa";

import { getCurrentLocation, reverseGeocode, DEFAULT_LOCATION } from "../../utils/map";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

const getTileUrl = () => {
  const isDark = document.documentElement.classList.contains("dark");
  const style = isDark ? "dark-v11" : "streets-v4";
  return `https://api.maptiler.com/maps/${style}/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;
};

const tileOptions = {
  tileSize: 256,
  minZoom: 1,
  crossOrigin: true,
};

const MapEvents = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const RecenterMap = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return null;
};

const LocationPickerMap = ({ onChange }) => {
  const [center, setCenter] = useState([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng]);
  const [markerPos, setMarkerPos] = useState(null);
  const [address, setAddress] = useState("");
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [addressManuallyEdited, setAddressManuallyEdited] = useState(false);
  const [mapActive, setMapActive] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const cacheRef = useRef(new Map());

  const doReverseGeocode = useCallback(
    (lat, lng) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();

      const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
      if (cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey);
        setAddress(cached);
        setGeocodingLoading(false);
        onChange({ coordinates: [lng, lat], address: cached });
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setGeocodingLoading(true);
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          const result = await reverseGeocode(lat, lng, controller.signal);
          cacheRef.current.set(cacheKey, result);
          setAddress(result);
          setAddressManuallyEdited(false);
          onChange({ coordinates: [lng, lat], address: result });
        } catch (err) {
          if (err.name !== "AbortError") {
            onChange({ coordinates: [lng, lat], address: "" });
          }
        } finally {
          setGeocodingLoading(false);
        }
      }, 600);
    },
    [onChange]
  );

  useEffect(() => {
    let cancelled = false;

    const tryCenter = async () => {
      try {
        const loc = await getCurrentLocation();
        if (!cancelled) setCenter([loc.lat, loc.lng]);
      } catch {
        // keep default center — no marker placed
      }
    };

    tryCenter();

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleMapClick = useCallback(
    (lat, lng) => {
      const pos = [lat, lng];
      setMarkerPos(pos);
      if (!addressManuallyEdited) {
        doReverseGeocode(lat, lng);
      } else {
        onChange({ coordinates: [lng, lat], address });
      }
    },
    [addressManuallyEdited, address, doReverseGeocode, onChange]
  );

  const handleMarkerDragEnd = useCallback(
    (e) => {
      const { lat, lng } = e.target.getLatLng();
      const pos = [lat, lng];
      setMarkerPos(pos);
      if (!addressManuallyEdited) {
        doReverseGeocode(lat, lng);
      } else {
        onChange({ coordinates: [lng, lat], address });
      }
    },
    [addressManuallyEdited, address, doReverseGeocode, onChange]
  );

  const [btnLoading, setBtnLoading] = useState(false);

  const handleUseCurrentLocation = async () => {
    try {
      setBtnLoading(true);
      const loc = await getCurrentLocation();
      const pos = [loc.lat, loc.lng];
      setCenter(pos);
      setMarkerPos(pos);
      doReverseGeocode(loc.lat, loc.lng);
    } catch {
      // silent
    } finally {
      setBtnLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    const val = e.target.value;
    setAddress(val);
    setAddressManuallyEdited(true);
    if (markerPos) {
      onChange({ coordinates: [markerPos[1], markerPos[0]], address: val });
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="relative h-[250px] sm:h-[320px]">
        {!mapActive && (
          <button
            type="button"
            onClick={() => setMapActive(true)}
            className="absolute inset-0 z-[999] flex flex-col items-center justify-center bg-gray-100/80 backdrop-blur-sm"
          >
            <FaMapMarkerAlt className="mb-2 h-8 w-8 text-brand-600" />
            <p className="text-sm font-semibold text-gray-700">Tap to open map</p>
            <p className="text-xs text-gray-400">Drag marker to adjust location</p>
          </button>
        )}
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
            url={getTileUrl()}
            tileSize={tileOptions.tileSize}
            minZoom={tileOptions.minZoom}
            crossOrigin={tileOptions.crossOrigin}
          />
          <MapEvents onMapClick={handleMapClick} />
          <RecenterMap position={center} />
          {markerPos && (
            <Marker
              position={markerPos}
              draggable
              eventHandlers={{ dragend: handleMarkerDragEnd }}
            />
          )}
        </MapContainer>
      </div>

      <div className="p-3 space-y-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={btnLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 active:scale-[0.97] disabled:opacity-50"
        >
          <FaCrosshairs className="h-3.5 w-3.5" />
          {btnLoading ? "Detecting..." : "Use Current Location"}
        </button>

        <div className="relative">
          <FaMapMarkerAlt className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={address}
            onChange={handleAddressChange}
            placeholder={geocodingLoading ? "Finding address..." : "Pickup address"}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          {geocodingLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPickerMap;