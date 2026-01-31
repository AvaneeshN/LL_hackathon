export const HeatmapLegend = () => {
  const gradientStops = [
    { color: '#00FF88', label: '0%' },
    { color: '#FFD93D', label: '3%' },
    { color: '#FFB800', label: '5%' },
    { color: '#FF6B6B', label: '10%' },
    { color: '#FF3366', label: '>15%' },
  ];

  return (
    <div className="noc-panel rounded-lg p-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Packet Loss Intensity
      </h3>
      <div className="flex items-center gap-1">
        <div
          className="h-4 flex-1 rounded"
          style={{
            background: `linear-gradient(to right, ${gradientStops.map((s) => s.color).join(', ')})`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {gradientStops.map((stop) => (
          <span key={stop.label} className="text-xs text-muted-foreground font-mono">
            {stop.label}
          </span>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Cells experiencing simultaneous packet loss indicate shared fronthaul links.
          Horizontal patterns reveal congestion correlation.
        </p>
      </div>
    </div>
  );
};
