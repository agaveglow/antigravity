import React, { useMemo } from 'react';
import { format, addDays, parseISO, isAfter, startOfDay } from 'date-fns';
import { useCurriculum } from '../context/CurriculumContext';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronRight, Clock } from 'lucide-react';
import Card from './common/Card';


const WeeklyCalendarWidget: React.FC = () => {
    const { allEvents } = useCurriculum();
    const navigate = useNavigate();
    const today = new Date();
    // Get upcoming events (occurring today or later)
    const upcomingEvents = useMemo(() => {
        if (!allEvents) return [];
        return allEvents
            .filter(e => {
                try {
                    if (!e.startDate) return false;
                    const date = parseISO(e.startDate);
                    if (isNaN(date.getTime())) return false; // Handle Invalid Date
                    return isAfter(date, startOfDay(addDays(today, -1)));
                } catch (err) {
                    console.error('WeeklyCalendarWidget: Filter error', err, e);
                    return false;
                }
            })
            .slice(0, 4); // Show top 4
    }, [allEvents]);

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Project': return { bg: '#FF6B6B', text: 'white' };
            case 'Task': return { bg: '#4834D4', text: 'white' };
            case 'School': return { bg: '#F093FB', text: 'white' }; // Pinkish
            case 'Personal': return { bg: '#22A6B3', text: 'white' };
            case 'External': return { bg: '#6AB04C', text: 'white' };
            default: return { bg: 'var(--color-primary)', text: 'white' };
        }
    };

    return (
        <Card elevated style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-subtle)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        padding: '8px',
                        background: 'rgba(255, 159, 10, 0.1)',
                        borderRadius: '8px',
                        color: 'var(--color-brand-orange)'
                    }}>
                        <CalendarIcon size={20} />
                    </div>
                    <h3 style={{ margin: 0 }}>Schedule</h3>
                </div>
                <button
                    onClick={() => navigate('/calendar')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: '20px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    Full Calendar <ChevronRight size={14} />
                </button>
            </div>

            <div style={{ padding: '0' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {upcomingEvents.length > 0 ? (
                        upcomingEvents.map((event, index) => (
                            <div key={event.id} style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                padding: '12px 16px',
                                borderBottom: index < upcomingEvents.length - 1 ? '1px solid var(--border-color)' : 'none',
                                background: 'var(--bg-surface)',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px 8px',
                                    background: 'var(--bg-input)',
                                    borderRadius: '8px',
                                    minWidth: '45px'
                                }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                                        {(() => {
                                            try {
                                                const date = parseISO(event.startDate);
                                                return isNaN(date.getTime()) ? '???' : format(date, 'MMM');
                                            } catch { return '???'; }
                                        })()}
                                    </span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {(() => {
                                            try {
                                                const date = parseISO(event.startDate);
                                                return isNaN(date.getTime()) ? '??' : format(date, 'd');
                                            } catch { return '??'; }
                                        })()}
                                    </span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px', color: 'var(--text-primary)' }}>
                                        {event.title}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} />
                                            {event.allDay ? 'All Day' : (() => {
                                                try {
                                                    const date = parseISO(event.startDate);
                                                    return isNaN(date.getTime()) ? 'Invalid Time' : format(date, 'h:mm a');
                                                } catch {
                                                    return 'Invalid Time';
                                                }
                                            })()}
                                        </span>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            background: getCategoryColor(event.category).bg,
                                            color: 'white'
                                        }}>
                                            {event.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 1rem' }}>
                            <p style={{ fontSize: '0.9rem' }}>No upcoming events.</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default WeeklyCalendarWidget;
