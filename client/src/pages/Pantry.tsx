import { useMemo, useState } from 'react';

type PantryItem = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  expires: string; // YYYY-MM-DD
  macros: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    serving: string;
  };
};

const INITIAL_ITEMS: PantryItem[] = [
  {
    id: '1',
    name: 'Chicken Breast',
    qty: 2,
    unit: 'packs',
    expires: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
    macros: { kcal: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100 g' },
  },
  {
    id: '2',
    name: 'Oats',
    qty: 1,
    unit: 'bag',
    expires: '2026-03-01',
    macros: { kcal: 389, protein: 17, carbs: 66, fat: 7, serving: '100 g' },
  },
  {
    id: '3',
    name: 'Greek Yogurt',
    qty: 5,
    unit: 'cups',
    expires: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    macros: { kcal: 59, protein: 10, carbs: 3.6, fat: 0.4, serving: '100 g' },
  },
  {
    id: '4',
    name: 'Jasmine Rice',
    qty: 2,
    unit: 'kg',
    expires: '2027-01-10',
    macros: { kcal: 365, protein: 7, carbs: 80, fat: 0.6, serving: '100 g' },
  },
  {
    id: '5',
    name: 'Olive Oil',
    qty: 1,
    unit: 'bottle',
    expires: '2026-12-31',
    macros: { kcal: 884, protein: 0, carbs: 0, fat: 100, serving: '100 g' },
  },
];

type EditState = Record<string, { qty: number; expires: string }>;

export default function Pantry() {
  const [items, setItems] = useState<PantryItem[]>(INITIAL_ITEMS);
  const [editing, setEditing] = useState<EditState>({});
  const [q, setQ] = useState('');
  const [macroItem, setMacroItem] = useState<PantryItem | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => i.name.toLowerCase().includes(s));
  }, [q, items]);

  const startEdit = (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    setEditing((prev) => ({
      ...prev,
      [id]: { qty: it.qty, expires: it.expires },
    }));
  };
  const cancelEdit = (id: string) =>
    setEditing((prev) => {
      const c = { ...prev };
      delete c[id];
      return c;
    });
  const saveEdit = (id: string) => {
    const e = editing[id];
    if (!e) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qty: e.qty, expires: e.expires } : i
      )
    );
    cancelEdit(id);
  };
  const updateEditField = (
    id: string,
    field: 'qty' | 'expires',
    value: string
  ) => {
    setEditing((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === 'qty' ? Math.max(0, Number(value) || 0) : value,
      },
    }));
  };
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    cancelEdit(id);
  };

  const statusPill = (iso: string) => {
    const days = Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);
    if (isNaN(days)) return <span className='pill warn'>Unknown</span>;
    if (days < 0) return <span className='pill danger'>Expired</span>;
    if (days <= 5) return <span className='pill warn'>Soon</span>;
    return <span className='pill ok'>OK</span>;
  };

  return (
    <>
      <section className='card table-card'>
        <div className='table-header'>
          <div className='table-title'>Pantry</div>
          <div className='table-actions' style={{ alignItems: 'center' }}>
            <input
              className='input'
              placeholder='Search items…'
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className='btn-soft'>Add Item</button>
          </div>
        </div>

        <div className='table'>
          <div
            className='row head'
            style={{ gridTemplateColumns: '2fr 0.7fr 1.2fr 1fr 1.6fr' }}
          >
            <div>Item</div>
            <div>Qty</div>
            <div>Expires</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {filtered.map((it) => {
            const isEditing = Boolean(editing[it.id]);
            const e = editing[it.id];
            return (
              <div
                className='row'
                key={it.id}
                style={{ gridTemplateColumns: '2fr 0.7fr 1.2fr 1fr 1.6fr' }}
              >
                <div>
                  <div className='cell-title'>{it.name}</div>
                  <div className='cell-sub'>{it.unit}</div>
                </div>
                <div>
                  {isEditing ? (
                    <input
                      className='input input-sm'
                      type='number'
                      min={0}
                      value={e?.qty ?? it.qty}
                      onChange={(ev) =>
                        updateEditField(it.id, 'qty', ev.target.value)
                      }
                      style={{ width: 90 }}
                    />
                  ) : (
                    <span className='badge'>{it.qty}</span>
                  )}
                </div>
                <div>
                  {isEditing ? (
                    <input
                      className='input input-sm'
                      type='date'
                      value={e?.expires ?? it.expires}
                      onChange={(ev) =>
                        updateEditField(it.id, 'expires', ev.target.value)
                      }
                    />
                  ) : (
                    <span>{it.expires}</span>
                  )}
                </div>
                <div>
                  {statusPill(
                    isEditing ? e?.expires ?? it.expires : it.expires
                  )}
                </div>
                <div className='actions'>
                  <button className='btn-soft' onClick={() => setMacroItem(it)}>
                    View Macros
                  </button>
                  {!isEditing ? (
                    <>
                      <button
                        className='btn-primary'
                        onClick={() => startEdit(it.id)}
                      >
                        Edit
                      </button>
                      <button
                        className='btn-outline'
                        onClick={() => removeItem(it.id)}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className='btn-primary'
                        onClick={() => saveEdit(it.id)}
                      >
                        Save
                      </button>
                      <button
                        className='btn-outline'
                        onClick={() => cancelEdit(it.id)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className='row'>
              <div style={{ gridColumn: '1 / -1', color: '#6b726d' }}>
                No items.
              </div>
            </div>
          )}
        </div>
      </section>

      {macroItem && (
        <div className='modal-backdrop' onClick={() => setMacroItem(null)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <div className='modal-title'>Macros — {macroItem.name}</div>
              <button
                className='btn-outline'
                onClick={() => setMacroItem(null)}
              >
                Close
              </button>
            </div>
            <div className='modal-body'>
              <div className='macro-grid'>
                <div className='macro-box'>
                  <div className='macro-label'>Serving</div>
                  <div className='macro-value'>{macroItem.macros.serving}</div>
                </div>
                <div className='macro-box'>
                  <div className='macro-label'>Calories</div>
                  <div className='macro-value'>{macroItem.macros.kcal}</div>
                </div>
                <div className='macro-box'>
                  <div className='macro-label'>Protein</div>
                  <div className='macro-value'>
                    {macroItem.macros.protein} g
                  </div>
                </div>
                <div className='macro-box'>
                  <div className='macro-label'>Carbs</div>
                  <div className='macro-value'>{macroItem.macros.carbs} g</div>
                </div>
                <div className='macro-box'>
                  <div className='macro-label'>Fat</div>
                  <div className='macro-value'>{macroItem.macros.fat} g</div>
                </div>
              </div>
            </div>
            <div className='modal-footer'>
              <button
                className='btn-primary'
                onClick={() => setMacroItem(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
