/**
 * reports/index.tsx  —  Reports Screen
 *
 * Generates and shares PDF reports for the project.
 * Available reports:
 *   - Planilla de pagos: all payroll entries with full detail
 */
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { usePayroll } from '@/hooks/useWorkers';
import { useExpenses } from '@/hooks/useExpenses';
import { useProjectStore } from '@/stores/projectStore';
import { PayrollEntry, Expense } from '@/types/database';
import { formatCurrency, formatDate } from '@/utils/formatters';

const C = {
  bg: '#080b11',
  surface: '#111520',
  surfaceHigh: '#1a1f2e',
  border: '#1e2535',
  textPrimary: '#f0f2fa',
  textSecondary: '#9aa3ba',
  textMuted: '#6b7591',
  accent: '#4f7bff',
  purple: '#a05ceb',
  green: '#2dd68a',
  amber: '#d4913a',
};

function buildPayrollHTML(entries: PayrollEntry[], projectName: string): string {
  const total = entries.reduce((s, e) => s + e.amount, 0);
  const now = new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });
  const uniqueWorkers = new Set(entries.map(e => e.worker_id)).size;

  const rows = entries.map((e, i) => `
    <tr style="background:${i % 2 === 0 ? '#f7f8fa' : '#ffffff'}">
      <td style="text-align:center">${i + 1}</td>
      <td><b>${e.workers?.name ?? '-'}</b></td>
      <td>${e.workers?.role ?? '-'}</td>
      <td>${formatDate(e.period_start)}</td>
      <td>${formatDate(e.period_end)}</td>
      <td style="text-align:center">${e.days_worked}</td>
      <td style="text-align:right"><b>Bs ${e.amount.toFixed(2)}</b></td>
      <td>${formatDate(e.date_paid)}</td>
      <td style="color:#555;font-size:10px">${e.notes ?? ''}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <style>
    @page { size: A4 landscape; margin: 20mm 15mm; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; }

    /* Header block */
    .doc-header { border-bottom: 3px solid #1a1a2e; padding-bottom: 10px; margin-bottom: 14px; }
    .doc-title { font-size: 20px; font-weight: 900; color: #1a1a2e; margin: 0 0 2px 0; }
    .doc-sub { font-size: 11px; color: #555; margin: 0; }

    /* Summary row */
    .summary { border: 1px solid #dde2ea; border-radius: 4px;
               margin-bottom: 16px; }
    .summary table { width: 100%; border-collapse: collapse; }
    .summary td { padding: 8px 14px; border-right: 1px solid #dde2ea; }
    .summary td:last-child { border-right: none; }
    .s-label { font-size: 9px; font-weight: 700; color: #888;
               text-transform: uppercase; letter-spacing: 0.6px; display: block; margin-bottom: 2px; }
    .s-value { font-size: 15px; font-weight: 800; color: #1a1a2e; }

    /* Data table */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table thead tr { background: #1a1a2e; }
    .data-table thead th {
      color: #fff; padding: 8px 7px; text-align: left;
      font-size: 10px; font-weight: 700; letter-spacing: 0.4px;
      border-right: 1px solid #2e3a4e;
    }
    .data-table thead th:last-child { border-right: none; }
    .data-table tbody td {
      padding: 7px 7px; border-bottom: 1px solid #e2e6ed;
      border-right: 1px solid #e2e6ed; vertical-align: middle;
    }
    .data-table tbody td:last-child { border-right: none; }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .data-table tfoot tr { background: #1a1a2e; }
    .data-table tfoot td {
      color: #fff; padding: 8px 7px; font-weight: 700;
      font-size: 11px; border-right: 1px solid #2e3a4e;
    }
    .data-table tfoot td:last-child { border-right: none; }

    .footer { margin-top: 16px; font-size: 9px; color: #aaa; text-align: center; }
  </style>
</head>
<body>

  <div class="doc-header">
    <p class="doc-title">${projectName} &mdash; Planilla de Pagos</p>
    <p class="doc-sub">Generado el ${now}</p>
  </div>

  <div class="summary">
    <table>
      <tr>
        <td><span class="s-label">Total de registros</span><span class="s-value">${entries.length}</span></td>
        <td><span class="s-label">Obreros</span><span class="s-value">${uniqueWorkers}</span></td>
        <td><span class="s-label">Total pagado</span><span class="s-value">Bs ${total.toFixed(2)}</span></td>
        <td><span class="s-label">Documento</span><span class="s-value" style="font-size:11px;font-weight:600">Planilla &mdash; ${now}</span></td>
      </tr>
    </table>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width:28px">#</th>
        <th>Obrero</th>
        <th>Rol / Cargo</th>
        <th>Inicio período</th>
        <th>Fin período</th>
        <th style="text-align:center;width:40px">Días</th>
        <th style="text-align:right">Monto (Bs)</th>
        <th>Fecha de pago</th>
        <th>Notas / Observaciones</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="9" style="text-align:center;padding:20px;color:#999">Sin registros de pago</td></tr>'}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="6" style="text-align:right">TOTAL PAGADO</td>
        <td style="text-align:right">Bs ${total.toFixed(2)}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>

  <p class="footer">Casita Construcci&oacute;n &nbsp;&bull;&nbsp; ${projectName} &nbsp;&bull;&nbsp; ${now}</p>

</body>
</html>`;
}

