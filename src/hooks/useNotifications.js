// src/hooks/useNotifications.js
import { useEffect, useState } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones');
      return false;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      return perm === 'granted';
    } catch (error) {
      console.error('Error al solicitar permiso:', error);
      return false;
    }
  };

  const sendNotification = (title, options = {}) => {
    if (permission !== 'granted') {
      console.log('No hay permiso para notificaciones');
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/vite.svg',
        badge: '/vite.svg',
        vibrate: [200, 100, 200],
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      return false;
    }
  };

  return { permission, requestPermission, sendNotification };
};