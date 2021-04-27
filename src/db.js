const AWS = require('aws-sdk')
const AWS_REGION = process.env.AWS_REGION || 'us-east-1'
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE
const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT

AWS.config.update({ region: AWS_REGION, endpoint: DYNAMODB_ENDPOINT });
const docClient = new AWS.DynamoDB.DocumentClient()

module.exports = {
    pk(installedAppId) {
        return `state:${installedAppId}`
    },

    deviceStateKey(deviceId, component) {
        return `${deviceId}:${component}`
    },

    putState(installedAppId, thermostats) {
        const params = {
            TableName: DYNAMODB_TABLE,
            Item: {
                id: this.pk(installedAppId),
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
                id: this.pk(installedAppId),
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
                id: this.pk(installedAppId),
            }
        }
        return docClient.delete(params).promise()
    }
}
