import { basicSkinConfig } from '@/skins/basic/config';

export type SkinConfig = {
  name: string;
  version: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    warning: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  typography: {
    fontFamily: {
      sans: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
  features: {
    showPostThumbnail: boolean;
    showAuthorAvatar: boolean;
    showViewCount: boolean;
    showLikeCount: boolean;
    showCommentCount: boolean;
    enableDarkMode: boolean;
  };
};

export const AVAILABLE_SKINS = {
  basic: {
    config: basicSkinConfig,
    path: '@/skins/basic',
  },
} as const;

export type SkinName = keyof typeof AVAILABLE_SKINS;

/**
 * Get skin configuration by name
 */
export function getSkinConfig(skinName: SkinName = 'basic'): SkinConfig {
  const skin = AVAILABLE_SKINS[skinName];
  if (!skin) {
    return basicSkinConfig; // Fallback to basic
  }
  return skin.config;
}

/**
 * Get all available skins
 */
export function getAllSkins() {
  return Object.entries(AVAILABLE_SKINS).map(([name, skin]) => ({
    name,
    displayName: skin.config.name,
    version: skin.config.version,
  }));
}
