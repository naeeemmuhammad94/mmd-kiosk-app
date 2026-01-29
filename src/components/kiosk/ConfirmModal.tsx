import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useKioskStore } from '@/store/useKioskStore';
import moment from 'moment';
import { lightTheme as theme, customColors } from '@/theme';
// Assets
import CheckCircleIcon from '../../../assets/check-circle.svg';
import CheckoutCircleIcon from '../../../assets/checkout-circle.svg';
// TickIcon/CloseIcon removed in favor of new assets
import { getEffectiveColor, getGradientColors } from './StudentCard';

export default function ConfirmModal() {
  const {
    selectedStudent,
    settings,
    confirmType,
    closeAllModals, // Updated: Logic to close EVERYTHING
  } = useKioskStore();

  // Auto-close after 3 seconds - TRIGGERS PARENT CLOSE TOO
  useEffect(() => {
    const timer = setTimeout(() => {
      closeAllModals();
    }, 3000);

    return () => clearTimeout(timer);
  }, [closeAllModals]);

  const handleClose = () => {
    closeAllModals();
  };

  if (!selectedStudent) return null;

  // Handle null, undefined, and empty string
  const studentName =
    selectedStudent.name && selectedStudent.name.length > 0 ? selectedStudent.name : 'Unknown';
  const showStudentImages = settings?.showStudentImages ?? true;
  const isCheckIn = confirmType === 'checkIn';
  const currentTime = moment().format('h:mm A');
  const effectiveColor = getEffectiveColor(selectedStudent.rankColor);

  return (
    <View style={styles.overlayContainer}>
      {/* Darkened background to focus on the pop-over */}
      <View style={styles.backdrop} />

      {/* Square Card Pop-over */}
      <View style={styles.cardContainer}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Large Status Icon */}
        <View
          style={[
            styles.statusIconWrapper,
            {
              backgroundColor: isCheckIn
                ? customColors.successContainer
                : customColors.errorContainer,
            },
          ]}
        >
          {isCheckIn ? (
            <CheckCircleIcon width={80} height={80} />
          ) : (
            // Check Out - Red Cross
            <CheckoutCircleIcon width={80} height={80} />
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {isCheckIn ? 'Attendance Marked Successfully' : 'Check-Out Marked Successfully'}
        </Text>
        <Text style={styles.subtitle}>
          {isCheckIn
            ? 'Thank you. Your check-in has been recorded.'
            : 'Thank you. Your check-out has been recorded.'}
        </Text>

        <TouchableOpacity>
          <Text style={styles.feedbackLink}>Have a great training session!</Text>
        </TouchableOpacity>

        {/* Student Profile Centered */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {/* Integrated Badge on Avatar Logic */}
            <View style={styles.imageWrapper}>
              {showStudentImages && selectedStudent.profilePicURL ? (
                <LinearGradient
                  colors={getGradientColors(effectiveColor)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBorder}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: selectedStudent.profilePicURL }}
                      style={styles.profileImage}
                    />
                  </View>
                </LinearGradient>
              ) : (
                <Avatar.Text
                  size={80}
                  label={studentName.charAt(0).toUpperCase()}
                  style={[
                    styles.avatar,
                    {
                      backgroundColor:
                        effectiveColor === '#E2E8F0' ? theme.colors.primary : effectiveColor,
                    },
                  ]}
                />
              )}
              {/* Status badge floating on bottom right */}
              <View style={styles.floatingBadge}>
                {isCheckIn ? (
                  <CheckCircleIcon width={24} height={24} />
                ) : (
                  <CheckoutCircleIcon width={24} height={24} />
                )}
              </View>
            </View>
          </View>
          <Text style={styles.studentName}>{studentName}</Text>
        </View>

        {/* Checked In At Badge */}
        <View
          style={[
            styles.timeBadge,
            {
              backgroundColor: isCheckIn
                ? customColors.successContainer
                : customColors.errorContainer,
            },
          ]}
        >
          <Text
            style={[
              styles.timeBadgeLabel,
              {
                color: isCheckIn ? customColors.onSuccessContainer : customColors.onErrorContainer,
              },
            ]}
          >
            {isCheckIn ? 'Checked in at' : 'Checked out at'}
          </Text>
          <Text
            style={[
              styles.timeBadgeValue,
              {
                color: isCheckIn ? customColors.onSuccessContainer : customColors.onErrorContainer,
              },
            ]}
          >
            {currentTime}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: customColors.backdropDark, // Darker overlay per Figma
    zIndex: 1,
  },
  cardContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 24, // Rounded corners
    elevation: 8,
    maxWidth: 400, // Compact max width
    paddingHorizontal: 24,
    paddingVertical: 40,
    position: 'relative',
    shadowColor: customColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    width: '90%', // Responsive width
    zIndex: 10, // Ensure card is above backdrop
  },
  closeButton: {
    padding: 4,
    position: 'absolute',
    right: 16,
    top: 16,
  },

  feedbackLink: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
  },
  floatingBadge: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    bottom: -6,
    position: 'absolute',
    right: -6,
    zIndex: 10,
  },
  gradientBorder: {
    alignItems: 'center',
    borderRadius: 20, // slightly larger than image radius (16) + padding
    justifyContent: 'center',
    padding: 3,
  },
  imageContainer: {
    alignItems: 'center',
    backgroundColor: customColors.surfaceDisabled,
    borderRadius: 16,
    justifyContent: 'center',
    overflow: 'hidden',
  },

  imageWrapper: {
    position: 'relative',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  profileImage: {
    // borderColor removed - handled by gradient
    // borderRadius handled by container
    height: 80,
    width: 80,
  },
  profileImageContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIconWrapper: {
    alignItems: 'center',
    borderRadius: 60, // Circle
    height: 120,
    justifyContent: 'center',
    marginBottom: 20,
    width: 120,
  },
  studentName: {
    color: theme.colors.onSurface,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
    marginBottom: 8,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  timeBadge: {
    // Dynamic background in component, this is base
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    width: '100%',
  },
  timeBadgeLabel: {
    fontSize: 12,
    // Dynamic color in component
    marginBottom: 2,
  },
  timeBadgeValue: {
    fontSize: 16,
    fontWeight: '700',
    // Dynamic color in component
  },
  title: {
    color: theme.colors.onSurface,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
});
