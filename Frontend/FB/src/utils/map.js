const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/reverse";

const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.209 };

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Location permission denied"));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information unavailable"));
            break;
          case error.TIMEOUT:
            reject(new Error("Location request timed out"));
            break;
          default:
            reject(new Error("Unable to determine your location"));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
};

export const reverseGeocode = async (lat, lng, signal) => {
  const url = `${NOMINATIM_BASE}?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Geocoding request failed");
  }

  const data = await response.json();

  if (!data || !data.display_name) {
    throw new Error("Unable to determine address");
  }

  return data.display_name;
};

export const generateGoogleMapsLink = (lat, lng) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
};

export const isValidCoordinates = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return false;

  const [lng, lat] = coords;

  if (typeof lng !== "number" || typeof lat !== "number") return false;
  if (Number.isNaN(lng) || Number.isNaN(lat)) return false;
  if (lng < -180 || lng > 180) return false;
  if (lat < -90 || lat > 90) return false;

  return true;
};

export { DEFAULT_LOCATION };