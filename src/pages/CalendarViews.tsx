import React from 'react';
import { format, isSameDay, parseISO, startOfWeek, addDays, isToday } from 'date-fns';
import { Lock } from 'lucide-react';
import { type CalendarEvent, type EventCategory } from '../types/ual';

// Day View Component
export const DayView: React.FC<{
    selectedDate: Date;
    allEvents: CalendarEvent[];
    openEditModal: (event: CalendarEvent) => void;
    getCategoryColor: (category: EventCategory) => string;
    role: string | null;
}> = ({ selectedDate, allEvents, openEditModal, getCategoryColor, role }) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = allEvents.filter(e => isSameDay(parseISO(e.startDate), selectedDate));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(255, 159, 10, 0.1), rgba(255, 159, 10, 0.05))', borderBottom: '2px solid var(--primary-color)' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h3>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {hours.map(hour => {
                    const hourEvents = dayEvents.filter(e => {
                        if (e.allDay) return hour === 0;
                        const eventHour = parseISO(e.startDate).getHours();
                        return eventHour === hour;
                    });

                    return (
                        <div key={hour} style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', minHeight: '60px' }}>
                            <div style={{ width: '80px', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRight: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                            </div>
                            <div style={{ flex: 1, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {hourEvents.map(event => (
                                    <div
                                        key={event.id}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            background: getCategoryColor(event.category),
                                            color: 'white',
                                            cursor: (event.isLocked && role !== 'teacher') ? 'default' : 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'transform 0.2s',
                                        }}
                                        onClick={() => openEditModal(event)}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                    >
                                        {event.isLocked && <Lock size={14} />}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{event.title}</div>
                                            {event.description && <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '4px' }}>{event.description}</div>}
                                        </div>
                                        {event.allDay && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>All Day</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Week View Component
export const WeekView: React.FC<{
    selectedDate: Date;
    allEvents: CalendarEvent[];
    setSelectedDate: (date: Date) => void;
    openEditModal: (event: CalendarEvent) => void;
    getCategoryColor: (category: EventCategory) => string;
    role: string | null;
}> = ({ selectedDate, allEvents, setSelectedDate, openEditModal, getCategoryColor, role }) => {
    const weekStart = startOfWeek(selectedDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {weekDays.map((day, i) => {
                    const dayEvents = allEvents.filter(e => isSameDay(parseISO(e.startDate), day));
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={i}
                            style={{
                                background: isCurrentDay ? 'linear-gradient(135deg, rgba(255, 159, 10, 0.15), rgba(255, 159, 10, 0.05))' : 'rgba(255, 255, 255, 0.02)',
                                padding: '1rem',
                                minHeight: '400px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: isCurrentDay ? '2px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px'
                            }}
                            onClick={() => setSelectedDate(day)}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                                    {format(day, 'EEE')}
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: isCurrentDay ? 'var(--primary-color)' : 'white', marginTop: '4px' }}>
                                    {format(day, 'd')}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {dayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '6px',
                                            background: getCategoryColor(event.category),
                                            color: 'white',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: (event.isLocked && role !== 'teacher') ? 'default' : 'pointer',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'transform 0.2s'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEditModal(event);
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        {event.isLocked && <Lock size={10} />}
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
