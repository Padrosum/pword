import { DEFAULT_SETTINGS, type AppSettings } from '../types/document'
import { Database } from './db'

const SETTINGS_KEY = 'app'
const STORE = 'settings'

export class SettingsRepository {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  async load(): Promise<AppSettings> {
    try {
      const record = await this.db.get<{ key: string; value: AppSettings }>(
        STORE,
        SETTINGS_KEY,
      )
      if (!record) return { ...DEFAULT_SETTINGS }
      return { ...DEFAULT_SETTINGS, ...record.value }
    } catch {
      // Settings are non-critical; fall back to defaults.
      return { ...DEFAULT_SETTINGS }
    }
  }

  async save(settings: AppSettings): Promise<void> {
    await this.db.put(STORE, { key: SETTINGS_KEY, value: settings })
  }
}
