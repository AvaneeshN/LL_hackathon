import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { useTopology } from "@/hooks/useTopology"
import { Link } from "react-router-dom"
import { getLinkColor } from "@/utils/linkColors"
import { TowerMap } from "@/components/dashboard/TowerMap"
import { useEffect, useState } from "react"

const Index = () => {
  const { data, isLoading, error } = useTopology()

  // Live time tick for network animation
  const [time, setTime] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => (t + 1) % 60)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="noc-panel rounded-lg p-6 text-center text-muted-foreground">
            Loading fronthaul topology...
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
            Failed to load topology data
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Fronthaul Topology Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Inferred links, grouped cells, and estimated Ethernet capacity
          </p>
        </div>

        {/* LIVE NETWORK MAP */}
        <div className="noc-panel rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">
              Live Fronthaul Network
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              Simulation Time: T+{time}s
            </span>
          </div>

          <TowerMap time={time} />
        </div>

        {/* Topology Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Link Cards */}
          <div className="col-span-12 noc-panel rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">
                Active Fronthaul Links
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                Total Links: {data.links.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.links.map((link: any) => {
                const color = getLinkColor(link.id)

                const peak = link.capacity?.peak_gbps || 0
                const safe = link.capacity?.safe_gbps || 1
                const loadRatio = peak / safe

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
                  <Link
                    to={`/link/${link.id}`}
                    key={link.id}
                    className="noc-panel rounded-lg p-4 border border-border hover:border-primary transition group"
                    style={{
                      borderLeft: `4px solid ${color}`
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4
                        className="text-sm font-semibold"
                        style={{ color }}
                      >
                        {link.id}
                      </h4>
                      <span className="text-xs font-mono text-muted-foreground">
                        {link.cells.length} cells
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div>
                        <span className="text-foreground font-medium">
                          Cells:
                        </span>{" "}
                        {link.cells.join(", ")}
                      </div>

                      <div className="flex justify-between">
                        <span>Confidence</span>
                        <span className="font-mono">
                          {(link.confidence * 100).toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Safe Capacity</span>
                        <span className="font-mono">
                          {safe.toFixed(1)} Gbps
                        </span>
                      </div>

                      {/* Capacity bar */}
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
                          <span className={`font-mono ${riskColor}`}>
                            {riskLabel}
                          </span>
                          <span className="font-mono">
                            {peak.toFixed(1)} / {safe.toFixed(1)} Gbps
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Index
