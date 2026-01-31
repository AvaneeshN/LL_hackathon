import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { generateTrafficData, links } from '@/data/networkData';

interface TrafficChartProps {
  linkId: number;
  withBuffer: boolean;
}

export const TrafficChart = ({ linkId, withBuffer }: TrafficChartProps) => {
  const data = generateTrafficData(linkId);
  const link = links.find((l) => l.id === linkId)!;
  const requiredCapacity = withBuffer
    ? link.requiredCapacityWithBuffer
    : link.requiredCapacityWithoutBuffer;

  // Find congestion regions
  const congestionRegions: { start: number; end: number }[] = [];
  let regionStart: number | null = null;

  data.forEach((point, index) => {
    if (point.isCongested && regionStart === null) {
      regionStart = point.time;
    } else if (!point.isCongested && regionStart !== null) {
      congestionRegions.push({ start: regionStart, end: data[index - 1].time });
      regionStart = null;
    }
  });

  if (regionStart !== null) {
    congestionRegions.push({ start: regionStart, end: data[data.length - 1].time });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="noc-panel rounded-lg p-3 border border-border">
          <p className="font-mono text-xs text-muted-foreground mb-1">T={label}s</p>
          <p className="font-mono text-sm text-primary">
            Traffic: <span className="font-semibold">{payload[0].value.toFixed(2)} Gbps</span>
          </p>
          {payload[0].payload.isCongested && (
            <p className="font-mono text-xs text-status-critical mt-1">⚠ Congestion Detected</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 15%)" />

          <XAxis
            dataKey="time"
            stroke="hsl(215 20% 55%)"
            fontSize={10}
            fontFamily="JetBrains Mono"
            tickLine={false}
            axisLine={{ stroke: 'hsl(222 30% 15%)' }}
            label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: 'hsl(215 20% 55%)', fontSize: 10 }}
          />

          <YAxis
            stroke="hsl(215 20% 55%)"
            fontSize={10}
            fontFamily="JetBrains Mono"
            tickLine={false}
            axisLine={{ stroke: 'hsl(222 30% 15%)' }}
            domain={[0, 30]}
            label={{ value: 'Traffic (Gbps)', angle: -90, position: 'insideLeft', fill: 'hsl(215 20% 55%)', fontSize: 10 }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Congestion regions */}
          {congestionRegions.map((region, index) => (
            <ReferenceArea
              key={index}
              x1={region.start}
              x2={region.end}
              fill="#FF3366"
              fillOpacity={0.15}
            />
          ))}

          {/* Required capacity line */}
          <ReferenceLine
            y={requiredCapacity}
            stroke={withBuffer ? '#00FF88' : '#FFB800'}
            strokeDasharray="8 4"
            strokeWidth={2}
            label={{
              value: `Required: ${requiredCapacity.toFixed(1)} Gbps`,
              position: 'right',
              fill: withBuffer ? '#00FF88' : '#FFB800',
              fontSize: 10,
              fontFamily: 'JetBrains Mono',
            }}
          />

          {/* Link capacity line */}
          <ReferenceLine
            y={link.capacity}
            stroke="#FF3366"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: `Max Capacity: ${link.capacity} Gbps`,
              position: 'right',
              fill: '#FF3366',
              fontSize: 10,
              fontFamily: 'JetBrains Mono',
            }}
          />

          <Area
            type="monotone"
            dataKey="traffic"
            stroke="#00D4FF"
            strokeWidth={2}
            fill="url(#trafficGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
