import { useState, useCallback, useMemo } from 'react';

interface UseBulkSelectionProps<T> {
  items: T[];
  getItemId: (item: T) => number | string;
}

export function useBulkSelection<T>({ items, getItemId }: UseBulkSelectionProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());

  const toggleSelection = useCallback((id: number | string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length && items.length > 0) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all current page items
      setSelectedIds(new Set(items.map(getItemId)));
    }
  }, [items, selectedIds.size, getItemId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: number | string) => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  const isAllSelected = useMemo(() => {
    return items.length > 0 && selectedIds.size === items.length;
  }, [items.length, selectedIds.size]);

  const isIndeterminate = useMemo(() => {
    return selectedIds.size > 0 && selectedIds.size < items.length;
  }, [items.length, selectedIds.size]);

  const selectedCount = selectedIds.size;

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  return {
    selectedIds,
    selectedCount,
    selectedItems,
    toggleSelection,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isIndeterminate,
  };
}
