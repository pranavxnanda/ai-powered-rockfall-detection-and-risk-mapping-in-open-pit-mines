import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { ROLES } from '../../constants';
import {
  LayoutDashboard,
  Bell,
  Map,
  FileText,
  Users,
  Settings,
  Activity,
  Cpu,
  ClipboardList,
} from 'lucide-react';

const minerLinks = [
  { to: '/miner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/miner/alerts', label: 'Alerts', icon: Bell },
  { to: '/miner/report', label: 'Report Incident', icon: FileText },
  // { to: '/miner/profile', label: 'Profile', icon: Settings },
];

const plannerLinks = [
  { to: '/planner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/planner/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/planner/reports', label: 'Reports', icon: FileText },
  // { to: '/planner/profile', label: 'Profile', icon: Settings },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/sensors', label: 'Sensors', icon: Cpu },
  { to: '/admin/health', label: 'System Health', icon: Activity },
  // { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export const linksByRole = {
  [ROLES.MINER]: minerLinks,
  [ROLES.PLANNER]: plannerLinks,
  [ROLES.ADMIN]: adminLinks,
};

export const profilePath = {
  [ROLES.MINER]: '/miner/profile',
  [ROLES.PLANNER]: '/planner/profile',
  [ROLES.ADMIN]: '/admin/settings',
};

const Sidebar = () => {
  const { role } = useAuth();
  const links = linksByRole[role] || [];

  return (
    <aside className="flex min-h-screen w-56 flex-col bg-gray-800 px-3 py-6 text-white">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `mb-1 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition ${
              isActive ? 'bg-blue-600 font-semibold text-white' : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}
    </aside>
  );
};

export default Sidebar;
