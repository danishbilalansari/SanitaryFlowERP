import React, { useState } from 'react';

interface ItemImageProps {
  src?: string | null;
  name?: string;
  className?: string;
}

const getInitials = (name?: string) => {
  if (!name) return '??';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const ItemImage: React.FC<ItemImageProps> = ({ src, name, className }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-[#f3f4f5] text-neutral-500 font-bold ${className || ''}`} style={{ objectFit: 'cover' }}>
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={name} 
      className={className} 
      onError={() => setHasError(true)} 
    />
  );
};
