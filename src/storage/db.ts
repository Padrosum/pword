/**
 * Minimal promise-based IndexedDB wrapper with explicit schema versioning.
 *
 * Schema history:
 *   v1 — stores: "documents" (keyPath: id, index: updatedAt),
 *               "settings"  (keyPath: key)
 *
 * Future schema changes must bump DB_VERSION and extend `upgrade`
 * with the next step of the migration.
 */

export const DB_NAME = 'pword'
export const DB_VERSION = 1

export interface DatabaseSchema {
  documents: 'documents'
  settings: 'settings'
}

export class StorageError extends Error {
  readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'StorageError'
    this.cause = cause
  }
}

export function isQuotaError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )
  }
  return false
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(new StorageError('IndexedDB request failed', request.error))
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () =>
      reject(
        new StorageError('IndexedDB transaction aborted', transaction.error),
      )
    transaction.onerror = () =>
      reject(new StorageError('IndexedDB transaction failed', transaction.error))
  })
}

export function openDatabase(
  factory: IDBFactory = indexedDB,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest
    try {
      request = factory.open(DB_NAME, DB_VERSION)
    } catch (error) {
      reject(new StorageError('IndexedDB is unavailable', error))
      return
    }

    request.onupgradeneeded = (event) => {
      const db = request.result
      const oldVersion = event.oldVersion

      // Step-wise migration: each case falls through the version chain.
      if (oldVersion < 1) {
        const documents = db.createObjectStore('documents', { keyPath: 'id' })
        documents.createIndex('updatedAt', 'updatedAt')

        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }

    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => db.close()
      resolve(db)
    }
    request.onerror = () =>
      reject(new StorageError('Could not open local database', request.error))
    request.onblocked = () =>
      reject(new StorageError('Local database is blocked by another tab'))
  })
}

export class Database {
  private dbPromise: Promise<IDBDatabase> | null = null
  private readonly factory: IDBFactory

  constructor(factory: IDBFactory = indexedDB) {
    this.factory = factory
  }

  private async db(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDatabase(this.factory)
    }
    return this.dbPromise
  }

  async get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.db()
    return requestToPromise<T>(
      db.transaction(store, 'readonly').objectStore(store).get(key),
    )
  }

  async getAll<T>(store: string): Promise<T[]> {
    const db = await this.db()
    return requestToPromise<T[]>(
      db.transaction(store, 'readonly').objectStore(store).getAll(),
    )
  }

  async put<T>(store: string, value: T): Promise<void> {
    const db = await this.db()
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value)
    await transactionDone(tx)
  }

  /** Read, transform, and write a record in one transaction. */
  async update<T>(
    store: string,
    key: IDBValidKey,
    transform: (current: T | undefined) => T,
  ): Promise<T> {
    const db = await this.db()
    const tx = db.transaction(store, 'readwrite')
    const objectStore = tx.objectStore(store)
    let updated: T
    const request = objectStore.get(key)

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        try {
          updated = transform(request.result as T | undefined)
          objectStore.put(updated)
          resolve()
        } catch (error) {
          reject(error)
        }
      }
      request.onerror = () => reject(new StorageError('IndexedDB request failed', request.error))
    })
    await transactionDone(tx)
    return updated!
  }

  async delete(store: string, key: IDBValidKey): Promise<void> {
    const db = await this.db()
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).delete(key)
    await transactionDone(tx)
  }
}
