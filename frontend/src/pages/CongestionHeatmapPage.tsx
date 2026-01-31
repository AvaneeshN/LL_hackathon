import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CongestionHeatmap } from '@/components/dashboard/CongestionHeatmap';
import { HeatmapLegend } from '@/components/dashboard/HeatmapLegend';
import { Slider } from '@/components/ui/slider';

const CongestionHeatmapPage = () => {
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 60]);

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-foreground">Congestion Heatmap</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize packet loss patterns across cells and time to identify shared fronthaul links
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="noc-panel rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Time Range</h3>
            <span className="text-xs text-muted-foreground font-mono">
              {timeRange[0]}s – {timeRange[1]}s
            </span>
          </div>
          <Slider
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as [number, number])}
            min={0}
            max={60}
            step={1}
            className="cursor-pointer"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
            <span>0s</span>
            <span>15s</span>
            <span>30s</span>
            <span>45s</span>
            <span>60s</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Heatmap */}
          <div className="col-span-12 lg:col-span-9 noc-panel rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">
                Cell Congestion Matrix
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                Cells grouped by inferred link
              </span>
            </div>
            <CongestionHeatmap timeRange={timeRange} />
          </div>

          {/* Legend and Info */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <HeatmapLegend />

            <div className="noc-panel rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Reading the Heatmap
              </h3>
              <div className="space-y-3 text-xs text-muted-foreground">
                <p>
                  <span className="text-foreground font-medium">Rows:</span> Individual cells (C01-C24)
                </p>
                <p>
                  <span className="text-foreground font-medium">Columns:</span> Time slots (seconds)
                </p>
                <p>
                  <span className="text-foreground font-medium">Color:</span> Packet loss severity
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-xs font-medium text-foreground mb-2">Key Insight</h4>
                <p className="text-xs text-muted-foreground">
                  Cells experiencing packet loss at the same time are likely sharing 
                  a common fronthaul link. Look for vertical bands of similar color 
                  within link groups.
                </p>
              </div>
            </div>

            <div className="noc-panel rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Congestion Events
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Link 1 congestion</span>
                  <span className="font-mono text-status-critical">T=10-25s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Link 2 congestion</span>
                  <span className="font-mono text-status-critical">T=30-45s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Link 3 congestion</span>
                  <span className="font-mono text-status-critical">T=15-35s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CongestionHeatmapPage;
