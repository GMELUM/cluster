import cluster, { Worker } from "node:cluster";
import { BridgeCluster } from ".";

export type BridgeMaster = {};

type TCallbackEvents<
    C extends BridgeCluster,
    T extends Record<string, Array<Record<string, any>>> = C
> = <K extends keyof T, V extends T[K]>(cluster: Worker, type: K, value: V[0], reply?: (value: V[1]) => void) => void;

type TEvents<T extends BridgeCluster> = (callback: TCallbackEvents<T>) => void;

type TAdd = (worker: Worker) => void;
type TDelete = (worker: Worker) => void;

interface Master
    <
        M extends BridgeMaster,
        C extends BridgeCluster,
        MT extends Record<string, Array<Record<string, any>>> = M
    > {
    send<K extends keyof MT, V extends MT[K]>(target: Worker, type: K, value: V[0]): Promise<V[1]>;
    send<K extends keyof MT, V extends MT[K]>(target: Worker, type: K, value: V[0], callback: (data: V[1]) => void): void;

    sendInOrder<K extends keyof MT, V extends MT[K]>(target: Worker, type: K, value: V[0]): Promise<V[1]>;
    sendInOrder<K extends keyof MT, V extends MT[K]>(target: Worker, type: K, value: V[0], callback: (data: V[1]) => void): void;

}

class Master
    <
        M extends BridgeMaster,
        C extends BridgeCluster,
        MT extends Record<string, Array<Record<string, any>>> = M
    > {

    public workers = new Map<number, Worker>();
    private workersKeys: Array<number> = [];
    private callback: Record<number, (value?: any | PromiseLike<any>) => void> = {};
    private count: number = 0;

    private iterationIndex = 0;

    private callbackEvents: TCallbackEvents<C>;

    private bodyMaster: (master: Master<M, C>, events: TEvents<C>) => void;

    constructor(callback: (
        master: Master<M, C>,
        events: TEvents<C>
    ) => void) { this.bodyMaster = callback }

    public start = () => { this.bodyMaster(this, this.events) };

    // @ts-ignore:next-line
    public sendInOrder = (type, value, callback) => {
        if (this.iterationIndex >= this.workersKeys.length - 1) {
            this.iterationIndex = 0;
        } else { this.iterationIndex = this.iterationIndex + 1 }
        const currentCluster = this.workersKeys[this.iterationIndex];
        const cluster = this.workers.get(currentCluster);
        if (cluster) {
            return this.send(cluster, type, value, callback);
        }
        return this.sendInOrder(type, value, callback);
    }

    // @ts-ignore:next-line
    public send = (target, type, value, callback) => callback ?
        this.sendCallback(target, type, value, callback) :
        this.sendPromise(target, type, value);

    public newCluster = (opt?: Record<string, any>) => {
        const worker = cluster.fork({ CLUSTER_ENV: JSON.stringify(opt) });
        return worker
            .on("online", () => { this.add(worker); this.callbackEvents(worker, "ONLINE", {}) })
            .on("disconnect", () => { this.delete(worker); this.callbackEvents(worker, "DISCONNECT", {}) })
            .on("error", () => { this.delete(worker); this.callbackEvents(worker, "ERROR", {}) })
            .on("exit", () => { this.delete(worker); this.callbackEvents(worker, "EXIT", {}) })
            .on("listening", () => { this.callbackEvents(worker, "LISTENING", {}) })
            .on("message", ({ type, value, requestId }) => {
                const reply = (requestId: number) => (value: any) => worker.send({ value, requestId });
                if (!type && requestId && this.callback[requestId]) {
                    this.callback[requestId](value);
                    delete this.callback[requestId]; return;
                } else { this.callbackEvents(worker, type, value, reply(requestId)) }
            });
    }

    private sendCallback = <T extends keyof M, V extends M[T]>(
        target: Worker,
        type: T,
        value: V,
        callback: (data: V) => void
    ) => {
        const requestId = ++this.count;
        this.callback[requestId] = callback;
        target.send({ type, value, requestId });
    }

    private sendPromise = <T extends keyof M, V extends M[T]>(
        target: Worker,
        type: T,
        value: V
    ) => new Promise((resolve) => {
        const requestId = ++this.count;
        this.callback[requestId] = resolve;
        target.send({ type, value, requestId });
    });

    private add: TAdd = (worker) => {
        if (worker.process.pid) {
            this.workers.set(worker.process.pid, worker);
            this.workersKeys = Array.from(this.workers.keys());
        }
    }

    private delete: TDelete = (worker) => {
        if (worker.process.pid) {
            this.workers.delete(worker.process.pid);
            this.workersKeys = Array.from(this.workers.keys());
        }
    }

    private events: TEvents<C> = (callback) =>
        this.callbackEvents = callback;

}

export default Master;
