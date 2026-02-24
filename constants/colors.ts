export interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  inputBg: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  success: string;
  error: string;
  purple: string;
  closeButtonBg: string;
  streakGoodBg: string;
  streakWarningBg: string;
  streakGoodText: string;
  streakWarningText: string;
  modalOverlay: string;
}

export const darkTheme: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  border: '#334155',
  inputBg: '#334155',
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  accent: '#3b82f6',
  success: '#22c55e',
  error: '#ef4444',
  purple: '#8b5cf6',
  closeButtonBg: '#334155',
  streakGoodBg: '#166534',
  streakWarningBg: '#7c2d12',
  streakGoodText: '#86efac',
  streakWarningText: '#ffffff',
  modalOverlay: 'rgba(0,0,0,0.7)',
};

export const lightTheme: ThemeColors = {
  background: '#f1f5f9',
  surface: '#ffffff',
  border: '#e2e8f0',
  inputBg: '#f1f5f9',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  accent: '#2563eb',
  success: '#16a34a',
  error: '#dc2626',
  purple: '#7c3aed',
  closeButtonBg: '#e2e8f0',
  streakGoodBg: '#dcfce7',
  streakWarningBg: '#fee2e2',
  streakGoodText: '#166534',
  streakWarningText: '#7c2d12',
  modalOverlay: 'rgba(0,0,0,0.4)',
};

export const GOAL_COLOR_PALETTE = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
] as const;

export type GoalColor = typeof GOAL_COLOR_PALETTE[number];
