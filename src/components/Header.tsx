import React from "react";
import { Search, Bell, Menu } from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface HeaderProps {
  activeTab: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  menuItems: MenuItem[];
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  isSidebarOpen,
  setIsSidebarOpen,
  menuItems,
}) => {
  const getTitle = () => {
    if (activeTab === "dashboard") return "Selamat Datang";
    return menuItems.find((i) => i.id === activeTab)?.label || "";
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-1">
          {getTitle()}
        </h1>
        <p className="text-slate-500 font-medium">
          Sistem Manajemen Sekolah - Kelola aktivitas dengan efisien.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari data..."
            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-64"
          />
        </div>
        <button
          className="p-2.5 bg-white border border-slate-200 rounded-xl relative hover:bg-slate-50 transition-all cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-500" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="hidden md:flex p-2.5 bg-white border border-slate-200 rounded-xl"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
