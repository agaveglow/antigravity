import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import CelebrationModal from './notifications/CelebrationModal';

const CelebrationManager: React.FC = () => {
    const { celebrationQueue, dismissCelebration } = useNotifications();

    const currentCelebration = celebrationQueue[0];

    if (!currentCelebration) return null;

    return (
        <CelebrationModal
            data={currentCelebration}
            onDismiss={dismissCelebration}
        />
    );
};

export default CelebrationManager;
