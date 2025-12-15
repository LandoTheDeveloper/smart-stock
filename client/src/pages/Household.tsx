import { useState, useEffect } from 'react';
import { api } from '../lib/api';

type HouseholdMember = {
  userId: string;
  role: 'owner' | 'member';
  joinedAt: string;
  name: string;
};

type Household = {
  _id: string;
  name: string;
  inviteCode: string;
  inviteCodeExpiresAt: string;
  members: HouseholdMember[];
};

type HouseholdSummary = {
  _id: string;
  name: string;
  role: 'owner' | 'member';
  memberCount: number;
};

export default function Household() {
  const [activeHousehold, setActiveHousehold] = useState<Household | null>(null);
  const [allHouseholds, setAllHouseholds] = useState<HouseholdSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create household form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [creating, setCreating] = useState(false);

  // Join household form
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Edit household
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    fetchHouseholdData();
  }, []);

  const fetchHouseholdData = async () => {
    setLoading(true);
    try {
      const [activeRes, allRes] = await Promise.all([
        api.get<{ success: boolean; data: Household | null }>('/api/household'),
        api.get<{ success: boolean; data: HouseholdSummary[] }>('/api/household/all')
      ]);
      if (activeRes.data.success) {
        setActiveHousehold(activeRes.data.data);
      }
      if (allRes.data.success) {
        setAllHouseholds(allRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch household data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateHousehold = async () => {
    if (!newHouseholdName.trim()) return;
    setCreating(true);
    try {
      const response = await api.post<{ success: boolean; message: string }>('/api/household', {
        name: newHouseholdName.trim()
      });
      if (response.data.success) {
        showMessage('success', 'Household created!');
        setNewHouseholdName('');
        setShowCreateForm(false);
        fetchHouseholdData();
      }
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to create household');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const response = await api.post<{ success: boolean; message: string }>('/api/household/join', {
        inviteCode: joinCode.trim().toUpperCase()
      });
      if (response.data.success) {
        showMessage('success', 'Joined household!');
        setJoinCode('');
        setShowJoinForm(false);
        fetchHouseholdData();
      }
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to join household');
    } finally {
      setJoining(false);
    }
  };

  const handleSwitchHousehold = async (householdId: string) => {
    try {
      const response = await api.put<{ success: boolean; message: string }>(`/api/household/${householdId}/switch`);
      if (response.data.success) {
        showMessage('success', 'Switched household');
        fetchHouseholdData();
      }
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to switch household');
    }
  };

  const handleGoPersonal = async () => {
    try {
      const response = await api.post<{ success: boolean; message: string }>('/api/household/personal');
      if (response.data.success) {
        showMessage('success', 'Switched to personal mode');
        fetchHouseholdData();
      }
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to switch to personal mode');
    }
  };

  const handleUpdateName = async () => {
    if (!activeHousehold || !editedName.trim()) return;
    try {
      const response = await api.put<{ success: boolean; message: string }>(`/api/household/${activeHousehold._id}`, {
        name: editedName.trim()
      });
      if (response.data.success) {
        showMessage('success', 'Household name updated');
        setEditingName(false);
        fetchHouseholdData();
      }
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to update household name');
    }
  };

  const handleRegenerateCode = async () => {
    if (!activeHousehold) return;
    try {
      const response = await api.post<{ success: boolean; message: string }>(`/api/household/${activeHousehold._id}/regenerate-code`);
      if (response.data.success) {
        showMessage('success', 'Invite code regenerated');
        fetchHouseholdData();
      }
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to regenerate code');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeHousehold) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/api/household/${activeHousehold._id}/members/${memberId}`);
      if (response.data.success) {
        showMessage('success', 'Member removed');
        fetchHouseholdData();
      }
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleLeaveHousehold = async () => {
    if (!activeHousehold) return;
    if (!window.confirm('Are you sure you want to leave this household?')) return;
    try {
      const response = await api.post<{ success: boolean; message: string }>(`/api/household/${activeHousehold._id}/leave`);
      if (response.data.success) {
        showMessage('success', 'Left household');
        fetchHouseholdData();
      }
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to leave household');
    }
  };

  const handleDeleteHousehold = async () => {
    if (!activeHousehold) return;
    if (!window.confirm('Are you sure you want to delete this household? This action cannot be undone.')) return;
    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/api/household/${activeHousehold._id}`);
      if (response.data.success) {
        showMessage('success', 'Household deleted');
        fetchHouseholdData();
      }
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to delete household');
    }
  };

  const copyInviteCode = () => {
    if (!activeHousehold) return;
    navigator.clipboard.writeText(activeHousehold.inviteCode);
    showMessage('success', 'Invite code copied!');
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    if (diffMs <= 0) return 'Expired';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Find current user's role from all households
  const currentUserRole = allHouseholds.find(h => h._id === activeHousehold?._id)?.role || 'member';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ color: 'var(--muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

      {/* Active Household Section */}
      <section className='card'>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Current Mode</h2>
        </div>
        <div style={{ padding: '1rem' }}>
          {activeHousehold ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  {editingName ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        className='input'
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        style={{ width: 200 }}
                      />
                      <button className='btn-primary btn-sm' onClick={handleUpdateName}>Save</button>
                      <button className='btn-soft btn-sm' onClick={() => setEditingName(false)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeHousehold.name}</span>
                      <span className='tag'>{currentUserRole === 'owner' ? 'Owner' : 'Member'}</span>
                      {currentUserRole === 'owner' && (
                        <button
                          className='btn-soft btn-sm'
                          onClick={() => {
                            setEditedName(activeHousehold.name);
                            setEditingName(true);
                          }}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    {activeHousehold.members.length} member{activeHousehold.members.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <button className='btn-outline btn-sm' onClick={handleGoPersonal}>
                  Go Personal
                </button>
              </div>

              {/* Invite Code */}
              <div style={{ background: 'var(--bg-soft)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>Invite Code</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    Expires in: {getTimeUntilExpiry(activeHousehold.inviteCodeExpiresAt)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <code style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textAlign: 'center'
                  }}>
                    {activeHousehold.inviteCode}
                  </code>
                  <button className='btn-soft' onClick={copyInviteCode} title='Copy'>
                    Copy
                  </button>
                  {currentUserRole === 'owner' && (
                    <button className='btn-soft' onClick={handleRegenerateCode} title='Regenerate'>
                      New Code
                    </button>
                  )}
                </div>
              </div>

              {/* Members List */}
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Members</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeHousehold.members.map((member) => (
                    <div
                      key={member.userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: 'var(--bg-soft)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'var(--primary-10)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700
                        }}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{member.name}</div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                            {member.role === 'owner' ? 'Owner' : 'Member'} · Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {currentUserRole === 'owner' && member.role !== 'owner' && (
                        <button
                          className='btn-outline btn-sm'
                          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                {currentUserRole !== 'owner' && (
                  <button
                    className='btn-outline'
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={handleLeaveHousehold}
                  >
                    Leave Household
                  </button>
                )}
                {currentUserRole === 'owner' && (
                  <button
                    className='btn-outline'
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={handleDeleteHousehold}
                  >
                    Delete Household
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Personal Mode</div>
              <div style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
                You're using your personal pantry and lists.
                Create or join a household to share with family members.
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className='btn-primary' onClick={() => setShowCreateForm(true)}>
                  Create Household
                </button>
                <button className='btn-soft' onClick={() => setShowJoinForm(true)}>
                  Join with Code
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Create Household Form */}
      {showCreateForm && (
        <section className='card'>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Create New Household</h2>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Household Name
              </label>
              <input
                className='input'
                placeholder='e.g., Smith Family'
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className='btn-primary' onClick={handleCreateHousehold} disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button className='btn-soft' onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Join Household Form */}
      {showJoinForm && (
        <section className='card'>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Join Household</h2>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Invite Code
              </label>
              <input
                className='input'
                placeholder='Enter 8-character code'
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                style={{ width: '100%', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                maxLength={8}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className='btn-primary' onClick={handleJoinHousehold} disabled={joining}>
                {joining ? 'Joining...' : 'Join'}
              </button>
              <button className='btn-soft' onClick={() => setShowJoinForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* All Households */}
      {allHouseholds.length > 0 && (
        <section className='card'>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Your Households</h2>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {allHouseholds.map((household) => (
                <div
                  key={household._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: household._id === activeHousehold?._id ? 'var(--primary-10)' : 'var(--bg-soft)',
                    borderRadius: '8px',
                    border: household._id === activeHousehold?._id ? '1px solid var(--primary)' : '1px solid transparent'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{household.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {household.role === 'owner' ? 'Owner' : 'Member'} · {household.memberCount} member{household.memberCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {household._id === activeHousehold?._id ? (
                    <span className='tag tag-active'>Active</span>
                  ) : (
                    <button
                      className='btn-soft btn-sm'
                      onClick={() => handleSwitchHousehold(household._id)}
                    >
                      Switch
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!activeHousehold && (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                <button className='btn-primary' onClick={() => setShowCreateForm(true)}>
                  Create New
                </button>
                <button className='btn-soft' onClick={() => setShowJoinForm(true)}>
                  Join Another
                </button>
              </div>
            )}
            {activeHousehold && (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                <button className='btn-soft' onClick={() => setShowCreateForm(true)}>
                  Create New
                </button>
                <button className='btn-soft' onClick={() => setShowJoinForm(true)}>
                  Join Another
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
