import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface CustomAlertDialogProps {
  message: string;
  onClose: () => void;
}

export default function CustomAlertDialog({ message, onClose }: CustomAlertDialogProps) {
  console.log('🎨 Rendering CustomAlertDialog! message:', message);
  // Determine alert type based on message content
  let type: 'success' | 'error' | 'warning' | 'info' = 'info';
  let cleanMessage = message;

  if (message.includes('✓') || message.includes('✅') || /berhasil|sukses/i.test(message)) {
    type = 'success';
    cleanMessage = message.replace(/[✓✅]/g, '').trim();
  } else if (message.includes('❌') || /gagal|error|salah/i.test(message)) {
    type = 'error';
    cleanMessage = message.replace(/[❌]/g, '').trim();
  } else if (message.includes('⚠️') || /perhatian|peringatan/i.test(message)) {
    type = 'warning';
    cleanMessage = message.replace(/[⚠️]/g, '').trim();
  }

  // Icons and colors configuration
  const config = {
    success: {
      bg: 'bg-emerald-50 text-emerald-600',
      icon: <CheckCircle size={32} className="text-emerald-500" />,
      btn: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 focus:ring-emerald-500/20 shadow-emerald-500/10'
    },
    error: {
      bg: 'bg-rose-50 text-rose-600',
      icon: <XCircle size={32} className="text-rose-500" />,
      btn: 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 focus:ring-rose-500/20 shadow-rose-500/10'
    },
    warning: {
      bg: 'bg-amber-50 text-amber-600',
      icon: <AlertTriangle size={32} className="text-amber-500" />,
      btn: 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 focus:ring-amber-500/20 shadow-amber-500/10'
    },
    info: {
      bg: 'bg-blue-50 text-blue-600',
      icon: <Info size={32} className="text-blue-500" />,
      btn: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 focus:ring-blue-500/20 shadow-blue-500/10'
    }
  };

  const activeConfig = config[type];

  // Auto close after 4.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-white border border-slate-200 rounded-[28px] shadow-2xl p-6 max-w-sm w-full text-center flex flex-col items-center max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon wrapper */}
        <div className={`w-14 h-14 rounded-2xl ${activeConfig.bg} flex items-center justify-center mb-4 shadow-inner`}>
          {activeConfig.icon}
        </div>
        
        {/* Title */}
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-2">
          {type === 'success' ? 'Berhasil' : type === 'error' ? 'Gagal' : type === 'warning' ? 'Perhatian' : 'Informasi'}
        </h3>

        {/* Message */}
        <p className="text-xs text-slate-650 font-semibold leading-relaxed mb-6 break-words px-2">
          {cleanMessage}
        </p>

        {/* Button */}
        <button
          onClick={onClose}
          className={`w-full py-2.5 px-4 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition duration-200 active:scale-[0.98] focus:outline-none focus:ring-4 cursor-pointer ${activeConfig.btn}`}
        >
          Oke
        </button>
      </div>
    </div>
  );
}
