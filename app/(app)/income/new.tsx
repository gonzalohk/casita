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
import { useCreateIncome } from '@/hooks/useIncome';
import { useProjectStore } from '@/stores/projectStore';
import { todayISO } from '@/utils/formatters';
import { DateField } from '@/components/DateField';

const schema = z.object({
  description: z.string().min(3, 'Mínimo 3 caracteres'),
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Debe ser > 0'),
  source: z.enum(['personal', 'loan', 'other']),
  date: z.string().min(1, 'Campo requerido'),
});

type IncomeForm = z.infer<typeof schema>;

const SOURCES = [
  { value: 'personal' as const, label: 'Personal', icon: 'person-outline' as const },
  { value: 'loan' as const, label: 'Préstamo', icon: 'business-outline' as const },
  { value: 'other' as const, label: 'Otro', icon: 'briefcase-outline' as const },
];

const C = {
  bg: '#12141c',
  surface: '#1a1d27',
  border: '#2c3050',
  text: '#f0f0ff' as const,
  muted: '#7880a0',
  accent: '#4f7bff',
  error: '#f07070',
};

export default function NewIncomeScreen() {
  const { project } = useProjectStore();
  const createIncome = useCreateIncome();
  const [sourceModalOpen, setSourceModalOpen] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<IncomeForm>({
    resolver: zodResolver(schema),
    defaultValues: { description: '', amount: '', source: 'personal', date: todayISO() },
  });

  const selectedSource = watch('source');
  const selectedSourceLabel = SOURCES.find(s => s.value === selectedSource)?.label ?? '';

  const onSubmit = async (data: IncomeForm) => {
    if (!project) return;
    try {
      await createIncome.mutateAsync({
        project_id: project.id,
        description: data.description.trim(),
        amount: parseFloat(data.amount),
        source: data.source,
        date: data.date,
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 44, gap: 14 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={C.muted} />
            </TouchableOpacity>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '500' }}>Nuevo Ingreso</Text>
          </View>

          <View style={{ gap: 32 }}>
            {/* Source */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>TIPO DE INGRESO</Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  borderBottomWidth: 1.5, borderBottomColor: C.border,
                  paddingVertical: 12,
                }}
                onPress={() => setSourceModalOpen(true)}
              >
                <Text style={{ color: C.text, fontSize: 16 }}>{selectedSourceLabel}</Text>
                <Ionicons name="chevron-down" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>DESCRIPCIÓN</Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={fieldBorder(!!errors.description)}
                    placeholder="Ej: Recarga semanal, préstamo banco"
                    placeholderTextColor={C.border}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.description && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.description.message}</Text>}
            </View>

            {/* Amount */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>MONTO (Bs)</Text>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={fieldBorder(!!errors.amount)}
                    placeholder="0.00"
                    placeholderTextColor={C.border}
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.amount && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.amount.message}</Text>}
            </View>

            {/* Date */}
            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, value } }) => (
                <DateField
                  label="FECHA"
                  value={value}
                  onChange={onChange}
                  hasError={!!errors.date}
                  errorMessage={errors.date?.message}
                />
              )}
            />

            <TouchableOpacity
              style={{
                backgroundColor: C.accent,
                borderRadius: 10,
                padding: 16,
                alignItems: 'center',
                marginTop: 12,
                opacity: createIncome.isPending ? 0.6 : 1,
              }}
              onPress={handleSubmit(onSubmit)}
              disabled={createIncome.isPending}
            >
              {createIncome.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Registrar ingreso</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Source modal */}
      <Modal visible={sourceModalOpen} transparent animationType="slide" onRequestClose={() => setSourceModalOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setSourceModalOpen(false)}
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
              <Text style={{ color: C.text, fontWeight: '600', fontSize: 16 }}>Tipo de ingreso</Text>
              <TouchableOpacity onPress={() => setSourceModalOpen(false)}>
                <Ionicons name="close" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>
            {SOURCES.map((s, i) => (
              <TouchableOpacity
                key={s.value}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 24, paddingVertical: 16,
                  borderBottomWidth: i < SOURCES.length - 1 ? 1 : 0,
                  borderBottomColor: C.border + '60',
                }}
                onPress={() => { setValue('source', s.value); setSourceModalOpen(false); }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name={s.icon} size={20} color={selectedSource === s.value ? C.accent : C.muted} />
                  <Text style={{ color: selectedSource === s.value ? C.accent : C.text, fontSize: 15 }}>{s.label}</Text>
                </View>
                {selectedSource === s.value && <Ionicons name="checkmark" size={18} color={C.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
