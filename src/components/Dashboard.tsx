import React from "react";
import { Clock, CheckCircle2, Mail } from "lucide-react";
import StatCard from "./StatCard";
import { Users, UserRound, BookOpen, CreditCard } from "lucide-react";
import type { SPP } from "../types";

interface DashboardProps {
  students: any[];
  teachers: any[];
  subjects: any[];
  sppData: SPP[];
  sendingEmail: string | null;
  sendReminder: (spp: SPP) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  students,
  teachers,
  subjects,
  sppData,
  sendingEmail,
  sendReminder,
}) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Siswa"
          value={students.length}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Guru"
          value={teachers.length}
          icon={UserRound}
          color="bg-indigo-500"
        />
        <StatCard
          title="Mata Pelajaran"
          value={subjects.length}
          icon={BookOpen}
          color="bg-emerald-500"
        />
        <StatCard
          title="Pending SPP"
          value={sppData.filter((s) => s.status === "pending").length}
          icon={CreditCard}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Pembayaran SPP Terbaru
          </h3>
          <div className="space-y-4">
            {sppData.length > 0 ? (
              sppData.slice(0, 5).map((spp) => (
                <div
                  key={spp.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${spp.status === "paid" ? "bg-emerald-100" : "bg-orange-100"}`}
                    >
                      {spp.status === "paid" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {spp.students?.name || "Unknown student"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {spp.month} • Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(spp.amount)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${spp.status === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"}`}
                  >
                    {spp.status === "paid" ? "Lunas" : "Pending"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-10 italic">
                Belum ada data pembayaran
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            Pengingat SPP Cepat
          </h3>
          <div className="space-y-4">
            {sppData.filter((s) => s.status === "pending").length > 0 ? (
              sppData
                .filter((s) => s.status === "pending")
                .slice(0, 5)
                .map((spp) => (
                  <div
                    key={spp.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                        {spp.students?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm truncate max-w-30">
                          {spp.students?.name}
                        </p>
                        <p className="text-xs text-slate-500">{spp.month}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendReminder(spp)}
                      disabled={sendingEmail === spp.id}
                      className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all cursor-pointer disabled:opacity-50"
                      title="Kirim Email Pengingat"
                    >
                      {sendingEmail === spp.id ? (
                        <Clock className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))
            ) : (
              <p className="text-slate-400 text-center py-10 italic">
                Semua tagihan sudah terbayar!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
