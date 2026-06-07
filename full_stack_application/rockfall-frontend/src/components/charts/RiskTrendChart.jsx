import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const RiskTrendChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/incidents/stats/daily-risk', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        console.log(res.status, res.url);

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
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" aspect={3}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="low" stroke="#22c55e" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="moderate" stroke="#f59e0b" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="high" stroke="#ef4444" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="critical" stroke="#7f1d1d" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskTrendChart;
