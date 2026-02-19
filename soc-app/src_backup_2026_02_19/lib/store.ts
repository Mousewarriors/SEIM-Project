import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AlertStatus = 'open' | 'investigating' | 'closed';

interface AIMessage {
    role: 'user' | 'assistant';
    text: string;
}

interface AlertState {
    status: Record<string, AlertStatus>;
    setAlertStatus: (alertId: string, status: AlertStatus) => void;
    resetAll: () => void;

    // Global AI panel toggle
    aiPanelOpen: boolean;
    toggleAiPanel: () => void;

    // Global notepad toggle
    notepadOpen: boolean;
    toggleNotepad: () => void;

    // Global AI chat messages (persistent across pages)
    aiMessages: AIMessage[];
    setAiMessages: (messages: AIMessage[]) => void;
    addAiMessage: (msg: AIMessage) => void;
    deleteAiMessage: (index: number) => void;
    clearAiMessages: () => void;

    // Active Playbook (persisted)
    activePlaybook: {
        id: string; // scenario ID to match
        title: string;
        steps: string[];
        completedSteps: number[];
        answers: Record<number, string>; // idx -> text
        containedHosts: string[]; // list of hostnames
        host?: string;
    } | null;
    setPlaybook: (data: { id: string; title: string; steps: string[]; host?: string }) => void;
    togglePlaybookStep: (index: number) => void;
    setStepAnswer: (index: number, answer: string) => void;
    toggleContainment: (host: string) => void;
    clearPlaybook: () => void;

    isVerdictCorrect: boolean | null;
    setVerdictCorrectness: (isCorrect: boolean | null) => void;

    // Live Monitor Alerting
    liveRules: LiveAlertRule[];
    liveAlerts: LiveAlert[];
    addLiveRule: (rule: LiveAlertRule) => void;
    deleteLiveRule: (id: string) => void;
    addLiveAlert: (alert: LiveAlert) => void;
    clearLiveAlerts: () => void;

    // Global notepad text
    notepadText: string;
    setNotepadText: (text: string) => void;
}

export interface LiveAlertRule {
    id: string;
    name: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    field: string; // e.g. 'event.action'
    operator: 'equals' | 'contains' | 'not_equals';
    value: string;
    enabled: boolean;
}

export interface LiveAlert {
    id: string;
    ruleId: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    timestamp: string;
    sourceEvent: any;
}

const DEFAULT_AI_WELCOME: AIMessage = {
    role: 'assistant',
    text: "Hi Simon, I'm your SOC AI Assistant powered by Ollama. I persist across all pages — ask me about IOCs, investigation steps, or anything security-related. How can I help?",
};

export const useAlertStore = create<AlertState>()(
    persist(
        (set) => ({
            status: {},
            setAlertStatus: (alertId, status) =>
                set((state) => ({
                    status: { ...state.status, [alertId]: status },
                })),
            resetAll: () => set({ status: {} }),

            aiPanelOpen: false,
            toggleAiPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),

            notepadOpen: false,
            toggleNotepad: () => set((state) => ({ notepadOpen: !state.notepadOpen })),

            aiMessages: [DEFAULT_AI_WELCOME],
            setAiMessages: (messages) => set({ aiMessages: messages }),
            addAiMessage: (msg) => set((state) => ({ aiMessages: [...state.aiMessages, msg] })),
            deleteAiMessage: (index) => set((state) => ({ aiMessages: state.aiMessages.filter((_, i) => i !== index) })),
            clearAiMessages: () => set({ aiMessages: [DEFAULT_AI_WELCOME] }),

            notepadText: '',
            setNotepadText: (text) => set({ notepadText: text }),

            setVerdictCorrectness: (isCorrect) => set({ isVerdictCorrect: isCorrect }),

            activePlaybook: null,
            isVerdictCorrect: null,

            // Live Alerts
            liveRules: [
                { id: 'rule-def-1', name: 'Failed Logons', description: 'Detect failed login attempts', severity: 'medium', field: 'event.action', operator: 'contains', value: 'fail', enabled: true },
                { id: 'rule-def-2', name: 'Process Blocked', description: 'Detect blocked process execution', severity: 'high', field: 'event.action', operator: 'contains', value: 'block', enabled: true }
            ],
            liveAlerts: [],
            addLiveRule: (rule) => set(state => ({ liveRules: [...state.liveRules, rule] })),
            deleteLiveRule: (id) => set(state => ({ liveRules: state.liveRules.filter(r => r.id !== id) })),
            addLiveAlert: (alert) => set(state => {
                // Prevent duplicates (simple check by ID or content hash if needed)
                if (state.liveAlerts.find(a => a.id === alert.id)) return state;
                return { liveAlerts: [alert, ...state.liveAlerts].slice(0, 50) }; // Keep last 50
            }),
            clearLiveAlerts: () => set({ liveAlerts: [] }),

            setPlaybook: (data) => set((state) => {
                // Only update if it's a different playbook or not set
                if (state.activePlaybook?.id === data.id) return state;
                return {
                    activePlaybook: {
                        ...data,
                        completedSteps: [],
                        answers: {},
                        containedHosts: []
                    },
                    isVerdictCorrect: null
                };
            }),
            togglePlaybookStep: (index) => set((state) => {
                if (!state.activePlaybook) return state;
                const steps = state.activePlaybook.completedSteps;
                const newSteps = steps.includes(index)
                    ? steps.filter(i => i !== index)
                    : [...steps, index];
                return {
                    activePlaybook: { ...state.activePlaybook, completedSteps: newSteps }
                };
            }),
            setStepAnswer: (index, answer) => set((state) => {
                if (!state.activePlaybook) return state;
                return {
                    activePlaybook: {
                        ...state.activePlaybook,
                        answers: { ...state.activePlaybook.answers, [index]: answer }
                    }
                };
            }),
            toggleContainment: (host) => set((state) => {
                if (!state.activePlaybook) return state;
                const hosts = state.activePlaybook.containedHosts;
                const newHosts = hosts.includes(host)
                    ? hosts.filter(h => h !== host)
                    : [...hosts, host];
                return {
                    activePlaybook: { ...state.activePlaybook, containedHosts: newHosts }
                };
            }),
            clearPlaybook: () => set({ activePlaybook: null, isVerdictCorrect: null }),
        }),
        {
            name: 'soc-alert-storage',
        }
    )
);
