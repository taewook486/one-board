export const basicSkinConfig = {
  name: 'Basic Skin',
  version: '1.0.0',
  colors: {
    primary: '#2563eb', // blue-600
    secondary: '#64748b', // gray-500
    success: '#16a34a', // green-600
    danger: '#dc2626', // red-600
    warning: '#ca8a04', // yellow-600
    info: '#0891b2', // cyan-600
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },
  features: {
    showPostThumbnail: true,
    showAuthorAvatar: true,
    showViewCount: true,
    showLikeCount: true,
    showCommentCount: true,
    enableDarkMode: false,
  },
};
