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
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';

const registerSchema = z
  .object({
    email: z.string().email('Ingresá un email válido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });
    setIsLoading(false);

    if (error) {
      Alert.alert('Error al registrarse', error.message);
    } else {
      Alert.alert(
        'Cuenta creada',
        'Revisá tu email para confirmar la cuenta, luego podés ingresar.',
        [{ text: 'OK' }]
      );
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
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <Text style={{ fontSize: 40 }}>🏠</Text>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#f0f0ff', marginTop: 12 }}>
              Crear cuenta
            </Text>
            <Text style={{ fontSize: 16, color: '#8888aa', marginTop: 4 }}>
              Gestioná tu construcción
            </Text>
          </View>

          <View style={{ gap: 16 }}>
            {/* Email */}
            <View>
              <Text style={{ color: '#8888aa', marginBottom: 6, fontSize: 14 }}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={inputStyle(!!errors.email)}
                    placeholder="tu@email.com"
                    placeholderTextColor="#8888aa"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.email && (
                <Text style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Password */}
            <View>
              <Text style={{ color: '#8888aa', marginBottom: 6, fontSize: 14 }}>Contraseña</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={inputStyle(!!errors.password)}
                    placeholder="••••••••"
                    placeholderTextColor="#8888aa"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.password && (
                <Text style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Confirm password */}
            <View>
              <Text style={{ color: '#8888aa', marginBottom: 6, fontSize: 14 }}>
                Repetir contraseña
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={inputStyle(!!errors.confirmPassword)}
                    placeholder="••••••••"
                    placeholderTextColor="#8888aa"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.confirmPassword && (
                <Text style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#4f7bff',
                borderRadius: 12,
                padding: 16,
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
                <Text style={{ color: '#f0f0ff', fontSize: 16, fontWeight: '600' }}>
                  Crear cuenta
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 4 }}>
              <Text style={{ color: '#8888aa' }}>¿Ya tenés cuenta?</Text>
              <Link href="/(auth)/login">
                <Text style={{ color: '#4f7bff', fontWeight: '600' }}>Iniciar sesión</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
