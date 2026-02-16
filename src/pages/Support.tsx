import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
    Heart, Phone, LifeBuoy, BookOpen,
    HelpCircle, ChevronDown, ChevronUp,
    ExternalLink, Shield, MessageCircle
} from 'lucide-react';
import { useUser } from '../context/UserContext';

const Support: React.FC = () => {
    const { role } = useUser();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    // Teacher Resources
    const teacherFaqs = [
        { q: "How do I create a new student account?", a: "Go to 'Manage Students', click 'Add Student', and fill in their details. A username and password will be generated automatically." },
        { q: "What do the Color Blind modes do?", a: "They adjust the status colors (Success, Warning, Error) to be distinguishable for Protanopia, Deuteranopia, and Tritanopia users." },
        { q: "How do I grade a submission?", a: "Navigate to the 'Assessment Hub' via the dashboard or 'Active Units' card. Click 'Grade' on any pending submission." },
        { q: "Can I edit a project after publishing?", a: "Yes, go to 'Curriculum', select the project, and click 'Edit'. Note that major changes might confuse students if they have already started." }
    ];

    const teacherWellbeing = [
        { name: "Education Support", desc: "The only UK charity dedicated to the mental health and wellbeing of education staff.", link: "https://www.educationsupport.org.uk", color: "#e91e63" },
        { name: "Mind", desc: "Mental health support and advice.", link: "https://www.mind.org.uk", color: "#2196f3" },
        { name: "Samaritans", desc: "24/7 support for anyone in distress.", link: "https://www.samaritans.org", color: "#4caf50" }
    ];

    // Student Resources
    const studentFaqs = [
        { q: "How do I submit my work?", a: "Go to the 'Project Brief', scroll to the task you want to complete, and click 'Submit Evidence'. You can upload files or add links." },
        { q: "Can I change my password?", a: "Please ask your teacher to reset your password for you." },
        { q: "What are DowdBucks?", a: "DowdBucks are rewards you earn for completing tasks and good attendance. You can spend them in the Store." }
    ];

    const studentSupport = [
        { name: "YoungMinds", desc: "Mental health support for young people.", link: "https://www.youngminds.org.uk", color: "#F9A825" },
        { name: "Childline", desc: "Confidential support for u19s. Call 0800 1111.", link: "https://www.childline.org.uk", color: "#00E676" },
        { name: "The Mix", desc: "Support for u25s on any challenge.", link: "https://www.themix.org.uk", color: "#EA80FC" }
    ];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
                <div style={{
                    display: 'inline-flex', padding: '16px', borderRadius: '50%',
                    background: 'rgba(255, 107, 107, 0.1)', marginBottom: 'var(--space-4)'
                }}>
                    <Heart size={48} color="var(--color-error)" />
                </div>
                <h1 style={{ marginBottom: 'var(--space-2)' }}>
                    {role === 'teacher' ? 'Professional Support & Guidance' : 'Safeguarding & Support'}
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    {role === 'teacher'
                        ? 'Resources to help you manage the app and look after your wellbeing.'
                        : 'Your safety and wellbeing are our top priority. We are here to help.'}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)' }}>

                {/* Left Column: Immediate Help */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={20} color="var(--color-error)" /> Emergency Contacts
                    </h3>

                    <Card elevated style={{ borderColor: 'var(--color-error)', borderLeftWidth: '4px' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                            <div style={{ background: 'rgba(255, 59, 48, 0.1)', color: 'var(--color-error)', padding: '12px', borderRadius: '50%', height: 'fit-content' }}>
                                <Phone size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 8px', color: 'var(--color-error)' }}>Immediate Danger</h3>
                                <p style={{ margin: '0 0 12px' }}>If you or someone else is in immediate danger, call <strong>999</strong>.</p>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ marginBottom: '4px' }}>College Safeguarding Officer:</div>
                                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>020 1234 5678</strong>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card elevated>
                        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                            <div style={{ background: 'rgba(50, 50, 194, 0.1)', color: 'var(--color-brand-blue)', padding: '12px', borderRadius: '50%', height: 'fit-content' }}>
                                <LifeBuoy size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 8px' }}>Student Services</h3>
                                <p style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>
                                    Support for financial issues, counseling, and academic adjustments.
                                </p>
                                <Button variant="outline" size="sm">Request Callback</Button>
                            </div>
                        </div>
                    </Card>

                    <h3 style={{ margin: 'var(--space-4) 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Heart size={20} color="#E91E63" /> {role === 'teacher' ? 'Staff Wellbeing (UK)' : 'Youth Support (UK)'}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {(role === 'teacher' ? teacherWellbeing : studentSupport).map(res => (
                            <a
                                key={res.name} href={res.link} target="_blank" rel="noopener noreferrer"
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <Card style={{
                                    padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    borderLeft: `4px solid ${res.color}`, transition: 'transform 0.2s'
                                }} className="hover-card">
                                    <div>
                                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{res.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{res.desc}</div>
                                    </div>
                                    <ExternalLink size={16} color="var(--text-tertiary)" />
                                </Card>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Right Column: App Support */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={20} color="var(--color-brand-purple)" /> App Guide & FAQs
                    </h3>

                    <Card elevated>
                        <h4 style={{ margin: '0 0 var(--space-4)', color: 'var(--color-brand-purple)' }}>
                            {role === 'teacher' ? 'ERC Teacher Guide' : 'Getting Started'}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {(role === 'teacher' ? teacherFaqs : studentFaqs).map((faq, i) => (
                                <div key={i} style={{
                                    border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden'
                                }}>
                                    <button
                                        onClick={() => toggleFaq(i)}
                                        style={{
                                            width: '100%', padding: '12px 16px', background: 'var(--bg-surface)',
                                            border: 'none', borderBottom: openFaq === i ? '1px solid var(--border-color)' : 'none',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', textAlign: 'left' }}>
                                            <HelpCircle size={16} color="var(--text-tertiary)" />
                                            {faq.q}
                                        </div>
                                        {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    {openFaq === i && (
                                        <div style={{ padding: '12px 16px', background: 'var(--bg-input)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {role === 'teacher' && (
                        <Card elevated style={{ background: 'linear-gradient(135deg, rgba(50, 50, 194, 0.05), rgba(50, 50, 194, 0.1))' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <MessageCircle size={24} color="var(--color-brand-blue)" />
                                <div>
                                    <h4 style={{ margin: '0 0 8px' }}>Contact IT Support</h4>
                                    <p style={{ fontSize: '0.9rem', margin: '0 0 12px' }}>
                                        Running into technical issues with the app? Our team is available 9am - 5pm.
                                    </p>
                                    <Button size="sm" variant="primary">Log a Ticket</Button>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            <style>{`
                .hover-card:hover {
                    transform: translateX(4px);
                    background: var(--bg-hover) !important;
                }
            `}</style>

            <div style={{ marginTop: 'var(--space-12)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                <p>ERC Learn: Music - UAL Approved Center • v1.2.0-beta</p>
                <p>Protected by UK GDPR & Data Protection Act 2018</p>
            </div>
        </div>
    );
};

export default Support;
