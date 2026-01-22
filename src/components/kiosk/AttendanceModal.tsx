import React from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { Text, Avatar, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useKioskStore } from '@/store/useKioskStore';
import { attendanceService } from '@/services/attendanceService';
import ConfirmModal from './ConfirmModal';
import moment from 'moment';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

export default function AttendanceModal() {
    const queryClient = useQueryClient();
    const {
        selectedStudent,
        settings,
        toggleAttendanceModal,
        toggleConfirmModal,
        setConfirmType,
        isConfirmModalOpen,
    } = useKioskStore();

    // Mark attendance API call
    const { mutate: markAttendance, isPending } = useMutation({
        mutationKey: ['markKioskAttendance'],
        mutationFn: (present: boolean) => {
            if (!selectedStudent) throw new Error('No student selected');

            const payload = {
                id: selectedStudent._id,
                contact: selectedStudent.contact,
                rank: selectedStudent.rank,
                program: selectedStudent.program,
                classSlot: selectedStudent.classSlot,
                date: moment().format('ddd, DD MMM YYYY, hh:mm:ss A'),
                present,
                startTime: '',
                endTime: '',
                day: '',
            };

            return attendanceService.markKioskAttendance(selectedStudent._id, payload);
        },
        onSuccess: (_, present) => {
            if (__DEV__) {
                console.log('=== CHECK IN/OUT SUCCESS ===');
            }
            queryClient.invalidateQueries({ queryKey: ['getAttendance'] });

            // Set confirmation type and show overlay (embedded ConfirmModal)
            setConfirmType(present ? 'checkIn' : 'checkOut');
            toggleConfirmModal();
            // Note: AttendanceModal remains mounted and visible underneath
        },
        onError: (error) => {
            console.log('=== CHECK IN/OUT ERROR ===', error);
        },
    });

    const handleClose = () => {
        // If confirm modal is open, closing attendance modal should close everything
        if (isConfirmModalOpen) {
            toggleConfirmModal(); // Close confirm
        }
        toggleAttendanceModal(); // Close attendance
    };

    const handleCheckInOut = () => {
        const newPresentState = !selectedStudent?.isPresent;
        markAttendance(newPresentState);
    };

    if (!selectedStudent) return null;

    // Handle null, undefined, and empty string
    const studentName = (selectedStudent.name && selectedStudent.name.length > 0)
        ? selectedStudent.name
        : 'Unknown';
    const showStudentImages = settings?.showStudentImages ?? true;
    const isCheckedIn = selectedStudent.isPresent;

    return (
        <Modal visible={true} animationType="fade" transparent>
            <View style={styles.overlay}>
                {/* 
                   Constraint container for max width on tablets 
                   Structure: Overlay -> Constraints -> Modal Card
                */}
                <View style={styles.constraintContainer}>
                    <View style={styles.modalContainer}>
                        {/* Blue Header */}
                        <LinearGradient
                            colors={['#4A7DFF', '#4A7DFF']} // Solid Blue as per design
                            style={styles.header}
                        >
                            <Text style={styles.headerTitle}>Attendance</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                                <Ionicons name="close" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </LinearGradient>

                        {/* Content */}
                        <View style={styles.content}>
                            {/* Profile Image - Larger and with yellow border treatment if needed, though Figma shows simple square/rounded */}
                            <View style={styles.profileSection}>
                                {showStudentImages && selectedStudent.profilePicURL ? (
                                    <View style={styles.imageContainer}>
                                        <Image
                                            source={{ uri: selectedStudent.profilePicURL }}
                                            style={styles.profileImage}
                                        />
                                    </View>
                                ) : (
                                    <Avatar.Text
                                        size={100}
                                        label={studentName.charAt(0).toUpperCase()}
                                        style={styles.avatar}
                                    />
                                )}
                                <Text style={styles.studentName}>{studentName}</Text>
                            </View>

                            {/* Info Rows - List style */}
                            <View style={styles.infoSection}>
                                <InfoRow
                                    icon="grid-outline"
                                    label="Program"
                                    value={selectedStudent.programName || 'N/A'}
                                />
                                <InfoRow
                                    icon="ribbon-outline"
                                    label="Rank"
                                    value={selectedStudent.rankName || 'N/A'}
                                    valueColor={selectedStudent.rankColor} // Use rank color only for text if needed
                                    isRank
                                />
                                <InfoRow
                                    icon="time-outline"
                                    label="Class Time"
                                    value={`${moment().format('h:mm')} - ${moment().add(1, 'hour').format('h:mm A')}`} // Mocking duration for UI match
                                />
                                <InfoRow
                                    icon="calendar-outline"
                                    label="Attendance"
                                    value={`${selectedStudent.totalPresentCount || 0}/${selectedStudent.totalClasses || 0}`}
                                />
                            </View>

                            {/* Check In/Out Button - Full Width */}
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    // isCheckedIn ? styles.checkOutButton : styles.checkInButton, // Design uses Blue for Check In, Blue for Check Out in screenshot 3? Or Red? Screenshot 3 shows "Check Out" in Blue. Let's stick to Blue as per Screenshot 3.
                                    isPending && styles.actionButtonDisabled,
                                ]}
                                onPress={handleCheckInOut}
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.actionButtonText}>
                                        {isCheckedIn ? 'Check Out' : 'Check In'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* 
                           Confirm Overlay - Embedded absolutely inside the modal container.
                           This ensures it sits ON TOP of the attendance content but INSIDE the modal.
                        */}
                        {isConfirmModalOpen && <ConfirmModal />}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// Info Row Component
interface InfoRowProps {
    icon: string;
    label: string;
    value: string;
    valueColor?: string;
    isRank?: boolean;
}

function InfoRow({ icon, label, value, valueColor, isRank }: InfoRowProps) {
    return (
        <View style={styles.infoRow}>
            {/* Left side: Icon (+ bg) and Label */}
            <View style={styles.infoLeft}>
                {/* Icon Container could be styled if needed */}
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={icon as any}
                        size={20}
                        color="#4A7DFF" // Blue icons
                    />
                </View>
                <View>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={[
                        styles.infoValue,
                        valueColor && isRank && { color: valueColor }
                    ]}>
                        {value}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(31, 41, 55, 0.7)', // Darker overlay for better contrast
        justifyContent: 'center',
        alignItems: 'center',
    },
    constraintContainer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12, // Less rounded than before? Figma looks like 12-16
        width: '100%',
        maxWidth: 596, // Rule B: 596px for Content Modals
        overflow: 'hidden',
        position: 'relative', // Context for absolute children
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        position: 'relative',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        top: 16,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent circle
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    imageContainer: {
        // Yellow border container relative to student rank? 
        // Screenshot shows a yellow/gold border around the image
        padding: 3,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#EAB308', // Yellow-500
        marginBottom: 8,
    },
    profileImage: {
        width: 90,
        height: 90,
        borderRadius: 10,
    },
    avatar: {
        marginBottom: 8,
        backgroundColor: '#4A7DFF',
    },
    studentName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    infoSection: {
        marginBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EFF6FF', // Light blue bg
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    actionButton: {
        backgroundColor: '#2563EB', // Stronger blue
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    checkOutButton: {
        backgroundColor: '#2563EB', // Keep Blue for consistent UI, or Red? Figma screenshot 3 shows Blue "Check Out"
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    actionButtonDisabled: {
        opacity: 0.7,
    },
});
