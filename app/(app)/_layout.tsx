/**
 * (app)/_layout.tsx  —  Main App Layout (Tab Navigator)
 *
 * Bottom tab bar with 3 visible tabs:
 *   - Gastos (expenses)  — left
 *   - Inicio (dashboard) — center, larger "floating" button with project logo
 *   - Ingresos (income)  — right
 *
 * All other screens (inventory, payroll, suppliers, schedule, etc.) are
 * accessible via navigation but hidden from the tab bar (href: null).
 *
 * On mount it loads the user's project via useProject().
 * If no project exists (first login), redirects to the onboarding screen.
 *
 * TabIcon — renders a filled icon when focused, outline when not.
 *            Also shows a small blue dot below the icon when active.
 */
import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { View, Text, ActivityIndicator, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProject } from '@/hooks/useProject';

// Tab bar design tokens
const TAB_BAR_BG = '#12141c';  // dark background
const TAB_ACTIVE = '#4f7bff';  // blue accent
const TAB_INACTIVE = '#3e4468'; // muted blue-grey
const TAB_BORDER = '#2c3050';   // subtle separator line

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
          height: Platform.OS === 'ios' ? 90 : 72,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ focused }) => <TabIcon name="wallet" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 72, height: 72, borderRadius: 20,
              backgroundColor: TAB_BAR_BG,
              borderWidth: 2,
              borderColor: focused ? TAB_ACTIVE : TAB_BORDER,
              alignItems: 'center', justifyContent: 'center',
              position: 'absolute',
              bottom: Platform.OS === 'ios' ? 10 : 6,
              shadowColor: TAB_ACTIVE,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: focused ? 0.5 : 0.2,
              shadowRadius: 10,
              elevation: 12,
            }}>
              <Image
                source={require('../../assets/images/sunnycolor.png')}
                style={{ width: 52, height: 52, borderRadius: 13, opacity: focused ? 1 : 0.6 }}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: 'Ingresos',
          tabBarIcon: ({ focused }) => <TabIcon name="cash" focused={focused} />,
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="inventory" options={{ href: null }} />
      <Tabs.Screen name="payroll" options={{ href: null }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="suppliers" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
    </Tabs>
  );
}
