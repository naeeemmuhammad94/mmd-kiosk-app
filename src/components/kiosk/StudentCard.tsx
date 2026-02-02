import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { MD3Theme } from 'react-native-paper';
import type { CustomColors } from '@/theme';
// MMD Assets
import TickIcon from '../../../assets/tick.svg';
import CloseIcon from '../../../assets/close.svg';
import type { AttendanceContact } from '@/types/attendance';
import { getResponsiveDimensions } from '@/theme/dimensions';

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

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Profile Image Container */}
      <View style={styles.imageWrapper}>
        {/* Status Badge - Top Left (red cross) - ONLY if NOT checked in */}
        {/* Visual refinement: overlapping top-left corner */}
        {!isCheckedIn && (
          <View style={styles.statusBadgeTopLeft}>
            {/* Use SVG Asset */}
            <CloseIcon width={dims.badgeSize} height={dims.badgeSize} />
          </View>
        )}

        {/* Gradient Border Container (Figma Style) */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientBorder, { width: dims.avatarBorder, height: dims.avatarBorder }]}
        >
          <View
            style={[
              styles.imageContainer,
              {
                width: dims.avatarInner,
                height: dims.avatarInner,
                // No solid border here, handled by gradient wrapper
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
                size={dims.avatarSize}
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
        {/* Visual refinement: overlapping bottom-right corner */}
        {isCheckedIn && (
          <View style={styles.statusBadgeBottomRight}>
            {/* Use SVG Asset */}
            <TickIcon width={dims.badgeSize} height={dims.badgeSize} />
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

      {/* Attendance - colored based on status */}
      <Text
        style={[styles.attendance, isCheckedIn ? styles.attendanceGreen : styles.attendanceRed]}
      >
        {attendanceText}
      </Text>
    </TouchableOpacity>
  );
}

const createStyles = (theme: MD3Theme, customColors: CustomColors) =>
  StyleSheet.create({
    attendance: {
      fontSize: 11,
      fontWeight: '500',
      textAlign: 'center',
    },
    attendanceGreen: {
      color: theme.colors.onSurfaceVariant, // Grey text for attendance count per design
    },
    attendanceRed: {
      color: theme.colors.onSurfaceVariant, // Grey text for attendance count per design
    },
    avatar: {
      borderRadius: 20,
    },
    avatarLabel: {
      color: theme.colors.onPrimary,
      fontSize: 26,
      fontWeight: '600',
    },
    container: {
      alignItems: 'center',
      marginBottom: 12,
      padding: 8,
      paddingTop: 12, // Added top padding to accommodate top badge
      // width set dynamically via inline style
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
      // width and height set dynamically via inline style
    },
    imageContainer: {
      alignItems: 'center',
      backgroundColor: customColors.surfaceDisabled,
      borderRadius: 20, // Matching inner radius
      justifyContent: 'center',
      overflow: 'hidden',
      // width and height set dynamically via inline style
    },
    imageWrapper: {
      marginBottom: 12, // Increased from 8 to prevent bottom badge overlap
      position: 'relative',
      zIndex: 1, // Ensure badges sit on top
    },
    name: {
      color: theme.colors.onSurface,
      // fontSize set dynamically via inline style
      fontWeight: '700',
      lineHeight: 16, // Tighter line height for better 2-line fit
      textAlign: 'center',
    },
    nameContainer: {
      justifyContent: 'flex-start',
      marginBottom: 4,
      width: '100%',
    },
    profileImage: {
      borderRadius: 20,
      // width and height set dynamically via inline style
    },
    statusBadgeBottomRight: {
      backgroundColor: theme.colors.surface,
      borderRadius: 999,
      bottom: -6,
      position: 'absolute',
      right: -6,
      shadowColor: customColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      zIndex: 10,
    },
    statusBadgeTopLeft: {
      backgroundColor: theme.colors.surface,
      borderRadius: 999,
      left: -6,
      position: 'absolute',
      shadowColor: customColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      top: -6,
      zIndex: 10,
    },
  });
