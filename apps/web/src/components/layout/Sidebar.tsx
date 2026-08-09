import { NavLink } from "react-router-dom"
import { LayoutDashboard, GitBranch, Shield, PackageOpen, Activity, Settings } from "lucide-react"

const NAV_ITEMS = [
  { to: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { to: "/repositories",  label: "Repositories",  icon: GitBranch,   disabled: true },
  { to: "/security",      label: "Security",       icon: Shield,      disabled: true },
  { to: "/dependencies",  label: "Dependencies",   icon: PackageOpen, disabled: true },
  { to: "/risk",          label: "Risk",           icon: Activity,    disabled: true },
]

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-white/8 bg-[#12121e]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-white/8 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <span className="text-xs font-bold text-white">DC</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">DevCodeX64</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, disabled }) =>
          disabled ? (
            <div
              key={to}
              className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/30"
              title={`Available in a later phase`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </div>
          ) : (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ),
        )}
      </nav>

      {/* Settings */}
      <div className="border-t border-white/8 p-3">
        <div className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/30">
          <Settings size={16} />
          <span>Settings</span>
        </div>
      </div>
    </aside>
  )
}
