import { useMemo, useState, useEffect } from 'react';
import { api } from '../lib/api';

type Activity = {
  id: string;
  item: string;
  qty: number;
  unit: string;
  expires: string;
  status: 'ok' | 'warn' | 'danger';
};

type LowStockItem = {
  id: string;
  item: string;
  qty: number;
  unit: string;
};

type OverviewData = {
  lowStock: number;
  lowStockItems: LowStockItem[];
  expiringSoon: number;
  pantrySize: number;
  recentActivity: Activity[];
  locationCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
};

export default function Dashboard() {
  const [q, setQ] = useState('');
  const [data, setData] = useState<OverviewData>({
    lowStock: 0,
    lowStockItems: [],
    expiringSoon: 0,
    pantrySize: 0,
    recentActivity: [],
    locationCounts: {},
    categoryCounts: {}
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

  const { lowStock, expiringSoon, pantrySize, locationCounts, categoryCounts } = data;

  const topCategories = useMemo(() => {
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [categoryCounts]);

  const topLocations = useMemo(() => {
    return Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .filter(([, count]) => count > 0);
  }, [locationCounts]);

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
      <style>{`
        .category-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .category-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .category-bar {
          flex: 1;
          height: 8px;
          background: var(--border);
          border-radius: 4px;
          overflow: hidden;
        }
        .category-bar-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 4px;
        }
        .category-label {
          min-width: 100px;
          font-size: 0.85rem;
        }
        .category-count {
          min-width: 30px;
          text-align: right;
          font-size: 0.85rem;
          color: #6b726d;
        }
        .dashboard-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 900px) {
          .dashboard-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

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

      <div className="dashboard-row">
        <section className='card'>
          <div className='card-title' style={{ marginBottom: '1rem' }}>Top Categories</div>
          {topCategories.length === 0 ? (
            <div style={{ color: '#6b726d', fontSize: '0.9rem' }}>No items yet</div>
          ) : (
            <div className="category-list">
              {topCategories.map(([cat, count]) => {
                const maxCount = topCategories[0][1];
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={cat} className="category-row">
                    <div className="category-label">{cat}</div>
                    <div className="category-bar">
                      <div className="category-bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="category-count">{count}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className='card'>
          <div className='card-title' style={{ marginBottom: '1rem' }}>Storage Locations</div>
          {topLocations.length === 0 ? (
            <div style={{ color: '#6b726d', fontSize: '0.9rem' }}>No items yet</div>
          ) : (
            <div className="category-list">
              {topLocations.map(([location, count]) => {
                const maxCount = topLocations[0][1];
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={location} className="category-row">
                    <div className="category-label">{location}</div>
                    <div className="category-bar">
                      <div className="category-bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="category-count">{count}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="dashboard-row">
        <section className='card table-card' style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
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
            {filtered.slice(0, 5).map((r) => (
              <div className='row' key={r.id}>
                <div>{r.item}</div>
                <div>{r.qty} {r.unit}</div>
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
      </div>
    </>
  );
}
