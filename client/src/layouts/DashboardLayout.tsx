import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './dashboard-theme.css';
import logo from '../assets/SmartStockLogo.png';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/login', { replace: true });
  };

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
            to='/my-recipes'
            className={({ isActive }) =>
              'nav-item' + (isActive ? ' active' : '')
            }
          >
            <span className='nav-dot' /> My Recipes
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
        <header className='dash-header'>
          <h1 className='dash-title'>Welcome back</h1>
          <div className='header-actions'>
            <button className='btn-primary'>useful buttons here?</button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
