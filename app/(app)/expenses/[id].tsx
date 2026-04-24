/**
 * expenses/[id].tsx  —  Expense Detail Screen
 *
 * Shows the full details of a single expense entry.
 * Reads the expense from the cached list (no extra query needed).
 * Displays category, amount, date and description.
 *
 * Uses useLocalSearchParams to get the expense id from the URL.
 */
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '@/hooks/useExpenses';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: expenses = [], isLoading } = useExpenses();
  const expense = expenses.find((e) => e.id === id);

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#3b82f6" /></View>;
  }

  if (!expense) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#8888aa' }}>Gasto no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: '#4f7bff' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const color = expense.expense_categories?.color ?? '#6b7280';

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f1a' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#f0f0ff', fontSize: 22, fontWeight: '700' }}>Detalle del Gasto</Text>
        </View>

        {/* Amount hero */}
        <View style={{ backgroundColor: '#1c1c2e', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: color + '25', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name={(expense.expense_categories?.icon as any) ?? 'receipt'} size={32} color={color} />
          </View>
          <Text style={{ color: '#f87171', fontSize: 36, fontWeight: '800' }}>
            -{formatCurrency(expense.amount)}
          </Text>
          <Text style={{ color: '#8888aa', marginTop: 8, fontSize: 16 }}>{expense.description}</Text>
        </View>

        {/* Details */}
        {[
          { label: 'Categoría', value: expense.expense_categories?.name ?? 'Sin categoría' },
          { label: 'Fecha', value: formatDate(expense.date) },
          { label: 'Registrado', value: formatDate(expense.created_at) },
        ].map((row) => (
          <View key={row.label} style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: '#252538',
          }}>
            <Text style={{ color: '#8888aa' }}>{row.label}</Text>
            <Text style={{ color: '#f0f0ff', fontWeight: '500' }}>{row.value}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
