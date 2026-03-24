import { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../lib/api';
import { computeWeeklyMacros, computeFoodGroupDistribution } from '../lib/nutritionUtils';
import axios from 'axios';

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
  createdByName?: string;
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

  // Recipe filter selections
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  // Abort controller for cancelling recipe generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Saved recipes (for favorites)
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [savedRecipesLoading, setSavedRecipesLoading] = useState(false);
  const [addMealTab, setAddMealTab] = useState<'favorites' | 'generate'>('favorites');

  // Ingredient comparison
  const [ingredients, setIngredients] = useState<IngredientComparison[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Nutrition summary
  const [showNutritionSummary, setShowNutritionSummary] = useState(false);
  const [calorieTarget, setCalorieTarget] = useState(0);
  const [proteinTarget, setProteinTarget] = useState(0);

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
    api.get<{ success: boolean; data: { calorieTarget?: number; proteinTarget?: number } }>('/api/user/preferences')
      .then(res => {
        if (res.data.success) {
          setCalorieTarget(res.data.data.calorieTarget || 0);
          setProteinTarget(res.data.data.proteinTarget || 0);
        }
      })
      .catch(() => {});
  }, []);

  const weeklyMacros = useMemo(() => computeWeeklyMacros(mealPlans), [mealPlans]);
  const foodGroupDist = useMemo(() => computeFoodGroupDistribution(mealPlans), [mealPlans]);

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
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setGeneratingRecipes(true);
    try {
      const parts: string[] = [];
      if (selectedCuisine) parts.push(selectedCuisine + ' cuisine');
      if (selectedTime) parts.push(selectedTime);
      if (selectedDietary.length > 0) parts.push(selectedDietary.join(', '));
      if (selectedStyle) parts.push(selectedStyle);
      if (recipePrompt.trim()) parts.push(recipePrompt.trim());
      const combinedPrompt = parts.join(', ') || undefined;

      const response = await api.post('/api/generate/recipes', {
        userPrompt: combinedPrompt
      }, {
        signal: abortControllerRef.current.signal
      });
      if (response.data.success) {
        setGeneratedRecipes(response.data.recipes);
      }
    } catch (err: any) {
      if (axios.isCancel(err)) {
        // Request was cancelled by user - don't show error
        return;
      }
      alert(err.response?.data?.message || 'Failed to generate recipes');
    } finally {
      setGeneratingRecipes(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
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
    setSelectedCuisine(null);
    setSelectedTime(null);
    setSelectedDietary([]);
    setSelectedStyle(null);
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
        .recipe-filters {
          margin-bottom: 1rem;
        }
        .filter-section {
          margin-bottom: 0.75rem;
        }
        .filter-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--muted);
          margin-bottom: 0.4rem;
        }
        .filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          padding: 0.35rem 0.75rem;
          border-radius: 100px;
          border: 1px solid var(--border);
          background: var(--bg-secondary);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s;
          color: var(--text);
        }
        .chip:hover {
          border-color: var(--primary);
        }
        .chip.selected {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
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
        .nutrition-summary {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .nutrition-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .nutrition-grid {
            grid-template-columns: 1fr;
          }
        }
        .macro-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .macro-card {
          background: var(--bg-primary);
          border-radius: 8px;
          padding: 0.75rem;
        }
        .macro-label {
          font-size: 0.8rem;
          color: var(--muted);
          margin-bottom: 0.25rem;
        }
        .macro-value {
          font-size: 1.2rem;
          font-weight: 700;
        }
        .macro-target {
          font-size: 0.8rem;
          color: var(--muted);
          font-weight: 400;
        }
        .macro-bar {
          height: 6px;
          background: var(--border);
          border-radius: 3px;
          margin-top: 0.5rem;
          overflow: hidden;
        }
        .macro-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        .food-group-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .food-group-label {
          min-width: 110px;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .food-group-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .food-group-bar {
          flex: 1;
          height: 12px;
          background: var(--border);
          border-radius: 6px;
          overflow: hidden;
        }
        .food-group-bar-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.3s ease;
        }
        .food-group-pct {
          min-width: 50px;
          font-size: 0.8rem;
          text-align: right;
          color: var(--muted);
        }
        .week-totals {
          font-size: 0.8rem;
          color: var(--muted);
          margin-top: 0.75rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border);
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
            <button className="btn-soft" onClick={() => setShowNutritionSummary(v => !v)}>
              {showNutritionSummary ? 'Hide Nutrition' : 'Nutrition'}
            </button>
          </div>
        </div>

        {showNutritionSummary && mealPlans.length > 0 && (
          <div className="nutrition-summary">
            <div className="nutrition-grid">
              <div>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600 }}>Weekly Macros (Daily Avg)</h3>
                <div className="macro-cards">
                  <div className="macro-card">
                    <div className="macro-label">Calories</div>
                    <div className="macro-value">
                      {weeklyMacros.dailyAverageKcal}
                      {calorieTarget > 0 && <span className="macro-target"> / {calorieTarget}</span>}
                    </div>
                    {calorieTarget > 0 && (
                      <div className="macro-bar">
                        <div className="macro-bar-fill" style={{
                          width: `${Math.min((weeklyMacros.dailyAverageKcal / calorieTarget) * 100, 100)}%`,
                          background: weeklyMacros.dailyAverageKcal > calorieTarget * 1.1 ? '#ef4444' : '#22c55e'
                        }} />
                      </div>
                    )}
                  </div>
                  <div className="macro-card">
                    <div className="macro-label">Protein</div>
                    <div className="macro-value">
                      {weeklyMacros.dailyAverageProtein}g
                      {proteinTarget > 0 && <span className="macro-target"> / {proteinTarget}g</span>}
                    </div>
                    {proteinTarget > 0 && (
                      <div className="macro-bar">
                        <div className="macro-bar-fill" style={{
                          width: `${Math.min((weeklyMacros.dailyAverageProtein / proteinTarget) * 100, 100)}%`,
                          background: '#8B5CF6'
                        }} />
                      </div>
                    )}
                  </div>
                  <div className="macro-card">
                    <div className="macro-label">Carbs</div>
                    <div className="macro-value">{weeklyMacros.dailyAverageCarbs}g</div>
                  </div>
                  <div className="macro-card">
                    <div className="macro-label">Fat</div>
                    <div className="macro-value">{weeklyMacros.dailyAverageFat}g</div>
                  </div>
                </div>
                <div className="week-totals">
                  Week total: {weeklyMacros.totalKcal.toLocaleString()} kcal &middot; {weeklyMacros.totalProtein}g protein &middot; {weeklyMacros.totalCarbs}g carbs &middot; {weeklyMacros.totalFat}g fat
                </div>
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600 }}>Food Groups</h3>
                {[...foodGroupDist].reverse().map(fg => (
                  <div className="food-group-row" key={fg.group}>
                    <div className="food-group-label">
                      <div className="food-group-dot" style={{ background: fg.color }} />
                      {fg.group}
                    </div>
                    <div className="food-group-bar">
                      <div className="food-group-bar-fill" style={{ width: `${fg.percentage}%`, background: fg.color }} />
                    </div>
                    <div className="food-group-pct">{fg.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
                        title={`${meal.recipe.title}${meal.createdByName ? ` by ${meal.createdByName}` : ''} - Click to toggle completed`}
                      >
                        <div style={{ flex: 1 }}>
                          <span className="meal-title">{meal.recipe.title}</span>
                          {meal.createdByName && (
                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>
                              by {meal.createdByName}
                            </span>
                          )}
                        </div>
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
                    <div className="recipe-filters">
                      <div className="filter-section">
                        <div className="filter-label">Cuisine</div>
                        <div className="filter-chips">
                          {['Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'American'].map(c => (
                            <button
                              key={c}
                              className={`chip${selectedCuisine === c ? ' selected' : ''}`}
                              onClick={() => setSelectedCuisine(selectedCuisine === c ? null : c)}
                            >{c}</button>
                          ))}
                        </div>
                      </div>
                      <div className="filter-section">
                        <div className="filter-label">Prep Time</div>
                        <div className="filter-chips">
                          {['Under 15 min', 'Under 30 min', 'Under 1 hr'].map(t => (
                            <button
                              key={t}
                              className={`chip${selectedTime === t ? ' selected' : ''}`}
                              onClick={() => setSelectedTime(selectedTime === t ? null : t)}
                            >{t}</button>
                          ))}
                        </div>
                      </div>
                      <div className="filter-section">
                        <div className="filter-label">Dietary</div>
                        <div className="filter-chips">
                          {['Vegetarian', 'High Protein', 'Low Carb', 'Gluten Free'].map(d => (
                            <button
                              key={d}
                              className={`chip${selectedDietary.includes(d) ? ' selected' : ''}`}
                              onClick={() => setSelectedDietary(prev =>
                                prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
                              )}
                            >{d}</button>
                          ))}
                        </div>
                      </div>
                      <div className="filter-section">
                        <div className="filter-label">Cooking Style</div>
                        <div className="filter-chips">
                          {['One Pot', 'Sheet Pan', 'Slow Cooker', 'Air Fryer', 'No Cook'].map(s => (
                            <button
                              key={s}
                              className={`chip${selectedStyle === s ? ' selected' : ''}`}
                              onClick={() => setSelectedStyle(selectedStyle === s ? null : s)}
                            >{s}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          className="input"
                          placeholder="Anything else? (optional)"
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
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            border: '3px solid var(--border)',
                            borderTopColor: 'var(--primary)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                              Generating Recipes...
                            </div>
                            <div style={{ color: '#6b726d', fontSize: '0.85rem' }}>
                              AI is creating personalized recipes. This may take 15-30 seconds.
                            </div>
                          </div>
                          <button
                            className='btn-outline'
                            onClick={handleCancelGeneration}
                            style={{ marginTop: '0.25rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                        <style>{`
                          @keyframes spin {
                            to { transform: rotate(360deg); }
                          }
                        `}</style>
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
