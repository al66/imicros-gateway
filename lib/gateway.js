/**
 * @license MIT, imicros.de (c) 2019 Andreas Leinen
 */
"use strict";

const _     = require("lodash");
const jwt 	= require("jsonwebtoken");
// const ApiGateway = require("moleculer-web");
const { UnAuthorizedError } = require("moleculer-web").Errors;
const { Constants } = require("./util/constants");

module.exports = {
    // name: "api",
    // mixins: [ApiGateway],

    /**
     * Service settings
     */
    settings: {},

    /**
     * Service metadata
     */
    metadata: {},

    /**
     * Service methods
     */
    methods: {
        
        /**
         * Authorize the request
         *
         * @param {Context} ctx
         * @param {Object} route
         * @param {IncomingRequest} req
         * @returns {Promise}
         */
        authorize(ctx, route, req) {
            let token;
            if (req.headers.authorization) {
                let type = req.headers.authorization.split(" ")[0];
                if (type === "Token" || type === "Bearer")
                    token = req.headers.authorization.split(" ")[1];
            }

            return this.Promise.resolve(token)
                .then(token => {
                    let decoded = jwt.decode(token) || { type: "unkwon" };
                    if (token && decoded.type === Constants.USER_TOKEN ) {
                        // Verify JWT user token
                        return ctx.call(`${this.services.users}.resolveToken`, { token })
                            .then(res => {
                                Object.assign(ctx.meta,res);
                                return true;
                            })
                            .catch(err => {
                                this.logger.debug("unvalid token", err);
                                // Reject request
                                return Promise.reject(new UnAuthorizedError());
                            });
                    }
                    if (token && decoded.type === Constants.SERVICE_TOKEN ) {
                        // Verify JWT service token
                        return ctx.call(`${this.services.agents}.verify`, { token })
                            .then(res => {
                                Object.assign(ctx.meta,res);
                                return true;
                            })
                            .catch(err => {
                                this.logger.debug("unvalid token", err);
                                // Reject request
                                return Promise.reject(new UnAuthorizedError());
                            });
                    }
                })
                .then(valid => {
                    if (!valid) return this.Promise.reject(new UnAuthorizedError());
                    if (req.headers["x-imicros-xtoken"]) {
                        _.set(ctx,"meta.acl.accessToken",req.headers["x-imicros-xtoken"]);
                        this.logger.debug("Request access token", { token: ctx.meta.acl.accessToken});
                    }
                });
        }

    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        
        this.services = {
            users: _.get(this.settings,"services.users","users"),
            agents: _.get(this.settings,"services.agents","agents")
        };
        
    }
};