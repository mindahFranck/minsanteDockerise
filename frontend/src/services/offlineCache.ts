import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "minsante-offline";
const DB_VERSION = 1;

interface OfflineDB {
  fosas: { key: number; value: any };
  geoData: { key: string; value: { data: any; updatedAt: number } };
  pendingMutations: {
    key: string;
    value: {
      id: string;
      method: "POST" | "PUT" | "DELETE" | "PATCH";
      url: string;
      payload?: unknown;
      headers?: Record<string, string>;
      createdAt: number;
    };
  };
  meta: { key: string; value: any };
}

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("fosas")) {
          db.createObjectStore("fosas", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("geoData")) {
          db.createObjectStore("geoData");
        }
        if (!db.objectStoreNames.contains("pendingMutations")) {
          db.createObjectStore("pendingMutations", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
      },
    });
  }
  return dbPromise;
}

export const offlineCache = {
  async saveFosas(fosas: any[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction("fosas", "readwrite");
    await tx.store.clear();
    for (const f of fosas) {
      if (f && f.id != null) await tx.store.put(f);
    }
    await tx.done;
    await this.setMeta("fosasUpdatedAt", Date.now());
    await this.setMeta("fosasCount", fosas.length);
  },

  async getFosas(): Promise<any[]> {
    const db = await getDB();
    return await db.getAll("fosas");
  },

  async getFosaById(id: number): Promise<any | undefined> {
    const db = await getDB();
    return await db.get("fosas", id);
  },

  async saveGeoData(key: string, data: any): Promise<void> {
    const db = await getDB();
    await db.put("geoData", { data, updatedAt: Date.now() }, key);
  },

  async getGeoData<T = any>(key: string): Promise<T | null> {
    const db = await getDB();
    const entry = (await db.get("geoData", key)) as
      | { data: T; updatedAt: number }
      | undefined;
    return entry ? entry.data : null;
  },

  async setMeta(key: string, value: any): Promise<void> {
    const db = await getDB();
    await db.put("meta", value, key);
  },

  async getMeta<T = any>(key: string): Promise<T | null> {
    const db = await getDB();
    const v = await db.get("meta", key);
    return (v as T) ?? null;
  },

  async queueMutation(mutation: {
    method: "POST" | "PUT" | "DELETE" | "PATCH";
    url: string;
    payload?: unknown;
    headers?: Record<string, string>;
  }): Promise<string> {
    const db = await getDB();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await db.put("pendingMutations", {
      id,
      ...mutation,
      createdAt: Date.now(),
    });
    return id;
  },

  async getPendingMutations(): Promise<any[]> {
    const db = await getDB();
    return await db.getAll("pendingMutations");
  },

  async deletePendingMutation(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("pendingMutations", id);
  },

  async clearAll(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(
      ["fosas", "geoData", "pendingMutations", "meta"],
      "readwrite",
    );
    await Promise.all([
      tx.objectStore("fosas").clear(),
      tx.objectStore("geoData").clear(),
      tx.objectStore("pendingMutations").clear(),
      tx.objectStore("meta").clear(),
    ]);
    await tx.done;
  },

  async getStats(): Promise<{
    fosas: number;
    geoEntries: number;
    pending: number;
    fosasUpdatedAt: number | null;
  }> {
    const db = await getDB();
    const [fosasCount, geoEntries, pending, updatedAt] = await Promise.all([
      db.count("fosas"),
      db.count("geoData"),
      db.count("pendingMutations"),
      db.get("meta", "fosasUpdatedAt"),
    ]);
    return {
      fosas: fosasCount,
      geoEntries,
      pending,
      fosasUpdatedAt: (updatedAt as number) ?? null,
    };
  },
};

export type { OfflineDB };
