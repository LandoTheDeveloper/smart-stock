import { useMemo, useState, useEffect } from 'react';
import { api } from '../lib/api';

type ShoppingListItem = {
  _id: string;
  name: string;
  quantity: number;
  unit?: string;
  checked: boolean;
  category?: string;
  priority: 'low' | 'normal' | 'high';
  pantryItemId?: string;
};

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: '',
    category: '',
    priority: 'normal' as const
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ success: boolean; data: ShoppingListItem[] }>('/api/shopping-list');
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch shopping list:', err);
      setError(err.response?.data?.message || 'Failed to load shopping list');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => i.name.toLowerCase().includes(s));
  }, [q, items]);

  const uncheckedItems = useMemo(() => filtered.filter(i => !i.checked), [filtered]);
  const checkedItems = useMemo(() => filtered.filter(i => i.checked), [filtered]);

  const toggleItem = async (id: string) => {
    try {
      const response = await api.put<{ success: boolean; data: ShoppingListItem }>(`/api/shopping-list/${id}/toggle`);
      if (response.data.success) {
        setItems(prev => prev.map(i => i._id === id ? response.data.data : i));
      }
    } catch (err: any) {
      console.error('Failed to toggle item:', err);
      alert(err.response?.data?.message || 'Failed to toggle item');
    }
  };

  const removeItem = async (id: string) => {
    try {
      const response = await api.delete(`/api/shopping-list/${id}`);
      if (response.data.success) {
        setItems(prev => prev.filter(i => i._id !== id));
      }
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      alert(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const clearChecked = async () => {
    if (!confirm('Clear all checked items?')) return;
    try {
      const response = await api.delete('/api/shopping-list/checked');
      if (response.data.success) {
        setItems(prev => prev.filter(i => !i.checked));
      }
    } catch (err: any) {
      console.error('Failed to clear checked items:', err);
      alert(err.response?.data?.message || 'Failed to clear checked items');
    }
  };

  const generateFromLowStock = async () => {
    try {
      const response = await api.post<{ success: boolean; data: ShoppingListItem[]; message: string }>('/api/shopping-list/generate');
      if (response.data.success) {
        if (response.data.data.length > 0) {
          setItems(prev => [...prev, ...response.data.data]);
        }
        alert(response.data.message);
      }
    } catch (err: any) {
      console.error('Failed to generate from low stock:', err);
      alert(err.response?.data?.message || 'Failed to generate from low stock');
    }
  };

  const addToPantry = async (id: string) => {
    try {
      const response = await api.post(`/api/shopping-list/${id}/to-pantry`);
      if (response.data.success) {
        setItems(prev => prev.filter(i => i._id !== id));
        alert(response.data.message);
      }
    } catch (err: any) {
      console.error('Failed to add to pantry:', err);
      alert(err.response?.data?.message || 'Failed to add to pantry');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItem.name.trim()) {
      alert('Item name is required');
      return;
    }

    try {
      const response = await api.post<{ success: boolean; data: ShoppingListItem }>('/api/shopping-list', {
        name: newItem.name,
        quantity: newItem.quantity,
        unit: newItem.unit || undefined,
        category: newItem.category || undefined,
        priority: newItem.priority
      });

      if (response.data.success) {
        setItems(prev => [...prev, response.data.data]);
        setShowAddModal(false);
        setNewItem({ name: '', quantity: 1, unit: '', category: '', priority: 'normal' });
      }
    } catch (err: any) {
      console.error('Failed to add item:', err);
      alert(err.response?.data?.message || 'Failed to add item');
    }
  };

  const priorityIndicator = (priority: string) => {
    if (priority === 'high') return <span className="priority-dot high" title="High priority" />;
    if (priority === 'low') return <span className="priority-dot low" title="Low priority" />;
    return null;
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b726d' }}>
        Loading shopping list...
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
        .priority-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
        }
        .priority-dot.high {
          background-color: #dc2626;
        }
        .priority-dot.low {
          background-color: #9ca3af;
        }
        .shopping-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border);
          gap: 0.75rem;
        }
        .shopping-item:last-child {
          border-bottom: none;
        }
        .shopping-item.checked {
          opacity: 0.6;
          background: var(--bg-secondary);
        }
        .shopping-item.checked .item-name {
          text-decoration: line-through;
          color: #6b726d;
        }
        .item-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: var(--primary);
        }
        .item-info {
          flex: 1;
          min-width: 0;
        }
        .item-name {
          font-weight: 500;
          display: flex;
          align-items: center;
        }
        .item-meta {
          font-size: 0.85rem;
          color: #6b726d;
          margin-top: 2px;
        }
        .item-actions {
          display: flex;
          gap: 0.5rem;
        }
        .section-header {
          padding: 0.5rem 1rem;
          background: var(--bg-secondary);
          font-weight: 600;
          font-size: 0.85rem;
          color: #6b726d;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>

      <section className="card table-card">
        <div className="table-header">
          <div className="table-title">Shopping List</div>
          <div className="table-actions" style={{ alignItems: 'center', gap: '0.5rem' }}>
            <input
              className="input"
              placeholder="Search items…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn-soft" onClick={generateFromLowStock}>
              Generate from Low Stock
            </button>
            <button className="btn-soft" onClick={() => setShowAddModal(true)}>
              Add Item
            </button>
          </div>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {uncheckedItems.length > 0 && (
            <>
              <div className="section-header">To Buy ({uncheckedItems.length})</div>
              {uncheckedItems.map(item => (
                <div key={item._id} className="shopping-item">
                  <input
                    type="checkbox"
                    className="item-checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(item._id)}
                  />
                  <div className="item-info">
                    <div className="item-name">
                      {priorityIndicator(item.priority)}
                      {item.name}
                    </div>
                    <div className="item-meta">
                      {item.quantity} {item.unit || 'units'}
                      {item.category && ` • ${item.category}`}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="btn-outline btn-sm" onClick={() => removeItem(item._id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {checkedItems.length > 0 && (
            <>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Purchased ({checkedItems.length})</span>
                <button
                  className="btn-outline btn-sm"
                  style={{ textTransform: 'none', letterSpacing: 'normal' }}
                  onClick={clearChecked}
                >
                  Clear All
                </button>
              </div>
              {checkedItems.map(item => (
                <div key={item._id} className="shopping-item checked">
                  <input
                    type="checkbox"
                    className="item-checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(item._id)}
                  />
                  <div className="item-info">
                    <div className="item-name">
                      {item.name}
                    </div>
                    <div className="item-meta">
                      {item.quantity} {item.unit || 'units'}
                      {item.category && ` • ${item.category}`}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="btn-soft btn-sm" onClick={() => addToPantry(item._id)}>
                      Add to Pantry
                    </button>
                    <button className="btn-outline btn-sm" onClick={() => removeItem(item._id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {filtered.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b726d' }}>
              {items.length === 0
                ? 'Shopping list is empty. Add items or generate from low stock pantry items.'
                : 'No items match your search.'}
            </div>
          )}
        </div>
      </section>

      {showAddModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAddItem}>
              <div className="modal-header">
                <div className="modal-title">Add to Shopping List</div>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Close
                </button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Item Name *
                    </label>
                    <input
                      className="input"
                      type="text"
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., Milk"
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Quantity
                      </label>
                      <input
                        className="input"
                        type="number"
                        min={1}
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            quantity: Math.max(1, Number(e.target.value) || 1)
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Unit
                      </label>
                      <input
                        className="input"
                        type="text"
                        value={newItem.unit}
                        onChange={(e) =>
                          setNewItem((prev) => ({ ...prev, unit: e.target.value }))
                        }
                        placeholder="e.g., liters, kg"
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Category
                    </label>
                    <input
                      className="input"
                      type="text"
                      value={newItem.category}
                      onChange={(e) =>
                        setNewItem((prev) => ({ ...prev, category: e.target.value }))
                      }
                      placeholder="e.g., Dairy, Produce, Meat"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Priority
                    </label>
                    <select
                      className="input"
                      value={newItem.priority}
                      onChange={(e) =>
                        setNewItem((prev) => ({ ...prev, priority: e.target.value as 'low' | 'normal' | 'high' }))
                      }
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
