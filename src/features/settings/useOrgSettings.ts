import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orgSettingsCollection } from '@/src/lib/db';
import { supabase } from '../../lib/supabase';
import { OrgProfileSettings } from '../../types';
import { mapToCamelCase } from '../../lib/dataMapping';

const DEFAULT_SETTINGS: OrgProfileSettings = {
  id: 'profile',
  orgName: '',
  logoUrl: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  zlaLicenseNumber: '',
  officialWebsite: '',
  adoptionPortal: '',
};

export function useOrgSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<OrgProfileSettings>({
    queryKey: ['orgSettings'],
    queryFn: async () => {
      try {
        // Target the plural 'organisations' table
        const { data, error } = await supabase.from('organisations').select('*').limit(1).maybeSingle();
        if (error) throw error;
        
        if (!data) return DEFAULT_SETTINGS;
        
        return mapToCamelCase<OrgProfileSettings>(data);
      } catch (err) {
        console.warn("Network unreachable or RLS blocked. Serving from local vault.", err);
        const localData = await orgSettingsCollection.getAll();
        return localData.length > 0 ? localData[0] : DEFAULT_SETTINGS;
      }
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: OrgProfileSettings) => {
      const supabasePayload = {
        id: newSettings.id || 'profile',
        org_name: newSettings.orgName,
        logo_url: newSettings.logoUrl,
        contact_email: newSettings.contactEmail,
        contact_phone: newSettings.contactPhone,
        address: newSettings.address,
        zla_license_number: newSettings.zlaLicenseNumber,
        official_website: newSettings.officialWebsite,
        adoption_portal: newSettings.adoptionPortal
      };
      
      // Target the plural 'organisations' table
      const { error } = await supabase.from('organisations').upsert([supabasePayload]);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['orgSettings'] })
  });

  return { 
    settings: settings || DEFAULT_SETTINGS, 
    isLoading, 
    saveSettings: saveSettingsMutation.mutateAsync,
    isMutating: saveSettingsMutation.isPending
  };
}