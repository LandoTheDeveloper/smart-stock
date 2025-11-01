import { useMemo, useState } from 'react';

type Activity = {
  item: string;
  qty: number;
  expires: string;
  status: 'ok' | 'warn' | 'danger';
};

const SAMPLE: Activity[] = [
  { item: 'Chicken Breast', qty: 2, expires: 'Nov 5', status: 'warn' },
  { item: 'Oats', qty: 1, expires: 'Mar 2026', status: 'ok' },
  { item: 'Greek Yogurt', qty: 5, expires: 'Nov 3', status: 'danger' },
];

export default function Dashboard() {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return SAMPLE;
    return SAMPLE.filter((row) => row.item.toLowerCase().includes(s));
  }, [q]);

  const lowStock = SAMPLE.filter((a) => a.qty <= 2).length;
  const expiringSoon = SAMPLE.filter((a) => a.status !== 'ok').length;
  const pantrySize = 42;

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
          {filtered.map((r, i) => (
            <div className='row' key={i}>
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
