import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zlaDocumentsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { ZLADocument } from '../../types';

export const useZLADocsData = () => {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<ZLADocument[]>({
    queryKey: ['zla_documents'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('zla_documents').select('*');
        if (error) throw error;
        
        const mappedData = data as ZLADocument[];
        
        setTimeout(async () => {
          for (const item of mappedData) {
            await zlaDocumentsCollection.sync(item);
          }
        }, 0);
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving ZLA Docs from local vault.");
        return await zlaDocumentsCollection.getOfflineData();
      }
    }
  });

  const addDocumentMutation = useMutation({
    mutationFn: async (doc: Omit<ZLADocument, 'id'>) => {
      const payload = { ...doc, id: crypto.randomUUID() } as ZLADocument;
      await zlaDocumentsCollection.sync(payload);
      
      const { error } = await supabase.from('zla_documents').insert([payload]);
      if (error) throw error;
      return payload;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zla_documents'] })
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      await zlaDocumentsCollection.update(id, { is_deleted: true } as any);
      const { error } = await supabase.from('zla_documents').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zla_documents'] })
  });

  return {
    documents: documents.filter(d => !d.is_deleted),
    isLoading,
    addDocument: addDocumentMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync
  };
};
