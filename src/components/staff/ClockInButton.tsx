import React, { useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { useTimesheetData } from '../../features/staff/useTimesheetData';
import { useAuthStore } from '../../store/authStore';
import { TimesheetStatus } from '../../types';

export const ClockInButton: React.FC = () => {
  // Swapped out legacy clockIn/clockOut for the standardized CRUD hooks
  const { timesheets, addTimesheet, updateTimesheet } = useTimesheetData();
  const { currentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const openShift = timesheets.find(t => 
    t.staffName === currentUser?.name && 
    t.status === TimesheetStatus.ACTIVE && 
    !t.clockOut
  );

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();

      if (openShift) {
        // Calculate the duration of the shift locally before updating the vault
        const durationMs = new Date(now).getTime() - new Date(openShift.clockIn).getTime();
        const totalHours = Number((durationMs / (1000 * 60 * 60)).toFixed(2));

        await updateTimesheet({
          id: openShift.id,
          clockOut: now,
          totalHours,
          status: TimesheetStatus.COMPLETED
        });
      } else if (currentUser?.name) {
        await addTimesheet({
          staffName: currentUser.name,
          date: now.split('T')[0],
          clockIn: now,
          status: TimesheetStatus.ACTIVE,
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`System Error: ${err.message}`);
      } else {
        alert('System Error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || !currentUser}
      className={`
        flex items-center px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all shadow-sm
        ${openShift 
          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Clock size={16} className="mr-2" />}
      {openShift ? 'Clock Out' : 'Clock In'}
    </button>
  );
};
