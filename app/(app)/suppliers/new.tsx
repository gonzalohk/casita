import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useCreateSupplier } from '@/hooks/useSuppliers';
import { useProjectStore } from '@/stores/projectStore';
import { SupplierCategory } from '@/types/database';

const supplierSchema = z.object({
  name:     z.string().min(2, 'Mínimo 2 caracteres'),
  phone:    z.string().optional(),
  email:    z.string().email('Email inválido').optional().or(z.literal('')),
  address:  z.string().optional(),
  category: z.enum(['materials', 'services', 'equipment', 'other']),
  notes:    z.string().optional(),
});

type SupplierForm = z.infer<typeof supplierSchema>;

const C = {
  bg: '#12141c',
  surface: '#1a1d27',
  border: '#2c3050',
  text: '#f0f0ff' as const,
  muted: '#7880a0',
  accent: '#4f7bff',
  error: '#f07070',
};

const CATEGORY_OPTIONS: { value: SupplierCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { value: 'materials', label: 'Materiales',  icon: 'cube-outline',              color: '#4f7bff' },
  { value: 'services',  label: 'Servicios',   icon: 'construct-outline',         color: '#c98a3e' },
  { value: 'equipment', label: 'Equipos',     icon: 'hardware-chip-outline',     color: '#a855f7' },
  { value: 'other',     label: 'Otro',        icon: 'ellipsis-horizontal-outline', color: '#8a94a6' },
];

export default function NewSupplierScreen() {
  const { project } = useProjectStore();
  const createSupplier = useCreateSupplier();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '', phone: '', email: '', address: '', category: 'materials', notes: '',
    },
  });

  const selectedCategory = watch('category');
  const selectedMeta = CATEGORY_OPTIONS.find(o => o.value === selectedCategory)!;

  const onSubmit = async (data: SupplierForm) => {
    if (!project) return;
    try {
      await createSupplier.mutateAsync({
        project_id: project.id,
        name:     data.name.trim(),
        phone:    data.phone?.trim() || null,
        email:    data.email?.trim() || null,
        address:  data.address?.trim() || null,
        category: data.category,
        notes:    data.notes?.trim() || null,
        status:   'active',
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 60 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={20} color={C.text} />
            </TouchableOpacity>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '700' }}>Nuevo proveedor</Text>
          </View>

          {/* Nombre */}
          <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 4 }}>
            NOMBRE
          </Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Ej. Distribuidora El Constructor"
                placeholderTextColor={C.muted}
                style={[fieldBorder(!!errors.name), { marginBottom: errors.name ? 4 : 24 }]}
              />
            )}
          />
          {errors.name && <Text style={{ color: C.error, fontSize: 12, marginBottom: 16 }}>{errors.name.message}</Text>}

          {/* Categoría */}
          <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 4 }}>
            CATEGORÍA
          </Text>
          <TouchableOpacity
            onPress={() => setCategoryModalOpen(true)}
            style={[fieldBorder(false), { flexDirection: 'row', alignItems: 'center', marginBottom: 24 }]}
          >
            <View style={{
              width: 28, height: 28, borderRadius: 8,
              backgroundColor: selectedMeta.color + '20',
              justifyContent: 'center', alignItems: 'center', marginRight: 10,
            }}>
              <Ionicons name={selectedMeta.icon} size={16} color={selectedMeta.color} />
            </View>
            <Text style={{ flex: 1, color: C.text, fontSize: 16 }}>{selectedMeta.label}</Text>
            <Ionicons name="chevron-down" size={16} color={C.muted} />
          </TouchableOpacity>

          {/* Teléfono */}
          <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 4 }}>
            TELÉFONO
          </Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Opcional"
                placeholderTextColor={C.muted}
                keyboardType="phone-pad"
                style={[fieldBorder(false), { marginBottom: 24 }]}
              />
            )}
          />

          {/* Email */}
          <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 4 }}>
            EMAIL
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Opcional"
                placeholderTextColor={C.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[fieldBorder(!!errors.email), { marginBottom: errors.email ? 4 : 24 }]}
              />
            )}
          />
          {errors.email && <Text style={{ color: C.error, fontSize: 12, marginBottom: 16 }}>{errors.email.message}</Text>}

          {/* Dirección */}
          <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 4 }}>
            DIRECCIÓN
          </Text>
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Opcional"
                placeholderTextColor={C.muted}
                style={[fieldBorder(false), { marginBottom: 24 }]}
              />
            )}
          />

          {/* Notas */}
          <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 4 }}>
            NOTAS
          </Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Observaciones, condiciones de pago..."
                placeholderTextColor={C.muted}
                multiline
                numberOfLines={3}
                style={[
                  fieldBorder(false),
                  { height: 80, textAlignVertical: 'top', marginBottom: 32 },
                ]}
              />
            )}
          />

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            style={{
              backgroundColor: C.accent, borderRadius: 14,
              paddingVertical: 16, alignItems: 'center',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {isSubmitting ? 'Guardando...' : 'Guardar proveedor'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Modal */}
      <Modal visible={categoryModalOpen} transparent animationType="slide">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setCategoryModalOpen(false)}
        >
          <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 16 }}>
              CATEGORÍA
            </Text>
            {CATEGORY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { setValue('category', opt.value); setCategoryModalOpen(false); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: C.border + '60',
                }}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: opt.color + '20',
                  justifyContent: 'center', alignItems: 'center', marginRight: 14,
                }}>
                  <Ionicons name={opt.icon} size={20} color={opt.color} />
                </View>
                <Text style={{ flex: 1, color: C.text, fontSize: 16 }}>{opt.label}</Text>
                {selectedCategory === opt.value && (
                  <Ionicons name="checkmark" size={20} color={C.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
