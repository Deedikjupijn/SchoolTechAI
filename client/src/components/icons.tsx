import React from 'react';

interface MaterialIconProps {
  name?: string;
  className?: string;
  fallback?: string;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({ name, className = '', fallback = 'build' }) => {
  const iconName = name || fallback;
  
  // Make sure the className doesn't include both text-color and bg-color with the same color
  const noConflictClass = className.includes('text-primary') && className.includes('bg-primary') 
    ? className.replace('bg-primary', 'bg-blue-100') 
    : className;
  
  return (
    <span className={`material-icons ${noConflictClass}`}>
      {iconName}
    </span>
  );
};
