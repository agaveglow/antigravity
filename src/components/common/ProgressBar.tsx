import React from 'react';

interface ProgressBarProps {
    current: number;
    total: number;
    showPercentage?: boolean;
    height?: string;
    color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
    current,
    total,
    showPercentage = true,
    height = '8px',
    color = 'var(--color-brand-cyan)'
}) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div style={{ width: '100%' }}>
            <div style={{
                width: '100%',
                height,
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: color,
                    transition: 'width 0.3s ease',
                    borderRadius: '4px'
                }} />
            </div>
            {showPercentage && (
                <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginTop: '4px',
                    textAlign: 'right'
                }}>
                    {current} / {total} ({percentage}%)
                </div>
            )}
        </div>
    );
};

export default ProgressBar;
