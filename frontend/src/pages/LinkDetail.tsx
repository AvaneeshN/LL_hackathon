import { useParams, Link } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { useTopology } from "@/hooks/useTopology"
import { getLinkColor } from "@/utils/linkColors"

const LinkDetail = () => {
  const { linkId } = useParams()
  const { data, isLoading, error } = useTopology()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="noc-panel rounded-lg p-6 text-center text-muted-foreground">
            Loading link details...
          </div>
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="noc-panel rounded-lg p-6 text-center text-red-500">
            Failed to load link data
          </div>
        </main>
      </div>
    )
  }

  const link = data.links.find((l: any) => l.id === linkId)

  if (!link) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="noc-panel rounded-lg p-6 text-center text-muted-foreground">
            Link not found
          </div>
        </main>
      </div>
    )
  }

  const color = getLinkColor(link.id)

  const peak = Number(link.capacity?.peak_gbps || 0)
  const safe = Number(link.capacity?.safe_gbps || 0)

  const loadRatio = safe > 0 ? peak / safe : 0

  let riskLabel = "SAFE"
  let riskColor = "text-status-ok"

  if (loadRatio > 0.9) {
    riskLabel = "CRITICAL"
    riskColor = "text-status-critical"
  } else if (loadRatio > 0.75) {
    riskLabel = "WARNING"
    riskColor = "text-status-warning"
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-xl font-semibold"
              style={{ color }}
            >
              {link.id} — Engineering View
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Detailed fronthaul capacity and congestion analytics
            </p>
          </div>

          <Link
            to="/"
            className="text-xs font-mono text-primary hover:underline"
          >
            ← Back to Topology
          </Link>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Link Summary */}
          <div
            className="col-span-12 lg:col-span-4 noc-panel rounded-lg p-4"
            style={{
              borderLeft: `4px solid ${color}`
            }}
          >
            <h3 className="text-sm font-medium text-foreground mb-3">
              Link Summary
            </h3>

            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Confidence</span>
                <span className="font-mono">
                  {(link.confidence * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between">
                <span>Peak Load</span>
                <span className="font-mono">
                  {peak.toFixed(1)} Gbps
                </span>
              </div>

              <div className="flex justify-between">
                <span>Safe Capacity</span>
                <span className="font-mono">
                  {safe.toFixed(1)} Gbps
                </span>
              </div>

              <div className="flex justify-between">
                <span>Status</span>
                <span className={`font-mono ${riskColor}`}>
                  {riskLabel}
                </span>
              </div>

              {/* Capacity Bar */}
              <div className="mt-2">
                <div className="h-2 bg-border rounded overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.min(100, loadRatio * 100)}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-mono">
                    Load
                  </span>
                  <span className="font-mono">
                    {peak.toFixed(1)} / {safe.toFixed(1)} Gbps
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cells on Link */}
          <div className="col-span-12 lg:col-span-8 noc-panel rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Connected Cells
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {link.cells.map((cell: string) => (
                <div
                  key={cell}
                  className="noc-panel rounded-md p-3 text-center text-xs text-muted-foreground transition hover:border-primary border border-border"
                >
                  <div
                    className="font-medium"
                    style={{ color }}
                  >
                    Cell {cell}
                  </div>
                  <div className="font-mono mt-1">
                    Status: Active
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Traffic Timeline */}
        {Array.isArray(link.traffic_timeseries) &&
          link.traffic_timeseries.length > 0 && (
            <div className="noc-panel rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Traffic Timeline (Gbps)
              </h3>

              <div className="flex items-end gap-1 h-32">
                {link.traffic_timeseries
                  .slice(0, 60)
                  .map((v: number, i: number) => {
                    const normalized =
                      safe > 0 ? Math.min(1, v / safe) : 0

                    return (
                      <div
                        key={i}
                        title={`T=${i}s → ${v.toFixed(2)} Gbps`}
                        className="flex-1 rounded-sm transition-all"
                        style={{
                          height: `${normalized * 100}%`,
                          backgroundColor: color,
                          opacity: normalized > 0.9 ? 1 : 0.6
                        }}
                      />
                    )
                  })}
              </div>

              <div className="flex justify-between mt-2 text-xs font-mono text-muted-foreground">
                <span>0s</span>
                <span>30s</span>
                <span>60s</span>
              </div>
            </div>
          )}
      </main>
    </div>
  )
}

export default LinkDetail
