import React from 'react';

interface UserAvatarProps {
  name?: string;
  image?: string;
  size?: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  name = "User", 
  image, 
  size = 40, 
  className = "",
  onClick 
}) => {
  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(' ')
      .filter(n => n)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const avatarStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${size * 0.4}px`,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#4a90e2',
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    flexShrink: 0,
  };

  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    // For relative paths from backend (e.g. uploads/...)
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (image) {
    return (
      <div className={className} style={avatarStyle} onClick={onClick}>
        <img 
          src={getImageUrl(image)} 
          alt={name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div className={className} style={avatarStyle} onClick={onClick}>
      {getInitials(name)}
    </div>
  );
};

export default UserAvatar;
