import { useMemo, useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import axios from 'axios';

type Ingredient = {
  name: string;
  amount: string;
};

type GeneratedRecipe = {
  id: string;
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
  createdByName?: string;
};

type RecipeHistoryItem = {
  _id: string;
  prompt?: string;
  recipes: GeneratedRecipe[];
  createdAt: string;
};

const TIME_FILTERS = [
  { label: 'Any Time', value: 0 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 }
];

const COMMON_TAGS = ['breakfast', 'brunch', 'lunch', 'dinner', 'snack', 'vegetarian', 'vegan', 'quick', 'healthy', 'low-carb', 'high-protein'];

export default function Recipes() {
  const [tab, setTab] = useState<'generate' | 'saved' | 'history'>('saved');
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | 'all'>('all');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'custom'>('all');
  const [active, setActive] = useState<GeneratedRecipe | SavedRecipe | null>(null);

  const [generatedRecipes, setGeneratedRecipes] = useState<GeneratedRecipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [history, setHistory] = useState<RecipeHistoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [savedLoading, setSavedLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  // Abort controller for cancelling recipe generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Advanced filters
  const [maxTime, setMaxTime] = useState(0);
  const [maxCalories, setMaxCalories] = useState(0);
  const [excludeIngredients, setExcludeIngredients] = useState('');
  const [useExpiringFirst, setUseExpiringFirst] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
    fetchSavedRecipes();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await api.get<{ success: boolean; data: RecipeHistoryItem[] }>('/api/recipe-history');
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchSavedRecipes = async () => {
    try {
      setSavedLoading(true);
      const response = await api.get<{ success: boolean; data: SavedRecipe[] }>('/api/recipes');
      if (response.data.success) {
        setSavedRecipes(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch recipes:', err);
    } finally {
      setSavedLoading(false);
    }
  };

  const handleGenerateRecipes = async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError('');
    try {
      const payload = {
        userPrompt: userPrompt.trim() || undefined,
      };

      const response = await api.post('/api/generate/recipes', payload, {
        signal: abortControllerRef.current.signal
      });

      if (response.data.success) {
        setGeneratedRecipes(response.data.recipes);
        // Refresh history after generating new recipes
        fetchHistory();
      }
    } catch (err: any) {
      if (axios.isCancel(err)) {
        // Request was cancelled by user - don't show error
        return;
      }
      setError(err.response?.data?.message || 'Failed to generate recipes');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  const handleDeleteHistoryItem = async (id: string) => {
    if (!confirm('Delete this history item?')) return;
    try {
      await api.delete(`/api/recipe-history/${id}`);
      setHistory(prev => prev.filter(h => h._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete history item');
    }
  };

  const handleSaveFromHistory = async (recipe: GeneratedRecipe) => {
    setSaving(recipe.id);
    try {
      const response = await api.post<{ success: boolean; data: SavedRecipe }>('/api/recipes', {
        title: recipe.title,
        minutes: recipe.minutes,
        servings: recipe.servings,
        tags: recipe.tags,
        kcal: recipe.kcal,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        isCustom: false
      });
      if (response.data.success) {
        setSavedRecipes(prev => [response.data.data, ...prev]);
        alert('Recipe saved to your collection!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save recipe');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveRecipe = async (recipe: GeneratedRecipe) => {
    setSaving(recipe.id);
    try {
      const response = await api.post<{ success: boolean; data: SavedRecipe }>('/api/recipes', {
        title: recipe.title,
        minutes: recipe.minutes,
        servings: recipe.servings,
        tags: recipe.tags,
        kcal: recipe.kcal,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        isCustom: false
      });
      if (response.data.success) {
        setSavedRecipes(prev => [response.data.data, ...prev]);
        alert('Recipe saved!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save recipe');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const response = await api.put<{ success: boolean; data: SavedRecipe }>(`/api/recipes/${id}/favorite`);
      if (response.data.success) {
        setSavedRecipes(prev => prev.map(r => r._id === id ? response.data.data : r));
        if (active && '_id' in active && active._id === id) {
          setActive(response.data.data);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update favorite');
    }
  };

  const handleDeleteRecipe = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Delete this recipe?')) return;

    try {
      await api.delete(`/api/recipes/${id}`);
      setSavedRecipes(prev => prev.filter(r => r._id !== id));
      if (active && '_id' in active && active._id === id) {
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
        setSavedRecipes(prev => [response.data.data, ...prev]);
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

  const allTags = useMemo(() => {
    const recipes = tab === 'generate' ? generatedRecipes : savedRecipes;
    const s = new Set<string>();
    recipes.forEach((r: any) => r.tags?.forEach((t: string) => s.add(t)));
    // Add common tags that aren't already present
    COMMON_TAGS.forEach(t => s.add(t));
    return ['all', ...Array.from(s).sort()];
  }, [tab, generatedRecipes, savedRecipes]);

  const excludedIngredientsList = useMemo(() => {
    return excludeIngredients.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
  }, [excludeIngredients]);

  const filteredGenerated = useMemo(() => {
    const s = q.trim().toLowerCase();
    return generatedRecipes.filter((r) => {
      const matchesQ = !s || r.title.toLowerCase().includes(s);
      const matchesTag = tag === 'all' || r.tags.includes(tag);
      const matchesTime = maxTime === 0 || r.minutes <= maxTime;
      const matchesCalories = maxCalories === 0 || r.kcal <= maxCalories;
      const matchesExclusions = excludedIngredientsList.length === 0 ||
        !r.ingredients.some(ing => excludedIngredientsList.some(ex => ing.name.toLowerCase().includes(ex)));
      return matchesQ && matchesTag && matchesTime && matchesCalories && matchesExclusions;
    });
  }, [q, tag, generatedRecipes, maxTime, maxCalories, excludedIngredientsList]);

  const filteredSaved = useMemo(() => {
    let result = savedRecipes;

    if (filter === 'favorites') {
      result = result.filter(r => r.isFavorite);
    } else if (filter === 'custom') {
      result = result.filter(r => r.isCustom);
    }

    const s = q.trim().toLowerCase();
    if (s) {
      result = result.filter(r => r.title.toLowerCase().includes(s));
    }

    if (tag !== 'all') {
      result = result.filter(r => r.tags?.includes(tag));
    }

    if (maxTime > 0) {
      result = result.filter(r => r.minutes <= maxTime);
    }

    if (maxCalories > 0) {
      result = result.filter(r => r.kcal <= maxCalories);
    }

    if (excludedIngredientsList.length > 0) {
      result = result.filter(r =>
        !r.ingredients.some(ing => excludedIngredientsList.some(ex => ing.name.toLowerCase().includes(ex)))
      );
    }

    return result;
  }, [savedRecipes, filter, q, tag, maxTime, maxCalories, excludedIngredientsList]);

  const isSavedRecipe = (recipe: any): recipe is SavedRecipe => '_id' in recipe;

  return (
    <>
      <style>{`
        .recipe-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 0;
        }
        .recipe-tab {
          padding: 0.75rem 1.5rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--muted);
          border-bottom: 2px solid transparent;
          font-family: inherit;
        }
        .recipe-tab:hover {
          color: var(--text);
        }
        .recipe-tab.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
      `}</style>

      <section className='card table-card' style={{ padding: 0 }}>
        <div className='table-header' style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 0 }}>
          <div className='recipe-tabs' style={{ padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
            <button
              className={`recipe-tab ${tab === 'saved' ? 'active' : ''}`}
              onClick={() => setTab('saved')}
            >
              My Recipes ({savedRecipes.length})
            </button>
            <button
              className={`recipe-tab ${tab === 'generate' ? 'active' : ''}`}
              onClick={() => setTab('generate')}
            >
              Generate New
            </button>
            <button
              className={`recipe-tab ${tab === 'history' ? 'active' : ''}`}
              onClick={() => setTab('history')}
            >
              History ({history.length})
            </button>
          </div>

          {tab !== 'history' && (
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {tab === 'generate' ? (
                <>
                  <input
                    className='input'
                    placeholder='Optional: Add requirements (e.g., vegetarian, quick)'
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  <button
                    className='btn-primary'
                    onClick={handleGenerateRecipes}
                    disabled={loading}
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </button>
                </>
              ) : (
                <>
                  <input
                    className='input'
                    placeholder='Search recipes…'
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    style={{ minWidth: 150 }}
                  />
                  <select
                    className='input'
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    style={{ minWidth: 120 }}
                  >
                    <option value='all'>All</option>
                    <option value='favorites'>Favorites</option>
                    <option value='custom'>Custom</option>
                  </select>
                  <button
                    className='btn-soft btn-sm'
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ background: showFilters ? 'var(--primary-20)' : undefined }}
                  >
                    Filters {(maxTime > 0 || maxCalories > 0 || excludeIngredients || tag !== 'all') ? '•' : ''}
                  </button>
                  <button className='btn-primary' onClick={() => setShowAddModal(true)}>
                    Add Recipe
                  </button>
                </>
              )}
            </div>
          )}

          {showFilters && tab === 'saved' && (
            <div style={{ padding: '0 16px 12px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <select
                className='input'
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                style={{ minWidth: 120 }}
              >
                {allTags.map((t) => (
                  <option key={t} value={t}>{t === 'all' ? 'All Tags' : t}</option>
                ))}
              </select>
              <select
                className='input'
                value={maxTime}
                onChange={(e) => setMaxTime(Number(e.target.value))}
                style={{ minWidth: 100 }}
              >
                {TIME_FILTERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.value === 0 ? 'Any Time' : `≤ ${t.label}`}</option>
                ))}
              </select>
              <input
                className='input'
                type='number'
                placeholder='Max kcal'
                value={maxCalories || ''}
                onChange={(e) => setMaxCalories(Number(e.target.value) || 0)}
                style={{ width: 100 }}
                min={0}
              />
              <input
                className='input'
                placeholder='Exclude ingredients (comma sep)'
                value={excludeIngredients}
                onChange={(e) => setExcludeIngredients(e.target.value)}
                style={{ minWidth: 180 }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type='checkbox'
                  checked={useExpiringFirst}
                  onChange={(e) => setUseExpiringFirst(e.target.checked)}
                />
                Expiring items first
              </label>
              {(maxTime > 0 || maxCalories > 0 || excludeIngredients || tag !== 'all') && (
                <button
                  className='btn-outline btn-sm'
                  onClick={() => {
                    setMaxTime(0);
                    setMaxCalories(0);
                    setExcludeIngredients('');
                    setTag('all');
                    setUseExpiringFirst(false);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {tab === 'generate' && generatedRecipes.length > 0 && (
            <div style={{ padding: '0 16px 12px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                className='input'
                placeholder='Search generated…'
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ minWidth: 150 }}
              />
              <select
                className='input'
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                style={{ minWidth: 100 }}
              >
                {allTags.map((t) => (
                  <option key={t} value={t}>{t === 'all' ? 'All Tags' : t}</option>
                ))}
              </select>
              <select
                className='input'
                value={maxTime}
                onChange={(e) => setMaxTime(Number(e.target.value))}
                style={{ minWidth: 100 }}
              >
                {TIME_FILTERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.value === 0 ? 'Any Time' : `≤ ${t.label}`}</option>
                ))}
              </select>
              <input
                className='input'
                type='number'
                placeholder='Max kcal'
                value={maxCalories || ''}
                onChange={(e) => setMaxCalories(Number(e.target.value) || 0)}
                style={{ width: 90 }}
                min={0}
              />
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '12px 20px', background: '#fee', color: '#c33' }}>
            {error}
          </div>
        )}

        <div className='recipes-body'>
          {tab === 'generate' && (
            <>
              {loading && (
                <div className='card' style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div className='loading-spinner' style={{
                      width: 48,
                      height: 48,
                      border: '4px solid var(--border)',
                      borderTopColor: 'var(--primary)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        Generating Recipes...
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                        AI is analyzing your pantry and creating personalized recipes. This may take 15-30 seconds.
                      </div>
                    </div>
                    <button
                      className='btn-outline'
                      onClick={handleCancelGeneration}
                      style={{ marginTop: '0.5rem' }}
                    >
                      Cancel Generation
                    </button>
                  </div>
                  <style>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              )}

              {!loading && generatedRecipes.length === 0 && !error && (
                <div className='card' style={{ padding: 40, textAlign: 'center' }}>
                  Click "Generate" to create recipe suggestions based on your pantry inventory.
                </div>
              )}

              {!loading && filteredGenerated.length > 0 && (
                <div className='recipe-grid'>
                  {filteredGenerated.map((r) => (
                    <div key={r.id} className='recipe-card card'>
                      <div className='recipe-head'>
                        <div className='recipe-title'>{r.title}</div>
                        <div className='recipe-meta'>
                          <span className='chip'>{r.minutes} min</span>
                          <span className='chip'>{r.servings} srv</span>
                        </div>
                      </div>

                      <div className='recipe-tags'>
                        {r.tags.map((t) => (
                          <span
                            key={t}
                            className={`tag ${tag === t ? 'tag-active' : ''}`}
                            onClick={() => setTag(tag === t ? 'all' : t)}
                            style={{ cursor: 'pointer' }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <div className='recipe-macros'>
                        <div><span className='macro-label'>kcal</span><span className='macro-val'>{r.kcal}</span></div>
                        <div><span className='macro-label'>P</span><span className='macro-val'>{r.protein}g</span></div>
                        <div><span className='macro-label'>C</span><span className='macro-val'>{r.carbs}g</span></div>
                        <div><span className='macro-label'>F</span><span className='macro-val'>{r.fat}g</span></div>
                      </div>

                      <div className='recipe-actions'>
                        <button className='btn-primary' onClick={() => setActive(r)}>View</button>
                        <button
                          className='btn-soft'
                          onClick={() => handleSaveRecipe(r)}
                          disabled={saving === r.id}
                        >
                          {saving === r.id ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && generatedRecipes.length > 0 && filteredGenerated.length === 0 && (
                <div className='card' style={{ padding: 20 }}>No recipes match your filters.</div>
              )}
            </>
          )}

          {tab === 'saved' && (
            <>
              {savedLoading && (
                <div className='card' style={{ padding: 40, textAlign: 'center' }}>
                  Loading recipes...
                </div>
              )}

              {!savedLoading && savedRecipes.length === 0 && (
                <div className='card' style={{ padding: 40, textAlign: 'center' }}>
                  No saved recipes yet. Generate recipes and save the ones you like, or add your own!
                </div>
              )}

              {!savedLoading && savedRecipes.length > 0 && filteredSaved.length === 0 && (
                <div className='card' style={{ padding: 40, textAlign: 'center' }}>
                  No recipes match your filters.
                </div>
              )}

              {!savedLoading && filteredSaved.length > 0 && (
                <div className='recipe-grid'>
                  {filteredSaved.map((r) => (
                    <div key={r._id} className='recipe-card card'>
                      <div className='recipe-head'>
                        <div>
                          <div className='recipe-title' style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {r.title}
                            {r.isFavorite && <span style={{ color: '#ef4444' }}>*</span>}
                            {r.isCustom && <span className='tag' style={{ fontSize: '0.65rem' }}>Custom</span>}
                          </div>
                          {r.createdByName && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
                              by {r.createdByName}
                            </div>
                          )}
                        </div>
                        <div className='recipe-meta'>
                          <span className='chip'>{r.minutes} min</span>
                          <span className='chip'>{r.servings} srv</span>
                        </div>
                      </div>

                      <div className='recipe-tags'>
                        {r.tags?.map((t) => (
                          <span
                            key={t}
                            className={`tag ${tag === t ? 'tag-active' : ''}`}
                            onClick={() => setTag(tag === t ? 'all' : t)}
                            style={{ cursor: 'pointer' }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <div className='recipe-macros'>
                        <div><span className='macro-label'>kcal</span><span className='macro-val'>{r.kcal}</span></div>
                        <div><span className='macro-label'>P</span><span className='macro-val'>{r.protein}g</span></div>
                        <div><span className='macro-label'>C</span><span className='macro-val'>{r.carbs}g</span></div>
                        <div><span className='macro-label'>F</span><span className='macro-val'>{r.fat}g</span></div>
                      </div>

                      <div className='recipe-actions'>
                        <button className='btn-primary' onClick={() => setActive(r)}>View</button>
                        <button className='btn-soft' onClick={() => handleToggleFavorite(r._id)}>
                          {r.isFavorite ? 'Unfavorite' : 'Favorite'}
                        </button>
                        <button
                          className='btn-outline'
                          style={{ color: '#dc2626', borderColor: '#fecaca' }}
                          onClick={(e) => handleDeleteRecipe(r._id, e)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'history' && (
            <>
              {historyLoading && (
                <div className='card' style={{ padding: 40, textAlign: 'center' }}>
                  Loading history...
                </div>
              )}

              {!historyLoading && history.length === 0 && (
                <div className='card' style={{ padding: 40, textAlign: 'center' }}>
                  No recipe generation history yet. Generate some recipes to see them here!
                </div>
              )}

              {!historyLoading && history.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                  {history.map((item) => (
                    <div key={item._id} className='card' style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {item.prompt && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                              Prompt: "{item.prompt}"
                            </div>
                          )}
                        </div>
                        <button
                          className='btn-outline'
                          style={{ color: '#dc2626', borderColor: '#fecaca' }}
                          onClick={() => handleDeleteHistoryItem(item._id)}
                        >
                          Delete
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {item.recipes.map((recipe, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.75rem',
                              background: 'var(--bg)',
                              borderRadius: '8px',
                              border: '1px solid var(--border)'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500, color: 'var(--text)' }}>{recipe.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                {recipe.minutes} min • {recipe.servings} srv • {recipe.kcal} kcal
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className='btn-soft btn-sm'
                                onClick={() => setActive(recipe)}
                              >
                                View
                              </button>
                              <button
                                className='btn-primary btn-sm'
                                onClick={() => handleSaveFromHistory(recipe)}
                                disabled={saving === recipe.id}
                              >
                                {saving === recipe.id ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {active && (
        <div className='modal-backdrop' onClick={() => setActive(null)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <div className='modal-title' style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {active.title}
                {isSavedRecipe(active) && active.isFavorite && <span style={{ color: '#ef4444' }}>*</span>}
              </div>
              <button className='btn-outline' onClick={() => setActive(null)}>Close</button>
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
                      <li key={idx}>{i.name} {i.amount && `— ${i.amount}`}</li>
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
              {isSavedRecipe(active) ? (
                <>
                  <button
                    className='btn-outline'
                    style={{ color: '#dc2626', borderColor: '#dc2626' }}
                    onClick={() => handleDeleteRecipe(active._id)}
                  >
                    Delete
                  </button>
                  <button className='btn-soft' onClick={() => handleToggleFavorite(active._id)}>
                    {active.isFavorite ? 'Unfavorite' : 'Favorite'}
                  </button>
                </>
              ) : (
                <button
                  className='btn-soft'
                  onClick={() => handleSaveRecipe(active as GeneratedRecipe)}
                  disabled={saving === active.id}
                >
                  {saving === active.id ? 'Saving...' : 'Save Recipe'}
                </button>
              )}
              <button className='btn-primary' onClick={() => setActive(null)}>Done</button>
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
                <button type='button' className='btn-outline' onClick={() => setShowAddModal(false)}>Close</button>
              </div>
              <div className='modal-body' style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Recipe Title *</label>
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
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Prep Time (min)</label>
                      <input
                        className='input'
                        type='number'
                        min={0}
                        value={newRecipe.minutes}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, minutes: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Servings</label>
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tags (comma separated)</label>
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
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.85rem' }}>Calories</label>
                      <input className='input' type='number' min={0} value={newRecipe.kcal} onChange={(e) => setNewRecipe(prev => ({ ...prev, kcal: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.85rem' }}>Protein</label>
                      <input className='input' type='number' min={0} value={newRecipe.protein} onChange={(e) => setNewRecipe(prev => ({ ...prev, protein: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.85rem' }}>Carbs</label>
                      <input className='input' type='number' min={0} value={newRecipe.carbs} onChange={(e) => setNewRecipe(prev => ({ ...prev, carbs: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.85rem' }}>Fat</label>
                      <input className='input' type='number' min={0} value={newRecipe.fat} onChange={(e) => setNewRecipe(prev => ({ ...prev, fat: Number(e.target.value) }))} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Ingredients (one per line: Name - Amount)</label>
                    <textarea
                      className='input'
                      value={newRecipe.ingredients}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, ingredients: e.target.value }))}
                      placeholder={'Chicken breast - 500g\nSoy sauce - 2 tbsp'}
                      rows={4}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Steps (one per line)</label>
                    <textarea
                      className='input'
                      value={newRecipe.steps}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, steps: e.target.value }))}
                      placeholder={'Cut chicken into cubes\nHeat oil in a pan'}
                      rows={4}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
              <div className='modal-footer'>
                <button type='button' className='btn-outline' onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type='submit' className='btn-primary'>Add Recipe</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
