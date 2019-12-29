"use strict";

const { ServiceBroker } = require("moleculer");
const { Gateway } = require("../index");
const _ = require("lodash");
const request = require("supertest");
const jwt 	= require("jsonwebtoken");

const GatewaySettings = {
    name: "gateway",
    version: 1,
    settings: {
        authorization: {
            service: "v1.users"
        },
        routes: [
            {
                path: "/",

                bodyParsers: {
                    json: true
                },

                authorization: true
            },
            {
                path: "/users/create",

                bodyParsers: {
                    json: true
                },
                
                authorization: false,

                aliases: {
                    "POST /": "v1.users.create"
                }
            },
            {
                path: "/users/login",

                bodyParsers: {
                    json: true
                },
                
                authorization: false,

                aliases: {
                    "POST /": "v1.users.login"
                }
            },
            {
                path: "/users",

                bodyParsers: {
                    json: true
                },
                
                authorization: true ,
                
                aliases: {
                    "GET /me": "v1.users.me"
                }
            },
            {
                path: "/files",

                bodyParsers: {
                    json: false
                },

                aliases: {
                    // File upload from HTML form
                    "POST /": "multipart:v1.minio.putObject",

                    // File upload from AJAX or cURL
                    "PUT /:objectName": "stream:v1.minio.putObject",

                    // File upload from HTML form and overwrite busboy config
                    "POST /multi": {
                        type: "multipart",
                        // Action level busboy config
                        busboyConfig: {
                            limits: {
                                files: 3
                            }
                        },
                        action: "v1.minio.putObject"
                    },
                    
                    "GET /:objectName": "v1.minio.getObject",
                    
                    "GET /stat/:objectName": "v1.minio.statObject",
                    
                    "DELETE /:objectName": "v1.minio.removeObject"
                },
                authorization: true,

                //onBeforeCall(ctx, route, req, res) {
                onBeforeCall(ctx, route, req) {
                    
                    _.set(ctx, "meta.filename",_.get(req,"$params.objectName",req.headers["x-imicros-filename"]));
                    _.set(ctx, "meta.mimetype",req.headers["x-imicros-mimetype"]);
                },            
            
                // https://github.com/mscdex/busboy#busboy-methods
                busboyConfig: {
                    limits: {
                        files: 1
                    },
                    onFilesLimit: jest.fn()
                },
            }
        ]
    }
    
};

// mock users service
const Users = {
    name: "users",
    version: 1,
    actions: {
        create: {
            handler(ctx) {
                return {
                    action: "create",
                    params: ctx.params,
                    meta: ctx.meta
                };
            }
        },
        login: {
            handler(ctx) {
                return {
                    action: "login",
                    params: ctx.params,
                    meta: ctx.meta
                };
            }
        },
        me: {
            handler(ctx) {
                return {
                    action: "me",
                    params: ctx.params,
                    meta: ctx.meta
                };
                
            }
        },
        resolveToken:  {
            handler(ctx) {
                let decoded = jwt.decode(ctx.params.token);
                if (decoded.valid) {
                    return { 
                        user: {
                            token: ctx.params.token,
                            id: "xyz", 
                            email: "test@test.de",
                            verified: true
                        }
                    };
                }
                throw new Error("Unvalid token");
            }
        }
    }
};

const Service = {
    name: "example",
    version: 1,
    actions: {
        action: {
            handler(ctx) {
                return {
                    action: "action",
                    params: ctx.params,
                    meta: ctx.meta
                };
            }
        }
    }
        
};

const Files = {
    name: "minio",
    version: 1,
    actions: {
        getObject: {
            handler(ctx) {
                return {
                    action: "getObject",
                    params: ctx.params,
                    meta: ctx.meta
                };
            }
        }
    }
        
};


