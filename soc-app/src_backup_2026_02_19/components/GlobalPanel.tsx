'use client';

import { useRef, useState, useEffect } from 'react';
import { Bot, Send, Sparkles, StickyNote, Trash2, X, Shield, ClipboardCheck, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { useAlertStore } from '@/lib/store';

export default function GlobalPanel() {
    const {
        aiPanelOpen, toggleAiPanel,
        notepadOpen, toggleNotepad,
        aiMessages, addAiMessage, setAiMessages, deleteAiMessage, clearAiMessages,
        notepadText, setNotepadText,
        activePlaybook, togglePlaybookStep, setStepAnswer, toggleContainment, clearPlaybook,
        isVerdictCorrect,
    } = useAlertStore();

    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isOpen = aiPanelOpen || notepadOpen;

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [aiMessages]);

    // Auto-migrate old welcome message if it contains MITRE reference
    useEffect(() => {
        if (aiMessages.length > 0 && aiMessages[0].role === 'assistant' && aiMessages[0].text.includes('MITRE ATT&CK mappings')) {
            const newMessages = [...aiMessages];
            newMessages[0] = {
                ...newMessages[0],
                text: "Hi Simon, I'm your SOC AI Assistant powered by Ollama. I persist across all pages — ask me about IOCs, investigation steps, or anything security-related. How can I help?"
            };
            setAiMessages(newMessages);
        }
    }, [aiMessages, setAiMessages]);

    const handleAiSend = async () => {
        if (!aiInput.trim() || aiLoading) return;
        const userMsg = aiInput.trim();
        addAiMessage({ role: 'user', text: userMsg });
        setAiInput('');
        setAiLoading(true);

        try {
            const allMessages = [...aiMessages, { role: 'user' as const, text: userMsg }];
            const res = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: allMessages,
                    context: {
                        alertTitle: activePlaybook?.title || 'General SOC Investigation',
                        severity: 'N/A',
                        description: 'Global assistant — the analyst is navigating across the SOC platform.',
                        playbookProgress: activePlaybook ? `${activePlaybook.completedSteps.length}/${activePlaybook.steps.length} steps` : 'N/A',
                        playbookSteps: activePlaybook ? activePlaybook.steps.join('\n') : 'N/A',
                    },
                }),
            });
            const data = await res.json();
            addAiMessage({ role: 'assistant', text: data.reply });
        } catch {
            addAiMessage({ role: 'assistant', text: 'Failed to reach AI assistant. Ensure Ollama is running on localhost:11434.' });
        } finally {
            setAiLoading(false);
        }
    };

    if (!isOpen) return null;

    // Calculate how many panels are open
    const panelCount = (aiPanelOpen ? 1 : 0) + (notepadOpen ? 1 : 0);
    const totalWidth = panelCount === 2 ? 720 : 380;

    return (
        <div style={{
            width: `${totalWidth}px`,
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexShrink: 0,
            height: '100%',
            overflow: 'hidden',
        }}>
            {/* AI Panel */}
            {aiPanelOpen && (
                <div style={{
                    width: '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-secondary)',
                    borderRight: notepadOpen ? '1px solid var(--border)' : 'none',
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bot size={16} style={{ color: 'var(--cyan)' }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>AI Assistant</span>
                            <Sparkles size={11} style={{ color: 'var(--amber)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <PanelBtn icon={<Trash2 size={13} />} title="Clear chat" onClick={clearAiMessages} />
                            <PanelBtn icon={<X size={13} />} title="Close" onClick={toggleAiPanel} />
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                    }}>
                        {aiMessages.map((msg, i) => (
                            <div
                                key={i}
                                onMouseEnter={() => setHoveredMessage(i)}
                                onMouseLeave={() => setHoveredMessage(null)}
                                style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    gap: '2px',
                                    maxWidth: '92%',
                                    position: 'relative',
                                }}
                            >
                                <div style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                    background: msg.role === 'user' ? 'var(--cyan-dim)' : 'var(--bg-tertiary)',
                                    color: msg.role === 'user' ? 'var(--text-accent)' : 'var(--text-secondary)',
                                    wordBreak: 'break-word',
                                    border: `1px solid ${msg.role === 'user' ? 'rgba(6,182,212,0.2)' : 'var(--border)'}`,
                                }}>
                                    {msg.text}
                                </div>

                                {/* Delete Button (Underneath) */}
                                {hoveredMessage === i && (
                                    <button
                                        onClick={() => deleteAiMessage(i)}
                                        style={{
                                            background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer',
                                            color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px',
                                            fontSize: '10px', opacity: 0.8
                                        }}
                                        title="Delete message"
                                    >
                                        <Trash2 size={10} /> Delete
                                    </button>
                                )}
                            </div>
                        ))}
                        {aiLoading && (
                            <div style={{
                                padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border)', alignSelf: 'flex-start',
                                fontSize: '12px', color: 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                                <span style={{ animation: 'pulse 1.5s infinite' }}>●</span>
                                <span style={{ animation: 'pulse 1.5s infinite 0.3s' }}>●</span>
                                <span style={{ animation: 'pulse 1.5s infinite 0.6s' }}>●</span>
                                <span style={{ marginLeft: '4px' }}>Thinking...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '10px 16px',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        gap: '6px',
                        flexShrink: 0,
                    }}>
                        <textarea
                            className="input"
                            placeholder={aiLoading ? 'Waiting for response...' : 'Ask about IOCs, forensics, or investigation steps...\n(Shift+Enter for new line)'}
                            style={{
                                flex: 1,
                                fontSize: '12px',
                                resize: 'vertical',
                                minHeight: '80px',
                                fontFamily: 'inherit',
                                padding: '8px',
                                lineHeight: '1.4'
                            }}
                            value={aiInput}
                            onChange={e => setAiInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAiSend();
                                }
                            }}
                            disabled={aiLoading}
                        />
                        <button onClick={handleAiSend} className="btn btn-primary" style={{ padding: '6px 10px' }} disabled={aiLoading}>
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Notepad + Playbook Panel */}
            {notepadOpen && (
                <div style={{
                    width: '340px',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-secondary)',
                    overflow: 'hidden',
                }}>
                    {/* Notepad Header */}
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StickyNote size={16} style={{ color: 'var(--amber)' }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Investigation Notes</span>
                        </div>
                        <PanelBtn icon={<X size={13} />} title="Close" onClick={toggleNotepad} />
                    </div>

                    {/* Notepad Area */}
                    <textarea
                        value={notepadText}
                        onChange={e => setNotepadText(e.target.value)}
                        placeholder={"Jot down IPs, timestamps, findings...\n\nExample:\n• 10.10.10.1 — C2 callback\n• 14:32:01 — First beacon\n• SHA256: abc123..."}
                        style={{
                            flex: 1,
                            resize: 'none',
                            border: 'none',
                            outline: 'none',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                            lineHeight: 1.7,
                            padding: '16px',
                            margin: 0,
                            minHeight: '200px',
                        }}
                    />

                    {/* Footer for Notepad */}
                    <div style={{
                        padding: '8px 16px',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                        background: 'var(--bg-secondary)',
                    }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {notepadText.length} chars • Auto-saved
                        </span>
                        <button
                            onClick={() => setNotepadText('')}
                            style={{
                                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                                cursor: 'pointer', fontSize: '10px', padding: '2px 6px',
                            }}
                        >
                            Clear
                        </button>
                    </div>

                    {/* Active Playbook Section */}
                    {activePlaybook && (
                        <>
                            <div style={{
                                padding: '12px 16px',
                                borderTop: '1px solid var(--border)',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'var(--bg-tertiary)',
                                flexShrink: 0,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Bot size={16} style={{ color: 'var(--cyan)' }} /> {/* Using Bot as generic icon if FileText not imported, but wait, I should assume FileText is available or import it? I can reuse Bot or Sparkles if needed, but StickyNote is used above. I'll use StickyNote or similar if FileText isn't available. Step 25 output showed FileText wasn't imported! It imported Bot, Send, Sparkles, StickyNote, Trash2, X. I will use Sparkles or just text. Actually I can import FileText. */}
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Playbook: {activePlaybook.id}</span>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {Math.round((activePlaybook.completedSteps.length / activePlaybook.steps.length) * 100)}%
                                </span>
                                <PanelBtn icon={<Trash2 size={13} />} title="Close Playbook" onClick={clearPlaybook} />
                            </div>

                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '0',
                                background: 'var(--bg-primary)',
                                minHeight: '150px',
                            }}>
                                {activePlaybook.steps.map((step, idx) => (
                                    <div key={idx} style={{
                                        borderBottom: '1px solid var(--border)',
                                        background: activePlaybook.completedSteps.includes(idx) ? 'rgba(34,197,94,0.02)' : 'transparent',
                                    }}>
                                        <label style={{
                                            display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 16px',
                                            cursor: 'pointer', fontSize: '12px', lineHeight: 1.5,
                                            color: activePlaybook.completedSteps.includes(idx) ? 'var(--text-muted)' : 'var(--text-secondary)',
                                            textDecoration: activePlaybook.completedSteps.includes(idx) ? 'line-through' : 'none',
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={activePlaybook.completedSteps.includes(idx)}
                                                onChange={() => togglePlaybookStep(idx)}
                                                style={{ marginTop: '3px', accentColor: 'var(--cyan)' }}
                                            />
                                            <span style={{ flex: 1 }}>{step}</span>
                                        </label>
                                        <div style={{ padding: '0 16px 10px 32px' }}>
                                            <textarea
                                                placeholder="Add findings/notes..."
                                                value={activePlaybook.answers?.[idx] || ''}
                                                onChange={(e) => setStepAnswer(idx, e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    background: 'var(--bg-tertiary)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '4px',
                                                    padding: '6px',
                                                    fontSize: '11px',
                                                    color: 'var(--text-secondary)',
                                                    resize: 'vertical',
                                                    minHeight: '40px',
                                                    fontFamily: 'var(--font-mono)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Containment Section */}
                                {activePlaybook.host && (
                                    <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                            Response Actions
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Shield size={14} color="var(--amber)" />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Isolate Endpoint</span>
                                                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{activePlaybook.host}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => activePlaybook.host && toggleContainment(activePlaybook.host)}
                                                style={{
                                                    background: activePlaybook.containedHosts?.includes(activePlaybook.host) ? 'var(--amber)' : 'transparent',
                                                    color: activePlaybook.containedHosts?.includes(activePlaybook.host) ? '#000' : 'var(--amber)',
                                                    border: '1px solid var(--amber)',
                                                    borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                                                    cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >
                                                {activePlaybook.containedHosts?.includes(activePlaybook.host) ? 'ISOLATED' : 'ISOLATE'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Completion Banner */}
                                {isVerdictCorrect && activePlaybook.completedSteps.length === activePlaybook.steps.length && (
                                    <div style={{
                                        margin: '16px', padding: '12px',
                                        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                                        borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px'
                                    }}>
                                        <div style={{ background: '#22c55e', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Check size={14} color="#fff" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e' }}>Case Succesfully Completed</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>All steps verified & verdict correct.</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function PanelBtn({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
    return (
        <button onClick={onClick} title={title} style={{
            background: 'transparent', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', transition: 'color 0.1s',
        }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
        >
            {icon}
        </button>
    );
}
