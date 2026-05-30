'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Loader, Navigation, LocateFixed } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface MapPickerProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void;
  onCancel: () => void;
}

const MapEvents = ({ onMoveEnd }: { onMoveEnd: (center: any) => void }) => {
  const map = useMapEvents({
    moveend: () => {
      onMoveEnd(map.getCenter());
    },
  });
  return null;
};

const LocateControl = ({ setCenter, fetchAddress }: { setCenter: any, fetchAddress: any }) => {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const locateUser = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        map.flyTo([newLat, newLng], 16, { animate: true, duration: 1.5 });
        setCenter({ lat: newLat, lng: newLng });
        fetchAddress(newLat, newLng);
        setLocating(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          alert('Akses lokasi ditolak oleh browser. Silakan klik ikon gembok/lokasi di address bar (URL) browser Anda dan izinkan akses lokasi.');
        } else if (err.code === err.TIMEOUT) {
          alert('Waktu habis saat mencari lokasi. Pastikan GPS/Location Windows Anda menyala.');
        } else {
          alert('Gagal mendeteksi lokasi GPS Anda. Pastikan izin lokasi (GPS) pada perangkat dan browser Anda aktif.');
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="absolute bottom-6 right-4 z-[500]">
      <button
        onClick={(e) => { e.preventDefault(); locateUser(); }}
        className="bg-white p-3 rounded-full shadow-lg border border-slate-100 text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center cursor-pointer"
        title="Deteksi Lokasi Saya"
      >
        {locating ? <Loader size={20} className="animate-spin" /> : <LocateFixed size={20} />}
      </button>
    </div>
  );
};

export default function MapPicker({ onLocationSelect, onCancel }: MapPickerProps) {
  const [center, setCenter] = useState({ lat: -6.200000, lng: 106.816666 });
  const [address, setAddress] = useState('Memuat lokasi...');
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCenter(newCenter);
          fetchAddress(newCenter.lat, newCenter.lng);
          setMapReady(true);
        },
        (err) => {
          // Fallback to default
          fetchAddress(center.lat, center.lng);
          setMapReady(true);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      fetchAddress(center.lat, center.lng);
      setMapReady(true);
    }
  }, []);

  const fetchAddress = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'Accept-Language': 'id-ID,id'
        }
      });
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress("Lokasi Peta");
      }
    } catch (error) {
      setAddress("Lokasi Peta");
    }
    setLoading(false);
  };

  const handleMoveEnd = (newCenter: any) => {
    setCenter({ lat: newCenter.lat, lng: newCenter.lng });
    fetchAddress(newCenter.lat, newCenter.lng);
  };

  const handleConfirm = () => {
    onLocationSelect(address, center.lat, center.lng);
  };

  if (!mapReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <Loader className="animate-spin text-indigo-500 mb-3" size={30} />
        <p className="text-xs font-bold text-slate-500 animate-pulse">Meminta akses lokasi & memuat peta...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Map Container */}
      <div className="relative flex-1 w-full z-0">
        <MapContainer 
          center={[center.lat, center.lng]} 
          zoom={16} 
          scrollWheelZoom={true} 
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onMoveEnd={handleMoveEnd} />
          <LocateControl setCenter={setCenter} fetchAddress={fetchAddress} />
        </MapContainer>

        {/* Center Pin Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-[400] pointer-events-none pb-2">
          <div className="bg-rose-600 text-white p-2.5 rounded-full shadow-lg border-[3px] border-white">
            <MapPin size={22} fill="currentColor" strokeWidth={1.5} />
          </div>
          {/* Pin Shadow */}
          <div className="w-5 h-1.5 bg-black/30 rounded-full mx-auto mt-0 blur-[2px]"></div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="bg-white rounded-t-[32px] shadow-[0_-15px_30px_rgba(0,0,0,0.1)] p-6 z-[400] shrink-0 -mt-6 relative">
        <div className="flex items-start gap-4 mb-5">
          <div className="bg-indigo-50 p-2.5 rounded-full text-indigo-600 shrink-0 mt-0.5">
            <Navigation size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Alamat Terpilih</p>
            {loading ? (
              <div className="flex items-center gap-2 text-indigo-600 text-sm font-bold">
                <Loader size={14} className="animate-spin" /> Menyesuaikan...
              </div>
            ) : (
              <p className="text-sm font-bold text-slate-800 line-clamp-3 leading-relaxed">{address}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 mt-2">
          <button
            onClick={onCancel}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs py-3.5 rounded-xl uppercase transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-slate-900 disabled:bg-slate-500 text-white font-extrabold text-xs py-3.5 rounded-xl uppercase transition shadow-lg shadow-slate-900/20 cursor-pointer"
          >
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  );
}
