import { useMemo, useState } from 'react';
import { api } from '../lib/api';

type Recipe = {
  id: string;
  title: string;
  minutes: number;
  servings: number;
  tags: string[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: { name: string; amount: string }[];
  steps: string[];
};

export default function Recipes() {
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | 'all'>('all');
  const [active, setActive] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userPrompt, setUserPrompt] = useState('');

  const handleGenerateRecipes = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        userPrompt: userPrompt.trim() || undefined,
      };

      const response = await api.post('/api/generate/recipes', payload);

      if (response.data.success) {
        setRecipes(response.data.recipes);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate recipes');
    } finally {
      setLoading(false);
    }
  };

  const allTags = useMemo(() => {
    const s = new Set<string>();
    recipes.forEach((r: Recipe) => r.tags.forEach((t: string) => s.add(t)));
    return ['all', ...Array.from(s)];
  }, [recipes]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return recipes.filter((r: Recipe) => {
      const matchesQ = !s || r.title.toLowerCase().includes(s);
      const matchesTag = tag === 'all' || r.tags.includes(tag);
      return matchesQ && matchesTag;
    });
  }, [q, tag, recipes]);

  return (
    <>
      <section className='card table-card' style={{ padding: 0 }}>
        <div className='table-header'>
          <div className='table-title'>Recipes</div>
          <div className='table-actions' style={{ gap: 10 }}>
            <input
              className='input'
              placeholder='Optional: Add requirements (e.g., vegetarian, quick, etc.)'
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              style={{ minWidth: 300 }}
            />
            <button
              className='btn-primary'
              onClick={handleGenerateRecipes}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Recipes'}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{ padding: '12px 20px', background: '#fee', color: '#c33' }}
          >
            {error}
          </div>
        )}

        {recipes.length > 0 && (
          <div
            className='table-header'
            style={{ borderTop: '1px solid #e5e7eb' }}
          >
            <div className='table-actions' style={{ gap: 10, width: '100%' }}>
              <input
                className='input'
                placeholder='Search recipes…'
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select
                className='input'
                style={{ paddingRight: 28 }}
                value={tag}
                onChange={(e) => setTag(e.target.value as any)}
              >
                {allTags.map((t: string) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className='recipes-body'>
          {loading && (
            <div className='card' style={{ padding: 40, textAlign: 'center' }}>
              Generating recipes from your pantry inventory...
            </div>
          )}

          {!loading && recipes.length === 0 && !error && (
            <div className='card' style={{ padding: 40, textAlign: 'center' }}>
              Click "Generate Recipes" to create recipe suggestions based on
              your pantry inventory.
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className='recipe-grid'>
              {filtered.map((r: Recipe) => (
                <div key={r.id} className='recipe-card card'>
                  <div className='recipe-head'>
                    <div className='recipe-title'>{r.title}</div>
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
                    <button
                      className='btn-primary'
                      onClick={() => setActive(r)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && recipes.length > 0 && filtered.length === 0 && (
            <div className='card' style={{ padding: 20 }}>
              No recipes match your filters.
            </div>
          )}
        </div>
      </section>

      {active && (
        <div className='modal-backdrop' onClick={() => setActive(null)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <div className='modal-title'>{active.title}</div>
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
                    {active.ingredients.map(
                      (i: { name: string; amount: string }, idx: number) => (
                        <li key={idx}>
                          {i.name} — {i.amount}
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div className='detail-col'>
                  <div className='detail-title'>Steps</div>
                  <ol>
                    {active.steps.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
            <div className='modal-footer'>
              <button className='btn-primary' onClick={() => setActive(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
