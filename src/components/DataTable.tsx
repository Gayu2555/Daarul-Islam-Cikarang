import React from "react";
import { Plus, Trash2 } from "lucide-react";

interface Column {
  key: string;
  label: string;
}

// update interface ini doang
interface DataTableProps {
  title: string;
  data: any[];
  columns: Column[];
  type: "student" | "teacher" | "subject" | "grade" | "class" | "template";
  onAdd: () => void;
  onDelete: (
    id: string,
    type: "student" | "teacher" | "subject" | "grade" | "class" | "template",
  ) => void;
  onRowClick?: (row: any) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  title,
  data,
  columns,
  type,
  onAdd,
  onDelete,
  onRowClick,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Tambah {title.replace("Daftar ", "")}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4">
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length > 0 ? (
              data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={`hover:bg-slate-50/50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-6 py-4 text-slate-600 text-sm"
                    >
                      {col.key === "name" ? (
                        <span className="font-medium text-slate-900">
                          {item[col.key]}
                        </span>
                      ) : (
                        item[col.key]
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-bold">
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id, type);
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-6 py-10 text-center text-slate-400 italic"
                >
                  Belum ada data tersedia
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
