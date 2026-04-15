import { useMemo, useState } from 'react';
import { useLiveQuery } from '@tanstack/react-db';
import { animalsCollection, dailyLogsCollection, tasksCollection } from '@/src/lib/db';
import { Animal, AnimalCategory, LogType, LogEntry } from '../../types';

export interface EnhancedAnimal extends Animal {
  todayWeight?: LogEntry;
  todayFeed?: LogEntry;
  lastFedStr: string;
  displayId: string;
  nextFeedTask?: { dueDate: string; notes?: string };
}

export interface AnimalStatsData {
  todayWeight?: { weight?: number; weightUnit?: string; weightGrams?: number; value?: string | number; logDate?: string | Date };
  previousWeight?: { weight?: number; weightUnit?: string; weightGrams?: number; value?: string | number; logDate?: string | Date };
  todayFeed?: { value?: string | number; logDate?: string | Date };
}

export interface PendingTask {
  id: string;
  title: string;
  dueDate?: string;
}

export function useDashboardData(activeTab: AnimalCategory | 'ARCHIVED', viewDate: string) {
  
  const { data: rawAnimals = [], isLoading: animalsLoading } = useLiveQuery((q) => 
    q.from({ item: animalsCollection })
  );
  console.log('🔍 [LiveQuery] Animals:', rawAnimals, '| Loading:', animalsLoading);

  const { data: rawLogs = [], isLoading: logsLoading } = useLiveQuery((q) => 
    q.from({ item: dailyLogsCollection })
  );
  console.log('🔍 [LiveQuery] Logs:', rawLogs, '| Loading:', logsLoading);

  const { data: rawTasks = [], isLoading: tasksLoading } = useLiveQuery((q) => 
    q.from({ item: tasksCollection })
  );
  console.log('🔍 [LiveQuery] Tasks:', rawTasks, '| Loading:', tasksLoading);

  const isLoading = animalsLoading || logsLoading || tasksLoading;

  const liveAnimals = useMemo(() => rawAnimals.filter(a => !a.isDeleted && !a.archived), [rawAnimals]);
  const archivedAnimals = useMemo(() => rawAnimals.filter(a => !a.isDeleted && a.archived), [rawAnimals]);
  const logs = useMemo(() => rawLogs.filter(l => !l.isDeleted), [rawLogs]);
  const tasks = useMemo(() => rawTasks.filter(t => !t.isDeleted), [rawTasks]);
  
  const todayLogsFiltered = useMemo(() => logs.filter(l => l.logDate === viewDate), [logs, viewDate]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('alpha-asc');
  const [isOrderLocked, setIsOrderLocked] = useState(false);

  const animalStats = useMemo(() => {
    let filtered = liveAnimals;
    if (activeTab && activeTab !== AnimalCategory.ALL && activeTab !== 'ARCHIVED') {
      filtered = filtered.filter(a => a.category === activeTab);
    }
    
    const filteredIds = new Set(filtered.map(a => a.id));
    const todayLogs = todayLogsFiltered.filter(l => filteredIds.has(l.animalId));
    
    const weighed = new Set(todayLogs.filter(l => l.logType === LogType.WEIGHT).map(l => l.animalId)).size;
    const fed = new Set(todayLogs.filter(l => l.logType === LogType.FEED).map(l => l.animalId)).size;
    return { total: filtered.length, weighed, fed, animalData: new Map<string, AnimalStatsData>() };
  }, [liveAnimals, activeTab, todayLogsFiltered]);

  const taskStats = useMemo(() => {
    const pendingTasks = tasks.filter(t => !t.completed && t.type !== 'HEALTH').map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate }));
    const pendingHealth = tasks.filter(t => !t.completed && t.type === 'HEALTH').map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate }));
    return { pendingTasks, pendingHealth };
  }, [tasks]);

  const filteredAnimals = useMemo(() => {
    let result = activeTab === 'ARCHIVED' ? [...archivedAnimals] : [...liveAnimals];
    
    if (activeTab && activeTab !== AnimalCategory.ALL && activeTab !== 'ARCHIVED') {
      result = result.filter(a => a.category === activeTab);
    }
    
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.name?.toLowerCase().includes(lower) || 
        a.species?.toLowerCase().includes(lower) || 
        a.latinName?.toLowerCase().includes(lower)
      );
    }
    
    // FULL SUITE OF SAFE SORTS
    if (sortOption === 'alpha-asc') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sortOption === 'alpha-desc') result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    if (sortOption === 'location-asc') result.sort((a, b) => (a.location || '').localeCompare(b.location || ''));
    if (sortOption === 'location-desc') result.sort((a, b) => (b.location || '').localeCompare(a.location || ''));
    
    if (sortOption === 'custom') {
        result.sort((a, b) => {
            const orderA = a.customOrder ?? 999999; 
            const orderB = b.customOrder ?? 999999;
            if (orderA === orderB) {
                return (a.name || '').localeCompare(b.name || '');
            }
            return orderA - orderB;
        });
    }

    return result.map(animal => {
      const animalTodayLogs = todayLogsFiltered.filter(l => l.animalId === animal.id);
      const todayWeight = animalTodayLogs.find(l => l.logType === LogType.WEIGHT);
      const todayFeed = animalTodayLogs.find(l => l.logType === LogType.FEED);
      
      const animalAllLogs = logs.filter(l => l.animalId === animal.id);
      const feedLogs = animalAllLogs.filter(l => l.logType === LogType.FEED).sort((a, b) => {
          const timeA = new Date(a.createdAt || a.logDate || 0).getTime();
          const timeB = new Date(b.createdAt || b.logDate || 0).getTime();
          return timeB - timeA;
      });
      
      const lastFedStr = feedLogs[0] ? `${feedLogs[0].value} ${new Date(feedLogs[0].createdAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '-';
      const displayId = (animal.category === AnimalCategory.OWLS || animal.category === AnimalCategory.RAPTORS) ? (animal.ringNumber || '-') : (animal.microchipId || '-');
      
      return { ...animal, todayWeight, todayFeed, lastFedStr, displayId } as EnhancedAnimal;
    });
  }, [liveAnimals, archivedAnimals, activeTab, searchTerm, sortOption, logs, todayLogsFiltered]);

  const toggleOrderLock = (locked: boolean) => setIsOrderLocked(locked);
  const cycleSort = () => setSortOption(prev => prev === 'alpha-asc' ? 'alpha-desc' : prev === 'alpha-desc' ? 'location-asc' : prev === 'location-asc' ? 'location-desc' : prev === 'location-desc' ? 'custom' : 'alpha-asc');

  return { filteredAnimals, animalStats, taskStats, isLoading, searchTerm, setSearchTerm, sortOption, setSortOption, cycleSort, isOrderLocked, toggleOrderLock };
}
