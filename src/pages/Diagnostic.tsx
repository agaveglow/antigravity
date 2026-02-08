import React from 'react';

const DiagnosticPage: React.FC = () => {
    return (
        <div style={{ padding: '2rem', color: 'white' }}>
            <h1>Diagnostic Page</h1>
            <p>If you can see this, React is working!</p>
            <p>Current time: {new Date().toLocaleString()}</p>
        </div>
    );
};

export default DiagnosticPage;
