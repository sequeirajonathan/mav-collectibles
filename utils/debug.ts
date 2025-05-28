type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface DebugOptions {
  category?: string;
  level?: LogLevel;
}

const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true';

const getEmoji = (category?: string): string => {
  switch (category) {
    case 'auth':
      return '🔐';
    case 'api':
      return '🌐';
    case 'db':
      return '💾';
    case 'ui':
      return '🎨';
    case 'cart':
      return '🛒';
    case 'middleware':
      return '🔒';
    default:
      return '📝';
  }
};

const getLevelEmoji = (level: LogLevel): string => {
  switch (level) {
    case 'warn':
      return '⚠️';
    case 'error':
      return '❌';
    case 'debug':
      return '🔍';
    default:
      return 'ℹ️';
  }
};

export const debug = (message: string, data?: any, options: DebugOptions = {}) => {
  if (!isDebugEnabled) return;

  const { category, level = 'info' } = options;
  const categoryEmoji = getEmoji(category);
  const levelEmoji = getLevelEmoji(level);
  const prefix = `${levelEmoji} ${categoryEmoji} ${category ? `[${category.toUpperCase()}]` : ''}`;

  switch (level) {
    case 'warn':
      console.warn(prefix, message, data || '');
      break;
    case 'error':
      console.error(prefix, message, data || '');
      break;
    case 'debug':
      console.debug(prefix, message, data || '');
      break;
    default:
      console.log(prefix, message, data || '');
  }
};

// Convenience methods for different categories
export const authDebug = (message: string, data?: any, level?: LogLevel) => 
  debug(message, data, { category: 'auth', level });

export const apiDebug = (message: string, data?: any, level?: LogLevel) => 
  debug(message, data, { category: 'api', level });

export const dbDebug = (message: string, data?: any, level?: LogLevel) => 
  debug(message, data, { category: 'db', level });

export const uiDebug = (message: string, data?: any, level?: LogLevel) => 
  debug(message, data, { category: 'ui', level });

export const cartDebug = (message: string, data?: any, level?: LogLevel) => 
  debug(message, data, { category: 'cart', level });

export const middlewareDebug = (message: string, data?: any, level?: LogLevel) => 
  debug(message, data, { category: 'middleware', level }); 