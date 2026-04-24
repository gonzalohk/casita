/**
 * payroll/index.tsx  —  Payroll / Workers List Screen
 *
 * Lists all registered workers for the project.
 * Features:
 *   - Active/Inactive toggle per worker (tapping the status badge)
 *   - Total monthly payroll estimate shown at top
 *   - Tap worker card to see payment history ([workerId].tsx)
 *   - Quick "+ Pago" button to record a new payment for that worker
 *   - Floating "+" button to add a new worker
 */
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWorkers, useUpdateWorker } from '@/hooks/useWorkers';
import { formatCurrency } from '@/utils/formatters';
import { Worker } from '@/types/database';

function WorkerCard({ worker, onPay, onToggle }: {
  worker: Worker;
  onPay: () => void;
  onToggle: () => void;
}) {
  const isActive = worker.status === 'active';
  return (
    <View style={{
      backgroundColor: '#1c1c2e',
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      opacity: isActive ? 1 : 0.6,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#f59e0b20',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 20 }}>👷</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#f0f0ff', fontSize: 16, fontWeight: '600' }}>{worker.name}</Text>
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
              backgroundColor: isActive ? '#34d39920' : '#6b728020',
            }}>
              <Text style={{ color: isActive ? '#22c55e' : '#6b7280', fontSize: 10 }}>
                {isActive ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>
          <Text style={{ color: '#8888aa', fontSize: 13, marginTop: 2 }}>{worker.role}</Text>
          <Text style={{ color: '#fbbf24', fontSize: 13, marginTop: 2 }}>
            {formatCurrency(worker.daily_rate)} / día
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          {isActive && (
            <TouchableOpacity
              style={{ backgroundColor: '#f59e0b', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
              onPress={onPay}
            >
              <Text style={{ color: '#1a1a2e', fontWeight: '700', fontSize: 13 }}>Pagar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{ backgroundColor: '#2a2a4e', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' }}
            onPress={onToggle}
          >
            <Ionicons name={isActive ? 'pause-circle-outline' : 'play-circle-outline'} size={18} color="#606080" />
          </TouchableOpacity>
        </View>
      </View>

      {worker.phone && (
        <Text style={{ color: '#8888aa', fontSize: 12, marginTop: 8 }}>
          📞 {worker.phone}
        </Text>
      )}
    </View>
  );
}

export default function PayrollScreen() {
  const { data: workers = [], isLoading, refetch } = useWorkers();
  const updateWorker = useUpdateWorker();

  const active = workers.filter((w) => w.status === 'active');
  const inactive = workers.filter((w) => w.status === 'inactive');

  const toggleStatus = (worker: Worker) => {
    Alert.alert(
      worker.status === 'active' ? 'Desactivar obrero' : 'Reactivar obrero',
      `¿${worker.status === 'active' ? 'Desactivar' : 'Reactivar'} a ${worker.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => updateWorker.mutate({ id: worker.id, status: worker.status === 'active' ? 'inactive' : 'active' }),
        },
      ]
    );
  };

  const sections = [
    ...(active.length > 0 ? [{ title: `Activos (${active.length})`, data: active }] : []),
    ...(inactive.length > 0 ? [{ title: `Inactivos (${inactive.length})`, data: inactive }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f1a' }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#f0f0ff', fontSize: 24, fontWeight: '700' }}>Obreros</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{ backgroundColor: '#1c1c2e', borderRadius: 12, padding: 10 }}
              onPress={() => router.push('/(app)/payroll/new-payment')}
            >
              <Ionicons name="cash-outline" size={20} color="#f59e0b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: '#4f7bff', borderRadius: 12, padding: 10 }}
              onPress={() => router.push('/(app)/payroll/new-worker')}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
          <View style={{ flex: 1, backgroundColor: '#1c1c2e', borderRadius: 10, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: '#34d399', fontSize: 22, fontWeight: '700' }}>{active.length}</Text>
            <Text style={{ color: '#8888aa', fontSize: 11 }}>Activos</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#1c1c2e', borderRadius: 10, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: '#4f7bff', fontSize: 22, fontWeight: '700' }}>{workers.length}</Text>
            <Text style={{ color: '#8888aa', fontSize: 11 }}>Total</Text>
          </View>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 100 }}
          ListHeaderComponent={
            sections.length > 1 ? (
              <Text style={{ color: '#8888aa', fontSize: 12, marginBottom: 8 }}>ACTIVOS</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <WorkerCard
              worker={item}
              onPay={() => router.push({ pathname: '/(app)/payroll/new-payment', params: { workerId: item.id } })}
              onToggle={() => toggleStatus(item)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 48 }}>👷</Text>
              <Text style={{ color: '#8888aa', marginTop: 12 }}>Sin obreros registrados</Text>
              <TouchableOpacity
                style={{ marginTop: 16, backgroundColor: '#4f7bff', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
                onPress={() => router.push('/(app)/payroll/new-worker')}
              >
                <Text style={{ color: '#f0f0ff', fontWeight: '600' }}>Agregar obrero</Text>
              </TouchableOpacity>
            </View>
          }
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}
