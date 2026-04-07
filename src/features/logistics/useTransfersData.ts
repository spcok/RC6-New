import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Transfer, TransferType, TransferStatus } from '../../types';
import { mapToCamelCase } from '../../lib/dataMapping';

const sanitizePayload = <T extends Record<string, unknown>>(payload: T): T => {
  const sanitized = { ...payload };
  Object.keys(sanitized).forEach(key => {
    if (key.startsWith('$')) delete sanitized[key];
  });
  return sanitized;
};

export const useTransfersData = () => {
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading } = useQuery<Transfer[]>({
    queryKey: ['transfers'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('transfers').select('*');
        if (error) throw error;

        if (!data) return [];

        const camelCaseData = mapToCamelCase<Transfer>(data as Record<string, unknown>[]) as Transfer[];

        const transfers: Transfer[] = camelCaseData.map((item: Transfer): Transfer => ({
          ...item,
          id: (item.id as string) ?? crypto.randomUUID(),
          animalId: (item.animalId as string) ?? "",
          animalName: (item.animalName as string) ?? "Unknown",
          transferType: (item.transferType as TransferType) ?? TransferType.ARRIVAL,
          date: (item.date as string) ?? new Date().toISOString(),
          institution: (item.institution as string) ?? "Unknown",
          transportMethod: (item.transportMethod as string) ?? "Unknown",
          citesArticle10Ref: (item.citesArticle10Ref as string) ?? "N/A",
          status: (item.status as TransferStatus) ?? TransferStatus.PENDING,
          isDeleted: (item.isDeleted as boolean) ?? false,
        }));
        
        for (const item of transfers) {
          try {
            await transfersCollection.update(sanitizePayload(item));
          } catch {
            await transfersCollection.insert(sanitizePayload(item));
          }
        }
        return transfers;
      } catch {
        console.warn("Network unreachable. Serving transfers from local vault.");
        return await transfersCollection.getAll();
      }
    }
  });

  const addTransferMutation = useMutation({
    onMutate: async (transfer: Omit<Transfer, 'id'>) => {
      const payload: Transfer = sanitizePayload({ ...transfer, id: crypto.randomUUID(), isDeleted: false } as Transfer);
      await transfersCollection.insert(payload);
      return { payload };
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  const updateTransferMutation = useMutation({
    mutationFn: async (transfer: Transfer) => {
      try {
        const supabasePayload = {
          id: transfer.id,
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
      } catch {
        console.warn("Offline: Updating transfer locally.");
      }
      await transfersCollection.update(sanitizePayload(transfer));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('transfers').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Deleting transfer locally.");
      }
      const existing = transfers.find(t => t.id === id);
      if (existing) {
        await transfersCollection.update(sanitizePayload({ ...existing, isDeleted: true }));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  return {
    transfers: transfers.filter(t => !t.isDeleted),
    isLoading,
    addTransfer: addTransferMutation.mutateAsync,
    updateTransfer: updateTransferMutation.mutateAsync,
    deleteTransfer: deleteTransferMutation.mutateAsync,
    isMutating: addTransferMutation.isPending || updateTransferMutation.isPending || deleteTransferMutation.isPending
  };
};
