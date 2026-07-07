export interface Coordinates {
  lat: number;
  lng: number;
}

export function getLocalityCoords(localityTarget: string): Coordinates {
  const clean = (localityTarget || "").trim().toLowerCase();
  
  // Mapped standard localities for Pune/Kolhapur area mapping
  const known: Record<string, Coordinates> = {
    "gokuldham": { lat: 18.5204, lng: 73.8567 },
    "gokuldham society": { lat: 18.5204, lng: 73.8567 },
    "kothrud": { lat: 18.5074, lng: 73.8077 },
    "aundh": { lat: 18.5580, lng: 73.8075 },
    "viman nagar": { lat: 18.5679, lng: 73.9143 },
    "hinjewadi": { lat: 18.5913, lng: 73.7389 },
    "deccan": { lat: 18.5173, lng: 73.8443 },
    "hadapsar": { lat: 18.5089, lng: 73.9259 },
    "kalyani nagar": { lat: 18.5475, lng: 73.9033 },
    "baner": { lat: 18.5590, lng: 73.7787 },
  };

  // Check if any key is contained in the input
  for (const [key, coords] of Object.entries(known)) {
    if (clean.includes(key)) {
      return coords;
    }
  }

  // Deterministic fallback based on string hashing, to keep consistent values for the same locality
  let hashVal = 0;
  for (let i = 0; i < clean.length; i++) {
    hashVal = clean.charCodeAt(i) + ((hashVal << 5) - hashVal);
  }
  
  // Offset slightly from Pune center (18.5204, 73.8567)
  const latOffset = (Math.abs(hashVal) % 100) / 1000;
  const lngOffset = (Math.abs(hashVal >> 8) % 100) / 1000;
  return {
    lat: 18.5204 + (hashVal < 0 ? -latOffset : latOffset),
    lng: 73.8567 + ((hashVal >> 8) < 0 ? -lngOffset : lngOffset),
  };
}

export function getDistanceKm(c1: Coordinates, c2: Coordinates): number {
  const R = 6371; // Radius of earth in km
  const dLat = (c2.lat - c1.lat) * Math.PI / 180;
  const dLng = (c2.lng - c1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Number((R * c).toFixed(1)); // 1 decimal point e.g. 2.4 km
}
