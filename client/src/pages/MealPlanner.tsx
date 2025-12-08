import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';

type Ingredient = {
  name: string;
  amount: string;
};

type Recipe = {
  id?: string;
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

type MealPlan = {
  _id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe: Recipe;
  completed: boolean;
  notes?: string;
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
};

type IngredientComparison = {
  ingredient: string;
  amountsNeeded: string[];
  inPantry: { quantity: number; unit?: string } | null;
  status: 'have' | 'need';
};

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function MealPlanner() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<typeof MEAL_TYPES[number]>('dinner');

  // Recipe generation
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [generatingRecipes, setGeneratingRecipes] = useState(false);
  const [recipePrompt, setRecipePrompt] = useState('');

  // Saved recipes (for favorites)
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [savedRecipesLoading, setSavedRecipesLoading] = useState(false);
  const [addMealTab, setAddMealTab] = useState<'favorites' | 'generate'>('favorites');

  // Ingredient comparison
  const [ingredients, setIngredients] = useState<IngredientComparison[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  useEffect(() => {
    fetchMealPlans();
  }, [weekStart]);

  useEffect(() => {
    fetchSavedRecipes();
  }, []);

  const fetchSavedRecipes = async () => {
    try {
      setSavedRecipesLoading(true);
      const response = await api.get<{ success: boolean; data: SavedRecipe[] }>('/api/recipes');
      if (response.data.success) {
        setSavedRecipes(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch saved recipes:', err);
    } finally {
      setSavedRecipesLoading(false);
    }
  };

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ success: boolean; data: MealPlan[] }>('/api/meal-plans', {
        params: {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString()
        }
      });
      if (response.data.success) {
        setMealPlans(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch meal plans:', err);
      setError(err.response?.data?.message || 'Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  };

  const getMealsForDay = (date: Date, mealType: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return mealPlans.filter(m => {
      const mealDateStr = new Date(m.date).toISOString().split('T')[0];
      return mealDateStr === dateStr && m.mealType === mealType;
    });
  };

  const handleGenerateRecipes = async () => {
    setGeneratingRecipes(true);
    try {
      const response = await api.post('/api/generate/recipes', {
        userPrompt: recipePrompt.trim() || undefined
      });
      if (response.data.success) {
        setGeneratedRecipes(response.data.recipes);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate recipes');
    } finally {
      setGeneratingRecipes(false);
    }
  };

  const handleAddMeal = async (recipe: Recipe) => {
    if (!selectedDate) return;

    try {
      const response = await api.post<{ success: boolean; data: MealPlan }>('/api/meal-plans', {
        date: selectedDate.toISOString(),
        mealType: selectedMealType,
        recipe
      });

      if (response.data.success) {
        setMealPlans(prev => [...prev, response.data.data]);
        setShowAddModal(false);
        setGeneratedRecipes([]);
        setRecipePrompt('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add meal');
    }
  };

  const handleAddSavedRecipe = (savedRecipe: SavedRecipe) => {
    const recipe: Recipe = {
      id: savedRecipe._id,
      title: savedRecipe.title,
      minutes: savedRecipe.minutes,
      servings: savedRecipe.servings,
      tags: savedRecipe.tags,
      kcal: savedRecipe.kcal,
      protein: savedRecipe.protein,
      carbs: savedRecipe.carbs,
      fat: savedRecipe.fat,
      ingredients: savedRecipe.ingredients,
      steps: savedRecipe.steps
    };
    handleAddMeal(recipe);
  };

  const favoriteRecipes = useMemo(() => {
    return savedRecipes.filter(r => r.isFavorite);
  }, [savedRecipes]);

  const handleToggleCompleted = async (id: string) => {
    try {
      const response = await api.put<{ success: boolean; data: MealPlan }>(`/api/meal-plans/${id}/toggle`);
      if (response.data.success) {
        setMealPlans(prev => prev.map(m => m._id === id ? response.data.data : m));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update meal');
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!confirm('Remove this meal from plan?')) return;

    try {
      const response = await api.delete(`/api/meal-plans/${id}`);
      if (response.data.success) {
        setMealPlans(prev => prev.filter(m => m._id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove meal');
    }
  };

  const handleViewIngredients = async () => {
    setShowIngredientsModal(true);
    setLoadingIngredients(true);
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          totalMeals: number;
          ingredients: IngredientComparison[];
          needed: IngredientComparison[];
          have: IngredientComparison[];
        };
      }>('/api/meal-plans/ingredients', {
        params: {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString()
        }
      });
      if (response.data.success) {
        setIngredients(response.data.data.ingredients);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load ingredients');
    } finally {
      setLoadingIngredients(false);
    }
  };

  const handleGenerateShoppingList = async () => {
    try {
      const response = await api.post<{ success: boolean; message: string }>('/api/meal-plans/generate-shopping-list', {
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString()
      });
      if (response.data.success) {
        alert(response.data.message);
        setShowIngredientsModal(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate shopping list');
    }
  };

  const navigateWeek = (direction: number) => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + (direction * 7));
    setWeekStart(newStart);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const openAddModal = (date: Date, mealType: typeof MEAL_TYPES[number]) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setShowAddModal(true);
    setGeneratedRecipes([]);
    setRecipePrompt('');
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b726d' }}>
        Loading meal planner...
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
        .meal-calendar {
          display: grid;
          grid-template-columns: 80px repeat(7, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .calendar-header {
          background: var(--bg-secondary);
          padding: 0.75rem 0.5rem;
          text-align: center;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .calendar-header.today {
          background: var(--primary);
          color: white;
        }
        .meal-type-label {
          background: var(--bg-secondary);
          padding: 0.75rem 0.5rem;
          font-weight: 500;
          font-size: 0.8rem;
          text-transform: capitalize;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .meal-cell {
          background: var(--bg-primary);
          padding: 0.5rem;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .meal-cell:hover {
          background: var(--bg-secondary);
        }
        .meal-item {
          background: var(--primary-light);
          border-radius: 4px;
          padding: 0.35rem 0.5rem;
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .meal-item.completed {
          opacity: 0.6;
          text-decoration: line-through;
        }
        .meal-item:hover {
          background: var(--primary);
          color: white;
        }
        .meal-item .meal-title {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .add-meal-btn {
          background: transparent;
          border: 1px dashed var(--border);
          border-radius: 4px;
          padding: 0.25rem;
          font-size: 0.7rem;
          color: #9ca3af;
          cursor: pointer;
          margin-top: auto;
        }
        .add-meal-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .week-nav {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .week-nav button {
          padding: 0.5rem 1rem;
        }
        .week-title {
          font-weight: 600;
          min-width: 200px;
          text-align: center;
        }
        .recipe-card-small {
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .recipe-card-small:hover {
          background: var(--primary-light);
        }
        .recipe-card-small .title {
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .recipe-card-small .meta {
          font-size: 0.85rem;
          color: #6b726d;
        }
        .ingredient-row {
          display: flex;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
        }
        .ingredient-row:last-child {
          border-bottom: none;
        }
        .ingredient-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 0.75rem;
        }
        .ingredient-status.have {
          background: #22c55e;
        }
        .ingredient-status.need {
          background: #ef4444;
        }
      `}</style>

      <section className="card table-card">
        <div className="table-header">
          <div className="table-title">Meal Planner</div>
          <div className="table-actions" style={{ alignItems: 'center', gap: '0.5rem' }}>
            <div className="week-nav">
              <button className="btn-outline" onClick={() => navigateWeek(-1)}>Previous</button>
              <div className="week-title">
                {formatDate(weekStart)} - {formatDate(weekEnd)}
              </div>
              <button className="btn-outline" onClick={() => navigateWeek(1)}>Next</button>
            </div>
            <button className="btn-soft" onClick={() => setWeekStart(getStartOfWeek(new Date()))}>
              Today
            </button>
            <button className="btn-soft" onClick={handleViewIngredients}>
              View Ingredients
            </button>
          </div>
        </div>

        <div className="meal-calendar">
          {/* Header row */}
          <div className="calendar-header"></div>
          {weekDays.map(day => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={day.toISOString()} className={`calendar-header ${isToday ? 'today' : ''}`}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                <br />
                {day.getDate()}
              </div>
            );
          })}

          {/* Meal rows */}
          {MEAL_TYPES.map(mealType => (
            <>
              <div key={`label-${mealType}`} className="meal-type-label">{mealType}</div>
              {weekDays.map(day => {
                const meals = getMealsForDay(day, mealType);
                return (
                  <div key={`${day.toISOString()}-${mealType}`} className="meal-cell">
                    {meals.map(meal => (
                      <div
                        key={meal._id}
                        className={`meal-item ${meal.completed ? 'completed' : ''}`}
                        onClick={() => handleToggleCompleted(meal._id)}
                        title={`${meal.recipe.title} - Click to toggle completed`}
                      >
                        <span className="meal-title">{meal.recipe.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMeal(meal._id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '0.8rem',
                            opacity: 0.6
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      className="add-meal-btn"
                      onClick={() => openAddModal(day, mealType)}
                    >
                      + Add
                    </button>
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </section>

      {/* Add Meal Modal */}
      {showAddModal && selectedDate && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div className="modal-title">
                Add {selectedMealType} - {formatDate(selectedDate)}
              </div>
              <button className="btn-outline" onClick={() => setShowAddModal(false)}>
                Close
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => setAddMealTab('favorites')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: 'none',
                    background: addMealTab === 'favorites' ? 'var(--bg-elev)' : 'transparent',
                    borderBottom: addMealTab === 'favorites' ? '2px solid var(--primary)' : '2px solid transparent',
                    color: addMealTab === 'favorites' ? 'var(--primary)' : 'var(--muted)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  My Recipes ({savedRecipes.length})
                </button>
                <button
                  onClick={() => setAddMealTab('generate')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: 'none',
                    background: addMealTab === 'generate' ? 'var(--bg-elev)' : 'transparent',
                    borderBottom: addMealTab === 'generate' ? '2px solid var(--primary)' : '2px solid transparent',
                    color: addMealTab === 'generate' ? 'var(--primary)' : 'var(--muted)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Generate New
                </button>
              </div>

              <div style={{ padding: '1rem' }}>
                {addMealTab === 'favorites' && (
                  <>
                    {savedRecipesLoading ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                        Loading recipes...
                      </div>
                    ) : savedRecipes.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                        No saved recipes yet. Go to Recipes page to save some, or generate new ones below!
                      </div>
                    ) : (
                      <>
                        {favoriteRecipes.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text)' }}>
                              Favorites
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 200, overflowY: 'auto' }}>
                              {favoriteRecipes.map((recipe) => (
                                <div
                                  key={recipe._id}
                                  className="recipe-card-small"
                                  onClick={() => handleAddSavedRecipe(recipe)}
                                >
                                  <div className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {recipe.title}
                                    <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>★</span>
                                  </div>
                                  <div className="meta">
                                    {recipe.minutes} min • {recipe.servings} servings • {recipe.kcal} kcal
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text)' }}>
                            {favoriteRecipes.length > 0 ? 'All Saved Recipes' : 'Select a recipe to add:'}
                          </label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 250, overflowY: 'auto' }}>
                            {savedRecipes.map((recipe) => (
                              <div
                                key={recipe._id}
                                className="recipe-card-small"
                                onClick={() => handleAddSavedRecipe(recipe)}
                              >
                                <div className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {recipe.title}
                                  {recipe.isFavorite && <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>★</span>}
                                  {recipe.isCustom && <span className="tag" style={{ fontSize: '0.65rem' }}>Custom</span>}
                                </div>
                                <div className="meta">
                                  {recipe.minutes} min • {recipe.servings} servings • {recipe.kcal} kcal
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {addMealTab === 'generate' && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Generate recipes from your pantry
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          className="input"
                          placeholder="Optional: dietary preferences, cuisine type..."
                          value={recipePrompt}
                          onChange={(e) => setRecipePrompt(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button
                          className="btn-primary"
                          onClick={handleGenerateRecipes}
                          disabled={generatingRecipes}
                        >
                          {generatingRecipes ? 'Generating...' : 'Generate'}
                        </button>
                      </div>
                    </div>

                    {generatedRecipes.length > 0 && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                          Select a recipe to add:
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 300, overflowY: 'auto' }}>
                          {generatedRecipes.map((recipe, idx) => (
                            <div
                              key={idx}
                              className="recipe-card-small"
                              onClick={() => handleAddMeal(recipe)}
                            >
                              <div className="title">{recipe.title}</div>
                              <div className="meta">
                                {recipe.minutes} min • {recipe.servings} servings • {recipe.kcal} kcal
                              </div>
                              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                {recipe.tags.map(tag => (
                                  <span key={tag} className="tag" style={{ fontSize: '0.7rem' }}>{tag}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatingRecipes && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b726d' }}>
                        Generating recipes based on your pantry...
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ingredients Modal */}
      {showIngredientsModal && (
        <div className="modal-backdrop" onClick={() => setShowIngredientsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">
                Ingredients for Week
              </div>
              <button className="btn-outline" onClick={() => setShowIngredientsModal(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              {loadingIngredients ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b726d' }}>
                  Loading ingredients...
                </div>
              ) : ingredients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b726d' }}>
                  No meals planned for this week.
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#6b726d' }}>
                    <span style={{ color: '#22c55e' }}>●</span> In pantry&nbsp;&nbsp;
                    <span style={{ color: '#ef4444' }}>●</span> Need to buy
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {ingredients.map((ing, idx) => (
                      <div key={idx} className="ingredient-row">
                        <div className={`ingredient-status ${ing.status}`} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>{ing.ingredient}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6b726d' }}>
                            Needed: {ing.amountsNeeded.join(', ')}
                          </div>
                        </div>
                        {ing.inPantry && (
                          <div style={{ fontSize: '0.8rem', color: '#22c55e' }}>
                            Have: {ing.inPantry.quantity} {ing.inPantry.unit || 'units'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowIngredientsModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleGenerateShoppingList}
                disabled={ingredients.filter(i => i.status === 'need').length === 0}
              >
                Add Missing to Shopping List
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
