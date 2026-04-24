import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useScheduleTask, useUpdateScheduleTask, useDeleteScheduleTask } from '@/hooks/useSchedule';
import { usePhases } from '@/hooks/usePhases';
import { TaskStatus } from '@/types/database';
import { DateField } from '@/components/DateField';

const PHASES = [
  'Fundaciones', 'Estructura', 'Muros', 'Cubierta',
  'Instalaciones', 'Revoques', 'Pisos', 'Pintura', 'Terminaciones', 'General',
];

const taskSchema = z.object({
  name:        z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().optional(),
  phase_id:    z.string().min(1, 'Seleccioná una fase'),
  start_date:  z.string().min(1, 'Campo requerido'),
  end_date:    z.string().min(1, 'Campo requerido'),
  status:      z.enum(['pending', 'in_progress', 'completed', 'delayed']),
  progress:    z.string().refine(v => {
    const n = parseInt(v);
    return !isNaN(n) && n >= 0 && n <= 100;
  }, 'Debe ser entre 0 y 100'),
}).refine(d => d.end_date >= d.start_date, {
  message: 'La fecha fin debe ser igual o posterior al inicio',
  path: ['end_date'],
});

type TaskForm = z.infer<typeof taskSchema>;

const C = {
  bg: '#12141c',
  surface: '#1a1d27',
  border: '#2c3050',
  text: '#f0f0ff' as const,
  muted: '#7880a0',
  accent: '#4f7bff',
  error: '#f07070',
  green: '#2dd68a',
  amber: '#c98a3e',
};

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'pending',     label: 'Pendiente',  color: '#4a5268' },
  { value: 'in_progress', label: 'En curso',   color: '#4f7bff' },
  { value: 'completed',   label: 'Completado', color: '#2dd68a' },
  { value: 'delayed',     label: 'Atrasado',   color: '#d97070' },
];

