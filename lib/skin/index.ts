import { findBoardByKey } from '@/lib/db/boards';
import { findSkinById } from '@/lib/db/skins';

export interface SkinConfig {
  name: string;
  version: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    warning: string;
    info: string;
    background: string;
    foreground: string;
    card: string;
    border: string;
  };
  darkModeColors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    foreground?: string;
    card?: string;
    border?: string;
  };
}

/**
 * Get the default skin configuration
 */
export function getDefaultSkin(): SkinConfig {
  return {
    name: 'Default',
    version: '1.0.0',
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b',
      info: '#06b6d4',
      background: '#ffffff',
      foreground: '#111827',
      card: '#f9fafb',
      border: '#e5e7eb',
    },
    darkModeColors: {
      primary: '#60a5fa',
      secondary: '#9ca3af',
      background: '#1f2937',
      foreground: '#f9fafb',
      card: '#374151',
      border: '#4b5563',
    },
  };
}

/**
 * Generate CSS variables from skin config
 */
export function generateCssVariables(config: SkinConfig, prefix: string = '--skin-'): string {
  const lines: string[] = [];

  // Light mode colors
  for (const [key, value] of Object.entries(config.colors)) {
    const cssVar = `${prefix}${key}`;
    lines.push(`  ${cssVar}: ${value};`);
  }

  // Dark mode colors (if available)
  if (config.darkModeColors) {
    lines.push(''); // Empty line for readability

    for (const [key, value] of Object.entries(config.darkModeColors)) {
      if (value) {
        const cssVar = `${prefix}${key}-dark`;
        lines.push(`  ${cssVar}: ${value};`);
      }
    }
  }

  return `:root {\n${lines.join('\n')}\n}`;
}

/**
 * Generate CSS variables for dark mode override
 */
export function generateDarkModeVariables(config: SkinConfig, prefix: string = '--skin-'): string {
  if (!config.darkModeColors) {
    return '';
  }

  const lines: string[] = [];
  for (const [key, value] of Object.entries(config.darkModeColors)) {
    if (value) {
      const cssVar = `${prefix}${key}`;
      lines.push(`  ${cssVar}: ${value};`);
    }
  }

  if (lines.length === 0) {
    return '';
  }

  return `[data-theme="dark"] {\n${lines.join('\n')}\n}`;
}

/**
 * Get the full CSS for a skin including dark mode
 */
export function generateFullSkinCss(config: SkinConfig, prefix: string = '--skin-'): string {
  let css = generateCssVariables(config, prefix);
  const darkModeCss = generateDarkModeVariables(config, prefix);
  if (darkModeCss) {
    css += '\n' + darkModeCss;
  }
  return css;
}
