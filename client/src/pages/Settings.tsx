import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const DIETARY_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Keto',
  'Low-Carb',
  'High-Protein',
  'Gluten-Free',
  'Dairy-Free',
  'Halal',
  'Kosher'
];

const COMMON_ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame'
];

type UserPreferences = {
  dietaryPreferences: string[];
  allergies: string[];
  customAllergies: string;
  avoidIngredients: string;
  calorieTarget: number;
  proteinTarget: number;
  cuisinePreferences: string;
};

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryPreferences: [],
    allergies: [],
    customAllergies: '',
    avoidIngredients: '',
    calorieTarget: 0,
    proteinTarget: 0,
    cuisinePreferences: ''
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get<{ success: boolean; data: UserPreferences }>('/api/user/preferences');
      if (response.data.success && response.data.data) {
        setPreferences(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await api.put('/api/user/preferences', preferences);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDietaryPref = (pref: string) => {
    setPreferences(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(pref)
        ? prev.dietaryPreferences.filter(p => p !== pref)
        : [...prev.dietaryPreferences, pref]
    }));
  };

  const toggleAllergy = (allergy: string) => {
    setPreferences(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className='card'>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Appearance</h2>
        </div>
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Theme</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Choose between light and dark mode
              </div>
            </div>
            <button
              className='btn-soft'
              onClick={toggleTheme}
              style={{ minWidth: 100 }}
            >
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </div>
      </section>

      <section className='card'>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Account</h2>
        </div>
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Name</span>
              <div style={{ fontWeight: 600 }}>{user?.name || 'Not set'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Email</span>
              <div style={{ fontWeight: 600 }}>{user?.email}</div>
            </div>
          </div>
        </div>
      </section>

      <section className='card'>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Recipe Preferences</h2>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            These preferences will be used when generating recipe suggestions
          </p>
        </div>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem' }}>
              Dietary Preferences
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {DIETARY_PREFERENCES.map(pref => (
                <button
                  key={pref}
                  type='button'
                  className={`tag ${preferences.dietaryPreferences.includes(pref) ? 'tag-active' : ''}`}
                  onClick={() => toggleDietaryPref(pref)}
                  style={{ cursor: 'pointer' }}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem' }}>
              Allergies
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {COMMON_ALLERGIES.map(allergy => (
                <button
                  key={allergy}
                  type='button'
                  className={`tag ${preferences.allergies.includes(allergy) ? 'tag-active' : ''}`}
                  onClick={() => toggleAllergy(allergy)}
                  style={{ cursor: 'pointer' }}
                >
                  {allergy}
                </button>
              ))}
            </div>
            <input
              className='input'
              placeholder='Other allergies (comma separated)'
              value={preferences.customAllergies}
              onChange={(e) => setPreferences(prev => ({ ...prev, customAllergies: e.target.value }))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Ingredients to Avoid
            </label>
            <input
              className='input'
              placeholder='e.g., cilantro, olives, anchovies'
              value={preferences.avoidIngredients}
              onChange={(e) => setPreferences(prev => ({ ...prev, avoidIngredients: e.target.value }))}
              style={{ width: '100%' }}
            />
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.8rem' }}>
              Comma-separated list of ingredients you don't like
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Cuisine Preferences
            </label>
            <input
              className='input'
              placeholder='e.g., Italian, Mexican, Asian, Mediterranean'
              value={preferences.cuisinePreferences}
              onChange={(e) => setPreferences(prev => ({ ...prev, cuisinePreferences: e.target.value }))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Daily Calorie Target
              </label>
              <input
                className='input'
                type='number'
                placeholder='e.g., 2000'
                value={preferences.calorieTarget || ''}
                onChange={(e) => setPreferences(prev => ({ ...prev, calorieTarget: Number(e.target.value) || 0 }))}
                min={0}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Daily Protein Target (g)
              </label>
              <input
                className='input'
                type='number'
                placeholder='e.g., 150'
                value={preferences.proteinTarget || ''}
                onChange={(e) => setPreferences(prev => ({ ...prev, proteinTarget: Number(e.target.value) || 0 }))}
                min={0}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </section>

      {message && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: message.type === 'success' ? 'var(--primary-10)' : 'var(--danger-bg)',
            color: message.type === 'success' ? 'var(--primary)' : 'var(--danger)',
            fontWeight: 500
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className='btn-primary' onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
