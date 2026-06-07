import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { X, CheckCircle, Bell } from 'lucide-react';
import { getRiskBadgeClass, formatTimestamp } from '../../utils/riskHelpers';
import { acknowledgeAlert } from '../../redux/slices/alertSlice';
import api from '../../api/axios';

const AllAlertsPanel = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const alerts = useSelector((state) => state.alerts.alerts);

  const sorted = [...alerts].sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

  const handleAcknowledge = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/acknowledge`);
      dispatch(acknowledgeAlert(alertId));
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-blue-600" />
            <div>
              <p className="font-semibold text-gray-800">All Alerts</p>
              <p className="text-xs text-gray-500">
                {sorted.length} total · {sorted.filter((a) => !a.acknowledged).length} unread
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition hover:bg-gray-200">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
              <CheckCircle size={48} className="opacity-50" />
              <p className="font-medium">No alerts found</p>
            </div>
          ) : (
            sorted.map((alert) => (
              <div
                key={alert._id}
                className={`flex items-start justify-between gap-4 px-6 py-4 transition hover:bg-gray-50 ${
                  alert.alertLevel === 'critical'
                    ? 'border-l-4 border-l-red-600'
                    : alert.alertLevel === 'danger'
                      ? 'border-l-4 border-l-orange-500'
                      : 'border-l-4 border-l-yellow-400'
                } ${!alert.acknowledged ? 'bg-blue-50/40' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getRiskBadgeClass(alert.alertLevel)}`}
                    >
                      {alert.alertLevel?.toUpperCase()}
                    </span>
                    {alert.acknowledged && (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <CheckCircle size={11} /> Acknowledged
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-800">{alert.alertMessage}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatTimestamp(alert.generatedAt)}</p>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(alert._id)}
                    className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white transition hover:bg-blue-700"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>,
    document.body,
  );
};

export default AllAlertsPanel;
