import React from 'react';
import { UserRole } from '../types/role';
import { Link } from 'react-router-dom';

interface SidebarProps {
  userRole: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  // Define menu items based on role
  const getMenuItems = (): Array<{ label: string; path: string; roles: UserRole[] }> => {
    const baseItems: Array<{ label: string; path: string; roles: UserRole[] }> = [
      { label: 'POS — Bán hàng', path: '/pos', roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER] },
      { label: 'Tổng quan', path: '/dashboard', roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER] },
    ];

    const managerOwnerItems: Array<{ label: string; path: string; roles: UserRole[] }> = [
      { label: 'Sản phẩm', path: '/products', roles: [UserRole.OWNER, UserRole.MANAGER] },
      { label: 'Danh mục', path: '/categories', roles: [UserRole.OWNER, UserRole.MANAGER] },
      { label: 'Kho', path: '/inventory', roles: [UserRole.OWNER, UserRole.MANAGER] },
      { label: 'Báo cáo', path: '/reports', roles: [UserRole.OWNER, UserRole.MANAGER] },
    ];

    const ownerOnlyItems: Array<{ label: string; path: string; roles: UserRole[] }> = [
      { label: 'Tài khoản', path: '/accounts', roles: [UserRole.OWNER] },
      { label: 'Nhân viên', path: '/staff', roles: [UserRole.OWNER] },
      { label: 'Cửa hàng', path: '/stores', roles: [UserRole.OWNER] },
    ];

    let items = [...baseItems];

    if (userRole === UserRole.OWNER || userRole === UserRole.MANAGER) {
      items = items.concat(managerOwnerItems);
    }
    if (userRole === UserRole.OWNER) {
      items = items.concat(ownerOnlyItems);
    }

    return items;
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <h2 style={styles.brandName}>POS</h2>
      </div>
      <nav style={styles.nav}>
        <ul style={styles.navList}>
          {getMenuItems().map((item) => (
            <li key={item.path} style={styles.navItem}>
              <Link to={item.path} style={styles.navLink}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div style={styles.roleBadge}>
        <span style={styles.roleLabel}>Vai trò:</span>
        <span style={styles.roleText}>{userRole}</span>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '240px',
    backgroundColor: '#1976d2',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  brand: {
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  brandName: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
  },
  navList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  navItem: {
    marginBottom: '4px',
  },
  navLink: {
    display: 'block',
    padding: '12px 20px',
    color: '#fff',
    textDecoration: 'none',
    transition: 'background-color 0.2s',
  },
  roleBadge: {
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  roleLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
    marginRight: '8px',
  },
  roleText: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
};

export default Sidebar;
