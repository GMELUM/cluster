"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cluster_1 = __importDefault(require("node:cluster"));
class Master {
    workers = new Map();
    workersKeys = [];
    callback = {};
    count = 0;
    iterationIndex = 0;
    callbackEvents;
    bodyMaster;
    constructor(callback) { this.bodyMaster = callback; }
    start = () => { this.bodyMaster(this, this.events); };
    sendInOrder = (type, value, callback) => {
        if (this.iterationIndex >= this.workersKeys.length - 1) {
            this.iterationIndex = 0;
        }
        else {
            this.iterationIndex = this.iterationIndex + 1;
        }
        const currentCluster = this.workersKeys[this.iterationIndex];
        const cluster = this.workers.get(currentCluster);
        if (cluster) {
            return this.send(cluster, type, value, callback);
        }
        return this;
    };
    send = (target, type, value, callback) => callback ?
        this.sendCallback(target, type, value, callback) :
        this.sendPromise(target, type, value);
    newCluster = (opt) => {
        const worker = node_cluster_1.default.fork({ CLUSTER_ENV: JSON.stringify(opt) });
        return worker
            .on("online", () => { this.add(worker); this.callbackEvents(worker, "ONLINE", {}); })
            .on("disconnect", () => { this.delete(worker); this.callbackEvents(worker, "DISCONNECT", {}); })
            .on("error", () => { this.delete(worker); this.callbackEvents(worker, "ERROR", {}); })
            .on("exit", () => { this.delete(worker); this.callbackEvents(worker, "EXIT", {}); })
            .on("listening", () => { this.callbackEvents(worker, "LISTENING", {}); })
            .on("message", ({ type, value, requestId }) => {
            const reply = (requestId) => (value) => worker.send({ value, requestId });
            if (!type && requestId && this.callback[requestId]) {
                this.callback[requestId](value);
                delete this.callback[requestId];
                return;
            }
            else {
                this.callbackEvents(worker, type, value, reply(requestId));
            }
        });
    };
    sendCallback = (target, type, value, callback) => {
        const requestId = ++this.count;
        this.callback[requestId] = callback;
        target.send({ type, value, requestId });
    };
    sendPromise = (target, type, value) => new Promise((resolve) => {
        const requestId = ++this.count;
        this.callback[requestId] = resolve;
        target.send({ type, value, requestId });
    });
    add = (worker) => {
        if (worker.process.pid) {
            this.workers.set(worker.process.pid, worker);
            this.workersKeys = Array.from(this.workers.keys());
        }
    };
    delete = (worker) => {
        if (worker.process.pid) {
            this.workers.delete(worker.process.pid);
            this.workersKeys = Array.from(this.workers.keys());
        }
    };
    events = (callback) => this.callbackEvents = callback;
}
exports.default = Master;
