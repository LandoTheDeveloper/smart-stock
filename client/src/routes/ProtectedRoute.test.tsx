import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';

const mockAuthValue: { user: any; loading: boolean } = {
  user: null,
  loading: false,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthValue,
}));

describe('ProtectedRoute', () => {
  it('renders loading state', () => {
    mockAuthValue.loading = true;
    mockAuthValue.user = null;

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path='/protected' element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    mockAuthValue.loading = false;
    mockAuthValue.user = null;

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path='/protected' element={<div>Secret</div>} />
          </Route>
          <Route path='/login' element={<div>LoginPage</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('LoginPage')).toBeInTheDocument();
  });

  it('renders child route when authenticated', () => {
    mockAuthValue.loading = false;
    mockAuthValue.user = { id: '1', email: 'test@example.com' };

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path='/protected' element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Secret')).toBeInTheDocument();
  });
});
