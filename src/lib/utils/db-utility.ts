export const INDEXED_DB_SAVE_TABLE = "saves";

export namespace gameDB {
    const INDEXED_DB_VERSION = 2; // Increment this version number when you change the database schema
    const INDEXED_DB_NAME = "game_db";
    export function init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);
            // check if the object store exists
            request.onupgradeneeded = (_event) => {
                const db = request.result;
                if (!db.objectStoreNames.contains(INDEXED_DB_SAVE_TABLE)) {
                    // create the object store
                    const objectStore = db.createObjectStore(INDEXED_DB_SAVE_TABLE, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    objectStore.createIndex("id", "id", { unique: true });
                    objectStore.createIndex("date", "date", { unique: false });
                    objectStore.createIndex("name", "name", { unique: false });
                    objectStore.createIndex("gameVersion", "gameVersion", { unique: false });
                }
            };

            request.onsuccess = (_event) => {
                resolve();
            };
            request.onerror = (event) => {
                console.error("Error opening indexDB", event);
                reject();
            };
        });
    }

    export async function putRow<T extends {}>(tableName: string, data: T): Promise<T> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(INDEXED_DB_NAME);

            request.onsuccess = (_event) => {
                const db = request.result;
                // run onupgradeneeded before onsuccess
                if (!db.objectStoreNames.contains(tableName)) {
                    console.error("Object store rescues does not exist");
                    reject();
                }
                const transaction = db.transaction([tableName], "readwrite");
                const objectStore = transaction.objectStore(tableName);
                const setRequest = objectStore.put(data);
                setRequest.onsuccess = (_event) => {
                    resolve(data);
                };
                setRequest.onerror = (event) => {
                    console.error("Error adding save data to indexDB", event);
                    reject();
                };
            };
            request.onerror = (event) => {
                console.error("Error adding save data to indexDB", event);
            };
        });
    }

    export async function getRow<T extends {}>(
        tableName: string,
        id: number | string,
    ): Promise<T | null> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(INDEXED_DB_NAME);
            request.onsuccess = (_event) => {
                const db = request.result;
                // check if the object store exists
                if (!db.objectStoreNames.contains(tableName)) {
                    resolve(null);
                    return;
                }
                const transaction = db.transaction([tableName], "readwrite");
                const objectStore = transaction.objectStore(tableName);
                const getRequest = objectStore.get(id);
                getRequest.onsuccess = (_event) => {
                    resolve(getRequest.result);
                };
                getRequest.onerror = (event) => {
                    console.error("Error getting save data from indexDB", event);
                    reject();
                };
            };
            request.onerror = (event) => {
                console.error("Error opening indexDB", event);
                reject();
            };
        });
    }

    export async function deleteRow(tableName: string, id: number | string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(INDEXED_DB_NAME);
            request.onsuccess = (_event) => {
                const db = request.result;
                const transaction = db.transaction([tableName], "readwrite");
                const objectStore = transaction.objectStore(tableName);
                const deleteRequest = objectStore.delete(id);
                deleteRequest.onsuccess = (_event) => {
                    resolve();
                };
                deleteRequest.onerror = (event) => {
                    console.error("Error deleting save data from indexDB", event);
                    reject();
                };
            };
            request.onerror = (event) => {
                console.error("Error deleting save data from indexDB", event);
            };
        });
    }

    export async function getList<T extends {}>(
        tableName: string,
        options: {
            order?: { field: keyof T; direction: IDBCursorDirection };
            pagination?: { offset: number; limit: number };
        } = {},
    ): Promise<T[]> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(INDEXED_DB_NAME);
            request.onsuccess = (_event) => {
                const db = request.result;
                // check if the object store exists
                if (!db.objectStoreNames.contains(tableName)) {
                    resolve([]);
                    return;
                }
                const transaction = db.transaction([tableName], "readwrite");
                const objectStore = transaction.objectStore(tableName);
                const getRequest = options.order
                    ? objectStore
                          .index(options.order.field as string)
                          .openCursor(null, options.order.direction)
                    : objectStore.openCursor();
                const results: T[] = [];
                let counter = 0;
                const limit = options.pagination?.limit ?? Infinity;
                const offset = options.pagination?.offset ?? 0;
                let advanced = false;
                getRequest.onsuccess = (_event) => {
                    const cursor = getRequest.result;
                    if (cursor) {
                        if (counter >= offset) {
                            results.push(cursor.value);
                            if (results.length >= limit) {
                                resolve(results);
                                advanced = true;
                            }
                        }
                        counter++;
                        cursor.continue();
                    } else {
                        if (!advanced) {
                            resolve(results);
                        }
                    }
                };
                getRequest.onerror = (event) => {
                    console.error("Error getting save data from indexDB", event);
                    reject();
                };
            };
            request.onerror = (event) => {
                console.error("Error opening indexDB", event);
                reject();
            };
        });
    }
}
