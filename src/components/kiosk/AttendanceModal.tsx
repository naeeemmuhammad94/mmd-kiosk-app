import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Text, Avatar, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useKioskStore } from '@/store/useKioskStore';
import { attendanceService } from '@/services/attendanceService';
import ConfirmModal from './ConfirmModal';
import { getEffectiveColor, getGradientColors } from './StudentCard';
import moment from 'moment';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { MD3Theme } from 'react-native-paper';
import type { CustomColors } from '@/theme';

export default function AttendanceModal() {
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  const { theme, customColors } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, customColors), [theme, customColors]);

  const queryClient = useQueryClient();
  const {
    selectedStudent,
    settings,
    toggleAttendanceModal,
    toggleConfirmModal,
    setConfirmType,
    isConfirmModalOpen,
  } = useKioskStore();

  // Mark attendance API call
  const { mutate: markAttendance, isPending } = useMutation({
    mutationKey: ['markKioskAttendance'],
    mutationFn: (present: boolean) => {
      if (!selectedStudent) throw new Error('No student selected');

      const payload = {
        id: selectedStudent._id,
        contact: selectedStudent.contact,
        rank: selectedStudent.rank,
        program: selectedStudent.program,
        classSlot: selectedStudent.classSlot,
        date: moment().format('ddd, DD MMM YYYY, hh:mm:ss A'),
        present,
        startTime: '',
        endTime: '',
        day: '',
      };

      return attendanceService.markKioskAttendance(selectedStudent._id, payload);
    },
    onSuccess: (_, present) => {
      if (__DEV__) {
        console.log('=== CHECK IN/OUT SUCCESS ===');
      }
      queryClient.invalidateQueries({ queryKey: ['getAttendance'] });

      // Set confirmation type and show overlay (embedded ConfirmModal)
      setConfirmType(present ? 'checkIn' : 'checkOut');
      toggleConfirmModal();
      // Note: AttendanceModal remains mounted and visible underneath
    },
    onError: error => {
      if (__DEV__) {
        console.log('=== CHECK IN/OUT ERROR ===', error);
      }
    },
  });

  const handleClose = () => {
    // If confirm modal is open, closing attendance modal should close everything
    if (isConfirmModalOpen) {
      toggleConfirmModal(); // Close confirm
    }
    toggleAttendanceModal(); // Close attendance
  };

  const handleCheckInOut = () => {
    const newPresentState = !selectedStudent?.isPresent;
    markAttendance(newPresentState);
  };

  if (!selectedStudent) return null;

  // Handle null, undefined, and empty string
  const studentName =
    selectedStudent.name && selectedStudent.name.length > 0 ? selectedStudent.name : 'Unknown';
  const showStudentImages = settings?.showStudentImages ?? true;
  const isCheckedIn = selectedStudent.isPresent;

  // Use same effective color logic as StudentCard for consistency
  const effectiveColor = getEffectiveColor(selectedStudent.rankColor, theme);

  return (
    <Modal visible={true} animationType="fade" transparent>
      <View style={styles.overlay}>
        {/* 
                   Constraint container for max width on tablets 
                   Structure: Overlay -> Constraints -> Modal Card
                */}
        <View style={styles.constraintContainer}>
          <View style={[styles.modalContainer, isTablet ? styles.modalTablet : styles.modalMobile]}>
            {/* Blue Header */}
            <LinearGradient
              colors={[customColors.modalHeaderBackground, customColors.modalHeaderBackground]} // Solid Blue/Dark header based on theme
              style={[
                styles.header,
                isTablet && styles.headerTablet,
                { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }, // Added bottom radius
              ]}
            >
              <Text style={styles.headerTitle}>Attendance</Text>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: theme.dark ? customColors.whiteOpacity : theme.colors.surface, // White in light mode
                  },
                ]}
                onPress={handleClose}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.dark ? theme.colors.onPrimary : theme.colors.primary} // Blue in light mode
                />
              </TouchableOpacity>
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
              {/* Profile Image - Larger and with yellow border treatment if needed, though Figma shows simple square/rounded */}
              <View style={styles.profileSection}>
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
                    size={100}
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
                <Text style={styles.studentName}>{studentName}</Text>
              </View>

              {/* Info Rows - List style */}
              <View style={styles.infoSection}>
                <InfoRow
                  icon="grid-outline"
                  label="Program"
                  value={selectedStudent.programName || 'N/A'}
                  theme={theme}
                  customColors={customColors}
                  styles={styles}
                />
                <InfoRow
                  icon="ribbon-outline"
                  label="Rank"
                  value={selectedStudent.rankName || 'N/A'}
                  valueColor={effectiveColor} // Use effective rank color (with fallback logic)
                  isRank
                  theme={theme}
                  customColors={customColors}
                  styles={styles}
                />
                <InfoRow
                  icon="time-outline"
                  label="Class Time"
                  value={`${moment().format('h:mm')} - ${moment().add(1, 'hour').format('h:mm A')}`} // Mocking duration for UI match
                  theme={theme}
                  customColors={customColors}
                  styles={styles}
                />
                <InfoRow
                  icon="calendar-outline"
                  label="Attendance"
                  value={`${selectedStudent.totalPresentCount || 0}/${selectedStudent.totalClasses || 0}`}
                  theme={theme}
                  customColors={customColors}
                  styles={styles}
                />
              </View>

              {/* Check In/Out Button - Full Width */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  // isCheckedIn ? styles.checkOutButton : styles.checkInButton, // Design uses Blue for Check In, Blue for Check Out in screenshot 3? Or Red? Screenshot 3 shows "Check Out" in Blue. Let's stick to Blue as per Screenshot 3.
                  isPending && styles.actionButtonDisabled,
                ]}
                onPress={handleCheckInOut}
                disabled={isPending}
              >
                {isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {isCheckedIn ? 'Check Out' : 'Check In'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 
            Confirm Overlay - Moved to top level overlay to cover entire screen
            This ensures it sits ON TOP of everything including the attendance modal
        */}
        {isConfirmModalOpen && <ConfirmModal />}
      </View>
    </Modal>
  );
}

