import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts"

interface Props {
  series: number[]
  safeCapacity: number
}

export const LinkTrafficGraph = ({ series, safeCapacity }: Props) => {
  const data = series.map((v, i) => ({
    time: i,
    load: v
  }))

  return (
    <div className="noc-panel rounded-lg p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">
        Link Traffic Over Time
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              label={{ value: "Time (s)", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              label={{ value: "Gbps", angle: -90, position: "insideLeft" }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid #1e293b",
                fontSize: "12px"
              }}
            />

            {/* Traffic Line */}
            <Line
              type="monotone"
              dataKey="load"
              stroke="#00D4FF"
              strokeWidth={2}
              dot={false}
            />

            {/* Safe Capacity Line */}
            <ReferenceLine
              y={safeCapacity}
              stroke="#FF3366"
              strokeDasharray="4 4"
              label={{
                value: "Safe Capacity",
                fill: "#FF3366",
                fontSize: 10,
                position: "right"
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

