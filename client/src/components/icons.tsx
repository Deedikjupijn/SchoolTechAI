import React from 'react';

interface MaterialIconProps {
  name: string;
  className?: string;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({ name, className = '' }) => {
  return (
    <span className={`material-icons ${className}`}>
      {name}
    </span>
  );
};
