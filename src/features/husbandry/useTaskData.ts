import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { Task } from '../../types';
import { tasksCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase } from '../../lib/dataMapping';

export const useTaskData = () => {
  const queryClient = useQueryClient();

  // Swapped to useLiveQuery with circuit breaker pattern
  const { data: tasks = [], isLoading } = useLiveQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        
        const camelCaseData = mapToCamelCase<Task>(data as Record<string, unknown>[]) as Task[];

        return camelCaseData.map((item: Task): Task => ({
          ...item,
          id: item.id ?? crypto.randomUUID(),
          title: item.title ?? "Untitled Task",
          dueDate: item.dueDate ?? new Date().toISOString(),
          completed: item.completed ?? false,
          isDeleted: item.isDeleted ?? false,
        }));
      } catch {
        console.warn("Network unreachable. Serving tasks from local vault.");
        return await tasksCollection.getAll();
      }
    }
  });

  // Routed all mutations strictly through offline failover vault
  const addTaskMutation = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const task = {
        ...newTask,
        id: newTask.id || crypto.randomUUID(),
        dueDate: newTask.dueDate || new Date().toISOString(),
        completed: newTask.completed || false,
        isDeleted: false
      } as Task;

      await tasksCollection.insert(task);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error("Task not found");
      
      await tasksCollection.update(taskId, { completed: true });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await tasksCollection.delete(taskId);
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
