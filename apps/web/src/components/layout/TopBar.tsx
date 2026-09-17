import { useAuth } from '../../hooks/useAuth';
import { Menu, LogOut, User } from 'lucide-react';

interface TopBarProps {
  onToggleSidebar?: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/8 bg-[#12121e] px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 md:hidden transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Menu size={20} />
          </button>
        )}
        <p className="text-xs sm:text-sm text-white/50 font-medium">
          Code Intelligence &amp; DevSecOps Platform
        </p>
      </div>

      {user && (
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-white/70">
            <User size={14} className="text-white/40" />
            <span className="max-w-[120px] sm:max-w-none truncate">{user.name || user.email}</span>
          </div>
          <button
            onClick={() => logout()}
            aria-label="Log out of platform"
            className="flex items-center gap-1 text-xs sm:text-sm font-medium text-white/50 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      )}
    </header>
  );
}
