import React from 'react';
import styles from './BulkActionsToolbar.module.scss';

export interface BulkAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'warning' | 'success';
  icon?: string;
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
}

export default function BulkActionsToolbar({
  selectedCount,
  actions,
  onClearSelection,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={styles.toolbar}>
      <div className={styles.info}>
        <span className={styles.count}>
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <button onClick={onClearSelection} className={styles.clearButton}>
          Clear selection
        </button>
      </div>

      <div className={styles.actions}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`${styles.actionButton} ${styles[action.variant || 'primary']}`}
          >
            {action.icon && <span className={styles.icon}>{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
