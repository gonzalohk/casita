import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useCreateExpense, useExpenseCategories } from '@/hooks/useExpenses';
import { useProjectStore } from '@/stores/projectStore';
import { todayISO } from '@/utils/formatters';
import { DateField } from '@/components/DateField';

const expenseSchema = z.object({
  description: z.string().min(3, 'Mínimo 3 caracteres'),
  amount: z
    .string()
    .min(1, 'Campo requerido')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Debe ser mayor a 0'),
  category_id: z.string().min(1, 'Seleccioná una categoría'),
  date: z.string().min(1, 'Campo requerido'),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

const C = {
  bg: '#12141c',
  surface: '#1a1d27',
  border: '#2c3050',
  text: '#f0f0ff' as const,
  muted: '#7880a0',
  accent: '#4f7bff',
  error: '#f07070',
};

export default function NewExpenseScreen() {
  const { project } = useProjectStore();
  const { data: categories = [] } = useExpenseCategories();
  const createExpense = useCreateExpense();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { description: '', amount: '', category_id: '', date: todayISO() },
  });

  const selectedCategoryId = watch('category_id');
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const onSubmit = async (data: ExpenseForm) => {
    if (!project) return;
    try {
      await createExpense.mutateAsync({
        project_id: project.id,
        description: data.description.trim(),
        amount: parseFloat(data.amount),
        category_id: data.category_id || null,
        date: data.date,
        receipt_url: null,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const fieldBorder = (hasError: boolean) => ({
    borderBottomWidth: 1.5,
    borderBottomColor: hasError ? C.error : C.border,
    paddingVertical: 12,
    paddingHorizontal: 2,
    color: C.text,
    fontSize: 16,
  });

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 64, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 44, gap: 14 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={C.muted} />
            </TouchableOpacity>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '500' }}>Nuevo Gasto</Text>
          </View>

          <View style={{ gap: 32 }}>
            {/* Description */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>DESCRIPCIÓN</Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={fieldBorder(!!errors.description)}
                    placeholder="Ej: Cemento 50kg, varillas"
                    placeholderTextColor={C.border}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.description && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.description.message}</Text>}
            </View>

            {/* Amount */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>MONTO (Bs)</Text>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={fieldBorder(!!errors.amount)}
                    placeholder="0.00"
                    placeholderTextColor={C.border}
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.amount && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.amount.message}</Text>}
            </View>

            {/* Category — dropdown */}
            <View>
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>CATEGORÍA</Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  borderBottomWidth: 1.5,
                  borderBottomColor: errors.category_id ? C.error : C.border,
                  paddingVertical: 12,
                }}
                onPress={() => setCategoryModalOpen(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {selectedCategory && (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedCategory.color }} />
                  )}
                  <Text style={{ color: selectedCategory ? C.text : C.border, fontSize: 16 }}>
                    {selectedCategory ? selectedCategory.name : 'Elegir categoría...'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={C.muted} />
              </TouchableOpacity>
              {errors.category_id && <Text style={{ color: C.error, fontSize: 12, marginTop: 4 }}>{errors.category_id.message}</Text>}
            </View>

            {/* Date */}
            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, value } }) => (
                <DateField
                  label="FECHA"
                  value={value}
                  onChange={onChange}
                  hasError={!!errors.date}
                  errorMessage={errors.date?.message}
                />
              )}
            />

            <TouchableOpacity
              style={{
                backgroundColor: C.accent,
                borderRadius: 10,
                padding: 16,
                alignItems: 'center',
                marginTop: 12,
                opacity: createExpense.isPending ? 0.6 : 1,
              }}
              onPress={handleSubmit(onSubmit)}
              disabled={createExpense.isPending}
            >
              {createExpense.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Registrar gasto</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category modal */}
      <Modal visible={categoryModalOpen} transparent animationType="slide" onRequestClose={() => setCategoryModalOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setCategoryModalOpen(false)}
        >
          <View style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            paddingBottom: Platform.OS === 'ios' ? 36 : 24,
          }}>
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: 20, borderBottomWidth: 1, borderBottomColor: C.border,
            }}>
              <Text style={{ color: C.text, fontWeight: '600', fontSize: 16 }}>Elegir Categoría</Text>
              <TouchableOpacity onPress={() => setCategoryModalOpen(false)}>
                <Ionicons name="close" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>
            {categories.map((cat, i) => (
              <TouchableOpacity
                key={cat.id}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 24, paddingVertical: 16,
                  borderBottomWidth: i < categories.length - 1 ? 1 : 0,
                  borderBottomColor: C.border + '60',
                }}
                onPress={() => { setValue('category_id', cat.id, { shouldValidate: true }); setCategoryModalOpen(false); }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: cat.color }} />
                  <Ionicons name={(cat.icon as any) ?? 'receipt'} size={18} color={cat.color} />
                  <Text style={{ color: selectedCategoryId === cat.id ? C.accent : C.text, fontSize: 15 }}>{cat.name}</Text>
                </View>
                {selectedCategoryId === cat.id && <Ionicons name="checkmark" size={18} color={C.accent} />}
              </TouchableOpacity>
            ))}
            {categories.length === 0 && (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: C.muted }}>Sin categorías disponibles</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
