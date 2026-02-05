import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { MD3Theme } from 'react-native-paper';
import type { CustomColors } from '@/theme';
// MMD Assets
import TickIcon from '../../../assets/tick.svg';

import type { AttendanceContact } from '@/types/attendance';
import { getResponsiveDimensions } from '@/theme/dimensions';

import { useLocalSettingsStore } from '@/store/useLocalSettingsStore';

interface StudentCardProps {
  student: AttendanceContact;
  showImage: boolean;
  onPress: () => void;
  width?: number;
}

// Feature: Gradient Logic with CRM Colors
// We use the direct rank color as the base, and generate a gradient from it.
export const getEffectiveColor = (rankColor: string | undefined, theme: MD3Theme): string => {
  // If no rank color, OR it's white (invisible on white bg), use a visible gray fallback
  if (
    !rankColor ||
    rankColor === '' ||
    rankColor === theme.colors.outline ||
    rankColor.toLowerCase() === '#ffffff'
  ) {
    return '#CBD5E1'; // Slate 300 - Visible gray that doesn't wash out to white in gradient
  }
  return rankColor;
};

// Helper to create gradient colors from base color
export const getGradientColors = (baseColor: string): [string, string, string] => {
  // Create a gradient that starts and ends with the base color
  // with a slightly lighter middle for visual effect
  return [baseColor, adjustBrightness(baseColor, 20), baseColor];
};

// Helper to adjust color brightness
const adjustBrightness = (hex: string, percent: number): string => {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  } catch {
    return hex;
  }
};

export default function StudentCard({ student, showImage, onPress, width }: StudentCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const dims = getResponsiveDimensions(isTablet);

  const { theme, customColors } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, customColors), [theme, customColors]);

  // Use provided width or fallback to responsive default
  const cardWidth = width || dims.cardWidth;

  // Handle null, undefined, and empty string
  const studentName = student?.name && student.name.length > 0 ? student.name : 'Unknown';
  const attendanceText = `Attendance (${student?.totalPresentCount || 0}/${student?.totalClasses || 0})`;
  const isCheckedIn = student?.isPresent;

  // Get effective color - direct rank color or gray fallback
  const effectiveColor = getEffectiveColor(student?.rankColor, theme);
  const gradientColors = getGradientColors(effectiveColor);

  const { showAttendanceBar } = useLocalSettingsStore();

  const totalClasses = student?.totalClasses || 0;
  const presentCount = student?.totalPresentCount || 0;
  const progressPercent = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

  return (
    <TouchableOpacity
      style={[styles.cardContainer, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        {/* Profile Image Container */}
        <View style={styles.imageWrapper}>
          {/* Main Content: Gradient Border + Image */}
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.gradientBorder,
              { width: dims.avatarBorder * 1.5, height: dims.avatarBorder * 1.5 },
            ]}
          >
            <View
              style={[
                styles.imageContainer,
                {
                  width: dims.avatarInner * 1.5, // Increase size significantly
                  height: dims.avatarInner * 1.5,
                },
              ]}
            >
              {showImage && student?.profilePicURL ? (
                <Image
                  source={{ uri: student.profilePicURL }}
                  style={[styles.profileImage, styles.fullSize]}
                />
              ) : (
                <Avatar.Text
                  size={dims.avatarSize * 1.5}
                  label={studentName.charAt(0).toUpperCase()}
                  style={[
                    styles.avatar,
                    {
                      backgroundColor:
                        effectiveColor === '#E2E8F0' ? theme.colors.primary : effectiveColor,
                    },
                  ]}
                  labelStyle={[styles.avatarLabel, { fontSize: dims.avatarSize * 0.4 }]}
                />
              )}
            </View>
          </LinearGradient>

          {/* Status Badge - Bottom Right (green check) - ONLY if checked in */}
          {isCheckedIn && (
            <View style={styles.statusBadgeBottomRight}>
              {/* Use SVG Asset - Scaled Up */}
              <TickIcon width={dims.badgeSize * 1.5} height={dims.badgeSize * 1.5} />
            </View>
          )}
        </View>

        {/* Name */}
        <View style={styles.nameContainer}>
          <Text
            style={[styles.name, { fontSize: dims.nameFontSize }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {studentName}
          </Text>
        </View>

        {/* Attendance - Bar or Text */}
        {showAttendanceBar ? (
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBarFill, { width: `${Math.min(100, progressPercent)}%` }]}
            />
          </View>
        ) : (
          <Text
            style={[styles.attendance, isCheckedIn ? styles.attendanceGreen : styles.attendanceRed]}
          >
            {attendanceText}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: MD3Theme, customColors: CustomColors) =>
  StyleSheet.create({
    attendance: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 4,
      textAlign: 'center',
    },
    attendanceGreen: {
      color: theme.colors.onSurfaceVariant, // Grey text
    },
    attendanceRed: {
      color: theme.colors.onSurfaceVariant, // Grey text
    },
    avatar: {
      borderRadius: 20,
    },
    avatarLabel: {
      color: theme.colors.onPrimary,
      fontSize: 26,
      fontWeight: '600',
    },
    cardContainer: {
      padding: 6, // Outer padding for shadow/spacing
    },
    contentContainer: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface, // Dark surface color
      borderRadius: 16,
      elevation: 5, // Match Figma shadow
      padding: 12,
      paddingBottom: 16,
      shadowColor: customColors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15, // Soft shadow
      shadowRadius: 12,
      width: '100%',
    },
    fullSize: {
      height: '100%',
      width: '100%',
    },
    gradientBorder: {
      alignItems: 'center',
      borderRadius: 24, // Matching Figma rounded corners
      justifyContent: 'center',
      padding: 3,
    },
    imageContainer: {
      alignItems: 'center',
      backgroundColor: customColors.surfaceDisabled,
      borderRadius: 20, // Matching inner radius
      justifyContent: 'center',
      overflow: 'hidden',
    },
    imageWrapper: {
      marginBottom: 12,
      position: 'relative',
      zIndex: 1, // Ensure badges sit on top
    },
    name: {
      color: theme.colors.onSurface,
      fontWeight: '700',
      lineHeight: 20,
      textAlign: 'center',
    },
    nameContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
      width: '100%',
    },
    profileImage: {
      borderRadius: 20,
    },
    progressBarContainer: {
      backgroundColor: theme.colors.outline, // Light grey background
      borderRadius: 4,
      height: 4, // Thinner
      marginTop: 8,
      overflow: 'hidden',
      width: '90%', // Wider
    },
    progressBarFill: {
      backgroundColor: theme.colors.primary, // Blue
      borderRadius: 4,
      height: '100%',
    },
    statusBadgeBottomRight: {
      // Background removed as per request (Figma shows standalone shield icon)
      borderRadius: 999,
      bottom: -12, // Moved lower at 45° angle
      position: 'absolute',
      right: -12, // Moved more to the right
      shadowColor: customColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      zIndex: 10,
    },
  });
