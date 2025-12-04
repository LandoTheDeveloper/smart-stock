import { useMemo, useState, useEffect } from 'react';
import { api } from '../lib/api';

type Activity = {
  id: string;
  item: string;
  qty: number;
  expires: string;
  status: 'ok' | 'warn' | 'danger';
};

type OverviewData = {
  lowStock: number;
  expiringSoon: number;
  pantrySize: number;
  recentActivity: Activity[];
};

export default function Dashboard() {
  const [q, setQ] = useState('');
  const [data, setData] = useState<OverviewData>({
    lowStock: 0,
    expiringSoon: 0,
    pantrySize: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<{ success: boolean; data: OverviewData }>('/api/dashboard/overview');
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (err: any) {
        console.error('Failed to fetch overview:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data.recentActivity;
    return data.recentActivity.filter((row) => row.item.toLowerCase().includes(s));
  }, [q, data.recentActivity]);

  const { lowStock, expiringSoon, pantrySize } = data;

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b726d' }}>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
        {error}
      </div>
    );
  }

  return (
    <>
      <section className='dash-grid'>
        <div className='card'>
          <div className='card-title'>Low Stock</div>
          <div className='card-kpi'>{lowStock} items</div>
          <div className='card-sub'>Needs restock soon</div>
        </div>
        <div className='card'>
          <div className='card-title'>Expiring Soon</div>
          <div className='card-kpi'>{expiringSoon}</div>
          <div className='card-sub'>Within 5 days</div>
        </div>
        <div className='card'>
          <div className='card-title'>Pantry Size</div>
          <div className='card-kpi'>{pantrySize}</div>
          <div className='card-sub'>Total tracked items</div>
        </div>
      </section>

      <section className='card table-card'>
        <div className='table-header'>
          <div className='table-title'>Recent Activity</div>
          <div className='table-actions'>
            <input
              className='input'
              placeholder='Search…'
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <div className='table'>
          <div className='row head'>
            <div>Item</div>
            <div>Qty</div>
            <div>Expires</div>
            <div>Status</div>
          </div>
          {filtered.map((r) => (
            <div className='row' key={r.id}>
              <div>{r.item}</div>
              <div>{r.qty}</div>
              <div>{r.expires}</div>
              <div>
                <span
                  className={`pill ${
                    r.status === 'ok'
                      ? 'ok'
                      : r.status === 'warn'
                      ? 'warn'
                      : 'danger'
                  }`}
                >
                  {r.status === 'ok'
                    ? 'OK'
                    : r.status === 'warn'
                    ? 'Soon'
                    : 'Urgent'}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className='row'>
              <div style={{ gridColumn: '1 / -1', color: '#6b726d' }}>
                No results.
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
