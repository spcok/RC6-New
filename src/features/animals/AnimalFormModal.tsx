import React from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Animal, EntityType, HazardRating, ConservationStatus, AnimalCategory } from '../../types';
import { useAnimalsData } from './useAnimalsData';

interface Props {
  isOpen: boolean;
  initialData?: Animal;
  onClose: () => void;
}

const animalSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  species: z.string().min(1, 'Species is required'),
  latinName: z.string().optional(),
  category: z.nativeEnum(AnimalCategory),
  dob: z.string().optional(),
  isDobUnknown: z.boolean(),
  sex: z.enum(['Male', 'Female', 'Unknown']),
  location: z.string(),
  description: z.string().optional(),
  specialRequirements: z.string().optional(),
  imageUrl: z.string().optional(),
  distributionMapUrl: z.string().optional(),
  acquisitionDate: z.string().optional(),
  origin: z.string().optional(),
  sireId: z.string().optional(),
  damId: z.string().optional(),
  microchipId: z.string().optional(),
  ringNumber: z.string().optional(),
  hasNoId: z.boolean(),
  hazardRating: z.nativeEnum(HazardRating),
  isVenomous: z.boolean(),
  redListStatus: z.nativeEnum(ConservationStatus),
  entityType: z.nativeEnum(EntityType),
  parentMobId: z.string().optional(),
  censusCount: z.number().optional(),
  displayOrder: z.number(),
  archived: z.boolean(),
  isQuarantine: z.boolean(),
  ambientTempOnly: z.boolean(),
  waterTippingTemp: z.number().optional(),
  targetDayTempC: z.number().optional(),
  targetNightTempC: z.number().optional(),
  targetHumidityMinPercent: z.number().optional(),
  targetHumidityMaxPercent: z.number().optional(),
  mistingFrequency: z.string().optional(),
  acquisitionType: z.enum(['BORN', 'TRANSFERRED_IN', 'RESCUE', 'UNKNOWN']),
  isBoarding: z.boolean(),
  criticalHusbandryNotes: z.array(z.string()),
});

const AnimalFormModal: React.FC<Props> = ({ isOpen, initialData, onClose }) => {
  const { addAnimal, updateAnimal } = useAnimalsData();
  
  const form = useForm({
    defaultValues: initialData || {
      id: uuidv4(),
      name: '',
      species: '',
      latinName: '',
      category: AnimalCategory.OWLS,
      dob: new Date().toISOString().split('T')[0],
      isDobUnknown: false,
      sex: 'Unknown',
      location: '',
      description: '',
      specialRequirements: '',
      imageUrl: `https://picsum.photos/seed/${uuidv4()}/400/400`,
      distributionMapUrl: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
      origin: 'Unknown',
      sireId: '',
      damId: '',
      microchipId: '',
      ringNumber: '',
      hasNoId: false,
      hazardRating: HazardRating.LOW,
      isVenomous: false,
      redListStatus: ConservationStatus.NE,
      entityType: EntityType.INDIVIDUAL,
      parentMobId: '',
      censusCount: undefined,
      displayOrder: 0,
      archived: false,
      isQuarantine: false,
      ambientTempOnly: false,
      waterTippingTemp: undefined,
      targetDayTempC: undefined,
      targetNightTempC: undefined,
      targetHumidityMinPercent: undefined,
      targetHumidityMaxPercent: undefined,
      mistingFrequency: '',
      acquisitionType: 'UNKNOWN',
      isBoarding: false,
      criticalHusbandryNotes: [],
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: animalSchema,
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        updatedAt: new Date().toISOString(),
        createdAt: initialData?.createdAt || new Date().toISOString(),
        isDeleted: false
      };
      if (initialData) {
        await updateAnimal(payload as Animal);
      } else {
        await addAnimal(payload as Omit<Animal, 'id'>);
      }
      onClose();
    },
  });

  const inputClass = "w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <h2 className="text-2xl font-bold text-slate-900">{initialData ? 'Edit Animal' : 'Add New Animal'}</h2>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Basic Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className={labelClass}>Name</label>
                                        <form.Field name="name" children={(field) => (
                                            <input name={field.name} value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} placeholder="Name..." />
                                        )} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelClass}>Species</label>
                                        <form.Field name="species" children={(field) => (
                                            <input name={field.name} value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} placeholder="Species..." />
                                        )} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Category</label>
                                        <form.Field name="category" children={(field) => (
                                            <select name={field.name} value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => { field.handleChange(e.target.value as AnimalCategory); }} className={inputClass}>
                                                {(Object.values(AnimalCategory) as AnimalCategory[]).map((c: AnimalCategory) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        )} />
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
                            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]} children={([canSubmit, isSubmitting]) => (
                                <button type="submit" disabled={!canSubmit || isSubmitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} />}
                                    {isSubmitting ? 'Saving...' : 'Save Profile'}
                                </button>
                            )} />
                        </div>
                    </div>
                </form>
        </div>
    </div>
  );
};

export default AnimalFormModal;
