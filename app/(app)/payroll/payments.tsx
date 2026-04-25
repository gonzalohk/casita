/**
 * payroll/payments.tsx  —  Historial de Pagos de Planilla
 *
 * Lists all payroll payments made for the project, ordered by date_paid desc.
 * Design mirrors expenses/index.tsx and income/index.tsx.
 */
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePayroll, useDeletePayroll } from '@/hooks/useWorkers';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { PayrollEntry } from '@/types/database';

function confirmDelete(message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
  } else {
    Alert.alert('Eliminar', message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

function PaymentRow({ item, onDelete }: { item: PayrollEntry; onDelete: () => void }) {
  const workerName = item.workers?.name ?? '—';
  const workerRole = item.workers?.role ?? '';
  return (
    <View style={{
      backgroundColor: '#1c1c2e',
      borderRadius: 16,
      padding: 18,
      marginBottom: 12,
    }}>
      {/* Row 1: nombre + monto */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 12 }}>
          <View style={{
            width: 38, height: 38, borderRadius: 10,
            backgroundColor: '#f59e0b20',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Ionicons name="people-outline" size={20} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#f0f0ff', fontSize: 16, fontWeight: '600' }}>{workerName}</Text>
            {!!workerRole && (
              <Text style={{ color: '#8888aa', fontSize: 13, marginTop: 1 }}>{workerRole}</Text>
            )}
          </View>
        </View>
        <Text style={{ color: '#f59e0b', fontWeight: '800', fontSize: 18 }}>
          {formatCurrency(item.amount)}
        </Text>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: '#2c305060', marginVertical: 10 }} />

      {/* Row 2: período + días trabajados */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="calendar-outline" size={14} color="#8888aa" />
          <Text style={{ color: '#8888aa', fontSize: 13 }}>
            {formatDate(item.period_start)} – {formatDate(item.period_end)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="sunny-outline" size={14} color="#8888aa" />
          <Text style={{ color: '#8888aa', fontSize: 13 }}>
            {item.days_worked} día{item.days_worked !== 1 ? 's' : ''} trabajado{item.days_worked !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Row 3: fecha de pago + eliminar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#34d399" />
          <Text style={{ color: '#606080', fontSize: 12 }}>Pagado el {formatDate(item.date_paid)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => confirmDelete('¿Eliminar este pago?', onDelete)}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={17} color="#606080" />
        </TouchableOpacity>
      </View>

      {/* Notas */}
      {!!item.notes && (
        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#2c305060' }}>
          <Text style={{ color: '#7880a0', fontSize: 13, fontStyle: 'italic' }}>{item.notes}</Text>
        </View>
      )}
    </View>
  );
}

export default function PayrollPaymentsScreen() {
  const { data: payments = [], isLoading, refetch } = usePayroll();
  const deletePayroll = useDeletePayroll();

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f1a' }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color="#8888aa" />
            </TouchableOpacity>
            <Text style={{ color: '#f0f0ff', fontSize: 26, fontWeight: '700' }}>Planilla</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: '#f59e0b', borderRadius: 10, padding: 10 }}
            onPress={() => router.push('/(app)/payroll/new-payment')}
          >
            <Ionicons name="add" size={22} color="#12141c" />
          </TouchableOpacity>
        </View>

        {/* Total */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: '#7880a0', fontSize: 11, letterSpacing: 1 }}>TOTAL PAGADO</Text>
          <Text style={{ color: '#f59e0b', fontSize: 32, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 }}>
            {formatCurrency(total)}
          </Text>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#f59e0b" />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <PaymentRow
              item={item}
              onDelete={() => deletePayroll.mutate(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#1a1d27', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="people-outline" size={34} color="#2c3050" />
              </View>
              <Text style={{ color: '#f0f0ff', fontSize: 17, fontWeight: '600', marginBottom: 8 }}>Sin pagos aún</Text>
              <Text style={{ color: '#7880a0', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>Registrá el primer pago de planilla para llevar el control de mano de obra.</Text>
              <TouchableOpacity
                style={{ marginTop: 24, borderWidth: 1.5, borderColor: '#f59e0b', borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 }}
                onPress={() => router.push('/(app)/payroll/new-payment')}
              >
                <Text style={{ color: '#f59e0b', fontWeight: '600', fontSize: 14 }}>Registrar primer pago</Text>
              </TouchableOpacity>
            </View>
          }
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}

      {/* Home FAB */}
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.85}
        style={{
          position: 'absolute', bottom: 32, alignSelf: 'center',
          backgroundColor: '#1a1d27', borderRadius: 50,
          width: 56, height: 56,
          justifyContent: 'center', alignItems: 'center',
          borderWidth: 1.5, borderColor: '#2c3050',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4, shadowRadius: 8, elevation: 10,
        }}
      >
        <Ionicons name="home-outline" size={24} color="#8888aa" />
      </TouchableOpacity>
    </View>
  );
}
