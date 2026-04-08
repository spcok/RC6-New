import React, { useState, useMemo } from 'react';
import { useMedicalData } from './useMedicalData';
import { useAnimalsData } from '../animals/useAnimalsData';
import { usePermissions } from '../../hooks/usePermissions';
import { AlertTriangle, User, ShieldCheck, Plus, CheckCircle, Clock } from 'lucide-react';
import { MARChart } from '../../types';
import { AddMarChartModal } from './AddMarChartModal';

interface MarChartsProps {
  animalId?: string;
}

const PrescriptionCard = ({ mar, isSelected, onClick }: { mar: MARChart; isSelected: boolean; onClick: () => void }) => {
  const isActive = mar.status === 'Active';
  
  return (
    <div 
      onClick={onClick}
      className={`p-4 border-b cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="font-bold text-sm text-slate-900">{mar.animalName || 'Unknown Patient'}</span>
        {isActive ? (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
        ) : (
          <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">COMPLETED</span>
        )}
      </div>
      <div className="text-sm font-semibold text-blue-900">{mar.medication}</div>
      <div className="text-xs text-slate-600 mt-1">{mar.dosage} • {mar.frequency}</div>
      {isActive && (
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 font-medium">
          <AlertTriangle size={12} /> Dose due today
        </div>
      )}
    </div>
  );
};

const PrescriptionDetailPane = ({ mar }: { mar: MARChart | null }) => {
  if (!mar) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
        <p>Select a prescription to view details</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{mar.medication}</h2>
          <p className="text-sm text-slate-500">Patient: <span className="font-semibold text-slate-700">{mar.animalName}</span></p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${mar.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
          {mar.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8 p-4 bg-slate-50 rounded-lg">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Dates</label>
          <div className="text-sm mt-1">
            {new Date(mar.startDate).toLocaleDateString()} &rarr; {mar.endDate ? new Date(mar.endDate).toLocaleDateString() : 'Ongoing'}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Prescribing Vet / Clinic</label>
          <div className="flex items-center gap-2 mt-1 text-sm"><User size={16} /> {mar.staffInitials || 'External Vet'}</div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-slate-900 mb-3 border-b pb-2">Instructions</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-bold uppercase mb-1">Dosage</div>
            <div className="font-semibold text-slate-900">{mar.dosage}</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-bold uppercase mb-1">Route</div>
            <div className="font-semibold text-slate-900">PO (Oral)</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-bold uppercase mb-1">Frequency</div>
            <div className="font-semibold text-slate-900">{mar.frequency}</div>
          </div>
        </div>
        {mar.instructions && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-bold text-amber-900 text-sm mb-1">Special Instructions</h4>
            <p className="text-sm text-amber-800">{mar.instructions}</p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-3 border-b pb-2">
          <h3 className="font-bold text-slate-900">Administration Log</h3>
          {mar.status === 'Active' && (
            <button className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <CheckCircle size={16} /> Log Dose Administered
            </button>
          )}
        </div>
        
        {mar.administeredDates && mar.administeredDates.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Administered By</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mar.administeredDates.map((dateStr, idx) => {
                  const [datePart, initialsPart] = dateStr.split('|');
                  const dateObj = new Date(datePart);
                  const displayDate = isNaN(dateObj.getTime()) ? dateStr : dateObj.toLocaleString();
                  const initials = initialsPart || mar.staffInitials || 'Keeper';
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 flex items-center gap-2"><Clock size={14} className="text-slate-400"/> {displayDate}</td>
                      <td className="px-4 py-3 font-medium">{initials}</td>
                      <td className="px-4 py-3"><span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={14}/> Given</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-6 border border-dashed rounded-lg text-slate-500 text-sm">
            No doses have been logged yet.
          </div>
        )}
      </div>

      <div className="mt-8 pt-4 border-t text-xs text-slate-400 flex justify-between">
        <span>System Timestamp: {new Date().toISOString()}</span>
        <span className="flex items-center gap-1"><ShieldCheck size={14} /> Integrity Seal: {mar.id}</span>
      </div>
    </div>
  );
};

const MarCharts: React.FC<MarChartsProps> = ({ animalId }) => {
  const { marCharts = [], isLoading } = useMedicalData(animalId);
  const { animals } = useAnimalsData();
  const permissions = usePermissions();

  const [selectedPatientId, setSelectedPatientId] = useState<string>(animalId || 'All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active');
  const [selectedPrescription, setSelectedPrescription] = useState<MARChart | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredCharts = useMemo(() => {
    let charts = marCharts;
    if (selectedPatientId !== 'All') charts = charts.filter(c => c.animalId === selectedPatientId);
    if (filterStatus !== 'all') {
      charts = charts.filter(c => c.status.toLowerCase() === filterStatus);
    }
    return charts;
  }, [marCharts, selectedPatientId, filterStatus]);

  if (!permissions.view_medical) return <div className="p-8 text-center">Access Restricted</div>;
  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-white">
        <h1 className="text-xl font-bold">Medication Administration</h1>
        <div className="flex gap-2">
          <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="border rounded p-2 text-sm">
            <option value="All">All Patients</option>
            {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'completed')} className="border rounded p-2 text-sm">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"><Plus size={16} /> New Prescription</button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 overflow-y-auto border-r bg-white">
          {filteredCharts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No prescriptions found.</div>
          ) : (
            filteredCharts.map(mar => (
              <PrescriptionCard key={mar.id} mar={mar} isSelected={selectedPrescription?.id === mar.id} onClick={() => setSelectedPrescription(mar)} />
            ))
          )}
        </div>
        <PrescriptionDetailPane mar={selectedPrescription} />
      </div>
      <AddMarChartModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};

export default MarCharts;
