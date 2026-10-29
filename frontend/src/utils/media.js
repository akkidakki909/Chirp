const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
export function mediaUrl(value) { if (!value) return ''; if (/^https?:\/\//i.test(value)) return value; return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`; }
