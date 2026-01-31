import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { NetworkGraph } from '@/components/dashboard/NetworkGraph';
import { TimeSlider } from '@/components/dashboard/TimeSlider';
import { StatusLegend } from '@/components/dashboard/StatusLegend';
import { NetworkStats } from '@/components/dashboard/NetworkStats';

const TopologyOverview = () => {
  const [currentTime, setCurrentTime] = useState(0);

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-foreground">Fronthaul Topology Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Behavior-driven topology inference • Click on links to drill down
          </p>
        </div>

        {/* Stats Row */}
        <NetworkStats currentTime={currentTime} />

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Network Graph */}
          <div className="col-span-12 lg:col-span-9 noc-panel rounded-lg p-4 min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">
                Network Topology
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                24 Cells • 3 Inferred Links
              </span>
            </div>
            <NetworkGraph currentTime={currentTime} />
          </div>

          {/* Side Panel */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <StatusLegend />

            <div className="noc-panel rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Topology Inference
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Links are inferred from correlated packet loss patterns across cells. 
                Simultaneous congestion events reveal hidden shared fronthaul infrastructure.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Link 1: Cells 1-8</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Link 2: Cells 9-16</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Link 3: Cells 17-24</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Slider */}
        <TimeSlider value={currentTime} onChange={setCurrentTime} />
      </main>
    </div>
  );
};

export default TopologyOverview;
