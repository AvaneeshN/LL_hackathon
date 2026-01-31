import { useParams, Link } from "react-router-dom"
import { useMemo, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { useTopology } from "@/hooks/useTopology"
import { getLinkColor } from "@/utils/linkColors"

const LinkDetail = () => {
  const { linkId } = useParams()
  const { data, isLoading, error } = useTopology()
  const [bufferEnabled, setBufferEnabled] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 text-muted-foreground">
          Loading link analytics...
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 text-red-500">
          Failed to load link analytics
        </main>
      </div>
    )
  }

  const link = data.links.find((l: any) => l.id === linkId)
  if (!link) return null

  const color = getLinkColor(link.id)
  const series = link.traffic_timeseries || []
  const safe = link.capacity?.safe_gbps || 1

  // ----------------------------
  // Metrics
  // ----------------------------
  const avgRate = useMemo(() => {
    if (!series.length) return 0
    return series.reduce((a: number, b: number) => a + b, 0) / series.length
  }, [series])

  const peak = Math.max(...series, 0)

  const requiredCapacity = bufferEnabled
    ? safe * 0.85
    : safe

  const packetLoss = useMemo(() => {
  if (!series.length) return 0

  const window = 20

  let lossEvents = 0

  const baseline =
    series.slice(0, window).reduce((a, b) => a + b, 0) /
    Math.max(1, series.slice(0, window).length)

  series.forEach((v: number) => {
    const capacityRatio = v / safe
    const trendRatio = baseline > 0 ? v / baseline : 0

    // Loss event if link is stressed
    if (capacityRatio > 0.9 || trendRatio > 1.8) {
      lossEvents += 1
    }
  })

  // % of time experiencing loss
  return ((lossEvents / series.length) * 100)
}, [series, safe])




  // ----------------------------
  // Scaling for graph
  // ----------------------------
  const maxY = Math.max(requiredCapacity, peak) * 1.15

  const points = series
    .map((v: number, i: number) => {
      const x = (i / (series.length - 1)) * 100
      const y = 100 - (v / maxY) * 100
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold" style={{ color }}>
              {link.id} Analytics
            </h2>
            <p className="text-sm text-muted-foreground">
              Aggregated traffic analysis and capacity planning
            </p>
          </div>

          <Link
            to="/"
            className="text-xs font-mono text-primary hover:underline"
          >
            ← Back to Topology
          </Link>
        </div>

        {/* =======================
            KPI CARDS
        ======================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="noc-panel rounded-lg p-4">
            <div className="text-xs text-muted-foreground">
              Required Capacity
            </div>
            <div className="text-xl font-semibold text-primary mt-1">
              {requiredCapacity.toFixed(1)} Gbps
            </div>
          </div>

          <div className="noc-panel rounded-lg p-4">
            <div className="text-xs text-muted-foreground">
              Average Data Rate
            </div>
            <div className="text-xl font-semibold text-foreground mt-1">
              {avgRate.toFixed(1)} Gbps
            </div>
          </div>

          <div className="noc-panel rounded-lg p-4">
            <div className="text-xs text-muted-foreground">
              Packet Loss
            </div>
            <div
              className={`text-xl font-semibold mt-1 ${
                packetLoss > 10
                  ? "text-status-critical"
                  : packetLoss > 3
                  ? "text-status-warning"
                  : "text-status-ok"
              }`}
            >
              {packetLoss.toFixed(2)}%
            </div>
            <div className="text-[10px] text-muted-foreground">
              Threshold: 1%
            </div>
          </div>

          <div className="noc-panel rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Buffer Mode
              </div>
              <button
                onClick={() => setBufferEnabled(!bufferEnabled)}
                className={`text-xs px-2 py-1 rounded font-mono ${
                  bufferEnabled
                    ? "bg-status-ok/20 text-status-ok"
                    : "bg-border text-muted-foreground"
                }`}
              >
                {bufferEnabled ? "With Buffer" : "Without Buffer"}
              </button>
            </div>
            <div className="text-sm mt-2 text-muted-foreground">
              4-symbol switch buffer
            </div>
          </div>
        </div>

        {/* =======================
            TRAFFIC GRAPH
        ======================= */}
        <div className="noc-panel rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">
              Aggregated Traffic Over Time
            </h3>
            <div className="flex gap-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Traffic
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                Required Capacity
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-status-critical" />
                Congestion
              </span>
            </div>
          </div>

          <div className="relative h-[320px]">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              {/* Capacity Threshold */}
              <line
                x1="0"
                y1={100 - (requiredCapacity / maxY) * 100}
                x2="100"
                y2={100 - (requiredCapacity / maxY) * 100}
                stroke="rgba(255,255,255,0.4)"
                strokeDasharray="4 4"
              />

              {/* Area Fill */}
              <polygon
                points={`0,100 ${points} 100,100`}
                fill="rgba(80,200,255,0.15)"
              />

              {/* Traffic Line */}
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="0.6"
              />
            </svg>
          </div>

          <div className="flex justify-between mt-2 text-xs font-mono text-muted-foreground">
            <span>0s</span>
            <span>30s</span>
            <span>60s</span>
          </div>
        </div>

        {/* =======================
            CONNECTED CELLS
        ======================= */}
        <div className="noc-panel rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Connected Cells
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {link.cells.map((cell: string) => (
              <div
                key={cell}
                className="noc-panel rounded-md p-3 text-center text-xs text-muted-foreground border border-border hover:border-primary transition"
              >
                <div className="font-medium" style={{ color }}>
                  Cell {cell}
                </div>
                <div className="font-mono mt-1">
                  Status: Active
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default LinkDetail
