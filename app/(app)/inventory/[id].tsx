import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useMaterials, useUpdateMaterial, useDeleteMaterial, useAdjustStock, useStockMovements } from '@/hooks/useMaterials';
import { formatDate } from '@/utils/formatters';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  category: z.string().min(1, 'Campo requerido'),
  unit: z.string().min(1, 'Campo requerido'),
  stock_current: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Debe ser >= 0'),
  stock_min: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Debe ser >= 0'),
});

type MaterialForm = z.infer<typeof schema>;

export default function EditMaterialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: materials = [], isLoading } = useMaterials();
  const { data: movements = [], isLoading: movementsLoading } = useStockMovements(id!);
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();
  const adjustStock = useAdjustStock();
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const material = materials.find((m) => m.id === id);

  const { control, handleSubmit, formState: { errors } } = useForm<MaterialForm>({
    resolver: zodResolver(schema),
    values: material
      ? {
          name: material.name,
          category: material.category,
          unit: material.unit,
          stock_current: String(material.stock_current),
          stock_min: String(material.stock_min),
        }
      : undefined,
  });

  const onSubmit = async (data: MaterialForm) => {
    if (!id) return;
    try {
      await updateMaterial.mutateAsync({
        id,
        name: data.name.trim(),
        category: data.category.trim(),
        unit: data.unit.trim(),
        stock_current: parseFloat(data.stock_current),
        stock_min: parseFloat(data.stock_min),
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const doAdjust = (delta: number) => {
    adjustStock.mutate({ id: id!, delta, note: adjustNote || undefined }, {
      onSuccess: () => { setAdjustDelta(''); setAdjustNote(''); },
    });
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#3b82f6" /></View>;
  }

  if (!material) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#8888aa' }}>Material no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: '#4f7bff' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const inputStyle = (hasError: boolean) => ({
    backgroundColor: '#1c1c2e',
    borderRadius: 12,
    padding: 16,
    color: '#f0f0ff' as const,
    fontSize: 16,
    borderWidth: hasError ? 1 : 0,
    borderColor: '#ef4444',
  });

  const isLow = material.stock_current <= material.stock_min;
  const parsedDelta = parseFloat(adjustDelta);
  const deltaValid = adjustDelta !== '' && !isNaN(parsedDelta) && parsedDelta > 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f1a' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#f0f0ff', fontSize: 22, fontWeight: '700', flex: 1 }}>{material.name}</Text>
          <TouchableOpacity
            onPress={() => {
              const doDelete = () => deleteMaterial.mutate(id!, { onSuccess: () => router.back() });
              if (Platform.OS === 'web') {
                if (window.confirm(`¿Eliminar "${material.name}"?`)) doDelete();
              } else {
                Alert.alert('Eliminar', `¿Eliminar "${material.name}"?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: doDelete },
                ]);
              }
            }}
            style={{ padding: 4 }}
          >
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* ── Stock card ── */}
        <View style={{ backgroundColor: '#1c1c2e', borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' }}>
          <Text style={{ color: '#8888aa', fontSize: 11, letterSpacing: 1 }}>STOCK ACTUAL</Text>
          <Text style={{ fontSize: 52, fontWeight: '900', color: isLow ? '#ef4444' : '#22c55e', marginTop: 4 }}>
            {material.stock_current}
          </Text>
          <Text style={{ color: '#8888aa', fontSize: 13 }}>
            {material.unit} · mínimo {material.stock_min}
            {isLow ? ' ⚠' : ''}
          </Text>
        </View>

        {/* ── Adjust panel ── */}
        <View style={{ backgroundColor: '#1c1c2e', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <Text style={{ color: '#f0f0ff', fontSize: 15, fontWeight: '600', marginBottom: 14 }}>Ajustar stock</Text>

          {/* Quick ±1 */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <TouchableOpacity
              onPress={() => doAdjust(-1)}
              disabled={adjustStock.isPending}
              style={{ flex: 1, backgroundColor: '#ef444420', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
            >
              <Ionicons name="remove-circle-outline" size={20} color="#ef4444" />
              <Text style={{ color: '#f87171', fontWeight: '700', fontSize: 16 }}>-1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => doAdjust(+1)}
              disabled={adjustStock.isPending}
              style={{ flex: 1, backgroundColor: '#34d39920', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#22c55e" />
              <Text style={{ color: '#34d399', fontWeight: '700', fontSize: 16 }}>+1</Text>
            </TouchableOpacity>
          </View>

          {/* Custom quantity */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TextInput
              style={{ flex: 1, backgroundColor: '#0f0f1a', borderRadius: 10, padding: 12, color: '#f0f0ff', fontSize: 16, textAlign: 'center' }}
              placeholder="Cantidad"
              placeholderTextColor="#8888aa"
              keyboardType="numeric"
              value={adjustDelta}
              onChangeText={setAdjustDelta}
            />
          </View>

          {/* Note field */}
          <TextInput
            style={{ backgroundColor: '#0f0f1a', borderRadius: 10, padding: 12, color: '#f0f0ff', fontSize: 14, marginBottom: 10 }}
            placeholder="Nota (ej: usado en columna A, compra proveedor...)"
            placeholderTextColor="#8888aa"
            value={adjustNote}
            onChangeText={setAdjustNote}
          />

          {/* Apply buttons */}
          {deltaValid && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => doAdjust(-parsedDelta)}
                disabled={adjustStock.isPending}
                style={{ flex: 1, backgroundColor: '#ef444430', borderRadius: 10, padding: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#f87171', fontWeight: '700', fontSize: 15 }}>-{parsedDelta}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => doAdjust(+parsedDelta)}
                disabled={adjustStock.isPending}
                style={{ flex: 1, backgroundColor: '#34d39930', borderRadius: 10, padding: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#34d399', fontWeight: '700', fontSize: 15 }}>+{parsedDelta}</Text>
              </TouchableOpacity>
            </View>
          )}

          {adjustStock.isPending && <ActivityIndicator style={{ marginTop: 10 }} color="#3b82f6" />}
        </View>

        {/* ── Movement history ── */}
        <View style={{ backgroundColor: '#1c1c2e', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <Text style={{ color: '#f0f0ff', fontSize: 15, fontWeight: '600', marginBottom: 14 }}>Historial de movimientos</Text>
          {movementsLoading ? (
            <ActivityIndicator color="#3b82f6" />
          ) : movements.length === 0 ? (
            <Text style={{ color: '#8888aa', fontSize: 13, textAlign: 'center', paddingVertical: 8 }}>Sin movimientos aún</Text>
          ) : (
            movements.map((mv) => (
              <View key={mv.id} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#2e2e48' }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: mv.delta >= 0 ? '#34d39920' : '#ef444420',
                  justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2,
                }}>
                  <Ionicons
                    name={mv.delta >= 0 ? 'arrow-up' : 'arrow-down'}
                    size={16}
                    color={mv.delta >= 0 ? '#22c55e' : '#ef4444'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: mv.delta >= 0 ? '#22c55e' : '#ef4444', fontWeight: '700', fontSize: 15 }}>
                      {mv.delta >= 0 ? '+' : ''}{mv.delta} {material.unit}
                    </Text>
                    <Text style={{ color: '#8888aa', fontSize: 12 }}>→ {mv.stock_after}</Text>
                  </View>
                  {mv.note && (
                    <Text style={{ color: '#8888aa', fontSize: 12, marginTop: 2 }}>{mv.note}</Text>
                  )}
                  <Text style={{ color: '#8888aa', fontSize: 11, marginTop: 3 }}>
                    {formatDate(mv.created_at, 'dd MMM yyyy HH:mm')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Edit form ── */}
        <View style={{ backgroundColor: '#1c1c2e', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <Text style={{ color: '#f0f0ff', fontSize: 15, fontWeight: '600', marginBottom: 16 }}>Editar datos</Text>
          <View style={{ gap: 16 }}>
            {[
              { name: 'name' as const, label: 'Nombre', placeholder: 'Cemento gris' },
              { name: 'category' as const, label: 'Categoría', placeholder: 'General' },
              { name: 'unit' as const, label: 'Unidad', placeholder: 'bolsa' },
            ].map((field) => (
              <View key={field.name}>
                <Text style={{ color: '#8888aa', marginBottom: 6, fontSize: 13 }}>{field.label}</Text>
                <Controller
                  control={control}
                  name={field.name}
                  render={({ field: { onChange, value } }) => (
                    <TextInput style={inputStyle(!!errors[field.name])} placeholder={field.placeholder} placeholderTextColor="#8888aa" value={value} onChangeText={onChange} />
                  )}
                />
                {errors[field.name] && <Text style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors[field.name]?.message}</Text>}
              </View>
            ))}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[
                { name: 'stock_current' as const, label: 'Stock actual' },
                { name: 'stock_min' as const, label: 'Stock mínimo' },
              ].map((field) => (
                <View key={field.name} style={{ flex: 1 }}>
                  <Text style={{ color: '#8888aa', marginBottom: 6, fontSize: 13 }}>{field.label}</Text>
                  <Controller
                    control={control}
                    name={field.name}
                    render={({ field: { onChange, value } }) => (
                      <TextInput style={inputStyle(!!errors[field.name])} placeholder="0" placeholderTextColor="#8888aa" keyboardType="numeric" value={value} onChangeText={onChange} />
                    )}
                  />
                  {errors[field.name] && <Text style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors[field.name]?.message}</Text>}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#4f7bff', borderRadius: 14, padding: 16, alignItems: 'center', opacity: updateMaterial.isPending ? 0.7 : 1 }}
              onPress={handleSubmit(onSubmit)}
              disabled={updateMaterial.isPending}
            >
              {updateMaterial.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#f0f0ff', fontWeight: '700', fontSize: 15 }}>Guardar cambios</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


