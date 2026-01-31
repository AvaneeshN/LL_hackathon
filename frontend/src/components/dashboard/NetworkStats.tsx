import { timeSeriesData, links } from '@/data/networkData';
import { Activity, AlertTriangle, Zap, TrendingUp } from 'lucide-react';

interface NetworkStatsProps {
  currentTime: number;
}

export const NetworkStats = ({ currentTime }: NetworkStatsProps) => {
  const currentSlot = timeSeriesData[currentTime] || timeSeriesData[0];

  const totalTraffic = Object.values(currentSlot.links).reduce(
    (sum, link) => sum + link.aggregatedTraffic,
    0
  );

  const avgPacketLoss =
    Object.values(currentSlot.links).reduce((sum, link) => sum + link.packetLoss, 0) /
    Object.keys(currentSlot.links).length;

  const congestedLinks = Object.values(currentSlot.links).filter(
    (link) => link.congestionLevel === 'critical'
  ).length;

  const stats = [
    {
      label: 'Total Traffic',
      value: totalTraffic.toFixed(1),
      unit: 'Gbps',
      icon: Activity,
      color: 'text-primary',
    },
    {
      label: 'Avg Packet Loss',
      value: avgPacketLoss.toFixed(2),
      unit: '%',
      icon: TrendingUp,
      color: avgPacketLoss > 5 ? 'text-status-critical' : 'text-status-healthy',
    },
    {
      label: 'Congested Links',
      value: congestedLinks,
      unit: `/ ${links.length}`,
      icon: AlertTriangle,
      color: congestedLinks > 0 ? 'text-status-warning' : 'text-status-healthy',
    },
    {
      label: 'Active Cells',
      value: '24',
      unit: 'cells',
      icon: Zap,
      color: 'text-primary',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="noc-panel rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-mono font-semibold ${stat.color}`}>
              {stat.value}
            </span>
            <span className="text-sm text-muted-foreground">{stat.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
