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
      <LinearGradient colors={['#4A7DFF', '#4A7DFF']} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Title with Rank Dropdown */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerSubtitle}>Select rank</Text>
            <TouchableOpacity style={styles.rankDropdown} onPress={() => setShowRankDropdown(true)}>
              <Text style={styles.rankText}>{selectedRank || 'All Ranks'}</Text>
              <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Settings Button */}
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
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
              <Ionicons name={item.isPresent ? 'checkmark' : 'close'} size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
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
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {/* All Ranks Option */}
              <TouchableOpacity
                style={[styles.dropdownItem, !selectedRank && styles.dropdownItemSelected]}
                onPress={() => handleRankSelect(null)}
              >
                <Text style={styles.dropdownItemText}>All Ranks</Text>
                {!selectedRank && <Ionicons name="checkmark" size={20} color="#4A7DFF" />}
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
                  {selectedRank === rank && <Ionicons name="checkmark" size={20} color="#4A7DFF" />}
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
    backgroundColor: '#4A7DFF',
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
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: '60%',
    maxWidth: 360,
    width: '80%',
  },
  dropdownHeader: {
    alignItems: 'center',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  dropdownItem: {
    alignItems: 'center',
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemText: {
    color: '#1F2937',
    fontSize: 15,
  },
  dropdownOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  dropdownTitle: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#6B7280',
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
    color: 'rgba(255, 255, 255, 0.8)',
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
    color: '#FFFFFF',
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
    backgroundColor: '#22C55E',
  },
  statusIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  statusRed: {
    backgroundColor: '#EF4444',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '600',
  },
  studentProgram: {
    color: '#6B7280',
    fontSize: 13,
  },
  studentRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 12,
  },
});