describe("Test Gateway", () => {

    let broker, gatewayService, server, users, service, files;
    
    describe("Test create service", () => {

        it("it should start the broker", async () => {
            broker = new ServiceBroker({
                logger: console,
                logLevel: "info" //"debug"
            });
            gatewayService = await broker.createService(Gateway,GatewaySettings);
            users = await broker.createService(Users);
            service = await broker.createService(Service);
            files = await broker.createService(Files);
            await broker.start();
            server = gatewayService.server;
            expect(users).toBeDefined();
            expect(service).toBeDefined();
            expect(files).toBeDefined();
            expect(gatewayService).toBeDefined();
        });

    });
    
    describe("Test path users/create", () => {

        it("it should call v1.users.create w/o authorization check", () => {
            let params = {
                email: "test@test.de",
                password: "mySecret",
                locale: "de"
            };
            return request(server)
                .post("/users/create")
                .send(params)
                .then(res => {
                    expect(res.statusCode).toBe(200);
                    expect(res.body).toBeDefined();
                    expect(res.body.params).toEqual(params);
                });
        });
        
    });

    describe("Test path users/login", () => {

        it("it should call v1.users.login w/o authorization check", () => {
            let params = {
                user: "test@test.de",
                password: "mySecret"
            };
            return request(server)
                .post("/users/login")
                .send(params)
                .then(res => {
                    expect(res.statusCode).toBe(200);
                    expect(res.body).toBeDefined();
                    expect(res.body.params).toEqual(params);
                });
        });
        
    });

    describe("Test path users/me", () => {

        it("it should return status 401 - missing authorization", () => {
            return request(server)
                .get("/users/me")
                .then(res => {
                    expect(res.statusCode).toBe(401);
                    expect(res.body).toBeDefined();
                    expect(res.body.name).toEqual("UnAuthorizedError");
                    expect(res.body.message).toEqual("Unauthorized");
                    expect(res.body.code).toEqual(401);
                    expect(res.body.type).toEqual("INVALID_TOKEN");
                });
        });

        it("it should return user", () => {
            let token = jwt.sign({ type: "identity", valid: true }, "mySecret");
            return request(server)
                .get("/users/me")
                .set("Authorization","Bearer "+token)
                .then(res => {
                    expect(res.statusCode).toBe(200);
                    expect(res.body).toBeDefined();
                });
        });
        
        it("it should return status 401 - missing authorization", () => {
            let token = "xyz";
            return request(server)
                .get("/users/me")
                .set("Authorization","Bearer "+token)
                .then(res => {
                    expect(res.statusCode).toBe(401);
                    expect(res.body).toBeDefined();
                    expect(res.body.name).toEqual("UnAuthorizedError");
                    expect(res.body.message).toEqual("Unauthorized");
                    expect(res.body.code).toEqual(401);
                    expect(res.body.type).toEqual("INVALID_TOKEN");
                });
        });
        
        it("it should return status 401 - missing authorization", () => {
            let token = jwt.sign({ type: "identity", valid: false }, "mySecret");
            return request(server)
                .get("/users/me")
                .set("Authorization","Bearer "+token)
                .then(res => {
                    expect(res.statusCode).toBe(401);
                    expect(res.body).toBeDefined();
                    expect(res.body.name).toEqual("UnAuthorizedError");
                    expect(res.body.message).toEqual("Unauthorized");
                    expect(res.body.code).toEqual(401);
                    expect(res.body.type).toEqual("INVALID_TOKEN");
                });
        });
        
    });

    describe("Test path files", () => {

        it("it should call files service", () => {
            let token = jwt.sign({ type: "identity", valid: true }, "mySecret");
            return request(server)
                .get("/files/test")
                .set("Authorization","Bearer "+token)
                .then(res => {
                    expect(res.statusCode).toBe(200);
                    expect(res.body).toBeDefined();
                    expect(res.body.params.objectName).toEqual("test");
                });
        });
        
    });
    
    describe("Test call service", () => {

        it("it should return status 401 - missing authorization", () => {
            return request(server)
                .get("/v1/example/action")
                .then(res => {
                    expect(res.statusCode).toBe(401);
                    expect(res.body).toBeDefined();
                    expect(res.body.name).toEqual("UnAuthorizedError");
                    expect(res.body.message).toEqual("Unauthorized");
                    expect(res.body.code).toEqual(401);
                    expect(res.body.type).toEqual("INVALID_TOKEN");
                });
        });

        it("it should call service", () => {
            let token = jwt.sign({ type: "identity", valid: true }, "mySecret");
            let accessToken = "xyz";
            return request(server)
                .get("/v1/example/action")
                .set("Authorization","Bearer "+token)
                .set("x-imicros-xtoken",accessToken)
                .then(res => {
                    expect(res.statusCode).toBe(200);
                    expect(res.body).toBeDefined();
                    expect(res.body.action).toEqual("action");
                    expect(res.body.meta.acl.accessToken).toEqual(accessToken);
                });
        });
        
        it("it should return status 401 - missing authorization", () => {
            let token = "xyz";
            return request(server)
                .get("/v1/example/action")
                .set("Authorization","Bearer "+token)
                .then(res => {
                    expect(res.statusCode).toBe(401);
                    expect(res.body).toBeDefined();
                    expect(res.body.name).toEqual("UnAuthorizedError");
                    expect(res.body.message).toEqual("Unauthorized");
                    expect(res.body.code).toEqual(401);
                    expect(res.body.type).toEqual("INVALID_TOKEN");
                });
        });
        
        it("it should return status 401 - missing authorization", () => {
            let token = jwt.sign({ type: "identity", valid: false }, "mySecret");
            return request(server)
                .get("/users/me")
                .set("Authorization","Bearer "+token)
                .then(res => {
                    expect(res.statusCode).toBe(401);
                    expect(res.body).toBeDefined();
                    expect(res.body.name).toEqual("UnAuthorizedError");
                    expect(res.body.message).toEqual("Unauthorized");
                    expect(res.body.code).toEqual(401);
                    expect(res.body.type).toEqual("INVALID_TOKEN");
                });
        });
        
        it("it should return status 401 - missing authorization", () => {
            // other type - not type identity
            let token = jwt.sign({ type: "access", valid: true }, "mySecret");
            return request(server)
                .get("/users/me")
                .set("Authorization","Bearer "+token)
                .then(res => {
                    expect(res.statusCode).toBe(401);
                    expect(res.body).toBeDefined();
                    expect(res.body.name).toEqual("UnAuthorizedError");
                    expect(res.body.message).toEqual("Unauthorized");
                    expect(res.body.code).toEqual(401);
                    expect(res.body.type).toEqual("INVALID_TOKEN");
                });
        });
        
    });
    
    describe("Test stop broker", () => {
        it("should stop the broker", async () => {
            expect.assertions(1);
            await broker.stop();
            expect(broker).toBeDefined();
        });
    });    	
});