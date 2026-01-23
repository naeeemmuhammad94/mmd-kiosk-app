/**
 * Programs Screen - Accordion View
 * Single screen with all programs as accordions
 * Header changes: "Select Program" (collapsed) -> "Select Profile" (any expanded)
 * Matches Figma design
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useKioskStore } from '@/store/useKioskStore';
import { attendanceService } from '@/services/attendanceService';
import StudentCard from '@/components/kiosk/StudentCard';
import AttendanceModal from '@/components/kiosk/AttendanceModal';
import KioskPinModal from '@/components/kiosk/KioskPinModal';
import KioskSettingsModal from '@/components/kiosk/KioskSettingsModal';
import type { AttendanceContact, ProgramAttendance } from '@/types/attendance';

export default function ProgramsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    settings,
    attendanceData,
    setSelectedStudent,
    isAttendanceModalOpen,
    isPinModalOpen,
    isSettingsModalOpen,
    toggleAttendanceModal,
    openPinModal,
    setAttendanceData,
    setSettings,
  } = useKioskStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<string[]>([]);

  // Fetch attendance data if not in store
  const { data: fetchedData, isLoading } = useQuery({
    queryKey: ['getAttendance'],
    queryFn: () => {
      const today = new Date().toISOString().split('T')[0];
      return attendanceService.getAttendance({ startingDate: today });
    },
    select: response => getProgramBasedData(response.data?.allAttendance || []),
    enabled: isAuthenticated && attendanceData.length === 0,
  });

  // Fetch settings
  const { data: settingsData } = useQuery({
    queryKey: ['getKioskSettings'],
    queryFn: () => attendanceService.getKioskSettingsByDojo(),
    select: response => response.data,
    enabled: isAuthenticated && !settings,
  });

  useEffect(() => {
    if (fetchedData && attendanceData.length === 0) {
      setAttendanceData(fetchedData);
    }
  }, [fetchedData]);

  useEffect(() => {
    if (settingsData && !settings) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  // Use fetched data or store data
  const programs = attendanceData.length > 0 ? attendanceData : fetchedData || [];

  // Check if any accordion is expanded
  const hasExpandedProgram = expandedPrograms.length > 0;

  // Dynamic header title
  const headerTitle = hasExpandedProgram ? 'Select Profile' : 'Select Program';

  // Filter programs by search query
  const filteredPrograms = useMemo(() => {
    if (!searchQuery.trim()) return programs;

    return programs
      .map(program => ({
        ...program,
        contacts: program.contacts.filter(contact =>
          (contact.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter(program => program.contacts.length > 0);
  }, [programs, searchQuery]);

  const toggleProgram = (programId: string) => {
    setExpandedPrograms(prev =>
      prev.includes(programId) ? prev.filter(id => id !== programId) : [...prev, programId]
    );
  };

  const handleBack = () => {
    router.back();
  };

  const handleSettingsPress = () => {
    openPinModal('settings');
  };

  const handleStudentPress = (student: AttendanceContact) => {
    setSelectedStudent(student);
    toggleAttendanceModal();
  };

  const showStudentImages = settings?.showStudentImages ?? true;

  return (
    <View style={styles.container}>
      {/* Blue Header */}
      <LinearGradient colors={['#4A7DFF', '#4A7DFF']} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          {/* Back Button Container */}
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Dynamic Title */}
          <Text style={styles.headerTitle}>{headerTitle}</Text>

          {/* Settings Button Container */}
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={handleSettingsPress}>
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A7DFF" />
        </View>
      ) : (
        /* Programs Accordion List */
        <FlatList
          data={filteredPrograms}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: program }) => {
            const isExpanded = expandedPrograms.includes(program.id);

            return (
              <View style={[styles.accordionItem, isExpanded && styles.accordionItemExpanded]}>
                {/* Accordion Header */}
                <TouchableOpacity
                  style={[styles.accordionHeader, isExpanded && styles.accordionHeaderExpanded]}
                  onPress={() => toggleProgram(program.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.accordionTitle}>{program.name}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {/* Accordion Content - Student Grid */}
                {isExpanded && (
                  <View style={styles.accordionContent}>
                    <View style={styles.studentGrid}>
                      {program.contacts.map(student => (
                        <StudentCard
                          key={student._id}
                          student={student}
                          showImage={showStudentImages}
                          onPress={() => handleStudentPress(student)}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="albums-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No programs available</Text>
            </View>
          }
        />
      )}

      {/* Modals */}
      {isAttendanceModalOpen && <AttendanceModal />}
      {isPinModalOpen && <KioskPinModal />}
      {isSettingsModalOpen && <KioskSettingsModal />}
    </View>
  );
}

// Helper function to group contacts by program
const getProgramBasedData = (dataList: AttendanceContact[]): ProgramAttendance[] => {
  const programData: ProgramAttendance[] = [];

  for (let index = 0; index < dataList.length; index++) {
    if (!programData.some(v => v.id === dataList[index].program)) {
      programData.push({
        name: dataList[index].programName,
        id: dataList[index].program,
        contacts: getProgramBasedContacts(dataList[index].program, dataList),
      });
    }
  }
  return programData;
};

const getProgramBasedContacts = (
  program: string,
  dataList: AttendanceContact[]
): AttendanceContact[] => {
  const contactsData: AttendanceContact[] = [];

  for (let index = 0; index < dataList.length; index++) {
    if (
      program === dataList[index].program &&
      !contactsData.some(v => v._id === dataList[index]._id)
    ) {
      contactsData.push({
        ...dataList[index],
        // API returns contactName, map it to name field (matches CRM pattern)
        name:
          (dataList[index] as unknown as { contactName?: string }).contactName ||
          dataList[index].name ||
          '',
        isPresent: dataList[index].todayPresent,
      });
    }
  }
  return contactsData;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12, // More balanced padding
    paddingTop: 8,
  },
  headerLeft: {
    alignItems: 'flex-start',
    width: 40,
  },
  headerRight: {
    alignItems: 'flex-end',
    width: 40,
  },
  iconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
    // Visual touch target
  },
  headerTitle: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: '#1F2937',
    flex: 1,
    fontSize: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  accordionItem: {
    marginBottom: 8,
  },
  accordionHeader: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  accordionTitle: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '500',
  },
  accordionContent: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    padding: 16,
  },
  studentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 12,
  },
  // Expanded state styles
  accordionItemExpanded: {
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  accordionHeaderExpanded: {
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderRadius: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 0,
  },
});
