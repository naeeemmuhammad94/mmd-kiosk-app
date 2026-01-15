/**
 * Onboarding Screen - Figma Design Implementation
 * Flow: Welcome to Kiosk → Attendance Management → Picture Mode → Notification → Login
 * 
 * Note: expo-notifications is not supported in Expo Go SDK 53+.
 * Notification permissions will work in development/production builds.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import Ionicons from '@expo/vector-icons/Ionicons';

// Import SVG illustrations with updated file names
import WelcomeIllustration from '../../assets/Frame-welcome.svg';
import AttendanceIllustration from '../../assets/Frame-attendee.svg';
import PictureModeIllustration from '../../assets/Frame-picture-mode.svg';
import NotificationIllustration from '../../assets/Frame-notification.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlideData {
    id: string;
    title: string;
    description: string;
    Illustration: React.FC<{ width: number; height: number }>;
    isNotification?: boolean;
}

const ONBOARDING_SLIDES: OnboardingSlideData[] = [
    {
        id: 'welcome',
        title: 'Welcome to Kiosk',
        description: 'A dedicated solution to manage attendance',
        Illustration: WelcomeIllustration,
    },
    {
        id: 'attendance',
        title: 'Attendance Management',
        description: 'Simple interface to find and check-in members',
        Illustration: AttendanceIllustration,
    },
    {
        id: 'picture',
        title: 'Picture Mode',
        description: "It's easier to check-in with picture\nStudents can easily find themselves",
        Illustration: PictureModeIllustration,
    },
    {
        id: 'notification',
        title: 'Notification',
        description:
            'Please click on the "Allow" Button below to receive Notification. This can be changed at any time through your device setting',
        Illustration: NotificationIllustration,
        isNotification: true,
    },
];

// Pagination Dots Component
const PaginationDots = ({
    totalDots,
    activeIndex,
}: {
    totalDots: number;
    activeIndex: number;
}) => {
    return (
        <View style={styles.dotsContainer}>
            {Array.from({ length: totalDots }).map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        {
                            backgroundColor: index === activeIndex ? '#4A7DFF' : '#D1D5DB',
                            width: 8,
                            height: 8,
                        },
                    ]}
                />
            ))}
        </View>
    );
};

export default function OnboardingScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const { completeOnboarding, setNotificationPermission } = useOnboardingStore();

    const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

    const handleMomentumScrollEnd = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const newIndex = Math.round(offsetX / SCREEN_WIDTH);
            setCurrentIndex(newIndex);
        },
        []
    );

    const handleNext = useCallback(() => {
        if (currentIndex < ONBOARDING_SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        }
    }, [currentIndex]);

    const handleSkip = useCallback(async () => {
        await completeOnboarding();
        router.replace('/(auth)/login');
    }, [completeOnboarding, router]);

    // Handle notification permission
    // Permission preference is saved and will work when app is built for staging/production
    const handleAllow = useCallback(async () => {
        await setNotificationPermission(true);
        await completeOnboarding();
        router.replace('/(auth)/login');
    }, [completeOnboarding, setNotificationPermission, router]);

    const handleNotNow = useCallback(async () => {
        await setNotificationPermission(false);
        await completeOnboarding();
        router.replace('/(auth)/login');
    }, [completeOnboarding, setNotificationPermission, router]);

    const renderSlide = useCallback(
        ({ item }: { item: OnboardingSlideData }) => {
            const { Illustration } = item;
            return (
                <View style={styles.slide}>
                    {/* Illustration */}
                    <View style={styles.illustrationContainer}>
                        <Illustration
                            width={SCREEN_WIDTH * 0.8}
                            height={SCREEN_HEIGHT * 0.38}
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{item.title}</Text>

                    {/* Description */}
                    <Text style={styles.description}>{item.description}</Text>
                </View>
            );
        },
        []
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={ONBOARDING_SLIDES}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                getItemLayout={(_, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                })}
                style={styles.flatList}
            />

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
                {/* Pagination Dots */}
                <PaginationDots
                    totalDots={ONBOARDING_SLIDES.length}
                    activeIndex={currentIndex}
                />

                {/* Primary Button */}
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={isLastSlide ? handleAllow : handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonText}>
                        {isLastSlide ? 'Allow' : 'Next'}
                    </Text>
                    {!isLastSlide && (
                        <Ionicons
                            name="arrow-forward"
                            size={18}
                            color="#FFFFFF"
                            style={styles.arrowIcon}
                        />
                    )}
                </TouchableOpacity>

                {/* Secondary Action */}
                <TouchableOpacity
                    onPress={isLastSlide ? handleNotNow : handleSkip}
                    style={styles.secondaryButton}
                >
                    <Text style={styles.secondaryButtonText}>
                        {isLastSlide ? 'Not Now' : 'Skip'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    arrowIcon: {
        marginLeft: 8,
    },
    bottomSection: {
        alignItems: 'center',
        paddingBottom: 40,
        paddingHorizontal: 40,
    },
    container: {
        backgroundColor: '#FFFFFF',
        flex: 1,
    },
    description: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        marginBottom: 20,
        paddingHorizontal: 20,
        textAlign: 'center',
    },
    dot: {
        borderRadius: 4,
        marginHorizontal: 4,
    },
    dotsContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
    },
    flatList: {
        flex: 1,
    },
    illustrationContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        marginTop: 20,
        maxHeight: SCREEN_HEIGHT * 0.45,
    },
    primaryButton: {
        alignItems: 'center',
        backgroundColor: '#4A7DFF',
        borderRadius: 26,
        elevation: 4,
        flexDirection: 'row',
        height: 52,
        justifyContent: 'center',
        shadowColor: '#4A7DFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        width: '80%',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        marginTop: 16,
        paddingVertical: 8,
    },
    secondaryButtonText: {
        color: '#4A7DFF',
        fontSize: 14,
        fontWeight: '500',
    },
    slide: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
        width: SCREEN_WIDTH,
    },
    title: {
        color: '#1F2937',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
});
