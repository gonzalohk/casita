/**
 * index.tsx  —  Dashboard Screen (redesigned)
 *
 * Layout (top → bottom):
 *   1. Header — project name (editable) + sign-out
 *   2. BalanceWidget — compact saldo + % badge + progress bar + 3 stat pills
 *   3. Smart alert — shown only when burn rate < 15 days / negative balance
 *   4. Phase carousel — cards with visual spend progress bar
 *   5. Secondary actions grid — Materiales, Fases, Proveedores, Cronograma, Planillas
 *   6. Recent transactions
 *   7. Primary FAB row (pinned bottom) — Nuevo gasto | Ingreso | Pagar obrero
 */
import { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useBalance } from '@/hooks/useBalance';
import { useExpenses } from '@/hooks/useExpenses';
import { useIncome } from '@/hooks/useIncome';
import { usePhases } from '@/hooks/usePhases';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateProject } from '@/hooks/useProject';
import { formatCurrency, formatDate, clamp } from '@/utils/formatters';

// ─── Design tokens ─────────────────────────────────────────────────────────
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
  greenSoft: '#2dd68a18',
  red: '#e06060',
  redSoft: '#e0606018',
  amber: '#d4913a',
  amberSoft: '#d4913a18',
  purple: '#a05ceb',
};

