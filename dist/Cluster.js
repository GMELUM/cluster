"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Cluster {
    pid = process.pid;
    count = 0;
    callback = {};
    callbackEvents;
    bodyMaster;
    constructor(callback) {
        this.bodyMaster = callback;
        process.on("message", ({ type, value, requestId }) => {
            const reply = (requestId) => (value) => {
                process.send({ value, requestId });
            };
            if (!type && requestId && this.callback[requestId]) {
                this.callback[requestId](value);
                delete this.callback[requestId];
                return;
            }
            else {
                this.callbackEvents(type, value, reply(requestId));
            }
        });
    }
    start = () => this.bodyMaster(this, this.events, JSON.parse(process.env?.CLUSTER_ENV || {}));
    events = (callback) => this.callbackEvents = callback;
    send = (type, value, callback) => callback ? this.sendCallback(type, value, callback) : this.sendPromise(type, value);
    sendPromise = (type, value) => new Promise((resolve) => {
        const requestId = ++this.count;
        this.callback[requestId] = resolve;
        process.send({ type, value, requestId });
    });
    sendCallback = (type, value, callback) => {
        const requestId = ++this.count;
        this.callback[requestId] = callback;
        process.send({ type, value, requestId });
    };
}
exports.default = Cluster;
