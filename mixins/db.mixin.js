/**
 * @license MIT, imicros.de (c) 2018 Andreas Leinen
 *
 * @source https://github.com/gothinkster/moleculer-node-realworld-example-app
 *
 */
"use strict";

/*
const path = require("path");
const mkdir = require("mkdirp").sync;
*/

const DbService	= require("moleculer-db");

module.exports = function(collection) {

    let uri = process.env.MONGO_URI
    
	if (uri) {
		// Mongo adapter
		const MongoAdapter = require("moleculer-db-adapter-mongo");

		return {
			mixins: [DbService],
			adapter: new MongoAdapter({
                uri: uri,
                server: {
                    socketOptions: {
                        keepAlive: 1,
                        connectTimeoutMS: 30000
                    }
                },
                replset: {
                    socketOptions: {
                        keepAlive: 1,
                        connectTimeoutMS: 30000
                    }
                }
            }),
			collection
		};
	}

    /*
	// --- NeDB fallback DB adapter
	
	// Create data folder
	mkdir(path.resolve("./data"));

	return {
		mixins: [DbService],
		adapter: new DbService.MemoryAdapter({ filename: `./data/${collection}.db` })
	};
    */
};