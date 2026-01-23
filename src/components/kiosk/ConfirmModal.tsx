import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useKioskStore } from '@/store/useKioskStore';
import moment from 'moment';
// Assets
import TickIcon from '../../../assets/tick.svg';
import CloseIcon from '../../../assets/close.svg';

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

  return (
    <View style={styles.overlayContainer}>
      {/* Darkened background to focus on the pop-over */}
      <View style={styles.backdrop} />

      {/* Square Card Pop-over */}
      <View style={styles.cardContainer}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Large Status Icon */}
        <View style={styles.statusIconWrapper}>
          {isCheckIn ? (
            <TickIcon width={64} height={64} />
          ) : (
            // Check Out - Red Cross
            <CloseIcon width={64} height={64} />
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
                <Image
                  source={{ uri: selectedStudent.profilePicURL }}
                  style={styles.profileImage}
                />
              ) : (
                <Avatar.Text
                  size={80}
                  label={studentName.charAt(0).toUpperCase()}
                  style={styles.avatar}
                />
              )}
              {/* Status badge floating on bottom right */}
              <View style={styles.floatingBadge}>
                {isCheckIn ? (
                  <TickIcon width={24} height={24} />
                ) : (
                  <CloseIcon width={24} height={24} />
                )}
              </View>
            </View>
          </View>
          <Text style={styles.studentName}>{studentName}</Text>
        </View>

        {/* Checked In At Badge */}
        <View style={[styles.timeBadge, { backgroundColor: isCheckIn ? '#ECFDF5' : '#FEF2F2' }]}>
          <Text style={[styles.timeBadgeLabel, { color: isCheckIn ? '#059669' : '#EF4444' }]}>
            {isCheckIn ? 'Checked in at' : 'Checked out at'}
          </Text>
          <Text style={[styles.timeBadgeValue, { color: isCheckIn ? '#059669' : '#EF4444' }]}>
            {currentTime}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#4A7DFF',
    borderRadius: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // User requested "blurred or darkened". SLight dark blur.
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // Rounded corners
    width: '90%', // Responsive width
    maxWidth: 400, // Compact max width
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  closeButton: {
    padding: 4,
    position: 'absolute',
    right: 16,
    top: 16,
  },
  feedbackLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
  },
  floatingBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    bottom: -6,
    position: 'absolute',
    right: -6,
    zIndex: 10,
  },
  imageWrapper: {
    position: 'relative',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 16, // Squircle
    borderWidth: 2,
    borderColor: '#EAB308', // Gold border from screenshot? Or just clean. Let's add the gold border seen in some designs.
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
    marginBottom: 20,
  },
  studentName: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 8,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  timeBadge: {
    // Dynamic background in component, this is base
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
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
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
});
