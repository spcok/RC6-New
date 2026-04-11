import React, { useState } from 'react';
import { Check, Loader2, X, Upload, Search, Image as ImageIcon, Map } from 'lucide-react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Animal, EntityType, HazardRating, ConservationStatus, AnimalCategory } from '../../types';
import { useAnimalsData } from './useAnimalsData';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  initialData?: Animal;
  onClose: () => void;
}

// FIX 1: Added .nullable() to all optional fields to accept Supabase SQL nulls natively
const animalSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  species: z.string().min(1, 'Species is required'),
  latinName: z.string().optional().nullable(),
  category: z.nativeEnum(AnimalCategory),
  sex: z.enum(['Male', 'Female', 'Unknown']),
  dob: z.string().optional().nullable(),
  isDobUnknown: z.boolean(),
  weightUnit: z.enum(['g', 'oz', 'lbs_oz', 'kg']),
  
  imageUrl: z.string().optional().nullable(),
  distributionMapUrl: z.string().optional().nullable(),
  
  location: z.string(),
  entityType: z.nativeEnum(EntityType),
  censusCount: z.number().optional().nullable(),
  parentMobId: z.string().optional().nullable(),
  
  hazardRating: z.nativeEnum(HazardRating),
  isVenomous: z.boolean(),
  redListStatus: z.nativeEnum(ConservationStatus),
  
  acquisitionDate: z.string().optional().nullable(),
  acquisitionType: z.enum(['BORN', 'TRANSFERRED_IN', 'RESCUE', 'UNKNOWN']),
  origin: z.string().optional().nullable(),
  isBoarding: z.boolean(),
  isQuarantine: z.boolean(),
  
  microchipId: z.string().optional().nullable(),
  ringNumber: z.string().optional().nullable(),
  hasNoId: z.boolean(),
  sireId: z.string().optional().nullable(),
  damId: z.string().optional().nullable(),
  
  ambientTempOnly: z.boolean(),
  targetDayTempC: z.number().optional().nullable(),
  targetNightTempC: z.number().optional().nullable(),
  waterTippingTemp: z.number().optional().nullable(),
  targetHumidityMinPercent: z.number().optional().nullable(),
  targetHumidityMaxPercent: z.number().optional().nullable(),
  mistingFrequency: z.string().optional().nullable(),
  
  description: z.string().optional().nullable(),
  specialRequirements: z.string().optional().nullable(),
  criticalHusbandryNotes: z.array(z.string()).optional().nullable(),
  
  displayOrder: z.number(),
  archived: z.boolean(),
});

