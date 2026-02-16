import React, { useState } from 'react';
import { useAchievements } from '../context/AchievementsContext';
import { useUser } from '../context/UserContext';
import Card from '../components/common/Card';
import { Award, Footprints, Brain, Users, Zap, Sun, Trophy, Star } from 'lucide-react';

const iconMap: any = {
    Footprints, Brain, Users, Zap, Sun, Award, Trophy, Star
};

const StudentAchievements: React.FC = () => {
    const { achievements, getStudentAchievements } = useAchievements();
    const { user } = useUser();
    const [filter, setFilter] = useState<string>('All');

    const earned = getStudentAchievements(user?.id || '');
    const earnedIds = new Set(earned.map(a => a.id));

    const allCategories = ['All', ...Array.from(new Set(achievements.map(a => a.category)))];

    const filteredAchievements = achievements.filter(a =>
        filter === 'All' || a.category === filter
    );

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Attributes & Achievements</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Track your progress and earn badges!</p>
                </div>
                <div style={{
                    background: 'var(--bg-surface)',
                    padding: '1rem',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <Trophy size={32} color="var(--color-brand-gold)" />
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{earned.length} / {achievements.length}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unlocked</div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {allCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '20px',
                            border: 'none',
                            background: filter === cat ? 'var(--color-primary)' : 'var(--bg-surface)',
                            color: filter === cat ? 'white' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            boxShadow: filter === cat ? 'var(--shadow-md)' : 'none'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {filteredAchievements.map(achievement => {
                    const isEarned = earnedIds.has(achievement.id);
                    const IconComponent = iconMap[achievement.icon] || Award;

                    return (
                        <Card
                            key={achievement.id}
                            elevated={isEarned}
                            style={{
                                opacity: isEarned ? 1 : 0.6,
                                filter: isEarned ? 'none' : 'grayscale(100%)',
                                position: 'relative',
                                overflow: 'hidden',
                                border: isEarned ? '2px solid var(--color-brand-gold)' : '2px solid transparent',
                                transition: 'all 0.3s'
                            }}
                        >
                            {isEarned && (
                                <div style={{
                                    position: 'absolute',
                                    top: 10,
                                    right: 10,
                                    background: 'var(--color-brand-gold)',
                                    borderRadius: '50%',
                                    padding: '4px',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}>
                                    <Star size={16} fill="white" color="white" />
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: isEarned ? 'var(--bg-subtle)' : 'var(--bg-input)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '1rem',
                                    boxShadow: isEarned ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'
                                }}>
                                    <IconComponent size={40} color={isEarned ? 'var(--color-primary)' : 'var(--text-disabled)'} />
                                </div>

                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{achievement.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1 }}>
                                    {achievement.description}
                                </p>

                                {achievement.xpValue && (
                                    <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                        {achievement.xpValue} XP
                                    </span>
                                )}

                                {!isEarned && (
                                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', width: '100%', paddingTop: '0.5rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                            Criteria: {achievement.criteria}
                                        </div>
                                    </div>
                                )}

                                {isEarned && (
                                    <div style={{ marginTop: '1rem', color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 600 }}>
                                        Unlocked!
                                    </div>
                                )}

                                {!isEarned && achievement.maxProgress && (
                                    <div style={{ width: '100%', marginTop: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                            <span>Progress</span>
                                            {/* Mock progress for now, would come from StudentAchievement if partially complete */}
                                            <span>0 / {achievement.maxProgress}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: '0%', // Dynamic based on progress
                                                height: '100%',
                                                background: 'var(--color-brand-blue)',
                                                borderRadius: '3px'
                                            }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default StudentAchievements;
