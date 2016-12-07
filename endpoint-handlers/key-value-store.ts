

import {CommonDatabaseConnection} from "../../lib/common-database-connection"
import {ResultCode} from "../../lib/secondlife/http/result-code"
import {SecondLifeHttpHeaders} from "../../lib/secondlife-http-headers"

const debug = require('debug')('app:store')

export class KeyValueStore {
    constructor(private db: CommonDatabaseConnection) {
    }

    private debugError(error, status, ...extra): void {
        debug(`Returning error status ${status} to client. Error:`, error, extra)
    }

    private getKey = (req, res): string => {
        let key: string = req.params.key

        if (!key) {
            this.debugError(`Could not find key parameter from client.`, ResultCode.Reject)
            res.status(ResultCode.Reject).send("")
            return null
        }

        return key
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

    private getValue(req): string {
        return (req.body && req.body.value) || ""
    }

    private statusFromError(error, res) {
        if (error) {
            this.debugError(error, ResultCode.ServerError)
            res.status(ResultCode.ServerError).send("")
        }
        else {
            debug(`Returning success status 200 to client.`)
            res.status(200).send("")
        }
    }

    public deleteHandler = (req, res) => {
        debug("DELETE: ", req.body, req.headers)
        let key: string = this.getKey(req, res)
        if (!key) return

        let agent: string = this.getOwner(req, res)
        if (!agent)return

        debug(`Attempting to delete agent ${agent} key "${key}".`)
        this.db.store.remove({agent: agent, key: key}, (error) => {
            this.statusFromError(error, res)
        })
    }

    public getHandler = (req, res) => {
        debug("GET: ", req.body, req.headers)
        let key: string = this.getKey(req, res)
        if (!key) return

        let agent: string = this.getOwner(req, res)
        if (!agent)return

        debug(`Attempting to retrieve agent ${agent} key "${key}".`)
        this.db.store.findOne({agent: agent, key: key}, (error, data) => {
            if (error) {
                this.debugError(error, ResultCode.Reject)
                res.status(ResultCode.Reject).send("")
                return
            }

            if (!data || !data.value) {
                debug(`Returning success status ${ResultCode.OK} to client with data "".`)
                res.status(ResultCode.OK).send("")
            }
            else {
                debug(`Returning success status ${ResultCode.OK} to client with data "${data.value}".`)
                res.status(ResultCode.OK).send(`${key}|${data.value}`)
            }
        })
    }

    public listHandler = (req, res) => {
        debug("LIST: ", req.body, req.headers)
        let agent: string = this.getOwner(req, res)
        if (!agent)return

        debug(`Attempting to list agent ${agent}.`)
        this.db.store.find({agent: agent}).toArray((error, data) => {
            if (error) {
                this.debugError(error, ResultCode.Reject)
                res.status(ResultCode.Reject).send("")
                return
            }

            let result: string = JSON.stringify(
                data.map(x => {
                        return {
                            key: x.key,
                            value: x.value
                        }
                    }
                )
            )

            res.status(ResultCode.OK).send(result)
        })
    }

    public postHandler = (req, res) => {
        debug("POST: ", req.body, req.headers)
        let key: string = this.getKey(req, res)
        if (!key) return

        let value = this.getValue(req)

        let agent: string = this.getOwner(req, res)
        if (!agent)return

        debug(`Attempting to store agent ${agent} key "${key}". with value "${value}"`)
        this.db.store.findOne(
            {agent: agent, key: key},
            (error, data) => {
                if (error) {
                    res.status(ResultCode.Reject).send("")
                    return
                }

                if (!data) {
                    this.db.store.insert(
                        {
                            agent: agent,
                            key: key,
                            value: value
                        },
                        (error) => {
                            this.statusFromError(error, res)
                        })
                } else {
                    this.db.store.update(
                        {agent: agent, key: key},
                        {
                            $set: {
                                value: value
                            }
                        },
                        (error) => {
                            this.statusFromError(error, res)
                        }
                    )
                }
            }
        )
    }
}



