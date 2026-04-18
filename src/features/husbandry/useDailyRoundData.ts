import { useState, useMemo, useEffect } from 'react';
import { AnimalCategory, DailyRound, LogType } from '../../types';
import { useLiveQuery } from '@tanstack/react-db';
import { animalsCollection, dailyLogsCollection, dailyRoundsCollection } from '../../lib/database';

interface AnimalCheckState {
    isAlive?: boolean;
    isWatered: boolean;
    isSecure: boolean;
    securityIssue?: string;
    healthIssue?: string;
}

export function useDailyRoundData(viewDate: string) {
    // 1. REACTIVE UI with Official Selectors & Safe Arrays
    const { data: rawAnimals, isLoading: isLoadingAnimals } = useLiveQuery((q) => q.from({ item: animalsCollection }));
    const allAnimals = Array.isArray(rawAnimals) ? rawAnimals : [];

    const { data: rawLogs, isLoading: isLoadingLogs } = useLiveQuery((q) => q.from({ item: dailyLogsCollection }));
    const liveLogs = Array.isArray(rawLogs) ? rawLogs : [];

    const { data: rawRounds, isLoading: isLoadingRounds } = useLiveQuery((q) => q.from({ item: dailyRoundsCollection }));
    const liveRounds = Array.isArray(rawRounds) ? rawRounds : [];
    
    const isLoading = isLoadingAnimals || isLoadingLogs || isLoadingRounds;

    const [roundType, setRoundType] = useState<'Morning' | 'Evening'>('Morning');
    const [activeTab, setActiveTab] = useState<AnimalCategory>(AnimalCategory.OWLS);
    
    const [checks, setChecks] = useState<Record<string, AnimalCheckState>>({});
    const [signingInitials, setSigningInitials] = useState('');
    const [generalNotes, setGeneralNotes] = useState('');

    const currentRound = useMemo(() => liveRounds.find(r => r.shift === roundType && r.section === activeTab && r.date === viewDate), [liveRounds, roundType, activeTab, viewDate]);
    const isPastRound = currentRound?.status?.toLowerCase() === 'completed';

    useEffect(() => {
        if (currentRound?.checkData) {
            setChecks(currentRound.checkData as Record<string, AnimalCheckState>);
        } else {
            setChecks({});
        }
        setSigningInitials(currentRound?.completedBy || '');
        setGeneralNotes(currentRound?.notes || '');
    }, [currentRound]);

    // FIX: Added !a.isDeleted && !a.archived to prevent dead/archived animals from blocking the round
    const categoryAnimals = useMemo(() => allAnimals.filter(a => a.category === activeTab && !a.isDeleted && !a.archived), [allAnimals, activeTab]);

    const freezingRisks = useMemo(() => {
        const risks: Record<string, boolean> = {};
        if (!liveLogs.length) return risks;
        categoryAnimals.forEach(animal => {
            if (animal.waterTippingTemp !== undefined) {
                const tempLog = liveLogs.find(l => l.animalId === animal.id && l.logType === LogType.TEMPERATURE);
                if (tempLog && tempLog.temperatureC !== undefined && tempLog.temperatureC <= animal.waterTippingTemp) {
                    risks[animal.id] = true;
                }
            }
        });
        return risks;
    }, [categoryAnimals, liveLogs]);

    const toggleHealth = (id: string, issue?: string) => { 
        setChecks(prev => ({
            ...prev,
            [id]: { ...prev[id], isAlive: prev[id]?.isAlive ? undefined : true, healthIssue: issue }
        }));
    };
    const toggleWater = (id: string) => { 
        setChecks(prev => ({
            ...prev,
            [id]: { ...prev[id], isWatered: !prev[id]?.isWatered }
        }));
    };
    const toggleSecure = (id: string, issue?: string) => { 
        setChecks(prev => ({
            ...prev,
            [id]: { ...prev[id], isSecure: !prev[id]?.isSecure, securityIssue: issue }
        }));
    };

    const completedChecks = useMemo(() => {
        return categoryAnimals.filter(animal => {
            const state = checks[animal.id];
            if (!state) return false;
            return (activeTab === AnimalCategory.OWLS || activeTab === AnimalCategory.RAPTORS) 
                ? (state.isAlive !== undefined && (state.isSecure || Boolean(state.securityIssue)))
                : (state.isAlive !== undefined && state.isWatered && (state.isSecure || Boolean(state.securityIssue)));
        }).length;
    }, [categoryAnimals, checks, activeTab]);

    const totalAnimals = categoryAnimals.length;
    const progress = totalAnimals === 0 ? 0 : Math.round((completedChecks / totalAnimals) * 100);
    const isComplete = totalAnimals > 0 && completedChecks === totalAnimals;
    const isNoteRequired = useMemo(() => false, []);

    // 2. REMOTE MUTATION (FIXED: Update vs Insert)
    const handleSignOff = async () => {
        if (!isComplete || !signingInitials) return;
        
        try {
            const roundId = currentRound?.id || crypto.randomUUID();
            const roundData = {
                id: roundId,
                date: viewDate,
                shift: roundType,
                section: activeTab,
                checkData: checks,
                completedBy: signingInitials,
                notes: generalNotes,
                status: 'completed',
                completedAt: new Date().toISOString()
            } as DailyRound;

            if (currentRound) {
                await dailyRoundsCollection.update(roundId, roundData);
            } else {
                await dailyRoundsCollection.insert(roundData);
            }
        } catch (error) {
            console.error('Failed to sign off round:', error);
        }
    };

    const currentUser = { signature_data: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/John_Hancock_signature.png' };

    return { 
        categoryAnimals, 
        isLoading, 
        roundType, 
        setRoundType, 
        activeTab, 
        setActiveTab, 
        checks, 
        progress, 
        isComplete, 
        isNoteRequired, 
        signingInitials, 
        setSigningInitials, 
        generalNotes, 
        setGeneralNotes, 
        isSubmitting: false, 
        isPastRound, 
        toggleWater, 
        toggleSecure, 
        toggleHealth, 
        handleSignOff, 
        currentUser, 
        completedChecks, 
        totalAnimals, 
        freezingRisks 
    };
}
