import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useScheduleTasks, useUpdateScheduleTask } from '@/hooks/useSchedule';
import { usePhases } from '@/hooks/usePhases';
import { ScheduleTask, TaskStatus } from '@/types/database';
import { formatDate } from '@/utils/formatters';

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
  purple: '#a855f7',
};

const STATUS_META: Record<TaskStatus, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending:     { label: 'Pendiente',    color: C.textMuted, icon: 'time-outline' },
  in_progress: { label: 'En curso',     color: C.accent,    icon: 'play-circle-outline' },
  completed:   { label: 'Completado',   color: C.green,     icon: 'checkmark-circle-outline' },
  delayed:     { label: 'Atrasado',     color: C.red,       icon: 'alert-circle-outline' },
};

function diffDays(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
}

function TaskCard({ task, onPress, onStatusChange }: {
  task: ScheduleTask;
  onPress: () => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  const meta = STATUS_META[task.status];
  const duration = diffDays(task.start_date, task.end_date);
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.status !== 'completed' && task.end_date < today;

  const nextStatus: Partial<Record<TaskStatus, TaskStatus>> = {
    pending: 'in_progress',
    in_progress: 'completed',
    delayed: 'in_progress',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: isOverdue ? C.red : meta.color,
      }}
    >
      {/* Top row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.textPrimary, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
            {task.name}
          </Text>
          <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>{task.phase}</Text>
        </View>
        {/* Status badge */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: meta.color + '18', paddingHorizontal: 8, paddingVertical: 4,
          borderRadius: 8,
        }}>
          <Ionicons name={meta.icon} size={13} color={meta.color} />
          <Text style={{ color: meta.color, fontSize: 11, fontWeight: '600' }}>{meta.label}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ color: C.textMuted, fontSize: 11 }}>Avance</Text>
          <Text style={{ color: task.status === 'completed' ? C.green : C.textSecondary, fontSize: 11, fontWeight: '600' }}>
            {task.progress}%
          </Text>
        </View>
        <View style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
          <View style={{
            width: `${task.progress}%`, height: '100%',
            backgroundColor: task.status === 'completed' ? C.green : meta.color,
            borderRadius: 99,
          }} />
        </View>
      </View>

      {/* Dates + duration */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="calendar-outline" size={13} color={C.textMuted} />
        <Text style={{ color: C.textMuted, fontSize: 12 }}>
          {formatDate(task.start_date, 'dd MMM')} — {formatDate(task.end_date, 'dd MMM yyyy')}
        </Text>
        <Text style={{ color: C.textMuted, fontSize: 12 }}>· {duration} días</Text>
        {isOverdue && (
          <View style={{ marginLeft: 'auto' }}>
            <Text style={{ color: C.red, fontSize: 11, fontWeight: '600' }}>Atrasado</Text>
          </View>
        )}
      </View>

      {/* Quick advance button */}
      {task.status !== 'completed' && nextStatus[task.status] && (
        <TouchableOpacity
          onPress={() => onStatusChange(nextStatus[task.status]!)}
          style={{
            marginTop: 12, paddingVertical: 8, borderRadius: 8,
            backgroundColor: meta.color + '18',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: meta.color, fontSize: 13, fontWeight: '600' }}>
            {task.status === 'pending' ? 'Marcar en curso' : 'Marcar como completado'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

type FilterKey = 'all' | TaskStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'in_progress', label: 'En curso' },
  { key: 'completed', label: 'Completadas' },
  { key: 'delayed', label: 'Atrasadas' },
];

export default function ScheduleIndexScreen() {
  const { data: tasks = [], isPending, refetch } = useScheduleTasks();
  const { data: phases = [] } = usePhases();
  const updateTask = useUpdateScheduleTask();
  const [filter, setFilter] = useState<FilterKey>('all');

  const today = new Date().toISOString().split('T')[0];

  const filtered = tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'delayed') return t.status !== 'completed' && t.end_date < today;
    return t.status === filter;
  });

  // Group tasks: first by DB phase (sort_order), then legacy tasks without phase_id
  const grouped: Array<{ key: string; label: string; color: string; tasks: ScheduleTask[] }> = [];

  const sortedPhases = [...phases].sort((a, b) => a.sort_order - b.sort_order);
  for (const ph of sortedPhases) {
    const phaseTasks = filtered.filter(t => t.phase_id === ph.id);
    if (phaseTasks.length > 0) {
      grouped.push({ key: ph.id, label: ph.name, color: ph.color, tasks: phaseTasks });
    }
  }
  // Legacy tasks (no phase_id) grouped by their text phase
  const unphased = filtered.filter(t => !t.phase_id);
  const legacyPhaseNames = Array.from(new Set(unphased.map(t => t.phase ?? 'Sin fase')));
  for (const name of legacyPhaseNames) {
    grouped.push({
      key: `legacy-${name}`,
      label: name,
      color: C.textMuted,
      tasks: unphased.filter(t => (t.phase ?? 'Sin fase') === name),
    });
  }

  const handleStatusChange = async (task: ScheduleTask, status: TaskStatus) => {
    const progress = status === 'completed' ? 100 : status === 'in_progress' ? Math.max(task.progress, 10) : task.progress;
    await updateTask.mutateAsync({ id: task.id, status, progress });
  };

  // Summary stats
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const overdue = tasks.filter(t => t.status !== 'completed' && t.end_date < today).length;

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
          Cronograma
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/schedule/phases')}
          style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
            marginRight: 4,
          }}
        >
          <Ionicons name="layers-outline" size={18} color={C.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(app)/schedule/new')}
          style={{
            backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 8,
            borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Stats summary */}
      {total > 0 && (
        <View style={{
          marginHorizontal: 20, marginBottom: 16,
          backgroundColor: C.surface, borderRadius: 14,
          flexDirection: 'row',
        }}>
          {[
            { label: 'Total', value: total, color: C.textSecondary },
            { label: 'En curso', value: inProgress, color: C.accent },
            { label: 'Completas', value: completed, color: C.green },
            { label: 'Atrasadas', value: overdue, color: overdue > 0 ? C.red : C.textMuted },
          ].map((s, i) => (
            <View key={s.label} style={{
              flex: 1, alignItems: 'center', paddingVertical: 12,
              borderRightWidth: i < 3 ? 1 : 0,
              borderRightColor: C.border,
            }}>
              <Text style={{ color: s.color, fontSize: 18, fontWeight: '700' }}>{s.value}</Text>
              <Text style={{ color: C.textMuted, fontSize: 10, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Filter chips */}
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

      {/* Tasks list grouped by phase */}
      {isPending ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Ionicons name="calendar-outline" size={48} color={C.textMuted} />
          <Text style={{ color: C.textMuted, marginTop: 12, textAlign: 'center', fontSize: 14 }}>
            {tasks.length === 0
              ? 'Aún no hay tareas.\nAgregá una con el botón +'
              : 'Sin tareas para este filtro'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          onScrollBeginDrag={() => {}}
          refreshControl={undefined}
        >
          {grouped.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ color: C.textMuted, textAlign: 'center', fontSize: 14 }}>
                Sin tareas para este filtro
              </Text>
            </View>
          ) : grouped.map((group) => (
            <View key={group.key}>
              {/* Phase header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                marginBottom: 10, marginTop: 8,
              }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: group.color }} />
                <Text style={{
                  color: C.textSecondary, fontSize: 11, letterSpacing: 1,
                  fontWeight: '700', textTransform: 'uppercase', flex: 1,
                }}>
                  {group.label}
                </Text>
                <Text style={{ color: C.textMuted, fontSize: 11 }}>
                  {group.tasks.filter(t => t.status === 'completed').length}/{group.tasks.length}
                </Text>
              </View>
              {group.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onPress={() => router.push(`/(app)/schedule/${task.id}`)}
                  onStatusChange={(status) => handleStatusChange(task, status)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
