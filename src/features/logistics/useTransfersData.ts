import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { transfersCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Transfer } from '../../types';

export const useTransfersData = () => {
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading } = useLiveQuery<Transfer[]>({
    queryKey: ['external_transfers'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('external_transfers').select('*');
        if (error) throw error;
        return data as Transfer[];
      } catch (err) {
        return await transfersCollection.getAll();
      }
    }
  });

  const addTransferMutation = useMutation({
    mutationFn: async (transfer: Omit<Transfer, 'id'>) => {
      const payload = { ...transfer, id: crypto.randomUUID(), isDeleted: false } as Transfer;
      await transfersCollection.insert(payload);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['external_transfers'] })
  });

  const updateTransferMutation = useMutation({
    mutationFn: async (transfer: Transfer) => {
      await transfersCollection.update(transfer.id, transfer);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['external_transfers'] })
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      await transfersCollection.delete(id);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['external_transfers'] })
  });

  return {
    transfers: transfers.filter((t: any) => !t.isDeleted && !t.is_deleted),
    isLoading,
    addTransfer: addTransferMutation.mutateAsync,
    updateTransfer: updateTransferMutation.mutateAsync,
    deleteTransfer: deleteTransferMutation.mutateAsync,
    isMutating: addTransferMutation.isPending || updateTransferMutation.isPending || deleteTransferMutation.isPending
  };
};
