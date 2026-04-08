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
        
        const mappedData: ClinicalNote[] = data.map((item: Record<string, unknown>) => mapToCamelCase<ClinicalNote>(item));

        setTimeout(async () => {
          for (const item of mappedData) {
            try {
              const existingRecord = await medicalLogsCollection.findById(item.id);
              if (existingRecord) {
                await medicalLogsCollection.update(item);
              } else {
                await medicalLogsCollection.insert(item);
              }
            } catch (e) {
              console.warn(`[Vault Sync Warning] Failed to upsert record ${item.id}:`, e);
            }
          }
        }, 0);
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
        
        const mappedData: MARChart[] = data.map((item: Record<string, unknown>) => mapToCamelCase<MARChart>(item));

        setTimeout(async () => {
          for (const item of mappedData) {
            try {
              const existingRecord = await marChartsCollection.findById(item.id);
              if (existingRecord) {
                await marChartsCollection.update(item);
              } else {
                await marChartsCollection.insert(item);
              }
            } catch (e) {
              console.warn(`[Vault Sync Warning] Failed to upsert record ${item.id}:`, e);
            }
          }
        }, 0);
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
        
        const mappedData: QuarantineRecord[] = data.map((item: Record<string, unknown>) => mapToCamelCase<QuarantineRecord>(item));

        setTimeout(async () => {
          for (const item of mappedData) {
            try {
              const existingRecord = await quarantineRecordsCollection.findById(item.id);
              if (existingRecord) {
                await quarantineRecordsCollection.update(item);
              } else {
                await quarantineRecordsCollection.insert(item);
              }
            } catch (e) {
              console.warn(`[Vault Sync Warning] Failed to upsert record ${item.id}:`, e);
            }
          }
        }, 0);
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
      await queryClient.cancelQueries({ queryKey: ['medical_records'] });
      const previousNotes = queryClient.getQueryData<ClinicalNote[]>(['medical_records']);
      const newNote = { id: note.id || crypto.randomUUID(), ...note, isDeleted: false } as ClinicalNote;
      
      queryClient.setQueryData(['medical_records'], [...(previousNotes || []), newNote]);
      const existingNote = await medicalLogsCollection.findById(newNote.id);
      if (existingNote) {
        await medicalLogsCollection.update(newNote.id, newNote);
      } else {
        await medicalLogsCollection.insert(newNote);
      }
      
      return { previousNotes };
    },
    mutationFn: async (note: Partial<ClinicalNote>) => {
      const newNote = { id: note.id || crypto.randomUUID(), ...note };
      const supabasePayload = {
        id: newNote.id,
        animal_id: newNote.animalId,
        animal_name: newNote.animalName,
        log_date: newNote.date,
        note_type: newNote.noteType,
        note_text: newNote.noteText,
        recheck_date: newNote.recheckDate,
        staff_initials: newNote.staffInitials,
        attachment_url: newNote.attachmentUrl,
        thumbnail_url: newNote.thumbnailUrl,
        diagnosis: newNote.diagnosis,
        bcs: newNote.bcs,
        weight_grams: newNote.weightGrams,
        weight: newNote.weight,
        weight_unit: newNote.weightUnit,
        treatment_plan: newNote.treatmentPlan,
        integrity_seal: newNote.integritySeal,
        created_at: new Date().toISOString(),
        is_deleted: false
      };
      
      const { error } = await supabase.from('medical_logs').insert([supabasePayload]);
      if (error) throw error;
    },
    onError: (_err, _newNote, context) => {
      queryClient.setQueryData(['medical_records'], context?.previousNotes);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['medical_records'] })
  });

  const updateClinicalNoteMutation = useMutation({
    onMutate: async (note: Partial<ClinicalNote>) => {
      if (!note.id) return;
      await queryClient.cancelQueries({ queryKey: ['medical_records'] });
      const previousNotes = queryClient.getQueryData<ClinicalNote[]>(['medical_records']);
      
      queryClient.setQueryData(['medical_records'], (old: ClinicalNote[] = []) => 
        old.map(n => n.id === note.id ? { ...n, ...note } : n)
      );
      await medicalLogsCollection.update(note.id, (prev) => ({ ...prev, ...note }) as ClinicalNote);
      
      return { previousNotes };
    },
    mutationFn: async (note: Partial<ClinicalNote>) => {
      if (!note.id) throw new Error("Cannot update without an ID");
      const supabasePayload = {
        animal_id: note.animalId,
        animal_name: note.animalName,
        log_date: note.date,
        note_type: note.noteType,
        note_text: note.noteText,
        recheck_date: note.recheckDate,
        staff_initials: note.staffInitials,
        attachment_url: note.attachmentUrl,
        thumbnail_url: note.thumbnailUrl,
        diagnosis: note.diagnosis,
        bcs: note.bcs,
        weight_grams: note.weightGrams,
        weight: note.weight,
        weight_unit: note.weightUnit,
        treatment_plan: note.treatmentPlan,
        integrity_seal: note.integritySeal,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('medical_logs').update(supabasePayload).eq('id', note.id);
      if (error) throw error;
    },
    onError: (_err, _note, context) => {
      queryClient.setQueryData(['medical_records'], context?.previousNotes);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['medical_records'] })
  });

  const addMarChartMutation = useMutation({
    onMutate: async (chart: Partial<MARChart>) => {
      await queryClient.cancelQueries({ queryKey: ['mar_charts'] });
      const previousCharts = queryClient.getQueryData<MARChart[]>(['mar_charts']);
      const newChart = { id: chart.id || crypto.randomUUID(), ...chart, isDeleted: false } as MARChart;
      
      queryClient.setQueryData(['mar_charts'], [...(previousCharts || []), newChart]);
      const existingChart = await marChartsCollection.findById(newChart.id);
      if (existingChart) {
        await marChartsCollection.update(newChart.id, newChart);
      } else {
        await marChartsCollection.insert(newChart);
      }
      
      return { previousCharts };
    },
    mutationFn: async (chart: Partial<MARChart>) => {
      const newChart = { id: chart.id || crypto.randomUUID(), ...chart };
      const supabasePayload = {
        id: newChart.id,
        animal_id: newChart.animalId,
        animal_name: newChart.animalName,
        medication: newChart.medication,
        dosage: newChart.dosage,
        frequency: newChart.frequency,
        start_date: newChart.startDate,
        end_date: newChart.endDate,
        status: newChart.status,
        instructions: newChart.instructions,
        administered_dates: newChart.administeredDates,
        staff_initials: newChart.staffInitials,
        integrity_seal: newChart.integritySeal,
        created_at: new Date().toISOString(),
        is_deleted: false
      };
      const { error } = await supabase.from('mar_charts').insert([supabasePayload]);
      if (error) throw error;
    },
    onError: (_err, _newChart, context) => {
      queryClient.setQueryData(['mar_charts'], context?.previousCharts);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['mar_charts'] })
  });

  const addQuarantineRecordMutation = useMutation({
    onMutate: async (record: Partial<QuarantineRecord>) => {
      await queryClient.cancelQueries({ queryKey: ['quarantine_records'] });
      const previousRecords = queryClient.getQueryData<QuarantineRecord[]>(['quarantine_records']);
      const newRecord = { id: record.id || crypto.randomUUID(), ...record, isDeleted: false } as QuarantineRecord;
      
      queryClient.setQueryData(['quarantine_records'], [...(previousRecords || []), newRecord]);
      const existingRecord = await quarantineRecordsCollection.findById(newRecord.id);
      if (existingRecord) {
        await quarantineRecordsCollection.update(newRecord.id, newRecord);
      } else {
        await quarantineRecordsCollection.insert(newRecord);
      }
      
      return { previousRecords };
    },
    mutationFn: async (record: Partial<QuarantineRecord>) => {
      const newRecord = { id: record.id || crypto.randomUUID(), ...record };
      const supabasePayload = {
        id: newRecord.id,
        animal_id: newRecord.animalId,
        animal_name: newRecord.animalName,
        reason: newRecord.reason,
        start_date: newRecord.startDate,
        end_date: newRecord.endDate,
        status: newRecord.status,
        isolation_notes: newRecord.isolationNotes,
        staff_initials: newRecord.staffInitials,
        created_at: new Date().toISOString(),
        is_deleted: false
      };
      const { error } = await supabase.from('quarantine_records').insert([supabasePayload]);
      if (error) throw error;
    },
    onError: (_err, _newRecord, context) => {
      queryClient.setQueryData(['quarantine_records'], context?.previousRecords);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['quarantine_records'] })
  });

  const updateQuarantineRecordMutation = useMutation({
    onMutate: async (record: Partial<QuarantineRecord>) => {
      if (!record.id) return;
      await queryClient.cancelQueries({ queryKey: ['quarantine_records'] });
      const previousRecords = queryClient.getQueryData<QuarantineRecord[]>(['quarantine_records']);
      
      queryClient.setQueryData(['quarantine_records'], (old: QuarantineRecord[] = []) => 
        old.map(r => r.id === record.id ? { ...r, ...record } : r)
      );
      await quarantineRecordsCollection.update(record.id, (prev) => ({ ...prev, ...record }) as QuarantineRecord);
      
      return { previousRecords };
    },
    mutationFn: async (record: Partial<QuarantineRecord>) => {
      if (!record.id) throw new Error("Cannot update without an ID");
      
      const supabasePayload = {
        animal_id: record.animalId,
        animal_name: record.animalName,
        reason: record.reason,
        start_date: record.startDate,
        end_date: record.endDate,
        status: record.status,
        isolation_notes: record.isolationNotes,
        staff_initials: record.staffInitials,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('quarantine_records').update(supabasePayload).eq('id', record.id);
      if (error) throw error;
    },
    onError: (_err, _record, context) => {
      queryClient.setQueryData(['quarantine_records'], context?.previousRecords);
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
