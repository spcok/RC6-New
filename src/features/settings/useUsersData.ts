import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase } from '../../lib/dataMapping';
import { UserProfile } from '../../types';

export const useUsersData = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('is_deleted', false);
        if (error) throw error;

        if (!data) return [];

        const camelCaseData = mapToCamelCase<UserProfile[]>(data);

        // Refresh local vault (Upsert Pattern)
        setTimeout(async () => {
          for (const item of camelCaseData) {
            try {
              const existingRecord = await usersCollection.findById(item.id);
              if (existingRecord) {
                await usersCollection.update(item);
              } else {
                await usersCollection.insert(item);
              }
            } catch (e) {
              console.warn(`[Vault Sync Warning] Failed to upsert record ${item.id}:`, e);
            }
          }
        }, 0);
        return camelCaseData;
      } catch {
        console.warn("Network unreachable. Serving users from local vault.");
        const localData = await usersCollection.getAll();
        return localData as unknown as UserProfile[];
      }
    }
  });

  const updateUserMutation = useMutation({
    onMutate: async (user: UserProfile) => {
      await usersCollection.update(user);
    },
    mutationFn: async (user: UserProfile) => {
      // Map back to snake_case for Supabase
      const supabasePayload = {
        name: user.name,
        email: user.email,
        role: user.role,
        is_deleted: user.isDeleted ?? false
      };
      
      const { error } = await supabase.from('users').update(supabasePayload).eq('id', user.id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  return { 
    users, 
    isLoading,
    updateUser: updateUserMutation.mutateAsync
  };
};
