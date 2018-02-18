let { ServiceBroker } = require("moleculer");
let Gateway = require("./services/gateway");

let broker = new ServiceBroker({ logger: console });

// Load API Gateway
broker.createService(Gateway);

// Start server
broker.start();