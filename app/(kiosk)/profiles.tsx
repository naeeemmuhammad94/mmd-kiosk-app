/**
 * Select Profile Screen
 * Program accordion with student grids - matching Figma "Select Profile"
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useKioskStore } from '@/store/useKioskStore';
import { attendanceService } from '@/services/attendanceService';
import StudentCard from '@/components/kiosk/StudentCard';
import AttendanceModal from '@/components/kiosk/AttendanceModal';
import ConfirmModal from '@/components/kiosk/ConfirmModal';
import KioskPinModal from '@/components/kiosk/KioskPinModal';
import KioskSettingsModal from '@/components/kiosk/KioskSettingsModal';
import type { AttendanceContact, ProgramAttendance } from '@/types/attendance';

export default function SelectProfileScreen() {
    const router = useRouter();
    const { programId: initialProgramId } = useLocalSearchParams<{ programId?: string }>();
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
    } = useKioskStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPrograms, setExpandedPrograms] = useState<string[]>([]);

    // Expand initial program if passed
    useEffect(() => {
        if (initialProgramId) {
            setExpandedPrograms([initialProgramId]);
        }
    }, [initialProgramId]);

    // Filter programs by search query
    const filteredPrograms = (attendanceData || []).map((program) => ({
        ...program,
        contacts: program.contacts.filter((contact) =>
            (contact.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        ),
    })).filter((program) =>
        searchQuery.trim() === '' || program.contacts.length > 0
    );

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

    const toggleProgramExpanded = (programId: string) => {
        setExpandedPrograms((prev) =>
            prev.includes(programId)
                ? prev.filter((id) => id !== programId)
                : [...prev, programId]
        );
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

                    {/* Title */}
                    <Text style={styles.headerTitle}>Select Profile</Text>

                    {/* Settings Button */}
                    <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
                        <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </SafeAreaView>
            </LinearGradient>

            {/* Search Bar */}
            <View style={styles.searchSection}>
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

            {/* Programs Accordion */}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {filteredPrograms.map((program) => {
                    const isExpanded = expandedPrograms.includes(program.id);

                    return (
                        <View key={program.id} style={styles.programContainer}>
                            {/* Program Header */}
                            <TouchableOpacity
                                style={styles.programHeader}
                                onPress={() => toggleProgramExpanded(program.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.programName}>{program.name}</Text>
                                <Ionicons
                                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                                    size={20}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>

                            {/* Students Grid */}
                            {isExpanded && program.contacts.length > 0 && (
                                <View style={styles.studentsGrid}>
                                    {program.contacts.map((student) => (
                                        <StudentCard
                                            key={student._id}
                                            student={student}
                                            showImage={showStudentImages}
                                            onPress={() => handleStudentPress(student)}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}

                {filteredPrograms.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No profiles found</Text>
                    </View>
                )}
            </ScrollView>

            {/* Modals */}
            {isAttendanceModalOpen && <AttendanceModal />}
            {isPinModalOpen && <KioskPinModal />}
            {isSettingsModalOpen && <KioskSettingsModal />}
        </View>
    );
}

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
    searchSection: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    programContainer: {
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        overflow: 'hidden',
    },
    programHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
    },
    programName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1F2937',
    },
    studentsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: '#FAFAFA',
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 12,
    },
});
