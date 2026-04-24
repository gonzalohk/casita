import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useCreateWorker } from '@/hooks/useWorkers';
import { useProjectStore } from '@/stores/projectStore';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  role: z.string().min(2, 'Campo requerido'),
  daily_rate: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Debe ser >= 0'),
  phone: z.string().optional(),
});

type WorkerForm = z.infer<typeof schema>;

const COMMON_ROLES = ['Albañil', 'Maestro de obra', 'Electricista', 'Plomero', 'Carpintero', 'Pintor', 'Ayudante', 'Operador'];

const C = {
  bg: '#12141c',
  surface: '#1a1d27',
  border: '#2c3050',
  text: '#f0f0ff' as const,
  muted: '#7880a0',
  accent: '#4f7bff',
  error: '#f07070',
};

export default function NewWorkerScreen() {
  const { project } = useProjectStore();
  const createWorker = useCreateWorker();
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<WorkerForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', role: '', daily_rate: '', phone: '' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: WorkerForm) => {
    if (!project) return;
    try {
      await createWorker.mutateAsync({
        project_id: project.id,
        name: data.name.trim(),
        role: data.role.trim(),
        daily_rate: parseFloat(data.daily_rate),
        phone: data.phone?.trim() || null,
        status: 'active',
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
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '500' }}>Nuevo Obrero</Text>
          </View>

          <View style={{ gap: 32 }}>
            {/* Name */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>NOMBRE COMPLETO</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={fieldBorder(!!errors.name)}
                    placeholder="Ej: Juan Pérez"
                    placeholderTextColor={C.border}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.name && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.name.message}</Text>}
            </View>

            {/* Role — dropdown */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>ROL / OFICIO</Text>
              <Controller
                control={control}
                name="role"
                render={({ field: { onChange, value } }) => (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    borderBottomWidth: 1.5,
                    borderBottomColor: errors.role ? C.error : C.border,
                  }}>
                    <TextInput
                      style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 2, color: C.text, fontSize: 16 }}
                      placeholder="Escribir o elegir..."
                      placeholderTextColor={C.border}
                      value={value}
                      onChangeText={onChange}
                    />
                    <TouchableOpacity onPress={() => setRoleModalOpen(true)} style={{ padding: 6 }}>
                      <Ionicons name="chevron-down" size={18} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.role && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.role.message}</Text>}
            </View>

            {/* Rate + Phone — side by side */}
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>TARIFA DIARIA (Bs)</Text>
                <Controller
                  control={control}
                  name="daily_rate"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={fieldBorder(!!errors.daily_rate)}
                      placeholder="0.00"
                      placeholderTextColor={C.border}
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.daily_rate && <Text style={{ color: C.error, fontSize: 11, marginTop: 4 }}>{errors.daily_rate.message}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>TELÉFONO</Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={fieldBorder(false)}
                      placeholder="Opcional"
                      placeholderTextColor={C.border}
                      keyboardType="phone-pad"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={{
                backgroundColor: C.accent,
                borderRadius: 10,
                padding: 16,
                alignItems: 'center',
                marginTop: 12,
                opacity: createWorker.isPending ? 0.6 : 1,
              }}
              onPress={handleSubmit(onSubmit)}
              disabled={createWorker.isPending}
            >
              {createWorker.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Agregar obrero</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Role picker — bottom sheet modal */}
      <Modal visible={roleModalOpen} transparent animationType="slide" onRequestClose={() => setRoleModalOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setRoleModalOpen(false)}
        >
          <View style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            paddingBottom: Platform.OS === 'ios' ? 36 : 24,
          }}>
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: 20, borderBottomWidth: 1, borderBottomColor: C.border,
            }}>
              <Text style={{ color: C.text, fontWeight: '600', fontSize: 16 }}>Elegir Rol</Text>
              <TouchableOpacity onPress={() => setRoleModalOpen(false)}>
                <Ionicons name="close" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>
            {COMMON_ROLES.map((r, i) => (
              <TouchableOpacity
                key={r}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 24, paddingVertical: 16,
                  borderBottomWidth: i < COMMON_ROLES.length - 1 ? 1 : 0,
                  borderBottomColor: C.border + '60',
                }}
                onPress={() => { setValue('role', r, { shouldValidate: true }); setRoleModalOpen(false); }}
              >
                <Text style={{ color: selectedRole === r ? C.accent : C.text, fontSize: 15 }}>{r}</Text>
                {selectedRole === r && <Ionicons name="checkmark" size={18} color={C.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
