import { BridgeMaster } from ".";

export type BridgeCluster = {
    "ONLINE": [{}, {}];
    "DISCONNECT": [{}, {}];
    "ERROR": [{}, {}];
    "EXIT": [{}, {}];
    "LISTENING": [{}, {}];
};

type TCallbackEvents<
    C extends BridgeMaster,
    T extends Record<string, Array<Record<string, any>>> = C> =
    <K extends keyof T, V extends T[K]>(type: K, value: V[0], reply?: <VALUE extends V[1]>(value: VALUE) => void) => void;

type TEvents<T extends BridgeMaster> = (callback: TCallbackEvents<T>) => void;

interface Cluster<
    M extends BridgeMaster,
    C extends BridgeCluster,
    CT extends Record<string, Array<Record<string, any>>> = C
> {
    send<K extends keyof CT, V extends CT[K]>(type: K, value: V[0]): Promise<V[1]>;
    send<K extends keyof CT, V extends CT[K]>(type: K, value: V[0], callback: (data: V[1]) => void): void;
}

class Cluster<
    M extends BridgeMaster,
    C extends BridgeCluster,
    CT extends Record<string, Array<Record<string, any>>> = C
> {

    private pid = process.pid;
    private count: number = 0;

    private callback: Record<number, (value?: any | PromiseLike<any>) => void> = {};

    private callbackEvents: TCallbackEvents<M>;

    private bodyMaster: (cluster: Cluster<M, C, CT>, events: TEvents<M>, options: Record<string, any>) => void;

    constructor(callback: (
        cluster: Cluster<M, C, CT>,
        events: TEvents<M>,
        options: Record<string, any>
    ) => void) {
        this.bodyMaster = callback;
        process.on("message", ({ type, value, requestId }) => {
            const reply = (requestId: number) => (value: any) => {
                process.send!({ value, requestId });
            }

            if (!type && requestId && this.callback[requestId]) {
                this.callback[requestId](value);
                delete this.callback[requestId]; return;
            } else {
                this.callbackEvents(type, value, reply(requestId));
            }
        });
    }

    public start = () => this.bodyMaster(this, this.events, JSON.parse((process.env as any)?.CLUSTER_ENV || {}));

    events: TEvents<M> = (callback) => this.callbackEvents = callback;

    // @ts-ignore:next-line
    send = (type, value, callback) => callback ? this.sendCallback(type, value, callback) : this.sendPromise(type, value);

    private sendPromise = <K extends keyof CT, V extends CT[K]>(type: K, value: V[0]): Promise<V[1]> =>
        new Promise((resolve) => {
            const requestId = ++this.count;
            this.callback[requestId] = resolve;
            process.send!({ type, value, requestId });
        });

    private sendCallback = <K extends keyof CT, V extends CT[K]>(type: K, value: V[0], callback: (data?: V[1]) => void): void => {
        const requestId = ++this.count;
        this.callback[requestId] = callback;
        process.send!({ type, value, requestId });
    }

}

export default Cluster;

