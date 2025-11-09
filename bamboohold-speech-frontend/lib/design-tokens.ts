/**
 * Design Tokens for BambooHold Speech
 * Generated deterministically from seed: sha256("BambooHold Speech" + "Sepolia" + "202511" + "BambooHoldSpeech")
 */

export const designTokens = {
  // Color palette
  colors: {
    primary: {
      light: "#0F766E",
      dark: "#14B8A6",
    },
    accent: {
      light: "#F59E0B",
      dark: "#FCD34D",
    },
    neutral: {
      light: "#6B7280",
      dark: "#9CA3AF",
    },
    status: {
      safe: {
        light: "#10B981",
        dark: "#34D399",
      },
      caution: {
        light: "#FBBF24",
        dark: "#FCD34D",
      },
      danger: {
        light: "#EF4444",
        dark: "#F87171",
      },
    },
    background: {
      light: "#FFFFFF",
      dark: "#1F2937",
    },
    surface: {
      light: "#F9FAFB",
      dark: "#111827",
    },
    text: {
      primary: {
        light: "#111827",
        dark: "#F9FAFB",
      },
      secondary: {
        light: "#6B7280",
        dark: "#9CA3AF",
      },
    },
  },

  // Spacing scale
  spacing: {
    compact: {
      base: 4,
      scale: 1,
      xs: "4px",
      sm: "8px",
      md: "12px",
      lg: "16px",
      xl: "24px",
      "2xl": "32px",
    },
    comfortable: {
      base: 8,
      scale: 1.5,
      xs: "8px",
      sm: "12px",
      md: "18px",
      lg: "24px",
      xl: "36px",
      "2xl": "48px",
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: "Inter, system-ui, -apple-system, sans-serif",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Border radius
  borderRadius: {
    sm: "4px",
    base: "8px",
    md: "12px",
    lg: "16px",
    full: "9999px",
  },

  // Shadows
  shadows: {
    subtle: "0 2px 8px rgba(0, 0, 0, 0.08)",
    elevated: "0 4px 16px rgba(0, 0, 0, 0.12)",
    deep: "0 8px 24px rgba(0, 0, 0, 0.16)",
  },

  // Transitions
  transitions: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Responsive breakpoints
  breakpoints: {
    mobile: "640px",
    tablet: "1024px",
    desktop: "1280px",
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
  },

  // Accessibility
  accessibility: {
    focusRing: {
      width: "2px",
      style: "solid",
      offset: "2px",
    },
    minimumTouchTarget: "44px",
  },
} as const;

export type DesignTokens = typeof designTokens;

// Helper function to get current theme colors
export function getThemeColors(isDark: boolean) {
  return {
    primary: isDark ? designTokens.colors.primary.dark : designTokens.colors.primary.light,
    accent: isDark ? designTokens.colors.accent.dark : designTokens.colors.accent.light,
    neutral: isDark ? designTokens.colors.neutral.dark : designTokens.colors.neutral.light,
    statusSafe: isDark ? designTokens.colors.status.safe.dark : designTokens.colors.status.safe.light,
    statusCaution: isDark ? designTokens.colors.status.caution.dark : designTokens.colors.status.caution.light,
    statusDanger: isDark ? designTokens.colors.status.danger.dark : designTokens.colors.status.danger.light,
    background: isDark ? designTokens.colors.background.dark : designTokens.colors.background.light,
    surface: isDark ? designTokens.colors.surface.dark : designTokens.colors.surface.light,
    textPrimary: isDark ? designTokens.colors.text.primary.dark : designTokens.colors.text.primary.light,
    textSecondary: isDark ? designTokens.colors.text.secondary.dark : designTokens.colors.text.secondary.light,
  };
}

