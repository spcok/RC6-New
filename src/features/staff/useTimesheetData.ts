import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timesheetsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Timesheet } from '../../types';
import { mapToCamelCase } from '../../lib/dataMapping';

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
        const { data, error } = await supabase.from('timesheets').select('*');
        if (error) throw error;
        
        const mappedData: Timesheet[] = data.map((item: Record<string, unknown>) => mapToCamelCase<Timesheet>(item));

        setTimeout(async () => {
          for (const item of mappedData) {
            await timesheetsCollection.sync(item);
          }
        }, 0);
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Falling back to 14-day local vault.");
        return await timesheetsCollection.getAll();
      }
    }
  });

  const clockInMutation = useMutation({
    onMutate: async (staffName: string) => {
      await queryClient.cancelQueries({ queryKey: ['timesheets'] });
      const previousTimesheets = queryClient.getQueryData<Timesheet[]>(['timesheets']);
      
      const newShift: Timesheet = {
        id: crypto.randomUUID(),
        staffName,
        date: new Date().toISOString().split('T')[0],
        clockIn: new Date().toISOString(),
        status: 'Active' as const,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(['timesheets'], [...(previousTimesheets || []), newShift]);
      await timesheetsCollection.sync(newShift);
      
      return { previousTimesheets };
    },
    mutationFn: async (staffName: string) => {
      const newShift = { id: crypto.randomUUID(), staffName };
      const cloudPayload = {
        id: newShift.id,
        staff_name: newShift.staffName,
        date: new Date().toISOString().split('T')[0],
        clock_in: new Date().toISOString(),
        status: 'Active',
        is_deleted: false,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('timesheets').insert([cloudPayload]);
      if (error) throw error;
    },
    onError: (_err, _staffName, context) => {
      queryClient.setQueryData(['timesheets'], context?.previousTimesheets);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  const clockOutMutation = useMutation({
    onMutate: async (timesheetId: string) => {
      await queryClient.cancelQueries({ queryKey: ['timesheets'] });
      const previousTimesheets = queryClient.getQueryData<Timesheet[]>(['timesheets']);
      
      queryClient.setQueryData(['timesheets'], (old: Timesheet[] = []) => 
        old.map(t => t.id === timesheetId ? { ...t, clockOut: new Date().toISOString(), status: 'Completed' as const } : t)
      );
      
      await timesheetsCollection.update(timesheetId, { 
        clockOut: new Date().toISOString(), 
        status: 'Completed' 
      });
      
      return { previousTimesheets };
    },
    mutationFn: async (timesheetId: string) => {
      const clockOut = new Date().toISOString();
      const { error } = await supabase.from('timesheets').update({ clock_out: clockOut, status: 'Completed' }).eq('id', timesheetId);
      if (error) throw error;
    },
    onError: (_err, _timesheetId, context) => {
      queryClient.setQueryData(['timesheets'], context?.previousTimesheets);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  const addTimesheetMutation = useMutation({
    onMutate: async (timesheet: Omit<Timesheet, 'id'>) => {
      await queryClient.cancelQueries({ queryKey: ['timesheets'] });
      const previousTimesheets = queryClient.getQueryData<Timesheet[]>(['timesheets']);
      
      const payload: Timesheet = sanitizePayload({ ...timesheet, id: crypto.randomUUID(), isDeleted: false } as Timesheet) as Timesheet;
      
      queryClient.setQueryData(['timesheets'], [...(previousTimesheets || []), payload]);
      await timesheetsCollection.sync(payload);
      
      return { previousTimesheets };
    },
    mutationFn: async (timesheet: Omit<Timesheet, 'id'>) => {
      const payload = { ...timesheet, id: crypto.randomUUID(), isDeleted: false };
      const cloudPayload = sanitizePayload(payload as unknown as Record<string, unknown>);

      const { error } = await supabase.from('timesheets').insert([cloudPayload]);
      if (error) throw error;
    },
    onError: (_err, _timesheet, context) => {
      queryClient.setQueryData(['timesheets'], context?.previousTimesheets);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  const deleteTimesheetMutation = useMutation({
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['timesheets'] });
      const previousTimesheets = queryClient.getQueryData<Timesheet[]>(['timesheets']);
      
      queryClient.setQueryData(['timesheets'], (old: Timesheet[] = []) => 
        old.map(t => t.id === id ? { ...t, isDeleted: true } : t)
      );
      
      await timesheetsCollection.update(id, { isDeleted: true });
      
      return { previousTimesheets };
    },
    mutationFn: async (id: string) => {
      const cloudPayload = sanitizePayload({ is_deleted: true });
      const { error } = await supabase.from('timesheets').update(cloudPayload).eq('id', id);
      if (error) throw error;
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['timesheets'], context?.previousTimesheets);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  return {
    timesheets: timesheets.filter(t => !t.isDeleted),
    isLoading,
    clockIn: clockInMutation.mutateAsync,
    clockOut: clockOutMutation.mutateAsync,
    addTimesheet: addTimesheetMutation.mutateAsync,
    deleteTimesheet: deleteTimesheetMutation.mutateAsync,
    isMutating: clockInMutation.isPending || clockOutMutation.isPending || addTimesheetMutation.isPending || deleteTimesheetMutation.isPending
  };
}
