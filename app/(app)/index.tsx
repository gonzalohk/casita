import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useBalance } from '@/hooks/useBalance';
import { useExpenses } from '@/hooks/useExpenses';
import { useIncome } from '@/hooks/useIncome';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatDate, getPctColor, clamp } from '@/utils/formatters';

// ─── Design tokens ────────────────────────────────────────────
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

function BalanceCard({ total_income, total_expenses, total_payroll, balance, budget, budget_used_pct }: {
  total_income: number;
  total_expenses: number;
  total_payroll: number;
  balance: number;
  budget: number;
  budget_used_pct: number;
}) {
  const pct = clamp(budget_used_pct, 0, 100);
  const barColor = getPctColor(pct);

  return (
    <View style={{
      backgroundColor: C.surface,
      borderRadius: 20,
      padding: 22,
      marginBottom: 24,
    }}>
      {/* Saldo */}
      <Text style={{ color: C.textMuted, fontSize: 11, letterSpacing: 0.5, fontWeight: '500', marginBottom: 6, textAlign: 'center' }}>
        Saldo disponible
      </Text>
      <Text style={{ color: C.accent, fontSize: 34, fontWeight: '800', letterSpacing: -1, marginBottom: 22, textAlign: 'center' }}>
        {formatCurrency(balance)}
      </Text>

      {/* Barra de presupuesto */}
      <View style={{ marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: C.textSecondary, fontSize: 11 }}>Presupuesto ejecutado</Text>
          <Text style={{ color: barColor, fontSize: 11, fontWeight: '700' }}>{pct.toFixed(1)}%</Text>
        </View>
        <View style={{ height: 7, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
          <View style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: 99 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ color: C.textMuted, fontSize: 10 }}>
            Usado: {formatCurrency(total_expenses + total_payroll)}
          </Text>
          <Text style={{ color: C.textMuted, fontSize: 10 }}>
            Presup: {formatCurrency(budget)}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={{
        flexDirection: 'row',
        marginTop: 20,
        paddingTop: 18,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
      }}>
        {[
          { label: 'Ingresos', value: total_income, color: C.green },
          { label: 'Gastos', value: total_expenses, color: C.red },
          { label: 'Planillas', value: total_payroll, color: C.amber },
        ].map((stat) => (
          <View key={stat.label} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: stat.color, fontSize: 15, fontWeight: '700', letterSpacing: -0.3 }}>
              {formatCurrency(stat.value)}
            </Text>
            <Text style={{ color: C.textMuted, fontSize: 10, marginTop: 3 }}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={{ alignItems: 'center', flex: 1, paddingVertical: 8 }}
      onPress={onPress}
      activeOpacity={0.5}
    >
      <Ionicons name={icon} size={26} color={C.textSecondary} style={{ marginBottom: 8 }} />
      <Text style={{ color: C.textMuted, fontSize: 10, textAlign: 'center', letterSpacing: 0.2 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { project } = useProjectStore();
  const { signOut } = useAuthStore();
  const { data: balance, isLoading: loadingBalance, refetch } = useBalance();
  const { data: expenses = [] } = useExpenses();
  const { data: income = [] } = useIncome();

  const recentItems = [
    ...expenses.slice(0, 5).map((e) => ({
      id: e.id,
      type: 'expense' as const,
      label: e.description,
      category: e.expense_categories?.name ?? 'Gasto',
      amount: -e.amount,
      date: e.date,
      color: e.expense_categories?.color ?? '#6b7280',
      icon: (e.expense_categories?.icon ?? 'receipt-outline') as keyof typeof Ionicons.glyphMap,
    })),
    ...income.slice(0, 3).map((i) => ({
      id: i.id,
      type: 'income' as const,
      label: i.description,
      category: 'Ingreso',
      amount: i.amount,
      date: i.date,
      color: C.green,
      icon: 'arrow-down-circle-outline' as keyof typeof Ionicons.glyphMap,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={loadingBalance} onRefresh={refetch} tintColor={C.accent} />
        }
      >
        {/* ── Header ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* Logo */}
            <Image
              source={require('../../assets/images/sunnycolor.png')}
              style={{ width: 44, height: 44, borderRadius: 14 }}
              resizeMode="contain"
            />
            <View>
              <Text style={{ color: C.textMuted, fontSize: 10, letterSpacing: 1.2, fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 }}>
                {new Date().toLocaleDateString('es', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Text style={{ color: C.textPrimary, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 }}>
                {project?.name ?? 'Mi Proyecto'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={signOut}
            style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
              marginTop: 4,
            }}
          >
            <Ionicons name="log-out-outline" size={16} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Balance card ── */}
        {balance ? (
          <BalanceCard {...balance} />
        ) : (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: C.textMuted, fontSize: 12, letterSpacing: 0.5, fontWeight: '500', marginBottom: 4 }}>Saldo disponible</Text>
            <Text style={{ color: C.textSecondary, fontSize: 32, fontWeight: '800' }}>...</Text>
          </View>
        )}

        {/* ── Alertas ── */}
        {balance && balance.balance < balance.budget * 0.1 && balance.balance >= 0 && (
          <View style={{
            backgroundColor: C.amber + '14', borderRadius: 12, padding: 12,
            marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
          }}>
            <Ionicons name="warning-outline" size={18} color={C.amber} />
            <Text style={{ color: C.amber, flex: 1, fontSize: 13 }}>Saldo bajo — menos del 10% del presupuesto</Text>
          </View>
        )}
        {balance && balance.balance < 0 && (
          <View style={{
            backgroundColor: C.red + '14', borderRadius: 12, padding: 12,
            marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
          }}>
            <Ionicons name="alert-circle-outline" size={18} color={C.red} />
            <Text style={{ color: C.red, flex: 1, fontSize: 13 }}>Saldo negativo — registrá una recarga de capital</Text>
          </View>
        )}

        {/* ── Acciones rápidas ── */}
        <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '500', letterSpacing: 0.5, marginBottom: 12 }}>
          Acciones rápidas
        </Text>
        <View style={{
          backgroundColor: C.surface,
          borderRadius: 18,
          paddingVertical: 16,
          paddingHorizontal: 8,
          marginBottom: 24,
        }}>
          {/* Row 1 */}
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <QuickAction
              icon="receipt-outline"
              label="Nuevo gasto"
              onPress={() => router.push('/(app)/expenses/new')}
            />
            <QuickAction
              icon="people-outline"
              label="Pagar obrero"
              onPress={() => router.push('/(app)/payroll/new-payment')}
            />
            <QuickAction
              icon="arrow-down-circle-outline"
              label="Ingreso"
              onPress={() => router.push('/(app)/income/new')}
            />
          </View>
          {/* Row 2 */}
          <View style={{ flexDirection: 'row' }}>
            <QuickAction
              icon="cube-outline"
              label="Materiales"
              onPress={() => router.push('/(app)/inventory/')}
            />
            <QuickAction
              icon="business-outline"
              label="Proveedores"
              onPress={() => router.push('/(app)/suppliers/')}
            />
            <QuickAction
              icon="calendar-outline"
              label="Cronograma"
              onPress={() => router.push('/(app)/schedule/')}
            />
          </View>
        </View>

        {/* ── Movimientos recientes ── */}
        {recentItems.length > 0 && (
          <>
            <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '500', letterSpacing: 0.5, marginBottom: 12 }}>
              Movimientos recientes
            </Text>
            <View style={{ backgroundColor: C.surface, borderRadius: 18, overflow: 'hidden' }}>
              {recentItems.map((item, idx) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderBottomWidth: idx < recentItems.length - 1 ? 1 : 0,
                    borderBottomColor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Icon */}
                  <View style={{
                    width: 38, height: 38, borderRadius: 11,
                    backgroundColor: item.color + '20',
                    justifyContent: 'center', alignItems: 'center', marginRight: 12,
                  }}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  {/* Text */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.textPrimary, fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 1 }}>
                      {item.category} · {formatDate(item.date)}
                    </Text>
                  </View>
                  {/* Amount */}
                  <Text style={{
                    color: item.amount >= 0 ? C.green : C.red,
                    fontWeight: '700',
                    fontSize: 14,
                  }}>
                    {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
