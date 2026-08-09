import { useQuery } from "@tanstack/react-query"
import { fetchHealth } from "../../services/health"
import { CheckCircle, XCircle, Database, Server, Loader2 } from "lucide-react"

/**
 * DashboardPage — Phase 1
 *
 * Shows platform status and verifies frontend ↔ API connectivity.
 * Real repository analytics and analysis results are added in Phase 4+.
 */
export function DashboardPage() {
  const { data: health, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 30_000, // re-check every 30s
  })

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          DevCodeX64
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Code Intelligence &amp; DevSecOps Platform
        </p>
      </div>

      {/* Platform status */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/40">
          Platform Status
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* API Health Card */}
          <StatusCard
            title="API Service"
            icon={<Server size={18} />}
            isLoading={isLoading}
            status={isError ? "error" : health?.status === "ok" ? "ok" : "degraded"}
            detail={
              isError
                ? "Cannot reach API — is the backend running?"
                : health
                ? `v${health.version} — ${health.timestamp}`
                : undefined
            }
          />

          {/* Database Health Card */}
          <StatusCard
            title="Database"
            icon={<Database size={18} />}
            isLoading={isLoading}
            status={isError ? "error" : health?.database === "connected" ? "ok" : "degraded"}
            detail={isError ? "Unknown" : health?.database}
          />
        </div>
      </section>

      {/* Phase progress */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/40">
          Implementation Progress
        </h2>
        <div className="rounded-xl border border-white/8 bg-[#12121e] p-5">
          <div className="space-y-3">
            {PHASES.map((phase) => (
              <PhaseRow key={phase.number} {...phase} />
            ))}
          </div>
        </div>
      </section>

      {/* Getting started note */}
      <section>
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-600/5 p-5">
          <p className="text-sm font-semibold text-indigo-400">Phase 1 Complete</p>
          <p className="mt-1 text-sm text-white/60">
            The platform foundation is operational. Connect a GitHub account and
            select a repository in Phase 2–3 to begin analysis.
          </p>
        </div>
      </section>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

interface StatusCardProps {
  title:     string
  icon:      React.ReactNode
  isLoading: boolean
  status:    "ok" | "degraded" | "error"
  detail?:   string
}

function StatusCard({ title, icon, isLoading, status, detail }: StatusCardProps) {
  const statusConfig = {
    ok:       { color: "text-emerald-400", label: "Operational",   Icon: CheckCircle },
    degraded: { color: "text-yellow-400",  label: "Degraded",      Icon: XCircle },
    error:    { color: "text-red-400",     label: "Unreachable",   Icon: XCircle },
  }[status]

  const { color, label, Icon } = statusConfig

  return (
    <div className="flex items-start gap-4 rounded-xl border border-white/8 bg-[#12121e] p-4">
      <div className="mt-0.5 text-white/40">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{title}</p>
        {isLoading ? (
          <div className="mt-1 flex items-center gap-1.5 text-white/40">
            <Loader2 size={13} className="animate-spin" />
            <span className="text-xs">Checking...</span>
          </div>
        ) : (
          <div className={`mt-1 flex items-center gap-1.5 ${color}`}>
            <Icon size={13} />
            <span className="text-xs font-medium">{label}</span>
          </div>
        )}
        {detail && !isLoading && (
          <p className="mt-1 truncate text-xs text-white/30">{detail}</p>
        )}
      </div>
    </div>
  )
}

const PHASES = [
  { number: 0, label: "Requirements + Architecture", status: "complete" as const },
  { number: 1, label: "Development Foundation",      status: "complete" as const },
  { number: 2, label: "Authentication + GitHub OAuth", status: "next" as const },
  { number: 3, label: "GitHub Repository Integration", status: "planned" as const },
  { number: 4, label: "Repository Ingestion + Workers", status: "planned" as const },
  { number: 5, label: "Code Intelligence + Analysis",   status: "planned" as const },
]

function PhaseRow({ number, label, status }: { number: number; label: string; status: "complete" | "next" | "planned" }) {
  const config = {
    complete: { color: "text-emerald-400", bg: "bg-emerald-400",   label: "Done"    },
    next:     { color: "text-indigo-400",  bg: "bg-indigo-400",    label: "Up Next" },
    planned:  { color: "text-white/30",    bg: "bg-white/10",      label: "Planned" },
  }[status]

  return (
    <div className="flex items-center gap-3">
      <div className={`h-2 w-2 rounded-full ${config.bg}`} />
      <span className="w-6 text-xs text-white/30">P{number}</span>
      <span className={`flex-1 text-sm ${status === "planned" ? "text-white/40" : "text-white/80"}`}>
        {label}
      </span>
      <span className={`text-xs ${config.color}`}>{config.label}</span>
    </div>
  )
}
