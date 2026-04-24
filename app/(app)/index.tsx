/**
 * index.tsx  —  Dashboard Screen
 *
 * The main home screen of the app. Shows:
 *   1. Project header with date, name and sign-out button
 *   2. BalanceCard — current balance, budget progress bar, income/expense/payroll stats
 *   3. Alert banners — low balance warning or negative balance alert
 *   4. Phases carousel — horizontal scroll of project phases with per-phase cost summary
 *   5. Quick actions grid — shortcuts to the most common operations
 *   6. Recent transactions — last 8 movements (expenses + income)
 *
 * BalanceCard — sub-component that renders the financial overview.
 * QuickAction — sub-component for each grid button.
 */
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useBalance } from '@/hooks/useBalance';
import { useExpenses } from '@/hooks/useExpenses';
import { useIncome } from '@/hooks/useIncome';
import { usePhases } from '@/hooks/usePhases';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateProject } from '@/hooks/useProject';
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
  const { data: phases = [] } = usePhases();
  const updateProject = useUpdateProject();

  // ── Rename modal state ──
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameText, setRenameText] = useState('');

  function openRename() {
    setRenameText(project?.name ?? '');
    setRenameVisible(true);
  }

  async function submitRename() {
    const name = renameText.trim();
    if (!name || !project) return;
    await updateProject.mutateAsync({ id: project.id, name });
    setRenameVisible(false);
  }

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
              {/* Tap the pencil to rename the project */}
              <TouchableOpacity
                onPress={openRename}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                activeOpacity={0.7}
              >
                <Text style={{ color: C.textPrimary, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 }}>
                  {project?.name ?? 'Mi Proyecto'}
                </Text>
                <Ionicons name="create-outline" size={16} color={C.textMuted} />
              </TouchableOpacity>
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

        {/* ── Fases de obra ── */}
        {phases.length > 0 && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '500', letterSpacing: 0.5 }}>
                Fases de obra
              </Text>
              <TouchableOpacity onPress={() => router.push('/(app)/schedule/phases')}>
                <Text style={{ color: C.accent, fontSize: 12 }}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 24 }}
              contentContainerStyle={{ gap: 10, paddingRight: 4 }}
            >
              {phases.map(ph => {
                const phIncome = income.filter(i => i.phase_id === ph.id).reduce((s, i) => s + i.amount, 0);
                const phExpenses = expenses.filter(e => e.phase_id === ph.id).reduce((s, e) => s + e.amount, 0);
                const phBalance = phIncome - phExpenses;
                return (
                  <TouchableOpacity
                    key={ph.id}
                    onPress={() => router.push('/(app)/schedule/phases')}
                    style={{
                      backgroundColor: C.surface,
                      borderRadius: 14,
                      padding: 14,
                      width: 150,
                      borderLeftWidth: 3,
                      borderLeftColor: ph.color,
                    }}
                  >
                    <Text style={{ color: C.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 10 }} numberOfLines={1}>
                      {ph.name}
                    </Text>
                    <Text style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>Gastos</Text>
                    <Text style={{ color: C.red, fontSize: 14, fontWeight: '700', marginBottom: 8 }}>
                      {formatCurrency(phExpenses)}
                    </Text>
                    <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />
                    <Text style={{
                      fontSize: 12, fontWeight: '700',
                      color: phBalance >= 0 ? C.green : C.red,
                    }}>
                      {phBalance >= 0 ? '+' : ''}{formatCurrency(phBalance)}
                    </Text>
                    <Text style={{ color: C.textMuted, fontSize: 10, marginTop: 1 }}>balance</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
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
              icon="layers-outline"
              label="Fases"
              onPress={() => router.push('/(app)/schedule/phases')}
            />
            <QuickAction
              icon="business-outline"
              label="Proveedores"
              onPress={() => router.push('/(app)/suppliers/')}
            />
          </View>
          {/* Row 3 */}
          <View style={{ flexDirection: 'row' }}>
            <QuickAction
              icon="calendar-outline"
              label="Cronograma"
              onPress={() => router.push('/(app)/schedule/')}
            />
            <QuickAction
              icon="people-outline"
              label="Planillas"
              onPress={() => router.push('/(app)/payroll/')}
            />
            <View style={{ flex: 1 }} />
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

      {/* ── Rename project modal ── */}
      <Modal visible={renameVisible} transparent animationType="fade" onRequestClose={() => setRenameVisible(false)}>
        <View style={{
          flex: 1, justifyContent: 'center', alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}>
          <View style={{
            backgroundColor: C.surfaceHigh, borderRadius: 20,
            padding: 24, width: '85%', maxWidth: 380,
          }}>
            <Text style={{ color: C.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
              Renombrar proyecto
            </Text>
            <Text style={{ color: C.textSecondary, fontSize: 13, marginBottom: 18 }}>
              Ingresá el nuevo nombre para tu proyecto.
            </Text>
            <TextInput
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Nombre del proyecto"
              placeholderTextColor={C.textMuted}
              autoFocus
              maxLength={80}
              style={{
                backgroundColor: C.surface, borderRadius: 12,
                borderWidth: 1, borderColor: C.border,
                color: C.textPrimary, fontSize: 16,
                paddingHorizontal: 14, paddingVertical: 12,
                marginBottom: 20,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setRenameVisible(false)}
                style={{
                  flex: 1, paddingVertical: 13, borderRadius: 12,
                  backgroundColor: C.surface,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: C.textSecondary, fontWeight: '600', fontSize: 15 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitRename}
                disabled={!renameText.trim() || updateProject.isPending}
                style={{
                  flex: 1, paddingVertical: 13, borderRadius: 12,
                  backgroundColor: renameText.trim() ? C.accent : C.textMuted + '40',
                  alignItems: 'center',
                }}
              >
                {updateProject.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Guardar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
