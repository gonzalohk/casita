/**
 * expenses/index.tsx  —  Expenses List Screen
 *
 * Displays all expenses for the current project.
 * Features:
 *   - Total shown (sum of filtered results)
 *   - Search bar for text filtering by description
 *   - Category dropdown filter (defaults to "All")
 *   - Swipe-to-delete (via trash icon) with confirmation dialog
 *
 * ExpenseRow  — renders a single expense with category icon, description,
 *               date, amount and a delete button.
 * confirmDelete — uses Alert on native and window.confirm on web.
 */
import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Platform, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useExpenses, useDeleteExpense, useExpenseCategories } from '@/hooks/useExpenses';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Expense } from '@/types/database';

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

function ExpenseRow({ item, onDelete }: { item: Expense; onDelete: (id: string) => void }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1c1c2e',
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
    }}>
      {/* Category color dot */}
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: (item.expense_categories?.color ?? '#6b7280') + '25',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
      }}>
        <Ionicons name={(item.expense_categories?.icon as any) ?? 'receipt'} size={20} color={item.expense_categories?.color ?? '#6b7280'} />
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#f0f0ff', fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={{ color: '#8888aa', fontSize: 12, marginTop: 2 }}>
          {item.expense_categories?.name ?? 'Sin categoría'} · {formatDate(item.date)}
        </Text>
      </View>

      {/* Amount + delete */}
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <Text style={{ color: '#f87171', fontWeight: '700', fontSize: 15 }}>
          -{formatCurrency(item.amount)}
        </Text>
        <TouchableOpacity
            onPress={() => confirmDelete('¿Eliminar este gasto?', () => onDelete(item.id))}
            hitSlop={8}
          >
          <Ionicons name="trash-outline" size={16} color="#606080" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ExpensesScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const { data: expenses = [], isLoading, refetch } = useExpenses({ category_id: selectedCategory });
  const { data: categories = [] } = useExpenseCategories();
  const deleteExpense = useDeleteExpense();

  const filtered = expenses.filter((e) =>
    e.description.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f1a' }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: '#f0f0ff', fontSize: 26, fontWeight: '700' }}>Gastos</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#4f7bff', borderRadius: 10, padding: 10 }}
            onPress={() => router.push('/(app)/expenses/new')}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Total — solo tipografía, sin caja */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#7880a0', fontSize: 11, letterSpacing: 1 }}>TOTAL MOSTRADO</Text>
          <Text style={{ color: '#f07070', fontSize: 32, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 }}>
            -{formatCurrency(total)}
          </Text>
        </View>

        {/* Search */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#1c1c2e',
          borderRadius: 12,
          paddingHorizontal: 14,
          marginBottom: 12,
        }}>
          <Ionicons name="search" size={18} color="#606080" />
          <TextInput
            style={{ flex: 1, color: '#f0f0ff', paddingVertical: 12, paddingHorizontal: 10, fontSize: 15 }}
            placeholder="Buscar gasto..."
            placeholderTextColor="#8888aa"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Category filter dropdown */}
        <TouchableOpacity
          onPress={() => setFilterModalOpen(true)}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#1c1c2e', borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 11,
            marginBottom: 4,
            borderWidth: 1.5,
            borderColor: selectedCategory ? (categories.find(c => c.id === selectedCategory)?.color ?? '#4f7bff') : '#2c3050',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {selectedCategory && (
              <View style={{
                width: 10, height: 10, borderRadius: 5,
                backgroundColor: categories.find(c => c.id === selectedCategory)?.color ?? '#4f7bff',
              }} />
            )}
            <Text style={{ color: selectedCategory ? '#f0f0ff' : '#7880a0', fontSize: 14 }}>
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Todos'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color="#7880a0" />
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <ExpenseRow
              item={item}
              onDelete={(id) => deleteExpense.mutate(id)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#1a1d27', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="receipt-outline" size={34} color="#2c3050" />
              </View>
              <Text style={{ color: '#f0f0ff', fontSize: 17, fontWeight: '600', marginBottom: 8 }}>Sin gastos aún</Text>
              <Text style={{ color: '#7880a0', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>Registrá tus primeros gastos para llevar el control del presupuesto.</Text>
              <TouchableOpacity
                style={{ marginTop: 24, borderWidth: 1.5, borderColor: '#4f7bff', borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 }}
                onPress={() => router.push('/(app)/expenses/new')}
              >
                <Text style={{ color: '#4f7bff', fontWeight: '600', fontSize: 14 }}>Agregar primer gasto</Text>
              </TouchableOpacity>
            </View>
          }
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}

      {/* Filter modal */}
      <Modal visible={filterModalOpen} transparent animationType="slide" onRequestClose={() => setFilterModalOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setFilterModalOpen(false)}
        >
          <View style={{ backgroundColor: '#1a1d27', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24 }}>
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: 20, borderBottomWidth: 1, borderBottomColor: '#2c3050',
            }}>
              <Text style={{ color: '#f0f0ff', fontWeight: '600', fontSize: 16 }}>Filtrar por categoría</Text>
              <TouchableOpacity onPress={() => setFilterModalOpen(false)}>
                <Ionicons name="close" size={20} color="#7880a0" />
              </TouchableOpacity>
            </View>
            {/* Todos */}
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 24, paddingVertical: 15,
                borderBottomWidth: 1, borderBottomColor: '#2c305040',
              }}
              onPress={() => { setSelectedCategory(undefined); setFilterModalOpen(false); }}
            >
              <Text style={{ color: !selectedCategory ? '#4f7bff' : '#f0f0ff', fontSize: 15 }}>Todos</Text>
              {!selectedCategory && <Ionicons name="checkmark" size={18} color="#4f7bff" />}
            </TouchableOpacity>
            {categories.map((c, i) => (
              <TouchableOpacity
                key={c.id}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 24, paddingVertical: 15,
                  borderBottomWidth: i < categories.length - 1 ? 1 : 0,
                  borderBottomColor: '#2c305040',
                }}
                onPress={() => { setSelectedCategory(c.id); setFilterModalOpen(false); }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.color }} />
                  <Text style={{ color: selectedCategory === c.id ? c.color : '#f0f0ff', fontSize: 15 }}>{c.name}</Text>
                </View>
                {selectedCategory === c.id && <Ionicons name="checkmark" size={18} color={c.color} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
