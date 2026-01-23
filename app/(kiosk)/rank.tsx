/**
 * Rank Screen
 * Select rank dropdown with student list - matching Figma Rank design
 */

import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useKioskStore } from '@/store/useKioskStore';
import AttendanceModal from '@/components/kiosk/AttendanceModal';
import KioskPinModal from '@/components/kiosk/KioskPinModal';
import KioskSettingsModal from '@/components/kiosk/KioskSettingsModal';
import type { AttendanceContact } from '@/types/attendance';
import { lightTheme as theme, customColors } from '@/theme';

export default function RankScreen() {
  const router = useRouter();
  const {
    settings,
    attendanceData,
    setSelectedStudent,
    isAttendanceModalOpen,
    isPinModalOpen,
    isSettingsModalOpen,
    toggleAttendanceModal,
    openPinModal,
  } = useKioskStore();

  const [selectedRank, setSelectedRank] = useState<string | null>(null);
  const [showRankDropdown, setShowRankDropdown] = useState(false);

  // Get all unique ranks from contacts
  const allContacts = (attendanceData || []).flatMap(program => program.contacts);
  const uniqueRanks = [...new Set(allContacts.map(c => c.rankName).filter(Boolean))];

  // Filter contacts by selected rank
  const filteredContacts = selectedRank
    ? allContacts.filter(c => c.rankName === selectedRank)
    : allContacts;

  const handleBack = () => {
    router.back();
  };

  const handleStudentPress = (student: AttendanceContact) => {
    setSelectedStudent(student);
    toggleAttendanceModal();
  };

  const handleSettingsPress = () => {
    openPinModal('settings');
  };

  const handleRankSelect = (rank: string | null) => {
    setSelectedRank(rank);
    setShowRankDropdown(false);
  };

  const showStudentImages = settings?.showStudentImages ?? true;

  return (
    <View style={styles.container}>
      {/* Blue Header */}
      <LinearGradient colors={[theme.colors.primary, theme.colors.primary]} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.onPrimary} />
          </TouchableOpacity>

          {/* Title with Rank Dropdown */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerSubtitle}>Select rank</Text>
            <TouchableOpacity style={styles.rankDropdown} onPress={() => setShowRankDropdown(true)}>
              <Text style={styles.rankText}>{selectedRank || 'All Ranks'}</Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>

          {/* Settings Button */}
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
            <Ionicons name="settings-outline" size={22} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      {/* Student List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.studentRow}
            onPress={() => handleStudentPress(item)}
            activeOpacity={0.7}
          >
            {/* Avatar */}
            {showStudentImages && item.profilePicURL ? (
              <Avatar.Image size={44} source={{ uri: item.profilePicURL }} />
            ) : (
              <Avatar.Text size={44} label={(item.name || 'U').charAt(0)} style={styles.avatar} />
            )}

            {/* Info */}
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{item.name || 'Unknown'}</Text>
              <Text style={styles.studentProgram}>{item.programName}</Text>
            </View>

            {/* Status */}
            <View
              style={[styles.statusIcon, item.isPresent ? styles.statusGreen : styles.statusRed]}
            >
              <Ionicons
                name={item.isPresent ? 'checkmark' : 'close'}
                size={14}
                color={theme.colors.surface}
              />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={customColors.onSurfaceDisabled} />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        }
      />

      {/* Rank Dropdown Modal */}
      <Modal
        visible={showRankDropdown}
        animationType="fade"
        transparent
        onRequestClose={() => setShowRankDropdown(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowRankDropdown(false)}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Rank</Text>
              <TouchableOpacity onPress={() => setShowRankDropdown(false)}>
                <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {/* All Ranks Option */}
              <TouchableOpacity
                style={[styles.dropdownItem, !selectedRank && styles.dropdownItemSelected]}
                onPress={() => handleRankSelect(null)}
              >
                <Text style={styles.dropdownItemText}>All Ranks</Text>
                {!selectedRank && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>

              {/* Individual Ranks */}
              {uniqueRanks.map(rank => (
                <TouchableOpacity
                  key={rank}
                  style={[
                    styles.dropdownItem,
                    selectedRank === rank && styles.dropdownItemSelected,
                  ]}
                  onPress={() => handleRankSelect(rank as string)}
                >
                  <Text style={styles.dropdownItemText}>{rank}</Text>
                  {selectedRank === rank && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modals */}
      {isAttendanceModalOpen && <AttendanceModal />}
      {isPinModalOpen && <KioskPinModal />}
      {isSettingsModalOpen && <KioskSettingsModal />}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    left: 16,
    position: 'absolute',
    top: 12,
    width: 40,
  },
  container: {
    backgroundColor: theme.colors.surface,
    flex: 1,
  },
  dropdownContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    maxHeight: '60%',
    maxWidth: 360,
    width: '80%',
  },
  dropdownHeader: {
    alignItems: 'center',
    borderBottomColor: theme.colors.outline,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  dropdownItem: {
    alignItems: 'center',
    borderBottomColor: customColors.surfaceDisabled,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemSelected: {
    backgroundColor: customColors.primaryContainer, // Use primary container for selection if available or light blue
  },
  dropdownItemText: {
    color: theme.colors.onSurface,
    fontSize: 15,
  },
  dropdownOverlay: {
    alignItems: 'center',
    backgroundColor: customColors.backdropDark,
    flex: 1,
    justifyContent: 'center',
  },
  dropdownTitle: {
    color: theme.colors.onSurface,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    paddingBottom: 20,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    position: 'relative',
  },
  headerSubtitle: {
    color: customColors.whiteOpacity,
    fontSize: 12,
  },
  listContent: {
    padding: 16,
  },
  rankDropdown: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  rankText: {
    color: theme.colors.onPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  settingsButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    top: 12,
    width: 40,
  },
  statusGreen: {
    backgroundColor: customColors.success,
  },
  statusIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  statusRed: {
    backgroundColor: theme.colors.error,
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    color: theme.colors.onSurface,
    fontSize: 15,
    fontWeight: '600',
  },
  studentProgram: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
  },
  studentRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 12,
  },
});
