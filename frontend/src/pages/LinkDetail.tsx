import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TrafficChart } from '@/components/dashboard/TrafficChart';
import { MetricPanel } from '@/components/dashboard/MetricPanel';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { links } from '@/data/networkData';

const LinkDetail = () => {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const [withBuffer, setWithBuffer] = useState(false);

  const currentLinkId = parseInt(linkId || '1', 10);
  const link = links.find((l) => l.id === currentLinkId);

  if (!link) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Link not found</p>
      </div>
    );
  }

  const handlePrevLink = () => {
    const prevId = currentLinkId > 1 ? currentLinkId - 1 : links.length;
    navigate(`/link/${prevId}`);
  };

  const handleNextLink = () => {
    const nextId = currentLinkId < links.length ? currentLinkId + 1 : 1;
    navigate(`/link/${nextId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold text-foreground">{link.name} Analytics</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1 ml-12">
              Capacity planning and congestion analysis
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevLink}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextLink}
              className="gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Buffer Toggle */}
        <div className="noc-panel rounded-lg p-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Buffer Configuration</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Toggle to compare required capacity with and without switch buffer
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`text-sm ${!withBuffer ? 'text-status-warning font-medium' : 'text-muted-foreground'}`}
            >
              Without Buffer
            </span>
            <Switch checked={withBuffer} onCheckedChange={setWithBuffer} />
            <span
              className={`text-sm ${withBuffer ? 'text-status-healthy font-medium' : 'text-muted-foreground'}`}
            >
              With Buffer (4-symbol)
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Traffic Chart */}
          <div className="col-span-12 lg:col-span-9 noc-panel rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">
                Aggregated Traffic Over Time
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                Cells: {link.cells.join(', ')}
              </span>
            </div>
            <TrafficChart linkId={currentLinkId} withBuffer={withBuffer} />
            <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-8 h-0.5 bg-primary" />
                <span>Traffic (Gbps)</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-8 h-0.5 ${withBuffer ? 'bg-status-healthy' : 'bg-status-warning'}`}
                  style={{ borderTop: '2px dashed' }}
                />
                <span>Required Capacity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-status-critical/20 rounded" />
                <span>Congestion Region</span>
              </div>
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="col-span-12 lg:col-span-3">
            <MetricPanel linkId={currentLinkId} withBuffer={withBuffer} />

            <div className="mt-4 noc-panel rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Capacity Planning
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The dashed line shows the minimum fronthaul capacity required to maintain packet loss below 1%.
                A 4-symbol switch buffer reduces peak requirements by smoothing burst traffic.
              </p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Headroom (no buffer)</span>
                  <span className="font-mono text-status-warning">
                    {(link.capacity - link.requiredCapacityWithoutBuffer).toFixed(1)} Gbps
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Headroom (with buffer)</span>
                  <span className="font-mono text-status-healthy">
                    {(link.capacity - link.requiredCapacityWithBuffer).toFixed(1)} Gbps
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LinkDetail;
