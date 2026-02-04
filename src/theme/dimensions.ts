/**
 * Responsive Dimensions Utility
 * Centralized responsive sizing for mobile-first design
 */

export const MOBILE_BREAKPOINT = 768;

/**
 * Get responsive dimensions based on screen size
 * @param isTablet - true if screen width >= 768px
 */
export const getResponsiveDimensions = (isTablet: boolean) => ({
  // Inputs & Buttons
  inputHeight: isTablet ? 52 : 40, // 40px on mobile
  buttonHeight: isTablet ? 52 : 40, // 40px on mobile
  buttonPaddingV: isTablet ? 14 : 10,
  inputRadius: isTablet ? 12 : 8, // Smaller radius on mobile

  // Typography
  headerFontSize: isTablet ? 24 : 22,
  titleFontSize: isTablet ? 20 : 16,
  bodyFontSize: isTablet ? 16 : 14,
  smallFontSize: isTablet ? 14 : 12,
  buttonFontSize: isTablet ? 16 : 14,

  // Student Cards
  cardWidth: isTablet ? 120 : 90,
  avatarSize: isTablet ? 68 : 44,
  avatarBorder: isTablet ? 84 : 56,
  avatarInner: isTablet ? 78 : 50,
  nameFontSize: isTablet ? 13 : 11,
  badgeSize: isTablet ? 32 : 22,

  // Grid
  gridGap: isTablet ? 16 : 8,
  gridPadding: isTablet ? 16 : 10,
});
