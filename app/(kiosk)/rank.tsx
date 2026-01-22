/**
 * Rank Screen
 * Select rank dropdown with student list - matching Figma Rank design
 */

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native';
import { Text, Avatar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useKioskStore } from '@/store/useKioskStore';
import AttendanceModal from '@/components/kiosk/AttendanceModal';
import ConfirmModal from '@/components/kiosk/ConfirmModal';
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
        isConfirmModalOpen,
        isPinModalOpen,
        isSettingsModalOpen,
        toggleAttendanceModal,
        openPinModal,
    } = useKioskStore();

    const [selectedRank, setSelectedRank] = useState<string | null>(null);
    const [showRankDropdown, setShowRankDropdown] = useState(false);

    // Get all unique ranks from contacts
    const allContacts = (attendanceData || []).flatMap((program) => program.contacts);
    const uniqueRanks = [...new Set(allContacts.map((c) => c.rankName).filter(Boolean))];

    // Filter contacts by selected rank
    const filteredContacts = selectedRank
        ? allContacts.filter((c) => c.rankName === selectedRank)
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
            <LinearGradient
                colors={['#4A7DFF', '#4A7DFF']}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Title with Rank Dropdown */}
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerSubtitle}>Select rank</Text>
                        <TouchableOpacity
                            style={styles.rankDropdown}
                            onPress={() => setShowRankDropdown(true)}
                        >
                            <Text style={styles.rankText}>
                                {selectedRank || 'All Ranks'}
                            </Text>
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
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.studentRow}
                        onPress={() => handleStudentPress(item)}
                        activeOpacity={0.7}
                    >
                        {/* Avatar */}
                        {showStudentImages && item.profilePicURL ? (
                            <Avatar.Image
                                size={44}
                                source={{ uri: item.profilePicURL }}
                            />
                        ) : (
                            <Avatar.Text
                                size={44}
                                label={(item.name || 'U').charAt(0)}
                                style={styles.avatar}
                            />
                        )}

                        {/* Info */}
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>{item.name || 'Unknown'}</Text>
                            <Text style={styles.studentProgram}>{item.programName}</Text>
                        </View>

                        {/* Status */}
                        <View
                            style={[
                                styles.statusIcon,
                                item.isPresent ? styles.statusGreen : styles.statusRed,
                            ]}
                        >
                            <Ionicons
                                name={item.isPresent ? 'checkmark' : 'close'}
                                size={14}
                                color="#FFFFFF"
                            />
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
                                style={[
                                    styles.dropdownItem,
                                    !selectedRank && styles.dropdownItemSelected,
                                ]}
                                onPress={() => handleRankSelect(null)}
                            >
                                <Text style={styles.dropdownItemText}>All Ranks</Text>
                                {!selectedRank && (
                                    <Ionicons name="checkmark" size={20} color="#4A7DFF" />
                                )}
                            </TouchableOpacity>

                            {/* Individual Ranks */}
                            {uniqueRanks.map((rank) => (
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
                                        <Ionicons name="checkmark" size={20} color="#4A7DFF" />
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
    headerCenter: {
        alignItems: 'center',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    rankDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rankText: {
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
    listContent: {
        padding: 16,
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    avatar: {
        backgroundColor: '#4A7DFF',
    },
    studentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    studentName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    studentProgram: {
        fontSize: 13,
        color: '#6B7280',
    },
    statusIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusGreen: {
        backgroundColor: '#22C55E',
    },
    statusRed: {
        backgroundColor: '#EF4444',
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
    dropdownOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        width: '80%',
        maxWidth: 360,
        maxHeight: '60%',
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemSelected: {
        backgroundColor: '#EFF6FF',
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#1F2937',
    },
});
