import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Image,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
// useRouter removed (unused)
import { useAuthStore } from '@/store/useAuthStore';
import { useKioskStore } from '@/store/useKioskStore';
import { attendanceService } from '@/services/attendanceService';
import StudentCard from '@/components/kiosk/StudentCard';
import AttendanceModal from '@/components/kiosk/AttendanceModal';
import KioskSettingsModal from '@/components/kiosk/KioskSettingsModal';
import KioskPinModal from '@/components/kiosk/KioskPinModal';

// Assets
// Unused icons removed

// Removed KioskLogoIcon as per request to use arrow
import type { AttendanceContact, ProgramAttendance } from '@/types/attendance';
import { getResponsiveDimensions } from '@/theme/dimensions';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { CustomColors } from '@/theme';

// Calculate columns based on screen width for responsive grid
// Mobile (<768px): 3 columns, Tablet (>=768px): 5
// UPDATED: Max columns is 5 to match Figma
const getNumColumns = (width: number) => {
  if (width >= 768) return 5; // iPad / Tablet
  return 3; // Mobile - user requirement: fit 3 cards per row
};

// Memoized StudentCard wrapper
const MemoizedStudentCard = memo(StudentCard);

export default function KioskHomeScreen() {
  // Router unused
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const numColumns = getNumColumns(screenWidth);
  const dims = getResponsiveDimensions(isTablet);

  const { theme, customColors } = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme, customColors, isTablet),
    [theme, customColors, isTablet]
  );

  // Calculate dynamic card width to fill screen available width
  // This ensures no right-side gap and proper 3-column layout
  // FIX: Search view has 48px padding on tablet, so we must account for that in grid calculation
  // to prevent grid disturbance when searching.
  const containerPadding = isTablet ? 48 : dims.gridPadding;
  const listPadding = dims.gridPadding;
  const totalHorizontalPadding = containerPadding * 2 + listPadding * 2;
  const totalGap = dims.gridGap * (numColumns - 1);
  // Subtract extra buffer (4px) to account for Accordion borders (2px) and potential sub-pixel rounding
  // This ensures 5 columns fit perfectly without wrapping
  const availableWidth = screenWidth - totalHorizontalPadding - 4;
  const cardWidth = Math.floor((availableWidth - totalGap) / numColumns);

  // Accordion calculation (more padding on mobile)
  // Accordion Padding:
  // - Outer FlatList: isTablet ? 48 : 8 (was 16)
  // - Inner Content: isTablet ? 16 : 8 (was 16)
  // Total Horizontal Padding = (isTablet ? 48*2 : 8*2) + (isTablet ? 32 : 16)
  const accordionOuterPadding = isTablet ? 96 : 16; // 48*2 vs 8*2
  const accordionInnerPadding = isTablet ? 32 : 16; // 16*2 vs 8*2
  const accordionTotalPadding = accordionOuterPadding + accordionInnerPadding;
  const accordionAvailableWidth = screenWidth - accordionTotalPadding - 4;
  const accordionCardWidth = Math.floor((accordionAvailableWidth - totalGap) / numColumns);

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
  const [isProgramView, setIsProgramView] = useState(false);
  const [expandedPrograms, setExpandedPrograms] = useState<string[]>([]);

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
    setIsProgramView(prev => !prev);
  }, []);

  const toggleProgram = useCallback((programId: string) => {
    setExpandedPrograms(prev =>
      prev.includes(programId) ? prev.filter(id => id !== programId) : [...prev, programId]
    );
  }, []);

  // Filter programs by search query (for Accordion View)
  const filteredPrograms = useMemo(() => {
    if (!attendanceData) return [];
    const programsData = getProgramBasedData(
      attendanceData.length > 0 ? attendanceData.flatMap(p => p.contacts) : []
    );

    if (!debouncedSearch.trim()) return programsData;

    return programsData
      .map(program => ({
        ...program,
        contacts: program.contacts.filter(contact =>
          (contact.name || '').toLowerCase().includes(debouncedSearch.toLowerCase())
        ),
      }))
      .filter(program => program.contacts.length > 0);
  }, [attendanceData, debouncedSearch]);

  // Auto-expand programs when searching
  useEffect(() => {
    if (debouncedSearch.trim()) {
      const allProgramIds = filteredPrograms.map(p => p.id);
      setExpandedPrograms(allProgramIds);
    }
  }, [debouncedSearch, filteredPrograms]);

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
      {/* Dark Header with Radius */}
      <LinearGradient
        colors={
          theme.dark
            ? [customColors.backgroundAlt, customColors.backgroundAlt]
            : [theme.colors.primary, theme.colors.primary]
        }
        style={styles.header}
      >
        <SafeAreaView
          edges={['top']}
          style={[
            styles.headerContent,
            isTablet && styles.headerContentTablet,
            // ALIGNMENT FIX: Sync header padding with grid logic
            // Grid content starts at: containerPadding + listPadding
            {
              paddingHorizontal: (isTablet ? 48 : dims.gridPadding) + dims.gridPadding,
            },
          ]}
        >
          {/* Left: Kiosk Brand Mark */}
          <View style={styles.brandContainer}>
            <TouchableOpacity style={styles.brandPill} onPress={handleRefresh} activeOpacity={0.7}>
              {/* Logo: PNG with TintColor */}
              <Image
                source={require('../../assets/logo.png')}
                style={{
                  width: isTablet ? 24 : 20, // Smaller logo on mobile
                  height: isTablet ? 24 : 20,
                  marginRight: 8,
                  tintColor: theme.dark ? theme.colors.onSurface : theme.colors.primary,
                }} // Figma Blue in Light Mode, White in Dark
                resizeMode="contain"
              />
              <Text style={styles.brandText}>KIOSK</Text>
            </TouchableOpacity>
          </View>

          {/* Center: Search Bar */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search........."
                placeholderTextColor={customColors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Right Actions: Grid Toggle & Settings */}
          <View style={styles.headerActions}>
            {/* Grid Toggle - Navigates to Programs */}
            <TouchableOpacity style={styles.iconButton} onPress={handleAllProgramsPress}>
              <Ionicons
                name="grid-outline"
                size={22}
                color={theme.dark ? theme.colors.onPrimary : theme.colors.primary}
              />
            </TouchableOpacity>

            {/* Settings Button */}
            <TouchableOpacity style={styles.iconButton} onPress={handleSettingsPress}>
              <Ionicons
                name="settings-outline"
                size={22}
                color={theme.dark ? theme.colors.onPrimary : theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Searched Results Label */}
      {/* Searched Results Label (Grid View) */}
      {isSearching && !isProgramView && (
        <View
          style={[
            styles.searchResultsLabelContainer,
            isTablet ? styles.paddingTablet : styles.paddingMobile,
          ]}
        >
          <View style={[styles.searchResultsLabel, styles.rowCenter]}>
            <Text style={styles.searchResultsText}>Search Results</Text>
          </View>
        </View>
      )}

      {/* Searched Results Label (Program View) - Simple Text */}
      {isSearching && isProgramView && (
        <View
          style={[
            styles.programSearchLabelContainer,
            isTablet ? styles.paddingTablet : styles.paddingMobile,
          ]}
        >
          <Text style={styles.programSearchLabelText}>Search Results</Text>
        </View>
      )}

      {/* Main Content Area 
                - Render wrapper even during loading to maintain layout structure 
                - Loader placed inside the card/grid view
            */}
      <View
        style={
          isSearching && !isProgramView
            ? [
                styles.searchResultsContainer,
                isTablet ? styles.paddingTablet : styles.paddingMobile,
              ]
            : styles.gridWrapper
        }
      >
        <View
          style={isSearching && !isProgramView ? styles.searchResultsCard : styles.fullWidthGrid}
        >
          {/* Loader - Centered in remaining space 
                        Only show during initial load (isLoading). 
                        Background fetches (isFetching) should remain silent to avoid UI disruption during check-in.
                    */}
          {isLoading && (
            <View style={styles.centeredLoaderContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}

          {/* Student Grid OR Accordion */}
          {!isLoading &&
            (isProgramView ? (
              /* Accordion View (Copied logic from programs.tsx to match exact styling) */
              <FlatList
                data={filteredPrograms}
                keyExtractor={item => item.id}
                contentContainerStyle={[
                  styles.listContent,
                  { paddingHorizontal: isTablet ? 48 : 8, paddingTop: 32 },
                ]}
                renderItem={({ item: program }) => {
                  const isExpanded = expandedPrograms.includes(program.id);
                  return (
                    <View
                      style={[styles.accordionItem, isExpanded && styles.accordionItemExpanded]}
                    >
                      {/* Accordion Header */}
                      <TouchableOpacity
                        style={[
                          styles.accordionHeader,
                          isExpanded && styles.accordionHeaderExpanded,
                        ]}
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
                              <View key={student._id} style={{ width: accordionCardWidth }}>
                                <MemoizedStudentCard
                                  student={student}
                                  showImage={settings?.showStudentImages ?? true}
                                  onPress={() => handleStudentPress(student)}
                                  width={accordionCardWidth}
                                />
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name="albums-outline"
                      size={48}
                      color={customColors.onSurfaceDisabled}
                    />
                    <Text style={styles.emptyText}>No programs available</Text>
                  </View>
                }
              />
            ) : (
              /* Flat Grid View (Unchanged) */
              <FlatList
                data={filteredStudents}
                keyExtractor={keyExtractor}
                numColumns={numColumns}
                key={numColumns} // Force re-render on column change
                contentContainerStyle={[
                  styles.gridContent,
                  !isSearching && styles.gridPadding, // Only add extra bottom padding when NOT searching
                  {
                    paddingHorizontal: isSearching
                      ? dims.gridPadding
                      : containerPadding + listPadding,
                    paddingTop: dims.gridPadding,
                    // If searching, add a small bottom padding to match top
                    paddingBottom: isSearching ? dims.gridPadding : undefined,
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
            ))}
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

const createStyles = (theme: MD3Theme, customColors: CustomColors, isTablet: boolean) =>
  StyleSheet.create({
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
      backgroundColor: theme.colors.background,
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

    brandContainer: {
      // Flex to 0 to take minimum space
      marginRight: isTablet ? 16 : 8,
    },
    brandPill: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface, // Pure White in Light Mode
      borderRadius: isTablet ? 12 : 8, // Smaller on mobile
      flexDirection: 'row',
      height: isTablet ? 48 : 40, // 40px on mobile
      paddingHorizontal: isTablet ? 16 : 10,
      borderWidth: 1,
      borderColor: theme.dark ? '#3B82F6' : 'transparent', // Blueish border/glow in Dark
      shadowColor: '#3B82F6', // Blue glow
      shadowOffset: { width: 0, height: 4 }, // Push shadow down
      shadowOpacity: theme.dark ? 0.6 : 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    brandText: {
      color: theme.dark ? theme.colors.onSurface : theme.colors.primary, // White in Dark, Blue in Light
      fontSize: isTablet ? 16 : 14,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    header: {
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      paddingBottom: isTablet ? 24 : 12, // More space at bottom
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: isTablet ? 12 : 8, // Reduced gap
    },
    headerContent: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: isTablet ? 12 : 12,
      // paddingHorizontal handled via inline style for alignment
    },
    headerContentTablet: {
      paddingTop: 48,
    },
    iconButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: isTablet ? 12 : 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      height: isTablet ? 48 : 40, // 40px on mobile
      justifyContent: 'center',
      width: isTablet ? 48 : 40, // 40px on mobile
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 4 }, // Push shadow down
      shadowOpacity: theme.dark ? 0.4 : 0.3,
      shadowRadius: 8,
      elevation: 4,
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
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    programButtonText: {
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    programSearchLabelContainer: {
      paddingTop: 24, // Spacing above
      paddingBottom: 8, // Spacing below
    },
    programSearchLabelText: {
      color: theme.colors.onSurface,
      fontSize: 18,
      fontWeight: '700',
    },
    rowCenter: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    searchWrapper: {
      flex: 1,
      maxWidth: 600,
      paddingHorizontal: isTablet ? 24 : 8, // Reduced gap on mobile
    },
    searchContainer: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: isTablet ? 100 : 8, // Smaller radius on mobile usually, but keeping pill if preferred? Request said 8-10px.
      // Correction: User requested "Border Radius: Adjust to 8px or 10px".
      // But search input was pill (100).
      // Let's use 8px for mobile as per request.
      borderWidth: 1,
      borderColor: theme.colors.outline,
      flexDirection: 'row',
      gap: 8,
      height: isTablet ? 48 : 40, // 40px on mobile
      paddingHorizontal: isTablet ? 16 : 10,
      width: '100%',
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 4 }, // Push shadow down
      shadowOpacity: theme.dark ? 0.4 : 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    searchInput: {
      color: theme.colors.onSurface, // Text stays dark (on white bg)
      flex: 1,
      fontSize: 14,
    },

    searchResultsCard: {
      backgroundColor: theme.dark ? theme.colors.background : theme.colors.surface, // Dark #0C111D
      borderColor: 'transparent',
      borderWidth: 0,
      borderTopWidth: 0, // Merge with label
      borderTopLeftRadius: 0, // Ensure flat top
      borderTopRightRadius: 0,
      marginTop: 0, // Ensure no gap
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      // flex: 1 removed to allow shrinking to content
      flexShrink: 1, // Ensure it doesn't overflow container
      // minHeight: 200 removed
      // Shadow
      shadowColor: customColors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.dark ? 0.5 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    searchResultsContainer: {
      backgroundColor: 'transparent', // Transparent to show background
      flex: 1,
      paddingHorizontal: 16, // Fix: Match grid padding
    },
    searchResultsLabel: {
      backgroundColor: theme.dark ? theme.colors.surface : theme.colors.primary, // Dark mode matches accordion header
      borderColor: 'transparent',
      borderWidth: 0,
      borderBottomWidth: 0, // Merge with card
      borderBottomLeftRadius: 0, // Ensure flat bottom
      borderBottomRightRadius: 0,
      marginBottom: 0, // Ensure no gap
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      zIndex: 1, // Ensure matches card
      // Shadow
      shadowColor: customColors.shadow,
      shadowOffset: { width: 0, height: -2 }, // Slight shadow up
      shadowOpacity: theme.dark ? 0.5 : 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    searchResultsLabelContainer: {
      backgroundColor: 'transparent', // Remove background color to blend with screen
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    searchResultsText: {
      color: '#FFFFFF', // White text always
      fontSize: 14,
      fontWeight: '600',
    },

    // Accordion Styles (Copied from programs.tsx)
    listContent: {
      paddingBottom: 100,
    },
    accordionItem: {
      marginBottom: 16, // Increased spacing between items
    },
    accordionItemExpanded: {
      borderColor: theme.colors.outline, // Dark border #717171
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 16,
    },
    accordionHeader: {
      alignItems: 'center',
      backgroundColor: customColors.backgroundAlt, // Dark #161B26
      borderColor: theme.colors.outline, // Dark #717171
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 24,
    },
    accordionHeaderExpanded: {
      backgroundColor: customColors.backgroundAlt,
      // borderBottomColor removed as per request
      borderBottomWidth: 0, // Removed border bottom
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderWidth: 0,
    },
    accordionTitle: {
      color: theme.colors.onSurface, // White in dark mode
      fontSize: 15,
      fontWeight: '600',
    },
    accordionContent: {
      backgroundColor: theme.dark ? theme.colors.background : theme.colors.surface, // Dark #0C111D
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
      padding: isTablet ? 16 : 8, // Reduced inner padding for mobile
    },

    studentGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      // gap handled inline
    },
  });