// ─── Balance widget ─────────────────────────────────────────────────────────
function BalanceWidget({ total_income, total_expenses, total_payroll, balance, budget, budget_used_pct }: {
  total_income: number; total_expenses: number; total_payroll: number;
  balance: number; budget: number; budget_used_pct: number;
}) {
  const pct = Math.min(Math.max(budget_used_pct, 0), 100);
  const barColor = pct < 60 ? C.green : pct < 85 ? C.amber : C.red;
  const totalSpent = total_expenses + total_payroll;
  return (
    <View style={{ backgroundColor: C.surfaceHigh, borderRadius: 22, padding: 20, marginBottom: 20, borderWidth: 1.5, borderColor: C.accent + '30' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <View>
          <Text style={{ color: C.textMuted, fontSize: 10, letterSpacing: 1.4, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>Saldo disponible</Text>
          <Text style={{ color: balance >= 0 ? C.textPrimary : C.red, fontSize: 32, fontWeight: '800', letterSpacing: -1.5 }}>{formatCurrency(balance)}</Text>
        </View>
        <View style={{ backgroundColor: barColor + '18', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' }}>
          <Text style={{ color: barColor, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}>{Math.round(pct)}%</Text>
          <Text style={{ color: barColor, fontSize: 9, fontWeight: '600', letterSpacing: 0.5 }}>USADO</Text>
        </View>
      </View>
      <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
        <View style={{ width: (pct + '%') as any, height: '100%', backgroundColor: barColor, borderRadius: 99 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
        <Text style={{ color: C.textMuted, fontSize: 10 }}>Ejecutado {formatCurrency(totalSpent)}</Text>
        <Text style={{ color: C.textMuted, fontSize: 10 }}>Presup. {formatCurrency(budget)}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { label: 'Ingresos', value: total_income,   bg: C.greenSoft, color: C.green },
          { label: 'Gastos',   value: total_expenses, bg: C.redSoft,   color: C.red   },
          { label: 'Planilla', value: total_payroll,  bg: C.amberSoft, color: C.amber },
        ].map(s => (
          <View key={s.label} style={{ flex: 1, backgroundColor: s.bg, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center' }}>
            <Text style={{ color: s.color, fontSize: 13, fontWeight: '700', letterSpacing: -0.3 }}>{formatCurrency(s.value)}</Text>
            <Text style={{ color: s.color + 'aa', fontSize: 9, fontWeight: '600', marginTop: 2, letterSpacing: 0.4 }}>{s.label.toUpperCase()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Secondary action button ────────────────────────────────────────────────
function SecondaryAction({ icon, label, onPress, color = C.textSecondary }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color?: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6}
      style={{ alignItems: 'center', flex: 1, backgroundColor: C.surface, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: C.border }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: color + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ color: C.textSecondary, fontSize: 10, fontWeight: '600', textAlign: 'center', letterSpacing: 0.2 }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { project } = useProjectStore();
  const { signOut } = useAuthStore();
  const { data: balance, isLoading: loadingBalance, refetch } = useBalance();
  const { data: expenses = [] } = useExpenses();
  const { data: income = [] } = useIncome();
  const { data: phases = [] } = usePhases();
  const updateProject = useUpdateProject();

  const [renameVisible, setRenameVisible] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  const [burnAlertVisible, setBurnAlertVisible] = useState(false);
  const [negAlertVisible, setNegAlertVisible] = useState(false);
  const [renameText, setRenameText] = useState('');

  function openRename() { setRenameText(project?.name ?? ''); setRenameVisible(true); }
  async function submitRename() {
    const name = renameText.trim();
    if (!name || !project) return;
    await updateProject.mutateAsync({ id: project.id, name });
    setRenameVisible(false);
  }

  const showBurnAlert = useMemo(() => {
    if (!balance || balance.balance <= 0) return false;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const iso = cutoff.toISOString().split('T')[0];
    const recentSpend = expenses.filter(e => e.date >= iso).reduce((s, e) => s + e.amount, 0);
    const avgDaily = recentSpend / 30;
    return avgDaily > 0 && balance.balance / avgDaily < 15;
  }, [balance, expenses]);

  useEffect(() => {
    if (showBurnAlert) {
      setBurnAlertVisible(true);
      const t = setTimeout(() => setBurnAlertVisible(false), 6000);
      return () => clearTimeout(t);
    }
  }, [showBurnAlert]);

  useEffect(() => {
    if (balance && balance.balance < 0) {
      setNegAlertVisible(true);
      const t = setTimeout(() => setNegAlertVisible(false), 6000);
      return () => clearTimeout(t);
    }
  }, [balance?.balance]);

  const recentItems = useMemo(() => [
    ...expenses.slice(0, 5).map(e => ({
      id: e.id, label: e.description,
      category: e.expense_categories?.name ?? 'Gasto',
      amount: -e.amount, date: e.date,
      color: e.expense_categories?.color ?? '#6b7280',
      icon: (e.expense_categories?.icon ?? 'receipt-outline') as keyof typeof Ionicons.glyphMap,
    })),
    ...income.slice(0, 3).map(i => ({
      id: i.id, label: i.description,
      category: 'Ingreso', amount: i.amount, date: i.date,
      color: C.green,
      icon: 'arrow-down-circle-outline' as keyof typeof Ionicons.glyphMap,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8), [expenses, income]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={loadingBalance} onRefresh={refetch} tintColor={C.accent} />}
      >
        {/* Header */}
        <View style={{ marginBottom: 28, alignItems: 'center' }}>
          <Image
            source={require('../../assets/images/sunnycolor.png')}
            style={{ width: 72, height: 72, borderRadius: 20, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
            PROYECTO
          </Text>
          <TouchableOpacity onPress={openRename} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} activeOpacity={0.7}>
            <Text style={{ color: '#ffffff', fontSize: 32, fontWeight: '800', letterSpacing: -1, lineHeight: 36, textAlign: 'center' }}>
              {project?.name ?? 'Mi Proyecto'}
            </Text>
            <Ionicons name="create-outline" size={18} color={C.textMuted} style={{ marginTop: 4 }} />
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: '#4e5872', marginTop: 20, width: '100%' }} />
        </View>

        {/* Logout FAB */}
        <TouchableOpacity
          onPress={signOut}
          style={{
            position: 'absolute', top: 56, right: 20,
            width: 34, height: 34, borderRadius: 10,
            backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
            borderWidth: 1, borderColor: C.border,
            zIndex: 10,
          }}
        >
          <Ionicons name="log-out-outline" size={15} color={C.textMuted} />
        </TouchableOpacity>

        {/* Balance widget */}
        {balance
          ? <BalanceWidget {...balance} />
          : <View style={{ backgroundColor: C.surface, borderRadius: 22, padding: 20, marginBottom: 20, height: 160, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={C.accent} />
            </View>
        }

        {/* Smart alerts */}
        {burnAlertVisible && (
          <View style={{ backgroundColor: C.amberSoft, borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.amber + '40' }}>
            <Ionicons name="trending-down-outline" size={22} color={C.amber} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.amber, fontSize: 13, fontWeight: '700', marginBottom: 2 }}>Ritmo de gasto elevado</Text>
              <Text style={{ color: C.amber + 'bb', fontSize: 12 }}>Al ritmo actual, el saldo alcanza menos de 15 días</Text>
            </View>
          </View>
        )}
        {negAlertVisible && (
          <View style={{ backgroundColor: C.redSoft, borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.red + '40' }}>
            <Ionicons name="alert-circle-outline" size={22} color={C.red} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.red, fontSize: 13, fontWeight: '700', marginBottom: 2 }}>Saldo negativo</Text>
              <Text style={{ color: C.red + 'bb', fontSize: 12 }}>Registrá un ingreso para cubrir el déficit</Text>
            </View>
          </View>
        )}

        {/* Secondary actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: C.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Más acciones</Text>
          <TouchableOpacity onPress={() => setShowAllActions(v => !v)}>
            <Text style={{ color: C.accent, fontSize: 12, fontWeight: '600' }}>{showAllActions ? 'Mostrar menos ↑' : 'Mostrar todas →'}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: showAllActions ? 8 : 24 }}>
          <SecondaryAction icon="cube-outline"     label="Materiales"  onPress={() => router.push('/(app)/inventory/')}  color={C.accent} />
          <SecondaryAction icon="calendar-outline" label="Cronograma"  onPress={() => router.push('/(app)/schedule/')}   color={C.green}  />
          <SecondaryAction icon="business-outline" label="Proveedores" onPress={() => router.push('/(app)/suppliers/')} color={C.amber}  />
        </View>
        {showAllActions && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
            <SecondaryAction icon="layers-outline" label="Fases"   onPress={() => router.push('/(app)/schedule/phases')} color={C.purple}        />
            <SecondaryAction icon="people-outline" label="Obreros" onPress={() => router.push('/(app)/payroll/')}        color={C.textSecondary} />
            <View style={{ flex: 1 }} />
          </View>
        )}

        {/* Fases de obra — solo enlace */}
        {phases.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <Text style={{ color: C.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Fases de obra</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/schedule/phases')}>
              <Text style={{ color: C.accent, fontSize: 12, fontWeight: '600' }}>Ver todas →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent transactions */}
        {recentItems.length > 0 && (
          <>
            <Text style={{ color: C.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Últimos movimientos</Text>
            <View style={{ backgroundColor: C.surface, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border }}>
              {recentItems.map((item, idx) => (
                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderBottomWidth: idx < recentItems.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: item.color + '22', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 }}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.textPrimary, fontSize: 14, fontWeight: '600' }}>{item.label}</Text>
                    <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{item.category} · {formatDate(item.date)}</Text>
                  </View>
                  <Text style={{ color: item.amount >= 0 ? C.green : C.red, fontWeight: '700', fontSize: 14, marginTop: 2, marginLeft: 8 }}>
                    {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Primary FAB row — pinned to thumb zone */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity onPress={() => router.push('/(app)/expenses/')} activeOpacity={0.8}
          style={{ flex: 2, backgroundColor: C.accent, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="wallet-outline" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Gastos</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(app)/income/')} activeOpacity={0.8}
          style={{ flex: 1, backgroundColor: C.greenSoft, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.green + '60' }}>
          <Ionicons name="cash-outline" size={22} color={C.green} />
          <Text style={{ color: C.green, fontWeight: '700', fontSize: 11, marginTop: 3 }}>Ingresos</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(app)/payroll/payments')} activeOpacity={0.8}
          style={{ flex: 1, backgroundColor: C.amberSoft, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.amber + '60' }}>
          <Ionicons name="people-outline" size={22} color={C.amber} />
          <Text style={{ color: C.amber, fontWeight: '700', fontSize: 11, marginTop: 3 }}>Planilla</Text>
        </TouchableOpacity>
      </View>

      {/* Rename project modal */}
      <Modal visible={renameVisible} transparent animationType="fade" onRequestClose={() => setRenameVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View style={{ backgroundColor: C.surfaceHigh, borderRadius: 20, padding: 24, width: '85%', maxWidth: 380 }}>
            <Text style={{ color: C.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 6 }}>Renombrar proyecto</Text>
            <Text style={{ color: C.textSecondary, fontSize: 13, marginBottom: 18 }}>Ingresá el nuevo nombre para tu proyecto.</Text>
            <TextInput
              value={renameText} onChangeText={setRenameText}
              placeholder="Nombre del proyecto" placeholderTextColor={C.textMuted}
              autoFocus maxLength={80}
              style={{ backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, color: C.textPrimary, fontSize: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setRenameVisible(false)} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: C.surface, alignItems: 'center' }}>
                <Text style={{ color: C.textSecondary, fontWeight: '600', fontSize: 15 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitRename} disabled={!renameText.trim() || updateProject.isPending}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: renameText.trim() ? C.accent : C.textMuted + '40', alignItems: 'center' }}>
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
