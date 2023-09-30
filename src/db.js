const AWS = require('aws-sdk')
const AWS_REGION = process.env.AWS_REGION || 'us-east-1'
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE
const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT

AWS.config.update({ region: AWS_REGION, endpoint: DYNAMODB_ENDPOINT, accessKeyId: 'xxxyyyzzz', secretAccessKey: 'aaabbbccc' });
const docClient = new AWS.DynamoDB.DocumentClient()

module.exports = {
    statePk(installedAppId) {
        return `state:${installedAppId}`
    },

    deviceStateKey(deviceId, component) {
        return `${deviceId}:${component}`
    },

    putState(installedAppId, thermostats) {
        const params = {
            TableName: DYNAMODB_TABLE,
            Item: {
                id: this.statePk(installedAppId),
                thermostats: thermostats.reduce((map, it) => {
                    map[this.deviceStateKey(it.deviceId, it.component)] = it.value
                    return map
                }, {})
            }
        };
        return docClient.put(params).promise()
    },

    async getState(installedAppId) {
        const params = {
            TableName: DYNAMODB_TABLE,
            Key: {
                id: this.statePk(installedAppId),
            },
            ProjectionExpression: 'thermostats'
        }
        const data = await docClient.get(params).promise()
        if (data.Item && data.Item.thermostats) {
            const thermostats = Object.keys(data.Item.thermostats).map(key => {
                const [deviceId, component] = key.split(':')
                const value = data.Item.thermostats[key]
                return {deviceId, component, value}
            })
            return {thermostats}
        }
        return {thermostats: []}
    },

    clearState(installedAppId) {
        const params = {
            TableName: DYNAMODB_TABLE,
            Key: {
                id: this.statePk(installedAppId),
            }
        }
        return docClient.delete(params).promise()
    },

    credentialsPk(installedAppId) {
        return `credentials:${installedAppId}`
    },

    putCredentials(installedAppId, credentials) {
        const params = {
            TableName: DYNAMODB_TABLE,
            Item: {
                id: this.credentialsPk(installedAppId),
                credentials
            }
        };
        return docClient.put(params).promise()
    },

    getCredentials(installedAppId) {
        const params = {
            TableName: DYNAMODB_TABLE,
            Key: {
                id: this.credentialsPk(installedAppId),
            },
            ProjectionExpression: 'credentials'
        }
        return docClient.get(params).promise().then(data => data.Item ? data.Item.credentials : undefined)
    },

    clearCredentials(installedAppId) {
        const params = {
            TableName: DYNAMODB_TABLE,
            Key: {
                id: this.credentialsPk(installedAppId),
            }
        }
        return docClient.delete(params).promise()
    },

    clearAll(installedAppId) {
        return Promise.allSettled([
            this.clearState(installedAppId),
            this.clearCredentials(installedAppId)
        ])
    }
}
