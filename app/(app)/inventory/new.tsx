import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useCreateMaterial } from '@/hooks/useMaterials';
import { usePhases } from '@/hooks/usePhases';
import { useProjectStore } from '@/stores/projectStore';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  category: z.string().min(1, 'Campo requerido'),
  unit: z.string().min(1, 'Campo requerido'),
  stock_current: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Debe ser >= 0'),
  stock_min: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Debe ser >= 0'),
  phase_id: z.string().min(1, 'Seleccioná una fase'),
});

type MaterialForm = z.infer<typeof schema>;

const COMMON_CATEGORIES = ['Cemento', 'Agregados', 'Bloque', 'Fierro', 'Madera', 'Eléctrico', 'Plomería', 'Obra Gruesa', 'Herramientas', 'General'];
const COMMON_UNITS = ['kg', 'bolsa', 'unidad', 'cubo', 'barra', 'm', 'm²', 'm³', 'quintal', 'rollo', 'caja', 'litro'];

const C = {
  bg: '#12141c',
  surface: '#1a1d27',
  border: '#2c3050',
  text: '#f0f0ff' as const,
  muted: '#7880a0',
  accent: '#4f7bff',
  error: '#f07070',
};

function PickerModal({ visible, title, options, selected, onSelect, onClose }: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={{
          backgroundColor: C.surface,
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          maxHeight: '70%',
          paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        }}>
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            padding: 20, borderBottomWidth: 1, borderBottomColor: C.border,
          }}>
            <Text style={{ color: C.text, fontWeight: '600', fontSize: 16 }}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={C.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {options.map((opt, i) => (
              <TouchableOpacity
                key={opt}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 24, paddingVertical: 15,
                  borderBottomWidth: i < options.length - 1 ? 1 : 0,
                  borderBottomColor: C.border + '60',
                }}
                onPress={() => { onSelect(opt); onClose(); }}
              >
                <Text style={{ color: selected === opt ? C.accent : C.text, fontSize: 15 }}>{opt}</Text>
                {selected === opt && <Ionicons name="checkmark" size={18} color={C.accent} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function NewMaterialScreen() {
  const { project } = useProjectStore();
  const createMaterial = useCreateMaterial();
  const { data: phases = [] } = usePhases();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<MaterialForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', category: '', unit: 'unidad', stock_current: '0', stock_min: '0', phase_id: '' },
  });

  const selectedCategory = watch('category');
  const selectedUnit = watch('unit');
  const selectedPhaseId = watch('phase_id');
  const selectedPhase = phases.find(p => p.id === selectedPhaseId);

  useEffect(() => {
    if (phases.length > 0 && !selectedPhaseId) {
      const obraGruesa = phases.find(p => p.name.toLowerCase().includes('obra gruesa') || p.name.toLowerCase().includes('obra bruta'));
      if (obraGruesa) setValue('phase_id', obraGruesa.id);
    }
  }, [phases]);

  const onSubmit = async (data: MaterialForm) => {
    if (!project) return;
    try {
      await createMaterial.mutateAsync({
        project_id: project.id,
        name: data.name.trim(),
        category: data.category.trim(),
        unit: data.unit.trim(),
        stock_current: parseFloat(data.stock_current),
        stock_min: parseFloat(data.stock_min),
        phase_id: data.phase_id || null,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const fieldBorder = (hasError: boolean) => ({
    borderBottomWidth: 1.5,
    borderBottomColor: hasError ? C.error : C.border,
    paddingVertical: 12,
    paddingHorizontal: 2,
    color: C.text,
    fontSize: 16,
  });

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 64, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 44, gap: 14 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={C.muted} />
            </TouchableOpacity>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '500' }}>Nuevo Material</Text>
          </View>

          <View style={{ gap: 32 }}>
            {/* Name */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>NOMBRE</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={fieldBorder(!!errors.name)}
                    placeholder="Ej: Cemento gris"
                    placeholderTextColor={C.border}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.name && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.name.message}</Text>}
            </View>

            {/* Category selector */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>CATEGORÍA</Text>
              <Controller
                control={control}
                name="category"
                render={({ field: { onChange, value } }) => (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    borderBottomWidth: 1.5,
                    borderBottomColor: errors.category ? C.error : C.border,
                  }}>
                    <TextInput
                      style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 2, color: C.text, fontSize: 16 }}
                      placeholder="Escribir o elegir..."
                      placeholderTextColor={C.border}
                      value={value}
                      onChangeText={onChange}
                    />
                    <TouchableOpacity onPress={() => setCategoryModalOpen(true)} style={{ padding: 6 }}>
                      <Ionicons name="chevron-down" size={18} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.category && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.category.message}</Text>}
            </View>

            {/* Unit selector */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}></Text>
              <Controller
                control={control}
                name="unit"
                render={({ field: { onChange, value } }) => (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    borderBottomWidth: 1.5,
                    borderBottomColor: errors.unit ? C.error : C.border,
                  }}>
                    <TextInput
                      style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 2, color: C.text, fontSize: 16 }}
                      placeholder="Ej: bolsa, kg, m²"
                      placeholderTextColor={C.border}
                      value={value}
                      onChangeText={onChange}
                    />
                    <TouchableOpacity onPress={() => setUnitModalOpen(true)} style={{ padding: 6 }}>
                      <Ionicons name="chevron-down" size={18} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.unit && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.unit.message}</Text>}
            </View>

            {/* Stock — side by side */}
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>STOCK ACTUAL</Text>
                <Controller
                  control={control}
                  name="stock_current"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={fieldBorder(!!errors.stock_current)}
                      placeholder="0"
                      placeholderTextColor={C.border}
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.stock_current && <Text style={{ color: C.error, fontSize: 11, marginTop: 4 }}>{errors.stock_current.message}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>STOCK MÍNIMO</Text>
                <Controller
                  control={control}
                  name="stock_min"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={fieldBorder(!!errors.stock_min)}
                      placeholder="0"
                      placeholderTextColor={C.border}
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.stock_min && <Text style={{ color: C.error, fontSize: 11, marginTop: 4 }}>{errors.stock_min.message}</Text>}
              </View>
            </View>

            {/* Fase */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>FASE</Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  borderBottomWidth: 1.5,
                  borderBottomColor: errors.phase_id ? C.error : C.border,
                  paddingVertical: 12,
                }}
                onPress={() => phases.length > 0 ? setPhaseModalOpen(true) : router.push('/(app)/schedule/phases')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {selectedPhase && (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedPhase.color }} />
                  )}
                  <Text style={{ color: selectedPhase ? C.text : C.border, fontSize: 16 }}>
                    {phases.length === 0 ? 'Primero creá una fase →' : selectedPhase ? selectedPhase.name : 'Seleccioná una fase'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={C.muted} />
              </TouchableOpacity>
              {errors.phase_id && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.phase_id.message}</Text>}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={{
                backgroundColor: C.accent,
                borderRadius: 10,
                padding: 16,
                alignItems: 'center',
                marginTop: 12,
                opacity: createMaterial.isPending ? 0.6 : 1,
              }}
              onPress={handleSubmit(onSubmit)}
              disabled={createMaterial.isPending}
            >
              {createMaterial.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Agregar material</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerModal
        visible={categoryModalOpen}
        title="Elegir Categoría"
        options={COMMON_CATEGORIES}
        selected={selectedCategory}
        onSelect={(v) => setValue('category', v, { shouldValidate: true })}
        onClose={() => setCategoryModalOpen(false)}
      />
      <PickerModal
        visible={unitModalOpen}
        title="Elegir Unidad"
        options={COMMON_UNITS}
        selected={selectedUnit}
        onSelect={(v) => setValue('unit', v, { shouldValidate: true })}
        onClose={() => setUnitModalOpen(false)}
      />

      {/* Phase modal */}
      <Modal visible={phaseModalOpen} transparent animationType="slide" onRequestClose={() => setPhaseModalOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setPhaseModalOpen(false)}
        >
          <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 16 }}>FASE</Text>
            <TouchableOpacity
              onPress={() => { setValue('phase_id', ''); setPhaseModalOpen(false); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border + '60' }}
            >
              <Text style={{ flex: 1, color: C.muted, fontSize: 16 }}>Sin fase asignada</Text>
              {!selectedPhaseId && <Ionicons name="checkmark" size={20} color={C.accent} />}
            </TouchableOpacity>
            {phases.map(phase => (
              <TouchableOpacity
                key={phase.id}
                onPress={() => { setValue('phase_id', phase.id); setPhaseModalOpen(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border + '60' }}
              >
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: phase.color, marginRight: 14 }} />
                <Text style={{ flex: 1, color: C.text, fontSize: 16 }}>{phase.name}</Text>
                {selectedPhaseId === phase.id && <Ionicons name="checkmark" size={20} color={C.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
