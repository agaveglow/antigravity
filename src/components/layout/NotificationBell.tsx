import React, { useState, useRef, useEffect } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import type { Notification, NotificationType } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, createNotification, deleteNotification } = useNotifications();
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }
        if (notification.link) {
            setIsOpen(false);
            navigate(notification.link);
        }
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} color="var(--color-success)" />;
            case 'warning': return <AlertTriangle size={16} color="var(--color-warning)" />;
            case 'deadline': return <Clock size={16} color="var(--color-brand-purple)" />;
            case 'verification': return <ClipboardCheckIcon size={16} color="var(--color-brand-cyan)" />; // Define below
            default: return <Info size={16} color="var(--color-info)" />;
        }
    };

    // Helper icon for verification since it wasn't in the initial import list above easily
    const ClipboardCheckIcon = ({ size, color }: { size: number, color: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-check"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></svg>
    );

    return (
        <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    color: 'var(--text-secondary)'
                }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'var(--color-brand-red)',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '-60px',
                    width: '320px',
                    backgroundColor: '#1c1c1e', // Hardcoded opaque dark background
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.8)', // Stronger shadow for depth
                    zIndex: 99999, // Extremely high z-index
                    maxHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Notifications</h4>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-brand-cyan)' }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                <Bell size={32} style={{ marginBottom: '8px', opacity: 0.2 }} />
                                <p style={{ fontSize: '0.85rem' }}>No notifications</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid var(--border-color)',
                                        background: notif.isRead ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        display: 'flex',
                                        gap: '12px'
                                    }}
                                    className="notification-item"
                                >
                                    <div style={{ marginTop: '4px' }}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: notif.isRead ? 400 : 700, marginBottom: '4px' }}>
                                            {notif.title}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                            {notif.message}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        {!notif.isRead && (
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-brand-cyan)' }} />
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notif.id);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--text-tertiary)',
                                                padding: '4px',
                                                marginTop: '4px'
                                            }}
                                            title="Delete notification"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div style={{ padding: '8px', borderTop: '1px solid var(--border-color)' }}>
                        <button
                            onClick={async () => {
                                if (user) {
                                    await createNotification(
                                        user.id,
                                        'Test Notification',
                                        'This is a test notification to verify the system.',
                                        'info'
                                    );
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: 'var(--bg-surface)',
                                border: '1px dashed var(--border-color)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)'
                            }}
                        >
                            Send Test Notification
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
