import React, { useState, useMemo } from 'react';
import { DayView, WeekView } from './CalendarViews';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    isToday,
    parseISO
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Filter,
    Clock,
    ExternalLink,
    Lock,
    Users,
    Briefcase,
    CheckCircle2,
    CalendarDays,
    User as UserIcon,
    X
} from 'lucide-react';
import { useCurriculum } from '../context/CurriculumContext';
import { useUser } from '../context/UserContext';
import { type CalendarEvent, type EventCategory } from '../types/ual';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const Calendar: React.FC = () => {
    const { role } = useUser();
    const { projects, events, addEvent, updateEvent, deleteEvent } = useCurriculum();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [activeFilters, setActiveFilters] = useState<EventCategory[]>(['Project', 'Task', 'School', 'Personal', 'External']);

    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
    const [showSidebar, setShowSidebar] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Derive Events (Combine Context events with dynamic Project/Task deadlines)
    const allEvents = useMemo(() => {
        const derived: CalendarEvent[] = [...events];

        // Add Project Deadlines
        projects.forEach(project => {
            if (project.deadline) {
                derived.push({
                    id: `proj-${project.id}`,
                    title: `Deadline: ${project.title}`,
                    startDate: project.deadline,
                    category: 'Project',
                    allDay: true,
                    isLocked: true,
                    relatedId: project.id
                });
            }

            // Add Task Deadlines
            project.tasks.forEach(task => {
                if (task.deadline) {
                    derived.push({
                        id: `task-${task.id}`,
                        title: `Task Due: ${task.title}`,
                        startDate: task.deadline,
                        category: 'Task',
                        allDay: false,
                        isLocked: true,
                        relatedId: task.id,
                        description: `Part of ${project.title}`
                    });
                }
            });
        });

        return derived.filter(e => activeFilters.includes(e.category));
    }, [projects, events, activeFilters]);

    const handleAddEvent = (eventData: Partial<CalendarEvent>) => {
        const newEvent: CalendarEvent = {
            id: Date.now().toString(),
            title: eventData.title || 'New Event',
            startDate: eventData.startDate || format(selectedDate, 'yyyy-MM-dd'),
            category: eventData.category || 'Personal',
            description: eventData.description,
            allDay: eventData.allDay ?? true,
            isLocked: false
        };
        addEvent(newEvent);
        setIsAddingEvent(false);
    };

    const handleUpdateEvent = (eventData: Partial<CalendarEvent>) => {
        if (editingEvent) {
            updateEvent(editingEvent.id, eventData);
            setEditingEvent(null);
        }
    };

    const handleDeleteEvent = (id: string) => {
        deleteEvent(id);
        setEditingEvent(null);
    };

    const openEditModal = (event: CalendarEvent) => {
        if (event.isLocked && role !== 'teacher') return;
        setEditingEvent(event);
    };

    // Modal Component
    const EventModal: React.FC<{
        event?: CalendarEvent | null;
        onClose: () => void;
        onSave: (data: Partial<CalendarEvent>) => void;
        onDelete?: (id: string) => void;
    }> = ({ event, onClose, onSave, onDelete }) => {
        const [title, setTitle] = useState(event?.title || '');
        const [description, setDescription] = useState(event?.description || '');
        const [category, setCategory] = useState<EventCategory>(event?.category || 'Personal');
        const [date, setDate] = useState(event?.startDate || format(selectedDate, 'yyyy-MM-dd'));
        const [allDay, setAllDay] = useState(event?.allDay ?? true);

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem'
            }} onClick={onClose}>
                <Card style={{
                    width: '100%',
                    maxWidth: '500px',
                    padding: '2rem',
                    background: 'rgba(30, 30, 35, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0 }}>{event ? 'Edit Event' : 'Add New Event'}</h2>
                        <button onClick={onClose} style={{ opacity: 0.6 }}><X size={24} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Event Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Meeting, Rehearsal, etc."
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value as EventCategory)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white'
                                }}
                            >
                                <option value="Personal">Personal</option>
                                <option value="School">School</option>
                                <option value="External">External</option>
                                {role === 'teacher' && <option value="Project">Project Override</option>}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    resize: 'none'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="allDay"
                                checked={allDay}
                                onChange={e => setAllDay(e.target.checked)}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
                            />
                            <label htmlFor="allDay" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>All Day Event</label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        {event && !event.isLocked && onDelete && (
                            <Button variant="secondary" onClick={() => onDelete(event.id)} style={{ color: 'var(--color-error)' }}>
                                Delete
                            </Button>
                        )}
                        <div style={{ flex: 1 }} />
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" onClick={() => onSave({ title, description, category, startDate: date, allDay })}>
                            {event ? 'Update Event' : 'Create Event'}
                        </Button>
                    </div>
                </Card>
            </div>
        );
    };

    // Calendar Helper Functions
    const header = () => {
        const dateFormat = "MMMM yyyy";
        return (
            <div className="calendar-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isMobile ? '0.75rem' : '2rem',
                padding: isMobile ? '1rem' : '1rem',
                background: isMobile ? 'linear-gradient(135deg, rgba(255, 159, 10, 0.2), rgba(255, 159, 10, 0.05))' : 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: isMobile ? '20px' : '16px',
                border: isMobile ? '2px solid rgba(255, 159, 10, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                flexWrap: 'wrap',
                gap: isMobile ? '0.75rem' : '0.5rem',
                boxShadow: isMobile ? '0 8px 24px rgba(255, 159, 10, 0.15)' : 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1rem', flex: isMobile ? '1 1 100%' : 'none', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                    <CalendarDays className="text-primary" size={isMobile ? 24 : 28} style={{ filter: isMobile ? 'drop-shadow(0 2px 4px rgba(255, 159, 10, 0.5))' : 'none' }} />
                    <h2 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, textShadow: isMobile ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none' }}>{format(currentDate, dateFormat)}</h2>
                </div>

                <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.5rem', flexWrap: 'wrap', flex: isMobile ? '1 1 100%' : 'none', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                    {/* Mobile View Switcher */}
                    {isMobile && (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.08))',
                            padding: '4px',
                            borderRadius: '16px',
                            display: 'flex',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                            flex: '1 1 100%',
                            marginBottom: '0.5rem'
                        }}>
                            <button
                                onClick={() => setViewMode('day')}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    border: 'none',
                                    borderRadius: '12px',
                                    background: viewMode === 'day' ? 'linear-gradient(135deg, var(--primary-color), #ff8c42)' : 'transparent',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    boxShadow: viewMode === 'day' ? '0 4px 12px rgba(255, 159, 10, 0.4)' : 'none',
                                    transform: viewMode === 'day' ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >Day</button>
                            <button
                                onClick={() => setViewMode('week')}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    border: 'none',
                                    borderRadius: '12px',
                                    background: viewMode === 'week' ? 'linear-gradient(135deg, var(--primary-color), #ff8c42)' : 'transparent',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    boxShadow: viewMode === 'week' ? '0 4px 12px rgba(255, 159, 10, 0.4)' : 'none',
                                    transform: viewMode === 'week' ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >Week</button>
                            <button
                                onClick={() => setViewMode('month')}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    border: 'none',
                                    borderRadius: '12px',
                                    background: viewMode === 'month' ? 'linear-gradient(135deg, var(--primary-color), #ff8c42)' : 'transparent',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    boxShadow: viewMode === 'month' ? '0 4px 12px rgba(255, 159, 10, 0.4)' : 'none',
                                    transform: viewMode === 'month' ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >Month</button>
                        </div>
                    )}

                    {/* Desktop View Switcher */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
                        padding: '6px',
                        borderRadius: '14px',
                        display: isMobile ? 'none' : 'flex',
                        marginRight: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}>
                        <button
                            onClick={() => setViewMode('day')}
                            style={{
                                padding: '10px 18px',
                                border: 'none',
                                borderRadius: '10px',
                                background: viewMode === 'day' ? 'linear-gradient(135deg, var(--primary-color), #ff8c42)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                boxShadow: viewMode === 'day' ? '0 4px 12px rgba(255, 159, 10, 0.4)' : 'none',
                                transform: viewMode === 'day' ? 'scale(1.05)' : 'scale(1)'
                            }}
                        >Day</button>
                        <button
                            onClick={() => setViewMode('week')}
                            style={{
                                padding: '10px 18px',
                                border: 'none',
                                borderRadius: '10px',
                                background: viewMode === 'week' ? 'linear-gradient(135deg, var(--primary-color), #ff8c42)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                boxShadow: viewMode === 'week' ? '0 4px 12px rgba(255, 159, 10, 0.4)' : 'none',
                                transform: viewMode === 'week' ? 'scale(1.05)' : 'scale(1)'
                            }}
                        >Week</button>
                        <button
                            onClick={() => setViewMode('month')}
                            style={{
                                padding: '10px 18px',
                                border: 'none',
                                borderRadius: '10px',
                                background: viewMode === 'month' ? 'linear-gradient(135deg, var(--primary-color), #ff8c42)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                boxShadow: viewMode === 'month' ? '0 4px 12px rgba(255, 159, 10, 0.4)' : 'none',
                                transform: viewMode === 'month' ? 'scale(1.05)' : 'scale(1)'
                            }}
                        >Month</button>
                    </div>

                    <Button variant="secondary" onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{ minWidth: isMobile ? '48px' : 'auto', padding: isMobile ? '12px' : undefined }}>
                        <ChevronLeft size={isMobile ? 22 : 20} />
                    </Button>
                    <Button variant="secondary" onClick={() => setCurrentDate(new Date())} style={{ minWidth: isMobile ? '70px' : 'auto', padding: isMobile ? '12px 16px' : undefined, fontWeight: isMobile ? 700 : 500 }}>Today</Button>
                    <Button variant="secondary" onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{ minWidth: isMobile ? '48px' : 'auto', padding: isMobile ? '12px' : undefined }}>
                        <ChevronRight size={20} />
                    </Button>

                    {!isMobile && (
                        <Button variant="secondary" onClick={() => setShowSidebar(!showSidebar)}>
                            <Filter size={20} /> {showSidebar ? 'Hide' : 'Show'} Filters
                        </Button>
                    )}

                    <Button variant="primary" onClick={() => setIsAddingEvent(true)} style={{ minWidth: isMobile ? '48px' : 'auto', padding: isMobile ? '12px' : undefined, boxShadow: isMobile ? '0 4px 16px rgba(255, 159, 10, 0.4)' : undefined }}>
                        <Plus size={isMobile ? 22 : 20} /> {!isMobile && 'Add Event'}
                    </Button>
                </div>
            </div>
        );
    };

    const days = () => {
        const days = [];
        const date = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={i} style={{
                    textAlign: 'center',
                    padding: isMobile ? '4px 0' : '10px 0',
                    fontSize: isMobile ? '0.6rem' : '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    {isMobile ? date[i].charAt(0) : date[i]}
                </div>
            );
        }
        return <div className="calendar-days-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>{days}</div>;
    };

    const cells = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d");
                const cloneDay = day;

                const dayEvents = allEvents.filter(e => isSameDay(parseISO(e.startDate), cloneDay));

                days.push(
                    <div
                        key={day.toString()}
                        className={`calendar-cell ${!isSameMonth(day, monthStart) ? "disabled" : isSameDay(day, selectedDate) ? "selected" : ""}`}
                        style={{
                            minHeight: isMobile ? '80px' : '120px',
                            padding: isMobile ? '8px' : '10px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            background: isToday(day) ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                            position: 'relative',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            overflow: 'hidden'
                        }}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        <span style={{
                            fontSize: isMobile ? '0.7rem' : '0.9rem',
                            fontWeight: 600,
                            color: isToday(day) ? 'var(--primary-color)' : !isSameMonth(day, monthStart) ? 'rgba(255,255,255,0.2)' : 'white'
                        }}>{formattedDate}</span>

                        <div style={{ marginTop: isMobile ? '2px' : '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {dayEvents.map(event => (
                                <div
                                    key={event.id}
                                    style={{
                                        fontSize: isMobile ? '0.6rem' : '0.7rem',
                                        padding: isMobile ? '1px 4px' : '4px 8px',
                                        borderRadius: '4px',
                                        background: getCategoryColor(event.category),
                                        color: 'white',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                    }}
                                    title={event.title}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(event);
                                    }}
                                >
                                    {event.isLocked && <Lock size={isMobile ? 8 : 10} />}
                                    {!isMobile && event.title}
                                    {/* On ultra-mobile, maybe just a dot? No, let's keep name but truncated */}
                                    {isMobile && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'white' }} />}
                                </div>
                            ))}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day.toString()} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="calendar-body">{rows}</div>;
    };

    const getCategoryColor = (category: EventCategory) => {
        switch (category) {
            case 'Project': return 'linear-gradient(135deg, #FF6B6B, #EE5253)';
            case 'Task': return 'linear-gradient(135deg, #4834D4, #686DE0)';
            case 'School': return 'linear-gradient(135deg, #F093FB, #F5576C)';
            case 'Personal': return 'linear-gradient(135deg, #22A6B3, #7ED6DF)';
            case 'External': return 'linear-gradient(135deg, #6AB04C, #BADC58)';
            default: return 'var(--primary-color)';
        }
    };

    const sidebar = () => {
        const categories: { label: EventCategory, icon: any }[] = [
            { label: 'Project', icon: <Briefcase size={16} /> },
            { label: 'Task', icon: <CheckCircle2 size={16} /> },
            { label: 'School', icon: <Users size={16} /> },
            { label: 'Personal', icon: <UserIcon size={16} /> },
            { label: 'External', icon: <ExternalLink size={16} /> },
        ];

        return (
            <div style={{
                width: isMobile ? '100%' : '300px',
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                gap: isMobile ? '0.5rem' : '1.5rem',
                paddingRight: isMobile ? '0' : '1rem',
                marginBottom: isMobile ? '0.75rem' : '0'
            }}>
                <Card style={{ padding: isMobile ? '0.75rem' : '1rem', flex: isMobile ? '1 1 100%' : 'none', maxWidth: '100%', boxSizing: 'border-box' }}>
                    <h3 style={{ margin: isMobile ? '0 0 0.5rem 0' : '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isMobile ? '0.85rem' : '1.17rem', fontWeight: isMobile ? 600 : 700 }}>
                        <Filter size={isMobile ? 14 : 18} /> Filters
                    </h3>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: isMobile ? '6px' : '8px'
                    }}>
                        {categories.map(cat => (
                            <label
                                key={cat.label}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: isMobile ? '4px' : '12px',
                                    cursor: 'pointer',
                                    padding: isMobile ? '6px 10px' : '8px',
                                    borderRadius: isMobile ? '20px' : '8px',
                                    transition: 'all 0.2s',
                                    background: activeFilters.includes(cat.label) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                                    border: isMobile ? `1.5px solid ${activeFilters.includes(cat.label) ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'}` : 'none',
                                    fontSize: isMobile ? '0.75rem' : '0.9rem',
                                    fontWeight: isMobile ? 600 : 500,
                                    flex: isMobile ? '0 0 auto' : 'none'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={activeFilters.includes(cat.label)}
                                    onChange={() => {
                                        if (activeFilters.includes(cat.label)) {
                                            setActiveFilters(activeFilters.filter(f => f !== cat.label));
                                        } else {
                                            setActiveFilters([...activeFilters, cat.label]);
                                        }
                                    }}
                                    style={{ width: isMobile ? '14px' : '18px', height: isMobile ? '14px' : '18px', accentColor: 'var(--primary-color)' }}
                                />
                                <span style={{ color: getCategoryColor(cat.label).split(',')[1].trim().replace(')', ''), display: 'flex' }}>
                                    {React.cloneElement(cat.icon as React.ReactElement<any>, { size: isMobile ? 14 : 16 })}
                                </span>
                                <span>{cat.label}s</span>
                            </label>
                        ))}
                    </div>
                </Card >

                {!isMobile && (
                    <Card style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1))' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>External Sync</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Connect your Outlook or Google calendar to sync personal events.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start', gap: '10px' }}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" width="16" alt="Outlook" />
                                Connect Outlook
                            </Button>
                            <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start', gap: '10px' }}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Calendar_icon_%282020%29.svg" width="16" alt="Google" />
                                Connect Google
                            </Button>
                        </div>
                    </Card>
                )}

                <div style={{ flex: 1, width: isMobile ? '100%' : 'auto', maxWidth: '100%', boxSizing: 'border-box' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: isMobile ? '1rem' : '1.17rem' }}>Selected Date</h3>
                    <Card style={{ padding: '1rem', maxWidth: '100%', boxSizing: 'border-box' }}>
                        <h4 style={{ margin: 0, fontSize: isMobile ? '0.9rem' : '1.1rem' }}>{format(selectedDate, 'EEEE, d MMMM')}</h4>
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {allEvents.filter(e => isSameDay(parseISO(e.startDate), selectedDate)).length === 0 ? (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No events scheduled for this day.</p>
                            ) : (
                                allEvents.filter(e => isSameDay(parseISO(e.startDate), selectedDate)).map(event => (
                                    <div key={event.id} style={{
                                        borderLeft: `4px solid ${getCategoryColor(event.category).split(',')[1].trim().replace(')', '')}`,
                                        padding: '4px 12px',
                                        background: 'rgba(255,255,255,0.02)',
                                        cursor: (event.isLocked && role !== 'teacher') ? 'default' : 'pointer'
                                    }} onClick={() => openEditModal(event)}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{event.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                            <Clock size={12} /> {event.allDay ? 'All Day' : format(parseISO(event.startDate), 'HH:mm')}
                                        </div>
                                        {event.description && (
                                            <div style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.8 }}>{event.description}</div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div >
        );
    };

    return (
        <div style={{
            padding: isMobile ? '0.5rem' : '1rem',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '1rem' : '1.5rem',
            minHeight: 'calc(100vh - 80px)',
            maxWidth: '100vw',
            overflow: 'hidden',
            boxSizing: 'border-box'
        }}>
            {(isMobile || showSidebar) && sidebar()}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
                {header()}
                <Card style={{
                    padding: viewMode === 'month' ? '0' : '1.5rem',
                    overflow: 'auto',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    width: '100%',
                    boxSizing: 'border-box',
                    flex: 1,
                    minHeight: viewMode === 'day' ? '700px' : viewMode === 'week' ? '600px' : '500px'
                }}>
                    {viewMode === 'day' && (
                        <DayView selectedDate={selectedDate} allEvents={allEvents} openEditModal={openEditModal} getCategoryColor={getCategoryColor} role={role} />
                    )}
                    {viewMode === 'week' && (
                        <WeekView selectedDate={selectedDate} allEvents={allEvents} setSelectedDate={setSelectedDate} openEditModal={openEditModal} getCategoryColor={getCategoryColor} role={role} />
                    )}
                    {viewMode === 'month' && (
                        <>
                            {days()}
                            {cells()}
                        </>
                    )}
                </Card>
            </div>

            {isAddingEvent && (
                <EventModal
                    onClose={() => setIsAddingEvent(false)}
                    onSave={handleAddEvent}
                />
            )}

            {editingEvent && (
                <EventModal
                    event={editingEvent}
                    onClose={() => setEditingEvent(null)}
                    onSave={handleUpdateEvent}
                    onDelete={handleDeleteEvent}
                />
            )}
        </div>
    );
};

export default Calendar;
