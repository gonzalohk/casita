/**
 * onboarding.tsx  —  Project Setup Screen
 *
 * Shown once when a new user logs in and has no project yet.
 * Creates the project and seeds default data in 3 steps:
 *   1. Insert the project row with name, budget and start date
 *   2. Create default expense categories (Materiales, Mano de obra, etc.)
 *   3. Optionally record an initial income entry (starting capital)
 *
 * After setup, navigates to the main dashboard.
 *
 * Fields:
 *   name           — project name (default: "Mi Casa")
 *   description    — optional description
 *   total_budget   — total budget in Bolivianos (required)
 *   initial_income — optional opening balance entry
 */
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { queryClient } from '@/lib/queryClient';
import { todayISO } from '@/utils/formatters';

const onboardingSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().optional(),
  total_budget: z
    .string()
    .min(1, 'Ingresá el presupuesto')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Debe ser un número mayor a 0'),
  initial_income: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0),
      'Debe ser un número válido'
    ),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

export default function OnboardingScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const { setProject } = useProjectStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: 'Mi Casa',
      total_budget: '',
      initial_income: '',
    },
  });

  const onSubmit = async (data: OnboardingForm) => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          total_budget: parseFloat(data.total_budget),
          start_date: todayISO(),
          status: 'active',
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // 2. Seed default categories
      await supabase.rpc('seed_default_categories', { p_project_id: project.id });

      // 3. Create initial income if provided
      const income = parseFloat(data.initial_income ?? '0');
      if (income > 0) {
        await supabase.from('income_entries').insert({
          project_id: project.id,
          amount: income,
          description: 'Capital inicial',
          source: 'personal',
          date: todayISO(),
        });
      }

      setProject(project);
      queryClient.invalidateQueries();
      router.replace('/(app)');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo crear el proyecto. Intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (hasError: boolean) => ({
    backgroundColor: '#1c1c2e',
    borderRadius: 12,
    padding: 16,
    color: '#f0f0ff' as const,
    fontSize: 16,
    borderWidth: hasError ? 1 : 0,
    borderColor: '#ef4444',
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f0f1a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, padding: 24, paddingTop: 64 }}>
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#f0f0ff' }}>
              ¡Bienvenido! 🏗️
            </Text>
            <Text style={{ fontSize: 16, color: '#8888aa', marginTop: 8 }}>
              Configurá tu proyecto de construcción para empezar a gestionar gastos y presupuesto.
            </Text>
          </View>

          <View style={{ gap: 20 }}>
            {/* Project name */}
            <View>
              <Text style={{ color: '#8888aa', marginBottom: 6, fontSize: 14 }}>
                Nombre del proyecto *
              </Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={inputStyle(!!errors.name)}
                    placeholder="Ej: Mi Casa, Construcción 2024"
                    placeholderTextColor="#8888aa"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.name && (
                <Text style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                  {errors.name.message}
                </Text>
              )}
            </View>

            {/* Description */}
            <View>
              <Text style={{ color: '#8888aa', marginBottom: 6, fontSize: 14 }}>
                Descripción (opcional)
              </Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[inputStyle(false), { minHeight: 80, textAlignVertical: 'top' }]}
                    placeholder="Casa de 2 plantas, zona norte..."
                    placeholderTextColor="#8888aa"
                    multiline
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>

            {/* Total budget */}
            <View>
              <Text style={{ color: '#8888aa', marginBottom: 6, fontSize: 14 }}>
                Presupuesto total *
              </Text>
              <Controller
                control={control}
                name="total_budget"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={inputStyle(!!errors.total_budget)}
                    placeholder="Ej: 500000"
                    placeholderTextColor="#8888aa"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.total_budget && (
                <Text style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                  {errors.total_budget.message}
                </Text>
              )}
            </View>

            {/* Initial capital */}
            <View>
              <Text style={{ color: '#8888aa', marginBottom: 6, fontSize: 14 }}>
                Capital inicial disponible (opcional)
              </Text>
              <Controller
                control={control}
                name="initial_income"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={inputStyle(!!errors.initial_income)}
                    placeholder="Ej: 100000"
                    placeholderTextColor="#8888aa"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.initial_income && (
                <Text style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                  {errors.initial_income.message}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#4f7bff',
                borderRadius: 12,
                padding: 18,
                alignItems: 'center',
                marginTop: 8,
                opacity: isLoading ? 0.7 : 1,
              }}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#f0f0ff', fontSize: 16, fontWeight: '700' }}>
                  Comenzar proyecto →
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
