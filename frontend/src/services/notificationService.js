import { apiGet, apiPost, apiPut } from './api.js';

export function getNotifications() {
  return apiGet('/notifications');
}

export function generateNotifications() {
  return apiPost('/notifications/generate');
}

export function markAllNotificationsAsRead() {
  return apiPut('/notifications/read-all');
}