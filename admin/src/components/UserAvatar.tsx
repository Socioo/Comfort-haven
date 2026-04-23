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
    backgroundColor: 'var(--primary-color)',
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    flexShrink: 0,
  };

  const getImageUrl = (url: string) => {
    if (!url) return "";
    
    // Force HTTPS for Cloudinary URLs
    if (url.includes('cloudinary.com') && url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }
    
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
      console.log("[UserAvatar] Loading external URL:", url);
      return url;
    }
    
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    
    // Safety check: if we are on a production domain but the API is still localhost
    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
    if (isProduction && baseUrl.includes('localhost')) {
      console.warn("Production Warning: Backend API URL is still set to localhost!");
    }
    
    return `${baseUrl}${cleanUrl}`;
  };

  const [imgError, setImgError] = React.useState(false);

  // Reset error state when image URL changes
  React.useEffect(() => {
    setImgError(false);
  }, [image]);

  if (image && !imgError) {
    return (
      <div className={className} style={avatarStyle} onClick={onClick}>
        <img 
          key={image}
          src={getImageUrl(image)} 
          alt={name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
          onError={() => setImgError(true)}
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
