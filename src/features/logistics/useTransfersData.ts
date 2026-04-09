import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { transfersCollection } from '../../lib/database';
import { Transfer } from '../../types';

export const useTransfersData = () => {
  const queryClient = useQueryClient();

  // 1. FETCH DATA (Reactive UI via TanStack DB Vault)
  // Matched query key to 'external_transfers' as established in database.ts Phase 1
  const { data: transfers = [], isLoading } = useLiveQuery<Transfer[]>({
    queryKey: ['external_transfers'],
  });

  // 2. REMOTE MUTATIONS (Routed strictly through Offline Failover Vault)
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
      // Replaced manual is_deleted patch with formal soft-delete method
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
