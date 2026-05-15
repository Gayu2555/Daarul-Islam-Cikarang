import React from "react";
import { Clock, CreditCard, Mail } from "lucide-react";
import type { SPP } from "../types";

interface PaymentsProps {
  sppData: SPP[];
  sendingEmail: string | null;
  sendReminder: (spp: SPP) => void;
  fetchData: () => void;
}

const Payments: React.FC<PaymentsProps> = ({
  sppData,
  sendingEmail,
  sendReminder,
  fetchData,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
        <h3 className="font-bold text-slate-800">Manajemen SPP</h3>
        <div className="flex gap-2">
          <button
            onClick={() => fetchData()}
            className="p-2 hover:bg-slate-50 text-slate-500 rounded-lg"
            aria-label="Refresh"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sppData.map((spp) => (
          <div
            key={spp.id}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <CreditCard className="w-6 h-6" />
              </div>
              <span
                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${spp.status === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}
              >
                {spp.status === "paid" ? "Lunas" : "Belum Lunas"}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900">{spp.students?.name}</h4>
              <p className="text-xs text-slate-400 font-medium">
                Bulan {spp.month}
              </p>
            </div>
            <div className="flex justify-between items-end pt-2">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Total Tagihan
                </p>
                <p className="text-lg font-black text-slate-900 tracking-tight">
                  Rp {new Intl.NumberFormat("id-ID").format(spp.amount)}
                </p>
              </div>
              {spp.status === "pending" && (
                <button
                  onClick={() => sendReminder(spp)}
                  disabled={sendingEmail === spp.id}
                  className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {sendingEmail === spp.id ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Payments;
