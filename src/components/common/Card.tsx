import React from 'react';
import clsx from 'clsx';
import './Card.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    elevated?: boolean;
    hover?: boolean;
    shape?: 'rounded' | 'square' | 'pill' | 'leaf-1' | 'leaf-2';
}

const Card: React.FC<CardProps> = ({ children, className, elevated = false, hover = false, shape = 'rounded', ...props }) => {
    return (
        <div
            className={clsx('card', {
                'card-elevated': elevated,
                'card-hover': hover,
                [`card-${shape}`]: shape
            }, className)}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
