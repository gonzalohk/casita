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
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });
    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : error.message
      );
    }
    // Auth guard in _layout.tsx handles navigation on success
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f0f1a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <Image
              source={require('../../assets/images/sunnycolor.png')}
              style={{ width: 80, height: 80, borderRadius: 20 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#f0f0ff', marginTop: 16 }}>
              Sunny-ficación
            </Text>
            <Text style={{ fontSize: 16, color: '#8888aa', marginTop: 4 }}>
              Gestión de construcción
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            {/* Email */}
            <View>
              <Text style={{ color: '#8888aa', marginBottom: 6, fontSize: 14 }}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={{
                      backgroundColor: '#1c1c2e',
                      borderRadius: 12,
                      padding: 16,
                      color: '#f0f0ff',
                      fontSize: 16,
                      borderWidth: errors.email ? 1 : 0,
                      borderColor: '#ef4444',
                    }}
                    placeholder="tu@email.com"
                    placeholderTextColor="#8888aa"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
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
                    style={{
                      backgroundColor: '#1c1c2e',
                      borderRadius: 12,
                      padding: 16,
                      color: '#f0f0ff',
                      fontSize: 16,
                      borderWidth: errors.password ? 1 : 0,
                      borderColor: '#ef4444',
                    }}
                    placeholder="••••••••"
                    placeholderTextColor="#8888aa"
                    secureTextEntry
                    autoComplete="password"
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

            {/* Submit */}
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
                  Ingresar
                </Text>
              )}
            </TouchableOpacity>

            {/* Register link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 4 }}>
              <Text style={{ color: '#8888aa' }}>¿No tenés cuenta?</Text>
              <Link href="/(auth)/register">
                <Text style={{ color: '#4f7bff', fontWeight: '600' }}>Registrarse</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
