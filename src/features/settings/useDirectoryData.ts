import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { directoryCollection } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { Contact } from '../../types';

export const useDirectoryData = () => {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ['directory'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('directory').select('*').eq('is_deleted', false);
        if (error) throw error;
        
        const mappedData = data as Contact[];
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving directory from local vault.");
        return await directoryCollection.getAll();
      }
    }
  });

  const addContactMutation = useMutation({
    mutationFn: async (contact: Omit<Contact, 'id'>) => {
      const payload = { ...contact, id: crypto.randomUUID(), is_deleted: false } as Contact;
      await directoryCollection.sync(payload);
      
      const { error } = await supabase.from('directory').insert([payload]);
      if (error) throw error;
      return payload;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['directory'] })
  });

  const updateContactMutation = useMutation({
    mutationFn: async (contact: Contact) => {
      await directoryCollection.update(contact.id, contact);
      const { error } = await supabase.from('directory').update(contact).eq('id', contact.id);
      if (error) throw error;
      return contact;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['directory'] })
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      await directoryCollection.update(id, { is_deleted: true } as any);
      const { error } = await supabase.from('directory').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['directory'] })
  });

  return {
    contacts: contacts.filter(c => !c.is_deleted),
    isLoading,
    addContact: addContactMutation.mutateAsync,
    updateContact: updateContactMutation.mutateAsync,
    deleteContact: deleteContactMutation.mutateAsync
  };
};
