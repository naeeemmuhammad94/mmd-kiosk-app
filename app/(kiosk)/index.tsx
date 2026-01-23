import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useKioskStore } from '@/store/useKioskStore';
import { attendanceService } from '@/services/attendanceService';
import StudentCard from '@/components/kiosk/StudentCard';
import AttendanceModal from '@/components/kiosk/AttendanceModal';
import KioskSettingsModal from '@/components/kiosk/KioskSettingsModal';
import KioskPinModal from '@/components/kiosk/KioskPinModal';
import ArrowOutlined from '../../assets/weui_arrow-outlined.svg';
import type { AttendanceContact, ProgramAttendance } from '@/types/attendance';
import { getResponsiveDimensions } from '@/theme/dimensions';
import { lightTheme as theme, customColors } from '@/theme';

// Calculate columns based on screen width for responsive grid
// Mobile (<768px): 3 columns, Tablet (>=768px): 5, iPad Landscape (>=1024px): 6
const getNumColumns = (width: number) => {
  if (width >= 1024) return 6; // iPad Pro Landscape
  if (width >= 768) return 5; // iPad Portrait / Tablet
  return 3; // Mobile - user requirement: fit 3 cards per row
};

// Memoized StudentCard wrapper
const MemoizedStudentCard = memo(StudentCard);

