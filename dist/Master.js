import cluster from "node:cluster";
class Master {
    workers = new Map();
    callback = {};
    count = 0;
    callbackEvents;
    bodyMaster;
    constructor(callback) { this.bodyMaster = callback; }
    start = () => { this.bodyMaster(this, this.events); };
    send = (target, type, value, callback) => callback ?
        this.sendCallback(target, type, value, callback) :
        this.sendPromise(target, type, value);
    newCluster = (opt) => {
        const worker = cluster.fork(opt);
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
    add = (worker) => worker.process.pid &&
        this.workers.set(worker.process.pid, worker);
    delete = (worker) => worker.process.pid &&
        this.workers.delete(worker.process.pid);
    events = (callback) => this.callbackEvents = callback;
}
export default Master;
