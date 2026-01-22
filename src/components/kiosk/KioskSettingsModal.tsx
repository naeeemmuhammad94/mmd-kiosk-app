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
import ChangePinModal from './ChangePinModal';
import SetTimeModal from './SetTimeModal';
import KioskPinModal from './KioskPinModal';
import type { KioskSettings } from '@/types/attendance';

const COLORS = {
  white: '#FFFFFF',
  whiteOpacity: 'rgba(255, 255, 255, 0.9)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  primary: '#4A7DFF',
  danger: '#EF4444',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textHint: '#9CA3AF',
};

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
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor={COLORS.white}
      />
    </View>
  );
});

export default function KioskSettingsModal() {
  const queryClient = useQueryClient();
  const { settings, toggleSettingsModal, setSettings, openPinModal, isPinModalOpen } =
    useKioskStore();

  // Sub-modal states
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showSetTimeModal, setShowSetTimeModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    mutationFn: (data: Partial<KioskSettings>) =>
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
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload images.'
        );
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
      const uploadResponse = await uploadFileToS3([
        {
          uri: asset.uri,
          name: fileInfo.name,
          type: fileInfo.type,
        },
      ]);

      if (uploadResponse?.data?.[0]) {
        setLocalSettings(prev => ({ ...prev, imageLink: uploadResponse.data[0] }));
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
    setLocalSettings(prev => ({ ...prev, imageLink: '' }));
  }, []);

  // Stable toggle handlers using useCallback
  const handleToggleShowImages = useCallback(() => {
    setLocalSettings(prev => ({ ...prev, showStudentImages: !prev.showStudentImages }));
  }, []);

  const handleTogglePowerSaving = useCallback(() => {
    setLocalSettings(prev => ({ ...prev, powerSavingMode: !prev.powerSavingMode }));
  }, []);

  const handleToggleMultipleClasses = useCallback(() => {
    setLocalSettings(prev => ({ ...prev, allowMultipleClasses: !prev.allowMultipleClasses }));
  }, []);

  const handleToggleNonMembers = useCallback(() => {
    setLocalSettings(prev => ({ ...prev, allowNonMembers: !prev.allowNonMembers }));
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
  }, [localSettings, updateSettingsAsync, setSettings, toggleSettingsModal, settings?.pin]);

  // Logout handler - Open PIN modal for confirmation
  const handleLogout = useCallback(() => {
    openPinModal('logout');
  }, [openPinModal]);

  // Change PIN submit (matches CRM handleSetNewPin)
  // Must call API immediately with full settings data including PIN
  const handleChangePinSubmit = useCallback(
    async (newPin: string) => {
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
        setLocalSettings(prev => ({ ...prev, pin: newPin }));
        setShowChangePinModal(false);
        Alert.alert('Success', 'PIN Updated Successfully!');
      } catch (error) {
        Alert.alert('Error', 'Failed to update PIN');
      }
    },
    [localSettings, updateSettingsAsync]
  );

  // Set Time submit (matches CRM handleChangeTime)
  const handleSetTimeSubmit = useCallback((time: number) => {
    setLocalSettings(prev => ({ ...prev, signInTime: time }));
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
                <Ionicons name="settings-outline" size={24} color={COLORS.textSecondary} />
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>Kiosk Settings</Text>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Background Image Section Header */}
              <View style={styles.settingRow}>
                <Text style={styles.settingTitle}>Background Image</Text>
              </View>

              {/* Upload Area - Always Visible */}
              {localSettings.imageLink ? (
                // Show uploaded image preview
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: localSettings.imageLink }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
                    <Ionicons name="close-circle" size={28} color={COLORS.danger} />
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
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.uploadText}>Uploading...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={24} color={COLORS.textHint} />
                      <Text style={styles.uploadText}>
                        <Text style={styles.uploadLink}>Click to Upload</Text>
                      </Text>
                      <Text style={styles.uploadHint}>PNG or JPG (max. 800×400px)</Text>
                    </>
                  )}
                </TouchableOpacity>
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
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
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
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
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
                    <ActivityIndicator size="small" color={COLORS.white} />
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
          {isPinModalOpen && <KioskPinModal />}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
  },
  footer: {
    alignItems: 'center',
    borderTopColor: COLORS.borderLight,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  footerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  imagePreview: {
    borderRadius: 8,
    height: 120,
    width: '100%',
  },
  imagePreviewContainer: {
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  logoutButton: {
    alignItems: 'center',
    borderColor: COLORS.danger,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minWidth: 90,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    maxHeight: '85%',
    maxWidth: 400, // Reduced from 500 to 400 as per User Request for Settings Modal
    width: '90%',
  },
  navRow: {
    alignItems: 'center',
    borderBottomColor: COLORS.borderLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  navRowText: {
    color: COLORS.textPrimary,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  navRowValue: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 4,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
    flex: 1,
    justifyContent: 'center',
  },
  removeImageButton: {
    backgroundColor: COLORS.whiteOpacity,
    borderRadius: 14,
    position: 'absolute',
    right: 8,
    top: 8,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  settingDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingRow: {
    alignItems: 'center',
    borderBottomColor: COLORS.borderLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  uploadArea: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 24,
  },
  uploadHint: {
    color: COLORS.textHint,
    fontSize: 11,
    marginTop: 4,
  },
  uploadLink: {
    color: COLORS.primary,
  },
  uploadText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
  valueText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    minWidth: 50,
    textAlign: 'right',
  },
});
