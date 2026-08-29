import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from './Button';
import { createPortal } from 'react-dom';

export interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode | ((props: { open: boolean; onClick: () => void; ref: React.RefObject<HTMLButtonElement> }) => React.ReactNode);
  items: DropdownItem[];
  onSelect: (item: DropdownItem) => void;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  align?: 'left' | 'right';
  width?: string | number;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  onSelect,
  placeholder = 'Select an option',
  value,
  disabled = false,
  align = 'left',
  width = '240px',
  searchable = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = items.filter(item => {
    if (item.divider) return true;
    if (!searchQuery) return true;
    return item.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen, searchable]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled || item.divider) return;
    onSelect(item);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const selectedItem = items.find(item => item.value === value);

  const renderTrigger = () => {
    if (typeof trigger === 'function') {
      return trigger({ open: isOpen, onClick: handleTriggerClick, ref: triggerRef });
    }
    return (
      <Button
        ref={triggerRef}
        variant="outline"
        size="sm"
        onClick={handleTriggerClick}
        disabled={disabled}
        leftIcon={selectedItem?.icon}
        rightIcon={<ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />}
        style={{ width: typeof width === 'number' ? `${width}px` : width, justifyContent: 'space-between' }}
      >
        {selectedItem ? selectedItem.label : placeholder}
      </Button>
    );
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: '100%',
        [align]: 0,
        marginTop: '8px',
        zIndex: 100,
        width: typeof width === 'number' ? `${width}px` : width,
        minWidth: typeof width === 'number' ? `${width}px` : width,
        backgroundColor: 'var(--bg-cards)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        animation: 'slideUp 0.15s ease',
      }}
      role="menu"
    >
      {searchable && (
        <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'var(--bg-deepest)',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
      )}
      <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px' }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            {emptyMessage}
          </div>
        ) : (
          filteredItems.map((item, index) => {
            if (item.divider) {
              return <div key={`divider-${index}`} style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />;
            }
            const isSelected = item.value === value;
            return (
              <button
                key={item.value}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                role="menuitem"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: item.danger ? 'var(--risk-critical)' : item.disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.backgroundColor = isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent';
                  }
                }}
              >
                {item.icon && <span style={{ display: 'flex', color: 'inherit' }}>{item.icon}</span>}
                <span style={{ flex: 1 }}>{item.label}</span>
                {isSelected && <Check size={16} color="var(--accent-primary)" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {renderTrigger()}
      {isOpen && typeof window !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  );
};