export default function KioskHomeScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const numColumns = getNumColumns(screenWidth);
  const dims = getResponsiveDimensions(isTablet);

  // Calculate dynamic card width to fill screen available width
  // This ensures no right-side gap and proper 3-column layout
  // FIX: Search view has 48px padding on tablet, so we must account for that in grid calculation
  // to prevent grid disturbance when searching.
  const containerPadding = isTablet ? 48 : dims.gridPadding;
  const listPadding = dims.gridPadding;
  const totalHorizontalPadding = containerPadding * 2 + listPadding * 2;
  const totalGap = dims.gridGap * (numColumns - 1);
  const availableWidth = screenWidth - totalHorizontalPadding;
  const cardWidth = Math.floor((availableWidth - totalGap) / numColumns);

  const {
    setAttendanceData,
    setSettings,
    setSelectedStudent,
    isSettingsModalOpen,
    isAttendanceModalOpen,
    isPinModalOpen,
    toggleAttendanceModal,
    openPinModal,
    settings,
  } = useKioskStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounce search for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { isAuthenticated } = useAuthStore();

  // Fetch attendance data
  const {
    data: attendanceData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['getAttendance'],
    queryFn: () => {
      const today = new Date().toISOString().split('T')[0];
      return attendanceService.getAttendance({ startingDate: today });
    },
    select: response => getProgramBasedData(response.data?.allAttendance || []),
    staleTime: 30000, // Cache for 30 seconds
    enabled: isAuthenticated,
  });

  // Fetch kiosk settings
  const { data: settingsData } = useQuery({
    queryKey: ['getKioskSettings'],
    queryFn: () => attendanceService.getKioskSettingsByDojo(),
    select: response => response.data,
    staleTime: 60000, // Cache for 1 minute
    enabled: isAuthenticated,
  });

  // Update store when data changes
  useEffect(() => {
    if (attendanceData) {
      setAttendanceData(attendanceData);
    }
  }, [attendanceData, setAttendanceData]);

  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData, setSettings]);

  // Get all students from all programs
  const allStudents = useMemo(() => {
    if (!attendanceData) return [];
    const students: AttendanceContact[] = [];
    attendanceData.forEach((program: ProgramAttendance) => {
      students.push(...program.contacts);
    });
    return students;
  }, [attendanceData]);

  // Filter by debounced search query
  const filteredStudents = useMemo(() => {
    if (!debouncedSearch.trim()) return allStudents;
    const lowerSearch = debouncedSearch.toLowerCase();
    return allStudents.filter(student => (student.name || '').toLowerCase().includes(lowerSearch));
  }, [allStudents, debouncedSearch]);

  const isSearching = debouncedSearch.trim().length > 0;

  // Stable callbacks
  const handleStudentPress = useCallback(
    (student: AttendanceContact) => {
      setSelectedStudent(student);
      toggleAttendanceModal();
    },
    [setSelectedStudent, toggleAttendanceModal]
  );

  const handleAllProgramsPress = useCallback(() => {
    router.push('/(kiosk)/programs');
  }, [router]);

  const handleSettingsPress = useCallback(() => {
    openPinModal('settings');
  }, [openPinModal]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // Optimized renderItem
  const renderItem = useCallback(
    ({ item }: { item: AttendanceContact }) => (
      <MemoizedStudentCard
        student={item}
        showImage={settings?.showStudentImages ?? true}
        onPress={() => handleStudentPress(item)}
        width={cardWidth}
      />
    ),
    [settings?.showStudentImages, handleStudentPress, cardWidth]
  );

  const keyExtractor = useCallback((item: AttendanceContact) => item._id, []);

  return (
    <View style={styles.container}>
      {/* Blue Header */}
      <LinearGradient colors={[theme.colors.primary, theme.colors.primary]} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={customColors.onSurfaceDisabled} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={customColors.onSurfaceDisabled}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          {/* Right Actions */}
          <View style={styles.headerActions}>
            {/* All Programs Button */}
            <TouchableOpacity style={styles.programButton} onPress={handleAllProgramsPress}>
              <Text style={styles.programButtonText}>All Programs</Text>
              <ArrowOutlined width={18} height={18} color={theme.colors.primary} />
            </TouchableOpacity>

            {/* Refresh Button */}
            <TouchableOpacity style={styles.iconButton} onPress={handleRefresh}>
              <Ionicons name="refresh-outline" size={22} color={theme.colors.primary} />
            </TouchableOpacity>

            {/* Settings Button */}
            <TouchableOpacity style={styles.iconButton} onPress={handleSettingsPress}>
              <Ionicons name="settings-outline" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Searched Results Label */}
      {isSearching && (
        <View
          style={[
            styles.searchResultsLabelContainer,
            isTablet ? styles.paddingTablet : styles.paddingMobile,
          ]}
        >
          <View style={[styles.searchResultsLabel, styles.rowCenter]}>
            <Text style={styles.searchResultsText}>Searched Results</Text>
          </View>
        </View>
      )}

      {/* Main Content Area 
                - Render wrapper even during loading to maintain layout structure 
                - Loader placed inside the card/grid view
            */}
      <View
        style={
          isSearching
            ? [
                styles.searchResultsContainer,
                isTablet ? styles.paddingTablet : styles.paddingMobile,
              ]
            : styles.gridWrapper
        }
      >
        <View style={isSearching ? styles.searchResultsCard : styles.fullWidthGrid}>
          {/* Loader - Centered in remaining space 
                        Only show during initial load (isLoading). 
                        Background fetches (isFetching) should remain silent to avoid UI disruption during check-in.
                    */}
          {isLoading && (
            <View style={styles.centeredLoaderContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}

          {/* Student Grid */}
          {!isLoading && (
            <FlatList
              data={filteredStudents}
              keyExtractor={keyExtractor}
              numColumns={numColumns}
              key={numColumns}
              contentContainerStyle={[
                styles.gridContent,
                styles.gridPadding,
                {
                  paddingHorizontal: isSearching
                    ? dims.gridPadding
                    : containerPadding + listPadding,
                  paddingTop: dims.gridPadding,
                },
              ]}
              columnWrapperStyle={[
                styles.columnWrapper,
                { gap: dims.gridGap, marginBottom: dims.gridGap },
              ]}
              removeClippedSubviews={true}
              maxToRenderPerBatch={20}
              windowSize={10}
              initialNumToRender={20}
              getItemLayout={undefined}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={theme.colors.primary}
                />
              }
              renderItem={renderItem}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="people-outline"
                    size={48}
                    color={customColors.onSurfaceDisabled}
                  />
                  <Text style={styles.emptyText}>
                    {isSearching
                      ? 'No students found matching your search'
                      : 'No students to display'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      {/* Modals */}
      {isAttendanceModalOpen && <AttendanceModal />}
      {isSettingsModalOpen && <KioskSettingsModal />}

      {/* Helper: Only render PIN modal at root if Settings is NOT open. 
                If Settings IS open, it handles rendering PIN modal nested inside itself. */}
      {isPinModalOpen && !isSettingsModalOpen && <KioskPinModal />}
    </View>
  );
}

// Helper function to group contacts by program (from CRM)
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
  centeredLoaderContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 200,
  },
  columnWrapper: {
    justifyContent: 'flex-start', // Force left alignment
    // gap and marginBottom set dynamically inline
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
    textAlign: 'center',
  },
  fullWidthGrid: {
    flex: 1,
    width: '100%',
  },
  gridContent: {
    width: '100%',
  },
  gridPadding: {
    paddingBottom: 100,
  },
  gridWrapper: {
    flex: 1,
    width: '100%',
  },
  header: {
    paddingBottom: 16,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  headerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  paddingMobile: {
    paddingHorizontal: 16,
  },
  paddingTablet: {
    paddingHorizontal: 48,
  },
  programButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  programButtonText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  rowCenter: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: theme.colors.onSurface,
    flex: 1,
    fontSize: 15,
  },

  searchResultsCard: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    flex: 1,
    minHeight: 200,
  },
  searchResultsContainer: {
    backgroundColor: customColors.surfaceDisabled, // Fallback for light blue bg
    flex: 1,
    paddingHorizontal: 16, // Fix: Match grid padding
  },
  searchResultsLabel: {
    backgroundColor: theme.colors.primary, // Blue header to match theme
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchResultsLabelContainer: {
    backgroundColor: customColors.surfaceDisabled,
    paddingHorizontal: 16,
    paddingTop: 8, // Fix: Match grid padding
  },
  searchResultsText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
});
