'use client';

import { generateCssVariables, generateDarkModeVariables, type SkinConfig } from '@/lib/skin/index';

interface BoardSkinStylesProps {
  skinConfig: SkinConfig;
  scopePrefix?: string;
  children: React.ReactNode;
}

export default function BoardSkinStyles({ 
  skinConfig, 
  scopePrefix = '--board-skin-',
  children 
}: BoardSkinStylesProps) {
  const cssVariables = generateCssVariables(skinConfig, scopePrefix);
  
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
/* Board Skin Variables */
[data-board-skin-scope] {
${cssVariables}
}

/* Dark Mode Override */
[data-board-skin-scope][data-theme="dark"] {
  ${Object.entries(skinConfig.darkModeColors || {}).map(([key, value]) => 
    value ? `${scopePrefix}color-${key}: ${value};` : ''
  ).join('\n  ')}
}
        `.trim()
      }} />
      {children}
    </>
  );
}
