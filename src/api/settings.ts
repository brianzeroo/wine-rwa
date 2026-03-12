import { supabase } from '../supabaseClient';
import { AppSettings } from '../types';

const mapSettings = (row: any): AppSettings => ({
  paypackApiKey: row.paypack_api_key,
  paypackApiSecret: row.paypack_api_secret,
  storeName: row.store_name,
  isMaintenanceMode: Boolean(row.is_maintenance_mode),
  emailNotifications: Boolean(row.email_notifications),
  adminPassword: row.admin_password
});

export const getSettings = async (): Promise<AppSettings | null> => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  
  if (error) throw new Error(error.message);
 return data ? mapSettings(data) : null;
};

export const updateSettings = async (settings: Partial<AppSettings>): Promise<AppSettings | null> => {
  const dbUpdates: any = {};
  
  if (settings.paypackApiKey !== undefined) dbUpdates.paypack_api_key = settings.paypackApiKey;
  if (settings.paypackApiSecret !== undefined) dbUpdates.paypack_api_secret = settings.paypackApiSecret;
  if (settings.storeName !== undefined) dbUpdates.store_name = settings.storeName;
  if (settings.isMaintenanceMode !== undefined) dbUpdates.is_maintenance_mode = settings.isMaintenanceMode ? 1 : 0;
  if (settings.emailNotifications !== undefined) dbUpdates.email_notifications = settings.emailNotifications ? 1 : 0;
  if (settings.adminPassword !== undefined) dbUpdates.admin_password = settings.adminPassword;

  const { data, error } = await supabase
    .from('settings')
    .update(dbUpdates)
    .eq('id', 1)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
 return data ? mapSettings(data) : null;
};

export const verifyAdminPassword = async (password: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('settings')
    .select('admin_password')
    .limit(1)
    .maybeSingle();
  
  if (error || !data) return false;
 return data.admin_password === password;
};
