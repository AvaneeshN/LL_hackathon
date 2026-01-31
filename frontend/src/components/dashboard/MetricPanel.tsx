import { links, generateTrafficData } from '@/data/networkData';

interface MetricPanelProps {
  linkId: number;
  withBuffer: boolean;
}

export const MetricPanel = ({ linkId, withBuffer }: MetricPanelProps) => {
  const link = links.find((l) => l.id === linkId)!;
  const trafficData = generateTrafficData(linkId);

  const requiredCapacity = withBuffer
    ? link.requiredCapacityWithBuffer
    : link.requiredCapacityWithoutBuffer;

  const avgDataRate =
    trafficData.reduce((sum, d) => sum + d.traffic, 0) / trafficData.length;

  const avgPacketLoss =
    trafficData.reduce((sum, d) => sum + d.packetLoss, 0) / trafficData.length;

  const metrics = [
    {
      label: 'Required Capacity',
      value: requiredCapacity.toFixed(1),
      unit: 'Gbps',
      highlight: true,
    },
    {
      label: 'Average Data Rate',
      value: avgDataRate.toFixed(2),
      unit: 'Gbps',
      highlight: false,
    },
    {
      label: 'Packet Loss',
      value: avgPacketLoss.toFixed(2),
      unit: '%',
      highlight: avgPacketLoss > 1,
      warning: avgPacketLoss > 1,
    },
  ];

  return (
    <div className="noc-panel rounded-lg p-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Link Metrics
      </h3>
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{metric.label}</span>
            <div className="flex items-baseline gap-1">
              <span
                className={`font-mono text-lg font-semibold ${
                  metric.warning
                    ? 'text-status-critical'
                    : metric.highlight
                    ? 'text-primary'
                    : 'text-foreground'
                }`}
              >
                {metric.value}
              </span>
              <span className="text-xs text-muted-foreground">{metric.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {avgPacketLoss > 1 && (
        <div className="mt-4 p-3 rounded-md bg-status-critical/10 border border-status-critical/30">
          <p className="text-xs text-status-critical font-medium">
            ⚠ Packet loss exceeds 1% threshold
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Buffer mode:{' '}
          <span className={withBuffer ? 'text-status-healthy' : 'text-status-warning'}>
            {withBuffer ? '4-symbol switch buffer' : 'No buffer'}
          </span>
        </p>
      </div>
    </div>
  );
};
