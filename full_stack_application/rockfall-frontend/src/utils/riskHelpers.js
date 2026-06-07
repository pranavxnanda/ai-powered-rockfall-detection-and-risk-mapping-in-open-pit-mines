import { RISK_COLORS } from '../constants';

export const getRiskColor = (level) => RISK_COLORS[level] || '#94a3b8';

export const getRiskLabel = (level) =>
  ({
    low: 'Low Risk',
    moderate: 'Moderate Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
  })[level] || 'Unknown';

export const getRiskBadgeClass = (level) =>
  ({
    low: 'badge-low',
    moderate: 'badge-moderate',
    high: 'badge-high',
    critical: 'badge-critical',
    danger: 'badge-danger',
    warning: 'badge-warning',
  })[level] || 'badge-low';

export const formatTimestamp = (iso) =>
  new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
