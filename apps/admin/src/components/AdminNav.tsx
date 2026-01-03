import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Layers,
  BookOpen,
  Database,
  AlertTriangle,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/stats', icon: TrendingUp, label: 'System Stats' },
  { path: '/users', icon: Users, label: 'Users' },
  { path: '/ai-costs', icon: DollarSign, label: 'AI Costs' },
  { path: '/enrichment', icon: Zap, label: 'Enrichment' },
  { path: '/memory-types', icon: Layers, label: 'Memory Types' },
  { path: '/words', icon: BookOpen, label: 'Words' },
  { path: '/extraction-data', icon: Database, label: 'Extraction Data' },
  { path: '/failures', icon: AlertTriangle, label: 'Failed Jobs' },
];

export function AdminNav() {
  return (
    <nav className="flex-1 overflow-y-auto py-4">
      <div className="space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
