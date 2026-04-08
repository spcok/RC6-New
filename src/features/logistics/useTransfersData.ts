import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Transfer, TransferType, TransferStatus } from '../../types';

const sanitizePayload = <T extends Record<string, unknown>>(payload: T): T => {
  const sanitized = { ...payload };
  Object.keys(sanitized).forEach(key => {
    if (key.startsWith('$')) delete sanitized[key];
  });
  return sanitized;
};

interface SupabaseTransfer {
  id: string;
  animal_id: string | null;
  animal_name: string | null;
  transfer_type: string | null;
  date: string | null;
  institution: string | null;
  transport_method: string | null;
  cites_article_10_ref: string | null;
  status: string | null;
  is_deleted: boolean;
}

export const useTransfersData = () => {
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading } = useQuery<Transfer[]>({
    queryKey: ['transfers'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('transfers').select('*');
        if (error) throw error;
        const transfers: Transfer[] = (data as unknown as SupabaseTransfer[]).map((item: SupabaseTransfer) => ({
          id: item.id,
          animalId: item.animal_id,
          animalName: item.animal_name || 'Unknown',
          transferType: (item.transfer_type as TransferType) || TransferType.ARRIVAL,
          date: item.date || new Date().toISOString(),
          institution: item.institution || 'Unknown',
          transportMethod: item.transport_method || 'Unknown',
          citesArticle10Ref: item.cites_article_10_ref || 'N/A',
          status: (item.status as TransferStatus) || TransferStatus.PENDING,
          isDeleted: item.is_deleted
        }));
        
        setTimeout(async () => {
          for (const item of transfers) {
            await transfersCollection.sync(sanitizePayload(item));
          }
        }, 0);
        return transfers;
      } catch {
        console.warn("Network unreachable. Serving transfers from local vault.");
        return await transfersCollection.getOfflineData();
      }
    }
  });

  const addTransferMutation = useMutation({
    onMutate: async (transfer: Omit<Transfer, 'id'>) => {
      await queryClient.cancelQueries({ queryKey: ['transfers'] });
      const previousTransfers = queryClient.getQueryData<Transfer[]>(['transfers']);
      const payload: Transfer = sanitizePayload({ ...transfer, id: crypto.randomUUID(), isDeleted: false } as Transfer);
      
      queryClient.setQueryData(['transfers'], [...(previousTransfers || []), payload]);
      await transfersCollection.sync(payload);
      
      return { previousTransfers };
    },
    mutationFn: async (transfer: Omit<Transfer, 'id'>) => {
      const payload = { ...transfer, id: crypto.randomUUID(), isDeleted: false };
      const supabasePayload = {
        id: payload.id,
        animal_id: payload.animalId,
        animal_name: payload.animalName,
        transfer_type: payload.transferType,
        date: payload.date,
        institution: payload.institution,
        transport_method: payload.transportMethod,
        cites_article_10_ref: payload.citesArticle10Ref,
        status: payload.status,
        is_deleted: payload.isDeleted
      };

      const { error } = await supabase.from('transfers').insert([supabasePayload]);
      if (error) throw error; 
    },
    onError: (_err, _newTransfer, context) => {
      queryClient.setQueryData(['transfers'], context?.previousTransfers);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  const updateTransferMutation = useMutation({
    onMutate: async (transfer: Transfer) => {
      await queryClient.cancelQueries({ queryKey: ['transfers'] });
      const previousTransfers = queryClient.getQueryData<Transfer[]>(['transfers']);
      
      queryClient.setQueryData(['transfers'], (old: Transfer[] = []) => 
        old.map(t => t.id === transfer.id ? { ...t, ...transfer } : t)
      );
      await transfersCollection.update(transfer.id, sanitizePayload(transfer));
      
      return { previousTransfers };
    },
    mutationFn: async (transfer: Transfer) => {
      const supabasePayload = {
        animal_id: transfer.animalId,
        animal_name: transfer.animalName,
        transfer_type: transfer.transferType,
        date: transfer.date,
        institution: transfer.institution,
        transport_method: transfer.transportMethod,
        cites_article_10_ref: transfer.citesArticle10Ref,
        status: transfer.status,
        is_deleted: transfer.isDeleted
      };
      const { error } = await supabase.from('transfers').update(supabasePayload).eq('id', transfer.id);
      if (error) throw error;
      await transfersCollection.update(transfer.id, sanitizePayload(transfer));
    },
    onError: (_err, _transfer, context) => {
      queryClient.setQueryData(['transfers'], context?.previousTransfers);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  const deleteTransferMutation = useMutation({
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['transfers'] });
      const previousTransfers = queryClient.getQueryData<Transfer[]>(['transfers']);
      
      queryClient.setQueryData(['transfers'], (old: Transfer[] = []) => 
        old.map(t => t.id === id ? { ...t, isDeleted: true } : t)
      );
      await transfersCollection.update(id, { isDeleted: true });
      
      return { previousTransfers };
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transfers').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['transfers'], context?.previousTransfers);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  return {
    transfers: transfers.filter(t => !t.is_deleted),
    isLoading,
    addTransfer: addTransferMutation.mutateAsync,
    updateTransfer: updateTransferMutation.mutateAsync,
    deleteTransfer: deleteTransferMutation.mutateAsync,
    isMutating: addTransferMutation.isPending || updateTransferMutation.isPending || deleteTransferMutation.isPending
  };
};
