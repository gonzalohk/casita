import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkers, usePayrollByWorker, useDeletePayroll } from '@/hooks/useWorkers';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function WorkerDetailScreen() {
  const { workerId } = useLocalSearchParams<{ workerId: string }>();
  const { data: workers = [] } = useWorkers();
  const { data: payroll = [], isLoading, refetch } = usePayrollByWorker(workerId);
  const deletePayroll = useDeletePayroll();

  const worker = workers.find((w) => w.id === workerId);
  const totalPaid = payroll.reduce((sum, p) => sum + p.amount, 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f1a' }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 60 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#f0f0ff', fontSize: 22, fontWeight: '700' }}>
            {worker?.name ?? 'Obrero'}
          </Text>
        </View>

        {worker && (
          <View style={{ backgroundColor: '#1c1c2e', borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: '#8888aa', fontSize: 13 }}>{worker.role}</Text>
            <Text style={{ color: '#fbbf24', fontSize: 20, fontWeight: '700', marginTop: 4 }}>
              {formatCurrency(worker.daily_rate)} / día
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <View>
                <Text style={{ color: '#8888aa', fontSize: 11 }}>Total pagado</Text>
                <Text style={{ color: '#f87171', fontSize: 18, fontWeight: '700' }}>
                  {formatCurrency(totalPaid)}
                </Text>
              </View>
              <View>
                <Text style={{ color: '#8888aa', fontSize: 11 }}>Pagos registrados</Text>
                <Text style={{ color: '#f0f0ff', fontSize: 18, fontWeight: '700' }}>{payroll.length}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={{ backgroundColor: '#f59e0b', borderRadius: 12, padding: 12, alignItems: 'center' }}
          onPress={() => router.push({ pathname: '/(app)/payroll/new-payment', params: { workerId } })}
        >
          <Text style={{ color: '#1a1a2e', fontWeight: '700' }}>+ Registrar nuevo pago</Text>
        </TouchableOpacity>
      </View>

      {/* Payroll list */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={payroll}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 100 }}
          ListHeaderComponent={
            <Text style={{ color: '#8888aa', fontSize: 12, marginBottom: 10 }}>HISTORIAL DE PAGOS</Text>
          }
          renderItem={({ item }) => (
            <View style={{
              backgroundColor: '#1c1c2e',
              borderRadius: 12,
              padding: 14,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f0f0ff', fontSize: 14, fontWeight: '500' }}>
                  {item.days_worked} días trabajados
                </Text>
                <Text style={{ color: '#8888aa', fontSize: 12 }}>
                  {formatDate(item.period_start)} → {formatDate(item.period_end)}
                </Text>
                {item.notes && (
                  <Text style={{ color: '#8888aa', fontSize: 12, marginTop: 2 }}>{item.notes}</Text>
                )}
                <Text style={{ color: '#8888aa', fontSize: 11, marginTop: 4 }}>
                  Pagado: {formatDate(item.date_paid)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Text style={{ color: '#fbbf24', fontWeight: '700', fontSize: 16 }}>
                  {formatCurrency(item.amount)}
                </Text>
                <TouchableOpacity
                  onPress={() => Alert.alert('Eliminar pago', '¿Eliminar este pago?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: () => deletePayroll.mutate(item.id) },
                  ])}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={16} color="#606080" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: '#8888aa' }}>Sin pagos registrados para este obrero</Text>
            </View>
          }
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}