function buildExpensesHTML(entries: Expense[], projectName: string): string {
  const total = entries.reduce((s, e) => s + e.amount, 0);
  const now = new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });
  const uniqueCategories = new Set(entries.map(e => e.expense_categories?.name ?? 'Sin categoría')).size;

  const rows = entries.map((e, i) => {
    const hasMaterials = e.unit_price != null && e.quantity != null;
    const qty = e.quantity != null ? (e.quantity % 1 === 0 ? e.quantity.toFixed(0) : e.quantity.toFixed(3)) : '-';
    const up = e.unit_price != null ? `Bs ${e.unit_price.toFixed(2)}` : '-';
    return `
    <tr style="background:${i % 2 === 0 ? '#f7f8fa' : '#ffffff'}">
      <td style="text-align:center">${i + 1}</td>
      <td><b>${e.description}</b></td>
      <td>${e.expense_categories?.name ?? 'Sin categoría'}</td>
      <td>${formatDate(e.date)}</td>
      <td style="text-align:center">${hasMaterials ? qty : '-'}</td>
      <td style="text-align:right">${hasMaterials ? up : '-'}</td>
      <td style="text-align:right"><b>Bs ${e.amount.toFixed(2)}</b></td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <style>
    @page { size: A4 landscape; margin: 20mm 15mm; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; }
    .doc-header { border-bottom: 3px solid #1a1a2e; padding-bottom: 10px; margin-bottom: 14px; }
    .doc-title { font-size: 20px; font-weight: 900; color: #1a1a2e; margin: 0 0 2px 0; }
    .doc-sub { font-size: 11px; color: #555; margin: 0; }
    .summary { border: 1px solid #dde2ea; border-radius: 4px; margin-bottom: 16px; }
    .summary table { width: 100%; border-collapse: collapse; }
    .summary td { padding: 8px 14px; border-right: 1px solid #dde2ea; }
    .summary td:last-child { border-right: none; }
    .s-label { font-size: 9px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.6px; display: block; margin-bottom: 2px; }
    .s-value { font-size: 15px; font-weight: 800; color: #1a1a2e; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table thead tr { background: #1a1a2e; }
    .data-table thead th { color: #fff; padding: 8px 7px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.4px; border-right: 1px solid #2e3a4e; }
    .data-table thead th:last-child { border-right: none; }
    .data-table tbody td { padding: 7px 7px; border-bottom: 1px solid #e2e6ed; border-right: 1px solid #e2e6ed; vertical-align: middle; }
    .data-table tbody td:last-child { border-right: none; }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .data-table tfoot tr { background: #1a1a2e; }
    .data-table tfoot td { color: #fff; padding: 8px 7px; font-weight: 700; font-size: 11px; border-right: 1px solid #2e3a4e; }
    .data-table tfoot td:last-child { border-right: none; }
    .footer { margin-top: 16px; font-size: 9px; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <div class="doc-header">
    <p class="doc-title">${projectName} &mdash; Reporte de Gastos</p>
    <p class="doc-sub">Generado el ${now}</p>
  </div>
  <div class="summary">
    <table>
      <tr>
        <td><span class="s-label">Total de registros</span><span class="s-value">${entries.length}</span></td>
        <td><span class="s-label">Categorías</span><span class="s-value">${uniqueCategories}</span></td>
        <td><span class="s-label">Total gastado</span><span class="s-value">Bs ${total.toFixed(2)}</span></td>
        <td><span class="s-label">Documento</span><span class="s-value" style="font-size:11px;font-weight:600">Gastos &mdash; ${now}</span></td>
      </tr>
    </table>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:28px">#</th>
        <th>Descripción</th>
        <th>Categoría</th>
        <th>Fecha</th>
        <th style="text-align:center;width:50px">Cantidad</th>
        <th style="text-align:right">Precio unit.</th>
        <th style="text-align:right">Monto (Bs)</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999">Sin registros de gastos</td></tr>'}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="6" style="text-align:right">TOTAL GASTADO</td>
        <td style="text-align:right">Bs ${total.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
  <p class="footer">Casita Construcci&oacute;n &nbsp;&bull;&nbsp; ${projectName} &nbsp;&bull;&nbsp; ${now}</p>
</body>
</html>`;
}

export default function ReportsScreen() {
  const { project } = useProjectStore();
  const { data: payrollEntries = [], isLoading } = usePayroll();
  const { data: expenseEntries = [], isLoading: isLoadingExpenses } = useExpenses();
  const [generating, setGenerating] = useState(false);
  const [generatingExpenses, setGeneratingExpenses] = useState(false);

  async function handlePayrollPDF() {
    if (generating) return;
    setGenerating(true);
    try {
      const html = buildPayrollHTML(payrollEntries, project?.name ?? 'Mi Proyecto');

      if (Platform.OS === 'web') {
        // En web: abrir HTML en nueva ventana y disparar diálogo de impresión/guardar PDF
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 500);
        }
      } else {
        // En iOS / Android: generar archivo PDF y compartir
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Exportar planilla de pagos',
            UTI: 'com.adobe.pdf',
          });
        }
      }
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleExpensesPDF() {
    if (generatingExpenses) return;
    setGeneratingExpenses(true);
    try {
      const html = buildExpensesHTML(expenseEntries, project?.name ?? 'Mi Proyecto');
      if (Platform.OS === 'web') {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 500);
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Exportar reporte de gastos',
            UTI: 'com.adobe.pdf',
          });
        }
      }
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setGeneratingExpenses(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 120 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface,
              justifyContent: 'center', alignItems: 'center' }}
          >
            <Ionicons name="chevron-back" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
              textTransform: 'uppercase', marginBottom: 2 }}>
              {project?.name ?? 'Mi Proyecto'}
            </Text>
            <Text style={{ color: C.textPrimary, fontSize: 22, fontWeight: '800' }}>Reportes</Text>
          </View>
        </View>

        {/* Section label */}
        <Text style={{ color: C.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1,
          textTransform: 'uppercase', marginBottom: 12 }}>
          Exportar PDF
        </Text>

        {/* Payroll report card */}
        <TouchableOpacity
          onPress={handlePayrollPDF}
          disabled={generating || isLoading}
          activeOpacity={0.75}
          style={{ backgroundColor: C.surfaceHigh, borderRadius: 18, padding: 20,
            borderWidth: 1, borderColor: C.border, marginBottom: 12,
            opacity: generating ? 0.6 : 1 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14,
              backgroundColor: C.amber + '20', justifyContent: 'center', alignItems: 'center' }}>
              {generating
                ? <ActivityIndicator color={C.amber} size="small" />
                : <Ionicons name="people-outline" size={24} color={C.amber} />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 3 }}>
                Planilla de pagos
              </Text>
              <Text style={{ color: C.textMuted, fontSize: 12 }}>
                {isLoading ? 'Cargando...' : `${payrollEntries.length} registro${payrollEntries.length !== 1 ? 's' : ''} · Todos los campos`}
              </Text>
            </View>
            <Ionicons name="download-outline" size={20} color={C.textMuted} />
          </View>

          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border }}>
            <Text style={{ color: C.textMuted, fontSize: 11, lineHeight: 17 }}>
              Incluye: obrero, rol, período, días trabajados, monto, fecha de pago y notas.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Expenses report card */}
        <TouchableOpacity
          onPress={handleExpensesPDF}
          disabled={generatingExpenses || isLoadingExpenses}
          activeOpacity={0.75}
          style={{ backgroundColor: C.surfaceHigh, borderRadius: 18, padding: 20,
            borderWidth: 1, borderColor: C.border,
            opacity: generatingExpenses ? 0.6 : 1 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14,
              backgroundColor: C.accent + '20', justifyContent: 'center', alignItems: 'center' }}>
              {generatingExpenses
                ? <ActivityIndicator color={C.accent} size="small" />
                : <Ionicons name="receipt-outline" size={24} color={C.accent} />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 3 }}>
                Reporte de gastos
              </Text>
              <Text style={{ color: C.textMuted, fontSize: 12 }}>
                {isLoadingExpenses ? 'Cargando...' : `${expenseEntries.length} registro${expenseEntries.length !== 1 ? 's' : ''} · Todos los campos`}
              </Text>
            </View>
            <Ionicons name="download-outline" size={20} color={C.textMuted} />
          </View>
          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border }}>
            <Text style={{ color: C.textMuted, fontSize: 11, lineHeight: 17 }}>
              Incluye: descripción, categoría, fecha, cantidad, precio unitario y monto.
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Home FAB */}
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.85}
        style={{ position: 'absolute', bottom: 32, alignSelf: 'center',
          backgroundColor: '#1a1d27', borderRadius: 50, width: 56, height: 56,
          justifyContent: 'center', alignItems: 'center',
          borderWidth: 1.5, borderColor: '#2c3050',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4, shadowRadius: 8, elevation: 10 }}
      >
        <Ionicons name="home-outline" size={24} color="#8888aa" />
      </TouchableOpacity>
    </View>
  );
}
