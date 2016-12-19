import {AuthorizationManager} from "../../lib/secondlife/authorization/authorization-manager"
import {CommonDatabaseConnection} from "../../lib/common-database-connection"
import {ResultCode} from "../../lib/secondlife/http/result-code"
import {SecondLifeHttpHeaders} from "../../lib/secondlife-http-headers"

const debug = require('debug')('app:authorization-handler')

export class AuthorizationHandler {
    private manager: AuthorizationManager

    constructor(private db: CommonDatabaseConnection) {
        this.manager = new AuthorizationManager(db)
    }

    private debugError(error, status, ...extra): void {
        debug(`Returning error status ${status} to client. Error:`, error, extra)
    }

    private getOwner = (req, res): string => {
        let headers = new SecondLifeHttpHeaders
        headers.parse(req.headers)
        let result = headers.ownerKey

        if (!result) {
            this.debugError(`Could not find owner header from client.`, ResultCode.Reject)
            res.status(ResultCode.Reject).send("Ic þe ne wiste.")
            return null
        }

        return result
    }

    public postGetHandshakeCode = (req, res) => {
        debug("POST: ", req.body, req.headers)
        let agent: string = this.getOwner(req, res)
        if (!agent)return

        debug(`Attempting to get handshake code for agent ${agent}`)
        let code = this.manager.getHandshakeCode(agent)
        res.status(ResultCode.OK).send(code)
    }
}


