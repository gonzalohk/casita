/**
 * project-picker.tsx  —  Project Selection Screen
 *
 * Shown on every app launch (when no project is active in the store).
 * Lists all user projects and lets them select one or create a new one.
 */
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProjects } from '@/hooks/useProject';
import { useProjectStore } from '@/stores/projectStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Project } from '@/types/database';

const C = {
  bg: '#080b11',
  surface: '#111520',
  surfaceHigh: '#1a1f2e',
  border: '#1e2535',
  textPrimary: '#f0f2fa',
  textSecondary: '#9aa3ba',
  textMuted: '#6b7591',
  accent: '#4f7bff',
  green: '#2dd68a',
  amber: '#d4913a',
  red: '#e06060',
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:    { label: 'Activo',     color: C.green },
  paused:    { label: 'Pausado',    color: C.amber },
  completed: { label: 'Completado', color: C.textMuted },
};

function ProjectCard({ project, onSelect }: { project: Project; onSelect: () => void }) {
  const status = STATUS_LABEL[project.status] ?? STATUS_LABEL.active;
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.8}
      style={{
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ color: C.textPrimary, fontSize: 17, fontWeight: '700' }} numberOfLines={1}>
            {project.name}
          </Text>
          {project.description ? (
            <Text style={{ color: C.textMuted, fontSize: 13, marginTop: 3 }} numberOfLines={2}>
              {project.description}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
            <View>
              <Text style={{ color: C.textMuted, fontSize: 10, letterSpacing: 0.8 }}>PRESUPUESTO</Text>
              <Text style={{ color: C.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 2 }}>
                {formatCurrency(project.total_budget)}
              </Text>
            </View>
            <View>
              <Text style={{ color: C.textMuted, fontSize: 10, letterSpacing: 0.8 }}>INICIO</Text>
              <Text style={{ color: C.textSecondary, fontSize: 13, marginTop: 2 }}>
                {formatDate(project.start_date)}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 10 }}>
          <View style={{
            backgroundColor: status.color + '20',
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}>
            <Text style={{ color: status.color, fontSize: 11, fontWeight: '600' }}>
              {status.label}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ProjectPickerScreen() {
  const { data: projects = [], isPending } = useProjects();
  const { setProject } = useProjectStore();

  function handleSelect(project: Project) {
    setProject(project);
    router.replace('/(app)' as any);
  }

  function handleNew() {
    router.push('/(app)/onboarding' as any);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 16 }}>
        <Text style={{ color: C.textPrimary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
          Mis proyectos
        </Text>
        <Text style={{ color: C.textMuted, fontSize: 14, marginTop: 6 }}>
          Seleccioná un proyecto para continuar
        </Text>
      </View>

      {isPending ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : projects.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Ionicons name="construct-outline" size={52} color={C.border} />
          <Text style={{ color: C.textSecondary, fontSize: 17, fontWeight: '600', marginTop: 20, textAlign: 'center' }}>
            Todavía no tenés proyectos
          </Text>
          <Text style={{ color: C.textMuted, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
            Creá tu primer proyecto para empezar a gestionar tu construcción
          </Text>
          <TouchableOpacity
            onPress={handleNew}
            activeOpacity={0.85}
            style={{
              marginTop: 32,
              backgroundColor: C.accent,
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 28,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Crear proyecto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <ProjectCard project={item} onSelect={() => handleSelect(item)} />
          )}
        />
      )}

      {/* FAB: Nuevo proyecto */}
      {!isPending && projects.length > 0 && (
        <TouchableOpacity
          onPress={handleNew}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            bottom: 40,
            right: 28,
            backgroundColor: C.accent,
            borderRadius: 50,
            paddingHorizontal: 20,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            shadowColor: C.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Nuevo proyecto</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
