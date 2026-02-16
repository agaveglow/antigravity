import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useTimetable, type TimetableSlot, type DayOfWeek, type LevelType, type YearType } from '../context/TimetableContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Plus, Edit, Trash2, MapPin, User as UserIcon } from 'lucide-react';

const Timetable: React.FC = () => {
    const { user, role } = useUser();
    const { addSlot, updateSlot, deleteSlot, getSlotsByLevel } = useTimetable();

    const getInitialState = () => {
        if (user?.cohort === 'Level 3A') return { level: 'Level 3' as LevelType, year: 'Year 1' as YearType };
        if (user?.cohort === 'Level 3B') return { level: 'Level 3' as LevelType, year: 'Year 2' as YearType };
        return { level: 'Level 2' as LevelType, year: undefined };
    };

    const [selectedLevel, setSelectedLevel] = useState<LevelType>(getInitialState().level);
    const [selectedYear, setSelectedYear] = useState<YearType | undefined>(getInitialState().year);
    const [isAddingSlot, setIsAddingSlot] = useState(false);
    const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
    const [formData, setFormData] = useState({
        day: 'Monday' as DayOfWeek,
        startTime: '09:00',
        endTime: '10:00',
        subject: '',
        room: '',
        teacher: '',
        color: '#FF9F0A' // Default orange color
    });

    const isTeacher = role === 'teacher' || role === 'admin';
    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const currentSlots = getSlotsByLevel(selectedLevel, selectedLevel === 'Level 3' ? selectedYear : undefined);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const slot: TimetableSlot = {
            id: editingSlot?.id || crypto.randomUUID(),
            ...formData,
            level: selectedLevel,
            year: selectedLevel === 'Level 3' ? selectedYear : undefined
        };

        if (editingSlot) {
            updateSlot(editingSlot.id, formData);
        } else {
            addSlot(slot);
        }

        setIsAddingSlot(false);
        setEditingSlot(null);
        setFormData({
            day: 'Monday',
            startTime: '09:00',
            endTime: '10:00',
            subject: '',
            room: '',
            teacher: '',
            color: '#FF9F0A'
        });
    };

    const handleEdit = (slot: TimetableSlot) => {
        setEditingSlot(slot);
        setFormData({
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: slot.subject,
            room: slot.room,
            teacher: slot.teacher,
            color: slot.color || '#FF9F0A'
        });
        setIsAddingSlot(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this lesson?')) {
            deleteSlot(id);
        }
    };

    return (
        <div style={{ paddingBottom: 'var(--space-12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1>Timetable</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isTeacher ? 'Manage lesson schedules for each level' : 'Your weekly lesson schedule'}
                    </p>
                </div>
                {isTeacher && !isAddingSlot && (
                    <Button onClick={() => setIsAddingSlot(true)}>
                        <Plus size={20} style={{ marginRight: '8px' }} />
                        Add Lesson
                    </Button>
                )}
            </div>

            {/* Level Selector */}
            {isTeacher && (
                <Card elevated style={{ marginBottom: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600 }}>Select Level:</span>
                        <Button
                            variant={selectedLevel === 'Level 2' ? 'primary' : 'outline'}
                            onClick={() => { setSelectedLevel('Level 2'); setSelectedYear(undefined); }}
                        >
                            Level 2
                        </Button>
                        <Button
                            variant={selectedLevel === 'Level 3' && selectedYear === 'Year 1' ? 'primary' : 'outline'}
                            onClick={() => { setSelectedLevel('Level 3'); setSelectedYear('Year 1'); }}
                        >
                            Level 3 - Year 1
                        </Button>
                        <Button
                            variant={selectedLevel === 'Level 3' && selectedYear === 'Year 2' ? 'primary' : 'outline'}
                            onClick={() => { setSelectedLevel('Level 3'); setSelectedYear('Year 2'); }}
                        >
                            Level 3 - Year 2
                        </Button>
                    </div>
                </Card>
            )}

            {/* Add/Edit Form */}
            {isTeacher && isAddingSlot && (
                <Card elevated style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 style={{ marginBottom: 'var(--space-4)' }}>{editingSlot ? 'Edit Lesson' : 'Add New Lesson'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Day</label>
                                <select
                                    value={formData.day}
                                    onChange={(e) => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    required
                                >
                                    {days.map(day => <option key={day} value={day}>{day}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Start Time</label>
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>End Time</label>
                                <input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Subject</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="e.g., Music Theory"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Room</label>
                                <input
                                    type="text"
                                    value={formData.room}
                                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                    placeholder="e.g., Studio A"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Teacher</label>
                                <input
                                    type="text"
                                    value={formData.teacher}
                                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                                    placeholder="e.g., Mr. Smith"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Lesson Color</label>
                                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                                    {['#FF9F0A', '#FF3B30', '#34C759', '#007AFF', '#AF52DE', '#FF2D55', '#5856D6', '#FF9500'].map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color })}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '8px',
                                                background: color,
                                                border: formData.color === color ? '3px solid var(--text-primary)' : '2px solid var(--border-color)',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s',
                                                transform: formData.color === color ? 'scale(1.1)' : 'scale(1)'
                                            }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            <Button type="submit">{editingSlot ? 'Update' : 'Add'} Lesson</Button>
                            <Button variant="outline" onClick={() => { setIsAddingSlot(false); setEditingSlot(null); }}>Cancel</Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Timetable Display */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
                {days.map(day => {
                    const daySlots = currentSlots.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
                    return (
                        <Card key={day} elevated style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                            border: '2px solid var(--border-color)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                        }}>
                            <div style={{
                                marginBottom: 'var(--space-4)',
                                paddingBottom: 'var(--space-3)',
                                borderBottom: '3px solid var(--primary-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>{day}</h3>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--text-primary)',
                                    background: 'rgba(255, 159, 10, 0.25)',
                                    padding: '0.35rem 0.85rem',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    border: '1px solid rgba(255, 159, 10, 0.4)'
                                }}>
                                    {daySlots.length} {daySlots.length === 1 ? 'lesson' : 'lessons'}
                                </div>
                            </div>
                            {daySlots.length === 0 ? (
                                <div style={{
                                    padding: 'var(--space-8)',
                                    textAlign: 'center',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.95rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '12px',
                                    border: '2px dashed var(--border-color)',
                                    fontWeight: 500
                                }}>
                                    No lessons scheduled
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                    {daySlots.map(slot => {
                                        const lessonColor = slot.color || '#FF9F0A';
                                        const hexToRgb = (hex: string) => {
                                            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                                            return result ? {
                                                r: parseInt(result[1], 16),
                                                g: parseInt(result[2], 16),
                                                b: parseInt(result[3], 16)
                                            } : { r: 255, g: 159, b: 10 };
                                        };
                                        const rgb = hexToRgb(lessonColor);

                                        return (
                                            <div key={slot.id} style={{
                                                padding: 'var(--space-4)',
                                                background: `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15))`,
                                                borderRadius: '12px',
                                                border: `3px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`,
                                                borderLeft: `6px solid ${lessonColor}`,
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                cursor: 'default',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                boxShadow: `0 4px 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`
                                            }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                                    e.currentTarget.style.boxShadow = `0 12px 24px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = `0 4px 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`;
                                                }}>
                                                {/* Time badge */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '12px',
                                                    right: '12px',
                                                    background: lessonColor,
                                                    color: 'white',
                                                    padding: '0.4rem 0.85rem',
                                                    borderRadius: '10px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 800,
                                                    boxShadow: `0 3px 10px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
                                                    border: '2px solid rgba(255, 255, 255, 0.3)'
                                                }}>
                                                    {slot.startTime} - {slot.endTime}
                                                </div>

                                                <div style={{ marginBottom: '0.75rem', paddingRight: '110px' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{slot.subject}</div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: isTeacher ? 'var(--space-3)' : '0' }}>
                                                    <div style={{
                                                        fontSize: '0.95rem',
                                                        color: 'var(--text-primary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.6rem',
                                                        background: 'rgba(0, 0, 0, 0.25)',
                                                        padding: '0.6rem 0.85rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                                    }}>
                                                        <MapPin size={18} style={{ color: lessonColor, filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }} />
                                                        <span style={{ fontWeight: 600 }}>{slot.room}</span>
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.95rem',
                                                        color: 'var(--text-primary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.6rem',
                                                        background: 'rgba(0, 0, 0, 0.25)',
                                                        padding: '0.6rem 0.85rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                                    }}>
                                                        <UserIcon size={18} style={{ color: lessonColor, filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }} />
                                                        <span style={{ fontWeight: 600 }}>{slot.teacher}</span>
                                                    </div>
                                                </div>

                                                {isTeacher && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '2px solid rgba(255, 255, 255, 0.15)' }}>
                                                        <button
                                                            onClick={() => handleEdit(slot)}
                                                            style={{
                                                                flex: 1,
                                                                padding: '0.7rem',
                                                                background: lessonColor,
                                                                color: 'white',
                                                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.95rem',
                                                                fontWeight: 800,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '0.5rem',
                                                                transition: 'opacity 0.2s, transform 0.2s',
                                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.opacity = '0.85';
                                                                e.currentTarget.style.transform = 'scale(1.02)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.opacity = '1';
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                            }}
                                                        >
                                                            <Edit size={16} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(slot.id)}
                                                            style={{
                                                                flex: 1,
                                                                padding: '0.7rem',
                                                                background: 'var(--color-error)',
                                                                color: 'white',
                                                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.95rem',
                                                                fontWeight: 800,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '0.5rem',
                                                                transition: 'opacity 0.2s, transform 0.2s',
                                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.opacity = '0.85';
                                                                e.currentTarget.style.transform = 'scale(1.02)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.opacity = '1';
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                            }}
                                                        >
                                                            <Trash2 size={16} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default Timetable;
