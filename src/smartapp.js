const SmartApp = require('@smartthings/smartapp');
const DynamoDBContextStore = require('@smartthings/dynamodb-context-store');
const intro1 = require('./handlers/pages/intro1');
const intro2 = require('./handlers/pages/intro2');
const location = require('./handlers/pages/location');
const utility = require('./handlers/pages/utility');
const initialized = require('./handlers/initialized');
const updated = require('./handlers/updated');
const startHandler = require('./handlers/start-handler');
const preHandler = require('./handlers/pre-handler');
const preStartHandler = require('./handlers/pre-start-handler');
const stopHandler = require('./handlers/stop-handler');
const uninstalled = require('./handlers/uninstalled');
const modeCommand = require('./handlers/mode-command');

const APP_ID = process.env.APP_ID;
const CLIENT_ID = process.env.APP_ID;
const CLIENT_SECRET = process.env.APP_ID;
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT;

/**
 * The service providing persistent storage of access and refresh tokens as well as the app configuration options.
 * Persistent storage of tokens is required whenever the app needs to call the SmartThings APIs other than in response
 * to lifecycle events. Such calls are necessary in this case so that demand response events can be scheduled in
 * when calls are received by Enersponse.
 *
 * @type {DynamoDBContextStore}
 */
const contextStore = new DynamoDBContextStore({
    table: {
        name: DYNAMODB_TABLE
    },
    AWSConfigJSON: {
        region: 'us-east-1',
        endpoint: DYNAMODB_ENDPOINT
    },
    autoCreate: true
});

/**
 * The SmartApp
 * @type {SmartApp}
 */
module.exports = new SmartApp()
    .configureI18n({updateFiles: false})
    .enableEventLogging(2)
    .appId(APP_ID)
    .appId(CLIENT_ID)
    .appId(CLIENT_SECRET)
    .contextStore(contextStore)
    .disableCustomDisplayName()
    .permissions(['i:deviceprofiles:*', 'r:locations:*', 'x:notifications:*'])
    .page('intro1', intro1)
    .page('intro2', intro2)
    .page('location', location)
    .page('utility', utility)
    .initialized(initialized)
    .updated(updated)
    .uninstalled(uninstalled)
    .scheduledEventHandler('startHandler', startHandler)
    .scheduledEventHandler('preStartHandler', preStartHandler)
    .scheduledEventHandler('stopHandler', stopHandler)
    .scheduledEventHandler('preHandler', preHandler)
    .deviceCommand('stsolutions.demandResponseMode/setMode', modeCommand);

