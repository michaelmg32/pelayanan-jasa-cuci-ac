'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchStaffGrades, createStaffGrade, updateStaffGrade, deleteStaffGrade,
  assignTeam, fetchSalaryStaff, getAuthHeaders, updateStaffSalarySettings, triggerMonthlySalaryProcessing
} from '@/lib/api';
import type { StaffGrade, User } from '@/types';
import { Users, UserCheck, CheckCircle, Clock, Search, X, Award, Wallet, ReceiptText, Pencil, Trash2 } from 'lucide-react';

const formatRupiah = (n: any) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n) || 0);

const formatMonth = (ym: string) => {
  const [y, m] = ym.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${months[parseInt(m) - 1]} ${y}`;
};

// Modals
function GradeModal({ grade, onClose, onSave }: { grade: StaffGrade | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: grade?.name || '',
    description: grade?.description || '',
    leader_daily_base_salary: grade?.leader_daily_base_salary || 0,
    leader_daily_travel_allowance: grade?.leader_daily_travel_allowance || 0,
    leader_point_reward: grade?.leader_point_reward || 0,
    leader_monthly_base_salary: grade?.leader_monthly_base_salary || 0,
    leader_monthly_travel_allowance: grade?.leader_monthly_travel_allowance || 0,
    member_daily_base_salary: grade?.member_daily_base_salary || 0,
    member_daily_travel_allowance: grade?.member_daily_travel_allowance || 0,
    member_point_reward: grade?.member_point_reward || 0,
    member_monthly_base_salary: grade?.member_monthly_base_salary || 0,
    member_monthly_travel_allowance: grade?.member_monthly_travel_allowance || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (grade) { await updateStaffGrade(grade.id, form); }
      else { await createStaffGrade(form); }
      onSave(); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="gaji-modal-overlay" onClick={onClose}>
      <div className="gaji-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="gaji-modal-header">
          <h3>{grade ? 'Edit Grade / Tim' : '➕ Tambah Grade Tim Baru'}</h3>
          <button className="gaji-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="gaji-form-group">
            <label>Nama Grade / Tim *</label>
            <input required className="gaji-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Teknisi AC VIP" />
          </div>
          <div className="gaji-form-group">
            <label>Deskripsi</label>
            <textarea className="gaji-input gaji-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi tim..." />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserCheck size={16} /> Gaji Leader</h4>
              <div className="gaji-form-group">
                <label>Gaji Pokok Harian (Rp)</label>
                <input type="number" min="0" className="gaji-input" value={form.leader_daily_base_salary} onChange={e => setForm({ ...form, leader_daily_base_salary: Number(e.target.value) })} />
              </div>
              <div className="gaji-form-group">
                <label>Uang Jalan Harian (Rp)</label>
                <input type="number" min="0" className="gaji-input" value={form.leader_daily_travel_allowance} onChange={e => setForm({ ...form, leader_daily_travel_allowance: Number(e.target.value) })} />
              </div>
              <div className="gaji-form-group" style={{ marginTop: '0.5rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }}>
                <label style={{ color: '#4338ca' }}>Gaji Pokok Bulanan (Rp)</label>
                <input type="number" min="0" className="gaji-input" value={form.leader_monthly_base_salary} onChange={e => setForm({ ...form, leader_monthly_base_salary: Number(e.target.value) })} />
              </div>
              <div className="gaji-form-group">
                <label style={{ color: '#4338ca' }}>Uang Jalan Bulanan (Rp)</label>
                <input type="number" min="0" className="gaji-input" value={form.leader_monthly_travel_allowance} onChange={e => setForm({ ...form, leader_monthly_travel_allowance: Number(e.target.value) })} />
              </div>
              <div className="gaji-form-group">
                <label>Poin per Order Selesai</label>
                <input type="number" min="0" step="0.1" className="gaji-input" value={form.leader_point_reward} onChange={e => setForm({ ...form, leader_point_reward: Number(e.target.value) })} />
              </div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={16} /> Gaji Anggota</h4>
              <div className="gaji-form-group">
                <label>Gaji Pokok Harian (Rp)</label>
                <input type="number" min="0" className="gaji-input" value={form.member_daily_base_salary} onChange={e => setForm({ ...form, member_daily_base_salary: Number(e.target.value) })} />
              </div>
              <div className="gaji-form-group">
                <label>Uang Jalan Harian (Rp)</label>
                <input type="number" min="0" className="gaji-input" value={form.member_daily_travel_allowance} onChange={e => setForm({ ...form, member_daily_travel_allowance: Number(e.target.value) })} />
              </div>
              <div className="gaji-form-group" style={{ marginTop: '0.5rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }}>
                <label style={{ color: '#0369a1' }}>Gaji Pokok Bulanan (Rp)</label>
                <input type="number" min="0" className="gaji-input" value={form.member_monthly_base_salary} onChange={e => setForm({ ...form, member_monthly_base_salary: Number(e.target.value) })} />
              </div>
              <div className="gaji-form-group">
                <label style={{ color: '#0369a1' }}>Uang Jalan Bulanan (Rp)</label>
                <input type="number" min="0" className="gaji-input" value={form.member_monthly_travel_allowance} onChange={e => setForm({ ...form, member_monthly_travel_allowance: Number(e.target.value) })} />
              </div>
              <div className="gaji-form-group">
                <label>Poin per Order Selesai</label>
                <input type="number" min="0" step="0.1" className="gaji-input" value={form.member_point_reward} onChange={e => setForm({ ...form, member_point_reward: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          
          {error && <div className="gaji-error">{error}</div>}
          <div className="gaji-modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="gaji-btn gaji-btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="gaji-btn gaji-btn-primary" disabled={loading}>{loading ? '⏳...' : '💾 Simpan Grade'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GajiDashboard({ activeUser, embedded = false }: { activeUser: User, embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<'grade' | 'assign' | 'proses' | 'riwayat'>('grade');
  
  // Data State
  const [grades, setGrades] = useState<StaffGrade[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [historyClaims, setHistoryClaims] = useState<any[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<StaffGrade | null>(null);

  // Assign Team State
  const [assignGradeId, setAssignGradeId] = useState('');
  const [assignLeaderId, setAssignLeaderId] = useState('');
  const [assignMemberIds, setAssignMemberIds] = useState<string[]>([]);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');
  const [editingSettings, setEditingSettings] = useState<{ [id: string]: { type: string, date: number | null } }>({});

  const handleSalarySettingsChange = async (userId: string, type: string, date: number | null) => {
    try {
      await updateStaffSalarySettings(userId, type, date);
      setStaffList(prev => prev.map(s => s.id === userId ? { ...s, salary_type: type, monthly_salary_date: date } : s));
    } catch (err) {
      alert('Gagal update pengaturan gaji');
    }
  };

  const loadGrades = useCallback(async () => {
    try { const data = await fetchStaffGrades(); setGrades(data); } catch { }
  }, []);

  const loadStaff = useCallback(async () => {
    try { const data = await fetchSalaryStaff(); setStaffList(data); } catch { }
  }, []);

  const loadClaims = useCallback(async () => {
    try {
      const res = await fetch('/api/claims', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setClaims(data.filter((c: any) => c.status === 'pending'));
        setHistoryClaims(data.filter((c: any) => c.status !== 'pending'));
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (activeTab === 'grade') loadGrades();
    if (activeTab === 'assign') { loadGrades(); loadStaff(); }
    if (activeTab === 'proses' || activeTab === 'riwayat') { loadStaff(); loadClaims(); }
  }, [activeTab, loadGrades, loadStaff, loadClaims]);

  // Auto-prepopulate Leader & Members when a Team (Grade) is selected
  useEffect(() => {
    if (assignGradeId && staffList.length > 0) {
      const currentLeader = staffList.find(s => s.grade_id === assignGradeId && s.is_leader);
      setAssignLeaderId(currentLeader ? currentLeader.id : '');
      const currentMembers = staffList.filter(s => s.grade_id === assignGradeId && !s.is_leader).map(s => s.id);
      setAssignMemberIds(currentMembers);
    } else {
      setAssignLeaderId('');
      setAssignMemberIds([]);
    }
  }, [assignGradeId, staffList]);

  const handleAssignTeam = async () => {
    setAssignError(''); setAssignSuccess('');
    if (!assignGradeId || !assignLeaderId) {
      setAssignError('Silakan pilih Grade dan Team Leader.'); return;
    }
    setLoading(true);
    try {
      await assignTeam(assignGradeId, assignLeaderId, assignMemberIds);
      setAssignSuccess('Tim berhasil dibentuk!');
      loadStaff();
      setAssignGradeId(''); setAssignLeaderId(''); setAssignMemberIds([]);
    } catch (err: any) { setAssignError(err.message); }
    finally { setLoading(false); }
  };

  const toggleMember = (id: string) => {
    if (assignMemberIds.includes(id)) {
      setAssignMemberIds(assignMemberIds.filter(m => m !== id));
    } else {
      setAssignMemberIds([...assignMemberIds, id]);
    }
  };

  const handleProcessClaim = async (claimId: string, status: 'approved' | 'rejected') => {
    if (status === 'approved' && !confirm('Yakin ingin menyetujui pencairan dana ini?')) return;
    if (status === 'rejected' && !confirm('Yakin ingin menolak klaim ini? Dana/Poin akan dikembalikan.')) return;
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert('Klaim berhasil diproses.');
        loadClaims(); loadStaff();
      } else {
        const err = await res.json();
        alert('Gagal memproses klaim: ' + err.error);
      }
    } catch (e: any) {
      alert('Terjadi kesalahan: ' + e.message);
    }
  };

  return (
    <div className="gaji-container" style={{ padding: embedded ? '0' : '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER NAV */}
      <nav className="gaji-nav">
        {[
          { id: 'grade', icon: <Award size={24} strokeWidth={1.5} />, label: 'Kelola Grade', desc: 'Templat tim' },
          { id: 'assign', icon: <Users size={24} strokeWidth={1.5} />, label: 'Assign Grade', desc: 'Susunan tim' },
          { id: 'proses', icon: <Wallet size={24} strokeWidth={1.5} />, label: 'Proses Gaji', desc: 'Saldo' },
          { id: 'riwayat', icon: <ReceiptText size={24} strokeWidth={1.5} />, label: 'Riwayat Slip', desc: 'Histori' }
        ].map(t => (
          <button key={t.id} className={`gaji-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id as any)}>
            <div className="gaji-tab-icon-wrapper">{t.icon}</div>
            <div className="gaji-tab-text">
              <strong>{t.label}</strong>
              <span>{t.desc}</span>
            </div>
          </button>
        ))}
      </nav>

      <div className="gaji-content">
        {/* ================= 1. KELOLA GRADE ================= */}
        {activeTab === 'grade' && (
          <div className="gaji-content-card animate-fade-in">
            <div className="gaji-card-header" style={{ borderBottom: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#eef2ff', padding: '0.5rem', borderRadius: '50%', color: '#4f46e5', display: 'flex' }}><Award size={24} /></div>
                Kelola Templat Tim & Grade
              </h2>
              <button className="gaji-btn gaji-btn-primary" style={{ borderRadius: '9999px', padding: '0.6rem 1.5rem', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }} onClick={() => { setEditingGrade(null); setShowGradeModal(true); }}>
                + Tambah Grade
              </button>
            </div>
            {grades.length === 0 ? (
              <div className="gaji-empty">
                <div className="gaji-empty-icon">🏅</div>
                <p>Belum ada grade. Buat templat tim pertama Anda!</p>
              </div>
            ) : (
              <div className="gaji-grid">
                {grades.map(g => (
                  <div key={g.id} className="gaji-grade-card" style={{ border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '1.5rem', backgroundColor: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s', cursor: 'default' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{g.name}</h3>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{g.description || 'Tidak ada deskripsi'}</span>
                      </div>
                      <div className="gaji-actions">
                        <button className="gaji-icon-btn" style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem', transition: 'color 0.2s' }} onClick={() => { setEditingGrade(g); setShowGradeModal(true); }}>
                          <Pencil size={18} />
                        </button>
                        <button className="gaji-icon-btn text-danger" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', transition: 'color 0.2s' }} onClick={async () => {
                          if (confirm('Yakin hapus grade ini?')) { await deleteStaffGrade(g.id); loadGrades(); }
                        }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5', marginBottom: '0.5rem' }}>👨‍💼 LEADER</div>
                        <div style={{ fontSize: '0.85rem' }}>Gaji: <strong>{formatRupiah(g.leader_daily_base_salary)}</strong>/hari</div>
                        <div style={{ fontSize: '0.85rem' }}>Jalan: <strong>{formatRupiah(g.leader_daily_travel_allowance)}</strong>/hari</div>
                        <div style={{ fontSize: '0.85rem' }}>Poin: <strong>{g.leader_point_reward}</strong>/order</div>
                      </div>
                      <div style={{ backgroundColor: '#f0f9ff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0ea5e9', marginBottom: '0.5rem' }}>👨‍🔧 MEMBER</div>
                        <div style={{ fontSize: '0.85rem' }}>Gaji: <strong>{formatRupiah(g.member_daily_base_salary)}</strong>/hari</div>
                        <div style={{ fontSize: '0.85rem' }}>Jalan: <strong>{formatRupiah(g.member_daily_travel_allowance)}</strong>/hari</div>
                        <div style={{ fontSize: '0.85rem' }}>Poin: <strong>{g.member_point_reward}</strong>/order</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= 2. ASSIGN GRADE & LEADER ================= */}
        {activeTab === 'assign' && (
          <div className="gaji-assign-container animate-fade-in">
            {/* Form Assign */}
            <div className="gaji-content-card">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>👥 Susunan Tim</h2>
              <div className="gaji-form-group">
                <label>Pilih Grade (Tim)</label>
                <select className="gaji-input" value={assignGradeId} onChange={e => setAssignGradeId(e.target.value)}>
                  <option value="">-- Pilih Grade --</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="gaji-form-group">
                <label>Pilih Team Leader</label>
                <select className="gaji-input" value={assignLeaderId} onChange={e => setAssignLeaderId(e.target.value)}>
                  <option value="">-- Pilih Karyawan --</option>
                  {staffList.filter(s => !assignMemberIds.includes(s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="gaji-form-group" style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Anggota Tim Terpilih</span>
                  <span style={{ color: '#4f46e5', fontWeight: 700 }}>{assignMemberIds.length} Orang</span>
                </label>
                  {assignMemberIds.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', textAlign: 'center', border: '1px dashed #cbd5e1' }}>Belum ada anggota yang dipilih dari daftar.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {assignMemberIds.map(id => {
                      const st = staffList.find(s => s.id === id);
                      return (
                        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.6rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.6rem' }}>{st?.name.substring(0, 2).toUpperCase()}</div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{st?.name}</span>
                          </div>
                          <button type="button" onClick={() => toggleMember(id)} style={{ color: '#ef4444', background: '#fee2e2', border: 'none', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}><X size={14}/></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {assignError && <div className="gaji-error" style={{ fontSize: '0.8rem', marginTop: '1rem' }}>{assignError}</div>}
              {assignSuccess && <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600, marginTop: '1rem', padding: '0.75rem', backgroundColor: '#d1fae5', borderRadius: '0.5rem' }}>{assignSuccess}</div>}

              <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <button 
                  className="gaji-btn" 
                  style={{ width: '100%', padding: '0.8rem', background: 'linear-gradient(to right, #4f46e5, #3b82f6)', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)', transition: 'all 0.2s' }}
                  onClick={handleAssignTeam}
                  disabled={loading || !assignGradeId || !assignLeaderId}
                >
                  {loading ? 'Menyimpan...' : '💾 Simpan Tim & Anggota'}
                </button>
              </div>
            </div>

            {/* Kanan: Daftar Karyawan (Pilih Member) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: 0 }}>Pilih Anggota Tim</h3>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="text" placeholder="Cari karyawan..." className="gaji-input" style={{ paddingLeft: '2rem', padding: '0.4rem 0.75rem 0.4rem 2rem', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {staffList.filter(s => s.id !== assignLeaderId).map(staff => (
                  <div 
                    key={staff.id} 
                    onClick={() => toggleMember(staff.id)}
                    style={{ 
                      padding: '1rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                      border: assignMemberIds.includes(staff.id) ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                      backgroundColor: assignMemberIds.includes(staff.id) ? '#eef2ff' : '#fff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: assignMemberIds.includes(staff.id) ? '#4f46e5' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
                          {staff.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{staff.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                            {staff.grade_name || 'Belum ada Grade'}
                            {staff.is_leader ? <span style={{ color: '#4f46e5', fontWeight: 700, marginLeft: '0.25rem' }}>(Leader)</span> : ''}
                            {staff.leader_name ? <span style={{ marginLeft: '0.25rem' }}>• Tim {staff.leader_name}</span> : ''}
                          </div>
                        </div>
                      </div>
                      {assignMemberIds.includes(staff.id) && <CheckCircle size={18} color="#4f46e5" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. PROSES GAJI ================= */}
        {activeTab === 'proses' && (
          <div className="gaji-content-card animate-fade-in">
            {/* Info Pengajuan Klaim Pending */}
            {claims.length > 0 && (
              <div className="animate-fade-in" style={{ borderLeft: '4px solid #f59e0b', backgroundColor: '#fffbeb', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b45309', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={18} /> Pengajuan Klaim Menunggu Persetujuan ({claims.length})</h3>
                <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #fde68a' }}>
                  <table className="gaji-table" style={{ border: 'none', margin: 0 }}>
                    <thead style={{ backgroundColor: '#fef3c7' }}>
                      <tr>
                        <th style={{ color: '#b45309', borderBottom: '1px solid #fde68a' }}>TANGGAL</th>
                        <th style={{ color: '#b45309', borderBottom: '1px solid #fde68a' }}>KARYAWAN</th>
                        <th style={{ color: '#b45309', borderBottom: '1px solid #fde68a' }}>JENIS KLAIM</th>
                        <th style={{ color: '#b45309', borderBottom: '1px solid #fde68a' }}>NOMINAL</th>
                        <th style={{ color: '#b45309', borderBottom: '1px solid #fde68a' }}>CATATAN</th>
                        <th style={{ color: '#b45309', borderBottom: '1px solid #fde68a' }}>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map((c, idx) => {
                        const staff = staffList.find(s => s.id === c.user_id);
                        return (
                          <tr key={c.id} style={{ borderBottom: idx === claims.length - 1 ? 'none' : '1px solid #fde68a' }}>
                            <td style={{ color: '#92400e' }}>{new Date(c.created_at).toLocaleDateString('id-ID')}</td>
                            <td style={{ fontWeight: 700, color: '#92400e' }}>{staff?.name || c.user_id}</td>
                            <td>{c.type === 'points' ? <span style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '0.3rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 700 }}>Tukar Poin</span> : <span style={{ backgroundColor: '#d1fae5', color: '#047857', padding: '0.3rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 700 }}>Tarik Saldo</span>}</td>
                            <td style={{ fontWeight: 800, color: '#92400e', fontSize: '1.05rem' }}>
                              {c.type === 'points' ? `${c.points_claimed} Poin` : formatRupiah(c.amount)}
                            </td>
                            <td style={{ fontSize: '0.85rem', color: '#b45309' }}>{c.notes || '-'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleProcessClaim(c.id, 'approved')} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>✅ ACC</button>
                                <button onClick={() => handleProcessClaim(c.id, 'rejected')} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>❌ Tolak</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>💰 Saldo Gaji & Poin Karyawan</h2>
                </div>
                <div style={{ overflowX: 'auto', padding: '0.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NAMA STAFF</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GRADE / TIM</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TIPE & TGL GAJI</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SALDO UANG</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SALDO POIN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Belum ada data staff.</td></tr>
                      ) : staffList.map((s, idx) => (
                        <tr key={s.id} style={{ borderBottom: idx === staffList.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{s.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{s.email}</div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {s.grade_name ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: s.is_leader ? '#eef2ff' : '#f8fafc', border: s.is_leader ? '1px solid #c7d2fe' : '1px solid #e2e8f0', padding: '0.4rem 0.75rem', borderRadius: '2rem' }}>
                                {s.is_leader ? <span style={{ color: '#4f46e5', fontWeight: 800, fontSize: '0.75rem' }}>LEADER</span> : <span style={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem' }}>MEMBER</span>}
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{s.grade_name}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Belum ada grade</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}>
                              {(() => {
                                const editState = editingSettings[s.id];
                                const isEditing = !!editState;

                                if (isEditing) {
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '160px' }}>
                                      <select 
                                        value={editState.type}
                                        onChange={(e) => setEditingSettings({ ...editingSettings, [s.id]: { ...editState, type: e.target.value } })}
                                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', backgroundColor: '#f8fafc', fontWeight: 600, color: '#334155' }}
                                      >
                                        <option value="daily">Harian</option>
                                        <option value="monthly">Bulanan</option>
                                      </select>
                                      {editState.type === 'monthly' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0 0.5rem' }}>
                                          <span style={{ color: '#64748b', fontWeight: 600 }}>Tgl:</span>
                                          <input 
                                            type="number" min="1" max="31" 
                                            value={editState.date || ''}
                                            onChange={(e) => setEditingSettings({ ...editingSettings, [s.id]: { ...editState, date: Number(e.target.value) || null } })}
                                            style={{ width: '100%', padding: '0.5rem 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: 700, color: '#0f172a' }}
                                            placeholder="1-31"
                                          />
                                        </div>
                                      )}
                                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={async () => {
                                          await handleSalarySettingsChange(s.id, editState.type, editState.date);
                                          setEditingSettings(prev => { const next = {...prev}; delete next[s.id]; return next; });
                                        }} style={{ flex: 1, padding: '0.4rem', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>Simpan</button>
                                        <button onClick={() => setEditingSettings(prev => { const next = {...prev}; delete next[s.id]; return next; })} style={{ flex: 1, padding: '0.4rem', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>Batal</button>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>{s.salary_type === 'monthly' ? 'Bulanan' : 'Harian'}</span>
                                        {s.salary_type === 'monthly' && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Tgl: {s.monthly_salary_date || '-'}</span>}
                                      </div>
                                      <button onClick={() => setEditingSettings({ ...editingSettings, [s.id]: { type: s.salary_type || 'daily', date: s.monthly_salary_date || null } })} style={{ background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#eef2ff', transition: 'background 0.2s' }}>
                                        <Pencil size={14} />
                                      </button>
                                    </div>
                                  );
                                }
                              })()}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'inline-block', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                              <strong style={{ color: '#059669', fontSize: '1.15rem' }}>{formatRupiah(s.salary_balance || 0)}</strong>
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'inline-block', backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                              <strong style={{ color: '#d97706', fontSize: '1.15rem' }}>{s.points_balance || 0}</strong> <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>pts</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
          </div>
        )}

        {/* ================= 4. RIWAYAT SLIP ================= */}
        {activeTab === 'riwayat' && (
          <div className="gaji-content-card animate-fade-in">
            <div style={{ padding: '0', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>🧾 Riwayat Pencairan (Slip)</h2>
            </div>
            <div style={{ overflowX: 'auto', padding: '0.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TANGGAL</th>
                    <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>KARYAWAN</th>
                    <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>JENIS</th>
                    <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NOMINAL</th>
                    <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>STATUS</th>
                    <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CATATAN</th>
                  </tr>
                </thead>
                <tbody>
                  {historyClaims.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Belum ada riwayat pencairan.</td></tr>
                  ) : historyClaims.map((c, idx) => {
                    const staff = staffList.find(s => s.id === c.user_id);
                    return (
                      <tr key={c.id} style={{ borderBottom: idx === historyClaims.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{new Date(c.created_at).toLocaleString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</td>
                        <td style={{ padding: '1rem' }}>
                           <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{staff?.name || c.user_id}</div>
                           <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{staff?.grade_name || ''}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                           {c.type === 'points' ? <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>Tukar Poin</span> : <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>Tarik Saldo</span>}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <strong style={{ color: '#0f172a', fontSize: '1.05rem' }}>{c.type === 'points' ? `${c.points_claimed} pts` : formatRupiah(c.amount)}</strong>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {c.status === 'approved' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '0.4rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #a7f3d0' }}>✅ Berhasil</span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.4rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #fecaca' }}>❌ Ditolak</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showGradeModal && <GradeModal grade={editingGrade} onClose={() => setShowGradeModal(false)} onSave={loadGrades} />}
    </div>
  );
}
