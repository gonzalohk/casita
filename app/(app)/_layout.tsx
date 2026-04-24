import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProject } from '@/hooks/useProject';

const TAB_BAR_BG = '#12141c';
const TAB_ACTIVE = '#4f7bff';
const TAB_INACTIVE = '#3e4468';
const TAB_BORDER = '#2c3050';

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
        size={22}
        color={focused ? TAB_ACTIVE : TAB_INACTIVE}
      />
      {focused && (
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: TAB_ACTIVE, marginTop: 3 }} />
      )}
    </View>
  );
}

export default function AppLayout() {
  const { data: project, isPending } = useProject();

  // If user has no project → onboarding
  useEffect(() => {
    if (!isPending && project === null) {
      router.replace('/(app)/onboarding');
    }
  }, [project, isPending]);

  if (isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f7bff" />
        <Text style={{ color: '#8888aa', marginTop: 12, fontSize: 14 }}>Cargando proyecto...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: TAB_BAR_BG,
          borderTopColor: TAB_BORDER,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 62,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ focused }) => <TabIcon name="wallet" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Materiales',
          tabBarIcon: ({ focused }) => <TabIcon name="cube" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="payroll"
        options={{
          title: 'Obreros',
          tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: 'Ingresos',
          tabBarIcon: ({ focused }) => <TabIcon name="arrow-down-circle" focused={focused} />,
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="onboarding" options={{ href: null }} />
    </Tabs>
  );
}
