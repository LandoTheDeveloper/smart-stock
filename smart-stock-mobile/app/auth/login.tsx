import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuth } from '../../context/authcontext';
import { API_BASE_URL } from '../../lib/api';

import Logo from '../../assets/SmartStockLogoTransparent.png';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { login, setSession } = useAuth();
  const params = useLocalSearchParams<{ error?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.error) {
      Alert.alert('Authentication Error', params.error);
    }
  }, [params.error]);

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      await login({ email, password });
      router.replace('/main/dashboard');
    } catch (err: any) {
      console.log('LOGIN ERROR', err);
      Alert.alert('Login failed', err?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Generate redirect URI dynamically
    // In Expo Go, this might look like exp://192.168.x.x:19000/--/oauth-callback
    // In production, it might be smartstockmobile://oauth-callback
    const redirectUri = Linking.createURL('/oauth-callback');

    try {
      // Pass the redirect_uri to the backend so it knows where to return to
      const authUrl = `${API_BASE_URL}/api/auth/google?platform=mobile&redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        const urlObj = new URL(result.url);
        const token = urlObj.searchParams.get('token');
        const error = urlObj.searchParams.get('error');

        if (error) {
          Alert.alert('Google Login failed', error);
          return;
        }

        if (token) {
          await setSession(token);
          router.replace('/main/dashboard');
        }
      }
    } catch (err: any) {
      console.log('GOOGLE LOGIN ERROR', err);
      if (err.type !== 'dismiss') {
        Alert.alert('Google Login failed', err?.message ?? 'Unknown error');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={Logo} style={styles.logo} resizeMode='contain' />

      <View style={styles.card}>
        <Text style={styles.title}>Welcome </Text>

        <TextInput
          style={styles.input}
          placeholder='Email'
          autoCapitalize='none'
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder='Password'
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? 'Logging in...' : 'Log In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={submitting}
        >
          <Text style={[styles.buttonText, styles.googleButtonText]}>
            Sign in with Google
          </Text>
        </TouchableOpacity>

        <Text style={styles.linkText}>
          Don&apos;t have an account?{' '}
          <Link href='/auth/signup' style={styles.link}>
            Sign up
          </Link>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6fbf7',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    borderColor: '#e3ece5',
    borderWidth: 1,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2e7d32',
  },
  input: {
    borderWidth: 1,
    borderColor: '#000000ff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 12,
  },
  googleButtonText: {
    color: '#333',
  },
  linkText: {
    marginTop: 14,
    textAlign: 'center',
    color: '#5f6b63',
  },
  link: {
    color: '#2e7d32',
    fontWeight: '600',
  },
});
