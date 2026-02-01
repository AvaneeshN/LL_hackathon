import { useMemo, useRef } from "react"
import { useTopology } from "@/hooks/useTopology"

interface CongestionHeatmapProps {
  timeRange: [number, number]
}

export const CongestionHeatmap = ({
  timeRange
}: CongestionHeatmapProps) => {
  const { data } = useTopology()
  const links = data?.links || []
  const [start, end] = timeRange

  // ----------------------------
  // EMA Baseline Store
  // ----------------------------
  const emaStore = useRef<Record<string, number>>({})

  const getEMA = (key: string, value: number, alpha = 0.25) => {
    const prev = emaStore.current[key] ?? value
    const ema = alpha * value + (1 - alpha) * prev
    emaStore.current[key] = ema
    return ema
  }

  // ----------------------------
  // Color logic (SLA driven)
  // ----------------------------
  const getColor = (capacityRatio: number, trendRatio: number) => {
    if (capacityRatio > 0.85 && trendRatio > 1.5)
      return "#FF3355" // critical
    if (capacityRatio > 0.6 || trendRatio > 1.25)
      return "#FFD24D" // warning
    return "#00FF99" // safe
  }

  // ----------------------------
  // Build per-cell series
  // ----------------------------
  const buildCellSeries = (link: any, cell: string): number[] => {
    if (data?.cell_timeseries?.[cell]) {
      return data.cell_timeseries[cell]
    }

    const linkSeries = link.traffic_timeseries || []
    const splitFactor = link.cells.length || 1

    return linkSeries.map((v: number) => v / splitFactor)
  }

  // ----------------------------
  // Shared congestion detector
  // ----------------------------
  const isCongestionColumn = (link: any, t: number) => {
    const safe = link.capacity?.safe_gbps || 1
    let stressed = 0

    link.cells.forEach((cell: string) => {
      const series = buildCellSeries(link, cell)
      const val = series[t] || 0

      const ema = getEMA(`${link.id}-${cell}`, val)
      const capRatio = val / safe
      const trendRatio = ema > 0 ? val / ema : 1

      if (capRatio > 0.6 || trendRatio > 1.25) {
        stressed++
      }
    })

    return stressed / link.cells.length >= 0.5
  }

  // ----------------------------
  // Heatmap model
  // ----------------------------
  const grid = useMemo(() => {
    return links.map((link: any) => {
      const safe = link.capacity?.safe_gbps || 1

      return {
        linkId: link.id,
        cells: link.cells,
        safe,
        rows: link.cells.map((cell: string) => {
          const series = buildCellSeries(link, cell)
          return series.slice(start, end + 1)
        })
      }
    })
  }, [links, data, start, end])

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="relative w-full overflow-x-auto">
      <div className="space-y-10 min-w-max">
        {grid.map((linkBlock: any) => {
          const { linkId, rows, cells, safe } = linkBlock
          const link = links.find((l: any) => l.id === linkId)

          return (
            <div key={linkId}>
              {/* Link Header */}
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-primary">
                  {linkId}
                </h4>
                <span className="text-xs text-muted-foreground font-mono">
                  Safe Capacity: {safe.toFixed(1)} Gbps
                </span>
              </div>

              <div className="relative">
                {/* Congestion Column Overlay */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {Array.from(
                    { length: end - start + 1 },
                    (_, i) => {
                      const t = start + i
                      const isHot = isCongestionColumn(link, t)

                      return (
                        <div
                          key={t}
                          style={{
                            width: 16,
                            backgroundColor: isHot
                              ? "rgba(255,51,85,0.12)"
                              : "transparent"
                          }}
                        />
                      )
                    }
                  )}
                </div>

                {/* Heatmap Rows */}
                <div className="space-y-1 relative z-10">
                  {rows.map((row: number[], rowIdx: number) => (
                    <div
                      key={rowIdx}
                      className="flex items-center space-x-1"
                    >
                      {/* Cell Label */}
                      <div className="w-14 text-[10px] text-muted-foreground font-mono">
                        {cells[rowIdx]}
                      </div>

                      {/* Time Cells */}
                      {row.map((val: number, colIdx: number) => {
                        const t = start + colIdx

                        const emaKey = `${linkId}-${cells[rowIdx]}`
                        const ema = getEMA(emaKey, val)

                        const capacityRatio = val / safe
                        const trendRatio =
                          ema > 0 ? val / ema : 1

                        const color = getColor(
                          capacityRatio,
                          trendRatio
                        )

                        return (
                          <div
                            key={colIdx}
                            title={`Cell ${cells[rowIdx]}
T=${t}s
Load: ${val.toFixed(2)} Gbps
Capacity: ${(capacityRatio * 100).toFixed(1)}%
Trend: ${trendRatio.toFixed(2)}x
Status: ${
  capacityRatio > 0.85 && trendRatio > 1.5
    ? "CRITICAL"
    : capacityRatio > 0.6 || trendRatio > 1.25
    ? "WARNING"
    : "OK"
}`}
                            className="w-4 h-4 rounded-sm transition-transform hover:scale-125"
                            style={{
                              backgroundColor: color,
                              boxShadow:
                                capacityRatio > 0.85 ||
                                trendRatio > 1.5
                                  ? "0 0 6px rgba(255,51,85,0.6)"
                                  : "none"
                            }}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
