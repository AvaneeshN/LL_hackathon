export const StatusLegend = () => {
  return (
    <div className="noc-panel rounded-lg p-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Congestion Status
      </h3>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-status-healthy" />
          <span className="text-sm text-foreground">Healthy</span>
          <span className="text-xs text-muted-foreground ml-auto">&lt; 3% loss</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-status-warning" />
          <span className="text-sm text-foreground">Warning</span>
          <span className="text-xs text-muted-foreground ml-auto">3-10% loss</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-status-critical" />
          <span className="text-sm text-foreground">Critical</span>
          <span className="text-xs text-muted-foreground ml-auto">&gt; 10% loss</span>
        </div>
      </div>
    </div>
  );
};
