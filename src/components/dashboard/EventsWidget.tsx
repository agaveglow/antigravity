import React from 'react';
import Card from '../common/Card';
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';

interface Event {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    type: 'college' | 'department' | 'performance';
}

const MOCK_EVENTS: Event[] = [
    {
        id: '1',
        title: 'End of Term Showcase',
        date: '2026-06-15',
        time: '18:00',
        location: 'Main Hall',
        type: 'performance'
    },
    {
        id: '2',
        title: 'Guest Lecture: Sound Design',
        date: '2026-03-10',
        time: '14:00',
        location: 'Studio A',
        type: 'department'
    },
    {
        id: '3',
        title: 'Careers Fair',
        date: '2026-04-05',
        time: '10:00',
        location: 'Student Hub',
        type: 'college'
    }
];

const EventsWidget: React.FC = () => {
    return (
        <Card elevated style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
                <div style={{ background: 'rgba(50, 50, 194, 0.1)', color: 'var(--color-brand-blue)', padding: '8px', borderRadius: '8px' }}>
                    <CalendarIcon size={20} />
                </div>
                <h3 style={{ margin: 0 }}>Upcoming Events</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1, overflowY: 'auto' }}>
                {MOCK_EVENTS.map(event => {
                    const eventDate = new Date(event.date);
                    const isSoon = (eventDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24) < 14;

                    return (
                        <div key={event.id} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: isSoon ? '3px solid var(--color-warning)' : '3px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '45px', paddingRight: '12px', borderRight: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-warning)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                    {eventDate.toLocaleString('default', { month: 'short' })}
                                </span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                                    {eventDate.getDate()}
                                </span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>{event.title}</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {event.time}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {event.location}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {MOCK_EVENTS.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '24px 0', fontStyle: 'italic' }}>
                    No upcoming events.
                </div>
            )}
        </Card>
    );
};

export default EventsWidget;
