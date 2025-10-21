'use client';

import { useState } from 'react';
import { FiUpload, FiLink } from 'react-icons/fi';
import ImageUploader from '@/presentation/components/ImageUploader/ImageUploader';
import IconRenderer from '@/presentation/components/IconRenderer/IconRenderer';
import { UploadedFile } from '@/domain/entities/FileUpload';
import styles from './IconPicker.module.scss';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

type TabType = 'upload' | 'url';

export default function IconPicker({ value, onChange, label = 'Icon / Logo' }: IconPickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [manualUrl, setManualUrl] = useState(value && !value.startsWith('ri://') ? value : '');

  const handleImageUpload = (files: UploadedFile[]) => {
    if (files.length > 0) {
      onChange(files[0].url);
    }
  };

  const handleUrlChange = (url: string) => {
    setManualUrl(url);
    onChange(url);
  };

  return (
    <div className={styles.iconPicker}>
      {label && <label className={styles.label}>{label}</label>}

      {/* Preview */}
      {value && (
        <div className={styles.preview}>
          <IconRenderer value={value} size={48} />
          <span className={styles.previewLabel}>Current Selection</span>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'upload' ? styles.active : ''}`}
          onClick={() => setActiveTab('upload')}
          type="button"
        >
          <FiUpload />
          <span>Upload</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'url' ? styles.active : ''}`}
          onClick={() => setActiveTab('url')}
          type="button"
        >
          <FiLink />
          <span>URL</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className={styles.uploadTab}>
            <ImageUploader
              single={true}
              label=""
              helpText="Upload an image (max 15MB)"
              defaultImages={value && !value.startsWith('ri://') ? [value] : []}
              onUploadComplete={handleImageUpload}
            />
          </div>
        )}

        {/* URL Tab */}
        {activeTab === 'url' && (
          <div className={styles.urlTab}>
            <p className={styles.urlHelp}>
              Enter the URL of an image or emoji to use as the icon
            </p>
            <input
              type="text"
              placeholder="https://example.com/icon.png or 🏷️"
              value={manualUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={styles.urlInput}
            />
          </div>
        )}
      </div>
    </div>
  );
}
