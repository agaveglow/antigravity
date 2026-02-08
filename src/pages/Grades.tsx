import React from 'react';
import Card from '../components/common/Card';

const Grades: React.FC = () => {
    return (
        <div>
            <h1>Grades & Progress</h1>
            <Card elevated style={{ marginTop: 'var(--space-6)' }}>
                <h3>Assessment Matrix</h3>
                <p>Tracking against UAL criteria...</p>
            </Card>
        </div>
    );
};

export default Grades;
