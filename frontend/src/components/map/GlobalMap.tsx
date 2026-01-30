import type { FC } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TelemetryReading } from '../../hooks/useTelemetry';
import { motion } from 'framer-motion';

// Fix for default marker icons in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker Colors based on Status
const getMarkerIcon = (status: string, hasAlert: boolean) => {
    let color = "#10b981"; // Green (Online)
    if (hasAlert) color = "#ef4444"; // Red (Alert)
    if (status === "OFFLINE") color = "#6b7280"; // Gray

    const svgHtml = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21L12 21.01M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17ZM12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="3" fill="${color}" class="${hasAlert ? 'animate-pulse' : ''}"/>
    </svg>`;

    return L.divIcon({
        html: svgHtml,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
};

interface GlobalMapProps {
    devices: Record<string, TelemetryReading[]>;
    onDeviceSelect: (id: string) => void;
}

export const GlobalMap: FC<GlobalMapProps> = ({ devices, onDeviceSelect }) => {
    const activeDevices = Object.entries(devices).map(([id, history]) => ({
        id,
        latest: history[history.length - 1]
    }));

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full w-full rounded-3xl overflow-hidden border border-white/5 relative z-0"
        >
            <MapContainer
                center={[31.7917, -7.0926]} // Center of Morocco
                zoom={6}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {activeDevices.map((device) => (
                    <Marker
                        key={device.id}
                        position={[device.latest.lat, device.latest.lon]}
                        icon={getMarkerIcon(device.latest.status, !!device.latest.alert)}
                        eventHandlers={{
                            click: () => onDeviceSelect(device.id),
                        }}
                    >
                        <Popup className="custom-popup">
                            <div className="p-2 text-black">
                                <h3 className="font-bold border-b mb-1">{device.id}</h3>
                                <p className="text-xs">Location: {device.latest.lat.toFixed(2)}, {device.latest.lon.toFixed(2)}</p>
                                <p className="text-sm">Temp: <span className={device.latest.alert ? 'text-red-600 font-bold' : ''}>{device.latest.temperature}°C</span></p>
                                <button
                                    onClick={() => onDeviceSelect(device.id)}
                                    className="mt-2 w-full py-1 bg-black text-white text-[10px] rounded uppercase"
                                >
                                    Focus Device
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <div className="absolute top-4 right-4 z-[1000] glass px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest pointer-events-none">
                Live Fleet Status
            </div>
        </motion.div>
    );
};
