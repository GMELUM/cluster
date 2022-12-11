import { BridgeMaster } from ".";
export type BridgeCluster = {
    "ONLINE": [{}, {}];
    "DISCONNECT": [{}, {}];
    "ERROR": [{}, {}];
    "EXIT": [{}, {}];
    "LISTENING": [{}, {}];
};
type TCallbackEvents<C extends BridgeMaster, T extends Record<string, Array<Record<string, any>>> = C> = <K extends keyof T, V extends T[K]>(type: K, value: V[0], reply?: <VALUE extends V[1]>(value: VALUE) => void) => void;
type TEvents<T extends BridgeMaster> = (callback: TCallbackEvents<T>) => void;
interface Cluster<M extends BridgeMaster, C extends BridgeCluster, CT extends Record<string, Array<Record<string, any>>> = C> {
    send<K extends keyof CT, V extends CT[K]>(type: K, value: V[0]): Promise<V[1]>;
    send<K extends keyof CT, V extends CT[K]>(type: K, value: V[0], callback: (data: V[1]) => void): void;
}
declare class Cluster<M extends BridgeMaster, C extends BridgeCluster, CT extends Record<string, Array<Record<string, any>>> = C> {
    private pid;
    private count;
    private callback;
    private callbackEvents;
    private bodyMaster;
    constructor(callback: (cluster: Cluster<M, C, CT>, events: TEvents<M>, options: Record<string, any>) => void);
    start: () => void;
    events: TEvents<M>;
    send: {
        <K extends keyof CT, V extends CT[K]>(type: K, value: V[0]): Promise<V[1]>;
        <K_1 extends keyof CT, V_1 extends CT[K_1]>(type: K_1, value: V_1[0], callback: (data: V_1[1]) => void): void;
    };
    private sendPromise;
    private sendCallback;
}
export default Cluster;
