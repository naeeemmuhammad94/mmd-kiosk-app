/**
 * Programs Screen - Accordion View
 * Single screen with all programs as accordions
 * Header changes: "Select Program" (collapsed) -> "Select Profile" (any expanded)
 * Matches Figma design
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
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
import { getResponsiveDimensions } from '@/theme/dimensions';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { CustomColors } from '@/theme';

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

  const { theme, customColors } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, customColors), [theme, customColors]);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<string[]>([]);

  // Fetch attendance data if not in store
  const {
    data: fetchedData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['getAttendance'],
    queryFn: () => {
      const today = new Date().toISOString().split('T')[0];
      return attendanceService.getAttendance({ startingDate: today });
    },
    select: response => getProgramBasedData(response.data?.allAttendance || []),
    enabled: isAuthenticated && attendanceData.length === 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Fetch settings
  const { data: settingsData } = useQuery({
    queryKey: ['getKioskSettings'],
    queryFn: () => attendanceService.getKioskSettingsByDojo(),
    select: response => response.data,
    enabled: isAuthenticated && !settings,
  });

  // Responsive Grid Calculation
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const isLandscape = screenWidth >= 1024;

  // Columns: 6 for iPad Landscape, 5 for Tablet, 3 for Mobile
  const numColumns = isLandscape ? 6 : isTablet ? 5 : 3;

  const dims = getResponsiveDimensions(isTablet);

  // Calculate dynamic card width
  // Account for nested padding: 16px (List) + 16px (Accordion Content) = 32px per side -> 64px total
  const totalHorizontalPadding = 64;
  const totalGap = dims.gridGap * (numColumns - 1);
  const availableWidth = screenWidth - totalHorizontalPadding;
  // Subtract a small buffer (2px) to prevent sub-pixel rounding issues causing line breaks
  const cardWidth = Math.max(80, Math.floor((availableWidth - totalGap - 2) / numColumns));

  useEffect(() => {
    if (fetchedData && attendanceData.length === 0) {
      setAttendanceData(fetchedData);
    }
  }, [fetchedData, attendanceData.length, setAttendanceData]);

  useEffect(() => {
    if (settingsData && !settings) {
      setSettings(settingsData);
    }
  }, [settingsData, settings, setSettings]);

  // Use fetched data or store data
  const programs = useMemo(
    () => (attendanceData.length > 0 ? attendanceData : fetchedData || []),
    [attendanceData, fetchedData]
  );

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
      <LinearGradient colors={[theme.colors.primary, theme.colors.primary]} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          {/* Back Button Container */}
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>

          {/* Dynamic Title */}
          <Text style={styles.headerTitle}>{headerTitle}</Text>

          {/* Settings Button Container */}
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={handleSettingsPress}>
              <Ionicons name="settings-outline" size={22} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={customColors.onSurfaceDisabled} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={customColors.onSurfaceDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={theme.dark ? theme.colors.onPrimary : theme.colors.primary}
          />
        </View>
      ) : (
        /* Programs Accordion List */
        <FlatList
          data={filteredPrograms}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.dark ? theme.colors.onPrimary : theme.colors.primary}
            />
          }
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
                    color={theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>

                {/* Accordion Content - Student Grid */}
                {isExpanded && (
                  <View style={styles.accordionContent}>
                    <View style={[styles.studentGrid, { gap: dims.gridGap }]}>
                      {program.contacts.map(student => (
                        <StudentCard
                          key={student._id}
                          student={student}
                          showImage={showStudentImages}
                          onPress={() => handleStudentPress(student)}
                          width={cardWidth}
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
              <Ionicons name="albums-outline" size={48} color={customColors.onSurfaceDisabled} />
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

const createStyles = (theme: MD3Theme, customColors: CustomColors) =>
  StyleSheet.create({
    accordionContent: {
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
      padding: 16,
    },
    accordionHeader: {
      alignItems: 'center',
      backgroundColor: customColors.surfaceDisabled,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    accordionHeaderExpanded: {
      borderBottomColor: theme.colors.outline,
      borderBottomWidth: 1,
      borderRadius: 0,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderWidth: 0,
    },
    accordionItem: {
      marginBottom: 8,
    },
    // Expanded state styles
    accordionItemExpanded: {
      borderColor: theme.colors.outline,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 12,
    },
    accordionTitle: {
      color: theme.colors.onSurface,
      fontSize: 15,
      fontWeight: '500',
    },
    container: {
      backgroundColor: theme.colors.surface,
      flex: 1,
    },
    emptyContainer: {
      alignItems: 'center',
      flex: 1,
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
    headerContent: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 12, // More balanced padding
      paddingHorizontal: 16,
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
    headerTitle: {
      color: theme.colors.onPrimary,
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    iconButton: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
      width: 40,
      // Visual touch target
    },
    listContent: {
      paddingBottom: 24,
      paddingHorizontal: 16,
    },
    loadingContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    searchContainer: {
      alignItems: 'center',
      backgroundColor: customColors.surfaceDisabled,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      height: 44,
      paddingHorizontal: 12,
    },
    searchInput: {
      color: theme.colors.onSurface,
      flex: 1,
      fontSize: 15,
    },
    searchWrapper: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    studentGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
  });
