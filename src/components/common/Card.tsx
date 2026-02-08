import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import './Card.css';

interface CardProps extends HTMLMotionProps<'div'> {
    elevated?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className, elevated = false, ...props }) => {
    return (
        <motion.div
            className={clsx('card', { 'card-elevated': elevated }, className)}
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
