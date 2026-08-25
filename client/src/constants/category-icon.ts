import { Ionicons } from '@expo/vector-icons';

import { AppColors, CategoryColors } from '@/constants/app-colors';

export const CategoryIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Food & Drinks': 'restaurant',
  Shopping: 'bag-handle',
  Transport: 'car',
  Healthcare: 'medkit',
  Entertainment: 'film',
  Salary: 'briefcase',
  Freelance: 'laptop',
  Other: 'card',
};

export function getCategoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  return CategoryIcon[category] ?? 'card';
}

export function getCategoryColor(category: string): string {
  return CategoryColors[category] ?? AppColors.textMuted;
}
