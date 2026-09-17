import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  GitBranch,
  Settings,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/repositories", label: "Repositories", icon: GitBranch },
];

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const content = (
    <aside className="flex h-full w-60 flex-col border-r border-white/8 bg-[#12121e]">
      {/* Logo & Mobile Close button */}
      <div className="flex h-14 items-center justify-between border-b border-white/8 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30">
            <span className="text-xs font-bold text-white">DC</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            DevCodeX64
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation sidebar"
            className="p-1 rounded-lg text-white/40 hover:text-white md:hidden hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-3" aria-label="Main Navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Settings Link */}
      <div className="border-t border-white/8 p-3">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              isActive
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`
          }
        >
          <Settings size={16} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <div className="hidden md:flex h-full shrink-0">{content}</div>

      {/* Mobile overlay drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
          className="fixed inset-0 z-50 flex md:hidden"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-50 flex flex-col animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
