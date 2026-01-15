/**
 * Auth Layout
 * Stack navigator for authentication screens
 */

import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function AuthLayout() {
    const theme = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: theme.colors.background,
                },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen
                name="onboarding"
                options={{
                    animation: 'fade',
                }}
            />
            <Stack.Screen name="login" />
            <Stack.Screen
                name="forgot-password"
                options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                }}
            />
        </Stack>
    );
}
