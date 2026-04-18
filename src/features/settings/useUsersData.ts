import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase } from '../../lib/dataMapping';
import { UserProfile } from '../../types';

export const useUsersData = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('is_deleted', false);
        if (error) throw error;
        if (!data) return [];
        return mapToCamelCase<UserProfile[]>(data);
      } catch {
        console.warn("Network unreachable. Serving users from local vault.");
        return await usersCollection.getAll();
      }
    }
  });

  const { data: rolePermissions = [], isLoading: isRolesLoading } = useQuery<RolePermissionConfig[]>({
    queryKey: ['role_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_permissions').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const updateUserMutation = useMutation({
    onMutate: async (user: UserProfile) => {
      await usersCollection.sync(user);
    },
    mutationFn: async (user: Partial<UserProfile> & { id: string }) => {
      const supabasePayload = {
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.initials,
        pin: user.pin,
        signature_data: user.signatureData,
        integrity_seal: user.integritySeal,
        is_deleted: false
      };
      const { error } = await supabase.from('users').update(supabasePayload).eq('id', user.id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('users').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const addUserMutation = useMutation({
    mutationFn: async ({ email, password, profileData }: { email: string; password?: string; profileData: Partial<UserProfile> }) => {
      const { data: response, error } = await supabase.functions.invoke('create-staff-account', {
        body: { email, password, profileData }
      });
      if (error) throw error;
      if (response?.error) throw new Error(response.error);
      return response;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const updateRolePermissionsMutation = useMutation({
    mutationFn: async (updates: Partial<RolePermissionConfig> & { role: string }) => {
      const { role, ...rest } = updates;
      const { data } = await supabase.from('role_permissions').select('id').ilike('role', role.trim()).maybeSingle();
      if (data) {
        await supabase.from('role_permissions').update(rest).eq('id', data.id);
      } else {
        await supabase.from('role_permissions').insert({ role: role.toLowerCase(), ...rest });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['role_settings'] });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    }
  });

  return { 
    users, 
    rolePermissions,
    isLoading: isUsersLoading || isRolesLoading,
    updateUser: updateUserMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
    addUser: addUserMutation.mutateAsync,
    updateRolePermissions: updateRolePermissionsMutation.mutateAsync,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['role_settings'] });
    }
  };
};
