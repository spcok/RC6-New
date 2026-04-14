import { useLiveQuery } from '@tanstack/react-db';
import { tasksCollection } from '../../lib/db';
import { Task } from '../../types';

export const useTaskData = () => {
  // NATIVE SELECTOR: Handshake complete.
  const { data: tasks = [], isLoading } = useLiveQuery((q) => 
    q.from({ item: tasksCollection })
  );

  return { 
    tasks: tasks.filter((t: Task) => !t.isDeleted), 
    isLoading, 
    addTask: async (newTask: Partial<Task>) => {
      const task = { ...newTask, id: newTask.id || crypto.randomUUID(), isDeleted: false };
      await tasksCollection.insert(task);
    }, 
    completeTask: async (taskId: string) => {
      await tasksCollection.update(taskId, { completed: true });
    },
    deleteTask: async (taskId: string) => {
      await tasksCollection.delete(taskId);
    }
  };
};
