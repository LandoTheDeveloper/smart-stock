import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './dashboard-theme.css';
import logo from '../assets/SmartStockLogo.png';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/pantry': 'Pantry',
  '/recipes': 'Recipes',
  '/shopping-list': 'Shopping List',
  '/meal-planner': 'Meal Planner',
  '/household': 'Household',
  '/settings': 'Settings'
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    nav('/login', { replace: true });
  };

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <div className='dash-root'>
      <aside className='dash-sidebar'>
        <div className='brand'>
          <div className='logo'>
            <img
              src={logo}
              alt='SmartStock logo'
              style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
            />
          </div>
          <div className='brand-name'>Smart Stock</div>
        </div>

        <nav className='nav'>
          <NavLink
            end
            to='/dashboard'
            className={({ isActive }) =>
              'nav-item' + (isActive ? ' active' : '')
            }
          >
            <span className='nav-dot' /> Overview
          </NavLink>
          <NavLink
            to='/pantry'
            className={({ isActive }) =>
              'nav-item' + (isActive ? ' active' : '')
            }
          >
            <span className='nav-dot' /> Pantry
          </NavLink>
          <NavLink
            to='/recipes'
            className={({ isActive }) =>
              'nav-item' + (isActive ? ' active' : '')
            }
          >
            <span className='nav-dot' /> Recipes
          </NavLink>
          <NavLink
            to='/shopping-list'
            className={({ isActive }) =>
              'nav-item' + (isActive ? ' active' : '')
            }
          >
            <span className='nav-dot' /> Shopping List
          </NavLink>
          <NavLink
            to='/meal-planner'
            className={({ isActive }) =>
              'nav-item' + (isActive ? ' active' : '')
            }
          >
            <span className='nav-dot' /> Meal Planner
          </NavLink>
          <NavLink
            to='/household'
            className={({ isActive }) =>
              'nav-item' + (isActive ? ' active' : '')
            }
          >
            <span className='nav-dot' /> Household
          </NavLink>
          <NavLink
            to='/settings'
            className={({ isActive }) =>
              'nav-item' + (isActive ? ' active' : '')
            }
          >
            <span className='nav-dot' /> Settings
          </NavLink>
        </nav>

        <div className='sidebar-footer'>
          <div className='me'>
            <div className='avatar'>
              {(user?.name ?? user?.email ?? 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className='me-meta'>
              <div className='me-name'>{user?.name ?? 'User'}</div>
              <div className='me-email'>{user?.email}</div>
            </div>
          </div>
          <button className='btn-outline' onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className='dash-main'>
        <Outlet />
      </main>
    </div>
  );
}
