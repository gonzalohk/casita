import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSuppliers, useDeleteSupplier } from '@/hooks/useSuppliers';
import { Supplier, SupplierCategory } from '@/types/database';

const C = {
  bg: '#0b0e14',
  surface: '#151921',
  surfaceHigh: '#1d2233',
  border: '#1e2535',
  textPrimary: '#eef0f8',
  textSecondary: '#8a94a6',
  textMuted: '#4a5268',
  accent: '#4f7bff',
  green: '#2dd68a',
  red: '#d97070',
  amber: '#c98a3e',
};

const CATEGORY_META: Record<SupplierCategory, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  materials: { label: 'Materiales', icon: 'cube-outline', color: '#4f7bff' },
  services:  { label: 'Servicios',  icon: 'construct-outline', color: '#c98a3e' },
  equipment: { label: 'Equipos',    icon: 'hardware-chip-outline', color: '#a855f7' },
  other:     { label: 'Otro',       icon: 'ellipsis-horizontal-outline', color: '#8a94a6' },
};

function SupplierCard({ supplier, onPress, onDelete }: {
  supplier: Supplier;
  onPress: () => void;
  onDelete: () => void;
}) {
  const meta = CATEGORY_META[supplier.category];
  const isActive = supplier.status === 'active';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: isActive ? 1 : 0.6,
      }}
    >
      <View style={{
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: meta.color + '20',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14,
      }}>
        <Ionicons name={meta.icon} size={22} color={meta.color} />
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <Text style={{ color: C.textPrimary, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
            {supplier.name}
          </Text>
          {!isActive && (
            <View style={{ backgroundColor: C.surfaceHigh, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 }}>
              <Text style={{ color: C.textMuted, fontSize: 10 }}>Inactivo</Text>
            </View>
          )}
        </View>
        <Text style={{ color: meta.color, fontSize: 12 }}>{meta.label}</Text>
        {supplier.phone ? (
          <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>
            {supplier.phone}
          </Text>
        ) : null}
        {supplier.address ? (
          <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
            {supplier.address}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={onDelete}
        style={{ padding: 8 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={C.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const ALL_FILTER = 'all';
type FilterKey = SupplierCategory | typeof ALL_FILTER;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: ALL_FILTER, label: 'Todos' },
  { key: 'materials', label: 'Materiales' },
  { key: 'services', label: 'Servicios' },
  { key: 'equipment', label: 'Equipos' },
  { key: 'other', label: 'Otro' },
];

export default function SuppliersIndexScreen() {
  const { data: suppliers = [], isPending, refetch } = useSuppliers();
  const deleteSupplier = useDeleteSupplier();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>(ALL_FILTER);

  const filtered = suppliers.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === ALL_FILTER || s.category === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = (supplier: Supplier) => {
    Alert.alert(
      'Eliminar proveedor',
      `¿Eliminar a "${supplier.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: () => deleteSupplier.mutate(supplier.id),
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{
        paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, color: C.textPrimary, fontSize: 20, fontWeight: '700' }}>
          Proveedores
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/suppliers/new')}
          style={{
            backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 8,
            borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
        }}>
          <Ionicons name="search-outline" size={16} color={C.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar proveedor..."
            placeholderTextColor={C.textMuted}
            style={{ flex: 1, color: C.textPrimary, fontSize: 14 }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter chips */}
      <View style={{ paddingLeft: 20, marginBottom: 16 }}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item.key)}
              style={{
                paddingHorizontal: 14, paddingVertical: 7,
                borderRadius: 20, marginRight: 8,
                backgroundColor: filter === item.key ? C.accent : C.surface,
              }}
            >
              <Text style={{
                color: filter === item.key ? '#fff' : C.textSecondary,
                fontSize: 13, fontWeight: '500',
              }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* List */}
      {isPending ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Ionicons name="business-outline" size={48} color={C.textMuted} />
          <Text style={{ color: C.textMuted, marginTop: 12, textAlign: 'center', fontSize: 14 }}>
            {search || filter !== ALL_FILTER ? 'Sin resultados' : 'Aún no hay proveedores.\nAgregá uno con el botón +'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <SupplierCard
              supplier={item}
              onPress={() => router.push(`/(app)/suppliers/${item.id}`)}
              onDelete={() => handleDelete(item)}
            />
          )}
          onRefresh={refetch}
          refreshing={isPending}
        />
      )}
    </View>
  );
}
