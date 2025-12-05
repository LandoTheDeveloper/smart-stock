import { useMemo, useState, useEffect } from 'react';
import { api } from '../lib/api';

type Ingredient = {
  name: string;
  amount: string;
};

type SavedRecipe = {
  _id: string;
  title: string;
  minutes: number;
  servings: number;
  tags: string[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Ingredient[];
  steps: string[];
  isFavorite: boolean;
  isCustom: boolean;
  notes?: string;
};

export default function SavedRecipes() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'custom'>('all');
  const [active, setActive] = useState<SavedRecipe | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    minutes: 30,
    servings: 2,
    tags: '',
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    ingredients: '',
    steps: ''
  });

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ success: boolean; data: SavedRecipe[] }>('/api/recipes');
      if (response.data.success) {
        setRecipes(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch recipes:', err);
      setError(err.response?.data?.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = recipes;

    if (filter === 'favorites') {
      result = result.filter(r => r.isFavorite);
    } else if (filter === 'custom') {
      result = result.filter(r => r.isCustom);
    }

    const s = q.trim().toLowerCase();
    if (s) {
      result = result.filter(r => r.title.toLowerCase().includes(s));
    }

    return result;
  }, [recipes, filter, q]);

  const handleToggleFavorite = async (id: string) => {
    try {
      const response = await api.put<{ success: boolean; data: SavedRecipe }>(`/api/recipes/${id}/favorite`);
      if (response.data.success) {
        setRecipes(prev => prev.map(r => r._id === id ? response.data.data : r));
        if (active && active._id === id) {
          setActive(response.data.data);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update favorite');
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm('Delete this recipe?')) return;

    try {
      await api.delete(`/api/recipes/${id}`);
      setRecipes(prev => prev.filter(r => r._id !== id));
      if (active && active._id === id) {
        setActive(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete recipe');
    }
  };

  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRecipe.title.trim()) {
      alert('Recipe title is required');
      return;
    }

    const ingredientLines = newRecipe.ingredients.split('\n').filter(l => l.trim());
    const ingredients = ingredientLines.map(line => {
      const parts = line.split('-').map(p => p.trim());
      return {
        name: parts[0] || line,
        amount: parts[1] || ''
      };
    });

    const steps = newRecipe.steps.split('\n').filter(l => l.trim());

    try {
      const response = await api.post<{ success: boolean; data: SavedRecipe }>('/api/recipes', {
        title: newRecipe.title,
        minutes: newRecipe.minutes,
        servings: newRecipe.servings,
        tags: newRecipe.tags.split(',').map(t => t.trim()).filter(Boolean),
        kcal: newRecipe.kcal,
        protein: newRecipe.protein,
        carbs: newRecipe.carbs,
        fat: newRecipe.fat,
        ingredients,
        steps,
        isCustom: true
      });

      if (response.data.success) {
        setRecipes(prev => [response.data.data, ...prev]);
        setShowAddModal(false);
        setNewRecipe({
          title: '',
          minutes: 30,
          servings: 2,
          tags: '',
          kcal: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          ingredients: '',
          steps: ''
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add recipe');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b726d' }}>
        Loading recipes...
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
      <section className='card table-card' style={{ padding: 0 }}>
        <div className='table-header'>
          <div className='table-title'>My Recipes</div>
          <div className='table-actions' style={{ gap: 10 }}>
            <input
              className='input'
              placeholder='Search recipes…'
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className='input'
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value='all'>All Recipes</option>
              <option value='favorites'>Favorites</option>
              <option value='custom'>My Custom</option>
            </select>
            <button className='btn-primary' onClick={() => setShowAddModal(true)}>
              Add Recipe
            </button>
          </div>
        </div>

        <div className='recipes-body'>
          {recipes.length === 0 && (
            <div className='card' style={{ padding: 40, textAlign: 'center' }}>
              No saved recipes yet. Generate recipes and save the ones you like, or add your own!
            </div>
          )}

          {recipes.length > 0 && filtered.length === 0 && (
            <div className='card' style={{ padding: 40, textAlign: 'center' }}>
              No recipes match your filters.
            </div>
          )}

          {filtered.length > 0 && (
            <div className='recipe-grid'>
              {filtered.map((r) => (
                <div key={r._id} className='recipe-card card'>
                  <div className='recipe-head'>
                    <div className='recipe-title' style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {r.title}
                      {r.isFavorite && <span style={{ color: '#ef4444' }}>*</span>}
                      {r.isCustom && <span className='tag' style={{ fontSize: '0.65rem' }}>Custom</span>}
                    </div>
                    <div className='recipe-meta'>
                      <span className='chip'>{r.minutes} min</span>
                      <span className='chip'>{r.servings} servings</span>
                    </div>
                  </div>

                  <div className='recipe-tags'>
                    {r.tags.map((t: string) => (
                      <span key={t} className='tag'>
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className='recipe-macros'>
                    <div>
                      <span className='macro-label'>kcal</span>
                      <span className='macro-val'>{r.kcal}</span>
                    </div>
                    <div>
                      <span className='macro-label'>P</span>
                      <span className='macro-val'>{r.protein}g</span>
                    </div>
                    <div>
                      <span className='macro-label'>C</span>
                      <span className='macro-val'>{r.carbs}g</span>
                    </div>
                    <div>
                      <span className='macro-label'>F</span>
                      <span className='macro-val'>{r.fat}g</span>
                    </div>
                  </div>

                  <div className='recipe-actions'>
                    <button className='btn-primary' onClick={() => setActive(r)}>
                      View
                    </button>
                    <button
                      className='btn-soft'
                      onClick={() => handleToggleFavorite(r._id)}
                    >
                      {r.isFavorite ? 'Unfavorite' : 'Favorite'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {active && (
        <div className='modal-backdrop' onClick={() => setActive(null)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <div className='modal-title' style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {active.title}
                {active.isFavorite && <span style={{ color: '#ef4444' }}>*</span>}
              </div>
              <button className='btn-outline' onClick={() => setActive(null)}>
                Close
              </button>
            </div>
            <div className='modal-body'>
              <div className='macro-grid' style={{ marginBottom: 12 }}>
                <div className='macro-box'>
                  <div className='macro-label'>kcal</div>
                  <div className='macro-value'>{active.kcal}</div>
                </div>
                <div className='macro-box'>
                  <div className='macro-label'>Protein</div>
                  <div className='macro-value'>{active.protein} g</div>
                </div>
                <div className='macro-box'>
                  <div className='macro-label'>Carbs</div>
                  <div className='macro-value'>{active.carbs} g</div>
                </div>
                <div className='macro-box'>
                  <div className='macro-label'>Fat</div>
                  <div className='macro-value'>{active.fat} g</div>
                </div>
              </div>

              <div className='recipe-detail'>
                <div className='detail-col'>
                  <div className='detail-title'>Ingredients</div>
                  <ul>
                    {active.ingredients.map((i, idx) => (
                      <li key={idx}>
                        {i.name} {i.amount && `— ${i.amount}`}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className='detail-col'>
                  <div className='detail-title'>Steps</div>
                  <ol>
                    {active.steps.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
            <div className='modal-footer'>
              <button
                className='btn-outline'
                style={{ color: '#dc2626', borderColor: '#dc2626' }}
                onClick={() => handleDeleteRecipe(active._id)}
              >
                Delete
              </button>
              <button
                className='btn-soft'
                onClick={() => handleToggleFavorite(active._id)}
              >
                {active.isFavorite ? 'Unfavorite' : 'Favorite'}
              </button>
              <button className='btn-primary' onClick={() => setActive(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className='modal-backdrop' onClick={() => setShowAddModal(false)}>
          <div className='modal' onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <form onSubmit={handleAddRecipe}>
              <div className='modal-header'>
                <div className='modal-title'>Add Custom Recipe</div>
                <button type='button' className='btn-outline' onClick={() => setShowAddModal(false)}>
                  Close
                </button>
              </div>
              <div className='modal-body' style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Recipe Title *
                    </label>
                    <input
                      className='input'
                      type='text'
                      value={newRecipe.title}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, title: e.target.value }))}
                      placeholder='e.g., Chicken Stir Fry'
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Prep Time (minutes)
                      </label>
                      <input
                        className='input'
                        type='number'
                        min={0}
                        value={newRecipe.minutes}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, minutes: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Servings
                      </label>
                      <input
                        className='input'
                        type='number'
                        min={1}
                        value={newRecipe.servings}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, servings: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Tags (comma separated)
                    </label>
                    <input
                      className='input'
                      type='text'
                      value={newRecipe.tags}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder='e.g., dinner, quick, healthy'
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.85rem' }}>
                        Calories
                      </label>
                      <input
                        className='input'
                        type='number'
                        min={0}
                        value={newRecipe.kcal}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, kcal: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.85rem' }}>
                        Protein (g)
                      </label>
                      <input
                        className='input'
                        type='number'
                        min={0}
                        value={newRecipe.protein}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, protein: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.85rem' }}>
                        Carbs (g)
                      </label>
                      <input
                        className='input'
                        type='number'
                        min={0}
                        value={newRecipe.carbs}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, carbs: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.85rem' }}>
                        Fat (g)
                      </label>
                      <input
                        className='input'
                        type='number'
                        min={0}
                        value={newRecipe.fat}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, fat: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Ingredients (one per line, format: Name - Amount)
                    </label>
                    <textarea
                      className='input'
                      value={newRecipe.ingredients}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, ingredients: e.target.value }))}
                      placeholder={'Chicken breast - 500g\nSoy sauce - 2 tbsp\nGarlic - 3 cloves'}
                      rows={5}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Steps (one per line)
                    </label>
                    <textarea
                      className='input'
                      value={newRecipe.steps}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, steps: e.target.value }))}
                      placeholder={'Cut chicken into cubes\nHeat oil in a pan\nAdd garlic and stir fry'}
                      rows={5}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
              <div className='modal-footer'>
                <button type='button' className='btn-outline' onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type='submit' className='btn-primary'>
                  Add Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
