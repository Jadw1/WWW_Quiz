export interface IQuestionStat {
    correct: boolean;
    time: number;
    answer: number;
}

export interface IStatistic {
    nick: string;
    time: number;
    correct: number;
    total: number;
    questions?: IQuestionStat[];
}

const dbName = 'quizDB';
const storeName = 'Statistics';
function openDB() :IDBOpenDBRequest {
    if(!indexedDB) {
        console.error("indexedDB not supported");
        return null;
    }

    const request = indexedDB.open(dbName);
    return request;
}

export function saveToDB(el: IStatistic): Promise<void> {
    const request = openDB();
    if(request === null) {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    return new Promise((resolve, reject) => {
        request.onsuccess = (e: any) => {
            const db = e.target.result;

            if(!db.objectStoreNames.contains(storeName)) {
                db.close();
                resolve();
            }
            else {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                store.put(el);
                resolve();
            }
        };

        request.onerror = (e) => {
            resolve();
        };

        request.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            const store = db.createObjectStore(storeName, { autoIncrement: true });
            store.createIndex('stats', 'stats', {unique: false});
        }
    });
}

export function getStatistics(): Promise<IStatistic[]> {
    const requst = openDB();
    if(requst === null) {
        return new Promise((resolve, reject) => {
            resolve([]);
        });
    }

    return new Promise((resolve, reject) => {
        requst.onsuccess = (e: any) => {
            const db = e.target.result;

            if (!db.objectStoreNames.contains(storeName)) {
                resolve([]);
                return;
            }

            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const storeReq = store.getAll();

            storeReq.onsuccess = (ev) => {
                resolve(ev.target.result);
            }

            transaction.oncomplete = () => {
                db.close();
            }
        }

        requst.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            const store = db.createObjectStore(storeName, { autoIncrement: true });
            store.createIndex('stats', 'stats', {unique: false});
        };
    });
}