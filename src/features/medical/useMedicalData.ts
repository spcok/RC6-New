import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { medicalLogsCollection, marChartsCollection, quarantineRecordsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { ClinicalNote, MARChart, QuarantineRecord } from '../../types';

export const useMedicalData = (animalId?: string) => {
  const queryClient = useQueryClient();

  // 1. FETCH DATA: Reactive UI + Circuit Breaker Hydration
  const { data: rawClinicalNotes = [], isLoading: notesLoading } = useLiveQuery<ClinicalNote[]>({
    queryKey: ['medical_logs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('medical_logs').select('*');
        if (error) throw error;
        return data as ClinicalNote[];
      } catch (err) {
        console.warn('Network unreachable: Failing over to local vault for medical_logs');
        return await medicalLogsCollection.getAll();
      }
    }
  });

  const { data: rawMarCharts = [], isLoading: marLoading } = useLiveQuery<MARChart[]>({
    queryKey: ['mar_charts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('mar_charts').select('*');
        if (error) throw error;
        return data as MARChart[];
      } catch (err) {
        console.warn('Network unreachable: Failing over to local vault for mar_charts');
        return await marChartsCollection.getAll();
      }
    }
  });

  const { data: rawQuarantineRecords = [], isLoading: quarantineLoading } = useLiveQuery<QuarantineRecord[]>({
    queryKey: ['quarantine_records'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('quarantine_records').select('*');
        if (error) throw error;
        return data as QuarantineRecord[];
      } catch (err) {
        console.warn('Network unreachable: Failing over to local vault for quarantine_records');
        return await quarantineRecordsCollection.getAll();
      }
    }
  });

  const clinicalNotes = useMemo(() => rawClinicalNotes.filter(n => !n.isDeleted && (!animalId || n.animalId === animalId)), [rawClinicalNotes, animalId]);
  const marCharts = useMemo(() => rawMarCharts.filter(m => !m.isDeleted && (!animalId || m.animalId === animalId)), [rawMarCharts, animalId]);
  const quarantineRecords = useMemo(() => rawQuarantineRecords.filter(q => !q.isDeleted && (!animalId || q.animalId === animalId)), [rawQuarantineRecords, animalId]);

  // 2. REMOTE MUTATIONS: Routed exclusively through the local failover vault
  const addClinicalNoteMutation = useMutation({
    mutationFn: async (note: Partial<ClinicalNote>) => {
      const newNote = { id: note.id || crypto.randomUUID(), ...note, isDeleted: false } as ClinicalNote;
      await medicalLogsCollection.insert(newNote);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['medical_logs'] })
  });

  const updateClinicalNoteMutation = useMutation({
    mutationFn: async (note: Partial<ClinicalNote>) => {
      if (!note.id) throw new Error("Cannot update without an ID");
      await medicalLogsCollection.update(note.id, note);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['medical_logs'] })
  });

  const addMarChartMutation = useMutation({
    mutationFn: async (chart: Partial<MARChart>) => {
      const newChart = { id: chart.id || crypto.randomUUID(), ...chart, isDeleted: false } as MARChart;
      await marChartsCollection.insert(newChart);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['mar_charts'] })
  });

  const addQuarantineRecordMutation = useMutation({
    mutationFn: async (record: Partial<QuarantineRecord>) => {
      const newRecord = { id: record.id || crypto.randomUUID(), ...record, isDeleted: false } as QuarantineRecord;
      await quarantineRecordsCollection.insert(newRecord);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['quarantine_records'] })
  });

  const updateQuarantineRecordMutation = useMutation({
    mutationFn: async (record: Partial<QuarantineRecord>) => {
      if (!record.id) throw new Error("Cannot update without an ID");
      await quarantineRecordsCollection.update(record.id, record);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['quarantine_records'] })
  });

  return {
    clinicalNotes,
    marCharts,
    quarantineRecords,
    isLoading: notesLoading || marLoading || quarantineLoading,
    addClinicalNote: addClinicalNoteMutation.mutateAsync,
    updateClinicalNote: updateClinicalNoteMutation.mutateAsync,
    addMarChart: addMarChartMutation.mutateAsync,
    addQuarantineRecord: addQuarantineRecordMutation.mutateAsync,
    updateQuarantineRecord: updateQuarantineRecordMutation.mutateAsync,
    isMutating: addClinicalNoteMutation.isPending || updateClinicalNoteMutation.isPending || addMarChartMutation.isPending || addQuarantineRecordMutation.isPending || updateQuarantineRecordMutation.isPending
  };
};
