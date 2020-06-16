import './src/server/database'
import { DatabaseInitiator, Database } from './src/server/database';

async function main() {
    const init = new DatabaseInitiator();
    await init.clear();
    await init.createTables();

    const db = new Database();
    await db.addUser("test1", "test1");
    await db.addUser("user1", "user1");
    await db.addUser("test2", "test2");
}

(async () => {
    await main();
})();