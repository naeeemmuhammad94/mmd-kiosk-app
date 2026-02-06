/**
 * Kiosk Settings Modal
 * Redesigned to match new Figma specs (Blue Header, Card Layout)
 */

import React, { useState, useCallback, memo, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal, // kept for Modal component usage
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, ActivityIndicator } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useKioskStore } from '@/store/useKioskStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useLocalSettingsStore } from '@/store/useLocalSettingsStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendanceService';
import ChangePinModal from './ChangePinModal';
import SetTimeModal from './SetTimeModal';
import KioskPinModal from './KioskPinModal';
import type { KioskSettings } from '@/types/attendance';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { MD3Theme } from 'react-native-paper';
import { lightCustomColors, darkCustomColors } from '@/theme';
import { getResponsiveDimensions } from '@/theme/dimensions';

// Define styles type for better typing than 'any'
type ComponentStyles = ReturnType<typeof createStyles>;

// Reusable Setting Row Component (Boxed Style)
const SettingItem = memo(function SettingItem({
  title,
  description,
  icon,
  iconColor = '#F1F3F4', // Default greyish for box
  iconSymbolColor = '#4285F4', // Default blue for icon
  rightContent,
  onPress,
  styles,
  theme,
}: {
  title: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;

  iconColor?: string;
  iconSymbolColor?: string;
  rightContent: React.ReactNode;
  onPress?: () => void;
  // removed isLast as it was unused and optional
  theme: MD3Theme; // keeping theme if needed for sub-components, though unused in top level render logic of item, might be useful later. Actually linter said it was unused.
  styles: ComponentStyles;
}) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.itemBox, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.leftContent}>
        <View style={[styles.iconBox, { backgroundColor: iconColor }]}>
          <Ionicons name={icon} size={24} color={iconSymbolColor} />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
      </View>
      <View style={styles.rightContent}>{rightContent}</View>
    </Container>
  );
});

// Checkbox Card Component (Boxed Style)
const CheckboxItem = memo(function CheckboxItem({
  title,
  description,
  value,
  onToggle,
  onPress,
  theme,
  styles,
}: {
  title: string;
  description?: string;
  value: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  theme: MD3Theme;
  styles: ComponentStyles;
}) {
  const handlePress = onPress || onToggle;

  return (
    <TouchableOpacity style={styles.itemBox} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.checkboxContainer}>
        <View style={[styles.checkboxIcon, value && styles.checkboxIconChecked]}>
          {value && <Ionicons name="checkmark-sharp" size={20} color="#FFFFFF" />}
        </View>
      </View>

      <View style={styles.textContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>

      {onPress && !onToggle && (
        <View style={styles.rightContent}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
        </View>
      )}
    </TouchableOpacity>
  );
});

// Setting Section Card Component (Wraps content in a Shadow Card)
const SettingSection = ({
  title,
  description,
  children,
  styles,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  styles: ComponentStyles;
}) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description && <Text style={styles.sectionSubtitle}>{description}</Text>}
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

