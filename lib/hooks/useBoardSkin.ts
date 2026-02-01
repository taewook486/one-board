import { findBoardByKey } from '@/lib/db/boards';
import { findSkinById } from '@/lib/db/skins';
import { getDefaultSkin, generateCssVariables, type SkinConfig } from '@/lib/skin/index';

export interface BoardSkinResult {
  skinConfig: SkinConfig;
  cssVariables: string;
  hasSkin: boolean;
  scopePrefix: string;
}

export async function getBoardSkinWithStyles(boardKey: string): Promise<BoardSkinResult> {
  try {
    const board = await findBoardByKey(boardKey);

    if (!board) {
      // Board not found - return default skin
      const defaultSkin = getDefaultSkin();
      return {
        skinConfig: defaultSkin,
        cssVariables: generateCssVariables(defaultSkin, '--board-skin-'),
        hasSkin: false,
        scopePrefix: '--board-skin-'
      };
    }

    // Check if board has a custom skin
    if (board.skinId) {
      const skin = await findSkinById(board.skinId);

      if (skin && skin.config) {
        try {
          const parsedConfig = JSON.parse(skin.config);
          // Merge with default skin for fallback values
          const mergedConfig = {
            ...getDefaultSkin(),
            ...parsedConfig
          };

          return {
            skinConfig: mergedConfig,
            cssVariables: generateCssVariables(mergedConfig, '--board-skin-'),
            hasSkin: true,
            scopePrefix: '--board-skin-'
          };
        } catch (error) {
          console.error(`Failed to parse skin config for board ${boardKey}:`, error);
          // Fall back to default skin
          const defaultSkin = getDefaultSkin();
          return {
            skinConfig: defaultSkin,
            cssVariables: generateCssVariables(defaultSkin, '--board-skin-'),
            hasSkin: false,
            scopePrefix: '--board-skin-'
          };
        }
      }
    }

    // Board exists but no custom skin - use default
    const defaultSkin = getDefaultSkin();
    return {
      skinConfig: defaultSkin,
      cssVariables: generateCssVariables(defaultSkin, '--board-skin'),
      hasSkin: false,
      scopePrefix: '--board-skin-'
    };

  } catch (error) {
    console.error(`Error loading skin for board ${boardKey}:`, error);
    const defaultSkin = getDefaultSkin();
    return {
      skinConfig: defaultSkin,
      cssVariables: generateCssVariables(defaultSkin, '--board-skin'),
      hasSkin: false,
      scopePrefix: '--board-skin-'
    };
  }
}
