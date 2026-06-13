import React, { useState, useMemo } from 'react';
import { renderToString } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Recycle, Train, Zap, ShoppingBasket, TreePine, Search, Plus, Minus, Mountain } from 'lucide-react';
import L from 'leaflet';

// Fix Leaflet's default icon path issues with bundlers
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { MarkerData, GREEN_SPOTS, CITIES } from '../data/mapData';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a));
}

const CustomZoomControl = () => {
  const map = useMap();
  const [isZoomingIn, setIsZoomingIn] = useState(false);
  const [isZoomingOut, setIsZoomingOut] = useState(false);

  const handleZoomIn = () => {
    setIsZoomingIn(true);
    map.zoomIn();
    setTimeout(() => setIsZoomingIn(false), 200);
  };

  const handleZoomOut = () => {
    setIsZoomingOut(true);
    map.zoomOut();
    setTimeout(() => setIsZoomingOut(false), 200);
  };

  const focusRegion = (pos: [number, number], zm: number) => {
    map.flyTo(pos, zm, { duration: 1.5 });
  };

  return (
    <>
      <div className="absolute left-4 bottom-4 z-[400] flex flex-col gap-2">
        <button 
          aria-label="Focus on Western Ghats"
          onClick={() => focusRegion([10.8505, 76.2711], 7)}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-all active:scale-95 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"
        >
          <TreePine size={14} aria-hidden="true" />
          Western Ghats
        </button>
        <button 
          aria-label="Focus on Himalayas"
          onClick={() => focusRegion([31.1048, 77.1667], 7)}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-all active:scale-95 text-xs font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1.5"
        >
          <Mountain size={14} aria-hidden="true" />
          Himalayas
        </button>
      </div>

      <div className="absolute right-4 bottom-4 z-[400] flex flex-col gap-2">
        <button 
          onClick={handleZoomIn}
          aria-label="Zoom In"
          className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur block p-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-transform ${isZoomingIn ? 'scale-90 bg-emerald-50' : 'scale-100'} text-gray-700 dark:text-gray-300`}
          title="Zoom In"
        >
          <Plus size={20} />
        </button>
        <button 
          onClick={handleZoomOut}
           aria-label="Zoom Out"
          className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur block p-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-transform ${isZoomingOut ? 'scale-90 bg-emerald-50' : 'scale-100'} text-gray-700 dark:text-gray-300`}
          title="Zoom Out"
        >
          <Minus size={20} />
        </button>
      </div>
    </>
  );
};

const MapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [map, center, zoom]);
  return null;
};

const createCustomIcon = (type: MarkerData['type'], isHighlighted: boolean = false) => {
  let IconCmp = MapPin;
  let bgColorClass = 'bg-emerald-500';
  
  switch (type) {
    case 'recycling':
      IconCmp = Recycle;
      bgColorClass = 'bg-blue-500';
      break;
    case 'transit':
      IconCmp = Train;
      bgColorClass = 'bg-indigo-500';
      break;
    case 'ev':
      IconCmp = Zap;
      bgColorClass = 'bg-amber-500';
      break;
    case 'market':
      IconCmp = ShoppingBasket;
      bgColorClass = 'bg-orange-500';
      break;
    case 'park':
      IconCmp = TreePine;
      bgColorClass = 'bg-green-500';
      break;
  }

  const pulseClass = isHighlighted ? 'animate-pulse ring-4 ring-emerald-500 ring-opacity-50' : '';
  const scaleClass = isHighlighted ? 'scale-125 z-50' : 'scale-100 z-10';

  const html = renderToString(
    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white shadow-md border-2 border-white transition-all transform ${bgColorClass} ${pulseClass} ${scaleClass}`}>
      <IconCmp size={18} aria-hidden="true" />
    </div>
  );

  return L.divIcon({
    html,
    className: 'bg-transparent border-0',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const iconCache = new Map<string, L.DivIcon>();
const getCachedIcon = (type: MarkerData['type'], isHighlighted: boolean) => {
  const cacheKey = `${type}-${isHighlighted}`;
  if (!iconCache.has(cacheKey)) {
    iconCache.set(cacheKey, createCustomIcon(type, isHighlighted));
  }
  return iconCache.get(cacheKey)!;
};

const LocalMap: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState(CITIES[0].id);
  const [nearbySpots, setNearbySpots] = useState<MarkerData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([25.0, 45.0]);
  const [mapZoom, setMapZoom] = useState(2);

  const handleFindNearby = () => {
    const city = CITIES.find(c => c.id === selectedCity);
    if (!city) return;
    
    const sorted = [...GREEN_SPOTS].sort((a, b) => {
        return getDistance(city.position[0], city.position[1], a.position[0], a.position[1]) - 
               getDistance(city.position[0], city.position[1], b.position[0], b.position[1]);
    });
    
    const closest = sorted.slice(0, 3);
    setNearbySpots(closest);
    setMapCenter(city.position as [number, number]);
    setMapZoom(11);
  };

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/40 dark:border-gray-700 rounded-3xl overflow-hidden shadow-lg space-y-0 h-[500px] flex flex-col items-stretch relative z-0">
      <div className="bg-emerald-50 dark:bg-emerald-900/30 px-5 py-3 border-b border-emerald-100 dark:border-emerald-800/50 flex flex-col gap-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Global & Local Green Spots</h3>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            aria-label="Select a city"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="flex-1 min-w-[120px] bg-white dark:bg-gray-700 border border-emerald-200 dark:border-emerald-700 text-gray-900 dark:text-gray-100 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2"
          >
            {CITIES.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
          <button 
            onClick={handleFindNearby}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Search size={16} />
            Find Nearby
          </button>
        </div>
      </div>
      <div className="flex-1 w-full bg-gray-100 z-0 relative">
        {nearbySpots.length > 0 && (
          <div className="absolute top-4 left-4 z-[400] bg-white/95 dark:bg-gray-800/95 backdrop-blur shadow-xl border border-gray-100 dark:border-gray-700 rounded-2xl p-4 w-64 md:w-72 max-h-[80%] overflow-y-auto">
            <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-3">3 Closest Eco-Spots</h4>
            <div className="space-y-3">
              {nearbySpots.map(spot => (
                <div key={spot.id} className="border-l-2 border-emerald-500 pl-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{spot.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 dark:text-gray-400 mt-1">{spot.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          scrollWheelZoom={false}
          zoomControl={false}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <CustomZoomControl />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {GREEN_SPOTS.map((spot) => {
            const isHighlighted = nearbySpots.some(s => s.id === spot.id);
            return (
              <Marker key={spot.id} position={spot.position} icon={getCachedIcon(spot.type, isHighlighted)}>
                <Popup>
                  <div className="p-1 max-w-[200px]">
                    <h4 className="font-bold text-gray-900 text-sm m-0">{spot.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{spot.description}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default LocalMap;
