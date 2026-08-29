import React from 'react';
import { Activity, GitMerge, MessageSquare, Sliders, CheckSquare, Settings, ChevronLeft, X } from 'lucide-react';
import { Button } from '../common';

interface SidebarProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentPath, 
  onNavigate, 
  isOpen = false,
  onClose,
  isMobile = false 
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '#/ ', icon: <Activity size={20} /> },
    { id: 'cascade', label: 'Cascade View', path: '#/cascade', icon: <GitMerge size={20} /> },
    { id: 'copilot', label: 'Copilot', path: '#/copilot', icon: <MessageSquare size={20} /> },
    { id: 'simulator', label: 'Simulator', path: '#/simulator', icon: <Sliders size={20} /> },
    { id: 'approvals', label: 'Approvals', path: '#/approvals', icon: <CheckSquare size={20} /> },
  ];

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.hash = path;
    }
  };

  const sidebarWidth = isMobile ? '280px' : '250px';

  return (
    <div style={{
      width: isMobile ? (isOpen ? sidebarWidth : '0') : sidebarWidth,
      minWidth: isMobile ? (isOpen ? sidebarWidth : '0') : sidebarWidth,
      maxWidth: isMobile ? sidebarWidth : sidebarWidth,
      backgroundColor: 'var(--bg-cards)',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      position: isMobile ? 'fixed' : 'relative',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: isMobile ? 100 : 10,
      transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
      transition: isMobile ? 'transform 0.3s ease' : 'none',
      boxShadow: isMobile && isOpen ? '0 0 30px rgba(0,0,0,0.5)' : 'none',
    }}>
      {!isMobile && (
        <Button
          variant="ghost"
          size="sm"
          style={{ margin: '0 12px 24px', justifyContent: 'flex-end' }}
          onClick={() => {}}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={18} />
        </Button>
      )}
      
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 101 }}
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </Button>
      )}

      <div style={{ padding: '0 24px', marginBottom: isMobile ? '24px' : '40px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }} className="text-gradient">
          RiskSentinel
        </h1>
      </div>

      <nav style={{ flex: 1, minHeight: 0 }}>
        <ul style={{ listStyle: 'none' }}>
          {navItems.map(item => {
            const isActive = currentPath === item.path || (currentPath === '' && item.path === '#/');
            return (
              <li key={item.id} style={{ marginBottom: '4px', padding: '0 12px' }}>
                <Button
                  variant={isActive ? 'primary' : 'ghost'}
                  size="md"
                  fullWidth
                  onClick={() => handleNavigate(item.path)}
                  leftIcon={<span style={{ display: 'flex', color: isActive ? '#fff' : 'inherit', flexShrink: 0 }}>{item.icon}</span>}
                  style={{
                    justifyContent: 'flex-start',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontWeight: isActive ? 600 : 400,
                    backgroundColor: isActive ? 'linear-gradient(135deg, var(--accent-primary), #2563eb)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--color-text-muted)',
                    boxShadow: isActive ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
                    borderLeft: 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <span className="nav-label">{item.label}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={{ padding: '0 24px', marginTop: 'auto' }}>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          leftIcon={<Settings size={20} />}
          onClick={() => handleNavigate('#/settings')}
          style={{ justifyContent: 'flex-start' }}
        >
          <span className="nav-label">Settings</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
