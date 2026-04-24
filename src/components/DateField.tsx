import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg: '#12141c',
  surface: '#1a1d27',
  border: '#2c3050',
  text: '#f0f0ff' as const,
  muted: '#7880a0',
  accent: '#4f7bff',
  error: '#f07070',
  today: '#4f7bff30',
};

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const WEEKDAYS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  // Monday-first: (Sun=0 → 6, Mon=1 → 0, …)
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

function parseISO(iso: string) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function formatDisplay(iso: string) {
  const p = parseISO(iso);
  if (!p) return 'Seleccionar fecha';
  return `${String(p.day).padStart(2, '0')}/${String(p.month + 1).padStart(2, '0')}/${p.year}`;
}

interface DateFieldProps {
  label: string;
  value: string;           // YYYY-MM-DD
  onChange: (v: string) => void;
  hasError?: boolean;
  errorMessage?: string;
}

export function DateField({ label, value, onChange, hasError, errorMessage }: DateFieldProps) {
  const today = new Date();
  const parsed = parseISO(value);

  const [open, setOpen] = useState(false);
  const [navYear, setNavYear] = useState(parsed?.year ?? today.getFullYear());
  const [navMonth, setNavMonth] = useState(parsed?.month ?? today.getMonth());

  const borderColor = hasError ? C.error : C.border;

  // ─── Web: native HTML date input ─────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <View>
        <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>{label}</Text>
        <View style={{ borderBottomWidth: 1.5, borderBottomColor: borderColor, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={16} color={C.muted} style={{ marginRight: 8, paddingTop: 12, paddingBottom: 12 }} />
          {/* @ts-ignore – web-only input */}
          <input
            type="date"
            value={value}
            onChange={(e: any) => onChange(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: value ? '#f0f0ff' : '#2c3050',
              fontSize: 16,
              paddingTop: 12,
              paddingBottom: 12,
              colorScheme: 'dark',
              width: '100%',
            }}
          />
        </View>
        {hasError && errorMessage && (
          <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errorMessage}</Text>
        )}
      </View>
    );
  }

  // ─── Native: tappable field + calendar modal ─────────────────
  const daysInMonth = getDaysInMonth(navYear, navMonth);
  const firstDay = getFirstDayOfMonth(navYear, navMonth);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pickDay = (day: number) => {
    const mm = String(navMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${navYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const prevMonth = () => {
    if (navMonth === 0) { setNavMonth(11); setNavYear(y => y - 1); }
    else setNavMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (navMonth === 11) { setNavMonth(0); setNavYear(y => y + 1); }
    else setNavMonth(m => m + 1);
  };

  return (
    <>
      <View>
        <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>{label}</Text>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1.5, borderBottomColor: borderColor, paddingVertical: 12 }}
          onPress={() => setOpen(true)}
        >
          <Text style={{ color: value ? C.text : C.border, fontSize: 16 }}>{formatDisplay(value)}</Text>
          <Ionicons name="calendar-outline" size={18} color={C.muted} />
        </TouchableOpacity>
        {hasError && errorMessage && (
          <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errorMessage}</Text>
        )}
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View
            style={{ backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 36 }}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ color: C.text, fontWeight: '600', fontSize: 16 }}>Seleccionar fecha</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Month/Year navigation */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}>
              <TouchableOpacity onPress={prevMonth} style={{ padding: 4 }}>
                <Ionicons name="chevron-back" size={22} color={C.muted} />
              </TouchableOpacity>
              <Text style={{ color: C.text, fontWeight: '600', fontSize: 16 }}>
                {MONTHS[navMonth]} {navYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={{ padding: 4 }}>
                <Ionicons name="chevron-forward" size={22} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Weekday headers */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 }}>
              {WEEKDAYS.map(d => (
                <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: C.muted, fontSize: 11, fontWeight: '600' }}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Days grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 }}>
              {cells.map((day, i) => {
                const isSelected = parsed && day === parsed.day && navMonth === parsed.month && navYear === parsed.year;
                const isToday = day === today.getDate() && navMonth === today.getMonth() && navYear === today.getFullYear();
                return (
                  <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 3 }}>
                    {day ? (
                      <TouchableOpacity
                        onPress={() => pickDay(day)}
                        style={{
                          width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999,
                          backgroundColor: isSelected ? C.accent : isToday ? C.today : 'transparent',
                        }}
                      >
                        <Text style={{ color: isSelected ? '#fff' : isToday ? C.accent : C.text, fontSize: 14, fontWeight: isSelected ? '700' : '400' }}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
