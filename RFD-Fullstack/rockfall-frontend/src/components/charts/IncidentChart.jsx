import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useState, useEffect } from 'react';

// Placeholder data — replace with API data in Phase 4
const IncidentChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/incidents/stats/monthly', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch chart data');

        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Loading chart…
      </div>
    );
  if (error)
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-400">
        Error: {error}
      </div>
    );

  return (
    <ResponsiveContainer width="100%" height="100%" aspect={3}>
      <BarChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="rockfall" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="near_miss" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        <Bar dataKey="false_alarm" fill="#94a3b8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default IncidentChart;
