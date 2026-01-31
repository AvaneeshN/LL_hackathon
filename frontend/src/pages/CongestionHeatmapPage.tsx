import { useState, useMemo } from "react"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { CongestionHeatmap } from "@/components/dashboard/CongestionHeatmap"
import { HeatmapLegend } from "@/components/dashboard/HeatmapLegend"
import { Slider } from "@/components/ui/slider"
import { useTopology } from "@/hooks/useTopology"
import { getLinkColor } from "@/utils/linkColors"
import { Link } from "react-router-dom"

const CongestionHeatmapPage = () => {
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 60])
  const { data, isLoading, error } = useTopology()

  const links = useMemo(() => {
    return data?.links || []
  }, [data])

  // ----------------------------
  // Loading state
  // ----------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="noc-panel rounded-lg p-6 text-center text-muted-foreground">
            Loading congestion data from backend...
          </div>
        </main>
      </div>
    )
  }

  // ----------------------------
  // Error state
  // ----------------------------
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="noc-panel rounded-lg p-6 text-center text-red-500">
            Failed to load congestion data from backend
          </div>
        </main>
      </div>
    )
  }

  // ----------------------------
  // Page render
  // ----------------------------
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Congestion Heatmap
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize packet loss and link utilization across time and cells
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="noc-panel rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">
              Time Range
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              {timeRange[0]}s – {timeRange[1]}s
            </span>
          </div>

          <Slider
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as [number, number])}
            min={0}
            max={60}
            step={1}
            className="cursor-pointer"
          />

          <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
            <span>0s</span>
            <span>15s</span>
            <span>30s</span>
            <span>45s</span>
            <span>60s</span>
          </div>
        </div>

        {/* ============================
            Main Content Grid
        ============================ */}
        <div className="grid grid-cols-12 gap-6">
          {/* Heatmap */}
          <div className="col-span-12 lg:col-span-9 noc-panel rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">
                Cell Congestion Matrix
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                Backend-driven live topology
              </span>
            </div>

            <CongestionHeatmap timeRange={timeRange} />
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <HeatmapLegend />

            {/* Reading Guide */}
            <div className="noc-panel rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Reading the Heatmap
              </h3>
              <div className="space-y-3 text-xs text-muted-foreground">
                <p>
                  <span className="text-foreground font-medium">Rows:</span>{" "}
                  Individual cells
                </p>
                <p>
                  <span className="text-foreground font-medium">Columns:</span>{" "}
                  Time slots (seconds)
                </p>
                <p>
                  <span className="text-foreground font-medium">Color:</span>{" "}
                  Load vs Safe Link Capacity
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-xs font-medium text-foreground mb-2">
                  Key Insight
                </h4>
                <p className="text-xs text-muted-foreground">
                  Cells turning red simultaneously indicate shared fronthaul
                  congestion and potential Ethernet bottlenecks.
                </p>
              </div>
            </div>

            {/* Active Links */}
            <div className="noc-panel rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Active Links
              </h3>

              <div className="space-y-3">
                {links.map((link: any) => {
                  const color = getLinkColor(link.id)
                  const peak = link.capacity?.peak_gbps || 0
                  const safe = link.capacity?.safe_gbps || 1
                  const ratio = peak / safe

                  let status = "SAFE"
                  let statusClass = "text-status-ok"

                  if (ratio > 0.9) {
                    status = "CRITICAL"
                    statusClass = "text-status-critical"
                  } else if (ratio > 0.75) {
                    status = "WARNING"
                    statusClass = "text-status-warning"
                  }

                  return (
                    <Link
                      to={`/link/${link.id}`}
                      key={link.id}
                      className="block"
                    >
                      <div
                        className="p-2 rounded border border-border hover:border-primary transition"
                        style={{
                          borderLeft: `4px solid ${color}`
                        }}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {link.id}
                          </span>
                          <span className={`font-mono ${statusClass}`}>
                            {status}
                          </span>
                        </div>

                        {/* Utilization Bar */}
                        <div className="mt-1 h-1 bg-border rounded overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${Math.min(100, ratio * 100)}%`,
                              backgroundColor: color
                            }}
                          />
                        </div>

                        <div className="flex justify-between mt-1 text-[10px] font-mono text-muted-foreground">
                          <span>{peak.toFixed(1)} Gbps</span>
                          <span>{safe.toFixed(1)} Gbps</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CongestionHeatmapPage
