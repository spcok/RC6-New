import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '../../types';
import { tasksCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase } from '../../lib/dataMapping';

const sanitizePayload = <T extends Record<string, unknown>>(payload: T): T => {
  const sanitized = { ...payload };
  Object.keys(sanitized).forEach(key => {
    if (key.startsWith('$')) delete sanitized[key];
  });
  return sanitized;
};

export const useTaskData = () => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        
        const camelCaseData = mapToCamelCase<Task>(data as Record<string, unknown>[]) as Task[];

        const mappedData: Task[] = camelCaseData.map((item: Task): Task => ({
          ...item,
          id: item.id ?? crypto.randomUUID(),
          title: item.title ?? "Untitled Task",
          dueDate: item.dueDate ?? new Date().toISOString(),
          completed: item.completed ?? false,
          isDeleted: item.isDeleted ?? false,
        }));
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving tasks from local vault.");
        return await tasksCollection.getAll();
      }
    }
  });

  const addTaskMutation = useMutation({
    onMutate: async (newTask: Partial<Task>) => {
      const task: Task = sanitizePayload({
        ...newTask,
        id: newTask.id || crypto.randomUUID(),
        dueDate: newTask.dueDate || new Date().toISOString(),
        completed: newTask.completed || false,
        isDeleted: false
      } as Task);
      await tasksCollection.sync(task);
      return { task };
    },
    mutationFn: async (newTask: Partial<Task>) => {
      const task = sanitizePayload({
        ...newTask,
        id: newTask.id || crypto.randomUUID(),
        dueDate: newTask.dueDate || new Date().toISOString(),
        completed: newTask.completed || false,
        isDeleted: false
      } as Task);

      const supabasePayload = {
        id: task.id,
        animal_id: task.animalId,
        title: task.title,
        notes: task.notes,
        due_date: task.dueDate,
        completed: task.completed,
        type: task.type,
        recurring: task.recurring,
        assigned_to: task.assignedTo,
        updated_at: task.updatedAt,
        is_deleted: task.isDeleted
      };

      const { error } = await supabase.from('tasks').insert([supabasePayload]);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const completeTaskMutation = useMutation({
    onMutate: async (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error("Task not found");
      
      const updatedTask = sanitizePayload({ ...task, completed: true });
      await tasksCollection.update(taskId, { completed: true });
      return { updatedTask };
    },
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').update({ completed: true }).eq('id', taskId);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTaskMutation = useMutation({
    onMutate: async (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error("Task not found");
      
      const updatedTask = sanitizePayload({ ...task, isDeleted: true });
      await tasksCollection.update(taskId, { isDeleted: true });
      return { updatedTask };
    },
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').update({ is_deleted: true }).eq('id', taskId);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  return { 
    tasks: tasks.filter(t => !t.isDeleted), 
    isLoading, 
    addTask: addTaskMutation.mutateAsync, 
    completeTask: completeTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync
  };
};
