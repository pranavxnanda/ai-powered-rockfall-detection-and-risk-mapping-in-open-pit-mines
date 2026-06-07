import { ROLES } from '../constants';

export const getDefaultRoute = (role) => {
  const routes = {
    [ROLES.MINER]: '/miner/dashboard',
    [ROLES.PLANNER]: '/planner/dashboard',
    [ROLES.ADMIN]: '/admin/dashboard',
  };
  return routes[role] || '/login';
};