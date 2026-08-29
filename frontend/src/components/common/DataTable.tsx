import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Filter, X, ArrowUpDown } from 'lucide-react';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { SkeletonTable } from './Skeleton';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: { label: string; value: string }[];
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  key: string;
  value: string | string[];
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'between';
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  sortable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void };
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  selectable?: boolean;
  onSelectionChange?: (selectedKeys: string[]) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchKeys,
  sortable = true,
  filterable = true,
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  loading = false,
  emptyMessage = 'No data available',
  emptyAction,
  onRowClick,
  rowClassName,
  selectable = false,
  onSelectionChange,
  className = '',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<Record<string, FilterConfig>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [showColumnFilter, setShowColumnFilter] = useState<string | null>(null);
  const [columnFilterAnchor, setColumnFilterAnchor] = useState<HTMLElement | null>(null);

  const handleSort = (key: string) => {
    if (!sortable) return;
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string | string[], operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'between' = 'contains') => {
    setFilters(prev => ({
      ...prev,
      [key]: { key, value, operator },
    }));
    setCurrentPage(1);
  };

  const clearFilter = (key: string) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0;

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery) {
      const keys = searchKeys || columns.map(c => c.key as keyof T);
      const query = searchQuery.toLowerCase();
      result = result.filter(row =>
        keys.some(key => {
          const value = row[key];
          return value != null && String(value).toLowerCase().includes(query);
        })
      );
    }

    Object.values(filters).forEach(filter => {
      result = result.filter(row => {
        const value = row[filter.key];
        if (value == null) return false;
        const strValue = String(value).toLowerCase();
        const filterValue = Array.isArray(filter.value) ? filter.value.map(v => String(v).toLowerCase()) : String(filter.value).toLowerCase();

        switch (filter.operator) {
          case 'equals': return strValue === filterValue;
          case 'contains': return strValue.includes(filterValue as string);
          case 'startsWith': return strValue.startsWith(filterValue as string);
          case 'endsWith': return strValue.endsWith(filterValue as string);
          case 'in': return Array.isArray(filterValue) && filterValue.includes(strValue);
          default: return true;
        }
      });
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, filters, sortConfig, searchKeys, columns, sortable]);

  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const start = (currentPage - 1) * pageSizeState;
    return filteredData.slice(start, start + pageSizeState);
  }, [filteredData, pagination, currentPage, pageSizeState]);

  const totalPages = Math.ceil(filteredData.length / pageSizeState) || 1;

  const handleSelectionChange = (key: string, selected: boolean) => {
    setSelectedRows(prev => selected ? [...prev, key] : prev.filter(k => k !== key));
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRows(paginatedData.map(keyExtractor));
    } else {
      setSelectedRows([]);
    }
    onSelectionChange?.(selected ? paginatedData.map(keyExtractor) : []);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} color="var(--color-text-muted)" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} color="var(--accent-primary)" /> : <ChevronDown size={14} color="var(--accent-primary)" />;
  };

  if (loading) {
    return <SkeletonTable columns={columns.length} rows={pageSize} />;
  }

  return (
    <div className={`glass-card ${className}`} style={{ overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
        {searchable && (
          <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
          {filterable && hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} leftIcon={<X size={14} />}>
              Clear Filters
            </Button>
          )}
          
          {pagination && (
            <Dropdown
trigger={({ onClick, ref }) => (
                <Button ref={ref} variant="outline" size="sm" onClick={onClick} leftIcon={<Filter size={14} />} rightIcon={<ChevronDown size={14} />}>
                  {pageSizeState} / page
                </Button>
              )}
              items={pageSizeOptions.map(size => ({ label: `${size} / page`, value: String(size) }))}
              onSelect={(item) => handlePageSizeChange(Number(item.value))}
              value={String(pageSizeState)}
              width={140}
            />
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div style={{ padding: '0 24px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Active filters:</span>
          {searchQuery && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: '20px', fontSize: '12px' }}>
              Search: <span style={{ fontWeight: 500 }}>"{searchQuery}"</span>
              <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>
            </span>
          )}
          {Object.entries(filters).map(([key, filter]) => {
            const col = columns.find(c => c.key === key);
            return (
              <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '12px' }}>
                {col?.header || key}: <span style={{ fontWeight: 500 }}>{Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}</span>
                <button onClick={() => clearFilter(key)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>
              </span>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              {selectable && (
                <th style={{ padding: '12px 16px', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = selectedRows.length > 0 && selectedRows.length < paginatedData.length;
                      }
                    }}
                    checked={paginatedData.length > 0 && paginatedData.every(row => selectedRows.includes(keyExtractor(row)))}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                  />
                </th>
              )}
              {columns.map((col, _index) => (
                <th
                  key={col.key}
                  style={{
                    padding: '12px 16px',
                    textAlign: col.align || 'left',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                    width: col.width,
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={col.className}
                >
                  {col.header}
                  {col.sortable && sortable && getSortIcon(col.key)}
                  {col.filterable && filterable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowColumnFilter(col.key);
                        setColumnFilterAnchor(e.currentTarget);
                      }}
                      style={{
                        padding: '4px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: filters[col.key] ? 'var(--accent-primary)' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <Filter size={14} />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--color-text-muted)' }}>
                    <span style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>{emptyMessage}</span>
                    {emptyAction && (
                      <Button variant="primary" size="sm" onClick={emptyAction.onClick}>
                        {emptyAction.label}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const rowKey = keyExtractor(row);
                const isSelected = selectedRows.includes(rowKey);
                return (
                  <tr
                    key={rowKey}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      backgroundColor: isSelected ? 'rgba(59,130,246,0.05)' : rowIndex % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                      transition: 'background-color 0.15s',
                    }}
                    onClick={() => onRowClick?.(row)}
                    className={rowClassName?.(row)}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'; }}
                  >
                    {selectable && (
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => { e.stopPropagation(); handleSelectionChange(rowKey, e.target.checked); onSelectionChange?.(selectedRows.includes(rowKey) ? selectedRows.filter(k => k !== rowKey) : [...selectedRows, rowKey]); }}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key} style={{ padding: '12px 16px', textAlign: col.align || 'left', fontSize: '13px', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                        {col.render ? col.render(row, rowIndex) : String(row[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Showing {((currentPage - 1) * pageSizeState) + 1} to {Math.min(currentPage * pageSizeState, filteredData.length)} of {filteredData.length} results
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronDown size={14} /></Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  style={{ minWidth: '36px' }}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronDown size={14} /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /></Button>
          </div>
        </div>
      )}

      {/* Column Filter Dropdown Portal */}
      {showColumnFilter && columnFilterAnchor && (
        <Dropdown
          trigger={({ onClick, ref }) => (
            <button ref={ref} onClick={onClick} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
          )}
          items={[
            { label: 'Contains', value: 'contains' },
            { label: 'Equals', value: 'equals' },
            { label: 'Starts with', value: 'startsWith' },
            { label: 'Ends with', value: 'endsWith' },
            { label: '', value: '', divider: true },
            { label: 'Clear filter', value: 'clear', danger: true },
          ]}
          onSelect={(item) => {
            if (item.value === 'clear') {
              clearFilter(showColumnFilter);
            } else {
              handleFilterChange(showColumnFilter, '', item.value as any);
            }
            setShowColumnFilter(null);
          }}
          align="right"
          width={180}
        />
      )}
    </div>
  );
}