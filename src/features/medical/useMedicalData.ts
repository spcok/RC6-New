import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { medicalLogsCollection, marChartsCollection, quarantineRecordsCollection } from '../../lib/database';
import { ClinicalNote, MARChart, QuarantineRecord } from '../../types';

export const useMedicalData = (animalId?: string) => {
  const queryClient = useQueryClient();

  // 1. FETCH DATA (Reactive UI via TanStack DB Vault)
  // Query keys aligned with database.ts table names
  const { data: rawClinicalNotes = [], isLoading: notesLoading } = useLiveQuery<ClinicalNote[]>({
    queryKey: ['medical_logs'],
  });

  const { data: rawMarCharts = [], isLoading: marLoading } = useLiveQuery<MARChart[]>({
    queryKey: ['mar_charts'],
  });

  const { data: rawQuarantineRecords = [], isLoading: quarantineLoading } = useLiveQuery<QuarantineRecord[]>({
    queryKey: ['quarantine_records'],
  });

  const clinicalNotes = useMemo(() => rawClinicalNotes.filter(n => !n.isDeleted && (!animalId || n.animalId === animalId)), [rawClinicalNotes, animalId]);
  const marCharts = useMemo(() => rawMarCharts.filter(m => !m.isDeleted && (!animalId || m.animalId === animalId)), [rawMarCharts, animalId]);
  const quarantineRecords = useMemo(() => rawQuarantineRecords.filter(q => !q.isDeleted && (!animalId || q.animalId === animalId)), [rawQuarantineRecords, animalId]);

  // 2. REMOTE MUTATIONS (Routed strictly through Offline Failover Vault)
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
