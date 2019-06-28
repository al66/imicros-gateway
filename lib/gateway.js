/**
 * @license MIT, imicros.de (c) 2019 Andreas Leinen
 */
"use strict";

const _     = require("lodash");
const jwt 	= require("jsonwebtoken");
const ApiGateway = require("moleculer-web");
const { UnAuthorizedError } = ApiGateway.Errors;

module.exports = {
    name: "api",
    mixins: [ApiGateway],

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
                    if (token && decoded.type === "identity" ) {
                        // Verify JWT token
                        return ctx.call(this.auth.service+".resolveToken", { token })
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
        
        this.auth = {
            service: _.get(this.settings,"authorization.service","users")
        };
        
    }
};