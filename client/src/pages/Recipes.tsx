import { useMemo, useState } from 'react';

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

const RECIPES: Recipe[] = [
  {
    id: 'r1',
    title: 'High-Protein Chicken Rice Bowl',
    minutes: 20,
    servings: 2,
    tags: ['quick', 'pantry-friendly'],
    kcal: 560,
    protein: 45,
    carbs: 60,
    fat: 15,
    ingredients: [
      { name: 'Chicken Breast', amount: '300 g' },
      { name: 'Jasmine Rice (cooked)', amount: '2 cups' },
      { name: 'Olive Oil', amount: '1 tbsp' },
      { name: 'Salt & Pepper', amount: 'to taste' },
    ],
    steps: [
      'Cook or reheat rice.',
      'Sear chicken in oil, season, and slice.',
      'Assemble bowls and serve.',
    ],
  },
  {
    id: 'r2',
    title: 'Greek Yogurt Parfait',
    minutes: 5,
    servings: 1,
    tags: ['breakfast', 'no-cook'],
    kcal: 300,
    protein: 25,
    carbs: 40,
    fat: 5,
    ingredients: [
      { name: 'Greek Yogurt', amount: '200 g' },
      { name: 'Oats (dry)', amount: '30 g' },
      { name: 'Honey', amount: '1 tbsp' },
    ],
    steps: [
      'Layer yogurt, oats, and honey in a bowl.',
      'Top with fruit or nuts if available.',
    ],
  },
  {
    id: 'r3',
    title: 'Olive Oil Fried Rice',
    minutes: 12,
    servings: 2,
    tags: ['quick', 'leftovers'],
    kcal: 520,
    protein: 12,
    carbs: 75,
    fat: 18,
    ingredients: [
      { name: 'Jasmine Rice (cold)', amount: '2 cups' },
      { name: 'Olive Oil', amount: '1.5 tbsp' },
      { name: 'Eggs (optional)', amount: '2' },
      { name: 'Salt & Pepper', amount: 'to taste' },
    ],
    steps: [
      'Heat oil, add rice and fry.',
      'Push aside, scramble eggs, combine and season.',
    ],
  },
];

export default function Recipes() {
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | 'all'>('all');
  const [active, setActive] = useState<Recipe | null>(null);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    RECIPES.forEach((r) => r.tags.forEach((t) => s.add(t)));
    return ['all', ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return RECIPES.filter((r) => {
      const matchesQ = !s || r.title.toLowerCase().includes(s);
      const matchesTag = tag === 'all' || r.tags.includes(tag);
      return matchesQ && matchesTag;
    });
  }, [q, tag]);

  return (
    <>
      <section className='card table-card' style={{ padding: 0 }}>
        <div className='table-header'>
          <div className='table-title'>Recipes</div>
          <div className='table-actions' style={{ gap: 10 }}>
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
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='recipes-body'>
          <div className='recipe-grid'>
            {filtered.map((r) => (
              <div key={r.id} className='recipe-card card'>
                <div className='recipe-head'>
                  <div className='recipe-title'>{r.title}</div>
                  <div className='recipe-meta'>
                    <span className='chip'>{r.minutes} min</span>
                    <span className='chip'>{r.servings} servings</span>
                  </div>
                </div>

                <div className='recipe-tags'>
                  {r.tags.map((t) => (
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
                  <button className='btn-soft'>Cook from Pantry</button>
                  <button className='btn-outline'>Shopping List</button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className='card' style={{ padding: 20 }}>
                No recipes match your filters.
              </div>
            )}
          </div>
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
                    {active.ingredients.map((i, idx) => (
                      <li key={idx}>
                        {i.name} — {i.amount}
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
