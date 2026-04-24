/**
 * income/index.tsx  —  Income List Screen
 *
 * Displays all income entries for the current project.
 * Income sources: personal capital, loan, other.
 * Each row shows source type, description, date and amount.
 * Entries can be deleted with a confirmation dialog.
 *
 * IncomeRow     — renders a single income entry.
 * SOURCE_LABELS — maps source enum to human-readable Spanish labels.
 * SOURCE_COLORS — maps source enum to display colors.
 */
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useIncome, useDeleteIncome } from '@/hooks/useIncome';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { IncomeEntry } from '@/types/database';

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

const SOURCE_LABELS = { personal: 'Personal', loan: 'Préstamo', other: 'Otro' } as const;
const SOURCE_COLORS = { personal: '#22c55e', loan: '#3b82f6', other: '#a0a0c0' } as const;

function IncomeRow({ item, onDelete }: { item: IncomeEntry; onDelete: () => void }) {
  const color = SOURCE_COLORS[item.source] ?? '#a0a0c0';
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1c1c2e',
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
    }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: color + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
      }}>
        <Ionicons name="arrow-down" size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#f0f0ff', fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={{ color: '#8888aa', fontSize: 12, marginTop: 2 }}>
          {SOURCE_LABELS[item.source] ?? item.source} · {formatDate(item.date)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <Text style={{ color: '#34d399', fontWeight: '700', fontSize: 15 }}>
          +{formatCurrency(item.amount)}
        </Text>
        <TouchableOpacity
          onPress={() => confirmDelete('¿Eliminar este ingreso?', onDelete)}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={16} color="#606080" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function IncomeScreen() {
  const { data: income = [], isLoading, refetch } = useIncome();
  const deleteIncome = useDeleteIncome();

  const total = income.reduce((sum, i) => sum + i.amount, 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f1a' }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: '#f0f0ff', fontSize: 26, fontWeight: '700' }}>Ingresos</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#34d399', borderRadius: 10, padding: 10 }}
            onPress={() => router.push('/(app)/income/new')}
          >
            <Ionicons name="add" size={22} color="#12141c" />
          </TouchableOpacity>
        </View>

        {/* Total — solo tipografía, sin caja */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: '#7880a0', fontSize: 11, letterSpacing: 1 }}>TOTAL INGRESADO</Text>
          <Text style={{ color: '#34d399', fontSize: 32, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 }}>
            +{formatCurrency(total)}
          </Text>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={income}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <IncomeRow item={item} onDelete={() => deleteIncome.mutate(item.id)} />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#1a1d27', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="cash-outline" size={34} color="#2c3050" />
              </View>
              <Text style={{ color: '#f0f0ff', fontSize: 17, fontWeight: '600', marginBottom: 8 }}>Sin ingresos aún</Text>
              <Text style={{ color: '#7880a0', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>Registrá tu primer ingreso para empezar a controlar el financiamiento de la obra.</Text>
              <TouchableOpacity
                style={{ marginTop: 24, borderWidth: 1.5, borderColor: '#34d399', borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 }}
                onPress={() => router.push('/(app)/income/new')}
              >
                <Text style={{ color: '#34d399', fontWeight: '600', fontSize: 14 }}>Agregar primer ingreso</Text>
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
