import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontFamily } from '@tiptap/extension-font-family';
import './RichTextEditor.css';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Heading1,
    Heading2,
    Heading3,
    Highlighter
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    height?: string;
    readOnly?: boolean;
}

const RECENT_COLORS_KEY = 'tiptap-recent-highlight-colors';
const MAX_RECENT_COLORS = 8;

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    height = '300px',
    readOnly = false
}) => {
    const [recentColors, setRecentColors] = React.useState<string[]>(() => {
        const saved = localStorage.getItem(RECENT_COLORS_KEY);
        return saved ? JSON.parse(saved) : ['#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff0000', '#ffa500'];
    });

    const updateRecentColors = (color: string) => {
        if (!color) return;
        setRecentColors(prev => {
            const filtered = prev.filter(c => c.toLowerCase() !== color.toLowerCase());
            const updated = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
            localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3]
                }
            }),
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph']
            }),
            FontFamily
        ],
        content: value || '',
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        }
    });

    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '');
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    const ToolbarButton = ({ onClick, active, children, title }: any) => (
        <button
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`toolbar-btn ${active ? 'active' : ''}`}
            title={title}
            type="button"
        >
            {children}
        </button>
    );

    return (
        <div className="rich-text-editor-wrapper" style={{ height }}>
            {!readOnly && (
                <div className="toolbar">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        active={editor.isActive('heading', { level: 1 })}
                        title="Heading 1"
                    >
                        <Heading1 size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        active={editor.isActive('heading', { level: 2 })}
                        title="Heading 2"
                    >
                        <Heading2 size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        active={editor.isActive('heading', { level: 3 })}
                        title="Heading 3"
                    >
                        <Heading3 size={18} />
                    </ToolbarButton>

                    <div className="toolbar-divider" />

                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive('bold')}
                        title="Bold"
                    >
                        <Bold size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive('italic')}
                        title="Italic"
                    >
                        <Italic size={18} />
                    </ToolbarButton>

                    <div className="toolbar-divider" />

                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive('bulletList')}
                        title="Bullet List"
                    >
                        <List size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive('orderedList')}
                        title="Numbered List"
                    >
                        <ListOrdered size={18} />
                    </ToolbarButton>

                    <div className="toolbar-divider" />

                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        active={editor.isActive({ textAlign: 'left' })}
                        title="Align Left"
                    >
                        <AlignLeft size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        active={editor.isActive({ textAlign: 'center' })}
                        title="Align Center"
                    >
                        <AlignCenter size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        active={editor.isActive({ textAlign: 'right' })}
                        title="Align Right"
                    >
                        <AlignRight size={18} />
                    </ToolbarButton>

                    <div className="toolbar-divider" />

                    <div className="color-picker-group" title="Text Color">
                        <span className="color-label">A</span>
                        <input
                            type="color"
                            onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                            value={editor.getAttributes('textStyle').color || '#000000'}
                            className="color-picker"
                        />
                    </div>

                    <div className="color-picker-group" title="Highlight Color">
                        <Highlighter size={16} className="color-label" />
                        <div className="recent-colors-container">
                            <input
                                type="color"
                                onInput={(e) => {
                                    const color = (e.target as HTMLInputElement).value;
                                    editor.chain().focus().setHighlight({ color }).run();
                                }}
                                onChange={(e) => {
                                    updateRecentColors((e.target as HTMLInputElement).value);
                                }}
                                value={editor.getAttributes('highlight').color || '#ffff00'}
                                className="color-picker"
                            />
                            <div className="recent-colors-row">
                                {recentColors.map((color, index) => (
                                    <button
                                        key={`${color}-${index}`}
                                        className="recent-color-swatch"
                                        style={{ backgroundColor: color }}
                                        onClick={() => {
                                            editor.chain().focus().setHighlight({ color }).run();
                                            updateRecentColors(color);
                                        }}
                                        title={color}
                                        type="button"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <EditorContent
                editor={editor}
                className="editor-content"
                style={{ height: readOnly ? height : `calc(${height} - 50px)` }}
            />
        </div>
    );
};

export default RichTextEditor;