export default function KioskSettingsModal() {
  const queryClient = useQueryClient();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  const { theme } = useAppTheme();
  const customColors = theme.dark ? darkCustomColors : lightCustomColors;
  const BRAND_BLUE = theme.colors.primary;

  const dims = getResponsiveDimensions(isTablet);

  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, isTablet, BRAND_BLUE, customColors, dims, insets.top),
    [theme, isTablet, BRAND_BLUE, customColors, dims, insets.top]
  );

  const { setTheme } = useThemeStore();

  const handleToggleDarkMode = useCallback(() => {
    // Toggle based on current EFFECTIVE theme
    // If currently dark (whether auto or manual), switch to light
    // If currently light, switch to dark
    setTheme(theme.dark ? 'light' : 'dark');
  }, [theme.dark, setTheme]);

  const { settings, toggleSettingsModal, setSettings, openPinModal, isPinModalOpen } =
    useKioskStore();
  const { showAttendanceBar, setShowAttendanceBar } = useLocalSettingsStore();

  // Sub-modal states
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showSetTimeModal, setShowSetTimeModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local settings state
  const [localSettings, setLocalSettings] = useState<Partial<KioskSettings>>(() => ({
    imageLink: settings?.imageLink || '',
    showStudentImages: settings?.showStudentImages ?? true,
    powerSavingMode: settings?.powerSavingMode ?? false,
    allowMultipleClasses: settings?.allowMultipleClasses ?? false,
    allowContact: settings?.allowContact ?? false,
    signInTime: settings?.signInTime ?? 10,
    pin: settings?.pin || '',
    // New fields
    sortByRank: settings?.sortByRank ?? false,
    showAttendanceBar: showAttendanceBar, // Use local store value
  }));

  const { mutateAsync: updateSettingsAsync } = useMutation({
    mutationKey: ['updateKioskAttendanceSetting'],
    mutationFn: (data: Partial<KioskSettings>) =>
      attendanceService.updateKioskSettings(settings?._id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getKioskSettings'] });
      queryClient.invalidateQueries({ queryKey: ['getAttendance'] });
    },
  });

  // Toggles
  const toggleSetting = useCallback((key: keyof KioskSettings) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSaveSettings = useCallback(async () => {
    setIsSaving(true);
    try {
      const { ...settingsData } = localSettings;

      const payload = {
        imageLink: settingsData.imageLink ?? '',
        showStudentImages: settingsData.showStudentImages ?? true,
        powerSavingMode: settingsData.powerSavingMode ?? false,
        allowMultipleClasses: settingsData.allowMultipleClasses ?? false,
        allowContact: settingsData.allowContact ?? false,
        pin: settingsData.pin || settings?.pin || '',
        signInTime: Number(settingsData.signInTime) || 10,
        // Include new fields even if backend ignores them for now (frontend state won't persist without backend support)
        sortByRank: settingsData.sortByRank ?? false,
        showAttendanceBar: settingsData.showAttendanceBar ?? false,
      };

      const response = await updateSettingsAsync(payload);
      // Fix 'any' type
      const responseData = response?.data as { data?: KioskSettings };
      const updatedSettings = responseData?.data || (responseData as unknown as KioskSettings);
      if (updatedSettings) {
        setSettings(updatedSettings);
      }

      // Persist local-only settings
      setShowAttendanceBar(settingsData.showAttendanceBar ?? false);

      Alert.alert('Success', 'Kiosk Settings Updated!');
      toggleSettingsModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  }, [
    localSettings,
    updateSettingsAsync,
    setSettings,
    toggleSettingsModal,
    settings?.pin,
    setShowAttendanceBar,
  ]);

  const handleLogout = useCallback(() => {
    openPinModal('logout');
  }, [openPinModal]);

  const handleChangePinSubmit = useCallback(
    async (newPin: string) => {
      try {
        const payload = { ...localSettings, pin: newPin };
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

  const handleSetTimeSubmit = useCallback((time: number) => {
    setLocalSettings(prev => ({ ...prev, signInTime: time }));
    setShowSetTimeModal(false);
  }, []);

  const handleClose = useCallback(() => {
    toggleSettingsModal();
  }, [toggleSettingsModal]);

  return (
    <>
      <Modal visible={true} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Kiosk Settings</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity style={styles.headerButtonCancel} onPress={handleClose}>
                  <Text style={styles.headerButtonCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.headerButtonSave, isSaving && { opacity: 0.7 }]}
                  onPress={handleSaveSettings}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size={16} color={BRAND_BLUE} />
                  ) : (
                    <Text style={styles.headerButtonSaveText}>
                      {isTablet ? 'Save Settings' : 'Save'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.topDescription}>
                Configure how your kiosk behaves for students
              </Text>

              {/* Display Behavior Section */}
              <SettingSection
                title="Display Behavior"
                description="Control what students see during check-in"
                styles={styles}
              >
                <SettingItem
                  title="Show Student Photos"
                  description="Displays profile photos on student tiles during check-in."
                  icon="person"
                  iconColor={theme.colors.primary}
                  iconSymbolColor={theme.colors.onPrimary}
                  rightContent={
                    <Switch
                      value={localSettings.showStudentImages ?? true}
                      onValueChange={() => toggleSetting('showStudentImages')}
                      trackColor={{ false: theme.colors.outlineVariant, true: BRAND_BLUE }}
                      ios_backgroundColor={theme.colors.outlineVariant}
                      thumbColor="#FFF"
                      style={styles.smallSwitch}
                    />
                  }
                  theme={theme}
                  styles={styles}
                />

                <SettingItem
                  title="Enable Dark Mode"
                  description="Makes the kiosk darker for low-light lobbies and reduces screen glare."
                  icon="moon"
                  iconColor={theme.colors.primary}
                  iconSymbolColor={theme.colors.onPrimary}
                  rightContent={
                    <Switch
                      value={theme.dark}
                      onValueChange={handleToggleDarkMode}
                      trackColor={{ false: theme.colors.outlineVariant, true: BRAND_BLUE }}
                      ios_backgroundColor={theme.colors.outlineVariant}
                      thumbColor="#FFF"
                      style={styles.smallSwitch}
                    />
                  }
                  theme={theme}
                  styles={styles}
                />

                <SettingItem
                  title="Idle Screen Saver"
                  description="Dims the kiosk after inactivity to reduce screen burn-in."
                  icon="moon-outline"
                  iconColor={theme.colors.primary}
                  iconSymbolColor={theme.colors.onPrimary}
                  rightContent={
                    <Switch
                      value={localSettings.powerSavingMode ?? false}
                      onValueChange={() => toggleSetting('powerSavingMode')}
                      trackColor={{ false: theme.colors.outlineVariant, true: BRAND_BLUE }}
                      ios_backgroundColor={theme.colors.outlineVariant}
                      thumbColor="#FFF"
                      style={styles.smallSwitch}
                    />
                  }
                  theme={theme}
                  styles={styles}
                />
              </SettingSection>

              {/* Attendance Rules Section */}
              <SettingSection
                title="Attendance Rules"
                description="Manage how students can check in"
                styles={styles}
              >
                <CheckboxItem
                  title="Allow Multiple Check-Ins Per Day"
                  description="Lets a student check in more than once on the same day"
                  value={localSettings.allowMultipleClasses ?? false}
                  onToggle={() => toggleSetting('allowMultipleClasses')}
                  theme={theme}
                  styles={styles}
                />

                <CheckboxItem
                  title="Allow Students to Check In Without Membership"
                  description="If no membership exists students can still use Kiosk."
                  value={localSettings.allowContact ?? false}
                  onToggle={() => toggleSetting('allowContact')}
                  theme={theme}
                  styles={styles}
                />

                <CheckboxItem
                  title="Show Attendance Bar"
                  description="Displays a blue bar of attendance on under the student picture."
                  value={localSettings.showAttendanceBar ?? false}
                  onToggle={() => toggleSetting('showAttendanceBar')}
                  theme={theme}
                  styles={styles}
                />

                <SettingItem
                  title="Re-Check-In Time"
                  description="Set how long before the same student can check in again."
                  icon="time-outline"
                  iconColor={theme.colors.primary}
                  iconSymbolColor={theme.colors.onPrimary}
                  rightContent={
                    <View style={styles.smallRow}>
                      <Text style={{ marginRight: 8, color: theme.colors.onSurfaceVariant }}>
                        {localSettings.signInTime ? `${localSettings.signInTime} min` : '10 min'}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </View>
                  }
                  onPress={() => setShowSetTimeModal(true)}
                  theme={theme}
                  styles={styles}
                />
              </SettingSection>

              {/* Security Section */}
              <SettingSection
                title="Security"
                description="Protect kiosk access and prevent misuse"
                styles={styles}
              >
                <SettingItem
                  title="Change Kiosk PIN"
                  description="Update the PIN used to access kiosk settings"
                  icon="lock-closed-outline"
                  iconColor="transparent"
                  iconSymbolColor={theme.colors.primary}
                  rightContent={
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                  }
                  onPress={() => setShowChangePinModal(true)}
                  theme={theme}
                  styles={styles}
                />
              </SettingSection>

              <View style={styles.logoutContainer}>
                <View style={styles.logoutTextContainer}>
                  <Text style={styles.logoutTitle}>Logout of Kiosk</Text>
                  <Text style={styles.logoutDesc}>
                    Ends the current kiosk session and returns to login
                  </Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={18} color={customColors.destructive} />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.spacer} />
            </ScrollView>
          </View>

          {/* Modals */}
          {showChangePinModal && (
            <View style={styles.overlayWrapper} pointerEvents="box-none">
              <ChangePinModal
                visible={showChangePinModal}
                onClose={() => setShowChangePinModal(false)}
                onSubmit={handleChangePinSubmit}
                currentPin={localSettings.pin}
              />
            </View>
          )}

          {showSetTimeModal && (
            <View style={styles.overlayWrapper} pointerEvents="box-none">
              <SetTimeModal
                visible={showSetTimeModal}
                onClose={() => setShowSetTimeModal(false)}
                onSubmit={handleSetTimeSubmit}
                currentTime={localSettings.signInTime || 10}
              />
            </View>
          )}

          {isPinModalOpen && <KioskPinModal />}
        </View>
      </Modal>
    </>
  );
}

const createStyles = (
  theme: MD3Theme,
  isTablet: boolean,
  brandBlue: string,
  customColors: typeof lightCustomColors,
  dims: ReturnType<typeof getResponsiveDimensions>,
  topInset: number
) =>
  StyleSheet.create({
    checkboxContainer: {
      marginRight: 12,
    },
    checkboxIcon: {
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderColor: brandBlue,
      borderRadius: 4,
      borderWidth: 2,
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
    checkboxIconChecked: {
      backgroundColor: brandBlue,
      borderColor: brandBlue,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      alignSelf: 'center',
      maxWidth: 1000,
      paddingBottom: 120,
      paddingHorizontal: isTablet ? 64 : 16,
      paddingTop: isTablet ? 24 : 16,
      width: '100%',
    },
    header: {
      alignItems: 'center',
      backgroundColor: theme.dark ? theme.colors.surface : brandBlue,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: isTablet ? 24 : 12,
      paddingHorizontal: isTablet ? 64 : 16,
      paddingTop: isTablet ? 60 : Math.max(topInset + 16, 24),
    },
    headerButtonCancel: {
      backgroundColor: theme.dark ? 'transparent' : '#FFFFFF',
      borderColor: theme.colors.primary,
      borderRadius: 8,
      borderWidth: theme.dark ? 1 : 0,
      height: isTablet ? undefined : 40,
      justifyContent: 'center',
      paddingHorizontal: isTablet ? 16 : 12,
      paddingVertical: isTablet ? 8 : 0,
    },
    headerButtonCancelText: {
      color: theme.colors.onSurface,
      fontSize: 14,
      fontWeight: '600',
    },
    headerButtonSave: {
      backgroundColor: theme.dark ? 'transparent' : '#FFFFFF',
      borderColor: theme.colors.primary,
      borderRadius: 8,
      borderWidth: theme.dark ? 1 : 0,
      height: isTablet ? undefined : 40,
      justifyContent: 'center',
      minWidth: isTablet ? 120 : 60,
      paddingHorizontal: isTablet ? 16 : 12,
      paddingVertical: isTablet ? 8 : 0,
    },
    headerButtonSaveText: {
      color: theme.dark ? theme.colors.primary : brandBlue,
      fontSize: isTablet ? 14 : 14,
      fontWeight: '600',
    },
    headerButtons: {
      flexDirection: 'row',
      gap: isTablet ? 12 : 8,
    },
    headerTitle: {
      color: theme.dark ? theme.colors.primary : '#FFFFFF',
      fontSize: dims.headerFontSize,
      fontWeight: 'bold',
    },
    iconBox: {
      alignItems: 'center',
      borderRadius: 10,
      height: isTablet ? 48 : 36,
      justifyContent: 'center',
      marginRight: isTablet ? 16 : 12,
      width: isTablet ? 48 : 36,
    },
    itemBox: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: isTablet ? 12 : 8,
      padding: isTablet ? 16 : 10,
    },
    leftContent: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
    },
    logoutButton: {
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderColor: customColors.destructive,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    logoutButtonText: {
      color: customColors.destructive,
      fontWeight: '600',
      marginLeft: 6,
    },
    logoutContainer: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      borderWidth: 1,
      elevation: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    logoutDesc: {
      color: customColors.destructive,
      fontSize: 12,
    },
    logoutTextContainer: {
      flex: 1,
    },
    logoutTitle: {
      color: customColors.destructive,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 2,
    },
    modalContainer: {
      backgroundColor: theme.dark ? theme.colors.background : customColors.backgroundAlt,
      borderRadius: 0,
      height: '100%',
      overflow: 'hidden',
      width: '100%',
    },
    overlay: {
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
      flex: 1,
      justifyContent: 'center',
    },
    overlayWrapper: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 99999,
    },
    rightContent: {
      marginLeft: 12,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      borderWidth: 1,
      elevation: 0,
      marginBottom: 16,
      padding: isTablet ? 24 : 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    sectionContent: {},
    sectionHeader: {
      marginBottom: 12,
    },
    sectionSubtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      fontWeight: '400',
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontSize: dims.titleFontSize,
      fontWeight: '700',
      marginBottom: 4,
    },
    settingDescription: {
      color: theme.colors.onSurfaceVariant,
      fontSize: dims.smallFontSize,
      lineHeight: 16,
    },
    settingTitle: {
      color: theme.colors.onSurface,
      fontSize: dims.bodyFontSize,
      fontWeight: '500',
      marginBottom: 2,
    },
    smallRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    smallSwitch: {
      transform: [{ scale: 0.8 }],
    },
    spacer: {
      height: 40,
    },
    textContent: {
      flex: 1,
      justifyContent: 'center',
    },
    topDescription: {
      color: theme.colors.onSurfaceVariant,
      fontSize: dims.smallFontSize,
      marginBottom: 16,
    },
  });
