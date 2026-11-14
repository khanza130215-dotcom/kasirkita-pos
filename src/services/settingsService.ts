import { db } from '../db/db';
import { StoreSettings } from '../types';

export const settingsService = {
  async getSettings(): Promise<StoreSettings> {
    const settings = await db.settings.toCollection().first();
    if (settings) {
      return settings;
    }

    // Default jika belum ada record
    const defaultSettings: StoreSettings = {
      storeName: '',
      address: '',
      phone: '',
      whatsapp: '',
      tagline: '',
      footerMessage: 'Terima kasih atas kunjungan Anda!',
      paperSize: '58mm',
      autoPrint: false,
      qrisImage: '',
      qrisName: '',
    };

    const id = await db.settings.add(defaultSettings);
    return { ...defaultSettings, id };
  },

  async updateSettings(data: Partial<StoreSettings>): Promise<void> {
    const existing = await db.settings.toCollection().first();
    if (existing && existing.id) {
      await db.settings.update(existing.id, data);
    } else {
      await db.settings.add({
        storeName: '',
        address: '',
        phone: '',
        whatsapp: '',
        tagline: '',
        footerMessage: '',
        paperSize: '58mm',
        autoPrint: false,
        qrisImage: '',
        qrisName: '',
        ...data,
      });
    }
  },
  async getFavorites(): Promise<number[]> {
    const settings = await this.getSettings();
    return settings.favorites || [];
  },

  async toggleFavorite(productId: number): Promise<number[]> {
    const favorites = await this.getFavorites();
    const index = favorites.indexOf(productId);
    let newFavorites: number[];
    
    if (index > -1) {
      newFavorites = favorites.filter(id => id !== productId);
    } else {
      newFavorites = [...favorites, productId];
    }
    
    await this.updateSettings({ favorites: newFavorites });
    return newFavorites;
  }
};