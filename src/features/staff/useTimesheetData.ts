import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timesheetsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Timesheet } from '../../types';

const sanitizePayload = (payload: Record<string, unknown>) => {
  const clean = { ...payload };
  Object.keys(clean).forEach(key => {
    if (key.startsWith('$')) delete clean[key];
  });
  return clean;
};

export function useTimesheetData() {
  const queryClient = useQueryClient();

  const { data: timesheets = [], isLoading } = useQuery<Timesheet[]>({
    queryKey: ['timesheets'],
    queryFn: async () => {
      try {
        // 1. ONLINE FIRST
        const { data, error } = await supabase.from('timesheets').select('*');
        if (error) throw error;
        
        // 2. REFRESH FAILOVER (Background)
        data.forEach(item => {
          const draft = item as Timesheet;
          // Architectural Rule 3: Strict draft object mutation
          timesheetsCollection.update(draft).catch(() => timesheetsCollection.insert(draft));
        });
        
        return data as Timesheet[];
      } catch {
        console.warn("Network unreachable. Falling back to 14-day local vault.");
        // 3. OFFLINE FAILOVER
        return await timesheetsCollection.getAll();
      }
    }
  });

  const clockInMutation = useMutation({
    onMutate: async (staffName: string) => {
      const newShift: Timesheet = {
        id: crypto.randomUUID(),
        staffName,
        date: new Date().toISOString().split('T')[0],
        clockIn: new Date().toISOString(),
        status: 'Active' as const,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      };
      await timesheetsCollection.insert(newShift);
      return { newShift };
    },
    mutationFn: async (staffName: string, variables, context) => {
      const newShift = (context as { newShift: Timesheet })?.newShift || { id: crypto.randomUUID(), staffName };
      const cloudPayload = {
        id: newShift.id,
        staff_name: newShift.staffName,
        date: newShift.date,
        clock_in: newShift.clockIn,
        status: newShift.status,
        is_deleted: false,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('timesheets').insert([cloudPayload]);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  const clockOutMutation = useMutation({
    onMutate: async (timesheetId: string) => {
      const existing = timesheets.find(t => t.id === timesheetId);
      if (existing) {
        const updatedShift = { ...existing, clockOut: new Date().toISOString(), status: 'Completed' as const };
        await timesheetsCollection.update(timesheetId, () => updatedShift as Timesheet);
      }
    },
    mutationFn: async (timesheetId: string) => {
      const clockOut = new Date().toISOString();
      const { error } = await supabase.from('timesheets').update({ clock_out: clockOut, status: 'Completed' }).eq('id', timesheetId);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  const addTimesheetMutation = useMutation({
    mutationFn: async (timesheet: Omit<Timesheet, 'id'>) => {
      const payload: Timesheet = { ...timesheet, id: crypto.randomUUID(), is_deleted: false };
      
      const cloudPayload = sanitizePayload(payload);

      try {
        const { error } = await supabase.from('timesheets').insert([cloudPayload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding timesheet locally.");
      }
      await timesheetsCollection.insert(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  const deleteTimesheetMutation = useMutation({
    mutationFn: async (id: string) => {
      const existing = timesheets.find(t => t.id === id);
      if (!existing) throw new Error("Timesheet not found");
      
      const cloudPayload = sanitizePayload({ is_deleted: true });

      try {
        const { error } = await supabase.from('timesheets').update(cloudPayload).eq('id', id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Deleting timesheet locally.");
      }
      
      // Architectural Rule 3: Strict draft object mutation
      const deletedShift: Timesheet = { ...existing, is_deleted: true };
      await timesheetsCollection.update(deletedShift);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  return {
    timesheets: timesheets.filter(t => !t.is_deleted),
    isLoading,
    clockIn: clockInMutation.mutateAsync,
    clockOut: clockOutMutation.mutateAsync,
    addTimesheet: addTimesheetMutation.mutateAsync,
    deleteTimesheet: deleteTimesheetMutation.mutateAsync,
    isMutating: clockInMutation.isPending || clockOutMutation.isPending || addTimesheetMutation.isPending || deleteTimesheetMutation.isPending
  };
}