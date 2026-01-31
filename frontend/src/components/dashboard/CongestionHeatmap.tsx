import { useMemo, useState } from "react"
import { useTopology } from "@/hooks/useTopology"

interface CongestionHeatmapProps {
  timeRange: [number, number]
}

interface LinkLayout {
  linkId: string
  rows: {
    cellId: string
    series: number[]
  }[]
  yOffset: number
}

export const CongestionHeatmap = ({ timeRange }: CongestionHeatmapProps) => {
  const { data, isLoading, error } = useTopology()
  const [hoveredCell, setHoveredCell] = useState<{
    cellId: string
    time: number
  } | null>(null)

  const cellHeight = 20
  const linkGap = 36
  const topPadding = 24

  // ----------------------------
  // Build layouts (single source of truth)
  // ----------------------------
  const linkLayouts = useMemo<LinkLayout[]>(() => {
    if (!data?.links) return []

    let offset = topPadding
    const layouts: LinkLayout[] = []

    data.links.forEach((link: any) => {
      const series = link.traffic_timeseries || []

      const rows = link.cells.map((cellId: string) => ({
        cellId,
        series
      }))

      layouts.push({
        linkId: link.id,
        rows,
        yOffset: offset
      })

      offset += rows.length * cellHeight + linkGap
    })

    return layouts
  }, [data])

  // ----------------------------
  // Time axis
  // ----------------------------
  const timeSlots = useMemo(() => {
    if (!linkLayouts.length) return []

    const series = linkLayouts[0].rows[0]?.series || []
    return series
      .map((_: any, i: number) => i)
      .filter((t: number) => t >= timeRange[0] && t <= timeRange[1])
  }, [linkLayouts, timeRange])

  const cellWidth = Math.max(8, Math.min(16, 800 / timeSlots.length))

  // ----------------------------
  // Total height
  // ----------------------------
  const totalHeight = useMemo(() => {
    if (!linkLayouts.length) return 200

    const last = linkLayouts[linkLayouts.length - 1]
    return (
      last.yOffset +
      last.rows.length * cellHeight +
      linkGap
    )
  }, [linkLayouts])

  // ----------------------------
  // Visual helpers
  // ----------------------------
  const getColor = (value: number) => {
    if (value > 30) return "#FF3366"
    if (value > 20) return "#FF6B6B"
    if (value > 10) return "#FFB800"
    if (value > 5) return "#FFD93D"
    return "#00FF88"
  }

  const getOpacity = (value: number) => {
    return Math.min(1, 0.3 + (value / 40) * 0.7)
  }

  // ----------------------------
  // Loading / Error
  // ----------------------------
  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        Loading heatmap...
      </div>
    )
  }

  if (error || !linkLayouts.length) {
    return (
      <div className="h-96 flex items-center justify-center text-red-500">
        No congestion data available
      </div>
    )
  }

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="relative overflow-x-auto">
      <div className="flex gap-8">
        {/* Y-axis labels */}
        <div className="flex flex-col shrink-0">
          {linkLayouts.map((layout) => (
            <div key={layout.linkId}>
              <div className="h-6 flex items-center">
                <span className="text-xs font-semibold text-primary font-mono">
                  {layout.linkId}
                </span>
              </div>

              {layout.rows.map((row) => (
                <div
                  key={row.cellId}
                  className="flex items-center justify-end pr-2"
                  style={{ height: cellHeight }}
                >
                  <span className="text-xs text-muted-foreground font-mono">
                    C{row.cellId.toString().padStart(2, "0")}
                  </span>
                </div>
              ))}

              <div style={{ height: linkGap }} />
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex-1 overflow-x-auto">
          <svg
            width={timeSlots.length * cellWidth + 80}
            height={totalHeight}
          >
            {/* Time axis */}
            {timeSlots.filter((_, i) => i % 5 === 0).map((time) => (
              <text
                key={`time-${time}`}
                x={time * cellWidth + cellWidth / 2}
                y={12}
                textAnchor="middle"
                fill="hsl(215 20% 55%)"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                {time}s
              </text>
            ))}

            {/* Heatmap */}
            {linkLayouts.map((layout) => (
              <g key={layout.linkId}>
                {/* Separator */}
                <line
                  x1={0}
                  x2={timeSlots.length * cellWidth}
                  y1={layout.yOffset - 10}
                  y2={layout.yOffset - 10}
                  stroke="hsl(215 20% 20%)"
                  strokeDasharray="4 4"
                />

                {layout.rows.map((row, rowIndex) => (
                  <g key={row.cellId}>
                    {timeSlots.map((time) => {
                      const value = row.series[time] || 0
                      const isHovered =
                        hoveredCell?.cellId === row.cellId &&
                        hoveredCell?.time === time

                      return (
                        <rect
                          key={`${row.cellId}-${time}`}
                          x={time * cellWidth}
                          y={layout.yOffset + rowIndex * cellHeight}
                          width={cellWidth - 1}
                          height={cellHeight - 2}
                          fill={getColor(value)}
                          opacity={getOpacity(value)}
                          rx={2}
                          className="cursor-pointer transition-all duration-100"
                          style={{
                            stroke: isHovered ? "#00D4FF" : "none",
                            strokeWidth: isHovered ? 2 : 0
                          }}
                          onMouseEnter={() =>
                            setHoveredCell({
                              cellId: row.cellId,
                              time
                            })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                        />
                      )
                    })}
                  </g>
                ))}
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 noc-panel rounded-lg p-3 border border-border pointer-events-none"
          style={{
            left: "calc(50% + 100px)",
            top: "40%"
          }}
        >
          <p className="font-mono text-xs text-muted-foreground mb-1">
            Cell {hoveredCell.cellId} @ T={hoveredCell.time}s
          </p>
          <p className="font-mono text-sm text-primary">
            Load:{" "}
            <span className="font-semibold">
              {(
                linkLayouts
                  .flatMap((l) => l.rows)
                  .find((r) => r.cellId === hoveredCell.cellId)
                  ?.series[hoveredCell.time] || 0
              ).toFixed(2)}{" "}
              Gbps
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
