export type OfflineOperationType =
    | "check-in"
    | "trip"
    | "finish-trip"
    | "fuel"
    | "incident"
    | "accident-report"
    | "accident-complete"
    | "check-out"
    | "maintenance";

export type OfflineOperationStatus = "pending" | "syncing" | "failed" | "synced";

export interface OfflineOperation<TPayload = unknown, TResult = unknown> {
    id: string;
    sequence: number;
    userId: number;
    type: OfflineOperationType;
    payload: TPayload;
    createdAt: string;
    updatedAt: string;
    status: OfflineOperationStatus;
    attempts: number;
    lastError: string | null;
    result: TResult | null;
}

interface CacheEntry<TValue = unknown> {
    key: string;
    userId: number;
    value: TValue;
    updatedAt: string;
}

export interface OfflineCacheResult<TValue> {
    value: TValue;
    updatedAt: string;
}

const DATABASE_NAME = "kitrayecto-offline";
const DATABASE_VERSION = 3;
const OPERATIONS_STORE = "operations";
const CACHE_STORE = "cache";
const METADATA_STORE = "metadata";
const QUEUE_CHANGED_EVENT = "kitrayecto:offline-queue-changed";

let databasePromise: Promise<IDBDatabase> | null = null;

export const getOfflineUserId = (): number | null => {
    try {
        const user = JSON.parse(localStorage.getItem("user") ?? "null") as { id?: number } | null;
        return user && Number.isInteger(user.id) && (user.id ?? 0) > 0 ? user.id! : null;
    } catch {
        return null;
    }
};

export const getOfflineUserRole = (): string | null => {
    try {
        const user = JSON.parse(localStorage.getItem("user") ?? "null") as { role?: string } | null;
        return user?.role ?? null;
    } catch {
        return null;
    }
};

export const getBogotaDateKey = (date = new Date()): string => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
};

const notifyQueueChanged = (): void => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(QUEUE_CHANGED_EVENT));
    }
};

export const OFFLINE_QUEUE_CHANGED_EVENT = QUEUE_CHANGED_EVENT;

const openDatabase = (): Promise<IDBDatabase> => {
    if (typeof indexedDB === "undefined") {
        return Promise.reject(new Error("Este navegador no permite guardar datos sin conexión"));
    }

    if (databasePromise) return databasePromise;

    databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        request.onupgradeneeded = () => {
            const database = request.result;

            if (!database.objectStoreNames.contains(OPERATIONS_STORE)) {
                const operations = database.createObjectStore(OPERATIONS_STORE, {
                    keyPath: "id",
                });
                operations.createIndex("by-user", "userId", { unique: false });
                operations.createIndex("by-user-created", ["userId", "createdAt"], {
                    unique: false,
                });
                operations.createIndex("by-user-status", ["userId", "status"], {
                    unique: false,
                });
            } else {
                const operations = request.transaction!.objectStore(OPERATIONS_STORE);
                if (!operations.indexNames.contains("by-user-status")) {
                    operations.createIndex("by-user-status", ["userId", "status"], {
                        unique: false,
                    });
                }
            }

            if (!database.objectStoreNames.contains(CACHE_STORE)) {
                const cache = database.createObjectStore(CACHE_STORE, { keyPath: "key" });
                cache.createIndex("by-user", "userId", { unique: false });
            }

            if (!database.objectStoreNames.contains(METADATA_STORE)) {
                database.createObjectStore(METADATA_STORE, { keyPath: "key" });
            }
        };

        request.onsuccess = () => {
            request.result.onversionchange = () => request.result.close();
            resolve(request.result);
        };
        request.onerror = () => {
            databasePromise = null;
            reject(request.error ?? new Error("No fue posible abrir el almacenamiento local"));
        };
        request.onblocked = () => {
            databasePromise = null;
            reject(new Error("Cierra otras pestañas de Kitrayecto para habilitar el almacenamiento sin conexión"));
        };
    });

    return databasePromise;
};

const requestResult = <T>(request: IDBRequest<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Falló el almacenamiento local"));
    });
};

const transactionComplete = (transaction: IDBTransaction): Promise<void> => {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error("No se guardaron los datos locales"));
        transaction.onabort = () => reject(transaction.error ?? new Error("Se canceló el guardado local"));
    });
};

const operationPriority: Record<OfflineOperationType, number> = {
    "check-in": 0,
    trip: 1,
    "accident-report": 2,
    fuel: 3,
    incident: 4,
    "accident-complete": 5,
    "finish-trip": 6,
    "check-out": 7,
    maintenance: 8,
};

