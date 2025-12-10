import React from 'react';
import { getIconByName } from '@/domain/entities/IconLibrary';

interface IconRendererProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Renders an icon based on its value:
 * - If starts with "ri://" -> render from react-icons library
 * - Otherwise -> treat as URL and render as <img>
 */
export default function IconRenderer({ value, size = 24, className = '' }: IconRendererProps) {
  if (!value) {
    return null;
  }

  // Check if it's a react-icon identifier
  if (value.startsWith('ri://')) {
    const iconName = value.replace('ri://', '');
    const iconDef = getIconByName(iconName);

    if (iconDef) {
      const IconComponent = iconDef.icon;
      return <IconComponent size={size} className={className} />;
    }

    // Icon not found, show placeholder
    return <span className={className} style={{ fontSize: size }}>?</span>;
  }

  // Treat as image URL
  return (
    <img
      src={value}
      alt="Icon"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
