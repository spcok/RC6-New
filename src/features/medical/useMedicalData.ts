import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalLogsCollection, marChartsCollection, quarantineRecordsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { ClinicalNote, MARChart, QuarantineRecord } from '../../types';
import { mapToCamelCase } from '../../lib/dataMapping';

export const useMedicalData = (animalId?: string) => {
  const queryClient = useQueryClient();

  // 1. FETCH CLINICAL NOTES
  const { data: rawClinicalNotes = [], isLoading: notesLoading } = useQuery<ClinicalNote[]>({
    queryKey: ['medical_records'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('medical_logs').select('*');
        if (error) throw error;
        
        if (!data) return [];
        const camelCaseData = mapToCamelCase<ClinicalNote>(data as Record<string, unknown>[]) as ClinicalNote[];

        const mappedData: ClinicalNote[] = camelCaseData.map((item: ClinicalNote): ClinicalNote => ({
          ...item,
          id: (item.id as string) ?? crypto.randomUUID(),
          animalId: item.animalId ?? "",
          animalName: item.animalName ?? "Unknown",
          date: item.date ?? new Date().toISOString(),
          noteType: item.noteType ?? "General",
          noteText: item.noteText ?? "",
          staffInitials: item.staffInitials ?? "Unknown",
          isDeleted: item.isDeleted ?? false,
        }));

        for (const item of mappedData) {
          try {
            await medicalLogsCollection.update(item);
          } catch {
            await medicalLogsCollection.insert(item);
          }
        }
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving Medical Records from local vault.");
        return await medicalLogsCollection.getAll();
      }
    }
  });

  // 2. FETCH MAR CHARTS
  const { data: rawMarCharts = [], isLoading: marLoading } = useQuery<MARChart[]>({
    queryKey: ['mar_charts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('mar_charts').select('*');
        if (error) throw error;
        
        if (!data) return [];
        const camelCaseData = mapToCamelCase<MARChart>(data as Record<string, unknown>[]) as MARChart[];

        const mappedData: MARChart[] = camelCaseData.map((item: MARChart): MARChart => ({
          ...item,
          id: (item.id as string) ?? crypto.randomUUID(),
          animalId: item.animalId ?? "",
          animalName: item.animalName ?? "Unknown",
          medication: item.medication ?? "Unknown",
          dosage: item.dosage ?? "Unknown",
          frequency: item.frequency ?? "Unknown",
          startDate: item.startDate ?? new Date().toISOString(),
          status: item.status ?? 'Active',
          instructions: item.instructions ?? "",
          administeredDates: item.administeredDates ?? [],
          staffInitials: item.staffInitials ?? "Unknown",
          isDeleted: item.isDeleted ?? false,
        }));

        for (const item of mappedData) {
          try {
            await marChartsCollection.update(item);
          } catch {
            await marChartsCollection.insert(item);
          }
        }
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving MAR Charts from local vault.");
        return await marChartsCollection.getAll();
      }
    }
  });

  // 3. FETCH QUARANTINE RECORDS
  const { data: rawQuarantineRecords = [], isLoading: quarantineLoading } = useQuery<QuarantineRecord[]>({
    queryKey: ['quarantine_records'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('quarantine_records').select('*');
        if (error) throw error;
        
        if (!data) return [];
        const camelCaseData = mapToCamelCase<QuarantineRecord>(data as Record<string, unknown>[]) as QuarantineRecord[];

        const mappedData: QuarantineRecord[] = camelCaseData.map((item: QuarantineRecord): QuarantineRecord => ({
          ...item,
          id: (item.id as string) ?? crypto.randomUUID(),
          animalId: item.animalId ?? "",
          animalName: item.animalName ?? "Unknown",
          reason: item.reason ?? "Unknown",
          startDate: item.startDate ?? new Date().toISOString(),
          endDate: item.endDate ?? new Date().toISOString(),
          status: item.status ?? 'Active',
          isolationNotes: item.isolationNotes ?? "",
          staffInitials: item.staffInitials ?? "Unknown",
          isDeleted: item.isDeleted ?? false,
        }));

        for (const item of mappedData) {
          try {
            await quarantineRecordsCollection.update(item);
          } catch {
            await quarantineRecordsCollection.insert(item);
          }
        }
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving Quarantine Records from local vault.");
        return await quarantineRecordsCollection.getAll();
      }
    }
  });

  const clinicalNotes = useMemo(() => rawClinicalNotes.filter(n => !n.isDeleted && (!animalId || n.animalId === animalId)), [rawClinicalNotes, animalId]);
  const marCharts = useMemo(() => rawMarCharts.filter(m => !m.isDeleted && (!animalId || m.animalId === animalId)), [rawMarCharts, animalId]);
  const quarantineRecords = useMemo(() => rawQuarantineRecords.filter(q => !q.isDeleted && (!animalId || q.animalId === animalId)), [rawQuarantineRecords, animalId]);

  const addClinicalNoteMutation = useMutation({
    onMutate: async (note: Partial<ClinicalNote>) => {
      const newNote = {
        id: note.id || crypto.randomUUID(),
        ...note,
        isDeleted: false
      } as ClinicalNote;
      await medicalLogsCollection.insert(newNote);
      return { newNote };
    },
    mutationFn: async (note: Partial<ClinicalNote>) => {
      const newNote = { id: note.id || crypto.randomUUID(), ...note };
      const supabasePayload = {
        id: newNote.id,
        animalId: newNote.animalId,
        animalName: newNote.animalName,
        logDate: newNote.date,
        noteType: newNote.noteType,
        noteText: newNote.noteText,
        recheckDate: newNote.recheckDate,
        staffInitials: newNote.staffInitials,
        attachmentUrl: newNote.attachmentUrl,
        thumbnailUrl: newNote.thumbnailUrl,
        diagnosis: newNote.diagnosis,
        bcs: newNote.bcs,
        weightGrams: newNote.weightGrams,
        weight: newNote.weight,
        weightUnit: newNote.weightUnit,
        treatmentPlan: newNote.treatmentPlan,
        integritySeal: newNote.integritySeal,
        createdAt: new Date().toISOString(),
        isDeleted: false
      };
      
      const { error } = await supabase.from('medical_logs').insert([supabasePayload]);
      if (error) throw error; // REQUIRED: Let TanStack catch this!
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['medical_records'] })
  });

  const updateClinicalNoteMutation = useMutation({
    onMutate: async (note: Partial<ClinicalNote>) => {
      if (!note.id) return;
      const existingNote = clinicalNotes.find(n => n.id === note.id);
      if (existingNote) {
        await medicalLogsCollection.update(note.id, (prev) => ({ ...prev, ...note }) as ClinicalNote);
      }
    },
    mutationFn: async (note: Partial<ClinicalNote>) => {
      if (!note.id) throw new Error("Cannot update without an ID");
      const supabasePayload = {
        animalId: note.animalId,
        animalName: note.animalName,
        logDate: note.date,
        noteType: note.noteType,
        noteText: note.noteText,
        recheckDate: note.recheckDate,
        staffInitials: note.staffInitials,
        attachmentUrl: note.attachmentUrl,
        thumbnailUrl: note.thumbnailUrl,
        diagnosis: note.diagnosis,
        bcs: note.bcs,
        weightGrams: note.weightGrams,
        weight: note.weight,
        weightUnit: note.weightUnit,
        treatmentPlan: note.treatmentPlan,
        integritySeal: note.integritySeal,
        updatedAt: new Date().toISOString()
      };
      
      const { error } = await supabase.from('medical_logs').update(supabasePayload).eq('id', note.id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['medical_records'] })
  });

  const addMarChartMutation = useMutation({
    onMutate: async (chart: Partial<MARChart>) => {
      const newChart = {
        id: chart.id || crypto.randomUUID(),
        ...chart,
        isDeleted: false
      } as MARChart;
      await marChartsCollection.insert(newChart);
      return { newChart };
    },
    mutationFn: async (chart: Partial<MARChart>) => {
      const newChart = { id: chart.id || crypto.randomUUID(), ...chart };
      const supabasePayload = {
        id: newChart.id,
        animalId: newChart.animalId,
        animalName: newChart.animalName,
        medication: newChart.medication,
        dosage: newChart.dosage,
        frequency: newChart.frequency,
        startDate: newChart.startDate,
        endDate: newChart.endDate,
        status: newChart.status,
        instructions: newChart.instructions,
        administeredDates: newChart.administeredDates,
        staffInitials: newChart.staffInitials,
        integritySeal: newChart.integritySeal,
        createdAt: new Date().toISOString(),
        isDeleted: false
      };
      const { error } = await supabase.from('mar_charts').insert([supabasePayload]);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['mar_charts'] })
  });

  const addQuarantineRecordMutation = useMutation({
    onMutate: async (record: Partial<QuarantineRecord>) => {
      const newRecord = {
        id: record.id || crypto.randomUUID(),
        ...record,
        isDeleted: false
      } as QuarantineRecord;
      await quarantineRecordsCollection.insert(newRecord);
      return { newRecord };
    },
    mutationFn: async (record: Partial<QuarantineRecord>) => {
      const newRecord = { id: record.id || crypto.randomUUID(), ...record };
      const supabasePayload = {
        id: newRecord.id,
        animalId: newRecord.animalId,
        animalName: newRecord.animalName,
        reason: newRecord.reason,
        startDate: newRecord.startDate,
        endDate: newRecord.endDate,
        status: newRecord.status,
        isolationNotes: newRecord.isolationNotes,
        staffInitials: newRecord.staffInitials,
        createdAt: new Date().toISOString(),
        isDeleted: false
      };
      const { error } = await supabase.from('quarantine_records').insert([supabasePayload]);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['quarantine_records'] })
  });

  const updateQuarantineRecordMutation = useMutation({
    onMutate: async (record: Partial<QuarantineRecord>) => {
      if (!record.id) return;
      const existingRecord = quarantineRecords.find(r => r.id === record.id);
      if (existingRecord) {
        await quarantineRecordsCollection.update(record.id, (prev) => ({ ...prev, ...record }) as QuarantineRecord);
      }
    },
    mutationFn: async (record: Partial<QuarantineRecord>) => {
      if (!record.id) throw new Error("Cannot update without an ID");
      
      const supabasePayload = {
        animalId: record.animalId,
        animalName: record.animalName,
        reason: record.reason,
        startDate: record.startDate,
        endDate: record.endDate,
        status: record.status,
        isolationNotes: record.isolationNotes,
        staffInitials: record.staffInitials,
        updatedAt: new Date().toISOString()
      };

      const { error } = await supabase.from('quarantine_records').update(supabasePayload).eq('id', record.id);
      if (error) throw error;
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
