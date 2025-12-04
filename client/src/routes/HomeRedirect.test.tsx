import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import HomeRedirect from './HomeRedirect';

const mockAuthValue: { user: any; loading: boolean } = {
  user: null,
  loading: false,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthValue,
}));

describe('HomeRedirect', () => {
  it('renders loading state', () => {
    mockAuthValue.loading = true;
    mockAuthValue.user = null;

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomeRedirect />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    mockAuthValue.loading = false;
    mockAuthValue.user = null;

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomeRedirect />} />
          <Route path='/login' element={<div>LoginPage</div>} />
          <Route path='/dashboard' element={<div>DashboardPage</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('LoginPage')).toBeInTheDocument();
  });

  it('redirects to dashboard when authenticated', () => {
    mockAuthValue.loading = false;
    mockAuthValue.user = { id: '1', email: 'test@example.com' };

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomeRedirect />} />
          <Route path='/login' element={<div>LoginPage</div>} />
          <Route path='/dashboard' element={<div>DashboardPage</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('DashboardPage')).toBeInTheDocument();
  });
});
