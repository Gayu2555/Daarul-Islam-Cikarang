import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Check } from "lucide-react";
import type { Student, Subject, Teacher, Class } from "../types";

interface ModalProps {
  type: "student" | "teacher" | "subject" | "template" | null;
  isOpen: boolean;
  onClose: () => void;
  handleCreate: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  students: Student[];
  subjects: Subject[];
  teachers: Teacher[];
  classes: Class[];
}

// ============================================
// STUDENT FORM
// ============================================
const StudentForm: React.FC<{
  formData: any;
  setFormData: (data: any) => void;
  classes: Class[];
}> = ({ formData, setFormData, classes }) => (
  <>
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Nama Lengkap
      </label>
      <input
        required
        type="text"
        value={formData.name || ""}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        placeholder="Masukkan nama..."
      />
    </div>
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">NIS</label>
      <input
        required
        type="text"
        value={formData.nis || ""}
        onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        placeholder="Nomor Induk Siswa"
      />
    </div>
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Kelas
      </label>
      <select
        value={formData.class_id || ""}
        onChange={(e) =>
          setFormData({ ...formData, class_id: e.target.value || null })
        }
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        aria-label="Kelas"
      >
        <option value="">-- Pilih Kelas --</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} — {c.academic_year}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Email Orang Tua
      </label>
      <input
        type="email"
        value={formData.parent_email || ""}
        onChange={(e) =>
          setFormData({ ...formData, parent_email: e.target.value })
        }
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        placeholder="email@gmail.com"
      />
    </div>
  </>
);

// ============================================
// TEACHER FORM
// ============================================
const TeacherForm: React.FC<{
  formData: any;
  setFormData: (data: any) => void;
}> = ({ formData, setFormData }) => (
  <>
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Nama Guru
      </label>
      <input
        required
        type="text"
        value={formData.name || ""}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        placeholder="Nama lengkap..."
      />
    </div>
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">NIP</label>
      <input
        required
        type="text"
        value={formData.nip || ""}
        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        placeholder="Nomor Induk Pegawai"
      />
    </div>
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Email
      </label>
      <input
        type="email"
        value={formData.email || ""}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        placeholder="email@sekolah.com"
      />
    </div>
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Spesialisasi
      </label>
      <input
        required
        type="text"
        value={formData.subject_specialization || ""}
        onChange={(e) =>
          setFormData({ ...formData, subject_specialization: e.target.value })
        }
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        placeholder="Contoh: Matematika"
      />
    </div>
  </>
);

// ============================================
// SUBJECT FORM
// ============================================
const SubjectForm: React.FC<{
  formData: any;
  setFormData: (data: any) => void;
  teachers: Teacher[];
}> = ({ formData, setFormData, teachers }) => (
  <>
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Nama Mata Pelajaran
      </label>
      <input
        required
        type="text"
        value={formData.name || ""}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        placeholder="Contoh: Fisika"
      />
    </div>
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Kode Mapel
      </label>
      <input
        required
        type="text"
        value={formData.code || ""}
        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        placeholder="Contoh: PHY-101"
      />
    </div>
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Guru Pengampu
      </label>
      <select
        value={formData.teacher_id || ""}
        onChange={(e) =>
          setFormData({ ...formData, teacher_id: e.target.value || null })
        }
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        aria-label="Guru Pengampu"
      >
        <option value="">-- Pilih Guru (opsional) --</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} — {t.subject_specialization}
          </option>
        ))}
      </select>
    </div>
  </>
);

// ============================================
// TEMPLATE FORM
// ============================================
const TemplateForm: React.FC<{
  formData: any;
  setFormData: (data: any) => void;
  subjects: Subject[];
}> = ({ formData, setFormData, subjects }) => {
  const selectedIds: string[] = formData.subject_ids || [];

  const toggleSubject = (id: string) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id];
    setFormData({ ...formData, subject_ids: updated });
  };

  return (
    <>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">
          Nama Template
        </label>
        <input
          required
          type="text"
          value={formData.name || ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          placeholder="Contoh: Template XII-IPA"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">
          Deskripsi
        </label>
        <input
          type="text"
          value={formData.description || ""}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          placeholder="Opsional..."
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Pilih Mata Pelajaran
          <span className="ml-2 text-xs font-normal text-slate-400">
            ({selectedIds.length} dipilih)
          </span>
        </label>
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-100">
          {subjects.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400 italic">
              Belum ada mata pelajaran
            </p>
          ) : (
            subjects.map((s) => {
              const selected = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSubject(s.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${
                    selected
                      ? "bg-indigo-50 text-indigo-700"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span>
                    <span className="font-medium">{s.name}</span>
                    {s.code && (
                      <span className="ml-2 text-xs text-slate-400 font-mono">
                        {s.code}
                      </span>
                    )}
                  </span>
                  {selected && (
                    <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

// ============================================
// MODAL
// ============================================
const Modal: React.FC<ModalProps> = ({
  type,
  isOpen,
  onClose,
  handleCreate,
  formData,
  setFormData,
  students,
  subjects,
  teachers,
  classes,
}) => {
  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case "student":
        return "Tambah Siswa Baru";
      case "teacher":
        return "Tambah Guru Baru";
      case "subject":
        return "Tambah Mata Pelajaran";
      case "template":
        return "Buat Template Kurikulum";
      default:
        return "";
    }
  };

  const renderForm = () => {
    switch (type) {
      case "student":
        return (
          <StudentForm
            formData={formData}
            setFormData={setFormData}
            classes={classes}
          />
        );
      case "teacher":
        return <TeacherForm formData={formData} setFormData={setFormData} />;
      case "subject":
        return (
          <SubjectForm
            formData={formData}
            setFormData={setFormData}
            teachers={teachers}
          />
        );
      case "template":
        return (
          <TemplateForm
            formData={formData}
            setFormData={setFormData}
            subjects={subjects}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800">{getTitle()}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form
          onSubmit={handleCreate}
          className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          {renderForm()}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
            >
              Simpan
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Modal;
