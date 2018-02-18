"use strict";

const os = require("os");

process.env.MONGO_URI = "mongodb://192.168.2.124/test"

module.exports = {
	// It will be unique when scale up instances in Docker or on local computer
	nodeID: os.hostname().toLowerCase() + "-" + process.pid,

	logger: true,
	logLevel: "info",

	//transporter: "nats://localhost:4222",

	cacher: "memory",

	metrics: true,
    internalServices: true
};