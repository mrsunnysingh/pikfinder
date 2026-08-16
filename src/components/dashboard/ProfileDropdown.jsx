import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { House, UserCircle, CreditCard, Gear, SignOut } from '@phosphor-icons/react';

export default function ProfileDropdown({ onClose }) {
  const { user, logoutUser } = useContext(AppContext);
  const navigate = useNavigate();

  const go = (path) => { navigate(path); onClose(); };
  const handleLogout = () => { logoutUser(); onClose(); };

  return (
    <div className="profile-dropdown">
      <div className="dropdown-user-info">
        <div className="avatar-circle-large">
          {user?.photoURL ? <img src={user.photoURL} alt="" /> : (user?.name ? user.name.charAt(0).toUpperCase() : 'U')}
        </div>
        <div className="user-details">
          <p className="user-name">{user?.name || 'User'}</p>
          <p className="user-email">{user?.email || 'user@example.com'}</p>
        </div>
      </div>

      <div className="dropdown-divider"></div>

      <ul className="dropdown-menu-list">
        <li><div className="menu-item" onClick={() => go('/dashboard')}><House /> Dashboard</div></li>
        <li><div className="menu-item" onClick={() => go('/profile')}><UserCircle /> Profile</div></li>
        <li><div className="menu-item" onClick={() => go('/billing')}><CreditCard /> Billing</div></li>
        <li><div className="menu-item" onClick={() => go('/settings')}><Gear /> Settings</div></li>

        <div className="dropdown-divider"></div>

        <li>
          <div className="menu-item text-danger" onClick={handleLogout}>
            <SignOut /> Log out
          </div>
        </li>
      </ul>
    </div>
  );
}
