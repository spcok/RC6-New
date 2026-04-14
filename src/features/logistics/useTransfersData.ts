import { useLiveQuery } from '@tanstack/react-db';
import { transfersCollection } from '@/src/lib/db';

export const useTransfersData = () => {
  const { data: transfers = [], isLoading } = useLiveQuery((q) => q.from({ item: transfersCollection }));

  return {
    transfers: transfers.filter((t: any) => !t.isDeleted),
    isLoading,
    addTransfer: async (transfer: any) => transfersCollection.insert({ ...transfer, id: crypto.randomUUID(), isDeleted: false }),
    updateTransfer: async (transfer: any) => transfersCollection.update(transfer.id, transfer),
    deleteTransfer: async (id: string) => transfersCollection.delete(id),
  };
};
