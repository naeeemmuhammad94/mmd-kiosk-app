/**
 * Onboarding Screen - Figma Design Implementation
 * Flow: Welcome to Kiosk → Attendance Management → Picture Mode → Notification → Login
 *
 * Note: expo-notifications is not supported in Expo Go SDK 53+.
 * Notification permissions will work in development/production builds.
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { useAppTheme } from '@/hooks/useAppTheme';
import type { CustomColors } from '@/theme';

// Import SVG illustrations with updated file names
import WelcomeIllustration from '../../assets/welcome.svg';
import AttendanceIllustration from '../../assets/attendee.svg';
import PictureModeIllustration from '../../assets/picture-mode.svg';
import NotificationIllustration from '../../assets/notification.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlideData {
  id: string;
  title: string;
  description: string;
  Illustration: React.FC<{ width: number; height: number }>;
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
    description: "It's easier to check-in with pictures\nStudents can easily find themselves",
    Illustration: PictureModeIllustration,
  },
  {
    id: 'notification',
    title: 'Notification',
    description:
      'Please click on the "Allow" Button below to receive Notification. This can be changed at any time through your device settings',
    Illustration: NotificationIllustration,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const { theme, customColors } = useAppTheme();
  // Simple check for tablet
  const isTablet = SCREEN_WIDTH >= 768;
  const styles = useMemo(
    () => createStyles(theme, customColors, isTablet),
    [theme, customColors, isTablet]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // Use useState for Animated value to avoid ref-in-render lint issues
  const [fadeAnim] = useState(new Animated.Value(0));

  const { completeOnboarding, setNotificationPermission } = useOnboardingStore();

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  // Show transition loader with fade-in animation
  const showTransitionLoader = useCallback(() => {
    setIsLoading(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Navigate to login after a brief delay for smooth transition
  const navigateToLogin = useCallback(() => {
    showTransitionLoader();
    setTimeout(() => {
      router.replace('/(auth)/login');
    }, 800);
  }, [router, showTransitionLoader]);

  const handleMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(newIndex);
  }, []);

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
    navigateToLogin();
  }, [completeOnboarding, navigateToLogin]);

  // Handle notification permission
  // Permission preference is saved and will work when app is built for staging/production

  const handleAllow = useCallback(async () => {
    try {
      const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

      if (isExpoGo) {
        // Expo Go SDK 53+ does not support expo-notifications for Android
        // Simulate a successful grant for development flow
        await setNotificationPermission(true);
      } else {
        // Production/Development Build: Use native module
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
        const Notifications = require('expo-notifications');
        const { status } = await Notifications.requestPermissionsAsync();
        await setNotificationPermission(status === 'granted');
      }
    } catch (error) {
      console.warn('Error seeking notification permissions:', error);
      // Fallback on error
      await setNotificationPermission(true);
    }
    await completeOnboarding();
    navigateToLogin();
  }, [completeOnboarding, setNotificationPermission, navigateToLogin]);

  const handleNotNow = useCallback(async () => {
    await setNotificationPermission(false);
    await completeOnboarding();
    navigateToLogin();
  }, [completeOnboarding, setNotificationPermission, navigateToLogin]);

  const renderSlide = useCallback(
    ({ item }: { item: OnboardingSlideData }) => {
      const { Illustration } = item;
      // Notification slide needs to be larger to match design
      const width = SCREEN_WIDTH * 0.8;
      const height = SCREEN_HEIGHT * 0.38;

      return (
        <View style={styles.slide}>
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Illustration width={width} height={height} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{item.description}</Text>
        </View>
      );
    },
    [styles]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
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
          theme={theme}
          styles={styles}
        />

        {/* Primary Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={isLastSlide ? handleAllow : handleNext}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>{isLastSlide ? 'Allow' : 'Next'}</Text>
          {!isLastSlide && (
            <Ionicons
              name="arrow-forward"
              size={18}
              color={theme.colors.onPrimary}
              style={styles.arrowIcon}
            />
          )}
        </TouchableOpacity>

        {/* Secondary Action */}
        <TouchableOpacity
          onPress={isLastSlide ? handleNotNow : handleSkip}
          style={styles.secondaryButton}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>{isLastSlide ? 'Not Now' : 'Skip'}</Text>
        </TouchableOpacity>
      </View>

      {/* Transition Loader Overlay */}
      {isLoading && (
        <Animated.View style={[styles.loaderOverlay, { opacity: fadeAnim }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// Pagination Dots Component needs to accept styles/theme
const PaginationDots = ({
  totalDots,
  activeIndex,
  styles,
}: {
  totalDots: number;
  activeIndex: number;
  theme: MD3Theme;
  styles: ReturnType<typeof createStyles>;
}) => {
  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: totalDots }).map((_, index) => {
        const isActive = index === activeIndex;
        return (
          <View
            key={index}
            style={[styles.dot, isActive ? styles.activeDot : styles.inactiveDot]}
          />
        );
      })}
    </View>
  );
};

const createStyles = (theme: MD3Theme, customColors: CustomColors, isTablet: boolean) =>
  StyleSheet.create({
    activeDot: {
      backgroundColor: theme.colors.primary,
      borderRadius: 7,
      height: 14,
      width: 14,
    },
    arrowIcon: {
      marginLeft: 8,
    },
    bottomSection: {
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 20,
      paddingHorizontal: 40,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
      justifyContent: 'center',
    },
    description: {
      alignSelf: 'center',
      color: theme.colors.onSurfaceVariant,
      fontSize: isTablet ? 20 : 16,
      fontWeight: '400',
      lineHeight: isTablet ? 28 : 24,
      marginBottom: 0,
      maxWidth: isTablet ? 600 : 360,
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
      marginBottom: isTablet ? 32 : 24,
    },
    flatList: {
      flexGrow: 0,
    },
    illustrationContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: isTablet ? 40 : 20,
    },
    inactiveDot: {
      backgroundColor: theme.colors.outline,
      borderRadius: 4,
      height: 8,
      width: 8,
    },
    loaderOverlay: {
      alignItems: 'center',
      backgroundColor: customColors.backdropLight,
      bottom: 0,
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      elevation: 4,
      flexDirection: 'row',
      height: isTablet ? 56 : 52,
      justifyContent: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      width: isTablet ? 280 : 240,
    },
    primaryButtonText: {
      color: theme.colors.onPrimary,
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
    },
    secondaryButton: {
      marginTop: isTablet ? 24 : 16,
      paddingVertical: 8,
    },
    secondaryButtonText: {
      color: theme.colors.primary,
      fontSize: isTablet ? 16 : 14,
      fontWeight: '500',
    },
    slide: {
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      paddingHorizontal: 32,
      width: SCREEN_WIDTH,
    },
    title: {
      color: theme.colors.onSurface,
      fontSize: isTablet ? 36 : 28,
      fontWeight: '700',
      marginBottom: isTablet ? 16 : 12,
      textAlign: 'center',
    },
  });
