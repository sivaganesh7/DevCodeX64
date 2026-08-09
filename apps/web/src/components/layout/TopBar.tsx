import { useAuth } from '../../hooks/useAuth';

export function TopBar() {
  const { user, logout } = useAuth();
  
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/8 bg-[#12121e] px-6">
      <p className="text-sm text-white/40">
        Code Intelligence &amp; DevSecOps Platform
      </p>
      
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/70">{user.name || user.email}</span>
          <button
            onClick={() => logout()}
            className="text-sm font-medium text-white/60 hover:text-white"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  )
}
