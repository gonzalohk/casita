/**
 * payroll/new-payment.tsx  —  New Payment Form
 *
 * Records a salary payment for a worker.
 * Fields:
 *   worker_id    — required; chosen from a list of active workers
 *   amount       — total amount paid in Bolivianos
 *   days_worked  — number of days worked in the period
 *   period_start — start of work period (ISO date)
 *   period_end   — end of work period (ISO date)
 *   date_paid    — date money was handed over
 *   notes        — optional notes
 *
 * When a worker is selected, auto-calculates amount from days_worked * daily_rate.
 * The user can override the calculated amount.
 */
import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useWorkers, useCreatePayroll } from '@/hooks/useWorkers';
import { useProjectStore } from '@/stores/projectStore';
import { formatCurrency, todayISO } from '@/utils/formatters';
import { DateField } from '@/components/DateField';

const schema = z.object({
  worker_id: z.string().min(1, 'Seleccioná un obrero'),
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Debe ser > 0'),
  days_worked: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Debe ser > 0'),
  period_start: z.string().min(1, 'Campo requerido'),
  period_end: z.string().min(1, 'Campo requerido'),
  date_paid: z.string().min(1, 'Campo requerido'),
  notes: z.string().optional(),
});

type PaymentForm = z.infer<typeof schema>;

const C = {
  bg: '#12141c',
  surface: '#1a1d27',
  border: '#2c3050',
  text: '#f0f0ff' as const,
  muted: '#7880a0',
  accent: '#4f7bff',
  error: '#f07070',
};

export default function NewPaymentScreen() {
  const { workerId } = useLocalSearchParams<{ workerId?: string }>();
  const { project } = useProjectStore();
  const { data: workers = [] } = useWorkers();
  const createPayroll = useCreatePayroll();
  const [workerModalOpen, setWorkerModalOpen] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<PaymentForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      worker_id: workerId ?? '',
      amount: '',
      days_worked: '',
      notes: '',
      date_paid: todayISO(),
      period_start: todayISO(),
      period_end: todayISO(),
    },
  });

  // Auto-calculate amount when worker or days changes
  const selectedWorkerId = watch('worker_id');
  const daysWorked = watch('days_worked');
  const selectedWorker = workers.find(w => w.id === selectedWorkerId);
  const activeWorkers = workers.filter(w => w.status === 'active');

  useEffect(() => {
    const worker = workers.find((w) => w.id === selectedWorkerId);
    const days = parseFloat(daysWorked ?? '0');
    if (worker && !isNaN(days) && days > 0) {
      setValue('amount', (worker.daily_rate * days).toFixed(2));
    }
  }, [selectedWorkerId, daysWorked, workers]);

  const onSubmit = async (data: PaymentForm) => {
    if (!project) return;
    try {
      await createPayroll.mutateAsync({
        project_id: project.id,
        worker_id: data.worker_id,
        amount: parseFloat(data.amount),
        days_worked: parseFloat(data.days_worked),
        period_start: data.period_start,
        period_end: data.period_end,
        date_paid: data.date_paid,
        notes: data.notes?.trim() || null,
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
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '500' }}>Registro de pago</Text>
          </View>

          <View style={{ gap: 32 }}>
            {/* Worker selector */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>OBRERO</Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  borderBottomWidth: 1.5,
                  borderBottomColor: errors.worker_id ? C.error : C.border,
                  paddingVertical: 12,
                }}
                onPress={() => setWorkerModalOpen(true)}
              >
                <Text style={{ color: selectedWorker ? C.text : C.border, fontSize: 16 }}>
                  {selectedWorker
                    ? `${selectedWorker.name} · ${formatCurrency(selectedWorker.daily_rate)}/día`
                    : 'Elegir obrero...'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={C.muted} />
              </TouchableOpacity>
              {errors.worker_id && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.worker_id.message}</Text>}
            </View>

            {/* Days worked */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>DÍAS TRABAJADOS</Text>
              <Controller
                control={control}
                name="days_worked"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={fieldBorder(!!errors.days_worked)}
                    placeholder="0"
                    placeholderTextColor={C.border}
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.days_worked && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.days_worked.message}</Text>}
            </View>

            {/* Amount */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>MONTO A PAGAR (Bs)</Text>
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
              <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>
                Calculado automáticamente. Podés editarlo.
              </Text>
              {errors.amount && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.amount.message}</Text>}
            </View>

            {/* Period dates */}
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="period_start"
                  render={({ field: { onChange, value } }) => (
                    <DateField label="PERÍODO INICIO" value={value} onChange={onChange} />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="period_end"
                  render={({ field: { onChange, value } }) => (
                    <DateField label="PERÍODO FIN" value={value} onChange={onChange} />
                  )}
                />
              </View>
            </View>

            {/* Date paid */}
            <Controller
              control={control}
              name="date_paid"
              render={({ field: { onChange, value } }) => (
                <DateField label="FECHA DE PAGO" value={value} onChange={onChange} />
              )}
            />

            {/* Notes */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>NOTAS (OPCIONAL)</Text>
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[fieldBorder(false), { minHeight: 72, textAlignVertical: 'top' }]}
                    placeholder="Semana del lunes al sábado..."
                    placeholderTextColor={C.border}
                    multiline
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: C.accent,
                borderRadius: 10,
                padding: 16,
                alignItems: 'center',
                marginTop: 12,
                opacity: createPayroll.isPending ? 0.6 : 1,
              }}
              onPress={handleSubmit(onSubmit)}
              disabled={createPayroll.isPending}
            >
              {createPayroll.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Registrar pago</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Worker modal */}
      <Modal visible={workerModalOpen} transparent animationType="slide" onRequestClose={() => setWorkerModalOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setWorkerModalOpen(false)}
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
              <Text style={{ color: C.text, fontWeight: '600', fontSize: 16 }}>Elegir obrero</Text>
              <TouchableOpacity onPress={() => setWorkerModalOpen(false)}>
                <Ionicons name="close" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>
            {activeWorkers.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: C.muted, marginBottom: 12 }}>No hay obreros activos</Text>
                <TouchableOpacity onPress={() => { setWorkerModalOpen(false); router.push('/(app)/payroll/new-worker'); }}>
                  <Text style={{ color: C.accent, fontSize: 14 }}>Agregar obrero</Text>
                </TouchableOpacity>
              </View>
            ) : activeWorkers.map((w, i) => (
              <TouchableOpacity
                key={w.id}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 24, paddingVertical: 16,
                  borderBottomWidth: i < activeWorkers.length - 1 ? 1 : 0,
                  borderBottomColor: C.border + '60',
                }}
                onPress={() => { setValue('worker_id', w.id, { shouldValidate: true }); setWorkerModalOpen(false); }}
              >
                <View>
                  <Text style={{ color: selectedWorkerId === w.id ? C.accent : C.text, fontSize: 15 }}>{w.name}</Text>
                  <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{w.role} · {formatCurrency(w.daily_rate)}/día</Text>
                </View>
                {selectedWorkerId === w.id && <Ionicons name="checkmark" size={18} color={C.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
