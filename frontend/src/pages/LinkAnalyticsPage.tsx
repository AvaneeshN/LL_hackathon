import { useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { useTopology } from "@/hooks/useTopology"

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  accent?: "ok" | "warn" | "crit"
}

const MetricCard = ({ label, value, sub, accent }: MetricCardProps) => {
  const accentColor =
    accent === "crit"
      ? "text-status-critical"
      : accent === "warn"
      ? "text-status-warning"
      : "text-primary"

  return (
    <div className="noc-panel rounded-lg p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${accentColor}`}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-muted-foreground mt-1">
          {sub}
        </p>
      )}
    </div>
  )
}

export default function LinkAnalyticsPage() {
  const { linkId } = useParams()
  const { data, isLoading, error } = useTopology()
  const [withBuffer, setWithBuffer] = useState(false)

  const link = useMemo(() => {
    return data?.links?.find((l: any) => l.id === linkId)
  }, [data, linkId])

  // ----------------------------
  // Loading / Error
  // ----------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="noc-panel p-6 text-center text-muted-foreground">
            Loading link analytics...
          </div>
        </main>
      </div>
    )
  }

  if (error || !link) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="noc-panel p-6 text-center text-status-critical">
            Link not found or backend unavailable
          </div>
        </main>
      </div>
    )
  }

  // ----------------------------
  // Metrics
  // ----------------------------
  const series = link.traffic_timeseries || []
  const avg =
    series.reduce((a: number, b: number) => a + b, 0) /
    Math.max(1, series.length)

  const peak = Math.max(...series, 0)

  const safe = link.capacity?.safe_gbps || 1

  const requiredCapacity = withBuffer
    ? peak * 0.75
    : peak * 1.05

  const packetLoss = Math.min(
    100,
    Math.max(
      0,
      ((peak - safe) / safe) * 100
    )
  )

  const packetAccent =
    packetLoss > 10
      ? "crit"
      : packetLoss > 1
      ? "warn"
      : "ok"

  // ----------------------------
  // Buffer smoothing
  // ----------------------------
  const graphSeries = useMemo(() => {
    if (!withBuffer) return series

    return series.map((v: number, i: number, arr: number[]) => {
      const prev = arr[i - 1] || v
      const next = arr[i + 1] || v
      return (v + prev + next) / 3
    })
  }, [series, withBuffer])

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">
              {link.id} Analytics
            </h2>
            <p className="text-sm text-muted-foreground">
              Aggregated traffic analysis and capacity planning
            </p>
          </div>

          <Link
            to="/"
            className="text-sm text-primary hover:underline"
          >
            ← Back to Topology
          </Link>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            label="Required Capacity"
            value={`${requiredCapacity.toFixed(1)} Gbps`}
            sub="Peak-based planning model"
          />

          <MetricCard
            label="Average Data Rate"
            value={`${avg.toFixed(1)} Gbps`}
            sub="Rolling mean traffic"
          />

          <MetricCard
            label="Packet Loss"
            value={`${packetLoss.toFixed(2)}%`}
            sub="Threshold: 1%"
            accent={packetAccent}
          />

          <div className="noc-panel rounded-lg p-4 flex flex-col justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Buffer Mode
              </p>
              <p className="text-sm mt-1">
                4-symbol switch buffer
              </p>
            </div>

            <button
              onClick={() => setWithBuffer((v) => !v)}
              className="mt-3 px-3 py-1 rounded bg-border hover:bg-border/70 text-xs font-mono"
            >
              {withBuffer ? "With Buffer" : "Without Buffer"}
            </button>
          </div>
        </div>

        {/* Time Graph */}
        <div className="noc-panel rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">
              Aggregated Traffic Over Time
            </h3>

            <div className="flex gap-4 text-xs font-mono">
              <span className="text-primary">
                ● Traffic
              </span>
              <span className="text-muted-foreground">
                ● Required Capacity
              </span>
              <span className="text-status-warning">
                ● Congestion
              </span>
            </div>
          </div>

          <div className="relative h-[260px] flex items-end gap-[1px]">
            {graphSeries.map((v: number, i: number) => {
              const ratio = v / safe
              const height = Math.min(100, ratio * 100)

              let color = "#7c3aed"
              if (ratio > 0.8) color = "#FF3355"
              else if (ratio > 0.55) color = "#FFD24D"

              return (
                <div
                  key={i}
                  title={`T=${i}s\n${v.toFixed(2)} Gbps\nUtil: ${(ratio * 100).toFixed(
                    1
                  )}%`}
                  className="flex-1 transition-all hover:opacity-90"
                  style={{
                    height: `${height}%`,
                    backgroundColor: color
                  }}
                />
              )
            })}
          </div>

          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
            <span>0s</span>
            <span>30s</span>
            <span>60s</span>
          </div>
        </div>

        {/* Cells */}
        <div className="noc-panel rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Connected Cells
          </h3>

          <div className="flex flex-wrap gap-2">
            {link.cells.map((cell: string) => (
              <div
                key={cell}
                className="px-2 py-1 rounded border border-border text-xs font-mono text-muted-foreground hover:border-primary"
              >
                {cell}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
