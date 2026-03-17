// Removed bcrypt import as it's handled on the backend now.
import { AppSettings } from '../types';

const mapSettings = (row: any): AppSettings => ({
  paypackApiKey: row.paypack_api_key,
  paypackApiSecret: row.paypack_api_secret,
  storeName: row.store_name,
  isMaintenanceMode: Boolean(row.is_maintenance_mode),
  emailNotifications: Boolean(row.email_notifications),
  adminPassword: row.admin_password
});

export const getSecuritySettings = async (): Promise<AppSettings | null> => {
  try {
    const response = await fetch('/api/settings', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }

    const data = await response.json();
    return data ? mapSettings(data) : null;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
};

export const getSettings = getSecuritySettings;

export const updateSecuritySettings = async (settings: Partial<AppSettings>): Promise<AppSettings | null> => {
  try {
    // Build the payload
    const payload: any = {};
    if (settings.paypackApiKey !== undefined) payload.paypackApiKey = settings.paypackApiKey;
    if (settings.paypackApiSecret !== undefined) payload.paypackApiSecret = settings.paypackApiSecret;
    if (settings.storeName !== undefined) payload.storeName = settings.storeName;
    if (settings.isMaintenanceMode !== undefined) payload.isMaintenanceMode = settings.isMaintenanceMode;
    if (settings.emailNotifications !== undefined) payload.emailNotifications = settings.emailNotifications;
    if (settings.adminPassword !== undefined) payload.adminPassword = settings.adminPassword;

    const response = await fetch('/api/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update settings: ${response.statusText}`);
    }

    return mapSettings(await response.json());

  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

export const updateSettings = updateSecuritySettings;

export const verifyAdminPassword = async (password: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || (response.status === 429 ? 'Too many login attempts. Please try again in 15 minutes.' : 'Incorrect password')
      };
    }

    return { success: data.success === true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Connection error. Please check if the server is running.' };
  }
};

export const checkAdminAuth = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/admin/check-auth', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const logoutAdmin = async (): Promise<void> => {
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
};
