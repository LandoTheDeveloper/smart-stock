import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/authcontext';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallback() {
    const { token, error } = useLocalSearchParams<{ token?: string; error?: string }>();
    const router = useRouter();
    const { setSession } = useAuth();

    useEffect(() => {
        async function handleAuth() {
            if (error) {
                // Handle error (maybe redirect to login with error message)
                router.replace({ pathname: '/auth/login', params: { error } });
                return;
            }

            if (token) {
                try {
                    await setSession(token);
                    router.replace('/main/dashboard');
                } catch (e) {
                    console.error('Failed to set session:', e);
                    router.replace({ pathname: '/auth/login', params: { error: 'Failed to save session' } });
                }
            } else {
                router.replace('/auth/login');
            }
        }

        handleAuth();
    }, [token, error]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text style={{ marginTop: 20 }}>Finalizing login...</Text>
        </View>
    );
}
