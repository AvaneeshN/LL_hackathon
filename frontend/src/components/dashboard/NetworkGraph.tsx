import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cells, links, timeSeriesData } from '@/data/networkData';

interface NetworkGraphProps {
  currentTime: number;
}

export const NetworkGraph = ({ currentTime }: NetworkGraphProps) => {
  const navigate = useNavigate();
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);

  const currentSlot = timeSeriesData[currentTime] || timeSeriesData[0];

  const getCongestionColor = (level: 'healthy' | 'warning' | 'critical') => {
    switch (level) {
      case 'healthy': return '#00FF88';
      case 'warning': return '#FFB800';
      case 'critical': return '#FF3366';
      default: return '#00FF88';
    }
  };

  const getLinkPath = (linkId: number) => {
    const linkCenters: Record<number, { x: number; y: number }> = {
      1: { x: 200, y: 300 },
      2: { x: 500, y: 200 },
      3: { x: 400, y: 450 },
    };

    // Create paths connecting to central hub
    const hubX = 350;
    const hubY = 320;
    const center = linkCenters[linkId];
    
    return `M ${center.x} ${center.y} Q ${(center.x + hubX) / 2} ${(center.y + hubY) / 2 - 30} ${hubX} ${hubY}`;
  };

  const getLinkThickness = (linkId: number) => {
    const traffic = currentSlot.links[linkId]?.aggregatedTraffic || 10;
    return Math.max(3, Math.min(12, traffic / 5));
  };

  const handleLinkClick = useCallback((linkId: number) => {
    navigate(`/link/${linkId}`);
  }, [navigate]);

  return (
    <div className="relative w-full h-full">
      <svg className="w-full h-full" viewBox="0 0 700 600">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(222 30% 12%)" strokeWidth="0.5" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glowStrong">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Central Hub */}
        <circle cx="350" cy="320" r="20" fill="hsl(222 30% 12%)" stroke="#00D4FF" strokeWidth="2" filter="url(#glow)" />
        <text x="350" y="325" textAnchor="middle" fill="#00D4FF" fontSize="10" fontFamily="JetBrains Mono">HUB</text>

        {/* Links */}
        {links.map((link) => {
          const status = currentSlot.links[link.id];
          const color = getCongestionColor(status?.congestionLevel || 'healthy');
          const thickness = getLinkThickness(link.id);
          const isHovered = hoveredLink === link.id;

          return (
            <g key={link.id}>
              {/* Link path */}
              <path
                d={getLinkPath(link.id)}
                stroke={color}
                strokeWidth={thickness}
                fill="none"
                opacity={isHovered ? 1 : 0.6}
                filter={isHovered ? "url(#glowStrong)" : "url(#glow)"}
                className="cursor-pointer transition-all duration-300"
                strokeDasharray={status?.congestionLevel === 'critical' ? "10,5" : "none"}
                onMouseEnter={() => setHoveredLink(link.id)}
                onMouseLeave={() => setHoveredLink(null)}
                onClick={() => handleLinkClick(link.id)}
              />
              
              {/* Data flow animation for active links */}
              {status?.congestionLevel !== 'healthy' && (
                <path
                  d={getLinkPath(link.id)}
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.3"
                  strokeDasharray="5,15"
                  className="data-flow-animation"
                />
              )}
            </g>
          );
        })}

        {/* Link Labels */}
        {links.map((link) => {
          const linkCenters: Record<number, { x: number; y: number }> = {
            1: { x: 200, y: 300 },
            2: { x: 500, y: 200 },
            3: { x: 400, y: 450 },
          };
          const center = linkCenters[link.id];
          const status = currentSlot.links[link.id];
          const color = getCongestionColor(status?.congestionLevel || 'healthy');

          return (
            <g
              key={`label-${link.id}`}
              className="cursor-pointer"
              onClick={() => handleLinkClick(link.id)}
            >
              <rect
                x={center.x - 35}
                y={center.y - 35}
                width="70"
                height="24"
                rx="4"
                fill="hsl(222 47% 8%)"
                stroke={color}
                strokeWidth="1"
                opacity="0.9"
              />
              <text
                x={center.x}
                y={center.y - 18}
                textAnchor="middle"
                fill={color}
                fontSize="11"
                fontFamily="JetBrains Mono"
                fontWeight="600"
              >
                {link.name}
              </text>
            </g>
          );
        })}

        {/* Cells */}
        {cells.map((cell) => {
          const status = currentSlot.cells[cell.id];
          const color = getCongestionColor(status?.congestionLevel || 'healthy');
          const isHovered = hoveredCell === cell.id;

          return (
            <g
              key={cell.id}
              onMouseEnter={() => setHoveredCell(cell.id)}
              onMouseLeave={() => setHoveredCell(null)}
              className="cursor-pointer"
            >
              {/* Cell circle */}
              <circle
                cx={cell.x}
                cy={cell.y}
                r={isHovered ? 14 : 10}
                fill={color}
                opacity={isHovered ? 1 : 0.8}
                filter={isHovered ? "url(#glowStrong)" : "url(#glow)"}
                className="transition-all duration-200"
              />
              
              {/* Cell ID */}
              <text
                x={cell.x}
                y={cell.y + 4}
                textAnchor="middle"
                fill="hsl(222 47% 6%)"
                fontSize="8"
                fontFamily="JetBrains Mono"
                fontWeight="600"
              >
                {cell.id}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {hoveredCell !== null && (
          <g>
            <rect
              x={cells[hoveredCell - 1].x + 15}
              y={cells[hoveredCell - 1].y - 40}
              width="140"
              height="70"
              rx="6"
              fill="hsl(222 47% 8%)"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              filter="url(#glow)"
            />
            <text
              x={cells[hoveredCell - 1].x + 25}
              y={cells[hoveredCell - 1].y - 20}
              fill="#00D4FF"
              fontSize="11"
              fontFamily="JetBrains Mono"
              fontWeight="600"
            >
              Cell {hoveredCell}
            </text>
            <text
              x={cells[hoveredCell - 1].x + 25}
              y={cells[hoveredCell - 1].y - 4}
              fill="hsl(var(--muted-foreground))"
              fontSize="10"
              fontFamily="JetBrains Mono"
            >
              Link: {cells[hoveredCell - 1].linkId}
            </text>
            <text
              x={cells[hoveredCell - 1].x + 25}
              y={cells[hoveredCell - 1].y + 12}
              fill={getCongestionColor(currentSlot.cells[hoveredCell]?.congestionLevel || 'healthy')}
              fontSize="10"
              fontFamily="JetBrains Mono"
            >
              Loss: {currentSlot.cells[hoveredCell]?.packetLoss.toFixed(1)}%
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
