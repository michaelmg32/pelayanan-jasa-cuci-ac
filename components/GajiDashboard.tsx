'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchStaffGrades, createStaffGrade, updateStaffGrade, deleteStaffGrade,
  assignGradeToUser, fetchSalaryStaff, previewSalary, generateSalary,
  fetchSalaryRecords, updateSalaryStatus, fetchSalarySummary
} from '@/lib/api';
import type { StaffGrade, SalaryRecord, StaffWithGrade, SalarySummary, User } from '@/types';

// ===== HELPERS =====
const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const formatMonth = (ym: string) => {
  const [y, m] = ym.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${months[parseInt(m) - 1]} ${y}`;
};

const getCurrentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ===== GRADE FORM MODAL =====
function GradeModal({ grade, onClose, onSave }: { grade: StaffGrade | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: grade?.name || '',
    description: grade?.description || '',
    base_salary: grade?.base_salary || 0,
    fixed_bonus: grade?.fixed_bonus || 0,
    bonus_per_order: grade?.bonus_per_order || 0,
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally { setLoading(false); }
  };

  return (
    <div className="gaji-modal-overlay" onClick={onClose}>
      <div className="gaji-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gaji-modal-header">
          <h3>{grade ? '✏️ Edit Grade' : '➕ Tambah Grade Baru'}</h3>
          <button className="gaji-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="gaji-form-group">
            <label>Nama Grade *</label>
            <input className="gaji-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="contoh: Senior, Teknisi A, Junior B..." required />
          </div>
          <div className="gaji-form-group">
            <label>Deskripsi</label>
            <textarea className="gaji-input gaji-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Keterangan singkat grade ini..." rows={2} />
          </div>
          <div className="gaji-form-row">
            <div className="gaji-form-group">
              <label>💰 Gaji Pokok (Rp)</label>
              <input className="gaji-input" type="number" min="0" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: Number(e.target.value) })} />
            </div>
            <div className="gaji-form-group">
              <label>🎁 Bonus Tetap (Rp)</label>
              <input className="gaji-input" type="number" min="0" value={form.fixed_bonus} onChange={e => setForm({ ...form, fixed_bonus: Number(e.target.value) })} />
            </div>
          </div>
          <div className="gaji-form-group">
            <label>⚡ Bonus per Order Selesai (Rp)</label>
            <input className="gaji-input" type="number" min="0" value={form.bonus_per_order} onChange={e => setForm({ ...form, bonus_per_order: Number(e.target.value) })} />
            <span className="gaji-hint">Dikalikan jumlah order selesai dalam sebulan</span>
          </div>
          {error && <div className="gaji-error-msg">{error}</div>}
          <div className="gaji-modal-actions">
            <button type="button" className="gaji-btn gaji-btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="gaji-btn gaji-btn-primary" disabled={loading}>{loading ? '⏳ Menyimpan...' : '💾 Simpan Grade'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== MARK PAID MODAL =====
function MarkPaidModal({ record, onClose, onSave }: { record: SalaryRecord; onClose: () => void; onSave: () => void }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const handlePay = async () => {
    setLoading(true);
    try { await updateSalaryStatus(record.id, 'PAID', notes); onSave(); onClose(); }
    catch { /* ignore */ } finally { setLoading(false); }
  };
  return (
    <div className="gaji-modal-overlay" onClick={onClose}>
      <div className="gaji-modal" onClick={e => e.stopPropagation()}>
        <div className="gaji-modal-header">
          <h3>✅ Tandai Gaji Lunas</h3>
          <button className="gaji-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="gaji-confirm-info">
          <div className="gaji-confirm-row"><span>Karyawan</span><strong>{record.staff_name}</strong></div>
          <div className="gaji-confirm-row"><span>Periode</span><strong>{formatMonth(record.period_month)}</strong></div>
          <div className="gaji-confirm-row"><span>Total Gaji</span><strong className="gaji-highlight">{formatRupiah(record.total_salary)}</strong></div>
        </div>
        <div className="gaji-form-group" style={{ marginTop: '1rem' }}>
          <label>Catatan (opsional)</label>
          <textarea className="gaji-input gaji-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contoh: Transfer via BCA..." rows={2} />
        </div>
        <div className="gaji-modal-actions">
          <button className="gaji-btn gaji-btn-ghost" onClick={onClose}>Batal</button>
          <button className="gaji-btn gaji-btn-success" onClick={handlePay} disabled={loading}>{loading ? '⏳...' : '✅ Konfirmasi Lunas'}</button>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
interface GajiDashboardProps {
  activeUser: User;
  embedded?: boolean;
}

export default function GajiDashboard({ activeUser, embedded = false }: GajiDashboardProps) {
  const userRole = activeUser.role as string;
  const userRegionId = activeUser.region_id || '';

  const [activeTab, setActiveTab] = useState<'grade' | 'staff' | 'proses' | 'riwayat' | 'summary'>('grade');

  // Grade state
  const [grades, setGrades] = useState<StaffGrade[]>([]);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<StaffGrade | null>(null);
  const [gradeLoading, setGradeLoading] = useState(false);

  // Staff state
  const [staffList, setStaffList] = useState<StaffWithGrade[]>([]);
  const [assigningStaffId, setAssigningStaffId] = useState<string | null>(null);
  const [assignGradeValue, setAssignGradeValue] = useState<string>('');

  // Proses Gaji state
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [preview, setPreview] = useState<SalaryRecord[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState('');

  // Riwayat state
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [filterMonth, setFilterMonth] = useState('');
  const [markPaidRecord, setMarkPaidRecord] = useState<SalaryRecord | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Summary state
  const [summary, setSummary] = useState<SalarySummary[]>([]);
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());

  const loadGrades = useCallback(async () => {
    setGradeLoading(true);
    try { setGrades(await fetchStaffGrades()); } finally { setGradeLoading(false); }
  }, []);

  const loadStaff = useCallback(async () => {
    try { setStaffList(await fetchSalaryStaff()); } catch { /* ignore */ }
  }, []);

  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);
    try { setRecords(await fetchSalaryRecords(filterMonth ? { period_month: filterMonth } : undefined)); }
    finally { setRecordsLoading(false); }
  }, [filterMonth]);

  const loadSummary = useCallback(async () => {
    try { setSummary(await fetchSalarySummary(summaryYear)); } catch { /* ignore */ }
  }, [summaryYear]);

  useEffect(() => {
    if (activeTab === 'grade') loadGrades();
    if (activeTab === 'staff') { loadGrades(); loadStaff(); }
    if (activeTab === 'riwayat') loadRecords();
    if (activeTab === 'summary') loadSummary();
  }, [activeTab, loadGrades, loadStaff, loadRecords, loadSummary]);

  const handleDeleteGrade = async (id: string, name: string) => {
    if (!confirm(`Hapus grade "${name}"? Semua karyawan dengan grade ini akan direset.`)) return;
    try { await deleteStaffGrade(id); loadGrades(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Gagal menghapus.'); }
  };

  const handlePreview = async () => {
    setPreviewLoading(true); setPreview([]); setGenerateMsg('');
    try {
      const data = await previewSalary(selectedMonth, userRole === 'OWNER' ? undefined : userRegionId);
      setPreview(data.results || []);
    } catch (err: unknown) {
      setGenerateMsg(`❌ ${err instanceof Error ? err.message : 'Gagal preview.'}`);
    } finally { setPreviewLoading(false); }
  };

  const handleGenerate = async () => {
    if (!confirm(`Kunci & simpan data gaji untuk bulan ${formatMonth(selectedMonth)}?\n\nSlip yang sudah LUNAS tidak akan tertimpa.`)) return;
    setGenerating(true); setGenerateMsg('');
    try {
      const data = await generateSalary(selectedMonth, userRole === 'OWNER' ? undefined : userRegionId);
      setGenerateMsg(`✅ Berhasil menyimpan gaji ${data.saved} karyawan. (${data.skipped} dilewati karena sudah LUNAS)`);
      setPreview([]);
    } catch (err: unknown) {
      setGenerateMsg(`❌ ${err instanceof Error ? err.message : 'Gagal generate.'}`);
    } finally { setGenerating(false); }
  };

  const handleAssignGrade = async (staffId: string) => {
    try { await assignGradeToUser(staffId, assignGradeValue || null); setAssigningStaffId(null); loadStaff(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Gagal assign grade.'); }
  };

  const totalPreview = preview.reduce((s, r) => s + r.total_salary, 0);
  const totalPaid = records.filter(r => r.status === 'PAID').reduce((s, r) => s + r.total_salary, 0);
  const totalPending = records.filter(r => r.status === 'PENDING').reduce((s, r) => s + r.total_salary, 0);

  const tabs = [
    { id: 'grade', label: '🏅 Kelola Grade', desc: 'Tingkatan & gaji pokok' },
    { id: 'staff', label: '👥 Assign Grade', desc: 'Atur grade karyawan' },
    { id: 'proses', label: '⚙️ Proses Gaji', desc: 'Hitung & kunci gaji' },
    { id: 'riwayat', label: '📋 Riwayat Slip', desc: 'Histori pembayaran' },
    ...(userRole === 'OWNER' ? [{ id: 'summary', label: '📊 Ringkasan', desc: 'Total biaya wilayah' }] : []),
  ] as const;

  return (
    <div className={`gaji-page ${embedded ? 'gaji-embedded' : ''}`}>
      <style>{`
        * { box-sizing: border-box; }
        .gaji-page { min-height: 100vh; background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%); font-family: 'Inter', 'Segoe UI', sans-serif; color: #e2e8f0; }
        .gaji-page.gaji-embedded { min-height: auto; background: transparent; padding: 0; }
        .gaji-page.gaji-embedded .gaji-content { padding: 1.5rem 0; max-width: 100%; }
        .gaji-page.gaji-embedded .gaji-tabs-wrapper { padding: 0; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
        .gaji-header { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.1); padding: 1.25rem 2rem; display: flex; align-items: center; gap: 1rem; position: sticky; top: 0; z-index: 100; }
        .gaji-header-back { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.875rem; transition: all 0.2s; text-decoration: none; }
        .gaji-header-back:hover { background: rgba(255,255,255,0.2); transform: translateX(-2px); }
        .gaji-header-title { flex: 1; }
        .gaji-header-title h1 { font-size: 1.5rem; font-weight: 700; background: linear-gradient(135deg, #a78bfa, #60a5fa, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .gaji-header-title p { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-top: 0.1rem; }
        .gaji-role-badge { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; }
        .gaji-user-info { font-size: 0.78rem; color: rgba(255,255,255,0.5); }

        .gaji-tabs-wrapper { background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.07); padding: 0 2rem; display: flex; gap: 0.25rem; overflow-x: auto; }
        .gaji-tab { padding: 1rem 1.25rem; cursor: pointer; border: none; background: transparent; color: rgba(255,255,255,0.5); font-size: 0.875rem; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
        .gaji-tab:hover { color: rgba(255,255,255,0.8); }
        .gaji-tab.active { color: #a78bfa; border-bottom-color: #a78bfa; background: rgba(167,139,250,0.05); }
        .gaji-tab-sub { font-size: 0.7rem; opacity: 0.6; display: block; }

        .gaji-content { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem; }

        .gaji-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.25rem; }
        .gaji-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem; }
        .gaji-card-title { font-size: 1.1rem; font-weight: 600; color: #f1f5f9; }

        .gaji-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .gaji-stat-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.25rem; text-align: center; }
        .gaji-stat-card .stat-label { font-size: 0.72rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
        .gaji-stat-card .stat-value { font-size: 1.2rem; font-weight: 700; color: #f1f5f9; }
        .gaji-stat-card.purple { border-color: rgba(167,139,250,0.3); } .gaji-stat-card.purple .stat-value { color: #a78bfa; }
        .gaji-stat-card.green { border-color: rgba(52,211,153,0.3); } .gaji-stat-card.green .stat-value { color: #34d399; }
        .gaji-stat-card.orange { border-color: rgba(251,146,60,0.3); } .gaji-stat-card.orange .stat-value { color: #fb923c; }

        .gaji-grade-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
        .gaji-grade-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.25rem; transition: all 0.2s; }
        .gaji-grade-card:hover { border-color: rgba(167,139,250,0.4); background: rgba(167,139,250,0.05); transform: translateY(-2px); }
        .gaji-grade-badge { display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 0.3rem 0.9rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.75rem; }
        .gaji-grade-desc { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 0.75rem; }
        .gaji-salary-breakdown { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 0.75rem; font-size: 0.8rem; }
        .gaji-salary-row { display: flex; justify-content: space-between; margin-bottom: 0.35rem; color: rgba(255,255,255,0.7); }
        .gaji-salary-row.total { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.35rem; margin-top: 0.35rem; color: #a78bfa; font-weight: 700; font-size: 0.875rem; }
        .gaji-grade-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; }

        .gaji-btn { padding: 0.6rem 1.25rem; border-radius: 8px; border: none; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.4rem; }
        .gaji-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .gaji-btn-primary { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; }
        .gaji-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(124,58,237,0.4); }
        .gaji-btn-success { background: linear-gradient(135deg, #059669, #10b981); color: white; }
        .gaji-btn-success:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(16,185,129,0.4); }
        .gaji-btn-danger { background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
        .gaji-btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.35); }
        .gaji-btn-ghost { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.15); }
        .gaji-btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.15); }
        .gaji-btn-sm { padding: 0.35rem 0.75rem; font-size: 0.78rem; }

        .gaji-table-wrap { overflow-x: auto; border-radius: 10px; }
        .gaji-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .gaji-table th { background: rgba(0,0,0,0.3); padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.5); font-weight: 600; white-space: nowrap; }
        .gaji-table td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); vertical-align: middle; }
        .gaji-table tr:hover td { background: rgba(255,255,255,0.03); }
        .gaji-table tr:last-child td { border-bottom: none; }

        .gaji-status { display: inline-block; padding: 0.25rem 0.7rem; border-radius: 20px; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.04em; }
        .gaji-status.PAID { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
        .gaji-status.PENDING { background: rgba(251,146,60,0.15); color: #fb923c; border: 1px solid rgba(251,146,60,0.3); }

        .gaji-form-group { margin-bottom: 1rem; }
        .gaji-form-group label { display: block; font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 0.4rem; font-weight: 500; }
        .gaji-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .gaji-input { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.65rem 0.9rem; color: #f1f5f9; font-size: 0.875rem; outline: none; transition: border-color 0.2s; font-family: inherit; }
        .gaji-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
        .gaji-input::placeholder { color: rgba(255,255,255,0.3); }
        .gaji-textarea { resize: vertical; min-height: 70px; }
        .gaji-hint { font-size: 0.72rem; color: rgba(255,255,255,0.4); margin-top: 0.3rem; display: block; }
        select.gaji-input option { background: #1e1b4b; }

        .gaji-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .gaji-modal { background: linear-gradient(135deg, #1e1b4b, #1a1a2e); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 1.75rem; width: 100%; max-width: 480px; animation: slideUp 0.2s ease; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .gaji-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .gaji-modal-header h3 { font-size: 1.1rem; font-weight: 700; color: #f1f5f9; }
        .gaji-modal-close { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 1.2rem; cursor: pointer; padding: 0.25rem; }
        .gaji-modal-close:hover { color: white; }
        .gaji-modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.25rem; }

        .gaji-error-msg { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; padding: 0.65rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; }
        .gaji-success-msg { background: rgba(52,211,153,0.15); border: 1px solid rgba(52,211,153,0.3); color: #34d399; padding: 0.65rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; }
        .gaji-empty { text-align: center; padding: 3rem; color: rgba(255,255,255,0.4); }
        .gaji-empty-icon { font-size: 3rem; margin-bottom: 0.75rem; }
        .gaji-spinner { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #a78bfa; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .gaji-highlight { color: #a78bfa; font-weight: 700; }
        .gaji-confirm-info { background: rgba(0,0,0,0.2); border-radius: 10px; padding: 1rem; }
        .gaji-confirm-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem; }
        .gaji-confirm-row:last-child { margin-bottom: 0; }
        .gaji-filter-row { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; margin-bottom: 1rem; }
        .gaji-preview-total { background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.2)); border: 1px solid rgba(124,58,237,0.3); border-radius: 10px; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
        .gaji-month-display { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.875rem; color: #a78bfa; font-weight: 600; border: 1px solid rgba(167,139,250,0.3); }
        .gaji-region-tag { display: inline-block; background: rgba(96,165,250,0.15); color: #60a5fa; border: 1px solid rgba(96,165,250,0.3); padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.72rem; }

        @media (max-width: 640px) {
          .gaji-header { padding: 1rem; }
          .gaji-content { padding: 1rem; }
          .gaji-form-row { grid-template-columns: 1fr; }
          .gaji-tab-sub { display: none; }
        }
      `}</style>

      {/* HEADER */}
      {!embedded && (
        <header className="gaji-header">
          <a href="/dashboard/admin" className="gaji-header-back">← Dashboard</a>
          <div className="gaji-header-title">
            <h1>💼 Sistem Penggajian</h1>
            <p>Kelola grade, hitung & catat gaji karyawan per wilayah</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
            <span className="gaji-role-badge">{userRole}</span>
            <span className="gaji-user-info">{activeUser.name}</span>
          </div>
        </header>
      )}

      {/* TABS */}
      <div className="gaji-tabs-wrapper">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`gaji-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.label}
            <span className="gaji-tab-sub">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="gaji-content">

        {/* ====== TAB: KELOLA GRADE ====== */}
        {activeTab === 'grade' && (
          <>
            <div className="gaji-card">
              <div className="gaji-card-header">
                <div>
                  <div className="gaji-card-title">🏅 Kelola Grade Karyawan</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.25rem' }}>Buat tingkatan karyawan beserta konfigurasi gaji & bonus</div>
                </div>
                <button className="gaji-btn gaji-btn-primary" onClick={() => { setEditingGrade(null); setShowGradeModal(true); }}>➕ Tambah Grade</button>
              </div>
              {gradeLoading ? <div className="gaji-empty"><div className="gaji-spinner" /></div>
                : grades.length === 0 ? (
                  <div className="gaji-empty"><div className="gaji-empty-icon">🏅</div><p>Belum ada grade. Buat grade pertama!</p></div>
                ) : (
                  <div className="gaji-grade-grid">
                    {grades.map(g => (
                      <div key={g.id} className="gaji-grade-card">
                        <div className="gaji-grade-badge">{g.name}</div>
                        {userRole === 'OWNER' && g.regionName && <div style={{ marginBottom: '0.5rem' }}><span className="gaji-region-tag">🌏 {g.regionName}</span></div>}
                        {g.description && <div className="gaji-grade-desc">{g.description}</div>}
                        <div className="gaji-salary-breakdown">
                          <div className="gaji-salary-row"><span>💰 Gaji Pokok</span><span>{formatRupiah(g.base_salary || 0)}</span></div>
                          <div className="gaji-salary-row"><span>🎁 Bonus Tetap</span><span>{formatRupiah(g.fixed_bonus || 0)}</span></div>
                          <div className="gaji-salary-row"><span>⚡ Bonus/Order</span><span>{formatRupiah(g.bonus_per_order || 0)}</span></div>
                          <div className="gaji-salary-row total"><span>Total (tanpa order bonus)</span><span>{formatRupiah((g.base_salary || 0) + (g.fixed_bonus || 0))}</span></div>
                        </div>
                        <div className="gaji-grade-actions">
                          <button className="gaji-btn gaji-btn-ghost gaji-btn-sm" onClick={() => { setEditingGrade(g); setShowGradeModal(true); }}>✏️ Edit</button>
                          <button className="gaji-btn gaji-btn-danger gaji-btn-sm" onClick={() => handleDeleteGrade(g.id, g.name)}>🗑️ Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <div style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '12px', padding: '1rem 1.25rem', fontSize: '0.83rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: '#60a5fa' }}>ℹ️ Cara Kerja Bonus:</strong><br />
              Total Gaji = Gaji Pokok + Bonus Tetap + (Bonus per Order × Jumlah Order Selesai di Bulan Itu)
            </div>
          </>
        )}

        {/* ====== TAB: ASSIGN GRADE ====== */}
        {activeTab === 'staff' && (
          <div className="gaji-card">
            <div className="gaji-card-header">
              <div>
                <div className="gaji-card-title">👥 Atur Grade Karyawan</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.25rem' }}>Tetapkan tingkatan grade untuk setiap karyawan (teknisi)</div>
              </div>
            </div>
            <div className="gaji-table-wrap">
              <table className="gaji-table">
                <thead>
                  <tr>
                    <th>Nama Karyawan</th>
                    {userRole === 'OWNER' && <th>Wilayah</th>}
                    <th>Grade Saat Ini</th>
                    <th>Gaji Pokok</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Tidak ada data karyawan</td></tr>
                  ) : staffList.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{s.email}</div>
                      </td>
                      {userRole === 'OWNER' && <td><span className="gaji-region-tag">{s.regionName || '-'}</span></td>}
                      <td>
                        {s.grade_name
                          ? <span className="gaji-grade-badge" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>{s.grade_name}</span>
                          : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>— Belum diatur —</span>}
                      </td>
                      <td>{s.base_salary ? formatRupiah(s.base_salary) : '—'}</td>
                      <td>
                        {assigningStaffId === s.id ? (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select className="gaji-input" style={{ width: 'auto', minWidth: '140px' }} value={assignGradeValue} onChange={e => setAssignGradeValue(e.target.value)}>
                              <option value="">— Hapus Grade —</option>
                              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <button className="gaji-btn gaji-btn-success gaji-btn-sm" onClick={() => handleAssignGrade(s.id)}>✅</button>
                            <button className="gaji-btn gaji-btn-ghost gaji-btn-sm" onClick={() => setAssigningStaffId(null)}>✕</button>
                          </div>
                        ) : (
                          <button className="gaji-btn gaji-btn-ghost gaji-btn-sm" onClick={() => { setAssigningStaffId(s.id); setAssignGradeValue(s.grade_id || ''); }}>✏️ Atur Grade</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====== TAB: PROSES GAJI ====== */}
        {activeTab === 'proses' && (
          <>
            <div className="gaji-card">
              <div className="gaji-card-title" style={{ marginBottom: '1rem' }}>⚙️ Proses Gaji Bulanan</div>
              <div className="gaji-filter-row">
                <div className="gaji-form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.35rem' }}>Pilih Bulan</label>
                  <input type="month" className="gaji-input" style={{ width: 'auto' }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <button className="gaji-btn gaji-btn-ghost" onClick={handlePreview} disabled={previewLoading}>{previewLoading ? '⏳ Menghitung...' : '👁️ Preview Kalkulasi'}</button>
                </div>
              </div>
              {generateMsg && <div className={generateMsg.startsWith('✅') ? 'gaji-success-msg' : 'gaji-error-msg'}>{generateMsg}</div>}
              {preview.length > 0 && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <span className="gaji-month-display">📅 {formatMonth(selectedMonth)}</span>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginLeft: '0.75rem' }}>Preview kalkulasi — belum disimpan</span>
                  </div>
                  <div className="gaji-table-wrap">
                    <table className="gaji-table">
                      <thead>
                        <tr>
                          <th>Karyawan</th><th>Grade</th><th>Gaji Pokok</th>
                          <th>Order Selesai</th><th>Bonus/Order</th><th>Bonus Tetap</th><th>Total Gaji</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((r, i) => (
                          <tr key={i}>
                            <td><div style={{ fontWeight: 600 }}>{r.staff_name}</div></td>
                            <td><span className="gaji-grade-badge" style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>{r.grade_name}</span></td>
                            <td>{formatRupiah(r.base_salary)}</td>
                            <td style={{ textAlign: 'center' }}><span style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem' }}>{r.total_orders_completed}</span></td>
                            <td>{formatRupiah(r.order_bonus)}</td>
                            <td>{formatRupiah(r.fixed_bonus)}</td>
                            <td><strong style={{ color: '#a78bfa' }}>{formatRupiah(r.total_salary)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="gaji-preview-total">
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Total Biaya Gaji Bulan Ini</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a78bfa' }}>{formatRupiah(totalPreview)}</div>
                    </div>
                    <button className="gaji-btn gaji-btn-success" onClick={handleGenerate} disabled={generating}>{generating ? '⏳ Menyimpan...' : '🔒 Kunci & Simpan Gaji'}</button>
                  </div>
                </>
              )}
            </div>
            <div style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: '12px', padding: '1rem 1.25rem', fontSize: '0.83rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: '#fb923c' }}>⚠️ Perhatian:</strong> Slip yang sudah ditandai <strong>LUNAS</strong> tidak akan bisa ditimpa ulang.
            </div>
          </>
        )}

        {/* ====== TAB: RIWAYAT SLIP ====== */}
        {activeTab === 'riwayat' && (
          <>
            <div className="gaji-stats">
              <div className="gaji-stat-card"><div className="stat-label">Total Slip</div><div className="stat-value">{records.length}</div></div>
              <div className="gaji-stat-card green"><div className="stat-label">✅ Sudah Lunas</div><div className="stat-value">{records.filter(r => r.status === 'PAID').length}</div></div>
              <div className="gaji-stat-card orange"><div className="stat-label">⏳ Belum Lunas</div><div className="stat-value">{records.filter(r => r.status === 'PENDING').length}</div></div>
              <div className="gaji-stat-card purple"><div className="stat-label">💰 Total Lunas</div><div className="stat-value">{formatRupiah(totalPaid)}</div></div>
              <div className="gaji-stat-card"><div className="stat-label">⏳ Total Pending</div><div className="stat-value">{formatRupiah(totalPending)}</div></div>
            </div>
            <div className="gaji-card">
              <div className="gaji-card-header">
                <div className="gaji-card-title">📋 Riwayat Slip Gaji</div>
                <div className="gaji-filter-row" style={{ margin: 0 }}>
                  <input type="month" className="gaji-input" style={{ width: 'auto' }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
                  <button className="gaji-btn gaji-btn-ghost" onClick={loadRecords} disabled={recordsLoading}>{recordsLoading ? '⏳' : '🔄 Muat'}</button>
                </div>
              </div>
              <div className="gaji-table-wrap">
                <table className="gaji-table">
                  <thead>
                    <tr>
                      <th>Karyawan</th>{userRole === 'OWNER' && <th>Wilayah</th>}
                      <th>Grade</th><th>Periode</th><th>Gaji Pokok</th>
                      <th>Bonus Order</th><th>Bonus Tetap</th><th>Total</th><th>Status</th><th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length === 0 ? (
                      <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', opacity: 0.5 }}>Belum ada riwayat slip gaji. Proses gaji di tab &quot;Proses Gaji&quot;.</td></tr>
                    ) : records.map(r => (
                      <tr key={r.id}>
                        <td><div style={{ fontWeight: 600 }}>{r.staff_name}</div></td>
                        {userRole === 'OWNER' && <td><span className="gaji-region-tag">{r.regionName || '-'}</span></td>}
                        <td>{r.grade_name ? <span className="gaji-grade-badge" style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>{r.grade_name}</span> : '—'}</td>
                        <td><span className="gaji-month-display" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>{formatMonth(r.period_month)}</span></td>
                        <td>{formatRupiah(r.base_salary)}</td>
                        <td>{formatRupiah(r.order_bonus)}<div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{r.total_orders_completed} order</div></td>
                        <td>{formatRupiah(r.fixed_bonus)}</td>
                        <td><strong style={{ color: '#a78bfa' }}>{formatRupiah(r.total_salary)}</strong></td>
                        <td><span className={`gaji-status ${r.status}`}>{r.status === 'PAID' ? '✅ Lunas' : '⏳ Pending'}</span></td>
                        <td>
                          {r.status === 'PENDING'
                            ? <button className="gaji-btn gaji-btn-success gaji-btn-sm" onClick={() => setMarkPaidRecord(r)}>💳 Bayar</button>
                            : <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{r.paid_at ? new Date(r.paid_at).toLocaleDateString('id-ID') : '✅'}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ====== TAB: SUMMARY (OWNER ONLY) ====== */}
        {activeTab === 'summary' && userRole === 'OWNER' && (
          <div className="gaji-card">
            <div className="gaji-card-header">
              <div className="gaji-card-title">📊 Ringkasan Biaya Gaji Seluruh Wilayah</div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select className="gaji-input" style={{ width: 'auto' }} value={summaryYear} onChange={e => setSummaryYear(Number(e.target.value))}>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button className="gaji-btn gaji-btn-ghost" onClick={loadSummary}>🔄 Muat</button>
              </div>
            </div>
            {summary.length === 0 ? (
              <div className="gaji-empty"><div className="gaji-empty-icon">📊</div><p>Belum ada data gaji untuk tahun {summaryYear}.</p></div>
            ) : (
              <div className="gaji-table-wrap">
                <table className="gaji-table">
                  <thead>
                    <tr><th>Wilayah</th><th>Periode</th><th>Jumlah Staff</th><th>Total Gaji Pokok</th><th>Total Bonus</th><th>Total Biaya</th><th>Lunas</th><th>Pending</th></tr>
                  </thead>
                  <tbody>
                    {summary.map((s, i) => (
                      <tr key={i}>
                        <td><span className="gaji-region-tag">🌏 {s.regionName}</span></td>
                        <td><span className="gaji-month-display" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>{formatMonth(s.period_month)}</span></td>
                        <td style={{ textAlign: 'center' }}>{s.total_staff}</td>
                        <td>{formatRupiah(s.total_base)}</td>
                        <td>{formatRupiah(Number(s.total_order_bonus) + Number(s.total_fixed_bonus))}</td>
                        <td><strong style={{ color: '#a78bfa' }}>{formatRupiah(s.total_salary_cost)}</strong></td>
                        <td><span style={{ color: '#34d399' }}>{s.paid_count}</span><span style={{ color: 'rgba(255,255,255,0.3)' }}>/{s.total_staff}</span></td>
                        <td>{Number(s.pending_count) > 0 ? <span style={{ color: '#fb923c', fontWeight: 600 }}>{s.pending_count}</span> : <span style={{ color: '#34d399' }}>✅</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700, color: 'rgba(255,255,255,0.7)', padding: '0.85rem 1rem' }}>Grand Total Tahun {summaryYear}:</td>
                      <td style={{ fontWeight: 800, color: '#a78bfa', fontSize: '1rem', padding: '0.85rem 1rem' }}>{formatRupiah(summary.reduce((s, r) => s + Number(r.total_salary_cost), 0))}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {showGradeModal && <GradeModal grade={editingGrade} onClose={() => setShowGradeModal(false)} onSave={loadGrades} />}
      {markPaidRecord && <MarkPaidModal record={markPaidRecord} onClose={() => setMarkPaidRecord(null)} onSave={loadRecords} />}
    </div>
  );
}
