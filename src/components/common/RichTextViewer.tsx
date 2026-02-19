import React from 'react';
import DOMPurify from 'dompurify';
import './RichTextEditor.css';

interface RichTextViewerProps {
    content: string;
    className?: string;
}

const RichTextViewer: React.FC<RichTextViewerProps> = ({ content, className = '' }) => {
    // Sanitize HTML to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'div', 'mark'
        ],
        ALLOWED_ATTR: ['style', 'class']
    });

    return (
        <div
            className={`rich-text-viewer ${className}`}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
    );
};

export default RichTextViewer;