const AnimalFormModal: React.FC<Props> = ({ isOpen, initialData, onClose }) => {
  const { addAnimal, updateAnimal } = useAnimalsData();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingMap, setIsUploadingMap] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  
  // FIX 2: Strict mapping to prevent raw nulls from crashing strict Zod arrays/booleans
  const form = useForm({
    defaultValues: {
      id: initialData?.id || uuidv4(),
      name: initialData?.name || '',
      species: initialData?.species || '',
      latinName: initialData?.latinName || '',
      category: initialData?.category || AnimalCategory.OWLS,
      sex: initialData?.sex || 'Unknown',
      dob: initialData?.dob || new Date().toISOString().split('T')[0],
      isDobUnknown: initialData?.isDobUnknown || false,
      weightUnit: initialData?.weightUnit || 'g',
      imageUrl: initialData?.imageUrl || '',
      distributionMapUrl: initialData?.distributionMapUrl || '',
      location: initialData?.location || '',
      entityType: initialData?.entityType || EntityType.INDIVIDUAL,
      censusCount: initialData?.censusCount ?? null,
      parentMobId: initialData?.parentMobId || '',
      hazardRating: initialData?.hazardRating || HazardRating.LOW,
      isVenomous: initialData?.isVenomous || false,
      redListStatus: initialData?.redListStatus || ConservationStatus.NE,
      acquisitionDate: initialData?.acquisitionDate || new Date().toISOString().split('T')[0],
      acquisitionType: initialData?.acquisitionType || 'UNKNOWN',
      origin: initialData?.origin || '',
      isBoarding: initialData?.isBoarding || false,
      isQuarantine: initialData?.isQuarantine || false,
      microchipId: initialData?.microchipId || '',
      ringNumber: initialData?.ringNumber || '',
      hasNoId: initialData?.hasNoId || false,
      sireId: initialData?.sireId || '',
      damId: initialData?.damId || '',
      ambientTempOnly: initialData?.ambientTempOnly || false,
      targetDayTempC: initialData?.targetDayTempC ?? null,
      targetNightTempC: initialData?.targetNightTempC ?? null,
      waterTippingTemp: initialData?.waterTippingTemp ?? null,
      targetHumidityMinPercent: initialData?.targetHumidityMinPercent ?? null,
      targetHumidityMaxPercent: initialData?.targetHumidityMaxPercent ?? null,
      mistingFrequency: initialData?.mistingFrequency || '',
      description: initialData?.description || '',
      specialRequirements: initialData?.specialRequirements || '',
      criticalHusbandryNotes: initialData?.criticalHusbandryNotes || [],
      displayOrder: initialData?.displayOrder || 0,
      archived: initialData?.archived || false,
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: animalSchema,
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        // Ensure the array defaults to empty array instead of null for the database
        criticalHusbandryNotes: value.criticalHusbandryNotes || [],
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'imageUrl' | 'distributionMapUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isProfile = fieldName === 'imageUrl';
    if (isProfile) {
      setIsUploadingImage(true);
    } else {
      setIsUploadingMap(true);
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${isProfile ? 'profiles' : 'maps'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('animals')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('animals').getPublicUrl(filePath);
      form.setFieldValue(fieldName, data.publicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image. Please check your connection and try again.');
    } finally {
      if (isProfile) {
        setIsUploadingImage(false);
      } else {
        setIsUploadingMap(false);
      }
    }
  };

  const handleAutoRetrieve = async () => {
    const species = form.getFieldValue('species');
    if (!species) {
      alert('Please enter a species name first.');
      return;
    }
    
    setIsRetrieving(true);
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(species)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.description && data.description.toLowerCase().includes('species')) {
             console.log('Species data found:', data.title);
        }
        alert('Auto-retrieve pinged successfully. Ensure your external service is wired up to parse IUCN status.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsRetrieving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1";
  const sectionClass = "bg-slate-50/50 p-5 rounded-xl border border-slate-200 mb-6";
  const sectionHeaderClass = "flex items-center justify-between border-b border-slate-200 pb-2 mb-4";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-slate-200 px-6 py-4 bg-white z-10">
                <h2 className="text-2xl font-bold text-slate-900">{initialData ? 'Edit Animal Profile' : 'New Animal Registration'}</h2>
                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                        <div className="col-span-1 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 relative group min-h-[250px]">
                            <form.Field name="imageUrl" children={(field) => (
                                <>
                                    {field.state.value ? (
                                        <img src={field.state.value} alt="Profile" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        <div className="text-slate-400 flex flex-col items-center">
                                            <ImageIcon size={48} className="mb-2 opacity-50" />
                                            <span className="text-sm font-bold">Profile Photo</span>
                                        </div>
                                    )}
                                    <div className={`absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl transition-opacity ${field.state.value ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                                        <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-100 transition-colors">
                                            {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'imageUrl')} />
                                        </label>
                                    </div>
                                </>
                            )} />
                        </div>

                        <div className="col-span-1 xl:col-span-2 space-y-4">
                            <section className="bg-white p-5 rounded-xl border border-slate-200 h-full">
                                <div className={sectionHeaderClass}>
                                    <h3 className="text-sm font-bold text-slate-900">Core Identification</h3>
                                    <button type="button" onClick={handleAutoRetrieve} disabled={isRetrieving} className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50">
                                        {isRetrieving ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                        Auto-Retrieve Data
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className={labelClass}>Name</label>
                                        <form.Field name="name" children={(field) => (
                                            <input value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} placeholder="Animal Name" />
                                        )} />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className={labelClass}>Common Species</label>
                                        <form.Field name="species" children={(field) => (
                                            <input value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} placeholder="e.g. Barn Owl" />
                                        )} />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className={labelClass}>Latin Name</label>
                                        <form.Field name="latinName" children={(field) => (
                                            <input value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`${inputClass} font-italic`} placeholder="e.g. Tyto alba" />
                                        )} />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className={labelClass}>IUCN Red List Status</label>
                                        <form.Field name="redListStatus" children={(field) => (
                                            <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value as ConservationStatus)} className={`${inputClass} font-bold`}>
                                                {(Object.values(ConservationStatus) as ConservationStatus[]).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        )} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Category</label>
                                        <form.Field name="category" children={(field) => (
                                            <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value as AnimalCategory)} className={inputClass}>
                                                {(Object.values(AnimalCategory) as AnimalCategory[]).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        )} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Sex</label>
                                        <form.Field name="sex" children={(field) => (
                                            <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value as 'Male' | 'Female' | 'Unknown')} className={inputClass}>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Unknown">Unknown</option>
                                            </select>
                                        )} />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <section className={sectionClass}>
                                <div className={sectionHeaderClass}><h3 className="text-sm font-bold text-slate-900">Tracking & Demographics</h3></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Microchip ID</label>
                                        <form.Field name="microchipId" children={(field) => (
                                            <input value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} />
                                        )} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Ring / Band Number</label>
                                        <form.Field name="ringNumber" children={(field) => (
                                            <input value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} />
                                        )} />
                                    </div>
                                    <div className="col-span-2">
                                        <form.Field name="hasNoId" children={(field) => (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={field.state.value} onChange={(e) => field.handleChange(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm text-slate-700">Animal has no physical identifiers</span>
                                            </label>
                                        )} />
                                    </div>
                                    <div className="col-span-2 border-t border-slate-200 mt-2 pt-4"></div>
                                    <div>
                                        <label className={labelClass}>Date of Birth</label>
                                        <form.Field name="dob" children={(field) => (
                                            <input type="date" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} />
                                        )} />
                                        <form.Field name="isDobUnknown" children={(field) => (
                                            <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                                <input type="checkbox" checked={field.state.value} onChange={(e) => field.handleChange(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                <span className="text-xs text-slate-500">DOB is Approximate/Unknown</span>
                                            </label>
                                        )} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Default Weight Unit</label>
                                        <form.Field name="weightUnit" children={(field) => (
                                            <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value as 'g' | 'oz' | 'lbs_oz' | 'kg')} className={inputClass}>
                                                <option value="g">Grams (g)</option>
                                                <option value="kg">Kilograms (kg)</option>
                                                <option value="oz">Ounces (oz)</option>
                                                <option value="lbs_oz">Pounds & Ounces (lb oz)</option>
                                            </select>
                                        )} />
                                    </div>
                                </div>
                            </section>

                            <section className={sectionClass}>
                                <div className={sectionHeaderClass}><h3 className="text-sm font-bold text-slate-900">Origin & Acquisition</h3></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Acquisition Type</label>
                                        <form.Field name="acquisitionType" children={(field) => (
                                            <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value as 'BORN' | 'TRANSFERRED_IN' | 'RESCUE' | 'UNKNOWN')} className={inputClass}>
                                                <option value="BORN">Born on Site</option>
                                                <option value="TRANSFERRED_IN">Transferred In</option>
                                                <option value="RESCUE">Rescue/Rehab</option>
                                                <option value="UNKNOWN">Unknown</option>
                                            </select>
                                        )} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Acquisition Date</label>
                                        <form.Field name="acquisitionDate" children={(field) => (
                                            <input type="date" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} />
                                        )} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelClass}>Origin / Source</label>
                                        <form.Field name="origin" children={(field) => (
                                            <input value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} placeholder="Previous institution, breeder, rescue center" />
                                        )} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Sire ID</label>
                                        <form.Field name="sireId" children={(field) => (
                                            <input value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} placeholder="Father" />
                                        )} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Dam ID</label>
                                        <form.Field name="damId" children={(field) => (
                                            <input value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} placeholder="Mother" />
                                        )} />
                                    </div>
                                </div>
                            </section>

                            <section className={sectionClass}>
                                <div className={sectionHeaderClass}><h3 className="text-sm font-bold text-slate-900">Notes & Signage</h3></div>
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>General Description</label>
                                        <form.Field name="description" children={(field) => (
                                            <textarea rows={2} value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} />
                                        )} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Special Husbandry Requirements</label>
                                        <form.Field name="specialRequirements" children={(field) => (
                                            <textarea rows={2} value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} />
                                        )} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Critical Notes (One per line)</label>
                                        <form.Field name="criticalHusbandryNotes" children={(field) => (
                                            <textarea 
                                                rows={2} 
                                                value={field.state.value?.join('\n') || ''} 
                                                onBlur={field.handleBlur} 
                                                onChange={(e) => field.handleChange(e.target.value.split('\n').filter(s => s.trim() !== ''))} 
                                                className={`${inputClass} border-red-200 focus:ring-red-500 focus:border-red-500`} 
                                                placeholder="e.g. Flighty around loud noises..."
                                            />
                                        )} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Signage Distribution Map (Upload)</label>
                                        <div className="flex items-center gap-4">
                                            <form.Field name="distributionMapUrl" children={(field) => (
                                                <>
                                                    <label className="cursor-pointer bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition-colors border border-slate-300 w-full justify-center">
                                                        {isUploadingMap ? <Loader2 size={16} className="animate-spin" /> : <Map size={16} />}
                                                        {isUploadingMap ? 'Uploading...' : field.state.value ? 'Replace Map Image' : 'Upload Map Image'}
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'distributionMapUrl')} />
                                                    </label>
                                                    {field.state.value && (
                                                        <img src={field.state.value} alt="Map" className="h-10 w-16 object-cover rounded border border-slate-200" />
                                                    )}
                                                </>
                                            )} />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div>
                            <section className={sectionClass}>
                                <div className={sectionHeaderClass}><h3 className="text-sm font-bold text-slate-900">Location & Status</h3></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className={labelClass}>Current Location / Enclosure</label>
                                        <form.Field name="location" children={(field) => (
                                            <input value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} placeholder="e.g. Aviary 4" />
                                        )} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Entity Type</label>
                                        <form.Field name="entityType" children={(field) => (
                                            <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value as EntityType)} className={inputClass}>
                                                {(Object.values(EntityType) as EntityType[]).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        )} />
                                    </div>
                                    <form.Field name="entityType" children={(typeField) => (
                                        typeField.state.value === EntityType.GROUP ? (
                                            <div>
                                                <label className={labelClass}>Census Count</label>
                                                <form.Field name="censusCount" children={(field) => (
                                                    <input type="number" min="1" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value, 10) : null)} className={inputClass} />
                                                )} />
                                            </div>
                                        ) : <div />
                                    )} />
                                    <div className="col-span-2 flex gap-6 mt-2 p-3 bg-white border border-slate-200 rounded-lg">
                                        <form.Field name="isQuarantine" children={(field) => (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={field.state.value} onChange={(e) => field.handleChange(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm text-amber-700 font-bold">In Quarantine</span>
                                            </label>
                                        )} />
                                        <form.Field name="isBoarding" children={(field) => (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={field.state.value} onChange={(e) => field.handleChange(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm text-slate-700">Boarding Only</span>
                                            </label>
                                        )} />
                                    </div>
                                </div>
                            </section>

                            <section className={sectionClass}>
                                <div className={sectionHeaderClass}><h3 className="text-sm font-bold text-slate-900">Safety & Environment</h3></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Hazard Rating</label>
                                        <form.Field name="hazardRating" children={(field) => (
                                            <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value as HazardRating)} className={inputClass}>
                                                {(Object.values(HazardRating) as HazardRating[]).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        )} />
                                    </div>
                                    <div className="flex items-center pt-5">
                                        <form.Field name="isVenomous" children={(field) => (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={field.state.value} onChange={(e) => field.handleChange(e.target.checked)} className="rounded border-slate-300 text-red-600 focus:ring-red-500" />
                                                <span className="text-sm text-red-700 font-bold">Venomous</span>
                                            </label>
                                        )} />
                                    </div>
                                    
                                    <div className="col-span-2 border-t border-slate-200 mt-2 pt-4">
                                        <label className={labelClass}>Target Environment Parameters</label>
                                    </div>
                                    
                                    <div className="col-span-2 flex items-center mb-2">
                                        <form.Field name="ambientTempOnly" children={(field) => (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={field.state.value} onChange={(e) => field.handleChange(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm text-slate-700">Ambient Temperature Only (No setup required)</span>
                                            </label>
                                        )} />
                                    </div>

                                    <form.Field name="ambientTempOnly" children={(ambientField) => (
                                        <>
                                            <div>
                                                <label className={labelClass}>Day Temp (°C)</label>
                                                <form.Field name="targetDayTempC" children={(field) => (
                                                    <input type="number" step="0.1" disabled={ambientField.state.value} value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} className={`${inputClass} disabled:bg-slate-100`} />
                                                )} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Night Temp (°C)</label>
                                                <form.Field name="targetNightTempC" children={(field) => (
                                                    <input type="number" step="0.1" disabled={ambientField.state.value} value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} className={`${inputClass} disabled:bg-slate-100`} />
                                                )} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Water Temp (°C)</label>
                                                <form.Field name="waterTippingTemp" children={(field) => (
                                                    <input type="number" step="0.1" disabled={ambientField.state.value} value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} className={`${inputClass} disabled:bg-slate-100`} />
                                                )} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Min Humidity (%)</label>
                                                <form.Field name="targetHumidityMinPercent" children={(field) => (
                                                    <input type="number" disabled={ambientField.state.value} value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value, 10) : null)} className={`${inputClass} disabled:bg-slate-100`} />
                                                )} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Max Humidity (%)</label>
                                                <form.Field name="targetHumidityMaxPercent" children={(field) => (
                                                    <input type="number" disabled={ambientField.state.value} value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value, 10) : null)} className={`${inputClass} disabled:bg-slate-100`} />
                                                )} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Misting Frequency</label>
                                                <form.Field name="mistingFrequency" children={(field) => (
                                                    <input disabled={ambientField.state.value} value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`${inputClass} disabled:bg-slate-100`} placeholder="e.g. Twice Daily" />
                                                )} />
                                            </div>
                                        </>
                                    )} />
                                </div>
                            </section>
                        </div>
                    </div>
                    
                    <button type="submit" className="hidden">Submit</button>
                </form>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 z-10">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]} children={([canSubmit, isSubmitting]) => (
                    <button 
                        type="button" 
                        onClick={() => form.handleSubmit()} 
                        disabled={!canSubmit || isSubmitting} 
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-sm"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Check size={18} />}
                        {isSubmitting ? 'Saving Profile...' : 'Save Animal Profile'}
                    </button>
                )} />
            </div>
        </div>
    </div>
  );
};

export default AnimalFormModal;
