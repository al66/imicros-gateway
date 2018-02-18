"use strict";

const { ServiceBroker } = require("moleculer");
const { ValidationError } = require("moleculer").Errors;
const TestService = require("../services/users.service");

let rand = Math.floor(Math.random() * Math.floor(100000));
let username = "user" + rand; 
let email = username + "@test.com";
let password = "secret:" + rand;
let token = null;

let broker = new ServiceBroker();
broker.createService(TestService);

describe("Test 'users' service", () => {

	beforeAll(() => broker.start());
	afterAll(() => broker.stop());

	describe("Test 'users.create' action", () => {
		it("should return with created user", () => {
            expect.assertions(2);
            return broker.call("users.create", { user: { username: username, email: email, password: password } }).then(result => {
                token = result.access_token;
                expect(result.user.username).toBe(username);
                expect(result.user.email).toBe(email);
            }).catch(error => {
                console.log("Error:", error)
            })
		});
	});
    
    describe("Test 'users.login' action", () => {
        it("should return with access token", () => {
            expect.assertions(3);
            return broker.call("users.login", { user: { email: email, password: password } }).then(result => {
                expect(result.access_token).toBeDefined();
                expect(result.user.username).toBe(username);
                expect(result.user.email).toBe(email);
            }).catch(error => {
                console.log("Error:", error)
            })
        })
    })
	
});
