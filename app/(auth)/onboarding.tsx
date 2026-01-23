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
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { lightTheme, customColors } from '@/theme';

// Import SVG illustrations with updated file names
import WelcomeIllustration from '../../assets/welcome.svg';
import AttendanceIllustration from '../../assets/attendee.svg';
import PictureModeIllustration from '../../assets/picture-mode.svg';
import NotificationIllustration from '../../assets/notification.svg';

const colors = lightTheme.colors;

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

// Pagination Dots Component - Bold (larger) dot for active slide
const PaginationDots = ({ totalDots, activeIndex }: { totalDots: number; activeIndex: number }) => {
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

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
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
    await setNotificationPermission(true);
    await completeOnboarding();
    navigateToLogin();
  }, [completeOnboarding, setNotificationPermission, navigateToLogin]);

  const handleNotNow = useCallback(async () => {
    await setNotificationPermission(false);
    await completeOnboarding();
    navigateToLogin();
  }, [completeOnboarding, setNotificationPermission, navigateToLogin]);

  const renderSlide = useCallback(({ item }: { item: OnboardingSlideData }) => {
    const { Illustration } = item;
    return (
      <View style={styles.slide}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Illustration width={SCREEN_WIDTH * 0.8} height={SCREEN_HEIGHT * 0.38} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  }, []);

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
        <PaginationDots totalDots={ONBOARDING_SLIDES.length} activeIndex={currentIndex} />

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
              color={customColors.white}
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
          <ActivityIndicator size="large" color={colors.primary} />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: customColors.primary,
    borderRadius: 7,
    height: 14,
    width: 14,
  },
  arrowIcon: {
    marginLeft: 8,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  container: {
    backgroundColor: customColors.white,
    flex: 1,
  },
  description: {
    alignSelf: 'center',
    color: customColors.textLight,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 20,
    maxWidth: 360, // Fix: Force 3-line wrapping on wider screens
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
  inactiveDot: {
    backgroundColor: customColors.outlineVariant,
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
    backgroundColor: customColors.primary,
    borderRadius: 10,
    elevation: 4,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'center',
    shadowColor: customColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: 240,
  },
  primaryButtonText: {
    color: customColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: customColors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  slide: {
    alignItems: 'center',
    backgroundColor: customColors.white,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    width: SCREEN_WIDTH,
  },
  title: {
    color: customColors.textGray,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
});
