/**
 * inventory/index.tsx  —  Inventory (Materials) List Screen
 *
 * Lists all construction materials for the project.
 * Features:
 *   - Search by name
 *   - Inline +/- stock adjustment buttons (adjusts by 1 unit)
 *   - Low-stock indicator: red left border when stock_current <= stock_min
 *   - Tap row to open the detail/edit screen
 *   - Delete with confirmation
 *
 * MaterialRow  — renders a single material card with stock controls.
 * confirmDelete — cross-platform delete confirmation.
 */
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMaterials, useDeleteMaterial, useAdjustStock } from '@/hooks/useMaterials';
import { Material } from '@/types/database';

function confirmDelete(name: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`¿Eliminar "${name}" del inventario?`)) onConfirm();
  } else {
    const { Alert } = require('react-native');
    Alert.alert('Eliminar material', `¿Eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

function MaterialRow({
  item,
  onDelete,
  onAdjust,
}: {
  item: Material;
  onDelete: () => void;
  onAdjust: (delta: number) => void;
}) {
  const isLow = item.stock_current <= item.stock_min;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/inventory/${item.id}`)}
      style={{
        backgroundColor: '#1c1c2e',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderLeftWidth: isLow ? 3 : 0,
        borderLeftColor: '#ef4444',
      }}
    >
      {/* Row top: icon + info + delete */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 44, height: 44, borderRadius: 12,
          backgroundColor: '#4f7bff20',
          justifyContent: 'center', alignItems: 'center', marginRight: 12,
        }}>
          <Ionicons name="cube-outline" size={22} color="#3b82f6" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: '#f0f0ff', fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
          <Text style={{ color: '#8888aa', fontSize: 12, marginTop: 2 }}>
            {item.category} · {item.unit}
          </Text>
        </View>

        <TouchableOpacity
          onPress={(e) => { e.stopPropagation?.(); confirmDelete(item.name, onDelete); }}
          hitSlop={8}
          style={{ padding: 4 }}
        >
          <Ionicons name="trash-outline" size={16} color="#606080" />
        </TouchableOpacity>
      </View>

      {/* Row bottom: stock display + +/- buttons */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}>
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation?.(); onAdjust(-1); }}
          style={{
            width: 32, height: 32, borderRadius: 8,
            backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center',
          }}
        >
          <Ionicons name="remove" size={18} color="#ef4444" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: isLow ? '#ef4444' : '#22c55e', fontSize: 20, fontWeight: '800' }}>
            {item.stock_current}
          </Text>
          <Text style={{ color: '#8888aa', fontSize: 11 }}>
            {isLow ? `⚠ mín ${item.stock_min}` : `mín ${item.stock_min}`}
          </Text>
        </View>

        <TouchableOpacity
          onPress={(e) => { e.stopPropagation?.(); onAdjust(+1); }}
          style={{
            width: 32, height: 32, borderRadius: 8,
            backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center',
          }}
        >
          <Ionicons name="add" size={18} color="#22c55e" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function InventoryScreen() {
  const { data: materials = [], isLoading, refetch } = useMaterials();
  const deleteMaterial = useDeleteMaterial();
  const adjustStock = useAdjustStock();

  const lowStock = materials.filter((m) => m.stock_current <= m.stock_min);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f1a' }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color="#8888aa" />
            </TouchableOpacity>
            <Text style={{ color: '#f0f0ff', fontSize: 24, fontWeight: '700' }}>Inventario</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: '#4f7bff', borderRadius: 12, padding: 10 }}
            onPress={() => router.push('/(app)/inventory/new')}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Low stock alert */}
        {lowStock.length > 0 && (
          <View style={{
            backgroundColor: '#ef444420', borderRadius: 10, padding: 12,
            marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
          }}>
            <Ionicons name="warning" size={18} color="#ef4444" />
            <Text style={{ color: '#f87171', fontSize: 13, flex: 1 }}>
              {lowStock.length} material{lowStock.length > 1 ? 'es' : ''} por debajo del mínimo
            </Text>
          </View>
        )}

        {/* Stats chips */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#1c1c2e', borderRadius: 10, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: '#4f7bff', fontSize: 20, fontWeight: '700' }}>{materials.length}</Text>
            <Text style={{ color: '#8888aa', fontSize: 11 }}>Total</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#1c1c2e', borderRadius: 10, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: '#f87171', fontSize: 20, fontWeight: '700' }}>{lowStock.length}</Text>
            <Text style={{ color: '#8888aa', fontSize: 11 }}>Stock bajo</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#1c1c2e', borderRadius: 10, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: '#34d399', fontSize: 20, fontWeight: '700' }}>
              {materials.length - lowStock.length}
            </Text>
            <Text style={{ color: '#8888aa', fontSize: 11 }}>OK</Text>
          </View>
        </View>

      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <MaterialRow
              item={item}
              onDelete={() => deleteMaterial.mutate(item.id)}
              onAdjust={(delta) => adjustStock.mutate({ id: item.id, delta })}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="cube-outline" size={48} color="#2e2e48" />
              <Text style={{ color: '#8888aa', marginTop: 12 }}>Sin materiales en inventario</Text>
              <TouchableOpacity
                style={{ marginTop: 16, backgroundColor: '#4f7bff', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
                onPress={() => router.push('/(app)/inventory/new')}
              >
                <Text style={{ color: '#f0f0ff', fontWeight: '600' }}>Agregar primer material</Text>
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
          backgroundColor: '#1a1d2e', borderRadius: 50,
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