// Info Row Component
interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  isRank?: boolean;
  theme: MD3Theme;
  customColors: CustomColors;
  styles: ReturnType<typeof createStyles>;
}

function InfoRow({ icon, label, value, valueColor, isRank, theme, styles }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      {/* Left side: Icon (+ bg) and Label */}
      <View style={styles.infoLeft}>
        {/* Icon Container could be styled if needed */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={theme.colors.primary} // Blue icons
          />
        </View>
        <View>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={[styles.infoValue, valueColor && isRank && { color: valueColor }]}>
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: MD3Theme, customColors: CustomColors) =>
  StyleSheet.create({
    actionButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary, // Stronger blue
      borderRadius: 8,
      elevation: 2,
      paddingVertical: 14,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    actionButtonDisabled: {
      opacity: 0.7,
    },
    actionButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    avatar: {
      backgroundColor: theme.colors.primary,
      marginBottom: 8,
    },

    closeButton: {
      alignItems: 'center',
      backgroundColor: customColors.whiteOpacity, // Semi-transparent circle
      borderRadius: 14,
      height: 28,
      justifyContent: 'center',
      position: 'absolute',
      right: 16,
      top: 16,
      width: 28,
    },
    constraintContainer: {
      alignItems: 'center',
      paddingHorizontal: 20,
      width: '100%',
    },
    content: {
      padding: 24,
    },
    gradientBorder: {
      alignItems: 'center',
      borderRadius: 24, // Matches StudentCard
      justifyContent: 'center',
      marginBottom: 8,
      padding: 3,
    },

    header: {
      alignItems: 'flex-end', // Align text to bottom
      flexDirection: 'row',
      justifyContent: 'center',
      minHeight: 100, // Ensure minimum height
      paddingBottom: 20, // Reduce bottom space
      paddingHorizontal: 16,
      paddingTop: 20, // Default Mobile
      position: 'relative',
    },
    headerTablet: {
      paddingTop: 48,
    },
    headerTitle: {
      color: theme.colors.onPrimary,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 4, // Fine tune alignment
    },

    iconContainer: {
      alignItems: 'center',
      backgroundColor: customColors.surfaceDisabled, // Light blue bg
      borderRadius: 18,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },

    imageContainer: {
      alignItems: 'center',
      backgroundColor: customColors.surfaceDisabled,
      borderRadius: 20, // Inner radius
      justifyContent: 'center',
      overflow: 'hidden',
    },
    infoLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginBottom: 2,
    },
    infoLeft: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 16,
    },
    infoRow: {
      alignItems: 'center',
      borderBottomColor: customColors.surfaceDisabled,
      borderBottomWidth: 1,
      flexDirection: 'row',
      paddingVertical: 12,
    },
    infoSection: {
      borderTopColor: customColors.surfaceDisabled,
      borderTopWidth: 1,
      marginBottom: 24,
      paddingTop: 8,
    },
    infoValue: {
      color: theme.colors.onSurface,
      fontSize: 15,
      fontWeight: '600',
    },
    modalContainer: {
      backgroundColor: customColors.modalBackground, // Dynamic Modal BG
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    modalMobile: {
      maxWidth: 400,
      width: '90%',
    },
    modalTablet: {
      maxWidth: 672,
      width: 672,
    },
    overlay: {
      alignItems: 'center',
      backgroundColor: customColors.backdropDark, // Darker overlay for better contrast
      flex: 1,
      justifyContent: 'center',
    },
    profileImage: {
      borderRadius: 20,
      height: 90,
      width: 90,
    },
    profileSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    studentName: {
      color: theme.colors.onSurface,
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
    },
  });
