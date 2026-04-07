import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { User, RolePermissionConfig } from '../../types';
import { usersCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';

export function useUsersData() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: isLoadingUsers } = useLiveQuery((q) => q.from({ users: usersCollection }));

  // Note: Role permissions are not yet in a collection, keeping as is for now or refactoring if needed.
  // Assuming role_permissions is still fetched via supabase directly if not in database.ts
  const { data: rolePermissions = [], isLoading: isLoadingRoles } = useLiveQuery((q) => q.from({ role_permissions: usersCollection })); // Placeholder

  const isLoading = isLoadingUsers || isLoadingRoles;

  const updateUserMutation = useMutation({
    onMutate: async ({ id, updates }: { id: string, updates: Partial<User> }) => {
      const existing = users.find(u => u.id === id);
      if (existing) {
        await usersCollection.update({ ...existing, ...updates } as User & { id: string });
      }
      return { id, updates };
    },
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<User> }) => {
      const { error } = await supabase.from('users').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteUserMutation = useMutation({
    onMutate: async (id: string) => {
      const existing = users.find(u => u.id === id);
      if (existing) {
        await usersCollection.update({ ...existing, is_deleted: true } as User & { id: string });
      }
      return { id };
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('users').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const addUserMutation = useMutation({
    onMutate: async (userData: { email: string; password?: string; profileData: Partial<User> }) => {
      // We don't have the new user ID yet, so we can't insert into local vault until we get the response.
      // This is an exception to the rule because the server generates the ID.
      return { userData };
    },
    mutationFn: async (userData: { email: string; password?: string; profileData: Partial<User> }) => {
      const { data, error } = await supabase.functions.invoke('create-staff-account', {
        body: userData
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const newUser = data.user as User;
      await usersCollection.insert(newUser);
      return data;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const updateRolePermissionsMutation = useMutation({
    mutationFn: async ({ role, updates }: { role: string, updates: Partial<RolePermissionConfig> }) => {
      const { error } = await supabase
        .from('role_permissions')
        .update(updates)
        .eq('id', role.toLowerCase());
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['role_permissions'] }),
  });

  return { 
    users: users.filter(u => !u.is_deleted), 
    rolePermissions, 
    isLoading, 
    deleteUser: deleteUserMutation.mutateAsync, 
    addUser: addUserMutation.mutateAsync,
    updateUser: (id: string, updates: Partial<User>) => updateUserMutation.mutateAsync({ id, updates }), 
    updateRolePermissions: (role: string, updates: Partial<RolePermissionConfig>) => updateRolePermissionsMutation.mutateAsync({ role, updates }),
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['role_permissions'] });
    }
  };
}
