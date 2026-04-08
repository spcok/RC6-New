import React, { useState, useMemo } from 'react';
import { useMedicalData } from './useMedicalData';
import { useAnimalsData } from '../animals/useAnimalsData';
import { usePermissions } from '../../hooks/usePermissions';
import { Shield, ShieldAlert, CheckCircle, Plus } from 'lucide-react';
import { QuarantineRecord } from '../../types';

interface QuarantineRecordsProps {
  animalId?: string;
}

const QuarantineCard = ({ record, isSelected, onClick }: { record: QuarantineRecord; isSelected: boolean; onClick: () => void }) => {
  const isActive = record.status === 'Active';
  
  return (
    <div 
      onClick={onClick}
      className={`p-4 border-b cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="font-bold text-sm text-slate-900">{record.animalName || 'Unknown Patient'}</span>
        {isActive ? (
          <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <ShieldAlert size={10} /> ACTIVE
          </span>
        ) : (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <CheckCircle size={10} /> CLEARED
          </span>
        )}
      </div>
      <div className="text-sm font-semibold text-slate-700">{record.reason}</div>
      <div className="text-xs text-slate-500 mt-1">
        {new Date(record.startDate).toLocaleDateString()} - {record.endDate ? new Date(record.endDate).toLocaleDateString() : 'TBD'}
      </div>
    </div>
  );
};

const QuarantineDetailPane = ({ record, onClear }: { record: QuarantineRecord | null; onClear: (record: QuarantineRecord) => void }) => {
  if (!record) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
        <div className="text-center flex flex-col items-center">
          <Shield size={48} className="mb-4 opacity-20" />
          <p>Select an isolation record to view details</p>
        </div>
      </div>
    );
  }

  const isActive = record.status === 'Active';

  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{record.reason}</h2>
          <p className="text-sm text-slate-500">Patient: <span className="font-semibold text-slate-700">{record.animalName}</span></p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isActive ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {isActive ? <ShieldAlert size={14} /> : <CheckCircle size={14} />}
          {record.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8 p-4 bg-slate-50 rounded-lg">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
          <div className="text-sm mt-1 font-medium">{new Date(record.startDate).toLocaleDateString()}</div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Target Release Date</label>
          <div className="text-sm mt-1 font-medium">{record.endDate ? new Date(record.endDate).toLocaleDateString() : 'TBD'}</div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-slate-900 mb-3 border-b pb-2 flex items-center gap-2">
          <Shield size={18} className="text-slate-400" /> Biosecurity Instructions
        </h3>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900 whitespace-pre-wrap">{record.isolationNotes || 'No specific biosecurity instructions provided.'}</p>
        </div>
      </div>

      <div className="mt-8">
        {isActive ? (
          <div className="p-6 border border-slate-200 rounded-lg bg-white shadow-sm text-center">
            <h3 className="font-bold text-slate-900 mb-2">Clear from Quarantine</h3>
            <p className="text-sm text-slate-500 mb-4">Mark this patient as cleared from isolation protocols.</p>
            <button 
              onClick={() => onClear(record)}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <CheckCircle size={18} /> Mark as Cleared
            </button>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800">
            <CheckCircle size={24} className="text-emerald-600" />
            <div>
              <div className="font-bold">Quarantine Cleared</div>
              <div className="text-sm">This patient has been cleared from isolation protocols.</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 pt-4 border-t text-xs text-slate-400 flex justify-between">
        <span>Recorded by: {record.staffInitials}</span>
        <span>Record ID: {record.id}</span>
      </div>
    </div>
  );
};

const QuarantineRecords: React.FC<QuarantineRecordsProps> = ({ animalId }) => {
  const { quarantineRecords = [], isLoading, updateQuarantineRecord } = useMedicalData(animalId);
  const { animals } = useAnimalsData();
  const permissions = usePermissions();

  const [selectedPatientId, setSelectedPatientId] = useState<string>(animalId || 'All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'cleared'>('active');
  const [selectedRecord, setSelectedRecord] = useState<QuarantineRecord | null>(null);

  const filteredRecords = useMemo(() => {
    let records = quarantineRecords;
    if (selectedPatientId !== 'All') records = records.filter(r => r.animalId === selectedPatientId);
    if (filterStatus !== 'all') {
      records = records.filter(r => r.status.toLowerCase() === filterStatus);
    }
    return records;
  }, [quarantineRecords, selectedPatientId, filterStatus]);

  const handleClearRecord = async (record: QuarantineRecord) => {
    await updateQuarantineRecord({ ...record, status: 'Cleared' });
    // Update local selected record state to reflect the change immediately
    setSelectedRecord({ ...record, status: 'Cleared' });
  };

  if (!permissions.view_medical) return <div className="p-8 text-center">Access Restricted</div>;
  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-white">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="text-slate-400" /> Quarantine & Biosecurity
        </h1>
        <div className="flex gap-2">
          <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="border rounded p-2 text-sm">
            <option value="All">All Patients</option>
            {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'cleared')} className="border rounded p-2 text-sm">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="cleared">Cleared</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm">
            <Plus size={16} /> New Isolation
          </button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 overflow-y-auto border-r bg-white">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No quarantine records found.</div>
          ) : (
            filteredRecords.map(record => (
              <QuarantineCard 
                key={record.id} 
                record={record} 
                isSelected={selectedRecord?.id === record.id} 
                onClick={() => setSelectedRecord(record)} 
              />
            ))
          )}
        </div>
        <QuarantineDetailPane record={selectedRecord} onClear={handleClearRecord} />
      </div>
    </div>
  );
};

export default QuarantineRecords;
