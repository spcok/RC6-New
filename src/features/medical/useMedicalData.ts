import { useMemo } from 'react';
import { useLiveQuery } from '@tanstack/react-db';
import { medicalLogsCollection, marChartsCollection, quarantineRecordsCollection } from '@/src/lib/db';
import { ClinicalNote, MARChart, QuarantineRecord } from '../../types';

export const useMedicalData = (animalId?: string) => {
  const { data: rawClinicalNotes = [], isLoading: notesLoading } = useLiveQuery((q) => q.from({ item: medicalLogsCollection }));
  const { data: rawMarCharts = [], isLoading: marLoading } = useLiveQuery((q) => q.from({ item: marChartsCollection }));
  const { data: rawQuarantineRecords = [], isLoading: quarantineLoading } = useLiveQuery((q) => q.from({ item: quarantineRecordsCollection }));

  const clinicalNotes = useMemo(() => rawClinicalNotes.filter((n: ClinicalNote) => !n.isDeleted && (!animalId || n.animalId === animalId)), [rawClinicalNotes, animalId]);
  const marCharts = useMemo(() => rawMarCharts.filter((m: MARChart) => !m.isDeleted && (!animalId || m.animalId === animalId)), [rawMarCharts, animalId]);
  const quarantineRecords = useMemo(() => rawQuarantineRecords.filter((q: QuarantineRecord) => !q.isDeleted && (!animalId || q.animalId === animalId)), [rawQuarantineRecords, animalId]);

  return {
    clinicalNotes,
    marCharts,
    quarantineRecords,
    isLoading: notesLoading || marLoading || quarantineLoading,
    addClinicalNote: async (note: any) => medicalLogsCollection.insert({ ...note, id: note.id || crypto.randomUUID(), isDeleted: false }),
    updateClinicalNote: async (note: any) => medicalLogsCollection.update(note.id, note),
    addMarChart: async (chart: any) => marChartsCollection.insert({ ...chart, id: chart.id || crypto.randomUUID(), isDeleted: false }),
    addQuarantineRecord: async (record: any) => quarantineRecordsCollection.insert({ ...record, id: record.id || crypto.randomUUID(), isDeleted: false }),
    updateQuarantineRecord: async (record: any) => quarantineRecordsCollection.update(record.id, record),
  };
};
