"use strict";
const result_code_1 = require("../../lib/secondlife/http/result-code");
const secondlife_http_headers_1 = require("../../lib/secondlife-http-headers");
const debug = require('debug')('app:store');
class KeyValueStore {
    constructor(db) {
        this.db = db;
        this.getKey = (req, res) => {
            let key = req.params.key;
            if (!key) {
                this.debugError(`Could not find key parameter from client.`, result_code_1.ResultCode.Reject);
                res.status(result_code_1.ResultCode.Reject).send("");
                return null;
            }
            return key;
        };
        this.getOwner = (req, res) => {
            let headers = new secondlife_http_headers_1.SecondLifeHttpHeaders;
            headers.parse(req.headers);
            let result = headers.ownerKey;
            if (!result) {
                this.debugError(`Could not find owner header from client.`, result_code_1.ResultCode.Reject);
                res.status(result_code_1.ResultCode.Reject).send("Ic þe ne wiste.");
                return null;
            }
            return result;
        };
        this.deleteHandler = (req, res) => {
            debug("DELETE: ", req.body, req.headers);
            let key = this.getKey(req, res);
            if (!key)
                return;
            let agent = this.getOwner(req, res);
            if (!agent)
                return;
            debug(`Attempting to delete agent ${agent} key "${key}".`);
            this.db.store.remove({ agent: agent, key: key }, (error) => {
                this.statusFromError(error, res);
            });
        };
        this.getHandler = (req, res) => {
            debug("GET: ", req.body, req.headers);
            let key = this.getKey(req, res);
            if (!key)
                return;
            let agent = this.getOwner(req, res);
            if (!agent)
                return;
            debug(`Attempting to retrieve agent ${agent} key "${key}".`);
            this.db.store.findOne({ agent: agent, key: key }, (error, data) => {
                if (error) {
                    this.debugError(error, result_code_1.ResultCode.Reject);
                    res.status(result_code_1.ResultCode.Reject).send("");
                    return;
                }
                if (!data || !data.value) {
                    debug(`Returning success status ${result_code_1.ResultCode.OK} to client with data "".`);
                    res.status(result_code_1.ResultCode.OK).send("");
                }
                else {
                    debug(`Returning success status ${result_code_1.ResultCode.OK} to client with data "${data.value}".`);
                    res.status(result_code_1.ResultCode.OK).send(`${key}|${data.value}`);
                }
            });
        };
        this.listHandler = (req, res) => {
            debug("LIST: ", req.body, req.headers);
            let agent = this.getOwner(req, res);
            if (!agent)
                return;
            debug(`Attempting to list agent ${agent}.`);
            this.db.store.find({ agent: agent }).toArray((error, data) => {
                if (error) {
                    this.debugError(error, result_code_1.ResultCode.Reject);
                    res.status(result_code_1.ResultCode.Reject).send("");
                    return;
                }
                let result = JSON.stringify(data.map(x => {
                    return {
                        key: x.key,
                        value: x.value
                    };
                }));
                res.status(result_code_1.ResultCode.OK).send(result);
            });
        };
        this.postHandler = (req, res) => {
            debug("POST: ", req.body, req.headers);
            let key = this.getKey(req, res);
            if (!key)
                return;
            let value = this.getValue(req);
            let agent = this.getOwner(req, res);
            if (!agent)
                return;
            debug(`Attempting to store agent ${agent} key "${key}". with value "${value}"`);
            this.db.store.findOne({ agent: agent, key: key }, (error, data) => {
                if (error) {
                    res.status(result_code_1.ResultCode.Reject).send("");
                    return;
                }
                if (!data) {
                    this.db.store.insert({
                        agent: agent,
                        key: key,
                        value: value
                    }, (error) => {
                        this.statusFromError(error, res);
                    });
                }
                else {
                    this.db.store.update({ agent: agent, key: key }, {
                        $set: {
                            value: value
                        }
                    }, (error) => {
                        this.statusFromError(error, res);
                    });
                }
            });
        };
    }
    debugError(error, status, ...extra) {
        debug(`Returning error status ${status} to client. Error:`, error, extra);
    }
    getValue(req) {
        return (req.body && req.body.value) || "";
    }
    statusFromError(error, res) {
        if (error) {
            this.debugError(error, result_code_1.ResultCode.ServerError);
            res.status(result_code_1.ResultCode.ServerError).send("");
        }
        else {
            debug(`Returning success status 200 to client.`);
            res.status(200).send("");
        }
    }
}
exports.KeyValueStore = KeyValueStore;
//# sourceMappingURL=key-value-store.js.map