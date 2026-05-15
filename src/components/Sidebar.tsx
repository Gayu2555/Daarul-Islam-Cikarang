import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  GraduationCap,
  UserRound,
  BookOpen,
  CheckCircle2,
  CreditCard,
  ChevronRight,
  X,
  School, // ← Tambahkan import School dari lucide-react
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "classes", label: "Kelas", icon: School }, // ← Tambahkan menu Kelas di sini
  { id: "students", label: "Siswa", icon: GraduationCap },
  { id: "teachers", label: "Guru", icon: UserRound },
  { id: "subjects", label: "Mata Pelajaran", icon: BookOpen },
  { id: "grades", label: "Nilai", icon: CheckCircle2 },
  { id: "payments", label: "Pembayaran SPP", icon: CreditCard },
];

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  activeTab,
  setActiveTab,
}) => {
  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.aside
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-100 flex flex-col z-50 transition-all shadow-xl md:shadow-none`}
        >
          <div className="p-8 pb-4">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tighter text-slate-900">
                EduManage
              </span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden ml-auto p-2"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer group ${
                    activeTab === item.id
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${activeTab === item.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-700"}`}
                  />
                  {item.label}
                  {activeTab === item.id && (
                    <motion.div layoutId="activePill" className="ml-auto">
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-8 pt-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
                    alt="Admin"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Admin Utama
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                    Super Admin
                  </p>
                </div>
              </div>
              <button className="w-full py-2 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-lg hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                Sign Out
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
