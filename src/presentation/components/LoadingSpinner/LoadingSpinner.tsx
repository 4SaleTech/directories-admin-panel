import React from 'react';
import styles from './LoadingSpinner.module.scss';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 'medium',
  text = 'Loading...',
  fullScreen = false
}: LoadingSpinnerProps) {
  const spinnerContent = (
    <div className={`${styles.spinnerContainer} ${fullScreen ? styles.fullScreen : ''}`}>
      <div className={`${styles.spinner} ${styles[size]}`}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {text && <p className={styles.loadingText}>{text}</p>}
    </div>
  );

  return spinnerContent;
}
