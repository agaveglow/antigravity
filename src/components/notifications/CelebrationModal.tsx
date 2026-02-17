import React, { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { CelebrationData } from '../../types/notifications';
import './CelebrationModal.css';

interface CelebrationModalProps {
    data: CelebrationData;
    onDismiss: () => void;
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({ data, onDismiss }) => {
    // Play sound effect on mount
    useEffect(() => {
        playSound(data.type);
    }, [data.type]);

    // Auto-dismiss after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onDismiss]);

    const getIcon = () => {
        if (data.badgeEarned) {
            return data.badgeEarned.icon;
        }
        if (data.icon) {
            return data.icon;
        }
        // Default icons based on type
        switch (data.type) {
            case 'task_verified':
                return '✅';
            case 'project_completed':
                return '🎉';
            case 'achievement_unlocked':
                return '🏆';
            case 'badge_earned':
                return '🎖️';
            case 'course_completed':
                return '📚';
            case 'module_completed':
                return '📖';
            case 'stage_completed':
                return '⭐';
            default:
                return '🎊';
        }
    };

    const getColor = () => {
        if (data.badgeEarned) {
            return data.badgeEarned.color;
        }
        if (data.color) {
            return data.color;
        }
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    };

    // Play celebration sound
    const playSound = (type: string) => {
        try {
            // Create audio context for web audio API
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different sounds for different celebration types
            const soundPatterns: Record<string, { frequencies: number[], durations: number[] }> = {
                'task_verified': { frequencies: [523, 659, 784], durations: [0.1, 0.1, 0.2] },
                'project_completed': { frequencies: [523, 659, 784, 1047], durations: [0.1, 0.1, 0.1, 0.3] },
                'achievement_unlocked': { frequencies: [659, 784, 988, 1175], durations: [0.15, 0.15, 0.15, 0.3] },
                'badge_earned': { frequencies: [784, 988, 1175], durations: [0.1, 0.1, 0.25] },
                'course_completed': { frequencies: [523, 659, 784, 988, 1175], durations: [0.1, 0.1, 0.1, 0.1, 0.3] },
                'module_completed': { frequencies: [659, 784, 988], durations: [0.1, 0.1, 0.2] },
                'stage_completed': { frequencies: [784, 988, 1175, 1397], durations: [0.1, 0.1, 0.1, 0.25] },
            };

            const pattern = soundPatterns[type] || soundPatterns['task_verified'];
            let currentTime = audioContext.currentTime;

            pattern.frequencies.forEach((freq, index) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();

                osc.connect(gain);
                gain.connect(audioContext.destination);

                osc.frequency.value = freq;
                osc.type = 'sine';

                gain.gain.setValueAtTime(0.3, currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, currentTime + pattern.durations[index]);

                osc.start(currentTime);
                osc.stop(currentTime + pattern.durations[index]);

                currentTime += pattern.durations[index];
            });
        } catch (error) {
            // Silently fail if audio not supported
            console.debug('Audio playback not supported:', error);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="celebration-backdrop" onClick={onDismiss} />

            {/* Modal */}
            <div className="celebration-modal">
                {/* Close button */}
                <button className="celebration-close" onClick={onDismiss}>
                    <X size={20} />
                </button>

                {/* Confetti container */}
                <div className="celebration-confetti">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="confetti-piece"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 0.5}s`,
                                backgroundColor: ['#FFD700', '#9333EA', '#06B6D4', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)]
                            }}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="celebration-content">
                    {/* Icon */}
                    <div
                        className="celebration-icon"
                        style={{ background: getColor() }}
                    >
                        <span className="celebration-emoji">{getIcon()}</span>
                        <div className="celebration-sparkle celebration-sparkle-1">
                            <Sparkles size={16} />
                        </div>
                        <div className="celebration-sparkle celebration-sparkle-2">
                            <Sparkles size={12} />
                        </div>
                        <div className="celebration-sparkle celebration-sparkle-3">
                            <Sparkles size={14} />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="celebration-title">{data.title}</h2>

                    {/* Message */}
                    <p className="celebration-message">{data.message}</p>

                    {/* Badge Display */}
                    {data.badgeEarned && (
                        <div
                            className="celebration-badge"
                            style={{ background: data.badgeEarned.color }}
                        >
                            <span className="celebration-badge-icon">{data.badgeEarned.icon}</span>
                            <span className="celebration-badge-title">{data.badgeEarned.title}</span>
                        </div>
                    )}

                    {/* XP Gained */}
                    {data.xpGained && data.xpGained > 0 && (
                        <div className="celebration-xp">
                            <span className="celebration-xp-label">XP Gained</span>
                            <span className="celebration-xp-value">+{data.xpGained}</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CelebrationModal;
