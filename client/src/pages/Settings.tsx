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

type FeedbackItem = {
  _id: string;
  type: 'bug' | 'ui' | 'workflow' | 'feature';
  title: string;
  description: string;
  email?: string;
  userAgent?: string;
  screenResolution?: string;
  status: string;
  priority: string;
  createdAt: string;
};

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  console.log('User: ', user);
  console.log('Role: ', user?.role);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Feedback admin state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  useEffect(() => {
    if (showFeedback && feedback.length === 0) {
      fetchFeedback();
    }
  }, [showFeedback]);

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

  const fetchFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const response = await api.get('/api/feedback');
      setFeedback(response.data.feedback || []);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const updateFeedbackStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/api/feedback/${id}/status`, { status: newStatus });
      fetchFeedback(); // Refresh list
    } catch (error) {
      console.error('Failed to update status:', error);
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

  const handlePasswordReset = async() => {
    setSendingReset(true);
    setResetMessage(null);

    try {
      const response = await api.post('/api/auth/send-password-reset');
      if (response.data.success) {
        setResetMessage({type: 'success', text: 'Password reset email sent! Check your inbox.' });
      }
    } catch (err: any) {
      setResetMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send reset email. Please try again.'
      });
    } finally {
      setSendingReset(false);
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'bug': return '🐛';
      case 'ui': return '🎨';
      case 'workflow': return '⚡';
      case 'feature': return '💡';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#3b82f6';
      case 'in-progress': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      case 'wont-fix': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredFeedback = feedback.filter((item) => {
    const typeMatch = feedbackFilter === 'all' || item.type === feedbackFilter;
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const stats = {
    total: feedback.length,
    bugs: feedback.filter((f) => f.type === 'bug').length,
    ui: feedback.filter((f) => f.type === 'ui').length,
    workflow: feedback.filter((f) => f.type === 'workflow').length,
    feature: feedback.filter((f) => f.type === 'feature').length,
    new: feedback.filter((f) => f.status === 'new').length,
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
            <div className="input-container">
              <button 
                id="resetPasswordBtn" 
                className="auth-btn-small"
                onClick={handlePasswordReset}
                disabled={sendingReset}
                >
                  {sendingReset ? 'Sending....' : 'Reset Password'}
              </button>
              {resetMessage && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    marginBottom: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    color: resetMessage.type === 'success' ? 'var(--primary)' : 'var(--danger)',
                    fontSize: '.8rem',
                    fontWeight: 500
                  }}
                >
                  {resetMessage.text}
                </div>
              )}
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

      {/* Feedback Admin Section */}
      {user?.role === 'admin' && (
        <section className='card'>
          <div 
            style={{ 
              padding: '1rem', 
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setShowFeedback(!showFeedback)}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                📊 User Feedback {stats.new > 0 && `(${stats.new} new)`}
              </h2>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                View and manage user feedback and bug reports
              </p>
            </div>
            <button className='btn-soft' style={{ minWidth: 100 }}>
              {showFeedback ? 'Hide' : 'Show'}
            </button>
          </div>

          {showFeedback && (
            <div style={{ padding: '1rem' }}>
              {/* Stats */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ 
                  padding: '1rem', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Total</div>
                </div>
                <div style={{ 
                  padding: '1rem', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.bugs}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>🐛 Bugs</div>
                </div>
                <div style={{ 
                  padding: '1rem', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.ui}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>🎨 UI/UX</div>
                </div>
                <div style={{ 
                  padding: '1rem', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.feature}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>💡 Features</div>
                </div>
                <div style={{ 
                  padding: '1rem', 
                  background: 'var(--primary-10)', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.new}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>🆕 New</div>
                </div>
              </div>

              {/* Filters */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <select 
                  className='input'
                  value={feedbackFilter} 
                  onChange={(e) => setFeedbackFilter(e.target.value)}
                  style={{ flex: '1', minWidth: '150px' }}
                >
                  <option value="all">All Types</option>
                  <option value="bug">🐛 Bugs</option>
                  <option value="ui">🎨 UI/UX</option>
                  <option value="workflow">⚡ Workflow</option>
                  <option value="feature">💡 Features</option>
                </select>

                <select 
                  className='input'
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ flex: '1', minWidth: '150px' }}
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <button 
                  className='btn-soft'
                  onClick={fetchFeedback} 
                  disabled={loadingFeedback}
                  style={{ minWidth: '100px' }}
                >
                  {loadingFeedback ? '⟳' : '🔄'} Refresh
                </button>
              </div>

              {/* Feedback List */}
              {loadingFeedback ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading feedback...</p>
              ) : filteredFeedback.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)' }}>No feedback found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredFeedback.map((item) => (
                    <div 
                      key={item._id} 
                      style={{ 
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{getTypeEmoji(item.type)}</span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{item.title}</h4>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--muted)',
                              textTransform: 'uppercase',
                              fontWeight: 600
                            }}>
                              {item.type}
                            </span>
                          </div>
                        </div>
                        <select
                          className='input'
                          value={item.status}
                          onChange={(e) => updateFeedbackStatus(item._id, e.target.value)}
                          style={{ 
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: getStatusColor(item.status),
                            borderColor: getStatusColor(item.status)
                          }}
                        >
                          <option value="new">New</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                          <option value="wont-fix">Won't Fix</option>
                        </select>
                      </div>

                      <p style={{ 
                        margin: '0 0 0.75rem 0', 
                        color: 'var(--text)',
                        lineHeight: 1.5
                      }}>
                        {item.description}
                      </p>

                      <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        fontSize: '0.8rem', 
                        color: 'var(--muted)',
                        flexWrap: 'wrap'
                      }}>
                        {item.email && <span>📧 {item.email}</span>}
                        <span>📅 {new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.screenResolution && <span>📱 {item.screenResolution}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
      
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