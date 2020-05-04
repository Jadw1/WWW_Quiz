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

const lsKey = 'statistics';
export function saveToLocalStorage(el: IStatistic) {
    let statistics = JSON.parse(localStorage.getItem(lsKey)) as IStatistic[];
    if(statistics === null) {
        statistics = [];
    }

    statistics.push(el);
    localStorage.setItem(lsKey, JSON.stringify(statistics));
}

export function getStatistics(): IStatistic[] {
    let statistics = JSON.parse(localStorage.getItem(lsKey)) as IStatistic[];
    if(statistics === null) {
        statistics = [];
    }

    return statistics;
}