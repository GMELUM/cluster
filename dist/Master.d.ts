/// <reference types="node" />
import { Worker } from "node:cluster";
import { BridgeCluster } from ".";
export type BridgeMaster = {};
type TCallbackEvents<C extends BridgeCluster, T extends Record<string, Array<Record<string, any>>> = C> = <K extends keyof T, V extends T[K]>(cluster: Worker, type: K, value: V[0], reply?: (value: V[1]) => void) => void;
type TEvents<T extends BridgeCluster> = (callback: TCallbackEvents<T>) => void;
interface Master<M extends BridgeMaster, C extends BridgeCluster, MT extends Record<string, Array<Record<string, any>>> = M> {
    send<K extends keyof MT, V extends MT[K]>(target: Worker, type: K, value: V[0]): Promise<V[1]>;
    send<K extends keyof MT, V extends MT[K]>(target: Worker, type: K, value: V[0], callback: (data: V[1]) => void): void;
    sendInOrder<K extends keyof MT, V extends MT[K]>(target: Worker, type: K, value: V[0]): Promise<V[1]>;
    sendInOrder<K extends keyof MT, V extends MT[K]>(target: Worker, type: K, value: V[0], callback: (data: V[1]) => void): void;
}
declare class Master<M extends BridgeMaster, C extends BridgeCluster, MT extends Record<string, Array<Record<string, any>>> = M> {
    workers: Map<number, Worker>;
    private workersKeys;
    private callback;
    private count;
    private iterationIndex;
    private callbackEvents;
    private bodyMaster;
    constructor(callback: (master: Master<M, C>, events: TEvents<C>) => void);
    start: () => void;
    sendInOrder: {
        <K extends keyof MT, V extends MT[K]>(target: Worker, type: K, value: V[0]): Promise<V[1]>;
        <K_1 extends keyof MT, V_1 extends MT[K_1]>(target: Worker, type: K_1, value: V_1[0], callback: (data: V_1[1]) => void): void;
    };
    send: {
        <K extends keyof MT, V extends MT[K]>(target: Worker, type: K, value: V[0]): Promise<V[1]>;
        <K_1 extends keyof MT, V_1 extends MT[K_1]>(target: Worker, type: K_1, value: V_1[0], callback: (data: V_1[1]) => void): void;
    };
    newCluster: (opt?: Record<string, any>) => Worker;
    private sendCallback;
    private sendPromise;
    private add;
    private delete;
    private events;
}
export default Master;
