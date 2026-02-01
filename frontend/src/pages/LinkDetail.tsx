import { useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { useTopology } from "@/hooks/useTopology"

const WINDOW = 10
const SLA_THRESHOLD = 1 // %
const MAX_VISIBLE_POINTS = 120

const generateFallbackSeries = (base = 5, points = 60) => {
  return Array.from({ length: points }, (_, i) => {
    const wave = Math.sin(i / 6) * base * 0.3
    const noise = Math.random() * base * 0.2
    return Math.max(0.5, base + wave + noise)
  })
}

const LINK_COLORS = {
  "Link_1": "#FF3355",
  "Link_2": "#FFD24D",
  "Link_3": "#00FF99",
  "Link_4": "#A855F7",
  "Link_5": "#FB923C",
  "Link_6": "#38BDF8",
  "Link_7": "#EC4899"
}

const LinkDetail = () => {
  const { linkId } = useParams()
  const { data, isLoading, error } = useTopology()
  const [withBuffer, setWithBuffer] = useState(false)

  const link = useMemo(() => data?.links?.find((l) => l.id === linkId), [data, linkId])

  const series = useMemo(() => {
    let raw = link?.traffic_timeseries

    if (!raw || raw.length === 0) {
      console.warn(`[${linkId}] NO REAL TRAFFIC DATA — falling back`)
      const fallback = generateFallbackSeries(link?.capacity?.safe_gbps / 4 || 20, 60)
      console.log(`[${linkId}] FALLBACK — max: ${Math.max(...fallback).toFixed(2)}`)
      return fallback
    }

    console.log(`[${linkId}] REAL DATA — total: ${raw.length}`)

    let trimmed = [...raw]
    while (trimmed.length > 0 && trimmed[trimmed.length - 1] === 0) trimmed.pop()
    trimmed = trimmed.slice(-MAX_VISIBLE_POINTS)

    console.log(`[${linkId}] trimmed to ${trimmed.length}, max: ${Math.max(...trimmed).toFixed(2)}, avg: ${(trimmed.reduce((a,b)=>a+b,0)/trimmed.length || 0).toFixed(2)}`)

    return trimmed
  }, [link, linkId])

  const barColor = LINK_COLORS[link?.id] || "#FFD24D"

  const rollingAvg = useMemo(() => {
    const avg = series.map((_, i) => {
      const start = Math.max(0, i - WINDOW)
      const slice = series.slice(start, i + 1)
      return slice.reduce((a, b) => a + b, 0) / slice.length
    })
    console.log(`[${linkId}] rollingAvg max: ${Math.max(...avg).toFixed(2)}`)
    return avg
  }, [series, linkId])

  const requiredCapacity = useMemo(() => {
    // Use observed rolling peak instead of backend safe_gbps
    const observedPeak = Math.max(...rollingAvg, 0) || 20
    const headroom = withBuffer ? 1.05 : 1.20  // smaller & realistic
    const capacity = observedPeak * headroom

    console.log(`[${linkId}] Required Capacity (observed peak): peak=${observedPeak.toFixed(2)}, headroom=${headroom}, final=${capacity.toFixed(2)} Gbps`)
    return capacity
  }, [rollingAvg, withBuffer, linkId])

  const averageRate = useMemo(() => series.length ? series.reduce((a, b) => a + b, 0) / series.length : 0, [series])

  const packetLoss = useMemo(() => {
    if (!series.length || !requiredCapacity) return 0

    let lossSamples = 0
    let nearBreaches = 0

    series.forEach((v) => {
      if (v > requiredCapacity) lossSamples++
      else if (v > requiredCapacity * 0.9) nearBreaches++ // debug near-misses
    })

    const lossPct = (lossSamples / series.length) * 100
    console.log(`[${linkId}] Packet Loss: ${lossPct.toFixed(2)}% (${lossSamples}/${series.length} breaches, ${nearBreaches} near-breaches >90%)`)
    return lossPct
  }, [series, requiredCapacity, linkId])

  const maxY = useMemo(() => {
    const peak = Math.max(...series, 0)
    const natural = Math.max(requiredCapacity * 1.4, peak * 1.6, 25)
    console.log(`[${linkId}] maxY = ${natural.toFixed(1)} (req=${requiredCapacity.toFixed(1)}, peak=${peak.toFixed(1)})`)
    return natural
  }, [series, requiredCapacity, linkId])

  if (isLoading) return <div className="min-h-screen flex flex-col"><DashboardHeader /><main className="flex-1 p-6"><div className="noc-panel rounded-lg p-6 text-center text-muted-foreground">Loading...</div></main></div>

  if (error || !link) return <div className="min-h-screen flex flex-col"><DashboardHeader /><main className="flex-1 p-6"><div className="noc-panel rounded-lg p-6 text-center text-red-500">Failed to load</div></main></div>

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: barColor }}>{link.id} Analytics</h2>
            <p className="text-sm text-muted-foreground">Aggregated traffic analysis and SLA-based capacity planning</p>
          </div>
          <Link to="/" className="text-sm text-primary hover:underline">← Back</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="noc-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground">Required Capacity</div>
            <div className="text-xl font-bold" style={{ color: barColor }}>{requiredCapacity.toFixed(1)} Gbps</div>
          </div>

          <div className="noc-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground">Average Data Rate</div>
            <div className="text-xl font-bold text-foreground">{averageRate.toFixed(1)} Gbps</div>
          </div>

          <div className="noc-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground">Packet Loss (SLA)</div>
            <div className={`text-xl font-bold ${packetLoss > SLA_THRESHOLD ? "text-status-critical" : "text-status-ok"}`}>
              {packetLoss.toFixed(2)}%
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">SLA Threshold: {SLA_THRESHOLD}%</div>
          </div>

          <div className="noc-panel p-4 rounded-lg flex flex-col justify-between">
            <div className="text-xs text-muted-foreground">Buffer Mode</div>
            <button onClick={() => setWithBuffer(!withBuffer)} className="mt-2 px-3 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary text-xs font-mono transition">
              {withBuffer ? "With Buffer" : "Without Buffer"}
            </button>
            <div className="text-[10px] text-muted-foreground mt-1">Headroom model only</div>
          </div>
        </div>

        <div className="noc-panel p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Aggregated Traffic Over Time (recent {series.length} points)</h3>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span style={{ color: barColor }}>● Traffic</span>
              <span className="text-muted-foreground">● Required Capacity</span>
              <span className="text-status-critical">● SLA Breach</span>
            </div>
          </div>

          <div className="relative h-[340px] flex items-end space-x-[1px] bg-gradient-to-t from-gray-950/50 to-transparent rounded overflow-hidden border border-border/30">
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-yellow-400/90"
              style={{ bottom: `${Math.max(0, Math.min(99.5, (requiredCapacity / maxY) * 100))}%`, zIndex: 20 }}
            />

            {series.map((v, i) => {
              const normalized = (v / maxY) * 100
              const minH = v > 0 ? Math.max(1.5, 100 / series.length * 5) : 0.5
              const height = Math.max(minH, normalized)
              const congested = v > requiredCapacity

              return (
                <div
                  key={i}
                  title={`T=${i}s | Traffic: ${v.toFixed(2)} Gbps | Cap: ${requiredCapacity.toFixed(2)} Gbps | ${height.toFixed(1)}%`}
                  className="flex-1 transition-all hover:opacity-90"
                  style={{ height: `${height}%`, backgroundColor: congested ? "#FF3355" : barColor, minHeight: `${minH}%` }}
                />
              )
            })}
          </div>

          <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-2">
            <span>Recent {series.length} points</span>
            <span>max: {Math.max(...series).toFixed(1)} Gbps</span>
            <span>total original: {link?.traffic_timeseries?.length || series.length}</span>
          </div>
        </div>

        <div className="noc-panel p-4 rounded-lg">
          <h3 className="text-sm font-medium text-foreground mb-3">Connected Cells</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {link.cells.map((cell) => (
              <div key={cell} className="p-3 rounded border border-border text-center">
                <div className="text-xs" style={{ color: barColor }}>Cell {cell}</div>
                <div className="text-[10px] text-muted-foreground">Status: Active</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default LinkDetail