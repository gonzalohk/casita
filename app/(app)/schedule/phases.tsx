import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Alert, Modal, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePhases, useCreatePhase, useUpdatePhase, useDeletePhase } from '@/hooks/usePhases';
import { useScheduleTasks } from '@/hooks/useSchedule';
import { useExpenses } from '@/hooks/useExpenses';
import { useIncome } from '@/hooks/useIncome';
import { useMaterials } from '@/hooks/useMaterials';
import { useProjectStore } from '@/stores/projectStore';
import { ProjectPhase } from '@/types/database';
import { formatCurrency } from '@/utils/formatters';

const C = {
  bg: '#0b0e14',
  surface: '#151921',
  surfaceHigh: '#1d2233',
  border: '#1e2535',
  textPrimary: '#eef0f8',
  textSecondary: '#8a94a6',
  textMuted: '#4a5268',
  accent: '#4f7bff',
  error: '#d97070',
};

const COLOR_PRESETS = [
  '#4f7bff', '#2dd68a', '#d97070', '#c98a3e',
  '#a855f7', '#ec4899', '#06b6d4', '#f97316',
];

type EditingPhase = { id?: string; name: string; color: string };

function ColorPicker({ selected, onChange }: { selected: string; onChange: (c: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
      {COLOR_PRESETS.map(color => (
        <TouchableOpacity
          key={color}
          onPress={() => onChange(color)}
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: color,
            borderWidth: selected === color ? 3 : 0,
            borderColor: '#fff',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {selected === color && <Ionicons name="checkmark" size={16} color="#fff" />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function PhasesScreen() {
  const { project } = useProjectStore();
  const { data: phases = [], isPending } = usePhases();
  const { data: tasks = [] } = useScheduleTasks();
  const { data: expenses = [] } = useExpenses();
  const { data: income = [] } = useIncome();
  const { data: materials = [] } = useMaterials();
  const createPhase = useCreatePhase();
  const updatePhase = useUpdatePhase();
  const deletePhase = useDeletePhase();

  const [editModal, setEditModal] = useState<{ open: boolean; phase: EditingPhase }>({
    open: false,
    phase: { name: '', color: COLOR_PRESETS[0] },
  });

  const taskCountByPhase = (phaseId: string) =>
    tasks.filter(t => t.phase_id === phaseId).length;

  const completedCountByPhase = (phaseId: string) => {
    const phaseTasks = tasks.filter(t => t.phase_id === phaseId);
    return phaseTasks.filter(t => t.status === 'completed').length;
  };

  const incomeByPhase = (phaseId: string) =>
    income.filter(i => i.phase_id === phaseId).reduce((s, i) => s + i.amount, 0);

  const expensesByPhase = (phaseId: string) =>
    expenses.filter(e => e.phase_id === phaseId).reduce((s, e) => s + e.amount, 0);

  const materialsByPhase = (phaseId: string) =>
    materials.filter(m => m.phase_id === phaseId).length;

  // Project totals across all phases
  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const openAdd = () => {
    setEditModal({ open: true, phase: { name: '', color: COLOR_PRESETS[0] } });
  };

  const openEdit = (phase: ProjectPhase) => {
    setEditModal({ open: true, phase: { id: phase.id, name: phase.name, color: phase.color } });
  };

  const handleSave = async () => {
    const { id, name, color } = editModal.phase;
    if (!name.trim()) return;
    try {
      if (id) {
        await updatePhase.mutateAsync({ id, name: name.trim(), color });
      } else {
        await createPhase.mutateAsync({
          project_id: project!.id,
          name: name.trim(),
          color,
          sort_order: phases.length,
        });
      }
      setEditModal({ open: false, phase: { name: '', color: COLOR_PRESETS[0] } });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = (phase: ProjectPhase) => {
    const count = taskCountByPhase(phase.id);
    Alert.alert(
      'Eliminar fase',
      count > 0
        ? `"${phase.name}" tiene ${count} tarea${count > 1 ? 's' : ''}. Al eliminarla, las tareas quedarán sin fase asignada.`
        : `¿Eliminar la fase "${phase.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: () => deletePhase.mutate(phase.id),
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
          Fases de obra
        </Text>
        <TouchableOpacity
          onPress={openAdd}
          style={{
            backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 8,
            borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Nueva</Text>
        </TouchableOpacity>
      </View>

      {isPending ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : phases.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Ionicons name="layers-outline" size={48} color={C.textMuted} />
          <Text style={{ color: C.textMuted, marginTop: 12, textAlign: 'center', fontSize: 14 }}>
            {'Aún no hay fases.\nCreá una con el botón +'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={phases}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          ListFooterComponent={phases.length > 0 ? (
            <View style={{
              marginTop: 8, padding: 16, borderRadius: 14,
              backgroundColor: C.surfaceHigh,
              borderWidth: 1, borderColor: C.border,
            }}>
              <Text style={{ color: C.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 12 }}>TOTALES DEL PROYECTO</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: 10, padding: 12 }}>
                  <Text style={{ color: C.textMuted, fontSize: 11, marginBottom: 4 }}>Ingresos</Text>
                  <Text style={{ color: '#2dd68a', fontSize: 16, fontWeight: '700' }}>{formatCurrency(totalIncome)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: 10, padding: 12 }}>
                  <Text style={{ color: C.textMuted, fontSize: 11, marginBottom: 4 }}>Gastos</Text>
                  <Text style={{ color: '#d97070', fontSize: 16, fontWeight: '700' }}>{formatCurrency(totalExpenses)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: 10, padding: 12 }}>
                  <Text style={{ color: C.textMuted, fontSize: 11, marginBottom: 4 }}>Balance</Text>
                  <Text style={{
                    fontSize: 16, fontWeight: '700',
                    color: totalIncome - totalExpenses >= 0 ? '#2dd68a' : '#d97070',
                  }}>
                    {formatCurrency(totalIncome - totalExpenses)}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
          renderItem={({ item: phase }) => {
            const total = taskCountByPhase(phase.id);
            const done = completedCountByPhase(phase.id);
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const phIncome = incomeByPhase(phase.id);
            const phExpenses = expensesByPhase(phase.id);
            const phBalance = phIncome - phExpenses;
            const phMaterials = materialsByPhase(phase.id);

            return (
              <TouchableOpacity
                onPress={() => openEdit(phase)}
                style={{
                  backgroundColor: C.surface,
                  borderRadius: 14, padding: 16,
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  {/* Color dot */}
                  <View style={{
                    width: 14, height: 14, borderRadius: 7,
                    backgroundColor: phase.color, marginRight: 14,
                  }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.textPrimary, fontSize: 16, fontWeight: '600' }}>
                      {phase.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <Text style={{ color: C.textMuted, fontSize: 12 }}>
                        {total} tarea{total !== 1 ? 's' : ''}
                      </Text>
                      {phMaterials > 0 && (
                        <>
                          <Text style={{ color: C.textMuted, fontSize: 12 }}>·</Text>
                          <Text style={{ color: C.textMuted, fontSize: 12 }}>{phMaterials} material{phMaterials !== 1 ? 'es' : ''}</Text>
                        </>
                      )}
                      {total > 0 && (
                        <>
                          <Text style={{ color: C.textMuted, fontSize: 12 }}>·</Text>
                          <Text style={{ color: phase.color, fontSize: 12, fontWeight: '600' }}>{pct}% completado</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity onPress={() => openEdit(phase)} style={{ padding: 8 }}>
                      <Ionicons name="pencil-outline" size={17} color={C.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(phase)} style={{ padding: 8 }}>
                      <Ionicons name="trash-outline" size={17} color={C.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Financial row */}
                {(phIncome > 0 || phExpenses > 0) && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: C.surfaceHigh, borderRadius: 8, padding: 10 }}>
                      <Text style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Ingresos</Text>
                      <Text style={{ color: '#2dd68a', fontSize: 13, fontWeight: '700' }}>{formatCurrency(phIncome)}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: C.surfaceHigh, borderRadius: 8, padding: 10 }}>
                      <Text style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Gastos</Text>
                      <Text style={{ color: '#d97070', fontSize: 13, fontWeight: '700' }}>{formatCurrency(phExpenses)}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: C.surfaceHigh, borderRadius: 8, padding: 10 }}>
                      <Text style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Balance</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: phBalance >= 0 ? '#2dd68a' : '#d97070' }}>
                        {formatCurrency(phBalance)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Progress bar */}
                {total > 0 && (
                  <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 99, marginTop: 10, overflow: 'hidden' }}>
                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: phase.color, borderRadius: 99 }} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal visible={editModal.open} transparent animationType="slide">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setEditModal({ open: false, phase: { name: '', color: COLOR_PRESETS[0] } })}
        >
          <View
            style={{
              backgroundColor: C.surface,
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: 24,
            }}
            // Prevent dismiss when tapping inside
            onStartShouldSetResponder={() => true}
          >
            <Text style={{ color: C.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 16 }}>
              {editModal.phase.id ? 'EDITAR FASE' : 'NUEVA FASE'}
            </Text>

            {/* Name input */}
            <TextInput
              value={editModal.phase.name}
              onChangeText={name => setEditModal(s => ({ ...s, phase: { ...s.phase, name } }))}
              placeholder="Nombre de la fase (ej. Obra Bruta)"
              placeholderTextColor={C.textMuted}
              autoFocus
              style={{
                borderBottomWidth: 1.5, borderBottomColor: C.border,
                paddingVertical: 12, color: C.textPrimary, fontSize: 16,
              }}
            />

            {/* Color picker */}
            <Text style={{ color: C.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '600', marginTop: 20, marginBottom: 4 }}>
              COLOR
            </Text>
            <ColorPicker
              selected={editModal.phase.color}
              onChange={color => setEditModal(s => ({ ...s, phase: { ...s.phase, color } }))}
            />

            {/* Preview */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              marginTop: 20, padding: 12,
              backgroundColor: C.surfaceHigh, borderRadius: 10,
            }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: editModal.phase.color }} />
              <Text style={{ color: C.textPrimary, fontSize: 15, fontWeight: '600' }}>
                {editModal.phase.name || 'Vista previa'}
              </Text>
            </View>

            {/* Save button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!editModal.phase.name.trim()}
              style={{
                backgroundColor: C.accent, borderRadius: 12,
                paddingVertical: 14, alignItems: 'center',
                marginTop: 20,
                opacity: editModal.phase.name.trim() ? 1 : 0.4,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {editModal.phase.id ? 'Guardar cambios' : 'Crear fase'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
