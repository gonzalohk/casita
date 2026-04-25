/**
 * payroll/index.tsx  —  Payroll / Workers List Screen
 *
 * Lists all registered workers for the project.
 * Features:
 *   - Spacious worker cards — name, role, rate, phone, status badge
 *   - Inline edit modal — tap pencil to edit name, role, rate, phone
 *   - Active/Inactive toggle per worker
 *   - Quick "Pagar" button per active worker
 *   - Back arrow in header + floating home FAB
 */
import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWorkers, useUpdateWorker } from '@/hooks/useWorkers';
import { formatCurrency } from '@/utils/formatters';
import { Worker } from '@/types/database';

const C = {
  bg: '#0f0f1a',
  surface: '#1a1d2e',
  surfaceHigh: '#22253a',
  border: '#2c3050',
  textPrimary: '#f0f0ff',
  textSecondary: '#8888aa',
  textMuted: '#4e5272',
  accent: '#4f7bff',
  amber: '#f59e0b',
  green: '#34d399',
  red: '#f87171',
};

function WorkerCard({ worker, onPay, onToggle, onEdit }: {
  worker: Worker;
  onPay: () => void;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const isActive = worker.status === 'active';
  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(app)/payroll/[workerId]', params: { workerId: worker.id } })}
      activeOpacity={0.85}
      style={{
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 22,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: C.border,
        opacity: isActive ? 1 : 0.55,
      }}
    >
      {/* Top row: avatar + name/role + edit */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
        <View style={{
          width: 54, height: 54, borderRadius: 27,
          backgroundColor: C.amber + '20',
          justifyContent: 'center', alignItems: 'center',
          marginRight: 14,
        }}>
          <Text style={{ fontSize: 26 }}>👷</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ color: C.textPrimary, fontSize: 18, fontWeight: '700' }}>{worker.name}</Text>
            <View style={{
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
              backgroundColor: isActive ? C.green + '20' : '#6b728020',
            }}>
              <Text style={{ color: isActive ? C.green : '#6b7280', fontSize: 10, fontWeight: '600' }}>
                {isActive ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>
          <Text style={{ color: C.textSecondary, fontSize: 14, marginTop: 3 }}>{worker.role}</Text>
        </View>
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); onEdit(); }}
          hitSlop={8}
          style={{ backgroundColor: C.surfaceHigh, borderRadius: 10, padding: 8 }}
        >
          <Ionicons name="create-outline" size={18} color={C.accent} />
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1, backgroundColor: C.surfaceHigh, borderRadius: 12, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: C.amber, fontSize: 16, fontWeight: '700' }}>{formatCurrency(worker.daily_rate)}</Text>
          <Text style={{ color: C.textMuted, fontSize: 10, marginTop: 3, letterSpacing: 0.5 }}>POR DÍA</Text>
        </View>
        {worker.phone ? (
          <View style={{ flex: 1, backgroundColor: C.surfaceHigh, borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: C.textSecondary, fontSize: 14, fontWeight: '600' }}>{worker.phone}</Text>
            <Text style={{ color: C.textMuted, fontSize: 10, marginTop: 3, letterSpacing: 0.5 }}>TELÉFONO</Text>
          </View>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {isActive && (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); onPay(); }}
            style={{ flex: 1, backgroundColor: C.amber, borderRadius: 12, paddingVertical: 11, alignItems: 'center' }}
          >
            <Text style={{ color: '#1a1a2e', fontWeight: '700', fontSize: 14 }}>💰 Registrar pago</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); onToggle(); }}
          style={{
            backgroundColor: C.surfaceHigh, borderRadius: 12, paddingVertical: 11,
            paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
            ...(isActive ? {} : { flex: 1 }),
          }}
        >
          <Ionicons name={isActive ? 'pause-circle-outline' : 'play-circle-outline'} size={20} color={C.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function PayrollScreen() {
  const { data: workers = [], isLoading, refetch } = useWorkers();
  const updateWorker = useUpdateWorker();

  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const active = workers.filter((w) => w.status === 'active');

  function openEdit(w: Worker) {
    setEditWorker(w);
    setEditName(w.name);
    setEditRole(w.role);
    setEditRate(String(w.daily_rate));
    setEditPhone(w.phone ?? '');
  }

  async function submitEdit() {
    if (!editWorker) return;
    const rate = parseFloat(editRate);
    if (!editName.trim() || !editRole.trim() || isNaN(rate)) return;
    await updateWorker.mutateAsync({
      id: editWorker.id,
      name: editName.trim(),
      role: editRole.trim(),
      daily_rate: rate,
      phone: editPhone.trim() || null,
    });
    setEditWorker(null);
  }

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

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color={C.textSecondary} />
            </TouchableOpacity>
            <Text style={{ color: C.textPrimary, fontSize: 26, fontWeight: '700' }}>Obreros</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{ backgroundColor: C.surface, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.border }}
              onPress={() => router.push('/(app)/payroll/new-payment')}
            >
              <Ionicons name="cash-outline" size={20} color={C.amber} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: C.accent, borderRadius: 12, padding: 10 }}
              onPress={() => router.push('/(app)/payroll/new-worker')}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.green, fontSize: 24, fontWeight: '800' }}>{active.length}</Text>
            <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>Activos</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.accent, fontSize: 24, fontWeight: '800' }}>{workers.length}</Text>
            <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>Total</Text>
          </View>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.accent} />
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <WorkerCard
              worker={item}
              onPay={() => router.push({ pathname: '/(app)/payroll/new-payment', params: { workerId: item.id } })}
              onToggle={() => toggleStatus(item)}
              onEdit={() => openEdit(item)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Text style={{ fontSize: 56 }}>👷</Text>
              <Text style={{ color: C.textSecondary, marginTop: 14, fontSize: 16, fontWeight: '600' }}>Sin obreros registrados</Text>
              <TouchableOpacity
                style={{ marginTop: 20, backgroundColor: C.accent, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13 }}
                onPress={() => router.push('/(app)/payroll/new-worker')}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Agregar obrero</Text>
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
          backgroundColor: C.surface, borderRadius: 50,
          width: 56, height: 56,
          justifyContent: 'center', alignItems: 'center',
          borderWidth: 1.5, borderColor: C.border,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4, shadowRadius: 8, elevation: 10,
        }}
      >
        <Ionicons name="home-outline" size={24} color={C.textSecondary} />
      </TouchableOpacity>

      {/* Edit worker modal */}
      <Modal visible={!!editWorker} transparent animationType="slide" onRequestClose={() => setEditWorker(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: C.surfaceHigh, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: C.textPrimary, fontSize: 20, fontWeight: '700' }}>Editar obrero</Text>
              <TouchableOpacity onPress={() => setEditWorker(null)} hitSlop={8}>
                <Ionicons name="close" size={22} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            {[
              { label: 'NOMBRE', value: editName, set: setEditName, placeholder: 'Nombre completo', keyboard: 'default' as const },
              { label: 'ROL', value: editRole, set: setEditRole, placeholder: 'Ej: Albañil', keyboard: 'default' as const },
              { label: 'TARIFA DIARIA (BOB)', value: editRate, set: setEditRate, placeholder: '0.00', keyboard: 'numeric' as const },
              { label: 'TELÉFONO (opcional)', value: editPhone, set: setEditPhone, placeholder: '+591...', keyboard: 'phone-pad' as const },
            ].map(f => (
              <View key={f.label} style={{ marginBottom: 18 }}>
                <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>{f.label}</Text>
                <TextInput
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder}
                  placeholderTextColor={C.textMuted}
                  keyboardType={f.keyboard}
                  style={{
                    backgroundColor: C.surface, borderRadius: 12,
                    borderWidth: 1, borderColor: C.border,
                    color: C.textPrimary, fontSize: 16,
                    paddingHorizontal: 14, paddingVertical: 12,
                  }}
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={submitEdit}
              disabled={!editName.trim() || !editRole.trim() || updateWorker.isPending}
              style={{
                backgroundColor: editName.trim() && editRole.trim() ? C.accent : C.textMuted + '40',
                borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4,
              }}
            >
              {updateWorker.isPending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Guardar cambios</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
