import './src/server/database'
import { DatabaseInitiator, Database, SessionDatabase } from './src/server/database';
import './src/common/types'
import { IQuestion, IQuiz } from './src/common/types';

async function main() {
    const init = new DatabaseInitiator();
    await init.clear();
    await init.createTables();

    const db = new Database();
    await db.addUser("user1", "user1");
    await db.addUser("user2", "user2");

    const q1: IQuestion = {
        id: 1,
        question: '2 + 2',
        answer: 4,
        penalty: 0.5
    };
    const q2: IQuestion = {
        id: 2,
        question: '2 * 2',
        answer: 4,
        penalty: 1
    };
    const q3: IQuestion = {
        id: 3,
        question: '2 + 2 * 2',
        answer: 6,
        penalty: 2
    };
    const q4: IQuestion = {
        id: 4,
        question: '3 * 6',
        answer: 18,
        penalty: 2.5
    };
    const q5: IQuestion = {
        id: 5,
        question: '12 - 53',
        answer: -41,
        penalty: 1.5
    };
    const q6: IQuestion = {
        id: 6,
        question: '2 * (-4) + 3',
        answer: -5,
        penalty: 1
    };
    const q7: IQuestion = {
        id: 7,
        question: '4 * (-3) / 5',
        answer: -2.4,
        penalty: 2.25
    };
    const q8: IQuestion = {
        id: 8,
        question: '25 / (3 - 2)',
        answer: 25,
        penalty: 10
    };


    const quiz1: IQuiz = {
        id: 1,
        questions: [q1, q2, q3, q4, q5, q6]
    };

    const quiz2: IQuiz = {
        id: 2,
        questions: [q3, q4, q1, q8]
    };

    const quiz3: IQuiz = {
        id: 3,
        questions: [q2, q4, q6, q8]
    };

    const quiz4: IQuiz = {
        id: 4,
        questions: [q6, q7, q2, q5]
    };

    await db.addQuestion(q1);
    await db.addQuestion(q2);
    await db.addQuestion(q3);
    await db.addQuestion(q4);
    await db.addQuestion(q5);
    await db.addQuestion(q6);
    await db.addQuestion(q7);
    await db.addQuestion(q8);

    await db.addQuiz(quiz1.id, quiz1.questions.map(q => q.id));
    await db.addQuiz(quiz2.id, quiz2.questions.map(q => q.id));
    await db.addQuiz(quiz3.id, quiz3.questions.map(q => q.id));
    await db.addQuiz(quiz4.id, quiz4.questions.map(q => q.id));
}

(async () => {
    await main();
})();