export const offlineDatabaseService = {
    async enqueue<TPayload>(input: {
        userId: number;
        type: OfflineOperationType;
        payload: TPayload;
        id?: string;
    }): Promise<OfflineOperation<TPayload>> {
        const database = await openDatabase();
        const transaction = database.transaction([OPERATIONS_STORE, METADATA_STORE], "readwrite");
        const operations = transaction.objectStore(OPERATIONS_STORE);
        const metadata = transaction.objectStore(METADATA_STORE);
        const currentSequence = await requestResult<{ key: string; value: number } | undefined>(
            metadata.get("queue-sequence")
        );
        const sequence = (currentSequence?.value ?? 0) + 1;
        metadata.put({ key: "queue-sequence", value: sequence });
        const now = new Date().toISOString();
        const operation: OfflineOperation<TPayload> = {
            id: input.id ?? crypto.randomUUID(),
            sequence,
            userId: input.userId,
            type: input.type,
            payload: input.payload,
            createdAt: now,
            updatedAt: now,
            status: "pending",
            attempts: 0,
            lastError: null,
            result: null,
        };

        operations.put(operation);
        await transactionComplete(transaction);
        notifyQueueChanged();
        return operation;
    },

    async getOperation(id: string): Promise<OfflineOperation | null> {
        const database = await openDatabase();
        const transaction = database.transaction(OPERATIONS_STORE, "readonly");
        const operation = await requestResult<OfflineOperation | undefined>(
            transaction.objectStore(OPERATIONS_STORE).get(id)
        );
        await transactionComplete(transaction);
        return operation ?? null;
    },

    async listOperations(userId: number): Promise<OfflineOperation[]> {
        const database = await openDatabase();
        const transaction = database.transaction(OPERATIONS_STORE, "readonly");
        const operations = await requestResult<OfflineOperation[]>(
            transaction.objectStore(OPERATIONS_STORE).index("by-user").getAll(userId)
        );
        await transactionComplete(transaction);
        return operations.sort((left, right) => (
            (left.sequence ?? Number.MAX_SAFE_INTEGER) - (right.sequence ?? Number.MAX_SAFE_INTEGER) ||
            left.createdAt.localeCompare(right.createdAt) ||
            operationPriority[left.type] - operationPriority[right.type] ||
            left.id.localeCompare(right.id)
        ));
    },

    async updateOperation(
        id: string,
        update: (operation: OfflineOperation) => OfflineOperation
    ): Promise<OfflineOperation | null> {
        const database = await openDatabase();
        const transaction = database.transaction(OPERATIONS_STORE, "readwrite");
        const store = transaction.objectStore(OPERATIONS_STORE);
        const current = await requestResult<OfflineOperation | undefined>(store.get(id));

        if (!current) {
            await transactionComplete(transaction);
            return null;
        }

        const next = { ...update(current), updatedAt: new Date().toISOString() };
        store.put(next);
        await transactionComplete(transaction);
        notifyQueueChanged();
        return next;
    },

    async removeOperation(id: string): Promise<void> {
        const database = await openDatabase();
        const transaction = database.transaction(OPERATIONS_STORE, "readwrite");
        transaction.objectStore(OPERATIONS_STORE).delete(id);
        await transactionComplete(transaction);
        notifyQueueChanged();
    },

    async countPending(userId: number): Promise<number> {
        const database = await openDatabase();
        const transaction = database.transaction(OPERATIONS_STORE, "readonly");
        const index = transaction.objectStore(OPERATIONS_STORE).index("by-user-status");
        const statuses: OfflineOperationStatus[] = ["pending", "syncing", "failed"];
        const counts = await Promise.all(statuses.map((status) => requestResult<number>(
            index.count(IDBKeyRange.only([userId, status]))
        )));
        await transactionComplete(transaction);
        return counts.reduce((total, count) => total + count, 0);
    },

    async saveCache<TValue>(userId: number, key: string, value: TValue): Promise<void> {
        const database = await openDatabase();
        const transaction = database.transaction(CACHE_STORE, "readwrite");
        const entry: CacheEntry<TValue> = {
            key: `${userId}:${key}`,
            userId,
            value,
            updatedAt: new Date().toISOString(),
        };
        transaction.objectStore(CACHE_STORE).put(entry);
        await transactionComplete(transaction);
    },

    async readCache<TValue>(userId: number, key: string): Promise<TValue | null> {
        const cached = await this.readCacheWithMetadata<TValue>(userId, key);
        return cached?.value ?? null;
    },

    async readCacheWithMetadata<TValue>(userId: number, key: string): Promise<OfflineCacheResult<TValue> | null> {
        const database = await openDatabase();
        const transaction = database.transaction(CACHE_STORE, "readonly");
        const entry = await requestResult<CacheEntry<TValue> | undefined>(
            transaction.objectStore(CACHE_STORE).get(`${userId}:${key}`)
        );
        await transactionComplete(transaction);
        return entry ? { value: entry.value, updatedAt: entry.updatedAt } : null;
    },

    async clearUserData(userId: number): Promise<void> {
        const database = await openDatabase();
        const transaction = database.transaction([OPERATIONS_STORE, CACHE_STORE], "readwrite");
        const operations = transaction.objectStore(OPERATIONS_STORE);
        const cachedValues = transaction.objectStore(CACHE_STORE);
        const [userOperations, userCache] = await Promise.all([
            requestResult<OfflineOperation[]>(operations.index("by-user").getAll(userId)),
            requestResult<CacheEntry[]>(cachedValues.index("by-user").getAll(userId)),
        ]);

        for (const operation of userOperations) operations.delete(operation.id);
        for (const entry of userCache) cachedValues.delete(entry.key);
        await transactionComplete(transaction);
        notifyQueueChanged();
    },
};
