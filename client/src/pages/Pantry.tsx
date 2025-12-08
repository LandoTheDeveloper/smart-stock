import { useMemo, useState, useEffect } from 'react';
import { api } from '../lib/api';

const CATEGORIES = [
  'Dairy',
  'Produce',
  'Meat',
  'Seafood',
  'Bakery',
  'Frozen',
  'Canned Goods',
  'Grains & Pasta',
  'Snacks',
  'Beverages',
  'Condiments',
  'Spices',
  'Other'
];

const STORAGE_LOCATIONS = ['Fridge', 'Freezer', 'Pantry', 'Counter'];

const UNITS = ['count', 'g', 'kg', 'ml', 'L', 'oz', 'lb', 'cups', 'tbsp', 'tsp'];

type PantryItem = {
  _id: string;
  name: string;
  quantity: number;
  unit?: string;
  expirationDate?: string;
  category?: string;
  storageLocation?: string;
  macros?: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    serving: string;
  };
};

type EditState = Record<string, { quantity: number; expirationDate: string }>;

export default function Pantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [editing, setEditing] = useState<EditState>({});
  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const LOCATIONS_WITH_ALL = ['All', ...STORAGE_LOCATIONS];
  const [macroItem, setMacroItem] = useState<PantryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: 'count',
    expirationDate: '',
    category: '',
    storageLocation: 'Pantry'
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ success: boolean; data: PantryItem[] }>('/api/pantry');
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch pantry items:', err);
      setError(err.response?.data?.message || 'Failed to load pantry items');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = items;

    if (categoryFilter !== 'all') {
      result = result.filter((i) => i.category === categoryFilter);
    }

    if (locationFilter !== 'all') {
      result = result.filter((i) => (i.storageLocation || 'Pantry') === locationFilter);
    }

    const s = q.trim().toLowerCase();
    if (s) {
      result = result.filter((i) => i.name.toLowerCase().includes(s));
    }

    return result;
  }, [q, items, categoryFilter, locationFilter]);


  const startEdit = (id: string) => {
    const it = items.find((i) => i._id === id);
    if (!it) return;
    setEditing((prev) => ({
      ...prev,
      [id]: {
        quantity: it.quantity,
        expirationDate: it.expirationDate ? it.expirationDate.slice(0, 10) : ''
      }
    }));
  };

  const cancelEdit = (id: string) =>
    setEditing((prev) => {
      const c = { ...prev };
      delete c[id];
      return c;
    });

  const saveEdit = async (id: string) => {
    const e = editing[id];
    if (!e) return;

    try {
      const response = await api.put(`/api/pantry/${id}`, {
        quantity: e.quantity,
        expirationDate: e.expirationDate || undefined
      });

      if (response.data.success) {
        setItems((prev) =>
          prev.map((i) =>
            i._id === id
              ? { ...i, quantity: e.quantity, expirationDate: e.expirationDate }
              : i
          )
        );
        cancelEdit(id);
      }
    } catch (err: any) {
      console.error('Failed to update item:', err);
      alert(err.response?.data?.message || 'Failed to update item');
    }
  };

  const updateEditField = (
    id: string,
    field: 'quantity' | 'expirationDate',
    value: string
  ) => {
    setEditing((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === 'quantity' ? Math.max(0, Number(value) || 0) : value
      }
    }));
  };

  const removeItem = async (id: string, skipConfirm = false) => {
    if (!skipConfirm && !confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await api.delete(`/api/pantry/${id}`);
      if (response.data.success) {
        setItems((prev) => prev.filter((i) => i._id !== id));
        cancelEdit(id);
      }
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      alert(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const decrementQuantity = async (item: PantryItem) => {
    const newQty = item.quantity - 1;
    if (newQty <= 0) {
      await removeItem(item._id, true);
      return;
    }

    try {
      const response = await api.put(`/api/pantry/${item._id}`, {
        quantity: newQty
      });

      if (response.data.success) {
        setItems((prev) =>
          prev.map((i) =>
            i._id === item._id ? { ...i, quantity: newQty } : i
          )
        );
      }
    } catch (err: any) {
      console.error('Failed to decrement quantity:', err);
      alert(err.response?.data?.message || 'Failed to update item');
    }
  };

  const addToShoppingList = async (item: PantryItem) => {
    try {
      await api.post('/api/shopping-list', {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || 'count',
        category: item.category,
        priority: 'normal',
        pantryItemId: item._id
      });
      alert(`${item.name} added to shopping list!`);
    } catch (err: any) {
      console.error('Failed to add to shopping list:', err);
      alert(err.response?.data?.message || 'Failed to add to shopping list');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i._id)));
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected items?`)) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => api.delete(`/api/pantry/${id}`))
      );
      setItems((prev) => prev.filter((i) => !selectedIds.has(i._id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Failed to delete items:', err);
      alert('Failed to delete some items');
    }
  };

  const bulkAddToShoppingList = async () => {
    if (selectedIds.size === 0) return;

    const selectedItems = items.filter((i) => selectedIds.has(i._id));
    try {
      await Promise.all(
        selectedItems.map((item) =>
          api.post('/api/shopping-list', {
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || 'count',
            category: item.category,
            priority: 'normal',
            pantryItemId: item._id
          })
        )
      );
      alert(`${selectedIds.size} items added to shopping list!`);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Failed to add items to shopping list:', err);
      alert('Failed to add some items to shopping list');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItem.name.trim()) {
      alert('Item name is required');
      return;
    }

    try {
      const response = await api.post('/api/pantry', {
        name: newItem.name,
        quantity: newItem.quantity,
        unit: newItem.unit || undefined,
        expirationDate: newItem.expirationDate || undefined,
        category: newItem.category || undefined,
        storageLocation: newItem.storageLocation
      });

      if (response.data.success) {
        setItems((prev) => [...prev, response.data.data]);
        setShowAddModal(false);
        setNewItem({ name: '', quantity: 1, unit: 'count', expirationDate: '', category: '', storageLocation: 'Pantry' });
      }
    } catch (err: any) {
      console.error('Failed to add item:', err);
      alert(err.response?.data?.message || 'Failed to add item');
    }
  };

  const statusPill = (isoOrDate?: string) => {
    if (!isoOrDate) return <span className='pill warn'>No Date</span>;

    const date = new Date(isoOrDate);
    const days = Math.floor((date.getTime() - Date.now()) / 86400000);

    if (isNaN(days)) return <span className='pill warn'>Unknown</span>;
    if (days < 0) return <span className='pill danger'>Expired</span>;
    if (days <= 5) return <span className='pill warn'>Soon</span>;
    return <span className='pill ok'>OK</span>;
  };

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return date.toISOString().slice(0, 10);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b726d' }}>
        Loading pantry...
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
      <section className='card table-card'>
        <div className='table-header'>
          <div className='table-title'>Pantry</div>
          <div className='table-actions' style={{ alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              className='input'
              placeholder='Search items…'
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className='input'
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              style={{ minWidth: 100 }}
            >
              {LOCATIONS_WITH_ALL.map(loc => (
                <option key={loc} value={loc === 'All' ? 'all' : loc}>{loc}</option>
              ))}
            </select>
            <select
              className='input'
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ minWidth: 120 }}
            >
              <option value='all'>All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {selectedIds.size > 0 && (
              <>
                <button className='btn-soft btn-sm' onClick={bulkAddToShoppingList}>
                  Restock ({selectedIds.size})
                </button>
                <button
                  className='btn-outline btn-sm'
                  style={{ color: '#dc2626', borderColor: '#fecaca' }}
                  onClick={bulkDelete}
                >
                  Delete ({selectedIds.size})
                </button>
              </>
            )}
            <button className='btn-soft' onClick={() => setShowAddModal(true)}>
              Add Item
            </button>
          </div>
        </div>

        <div className='table'>
          <div
            className='row head'
            style={{ gridTemplateColumns: '0.3fr 2fr 0.7fr 1fr 1fr 0.8fr 1.6fr' }}
          >
            <div>
              <input
                type='checkbox'
                checked={filtered.length > 0 && selectedIds.size === filtered.length}
                onChange={selectAll}
                title='Select all'
              />
            </div>
            <div>Item</div>
            <div>Qty</div>
            <div>Location</div>
            <div>Expires</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {filtered.map((it) => {
            const isEditing = Boolean(editing[it._id]);
            const e = editing[it._id];
            return (
              <div
                className='row'
                key={it._id}
                style={{ gridTemplateColumns: '0.3fr 2fr 0.7fr 1fr 1fr 0.8fr 1.6fr' }}
              >
                <div>
                  <input
                    type='checkbox'
                    checked={selectedIds.has(it._id)}
                    onChange={() => toggleSelect(it._id)}
                  />
                </div>
                <div>
                  <div className='cell-title'>{it.name}</div>
                  <div className='cell-sub'>
                    {it.category || 'Uncategorized'}
                  </div>
                </div>
                <div>
                  {isEditing ? (
                    <input
                      className='input input-sm'
                      type='number'
                      min={0}
                      value={e?.quantity ?? it.quantity}
                      onChange={(ev) =>
                        updateEditField(it._id, 'quantity', ev.target.value)
                      }
                      style={{ width: 70 }}
                    />
                  ) : (
                    <span className='badge'>{it.quantity} {it.unit || 'count'}</span>
                  )}
                </div>
                <div>
                  <span className='tag' style={{ fontSize: '0.75rem' }}>
                    {it.storageLocation || 'Pantry'}
                  </span>
                </div>
                <div>
                  {isEditing ? (
                    <input
                      className='input input-sm'
                      type='date'
                      value={
                        e?.expirationDate ??
                        (it.expirationDate
                          ? formatDate(it.expirationDate)
                          : '')
                      }
                      onChange={(ev) =>
                        updateEditField(
                          it._id,
                          'expirationDate',
                          ev.target.value
                        )
                      }
                    />
                  ) : (
                    <span>{formatDate(it.expirationDate)}</span>
                  )}
                </div>
                <div>
                  {statusPill(
                    isEditing
                      ? e?.expirationDate ?? it.expirationDate
                      : it.expirationDate
                  )}
                </div>
                <div className='actions'>
                  {!isEditing ? (
                    <>
                      {(it.unit === 'count' || !it.unit) && (
                        <button
                          className='btn-soft btn-sm'
                          onClick={() => decrementQuantity(it)}
                          title='Use one'
                        >
                          -1
                        </button>
                      )}
                      <button
                        className='btn-soft btn-sm'
                        onClick={() => removeItem(it._id, true)}
                        title='Mark as finished'
                      >
                        Done
                      </button>
                      <button
                        className='btn-soft btn-sm'
                        onClick={() => addToShoppingList(it)}
                        title='Add to shopping list'
                      >
                        Restock
                      </button>
                      <button
                        className='btn-outline btn-sm'
                        onClick={() => startEdit(it._id)}
                      >
                        Edit
                      </button>
                      {it.macros && (
                        <button
                          className='btn-outline btn-sm'
                          onClick={() => setMacroItem(it)}
                        >
                          Macros
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        className='btn-primary btn-sm'
                        onClick={() => saveEdit(it._id)}
                      >
                        Save
                      </button>
                      <button
                        className='btn-outline btn-sm'
                        onClick={() => cancelEdit(it._id)}
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
                {items.length === 0
                  ? 'No items in pantry. Click "Add Item" to get started.'
                  : 'No items match your filters.'}
              </div>
            </div>
          )}
        </div>
      </section>

      {showAddModal && (
        <div
          className='modal-backdrop'
          onClick={() => setShowAddModal(false)}
        >
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAddItem}>
              <div className='modal-header'>
                <div className='modal-title'>Add New Item</div>
                <button
                  type='button'
                  className='btn-outline'
                  onClick={() => setShowAddModal(false)}
                >
                  Close
                </button>
              </div>
              <div className='modal-body'>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Item Name *
                    </label>
                    <input
                      className='input'
                      type='text'
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder='e.g., Chicken Breast'
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Quantity
                      </label>
                      <input
                        className='input'
                        type='number'
                        min={0}
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            quantity: Math.max(0, Number(e.target.value) || 0)
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Unit
                      </label>
                      <select
                        className='input'
                        value={newItem.unit}
                        onChange={(e) =>
                          setNewItem((prev) => ({ ...prev, unit: e.target.value }))
                        }
                      >
                        {UNITS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Category
                      </label>
                      <select
                        className='input'
                        value={newItem.category}
                        onChange={(e) =>
                          setNewItem((prev) => ({ ...prev, category: e.target.value }))
                        }
                      >
                        <option value=''>Select category</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Storage Location
                      </label>
                      <select
                        className='input'
                        value={newItem.storageLocation}
                        onChange={(e) =>
                          setNewItem((prev) => ({ ...prev, storageLocation: e.target.value }))
                        }
                      >
                        {STORAGE_LOCATIONS.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Expiration Date
                    </label>
                    <input
                      className='input'
                      type='date'
                      value={newItem.expirationDate}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          expirationDate: e.target.value
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <div className='modal-footer'>
                <button
                  type='button'
                  className='btn-outline'
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type='submit' className='btn-primary'>
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {macroItem && macroItem.macros && (
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
