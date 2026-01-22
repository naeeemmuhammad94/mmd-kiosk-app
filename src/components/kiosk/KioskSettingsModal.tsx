/**
 * Kiosk Settings Modal
 * Settings form matching CRM KioskSettingsModal
 * Includes sub-modals for Change PIN and Set Time
 */

import React, { useState, useCallback, memo } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    Image,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useKioskStore } from '@/store/useKioskStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendanceService';
import { uploadFileToS3, getFileInfo } from '@/services/uploadService';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import ChangePinModal from './ChangePinModal';
import SetTimeModal from './SetTimeModal';
import KioskPinModal from './KioskPinModal';
import type { KioskSettings } from '@/types/attendance';

// Memoized toggle component to prevent re-renders
const SettingToggle = memo(function SettingToggle({
    title,
    description,
    value,
    onToggle,
}: {
    title: string;
    description?: string;
    value: boolean;
    onToggle: () => void;
}) {
    return (
        <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{title}</Text>
                {description && (
                    <Text style={styles.settingDescription}>{description}</Text>
                )}
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#E5E7EB', true: '#4A7DFF' }}
                thumbColor="#FFFFFF"
            />
        </View>
    );
});

export default function KioskSettingsModal() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { settings, toggleSettingsModal, setSettings, openPinModal, isPinModalOpen } = useKioskStore();
    const { logout } = useAuthStore();

    // Sub-modal states
    const [showChangePinModal, setShowChangePinModal] = useState(false);
    const [showSetTimeModal, setShowSetTimeModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [backgroundImageEnabled, setBackgroundImageEnabled] = useState(!!settings?.imageLink);

    // Local settings state - initialized once from props
    const [localSettings, setLocalSettings] = useState<Partial<KioskSettings>>(() => ({
        imageLink: settings?.imageLink || '',
        showStudentImages: settings?.showStudentImages ?? true,
        powerSavingMode: settings?.powerSavingMode ?? false,
        allowMultipleClasses: settings?.allowMultipleClasses ?? false,
        allowNonMembers: settings?.allowNonMembers ?? false,
        signInTime: settings?.signInTime ?? 10,
        pin: settings?.pin || '',
    }));


    // Update settings mutation (matches CRM updateKioskSettingsMutate)
    const { mutateAsync: updateSettingsAsync } = useMutation({
        mutationKey: ['updateKioskAttendanceSetting'],
        mutationFn: (data: any) =>
            attendanceService.updateKioskSettings(settings?._id || '', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['getKioskSettings'] });
            queryClient.invalidateQueries({ queryKey: ['getAttendance'] });
        },
    });

    // Image upload state
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Handle image upload - matches CRM CommonFileInput pattern
    const handleImageUpload = useCallback(async () => {
        try {
            // Request permission
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
                return;
            }

            // Open image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [2, 1], // 800x400px aspect ratio
                quality: 0.8,
            });

            if (result.canceled || !result.assets?.[0]) {
                return;
            }

            const asset = result.assets[0];

            // Validate file type
            const fileInfo = getFileInfo(asset.uri);
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(fileInfo.type)) {
                Alert.alert('Invalid File Type', 'Please select a PNG or JPG image.');
                return;
            }

            setIsUploadingImage(true);

            // Upload to S3
            const uploadResponse = await uploadFileToS3([{
                uri: asset.uri,
                name: fileInfo.name,
                type: fileInfo.type,
            }]);

            if (uploadResponse?.data?.[0]) {
                setLocalSettings((prev) => ({ ...prev, imageLink: uploadResponse.data[0] }));
            }
        } catch (error) {
            console.error('Image upload error:', error);
            Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
        } finally {
            setIsUploadingImage(false);
        }
    }, []);

    // Remove uploaded image
    const handleRemoveImage = useCallback(() => {
        setLocalSettings((prev) => ({ ...prev, imageLink: '' }));
    }, []);

    // Stable toggle handlers using useCallback
    const handleToggleShowImages = useCallback(() => {
        setLocalSettings((prev) => ({ ...prev, showStudentImages: !prev.showStudentImages }));
    }, []);

    const handleTogglePowerSaving = useCallback(() => {
        setLocalSettings((prev) => ({ ...prev, powerSavingMode: !prev.powerSavingMode }));
    }, []);

    const handleToggleMultipleClasses = useCallback(() => {
        setLocalSettings((prev) => ({ ...prev, allowMultipleClasses: !prev.allowMultipleClasses }));
    }, []);

    const handleToggleNonMembers = useCallback(() => {
        setLocalSettings((prev) => ({ ...prev, allowNonMembers: !prev.allowNonMembers }));
    }, []);

    // Save settings (matches CRM onSubmit)
    const handleSaveSettings = useCallback(async () => {
        setIsSaving(true);
        try {
            const { allowNonMembers, ...settingsData } = localSettings;

            // Build payload matching CRM API exactly
            const payload = {
                imageLink: settingsData.imageLink ?? '',
                showStudentImages: settingsData.showStudentImages ?? true,
                powerSavingMode: settingsData.powerSavingMode ?? false,
                allowMultipleClasses: settingsData.allowMultipleClasses ?? false,
                allowContact: allowNonMembers ?? false,
                pin: settingsData.pin || settings?.pin || '',
                signInTime: Number(settingsData.signInTime) || 10,
            };

            const response = await updateSettingsAsync(payload);

            if (response?.data) {
                setSettings(response.data);
            }

            Alert.alert('Success', 'Kiosk Settings Updated!');
            toggleSettingsModal();
        } catch (error) {
            Alert.alert('Error', 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    }, [localSettings, updateSettingsAsync, setSettings, toggleSettingsModal]);

    // Logout handler - Open PIN modal for confirmation
    const handleLogout = useCallback(() => {
        openPinModal('logout');
    }, [openPinModal]);

    // Change PIN submit (matches CRM handleSetNewPin)
    // Must call API immediately with full settings data including PIN
    const handleChangePinSubmit = useCallback(async (newPin: string) => {
        try {
            // CRM pattern: send full settings data with new PIN
            const payload = {
                imageLink: localSettings.imageLink ?? '',
                showStudentImages: localSettings.showStudentImages ?? true,
                powerSavingMode: localSettings.powerSavingMode ?? false,
                allowMultipleClasses: localSettings.allowMultipleClasses ?? false,
                allowContact: localSettings.allowNonMembers ?? false,
                signInTime: Number(localSettings.signInTime) || 10,
                pin: newPin, // Include PIN in this update
            };

            await updateSettingsAsync(payload);
            setLocalSettings((prev) => ({ ...prev, pin: newPin }));
            setShowChangePinModal(false);
            Alert.alert('Success', 'PIN Updated Successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to update PIN');
        }
    }, [localSettings, updateSettingsAsync]);

    // Set Time submit (matches CRM handleChangeTime)
    const handleSetTimeSubmit = useCallback((time: number) => {
        setLocalSettings((prev) => ({ ...prev, signInTime: time }));
        setShowSetTimeModal(false);
    }, []);

    const handleClose = useCallback(() => {
        toggleSettingsModal();
    }, [toggleSettingsModal]);

    return (
        <>
            <Modal visible={true} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="settings-outline" size={24} color="#6B7280" />
                            </View>
                            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.title}>Kiosk Settings</Text>

                        <ScrollView
                            style={styles.content}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Background Image Toggle */}
                            <SettingToggle
                                title="Background Image"
                                value={backgroundImageEnabled}
                                onToggle={() => setBackgroundImageEnabled(!backgroundImageEnabled)}
                            />

                            {/* Upload Area - only show when toggle is ON */}
                            {backgroundImageEnabled && (
                                localSettings.imageLink ? (
                                    // Show uploaded image preview
                                    <View style={styles.imagePreviewContainer}>
                                        <Image
                                            source={{ uri: localSettings.imageLink }}
                                            style={styles.imagePreview}
                                            resizeMode="cover"
                                        />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={handleRemoveImage}
                                        >
                                            <Ionicons name="close-circle" size={28} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    // Show upload area
                                    <TouchableOpacity
                                        style={styles.uploadArea}
                                        onPress={handleImageUpload}
                                        disabled={isUploadingImage}
                                    >
                                        {isUploadingImage ? (
                                            <>
                                                <ActivityIndicator size="small" color="#4A7DFF" />
                                                <Text style={styles.uploadText}>Uploading...</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Ionicons name="cloud-upload-outline" size={24} color="#9CA3AF" />
                                                <Text style={styles.uploadText}>
                                                    <Text style={styles.uploadLink}>Click to Upload</Text>
                                                </Text>
                                                <Text style={styles.uploadHint}>PNG or JPG (max. 800×400px)</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )
                            )}

                            {/* Show Student Images */}
                            <SettingToggle
                                title="Show Student Images"
                                description="This option enables the display of student images in the program"
                                value={localSettings.showStudentImages ?? true}
                                onToggle={handleToggleShowImages}
                            />

                            {/* Power Saving Mode */}
                            <SettingToggle
                                title="Power Saving Mode"
                                description="This option will dim the display when the app is inactive"
                                value={localSettings.powerSavingMode ?? false}
                                onToggle={handleTogglePowerSaving}
                            />

                            {/* Allow multiple classes */}
                            <SettingToggle
                                title="Allow multiple classes on one day"
                                description="This option will allow students to attend multiple classes in one day"
                                value={localSettings.allowMultipleClasses ?? false}
                                onToggle={handleToggleMultipleClasses}
                            />

                            {/* Allow non-members */}
                            <SettingToggle
                                title="Allow contacts without a membership to check in"
                                description="This option will allow contacts to check in without membership"
                                value={localSettings.allowNonMembers ?? false}
                                onToggle={handleToggleNonMembers}
                            />

                            {/* Change Pin */}
                            <TouchableOpacity
                                style={styles.navRow}
                                onPress={() => setShowChangePinModal(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.navRowText}>Change Pin</Text>
                                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                            </TouchableOpacity>

                            {/* Sign-in Time */}
                            <TouchableOpacity
                                style={styles.navRow}
                                onPress={() => setShowSetTimeModal(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.navRowText}>
                                    How many minutes after sign in to allow another sign in
                                </Text>
                                <View style={styles.navRowValue}>
                                    <Text style={styles.valueText}>{localSettings.signInTime || 10} min</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                                </View>
                            </TouchableOpacity>
                        </ScrollView>

                        {/* Footer Buttons */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.logoutButton}
                                onPress={handleLogout}
                            >
                                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>

                            <View style={styles.footerRight}>
                                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={handleSaveSettings}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.saveText}>Save Settings</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Sub-modals - Moved INSIDE the Modal to ensure they overlay correctly on iOS */}
                    {showChangePinModal && (
                        <ChangePinModal
                            visible={showChangePinModal}
                            onClose={() => setShowChangePinModal(false)}
                            onSubmit={handleChangePinSubmit}
                            currentPin={localSettings.pin}
                        />
                    )}

                    {showSetTimeModal && (
                        <SetTimeModal
                            visible={showSetTimeModal}
                            onClose={() => setShowSetTimeModal(false)}
                            onSubmit={handleSetTimeSubmit}
                            currentTime={localSettings.signInTime || 10}
                        />
                    )}

                    {/* Global PIN Modal rendered nested here for proper layering when Settings is open */}
                    {isPinModalOpen && (
                        <KioskPinModal />
                    )}
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '90%',
        maxWidth: 400, // Reduced from 500 to 400 as per User Request for Settings Modal
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    content: {
        paddingHorizontal: 20,
    },
    uploadArea: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 8,
        paddingVertical: 24,
        marginBottom: 16,
    },
    uploadText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 8,
    },
    uploadLink: {
        color: '#4A7DFF',
    },
    uploadHint: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 4,
    },
    imagePreviewContainer: {
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16,
    },
    imagePreview: {
        width: '100%',
        height: 120,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 14,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    settingDescription: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    navRowText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
        marginRight: 8,
    },
    navRowValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
    },
    valueText: {
        fontSize: 14,
        color: '#6B7280',
        minWidth: 50,
        textAlign: 'right',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#EF4444',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 6,
        minWidth: 90,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#EF4444',
    },
    footerRight: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
    },
    saveButton: {
        backgroundColor: '#4A7DFF',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        minWidth: 100,
        alignItems: 'center',
    },
    saveText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
    },
});
