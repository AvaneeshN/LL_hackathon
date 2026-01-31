import { useMemo } from "react"
import { useTopology } from "@/hooks/useTopology"

interface TowerMapProps {
  time: number
}

export const TowerMap = ({ time }: TowerMapProps) => {
  const { data } = useTopology()
  const links = data?.links || []

  // ----------------------------
  // Layout system (auto grid)
  // ----------------------------
  const layout = useMemo(() => {
    const cols = 3
    const spacingX = 420
    const spacingY = 300
    const offsetX = 250
    const offsetY = 180

    return links.map((_: any, i: number) => ({
      x: offsetX + (i % cols) * spacingX,
      y: offsetY + Math.floor(i / cols) * spacingY
    }))
  }, [links])

  // ----------------------------
  // Global peak (visual scaling)
  // ----------------------------
  const globalPeak = useMemo(() => {
    let max = 1
    links.forEach((link: any) => {
      const series = link.traffic_timeseries || []
      series.forEach((v: number) => {
        if (v > max) max = v
      })
    })
    return max
  }, [links])

  // ----------------------------
  // Rolling average (baseline)
  // ----------------------------
  const getRollingAverage = (
    series: number[],
    time: number,
    window = 20
  ) => {
    const start = Math.max(0, time - window)
    const slice = series.slice(start, time + 1)
    if (!slice.length) return 0
    return slice.reduce((a, b) => a + b, 0) / slice.length
  }

  // ----------------------------
  // NOC-style congestion scoring
  // ----------------------------
  const getStatus = (link: any, load: number) => {
  const series = link.traffic_timeseries || []
  const safe = link.capacity?.safe_gbps || globalPeak || 1

  const baseline = getRollingAverage(series, time, 20) || 1

  const capacityRatio = load / safe
  const trendRatio = load / baseline

  // HARD RULE:
  // Never go red unless you're meaningfully loading the link
  if (capacityRatio > 0.75 && trendRatio > 1.8) return "critical"

  // Yellow if either trend OR capacity looks suspicious
  if (capacityRatio > 0.55 || trendRatio > 1.5) return "warning"

  return "safe"
}


  // ----------------------------
  // Visual theme
  // ----------------------------
  const getColor = (status: string) => {
    if (status === "critical") return "#FF3355"
    if (status === "warning") return "#FFD24D"
    return "#00FF99"
  }

  const getGlow = (status: string) => {
    if (status === "critical")
      return "drop-shadow(0 0 26px rgba(255,51,85,0.9))"
    if (status === "warning")
      return "drop-shadow(0 0 18px rgba(255,210,77,0.8))"
    return "drop-shadow(0 0 12px rgba(0,255,153,0.6))"
  }

  return (
    <div className="relative w-full h-[650px] overflow-hidden rounded-lg border border-border">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1300 900"
        className="bg-[radial-gradient(circle_at_center,rgba(0,255,200,0.05),transparent_65%)]"
      >
        {/* Grid */}
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          </pattern>

          {/* Pulse animation */}
          <style>
            {`
              .pulse {
                animation: pulse 1.4s infinite;
              }
              @keyframes pulse {
                0% { opacity: 0.3; }
                50% { opacity: 1; }
                100% { opacity: 0.3; }
              }
            `}
          </style>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Towers */}
        {links.map((link: any, i: number) => {
          const pos = layout[i]

          const series = link.traffic_timeseries || []
          const load = series[time] || 0

          const safe = link.capacity?.safe_gbps || globalPeak || 1

          const status = getStatus(link, load)
          const color = getColor(status)
          const glow = getGlow(status)

          // Tower size scales globally
          const sizeRatio = Math.min(1, load / globalPeak)
          const radius = 36 + sizeRatio * 32

          return (
            <g key={link.id}>
              {/* Cell Arms */}
              {link.cells.map((cell: string, idx: number) => {
                const angle = (idx / link.cells.length) * Math.PI * 2
                const armLength = 95

                const cx = pos.x + Math.cos(angle) * armLength
                const cy = pos.y + Math.sin(angle) * armLength

                return (
                  <g key={cell}>
                    <line
                      x1={pos.x}
                      y1={pos.y}
                      x2={cx}
                      y2={cy}
                      stroke={color}
                      strokeWidth="2"
                      opacity="0.6"
                    />

                    <circle
                      cx={cx}
                      cy={cy}
                      r="11"
                      fill={color}
                      opacity="0.9"
                    />

                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#001011"
                      fontWeight="bold"
                    >
                      {cell}
                    </text>
                  </g>
                )
              })}

              {/* Outer Ring */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius + 14}
                fill="none"
                stroke={color}
                strokeWidth="3"
                opacity="0.35"
                className={status === "critical" ? "pulse" : ""}
              />

              {/* Tower Hub */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={color}
                style={{
                  filter: glow,
                  transition: "all 0.4s ease"
                }}
              />

              {/* Labels */}
              <text
                x={pos.x}
                y={pos.y - radius - 20}
                textAnchor="middle"
                fontSize="14"
                fill={color}
                fontWeight="bold"
              >
                {link.id}
              </text>

              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fontSize="11"
                fill="#001011"
                fontWeight="bold"
              >
                {load.toFixed(1)} Gbps
              </text>

              <text
                x={pos.x}
                y={pos.y + 22}
                textAnchor="middle"
                fontSize="9"
                fill={color}
              >
                baseline-aware monitoring
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
