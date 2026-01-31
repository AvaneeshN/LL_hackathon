import { useMemo, useState } from 'react';
import { cells, generateHeatmapData } from '@/data/networkData';

interface CongestionHeatmapProps {
  timeRange: [number, number];
}

export const CongestionHeatmap = ({ timeRange }: CongestionHeatmapProps) => {
  const [hoveredCell, setHoveredCell] = useState<{ cellId: number; time: number } | null>(null);
  
  const heatmapData = useMemo(() => generateHeatmapData(), []);

  const filteredData = useMemo(() => {
    return heatmapData.filter(
      (d) => d.time >= timeRange[0] && d.time <= timeRange[1]
    );
  }, [heatmapData, timeRange]);

  const timeSlots = useMemo(() => {
    const slots = new Set(filteredData.map((d) => d.time));
    return Array.from(slots).sort((a, b) => a - b);
  }, [filteredData]);

  const getColor = (packetLoss: number) => {
    if (packetLoss > 10) return '#FF3366';
    if (packetLoss > 5) return '#FF6B6B';
    if (packetLoss > 3) return '#FFB800';
    if (packetLoss > 1) return '#FFD93D';
    return '#00FF88';
  };

  const getOpacity = (packetLoss: number) => {
    return Math.min(1, 0.3 + (packetLoss / 20) * 0.7);
  };

  const cellWidth = Math.max(8, Math.min(16, 800 / timeSlots.length));
  const cellHeight = 20;

  // Group cells by link
  const groupedCells = useMemo(() => {
    return cells.reduce((acc, cell) => {
      const linkId = cell.linkId;
      if (!acc[linkId]) acc[linkId] = [];
      acc[linkId].push(cell);
      return acc;
    }, {} as Record<number, typeof cells>);
  }, []);

  return (
    <div className="relative overflow-x-auto">
      <div className="flex gap-8">
        {/* Y-axis labels */}
        <div className="flex flex-col shrink-0">
          {Object.entries(groupedCells).map(([linkId, linkCells]) => (
            <div key={linkId}>
              <div className="h-6 flex items-center">
                <span className="text-xs font-semibold text-primary font-mono">
                  Link {linkId}
                </span>
              </div>
              {linkCells.map((cell) => (
                <div
                  key={cell.id}
                  className="flex items-center justify-end pr-2"
                  style={{ height: cellHeight }}
                >
                  <span className="text-xs text-muted-foreground font-mono">
                    C{cell.id.toString().padStart(2, '0')}
                  </span>
                </div>
              ))}
              <div className="h-2" />
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex-1 overflow-x-auto">
          <svg
            width={timeSlots.length * cellWidth + 60}
            height={cells.length * cellHeight + Object.keys(groupedCells).length * 30 + 40}
          >
            {/* Time axis */}
            {timeSlots.filter((_, i) => i % 5 === 0).map((time) => (
              <text
                key={`time-${time}`}
                x={time * cellWidth + cellWidth / 2}
                y={12}
                textAnchor="middle"
                fill="hsl(215 20% 55%)"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                {time}s
              </text>
            ))}

            {/* Cells by link group */}
            {Object.entries(groupedCells).map(([linkId, linkCells], groupIndex) => {
              const yOffset = groupIndex * (8 * cellHeight + 30) + 24;

              return (
                <g key={linkId}>
                  {linkCells.map((cell, cellIndex) => (
                    <g key={cell.id}>
                      {timeSlots.map((time) => {
                        const dataPoint = filteredData.find(
                          (d) => d.cellId === cell.id && d.time === time
                        );
                        const packetLoss = dataPoint?.packetLoss || 0;
                        const isHovered =
                          hoveredCell?.cellId === cell.id && hoveredCell?.time === time;

                        return (
                          <rect
                            key={`${cell.id}-${time}`}
                            x={time * cellWidth}
                            y={yOffset + cellIndex * cellHeight}
                            width={cellWidth - 1}
                            height={cellHeight - 2}
                            fill={getColor(packetLoss)}
                            opacity={getOpacity(packetLoss)}
                            rx={2}
                            className="cursor-pointer transition-opacity duration-100"
                            style={{
                              stroke: isHovered ? '#00D4FF' : 'none',
                              strokeWidth: isHovered ? 2 : 0,
                            }}
                            onMouseEnter={() => setHoveredCell({ cellId: cell.id, time })}
                            onMouseLeave={() => setHoveredCell(null)}
                          />
                        );
                      })}
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 noc-panel rounded-lg p-3 border border-border pointer-events-none"
          style={{
            left: 'calc(50% + 100px)',
            top: '40%',
          }}
        >
          <p className="font-mono text-xs text-muted-foreground mb-1">
            Cell {hoveredCell.cellId} @ T={hoveredCell.time}s
          </p>
          <p className="font-mono text-sm text-primary">
            Packet Loss:{' '}
            <span className="font-semibold">
              {filteredData
                .find((d) => d.cellId === hoveredCell.cellId && d.time === hoveredCell.time)
                ?.packetLoss.toFixed(2)}
              %
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
