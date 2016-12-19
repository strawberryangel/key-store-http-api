"use strict";
const authorization_manager_1 = require("../../lib/secondlife/authorization/authorization-manager");
const result_code_1 = require("../../lib/secondlife/http/result-code");
const secondlife_http_headers_1 = require("../../lib/secondlife-http-headers");
const debug = require('debug')('app:authorization-handler');
class AuthorizationHandler {
    constructor(db) {
        this.db = db;
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
        this.postGetHandshakeCode = (req, res) => {
            debug("POST: ", req.body, req.headers);
            let agent = this.getOwner(req, res);
            if (!agent)
                return;
            debug(`Attempting to get handshake code for agent ${agent}`);
            let code = this.manager.getHandshakeCode(agent);
            res.status(result_code_1.ResultCode.OK).send(code);
        };
        this.manager = new authorization_manager_1.AuthorizationManager(db);
    }
    debugError(error, status, ...extra) {
        debug(`Returning error status ${status} to client. Error:`, error, extra);
    }
}
exports.AuthorizationHandler = AuthorizationHandler;
//# sourceMappingURL=authorization-handler.js.map