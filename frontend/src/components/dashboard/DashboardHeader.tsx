import { Activity, Radio, Cpu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Topology', icon: Radio },
  { path: '/link/1', label: 'Link Analytics', icon: Activity },
  { path: '/heatmap', label: 'Congestion Map', icon: Cpu },
];

export const DashboardHeader = () => {
  const location = useLocation();

  return (
    <header className="h-16 border-b border-border noc-panel flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Radio className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Fronthaul Analytics</h1>
            <p className="text-xs text-muted-foreground">Network Operations Center</p>
          </div>
        </div>
      </div>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path.includes('/link') && location.pathname.startsWith('/link'));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}
              `}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
          <span className="text-muted-foreground">System Online</span>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </header>
  );
};
