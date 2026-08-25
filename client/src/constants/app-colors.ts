export const AppColors = {
  primary: '#6C4CE0',
  primaryDark: '#4F35B3',
  primaryLight: '#EDE7FC',
  accent: '#FF7A45',
  accentLight: '#FFE8DD',
  navy: '#211D35',
  navyLight: '#2E2947',
  success: '#2ED47A',
  successLight: '#DFF7EA',
  danger: '#FF4D4D',
  dangerLight: '#FFE3E3',
  background: '#F6F6FB',
  card: '#FFFFFF',
  text: '#1B1B25',
  textMuted: '#8B8B9B',
  textFaint: '#B7B7C6',
  border: '#EDEDF4',
} as const;

export const CategoryColors: Record<string, string> = {
  'Food & Drinks': '#2E2947',
  Shopping: '#6C4CE0',
  Healthcare: '#FF7A45',
  Transport: '#2ED47A',
  Entertainment: '#FFC542',
  Salary: '#2ED47A',
  Freelance: '#4C6FFF',
  Other: '#8B8B9B',
};

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
