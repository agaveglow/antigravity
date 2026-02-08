import React from 'react';
import { format, startOfWeek, addDays, isToday, isSameDay, parseISO } from 'date-fns';
import { useCurriculum } from '../context/CurriculumContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import Card from './common/Card';
import { type CalendarEvent } from '../types/ual';

const WeeklyCalendarWidget: React.FC = () => {
    const { events } = useCurriculum();
    const navigate = useNavigate();
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Project': return 'linear-gradient(135deg, #FF6B6B, #EE5253)';
            case 'Task': return 'linear-gradient(135deg, #4834D4, #686DE0)';
            case 'School': return 'linear-gradient(135deg, #F093FB, #F5576C)';
            case 'Personal': return 'linear-gradient(135deg, #22A6B3, #7ED6DF)';
            case 'External': return 'linear-gradient(135deg, #6AB04C, #BADC58)';
            default: return 'var(--primary-color)';
        }
    };

    return (
        <Card elevated>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Calendar size={24} className="text-primary" />
                    <h3 style={{ margin: 0 }}>This Week</h3>
                </div>
                <button
                    onClick={() => navigate('/calendar')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 159, 10, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    View Full Calendar <ChevronRight size={16} />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {weekDays.map((day, i) => {
                    const dayEvents = events.filter((e: CalendarEvent) => isSameDay(parseISO(e.startDate), day));
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={i}
                            style={{
                                background: isCurrentDay ? 'linear-gradient(135deg, rgba(255, 159, 10, 0.15), rgba(255, 159, 10, 0.05))' : 'rgba(255, 255, 255, 0.02)',
                                padding: '0.75rem 0.5rem',
                                borderRadius: '12px',
                                border: isCurrentDay ? '2px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.05)',
                                minHeight: '120px',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                                    {format(day, 'EEE')}
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: isCurrentDay ? 'var(--primary-color)' : 'white', marginTop: '2px' }}>
                                    {format(day, 'd')}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflow: 'hidden' }}>
                                {dayEvents.slice(0, 3).map((event: CalendarEvent) => (
                                    <div
                                        key={event.id}
                                        style={{
                                            padding: '4px 6px',
                                            borderRadius: '4px',
                                            background: getCategoryColor(event.category),
                                            color: 'white',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                                        }}
                                        title={event.title}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                                {dayEvents.length > 3 && (
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2px' }}>
                                        +{dayEvents.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default WeeklyCalendarWidget;
