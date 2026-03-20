export function createIndexedDbSaveStorage({
  getWindowObject,
  indexedDbName,
  indexedDbStoreName,
  indexedDbRecordKey,
  parseSerializedSave,
  isRawSaveSupported,
  normalizeSave,
  setIndexedDbAvailable,
  nowMs,
} = {}) {
  const readWindow =
    typeof getWindowObject === "function"
      ? getWindowObject
      : () => (typeof window !== "undefined" ? window : null);
  const setAvailability = typeof setIndexedDbAvailable === "function" ? setIndexedDbAvailable : () => {};
  const readNowMs = typeof nowMs === "function" ? nowMs : () => Date.now();

  let saveIndexedDbOpenPromise = null;

  function hasIndexedDbSaveSupport() {
    const win = readWindow();
    return Boolean(win && "indexedDB" in win);
  }

  async function openSaveIndexedDb() {
    if (!hasIndexedDbSaveSupport()) {
      setAvailability(false);
      return null;
    }

    if (!saveIndexedDbOpenPromise) {
      saveIndexedDbOpenPromise = new Promise((resolve) => {
        try {
          const request = readWindow().indexedDB.open(indexedDbName, 1);
          request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(indexedDbStoreName)) {
              database.createObjectStore(indexedDbStoreName, { keyPath: "id" });
            }
          };
          request.onsuccess = () => {
            setAvailability(true);
            resolve(request.result);
          };
          request.onerror = () => {
            setAvailability(false);
            resolve(null);
          };
          request.onblocked = () => {
            setAvailability(false);
            resolve(null);
          };
        } catch {
          setAvailability(false);
          resolve(null);
        }
      });
    }

    return saveIndexedDbOpenPromise;
  }

  async function readRawSaveDataFromIndexedDb(contextLabel = "indexedDB save") {
    const database = await openSaveIndexedDb();
    if (!database) {
      return null;
    }

    return new Promise((resolve) => {
      try {
        const transaction = database.transaction(indexedDbStoreName, "readonly");
        const store = transaction.objectStore(indexedDbStoreName);
        const request = store.get(indexedDbRecordKey);
        request.onsuccess = () => {
          const serializedSave = typeof request.result?.serializedSave === "string" ? request.result.serializedSave : "";
          if (!serializedSave) {
            resolve(null);
            return;
          }
          try {
            const saveRaw = parseSerializedSave(serializedSave, contextLabel);
            setAvailability(true);
            resolve(saveRaw);
          } catch {
            resolve(null);
          }
        };
        request.onerror = () => {
          setAvailability(false);
          resolve(null);
        };
      } catch {
        setAvailability(false);
        resolve(null);
      }
    });
  }

  async function readSaveDataFromIndexedDb() {
    const saveRaw = await readRawSaveDataFromIndexedDb("indexedDB save");
    if (!saveRaw) {
      return null;
    }
    if (!isRawSaveSupported(saveRaw)) {
      void deleteSaveDataFromIndexedDb();
      return null;
    }
    return normalizeSave(saveRaw);
  }

  async function writeSerializedSaveToIndexedDb(serializedSave) {
    const database = await openSaveIndexedDb();
    if (!database) {
      return false;
    }

    return new Promise((resolve) => {
      try {
        const transaction = database.transaction(indexedDbStoreName, "readwrite");
        transaction.oncomplete = () => {
          setAvailability(true);
          resolve(true);
        };
        transaction.onerror = () => {
          setAvailability(false);
          resolve(false);
        };
        transaction.onabort = () => {
          setAvailability(false);
          resolve(false);
        };
        const store = transaction.objectStore(indexedDbStoreName);
        store.put({
          id: indexedDbRecordKey,
          serializedSave,
          updatedAt: readNowMs(),
        });
      } catch {
        setAvailability(false);
        resolve(false);
      }
    });
  }

  async function deleteSaveDataFromIndexedDb() {
    const database = await openSaveIndexedDb();
    if (!database) {
      return true;
    }

    return new Promise((resolve) => {
      try {
        const transaction = database.transaction(indexedDbStoreName, "readwrite");
        transaction.oncomplete = () => {
          setAvailability(true);
          resolve(true);
        };
        transaction.onerror = () => {
          setAvailability(false);
          resolve(false);
        };
        transaction.onabort = () => {
          setAvailability(false);
          resolve(false);
        };
        const store = transaction.objectStore(indexedDbStoreName);
        store.delete(indexedDbRecordKey);
      } catch {
        setAvailability(false);
        resolve(false);
      }
    });
  }

  return {
    hasIndexedDbSaveSupport,
    openSaveIndexedDb,
    readRawSaveDataFromIndexedDb,
    readSaveDataFromIndexedDb,
    writeSerializedSaveToIndexedDb,
    deleteSaveDataFromIndexedDb,
  };
}
