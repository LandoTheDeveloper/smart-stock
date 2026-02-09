import { useState, type FormEvent } from 'react';
import { FaComment, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

type FeedbackType = 'ui' | 'bug' | 'workflow' | 'feature';

export default function FeedbackButton() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't render anything if user is not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
        console.log('Submitting feedback:', { type, title, description }); // Debug log

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            type,
            title,
            description,
            email: email || undefined,
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timestamp: new Date().toISOString(),
        }),
        });

        console.log('Response status:', response.status); // Debug log
        console.log('Response headers:', response.headers); // Debug log

        // Check if response has content before parsing
        const text = await response.text();
        console.log('Response text:', text); // Debug log

        if (!text) {
        throw new Error('Empty response from server');
        }

        let data;
        try {
        data = JSON.parse(text);
        } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response format from server');
        }

        if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to submit feedback');
        }

        setSuccess(true);
        // Reset form after 2 seconds
        setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setTitle('');
        setDescription('');
        setEmail('');
        setType('bug');
        }, 2000);
    } catch (e: any) {
        console.error('Full error:', e); // Debug log
        setError(e.message || 'Failed to submit feedback');
    } finally {
        setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setError(null);
    setSuccess(false);
  };

  const feedbackTypes = [
    { value: 'bug' as FeedbackType, label: '🐛 Bug Report', description: 'Something isn\'t working' },
    { value: 'ui' as FeedbackType, label: '🎨 UI/UX', description: 'Design or usability issue' },
    { value: 'workflow' as FeedbackType, label: '⚡ Workflow', description: 'Process improvement' },
    { value: 'feature' as FeedbackType, label: '💡 Feature Request', description: 'Suggest new functionality' },
  ];

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        className="feedback-float-btn"
        onClick={() => setShowModal(true)}
        aria-label="Send feedback"
        title="Send feedback"
      >
        <FaComment />
      </button>

      {/* Feedback Modal */}
      {showModal &&  (
        <div className="feedback-overlay" onClick={closeModal}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            <button className="feedback-close" onClick={closeModal}>
              <FaTimes />
            </button>

            <h2 className="feedback-title">Send Feedback</h2>
            <p className="feedback-subtitle">
              Help us improve SmartStock by sharing your thoughts
            </p>

            {success ? (
              <div className="feedback-success">
                <div className="success-icon">✓</div>
                <h3>Thank you!</h3>
                <p>Your feedback has been submitted successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="feedback-form">
                {/* Feedback Type Selection */}
                <div className="feedback-type-grid">
                  {feedbackTypes.map((ft) => (
                    <label
                      key={ft.value}
                      className={`feedback-type-card ${type === ft.value ? 'active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={ft.value}
                        checked={type === ft.value}
                        onChange={(e) => setType(e.target.value as FeedbackType)}
                      />
                      <div className="type-label">{ft.label}</div>
                      <div className="type-description">{ft.description}</div>
                    </label>
                  ))}
                </div>

                {/* Title */}
                <div className="feedback-field">
                  <label htmlFor="feedback-title">Title</label>
                  <input
                    id="feedback-title"
                    type="text"
                    className="feedback-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary of your feedback"
                    required
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="feedback-field">
                  <label htmlFor="feedback-description">
                    Description
                    <span className="char-count">
                      {description.length}/500
                    </span>
                  </label>
                  <textarea
                    id="feedback-description"
                    className="feedback-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide as much detail as possible..."
                    required
                    maxLength={500}
                    rows={5}
                  />
                </div>

                {/* Optional Email */}
                <div className="feedback-field">
                  <label htmlFor="feedback-email">
                    Email (optional)
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    className="feedback-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  <small className="field-hint">
                    We'll only use this to follow up on your feedback
                  </small>
                </div>

                {error && (
                  <div className="feedback-error">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="feedback-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}