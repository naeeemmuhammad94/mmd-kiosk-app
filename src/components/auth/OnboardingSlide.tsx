/**
 * OnboardingSlide Component
 * Reusable slide component for onboarding screens
 */

import React from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SvgUri } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlideProps {
  title: string;
  description: string;
  imageSource: string;
  isAsset?: boolean;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  title,
  description,
  imageSource,
  isAsset = true,
}) => {
  const theme = useTheme();

  const renderImage = () => {
    if (isAsset && imageSource.endsWith('.svg')) {
      return <SvgUri width={SCREEN_WIDTH * 0.85} height={SCREEN_HEIGHT * 0.35} uri={imageSource} />;
    }

    return <Image source={{ uri: imageSource }} style={styles.image} resizeMode="contain" />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>{renderImage()}</View>

      <View style={styles.contentContainer}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          {title}
        </Text>

        <Text
          variant="bodyLarge"
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
        >
          {description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: SCREEN_WIDTH,
  },
  contentContainer: {
    alignItems: 'center',
    flex: 0.4,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  description: {
    alignSelf: 'center',
    lineHeight: 24,
    maxWidth: 360,
    opacity: 0.8,
    textAlign: 'center',
  },
  image: {
    height: SCREEN_HEIGHT * 0.35,
    width: SCREEN_WIDTH * 0.85,
  },
  imageContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: 40,
    maxHeight: SCREEN_HEIGHT * 0.45,
  },
  title: {
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default OnboardingSlide;
