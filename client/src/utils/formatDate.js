import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const formatDate = (value) => (value ? dayjs(value).format('DD MMM YYYY') : '—');
export const formatDateTime = (value) => (value ? dayjs(value).format('DD MMM YYYY, HH:mm') : '—');
export const formatShortDate = (value) => (value ? dayjs(value).format('DD MMM') : '');
export const fromNow = (value) => (value ? dayjs(value).fromNow() : '');
export { dayjs };