export default function ScheduleTaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: task, isPending } = useScheduleTask(id!);
  const updateTask = useUpdateScheduleTask();
  const deleteTask = useDeleteScheduleTask();
  const { data: phases = [] } = usePhases();
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    values: task ? {
      name:        task.name,
      description: task.description ?? '',
      phase_id:    task.phase_id ?? '',
      start_date:  task.start_date,
      end_date:    task.end_date,
      status:      task.status,
      progress:    String(task.progress),
    } : undefined,
  });

  const selectedStatus = watch('status');
  const selectedPhaseId = watch('phase_id');
  const selectedPhase = phases.find(p => p.id === selectedPhaseId);

  const onSubmit = async (data: TaskForm) => {
    if (!task) return;
    const ph = phases.find(p => p.id === data.phase_id);
    const progress = data.status === 'completed' ? 100 : parseInt(data.progress) || 0;
    try {
      await updateTask.mutateAsync({
        id: task.id,
        name:        data.name.trim(),
        description: data.description?.trim() || null,
        phase_id:    data.phase_id,
        phase:       ph?.name ?? null,
        start_date:  data.start_date,
        end_date:    data.end_date,
        status:      data.status,
        progress,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar tarea',
      `¿Eliminar "${task?.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            await deleteTask.mutateAsync(task!.id);
            router.back();
          },
        },
      ]
    );
  };

  const fieldBorder = (hasError: boolean) => ({
    borderBottomWidth: 1.5,
    borderBottomColor: hasError ? C.error : C.border,
    paddingVertical: 12,
    paddingHorizontal: 2,
    color: C.text,
    fontSize: 16,
  });

  if (isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: C.muted }}>Tarea no encontrada</Text>
      </View>
    );
  }

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
            <Text style={{ flex: 1, color: C.text, fontSize: 20, fontWeight: '700' }}>Editar tarea</Text>
            <TouchableOpacity onPress={handleDelete} style={{ padding: 8 }}>
              <Ionicons name="trash-outline" size={20} color={C.error} />
            </TouchableOpacity>
          </View>

          {/* Estado */}
          <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 10 }}>ESTADO</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {STATUS_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s.value}
                onPress={() => {
                  setValue('status', s.value);
                  if (s.value === 'completed') setValue('progress', '100');
                }}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: selectedStatus === s.value ? s.color + '25' : C.surface,
                  borderWidth: 1.5,
                  borderColor: selectedStatus === s.value ? s.color : C.border,
                }}
              >
                <Text style={{
                  color: selectedStatus === s.value ? s.color : C.muted,
                  fontWeight: '600', fontSize: 13,
                }}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nombre */}
          <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 4 }}>NOMBRE</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholderTextColor={C.muted}
                style={[fieldBorder(!!errors.name), { marginBottom: errors.name ? 4 : 24 }]}
              />
            )}
          />
          {errors.name && <Text style={{ color: C.error, fontSize: 12, marginBottom: 16 }}>{errors.name.message}</Text>}

          {/* Fase */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600' }}>FASE</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/schedule/phases')}>
              <Text style={{ color: C.accent, fontSize: 11 }}>+ Gestionar fases</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => setPhaseModalOpen(true)}
            style={[fieldBorder(!!errors.phase_id), { flexDirection: 'row', alignItems: 'center', marginBottom: errors.phase_id ? 4 : 24 }]}
          >
            {selectedPhase ? (
              <>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: selectedPhase.color, marginRight: 10 }} />
                <Text style={{ flex: 1, color: C.text, fontSize: 16 }}>{selectedPhase.name}</Text>
              </>
            ) : (
              <Text style={{ flex: 1, color: C.muted, fontSize: 16 }}>Seleccioná una fase</Text>
            )}
            <Ionicons name="chevron-down" size={16} color={C.muted} />
          </TouchableOpacity>
          {errors.phase_id && <Text style={{ color: C.error, fontSize: 12, marginBottom: 16 }}>{errors.phase_id.message}</Text>}

          {/* Avance */}
          <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 4 }}>AVANCE (%)</Text>
          <Controller
            control={control}
            name="progress"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholderTextColor={C.muted}
                style={[fieldBorder(!!errors.progress), { marginBottom: errors.progress ? 4 : 24 }]}
              />
            )}
          />
          {errors.progress && <Text style={{ color: C.error, fontSize: 12, marginBottom: 16 }}>{errors.progress.message}</Text>}

          {/* Fecha inicio */}
          <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 4 }}>FECHA INICIO</Text>
          <Controller
            control={control}
            name="start_date"
            render={({ field: { onChange, value } }) => (
              <DateField value={value} onChange={onChange} />
            )}
          />
          {errors.start_date && <Text style={{ color: C.error, fontSize: 12, marginBottom: 8 }}>{errors.start_date.message}</Text>}
          <View style={{ marginBottom: 24 }} />

          {/* Fecha fin */}
          <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 4 }}>FECHA FIN</Text>
          <Controller
            control={control}
            name="end_date"
            render={({ field: { onChange, value } }) => (
              <DateField value={value} onChange={onChange} />
            )}
          />
          {errors.end_date && <Text style={{ color: C.error, fontSize: 12, marginBottom: 8 }}>{errors.end_date.message}</Text>}
          <View style={{ marginBottom: 24 }} />

          {/* Descripción */}
          <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 4 }}>DESCRIPCIÓN</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Detalles adicionales..."
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
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Phase Modal */}
      <Modal visible={phaseModalOpen} transparent animationType="slide">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setPhaseModalOpen(false)}
        >
          <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 16 }}>FASE</Text>
            {phases.map((phase) => (
              <TouchableOpacity
                key={phase.id}
                onPress={() => { setValue('phase_id', phase.id); setPhaseModalOpen(false); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: C.border + '60',
                }}
              >
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: phase.color, marginRight: 14 }} />
                <Text style={{ flex: 1, color: C.text, fontSize: 16 }}>{phase.name}</Text>
                {selectedPhaseId === phase.id && (
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
