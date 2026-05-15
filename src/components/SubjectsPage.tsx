import React from "react";
import { Plus, Trash2, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import type { Subject, CurriculumTemplate } from "../types";

interface Props {
  subjects: Subject[];
  templates: CurriculumTemplate[];
  onAddSubject: () => void;
  onAddTemplate: () => void;
  onDeleteSubject: (id: string) => void;
  onDeleteTemplate: (id: string) => void;
}

export default function SubjectsPage({
  subjects,
  templates,
  onAddSubject,
  onAddTemplate,
  onDeleteSubject,
  onDeleteTemplate,
}: Props) {
  const [expandedTemplate, setExpandedTemplate] = React.useState<string | null>(
    null,
  );

  const toggleTemplate = (id: string) => {
    setExpandedTemplate((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* ============================================
          SECTION: MATA PELAJARAN
      ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Daftar Mata Pelajaran
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {subjects.length} mata pelajaran terdaftar
            </p>
          </div>
          <button
            onClick={onAddSubject}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Tambah Mata Pelajaran
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Nama Mapel</th>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Guru Pengampu</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.length > 0 ? (
                subjects.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="font-medium text-slate-800">
                          {s.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                        {s.code ?? "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {s.teachers?.name ?? (
                        <span className="italic text-slate-300">
                          Belum diassign
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onDeleteSubject(s.id)}
                        className="text-red-400 hover:text-red-600 p-1 transition-colors"
                        aria-label="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-slate-400 italic text-sm"
                  >
                    Belum ada mata pelajaran
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================
          SECTION: TEMPLATE KURIKULUM
      ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Template Kurikulum
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Template berisi kumpulan mapel yang bisa di-assign ke kelas
            </p>
          </div>
          <button
            onClick={onAddTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Buat Template
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {templates.length === 0 ? (
            <p className="px-6 py-10 text-center text-slate-400 italic text-sm">
              Belum ada template — buat template dulu sebelum assign ke kelas
            </p>
          ) : (
            templates.map((t) => {
              const isExpanded = expandedTemplate === t.id;
              // support dua bentuk data: subjects[] langsung atau curriculum_template_subjects[]
              const subjectList: any[] =
                (t as any).curriculum_template_subjects ?? t.subjects ?? [];

              return (
                <div key={t.id}>
                  {/* Template header */}
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <button
                      onClick={() => toggleTemplate(t.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-violet-600 font-bold text-xs">
                          {subjectList.length}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{t.name}</p>
                        {t.description && (
                          <p className="text-xs text-slate-400">
                            {t.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-2 text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => onDeleteTemplate(t.id)}
                      className="text-red-400 hover:text-red-600 p-1 transition-colors ml-4 flex-shrink-0"
                      aria-label="Hapus template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Template detail — mapel di dalamnya */}
                  {isExpanded && (
                    <div className="px-6 pb-4 bg-slate-50/50">
                      {subjectList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          Tidak ada mata pelajaran dalam template ini
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {subjectList.map((item: any, idx: number) => {
                            const name =
                              item.subjects?.name ?? item.name ?? "Unknown";
                            const code =
                              item.subjects?.code ?? item.code ?? null;
                            return (
                              <div
                                key={item.id ?? idx}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                <span className="text-slate-700 font-medium">
                                  {name}
                                </span>
                                {code && (
                                  <span className="font-mono text-xs text-slate-400">
                                    {code}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
