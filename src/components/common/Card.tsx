import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import './Card.css';

interface CardProps extends HTMLMotionProps<'div'> {
    elevated?: boolean;
    hover?: boolean;
    shape?: 'rounded' | 'square' | 'pill' | 'leaf-1' | 'leaf-2';
}

const Card: React.FC<CardProps> = ({ children, className, elevated = false, hover = false, shape = 'rounded', ...props }) => {
    return (
        <motion.div
            className={clsx('card', {
                'card-elevated': elevated,
                [`card-${shape}`]: shape
            }, className)}
            whileHover={hover ? { y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
