'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check, Users } from 'lucide-react';

interface RegionTeamsManagerProps {
  regions: any[];
  showAlert: (type: 'success' | 'error' | 'info', msg: string) => void;
  getAuthHeaders: () => Record<string, string>;
  API_BASE_URL: string;
}

export default function RegionTeamsManager({ regions, showAlert, getAuthHeaders, API_BASE_URL }: RegionTeamsManagerProps) {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTeamId, setEditTeamId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{ name: string, region_ids: number[] }>({ name: '', region_ids: [] });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/region-groups`, { headers: getAuthHeaders(), cache: 'no-store' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal memuat tim');
      }
      const data = await res.json();
      setTeams(data);
    } catch (e: any) {
      showAlert('error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) return showAlert('error', 'Nama tim wajib diisi');
    
    setIsLoading(true);
    try {
      const url = editTeamId ? `${API_BASE_URL}/region-groups/${editTeamId}` : `${API_BASE_URL}/region-groups`;
      const method = editTeamId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal menyimpan tim');
      }
      
      showAlert('success', 'Berhasil menyimpan tim region');
      setShowModal(false);
      fetchTeams();
    } catch (e: any) {
      showAlert('error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus tim ini?')) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/region-groups/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal menghapus');
      }
      showAlert('success', 'Tim dihapus');
      fetchTeams();
    } catch (e: any) {
      showAlert('error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRegion = (regId: number) => {
    setFormData(prev => ({
      ...prev,
      region_ids: prev.region_ids.includes(regId)
        ? prev.region_ids.filter(id => id !== regId)
        : [...prev.region_ids, regId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-800">Manajemen Tim Region</h2>
          <p className="text-xs text-slate-500">Kelompokkan cabang agar admin dan keuangan dapat saling membantu lintas cabang.</p>
        </div>
        <button
          onClick={() => {
            setEditTeamId(null);
            setFormData({ name: '', region_ids: [] });
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={16} /> Buat Tim Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map(team => (
          <div key={team.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{team.name}</h3>
                  <p className="text-[10px] text-slate-500">{team.regions?.length || 0} Cabang Tergabung</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditTeamId(team.id);
                    setFormData({ name: team.name, region_ids: team.regions?.map((r: any) => r.id) || [] });
                    setShowModal(true);
                  }}
                  className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cabang:</p>
              <div className="flex flex-wrap gap-2">
                {team.regions?.length > 0 ? team.regions.map((r: any) => (
                  <span key={r.id} className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-semibold">
                    {r.name}
                  </span>
                )) : <span className="text-xs text-slate-400 italic">Belum ada cabang</span>}
              </div>
            </div>
          </div>
        ))}
        {teams.length === 0 && !isLoading && (
          <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-400 text-sm font-medium">Belum ada tim region yang dibuat.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800">{editTeamId ? 'Edit Tim' : 'Buat Tim Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Tim</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Tim Sumatera"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Pilih Cabang untuk Bergabung</label>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {regions.map((r: any) => {
                    const isSelected = formData.region_ids.includes(r.id);
                    return (
                      <div
                        key={r.id}
                        onClick={() => toggleRegion(r.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                      >
                        <span className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{r.name}</span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-transparent'}`}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Tim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
