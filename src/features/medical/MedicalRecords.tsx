import React, { useState, useMemo, useRef } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMedicalData } from './useMedicalData';
import { useAnimalsData } from '../animals/useAnimalsData';
import { usePermissions } from '../../hooks/usePermissions';
import { AlertTriangle, Edit2, Download, CheckCircle, Lock, FileText, Printer, ChevronRight, X, ShieldCheck, Clock, User } from 'lucide-react';
import { generateMarChartDocx } from './exportMarChart';
import { ClinicalNote, MARChart, QuarantineRecord } from '../../types';
import { DataTable } from '../../components/ui/DataTable';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';

interface MedicalRecordsProps {
  animalId?: string;
  variant?: 'full' | 'quick-view';
}

const marColumnHelper = createColumnHelper<MARChart>();
const quarantineColumnHelper = createColumnHelper<QuarantineRecord>();

interface MedicalCardProps {
  note: any;
  patientName: string;
  patientId: string;
}

const MedicalCard = ({ note, patientName, patientId }: MedicalCardProps) => {
  const urgencyColors = { Routine: 'border-blue-500', Monitor: 'border-amber-500', Urgent: 'border-orange-500', Critical: 'border-red-600' };
  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${urgencyColors[note.urgency as keyof typeof urgencyColors] || 'border-slate-300'}`}>
      <div className="flex justify-between text-sm font-bold text-slate-900 mb-2">
        <span>{patientName} <span className="text-slate-500 font-normal">({patientId})</span></span>
        <span className="text-xs font-normal text-slate-500 flex items-center gap-1"><Clock size={14} /> {new Date(note.date as string).toLocaleString()}</span>
      </div>
      <p className="text-sm text-slate-700 mb-3">{note.noteText}</p>
      <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t">
        <div className="flex items-center gap-1"><User size={14} /> Recorded by: {note.staffInitials}</div>
        <div className="flex items-center gap-1 text-slate-400"><ShieldCheck size={14} /> Seal: {note.id.substring(0, 8)}</div>
      </div>
    </div>
  );
};

const ClinicalNoteDetailSidebar = ({ note, onClose, onPrint }: { note: any | null; onClose?: () => void; onPrint: (note: any) => void; }) => {
  if (!note) {
    return (
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 p-6 border-l flex flex-col items-center justify-center text-slate-400">
        <FileText size={48} className="mb-4 opacity-50" />
        <p>Select a clinical note to view full details</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 p-6 overflow-y-auto border-l">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Clinical Note Detail</h2>
        <div className="flex gap-2">
          <button onClick={() => onPrint(note)} className="p-2 text-slate-500 hover:text-blue-600"><Printer size={20} /></button>
          {onClose && <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900"><X size={20} /></button>}
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">{note.noteType}</span>
          {note.bcs && <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">BCS: {note.bcs}/5</span>}
          {note.vitalsWeight && <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">Weight: {note.vitalsWeight}kg</span>}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Observation</label>
          <p className="text-sm mt-1 whitespace-pre-wrap">{note.noteText}</p>
        </div>
        {note.diagnosis && (
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Diagnosis</label>
            <p className="text-sm mt-1">{note.diagnosis}</p>
          </div>
        )}
        {note.treatmentPlan && (
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Treatment Plan</label>
            <p className="text-sm mt-1 whitespace-pre-wrap">{note.treatmentPlan}</p>
          </div>
        )}
        <div className="pt-6 border-t space-y-2 text-xs text-slate-500">
          <p>Recorded by: {note.staffInitials}</p>
          <p className="flex items-center gap-1"><ShieldCheck size={14} /> Integrity Seal: {note.id}</p>
          <p>Created: {new Date(note.date as string).toLocaleString()}</p>
          {note.recheckDate && <p className="font-bold text-amber-600">Recheck Date: {new Date(note.recheckDate as string).toLocaleDateString()}</p>}
        </div>
      </div>
    </div>
  );
};

const MedicalRecords: React.FC<MedicalRecordsProps> = ({ animalId, variant = 'full' }) => {
  const permissions = usePermissions();
  const { clinicalNotes = [], marCharts = [], quarantineRecords = [], isLoading, addClinicalNote, updateQuarantineRecord } = useMedicalData(animalId);
  const { animals } = useAnimalsData();
  const [activeTab, setActiveTab] = useState<'notes' | 'mar' | 'quarantine'>('notes');
  const [selectedPatient, setSelectedPatient] = useState<string>(animalId || 'All');
  const [viewMode, setViewMode] = useState<'summary' | 'chart'>(animalId && animalId !== 'All' ? 'chart' : 'summary');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isAddMarOpen, setIsAddMarOpen] = useState(false);
  const [isAddQuarantineOpen, setIsAddQuarantineOpen] = useState(false);

  // Auto-switch view mode
  React.useEffect(() => {
    setViewMode(selectedPatient === 'All' ? 'summary' : 'chart');
  }, [selectedPatient]);

  const patientOptions = useMemo(() => {
    return [{ value: 'All', label: 'All Patients' }, ...animals.map(a => ({ value: a.id, label: a.name }))];
  }, [animals]);

  const noteColumnHelper = createColumnHelper<ClinicalNote>();
  const clinicalNotesColumns = useMemo(() => [
    noteColumnHelper.accessor('date', {
      header: 'Date',
      cell: info => new Date(info.getValue() as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    }),
    noteColumnHelper.accessor('animalId', {
      header: 'Animal',
      cell: info => animals.find(a => a.id === info.getValue())?.name || 'Unknown'
    }),
    noteColumnHelper.accessor('noteType', { header: 'Type' }),
    noteColumnHelper.accessor('noteText', {
      header: 'Note',
      cell: info => <div className="line-clamp-2 max-w-xs">{info.getValue()}</div>
    }),
    noteColumnHelper.accessor('urgency', {
      header: 'Urgency',
      cell: info => {
        const urgency = (info.getValue() as string) || 'Routine';
        const color = urgency === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
        return <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>{urgency}</span>;
      }
    }),
    noteColumnHelper.accessor('staffInitials', { header: 'Staff' }),
  ], [animals]);

  const filteredNotes = useMemo(() => {
    if (!clinicalNotes) return [];
    let filtered = clinicalNotes;
    if (selectedPatient !== 'All') filtered = filtered.filter(n => n.animalId === selectedPatient);
    if (selectedSection !== 'All') {
      const animalIdsInSection = animals.filter(a => a.category === selectedSection).map(a => a.id);
      filtered = filtered.filter(n => animalIdsInSection.includes(n.animalId));
    }
    return filtered;
  }, [clinicalNotes, selectedPatient, selectedSection, animals]);

  const filteredMarCharts = useMemo(() => {
    if (!marCharts) return [];
    let filtered = marCharts;
    if (selectedPatient !== 'All') filtered = filtered.filter(m => m.animalId === selectedPatient);
    if (selectedSection !== 'All') {
      const animalIdsInSection = animals.filter(a => a.category === selectedSection).map(a => a.id);
      filtered = filtered.filter(m => animalIdsInSection.includes(m.animalId));
    }
    return filtered;
  }, [marCharts, selectedPatient, selectedSection, animals]);

  const filteredQuarantineRecords = useMemo(() => {
    if (!quarantineRecords) return [];
    let filtered = quarantineRecords;
    if (selectedPatient !== 'All') filtered = filtered.filter(q => q.animalId === selectedPatient);
    if (selectedSection !== 'All') {
      const animalIdsInSection = animals.filter(a => a.category === selectedSection).map(a => a.id);
      filtered = filtered.filter(q => animalIdsInSection.includes(q.animalId));
    }
    return filtered;
  }, [quarantineRecords, selectedPatient, selectedSection, animals]);

  const AddClinicalNoteDialog = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const form = useForm({
      defaultValues: { animal_id: '', urgency: 'Routine', note_type: 'Clinical', content: '', vitals_weight: 0, bcs_score: '3', plan: '' },
      onSubmit: async ({ value }) => {
        await addClinicalNote({
          animalId: value.animal_id,
          urgency: value.urgency,
          noteType: value.note_type,
          noteText: value.content,
          date: new Date().toISOString(),
          staffInitials: '??',
          vitalsWeight: value.vitals_weight,
          bcs: value.bcs_score,
          treatmentPlan: value.plan
        });
        onClose();
      },
    });

    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg space-y-4">
          <h2 className="text-xl font-bold">Add Clinical Note</h2>
          <form.Field name="animal_id" validators={{ onChange: ({ value }) => !value ? 'Required' : undefined }}>
            {(field) => (
              <select value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border p-2 rounded">
                <option value="">Select Patient</option>
                {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
          </form.Field>
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="note_type">
              {(field) => (
                <select value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border p-2 rounded">
                  <option value="Clinical">Clinical</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Lab Results">Lab Results</option>
                  <option value="Observation">Observation</option>
                </select>
              )}
            </form.Field>
            <form.Field name="urgency">
              {(field) => (
                <select value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border p-2 rounded">
                  <option value="Routine">Routine</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Critical">Critical</option>
                </select>
              )}
            </form.Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="vitals_weight">
              {(field) => <input type="number" value={field.state.value} onChange={e => field.handleChange(Number(e.target.value))} className="w-full border p-2 rounded" placeholder="Weight (kg)" />}
            </form.Field>
            <form.Field name="bcs_score">
              {(field) => (
                <select value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border p-2 rounded">
                  {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s}/5</option>)}
                </select>
              )}
            </form.Field>
          </div>
          <form.Field name="content" validators={{ onChange: ({ value }) => value.length < 10 ? 'Min 10 chars' : undefined }}>
            {(field) => <textarea value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border p-2 rounded" placeholder="Clinical Narrative" rows={3} />}
          </form.Field>
          <form.Field name="plan">
            {(field) => <textarea value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border p-2 rounded" placeholder="Treatment Plan" rows={2} />}
          </form.Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
          </div>
        </form>
      </div>
    );
  };

  const PatientHeader = ({ patientId }: { patientId: string }) => {
    const patient = animals.find(a => a.id === patientId);
    if (!patient) return null;
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-full text-blue-600"><FileText size={32} /></div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{patient.name}</h2>
            <div className="text-sm text-slate-500">Ring: {patient.ringNumber || 'N/A'} | Chip: {patient.microchipId || 'N/A'}</div>
          </div>
        </div>
        <div className="text-right text-sm text-slate-600">Location: {patient.location || 'Unknown'}</div>
      </div>
    );
  };

  const SOAPCard = ({ note }: { note: ClinicalNote }) => (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 mb-4">
      <div className="flex justify-between text-xs text-slate-500 mb-3 border-b pb-2">
        <span>{new Date(note.date as string).toLocaleString()}</span>
        <span className="font-bold uppercase tracking-wider">{note.noteType}</span>
        <span>Recorded by: {note.staffInitials}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
        <div><span className="font-bold text-slate-500">S:</span> {note.noteText}</div>
        <div><span className="font-bold text-slate-500">O:</span> {note.vitalsWeight ? `${note.vitalsWeight}kg` : 'N/A'}</div>
        <div><span className="font-bold text-slate-500">A:</span> {note.diagnosis || 'N/A'}</div>
        <div><span className="font-bold text-slate-500">P:</span> {note.treatmentPlan || 'N/A'}</div>
      </div>
      <div className="text-[10px] text-slate-300 text-right">Seal: {note.date}</div>
    </div>
  );

  const HealthOversightSidebar = ({ patientId }: { patientId: string }) => {
    const patientMeds = marCharts.filter(m => m.animalId === patientId);
    return (
      <div className="w-80 bg-slate-50 p-6 border-l border-slate-200 h-full">
        <h3 className="font-bold text-slate-900 mb-4">Health Oversight</h3>
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Weight Trend</h4>
          <div className="text-sm text-slate-600">Last 3 entries: 2.1kg, 2.05kg, 2.12kg</div>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Active Meds</h4>
          {patientMeds.length === 0 ? <p className="text-sm text-slate-400">No active meds</p> : patientMeds.map(m => <div key={m.id} className="text-sm mb-2">{m.medication}: {m.dosage} {m.frequency}</div>)}
        </div>
      </div>
    );
  };

  const marColumns = useMemo(() => [
    marColumnHelper.accessor('medication', {
      header: 'Medication',
      cell: info => <span className="font-semibold text-slate-900">{info.getValue()}</span>
    }),
    marColumnHelper.accessor('animalName', {
      header: 'Animal',
      cell: info => info.getValue()
    }),
    marColumnHelper.accessor(row => `${row.dosage} / ${row.frequency}`, {
      id: 'dosage_freq',
      header: 'Dosage & Freq',
      cell: info => info.getValue()
    }),
    marColumnHelper.accessor(row => row, {
      id: 'dates',
      header: 'Start-End',
      cell: info => {
        const m = info.getValue();
        return `${new Date(m.startDate as string).toLocaleDateString('en-GB')} - ${m.endDate ? new Date(m.endDate as string).toLocaleDateString('en-GB') : 'Ongoing'}`;
      }
    }),
    marColumnHelper.accessor('status', {
      header: 'Status',
      cell: info => (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
          {info.getValue()}
        </span>
      )
    }),
    marColumnHelper.accessor(row => row, {
      id: 'actions',
      header: 'Actions',
      cell: info => {
        const m = info.getValue();
        return (
          <div className="flex gap-2">
            {m.integritySeal ? (
              <span title="Record Sealed"><Lock size={16} className="text-emerald-600" /></span>
            ) : (
              <button className="text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
            )}
            <button onClick={() => generateMarChartDocx(m)} className="text-slate-400 hover:text-blue-600 transition-colors"><Download size={16} /></button>
          </div>
        );
      }
    })
  ] as unknown as ColumnDef<MARChart, unknown>[], []);

  const quarantineColumns = useMemo(() => [
    quarantineColumnHelper.accessor('animalName', {
      header: 'Animal',
      cell: info => <span className="font-semibold text-slate-900">{info.getValue()}</span>
    }),
    quarantineColumnHelper.accessor('reason', {
      header: 'Reason',
      cell: info => info.getValue()
    }),
    quarantineColumnHelper.accessor('startDate', {
      header: 'Start',
      cell: info => new Date(info.getValue() as string).toLocaleDateString('en-GB')
    }),
    quarantineColumnHelper.accessor('endDate', {
      header: 'Target Release',
      cell: info => new Date(info.getValue() as string).toLocaleDateString('en-GB')
    }),
    quarantineColumnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${status === 'Active' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {status}
          </span>
        );
      }
    }),
    quarantineColumnHelper.accessor('isolationNotes', {
      header: 'Notes',
      cell: info => <span className="max-w-xs truncate block">{info.getValue()}</span>
    }),
    quarantineColumnHelper.accessor(row => row, {
      id: 'actions',
      header: 'Actions',
      cell: info => {
        const q = info.getValue();
        return (
          <div className="flex gap-2">
            <button className="text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
            {q.status === 'Active' && (
              <button 
                onClick={() => updateQuarantineRecord({...q, status: 'Cleared'})}
                className="text-slate-400 hover:text-blue-600 transition-colors"
                title="Mark as Cleared"
              >
                <CheckCircle size={16} />
              </button>
            )}
          </div>
        );
      }
    })
  ] as unknown as ColumnDef<QuarantineRecord, unknown>[], [updateQuarantineRecord]);

  if (!permissions.view_medical) {

    return (
      <div className="p-8 flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex flex-col items-center gap-2 max-w-md text-center">
          <Lock size={48} className="opacity-50" />
          <h2 className="text-lg font-bold">Access Restricted</h2>
          <p className="text-sm font-medium">You do not have permission to view Medical Records. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Clinical Records...</div>;

  const handlePrintNote = (note: ClinicalNote) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Clinical Note - ${note.animalName}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              h1 { font-size: 24px; margin-bottom: 10px; }
              p { margin-bottom: 8px; }
              .label { font-weight: bold; }
              .section { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; }
            </style>
          </head>
          <body>
            <h1>Clinical Note: ${note.animalName}</h1>
            <p><span class="label">Date:</span> ${new Date(note.date as string).toLocaleDateString('en-GB')}</p>
            <p><span class="label">Type:</span> ${note.noteType}</p>
            <p><span class="label">Staff:</span> ${note.staffInitials}</p>
            ${note.diagnosis ? `<p><span class="label">Diagnosis:</span> ${note.diagnosis}</p>` : ''}
            ${note.bcs ? `<p><span class="label">BCS:</span> ${note.bcs}/5</p>` : ''}
            ${note.weight ? `<p><span class="label">Weight:</span> ${note.weight}${note.weightUnit || 'g'}</p>` : note.weightGrams ? `<p><span class="label">Weight:</span> ${note.weightGrams}g</p>` : ''}
            
            <div class="section">
              <h3>Clinical Observation</h3>
              <p style="white-space: pre-wrap;">${note.noteText}</p>
            </div>

            ${note.treatmentPlan ? `
              <div class="section">
                <h3>Treatment Plan</h3>
                <p style="white-space: pre-wrap;">${note.treatmentPlan}</p>
              </div>
            ` : ''}

            ${note.recheckDate ? `<div class="section"><p><span class="label">Recheck Date:</span> ${new Date(note.recheckDate as string).toLocaleDateString('en-GB')}</p></div>` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-slate-900">Medical Records</h1>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'notes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
        >
          Clinical Notes
        </button>
        <button
          onClick={() => setActiveTab('mar')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'mar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
        >
          MAR Charts
        </button>
        <button
          onClick={() => setActiveTab('quarantine')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'quarantine' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
        >
          Quarantine
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-4">
          <select 
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Sections</option>
            {Array.from(new Set(animals.map(a => a.category))).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            {patientOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'notes') setIsAddNoteOpen(true);
            else if (activeTab === 'mar') setIsAddMarOpen(true);
            else if (activeTab === 'quarantine') setIsAddQuarantineOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Add Record
        </button>
      </div>

      {/* Data Display */}
      {viewMode === 'chart' ? (
        <div className="flex h-full">
          <div className="flex-1 pr-6">
            <PatientHeader patientId={selectedPatient} />
            {activeTab === 'notes' && (
              <div className="space-y-4">
                {filteredNotes.map(note => <SOAPCard key={note.id} note={note} />)}
              </div>
            )}
            {activeTab === 'mar' && <DataTable columns={marColumns} data={filteredMarCharts} pageSize={10} />}
            {activeTab === 'quarantine' && <DataTable columns={quarantineColumns} data={filteredQuarantineRecords} pageSize={10} />}
          </div>
          <HealthOversightSidebar patientId={selectedPatient} />
        </div>
      ) : (
        <>
          {activeTab === 'notes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map(note => {
                const animal = animals.find(a => a.id === note.animalId);
                return <MedicalCard key={note.id} note={note} patientName={animal?.name || 'Unknown'} patientId={note.animalId} />;
              })}
            </div>
          )}
          {activeTab === 'mar' && (
            <DataTable columns={marColumns} data={filteredMarCharts} pageSize={10} />
          )}
          {activeTab === 'quarantine' && (
            <DataTable columns={quarantineColumns} data={filteredQuarantineRecords} pageSize={10} />
          )}
        </>
      )}
      <AddClinicalNoteDialog isOpen={isAddNoteOpen} onClose={() => setIsAddNoteOpen(false)} />
      <ClinicalNoteDetailSidebar note={selectedNote} onClose={() => setSelectedNote(null)} onPrint={handlePrintNote} />
    </div>
  );
};

export default MedicalRecords;
