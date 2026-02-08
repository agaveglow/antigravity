import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: number | string;
    color?: string;
    fallback?: string;
    className?: string;
    onClick?: () => void;
    style?: React.CSSProperties;
    elevated?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
    src,
    alt = 'Avatar',
    size = 40,
    color,
    fallback,
    className,
    onClick,
    style,
    elevated = false
}) => {
    // Determine size style
    const sizeStyle = typeof size === 'number' ? `${size}px` : size;

    // Determine background color
    // If src is a color string (not a URL), use it as background
    const isColorString = src && !src.startsWith('http') && !src.startsWith('/');
    const backgroundColor = color || (isColorString ? src : 'var(--color-brand-blue)');

    const containerStyle: React.CSSProperties = {
        width: sizeStyle,
        height: sizeStyle,
        borderRadius: '50%',
        backgroundColor: !src || isColorString ? backgroundColor : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        color: 'white',
        fontSize: typeof size === 'number' ? `${size * 0.4}px` : '1rem',
        fontWeight: 600,
        boxShadow: elevated ? 'var(--shadow-md)' : undefined,
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        ...style
    };

    return (
        <div
            className={className}
            style={containerStyle}
            onClick={onClick}
        >
            {src && !isColorString ? (
                <img
                    src={src}
                    alt={alt}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
            ) : (
                <>
                    {fallback ? (
                        fallback.toUpperCase()
                    ) : (
                        <User size={typeof size === 'number' ? size * 0.5 : 24} />
                    )}
                </>
            )}
        </div>
    );
};

export default Avatar;
