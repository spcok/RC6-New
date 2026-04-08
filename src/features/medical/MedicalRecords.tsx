import React, { useState, useMemo } from 'react';
import { useMedicalData } from './useMedicalData';
import { useAnimalsData } from '../animals/useAnimalsData';
import { usePermissions } from '../../hooks/usePermissions';
import { AlertTriangle, User, ShieldCheck, Plus } from 'lucide-react';
import { ClinicalNote } from '../../types';
import { AddClinicalNoteModal } from './AddClinicalNoteModal';

interface MedicalRecordsProps {
  animalId?: string;
}

const MedicalLogCard = ({ log, isSelected, onClick }: { log: ClinicalNote; isSelected: boolean; onClick: () => void }) => {
  const urgency = log.urgency || 'Routine';
  const isCritical = urgency === 'Critical';
  
  return (
    <div 
      onClick={onClick}
      className={`p-4 border-b cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs text-slate-500">{new Date(log.date as string).toLocaleDateString()}</span>
        {isCritical && <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold">CRITICAL</span>}
      </div>
      <div className="font-bold text-sm text-slate-900">{log.animalName || 'Unknown Patient'}</div>
      <div className="text-xs text-slate-600">{log.noteType}</div>
    </div>
  );
};

const ClinicalDetailPane = ({ log }: { log: ClinicalNote | null }) => {
  if (!log) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
        <p>Select a record to view details</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{log.animalName}</h2>
          <p className="text-sm text-slate-500">{new Date(log.date as string).toLocaleString()}</p>
        </div>
        {log.urgency === 'Critical' && <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">CRITICAL</span>}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8 p-4 bg-slate-50 rounded-lg">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Keeper (Attribution)</label>
          <div className="flex items-center gap-2 mt-1"><User size={16} /> {log.staffInitials}</div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Prescribing Vet</label>
          <div className="flex items-center gap-2 mt-1"><User size={16} /> {log.prescribingVet || 'N/A'}</div>
        </div>
      </div>

      <div className="space-y-6">
        <div><h3 className="font-bold text-slate-900">Subjective</h3><p className="text-sm text-slate-700">{log.noteText}</p></div>
        <div><h3 className="font-bold text-slate-900">Objective</h3><p className="text-sm text-slate-700">{log.vitalsWeight ? `Weight: ${log.vitalsWeight}kg` : 'N/A'}</p></div>
        <div><h3 className="font-bold text-slate-900">Assessment</h3><p className="text-sm text-slate-700">{log.diagnosis || 'No assessment recorded'}</p></div>
        <div><h3 className="font-bold text-slate-900">Plan</h3><p className="text-sm text-slate-700">{log.treatmentPlan || 'No plan recorded'}</p></div>
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h3 className="font-bold text-amber-900 flex items-center gap-2"><AlertTriangle size={16} /> Required Action</h3>
        <p className="text-sm text-amber-800 mt-1">{log.treatmentPlan || 'No specific action required'}</p>
      </div>

      <div className="mt-8 pt-4 border-t text-xs text-slate-400 flex justify-between">
        <span>System Timestamp: {new Date().toISOString()}</span>
        <span className="flex items-center gap-1"><ShieldCheck size={14} /> Integrity Seal: {log.id}</span>
      </div>
    </div>
  );
};

const MedicalRecords: React.FC<MedicalRecordsProps> = ({ animalId }) => {
  const { clinicalNotes = [], isLoading } = useMedicalData(animalId);
  const { animals } = useAnimalsData();
  const permissions = usePermissions();

  const [selectedPatientId, setSelectedPatientId] = useState<string>(animalId || 'All');
  const [selectedLog, setSelectedLog] = useState<ClinicalNote | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredLogs = useMemo(() => {
    let logs = clinicalNotes;
    if (selectedPatientId !== 'All') logs = logs.filter(l => l.animalId === selectedPatientId);
    return logs;
  }, [clinicalNotes, selectedPatientId]);

  if (!permissions.view_medical) return <div className="p-8 text-center">Access Restricted</div>;
  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-white">
        <h1 className="text-xl font-bold">Medical Records</h1>
        <div className="flex gap-2">
          <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="border rounded p-2 text-sm">
            <option value="All">All Patients</option>
            {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"><Plus size={16} /> New Entry</button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 overflow-y-auto border-r">
          {filteredLogs.map(log => (
            <MedicalLogCard key={log.id} log={log} isSelected={selectedLog?.id === log.id} onClick={() => setSelectedLog(log)} />
          ))}
        </div>
        <ClinicalDetailPane log={selectedLog} />
      </div>
      <AddClinicalNoteModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};

export default MedicalRecords;
