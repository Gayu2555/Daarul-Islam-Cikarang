import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import ClassDetail from "./ClassDetail";
import type { Class, Teacher } from "../types";

interface Props {
  classes: Class[];
  teachers: Teacher[];
  onDataChange: () => void; // untuk refresh data di App.tsx setelah create/delete
}

export default function ClassesPage({
  classes,
  teachers,
  onDataChange,
}: Props) {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // State untuk form buat kelas baru
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    grade_level: "",
    academic_year: "",
    homeroom_teacher_id: "",
  });

  // ============================================
  // CREATE CLASS
  // ============================================
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setCreating(true);
    try {
      const insertData: any = { ...formData };
      // Kalau wali kelas kosong, jangan kirim string kosong (karena foreign key)
      if (!insertData.homeroom_teacher_id) {
        delete insertData.homeroom_teacher_id;
      }

      const { error } = await supabase.from("classes").insert([insertData]);
      if (error) throw error;

      // Reset form & tutup
      setFormData({
        name: "",
        grade_level: "",
        academic_year: "",
        homeroom_teacher_id: "",
      });
      setShowCreateForm(false);
      onDataChange(); // refresh data di App.tsx
      alert("Kelas berhasil dibuat!");
    } catch (err: any) {
      alert("Gagal membuat kelas: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  // ============================================
  // DELETE CLASS
  // ============================================
  const handleDeleteClass = async (id: string) => {
    if (!supabase) return;
    if (!confirm("Hapus kelas ini? Siswa di dalamnya akan kehilangan kelas."))
      return;
    try {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
      onDataChange();
      alert("Kelas berhasil dihapus!");
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  // ============================================
  // RENDER DETAIL KELAS
  // ============================================
  if (selectedClass) {
    return (
      <ClassDetail
        classData={selectedClass}
        onBack={() => {
          setSelectedClass(null);
          onDataChange(); // refresh data kalau ada perubahan di detail
        }}
      />
    );
  }

  // ============================================
  // RENDER DAFTAR KELAS
  // ============================================
  return (
    <div className="space-y-5">
      {/* Header & Tombol Tambah */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-800">Daftar Kelas</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
        >
          {showCreateForm ? (
            "Batal"
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Buat Kelas Baru
            </>
          )}
        </button>
      </div>

      {/* Form Buat Kelas Baru (Toggle) */}
      {showCreateForm && (
        <div className="bg-white border border-indigo-200 rounded-2xl p-6 shadow-sm">
          <h4 className="text-sm font-bold text-slate-700 mb-4">
            Formulir Kelas Baru
          </h4>
          <form
            onSubmit={handleCreateClass}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Nama Kelas *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: X IPA 1"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Tingkat *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 10 / X"
                value={formData.grade_level}
                onChange={(e) =>
                  setFormData({ ...formData, grade_level: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Tahun Ajaran *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 2024/2025"
                value={formData.academic_year}
                onChange={(e) =>
                  setFormData({ ...formData, academic_year: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Wali Kelas
              </label>
              <select
                value={formData.homeroom_teacher_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    homeroom_teacher_id: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- Tanpa Wali Kelas --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {creating ? "Menyimpan..." : "Simpan Kelas"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel Daftar Kelas */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Nama Kelas</th>
                <th className="px-6 py-4">Tingkat</th>
                <th className="px-6 py-4">Tahun Ajaran</th>
                <th className="px-6 py-4">Wali Kelas</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.length > 0 ? (
                classes.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedClass(c)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {c.grade_level}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {c.academic_year}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {c.teachers?.name ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // biar tidak trigger row click
                          handleDeleteClass(c.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                        aria-label="Delete class"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="w-4 h-4"
                          fill="currentColor"
                        >
                          <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zm3.5-9h1v7h-1V10zm5 0h1v7h-1V10z" />
                          <path d="M15.5 4l-1-1h-5l-1 1H5v2h14V4h-3.5z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400 italic"
                  >
                    Belum ada kelas. Klik "Buat Kelas Baru" untuk menambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
