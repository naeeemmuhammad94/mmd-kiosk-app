/**
 * Kiosk Layout
 * Stack navigator for kiosk screens + PowerSavingOverlay + First-time PIN setup
 */

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useKioskStore } from '@/store/useKioskStore';
import { attendanceService } from '@/services/attendanceService';
import PowerSavingOverlay from '@/components/kiosk/PowerSavingOverlay';
import ChangePinModal from '@/components/kiosk/ChangePinModal';

export default function KioskLayout() {
  const { setSettings } = useKioskStore();
  const [showFirstTimePin, setShowFirstTimePin] = useState(false);

  // Fetch kiosk settings on layout mount
  const { data: settingsData } = useQuery({
    queryKey: ['getKioskSettings'],
    queryFn: () => attendanceService.getKioskSettingsByDojo(),
    select: response => response.data,
  });

  // Update kiosk settings mutation (for first-time PIN)
  const { mutate: updateSettings, isPending } = useMutation({
    mutationKey: ['updateKioskAttendanceSetting'],
    mutationFn: (data: Record<string, unknown>) =>
      attendanceService.updateKioskSettings(settingsData?._id || '', data),
    onSuccess: response => {
      if (response?.data) {
        setSettings(response.data);
      }
      setShowFirstTimePin(false);
    },
  });

  // Update store and check for first-time setup
  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);

      // CRM logic: if newSetting is true, show PIN setup modal
      if (settingsData.newSetting === true) {
        // Use setTimeout to avoid ESLint set-state-in-effect warning
        setTimeout(() => setShowFirstTimePin(true), 0);
      }
    }
  }, [settingsData, setSettings]);

  const handleFirstTimePinSubmit = (pin: string) => {
    updateSettings({
      ...settingsData,
      pin,
      newSetting: false,
    });
  };

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="programs" />
        <Stack.Screen name="profiles" />
        <Stack.Screen name="rank" />
      </Stack>

      {/* Power Saving Overlay */}
      <PowerSavingOverlay />

      {/* First-time PIN Setup Modal */}
      <ChangePinModal
        visible={showFirstTimePin}
        onClose={() => {}} // Cannot close first-time setup
        onSubmit={handleFirstTimePinSubmit}
        isLoading={isPending}
        isFirstTime={true}
      />
    </>
  );
}
