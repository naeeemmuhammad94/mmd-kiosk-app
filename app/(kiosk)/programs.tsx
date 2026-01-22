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
    Dimensions,
} from 'react-native';
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
import ConfirmModal from '@/components/kiosk/ConfirmModal';
import KioskPinModal from '@/components/kiosk/KioskPinModal';
import KioskSettingsModal from '@/components/kiosk/KioskSettingsModal';
import type { AttendanceContact, ProgramAttendance } from '@/types/attendance';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Calculate columns for student grid
const getNumColumns = () => {
    if (SCREEN_WIDTH >= 1024) return 6;
    if (SCREEN_WIDTH >= 768) return 5;
    return 4;
};

export default function ProgramsScreen() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const {
        settings,
        attendanceData,
        setSelectedStudent,
        isAttendanceModalOpen,
        isConfirmModalOpen,
        isPinModalOpen,
        isSettingsModalOpen,
        toggleAttendanceModal,
        openPinModal,
        setAttendanceData,
        setSettings,
    } = useKioskStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPrograms, setExpandedPrograms] = useState<string[]>([]);
    const numColumns = getNumColumns();

    // Fetch attendance data if not in store
    const { data: fetchedData, isLoading } = useQuery({
        queryKey: ['getAttendance'],
        queryFn: () => {
            const today = new Date().toISOString().split('T')[0];
            return attendanceService.getAttendance({ startingDate: today });
        },
        select: (response) => getProgramBasedData(response.data?.allAttendance || []),
        enabled: isAuthenticated && attendanceData.length === 0,
    });

    // Fetch settings
    const { data: settingsData } = useQuery({
        queryKey: ['getKioskSettings'],
        queryFn: () => attendanceService.getKioskSettingsByDojo(),
        select: (response) => response.data,
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

        return programs.map((program) => ({
            ...program,
            contacts: program.contacts.filter((contact) =>
                (contact.name || '').toLowerCase().includes(searchQuery.toLowerCase())
            ),
        })).filter((program) => program.contacts.length > 0);
    }, [programs, searchQuery]);

    const toggleProgram = (programId: string) => {
        setExpandedPrograms((prev) =>
            prev.includes(programId)
                ? prev.filter((id) => id !== programId)
                : [...prev, programId]
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
            <LinearGradient
                colors={['#4A7DFF', '#4A7DFF']}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Dynamic Title */}
                    <Text style={styles.headerTitle}>{headerTitle}</Text>

                    {/* Settings Button */}
                    <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
                        <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
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
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item: program }) => {
                        const isExpanded = expandedPrograms.includes(program.id);

                        return (
                            <View style={[
                                styles.accordionItem,
                                isExpanded && styles.accordionItemExpanded,
                            ]}>
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
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>

                                {/* Accordion Content - Student Grid */}
                                {isExpanded && (
                                    <View style={styles.accordionContent}>
                                        <View style={styles.studentGrid}>
                                            {program.contacts.map((student) => (
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
        if (!programData.some((v) => v.id === dataList[index].program)) {
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
            !contactsData.some((v) => v._id === dataList[index]._id)
        ) {
            contactsData.push({
                ...dataList[index],
                // API returns contactName, map it to name field (matches CRM pattern)
                name: (dataList[index] as any).contactName || dataList[index].name || '',
                isPresent: dataList[index].todayPresent,
            });
        }
    }
    return contactsData;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingBottom: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: 12,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    settingsButton: {
        position: 'absolute',
        right: 16,
        top: 12,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 12,
        height: 44,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    accordionItem: {
        marginBottom: 8,
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    accordionTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1F2937',
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
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 12,
    },
    // Expanded state styles
    accordionItemExpanded: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        marginBottom: 12,
    },
    accordionHeaderExpanded: {
        borderRadius: 0,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderWidth: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
});
