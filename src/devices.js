const {SmartAppContext, AttributeState} = require('@smartthings/smartapp');
const db = require('./db')
const PROFILE_ID = process.env.PROFILE_ID;

/**
 * Helper functions for creating the demand response control/indicator device and generating events for it.
 */
module.exports = {

    /**
     * Get the ID of the demand response device. Returns undefined if the device does not exist
     *
     * @param context {SmartAppContext} the SmartApp context object defining the configuration parameters and API
     * @returns {Promise<string|undefined>}
     */
    async getDeviceId(context) {
        const list = await context.api.devices.list();
        const device = list.find(it => it.app && it.app.profile.id === PROFILE_ID);
        if (device) {
            return device.deviceId;
        }
        return undefined;
    },

    /**
     * Get the current demandResponseMode value of the device
     *
     * @param context {SmartAppContext} the SmartApp context object defining the configuration parameters and API
     * @param deviceId {string}
     * @returns {Promise<string>}
     */
    async demandResponseMode(context, deviceId) {
        if (!deviceId) {
            deviceId = await this.getDeviceId(context);
        }
        const status = await context.api.devices.getCapabilityStatus(
            deviceId, 'main', 'detailmedia27985.demandResponseMode');

        return status.mode.value;
    },

    /**
     * Get the current demandResponseStatus value of the device
     *
     * @param context the SmartApp context object defining the configuration parameters and API
     * @param deviceId {string}
     * @returns {Promise<AttributeState>}
     */
    async demandResponseStatus(context, deviceId) {
        if (!deviceId) {
            deviceId = await this.getDeviceId(context);
        }
        const status = await context.api.devices.getCapabilityStatus(
            deviceId, 'main', 'detailmedia27985.demandResponseStatus');

        return status.currentStatus;
    },

    /**
     * Create a demand response device and initialize its state
     *
     * @param context {SmartAppContext} the SmartApp context object defining the configuration parameters and API
     * @returns {Promise<void>}
     */
    async createDevice(context) {
        const device = await context.api.devices.create({
            label: 'Electric Utility',
            app: {
                profileId: PROFILE_ID
            }
        });

        await context.api.devices.createEvents(device.deviceId, [
            {
                component: 'main',
                capability: 'detailmedia27985.demandResponseMode',
                attribute: 'mode',
                value: 'enabled'
            },
            {
                component: 'main',
                capability: 'detailmedia27985.demandResponseStatus',
                attribute: 'currentStatus',
                value: 'inactive'
            },
            {
                component: 'main',
                capability: 'detailmedia27985.message',
                attribute: 'text',
                value: ''
            }
        ]);
    },

    /**
     * Change the demandResponseMode value
     *
     * @param context {SmartAppContext} the SmartApp context object defining the configuration parameters and API
     * @param value {string} 'disabled' | 'enabled'
     * @returns {Promise<Status>}
     */
    async updateMode(context, value) {
        const deviceId = await this.getDeviceId(context);
        const events = [
            {
                component: 'main',
                capability: 'detailmedia27985.demandResponseMode',
                attribute: 'mode',
                value
            }
        ];
        return context.api.devices.createEvents(deviceId, events);
    },

    /**
     * Change the demandResponseStatus value. Also clears previous event message text when the status
     * is set to 'inactive'
     *
     * @param context {SmartAppContext} the SmartApp context object defining the configuration parameters and API
     * @param value {string} 'inactive' | 'pre' | 'active'
     * @returns {Promise<Status>}
     */
    async updateStatus(context, value) {
        const deviceId = await this.getDeviceId(context);
        const events = [
            {
                component: 'main',
                capability: 'detailmedia27985.demandResponseStatus',
                attribute: 'currentStatus',
                value
            }
        ];
        if (value === 'inactive') {
            events.push(
                {
                    component: 'main',
                    capability: 'detailmedia27985.message',
                    attribute: 'text',
                    value: ''
                }
            );
        }
        return context.api.devices.createEvents(deviceId, events);
    },

    /**
     *
     * @param context {SmartAppContext} the SmartApp context object defining the configuration parameters and API
     * @param delta {number} the number of degrees to adjust the values. Defaults to 0
     * @returns {Promise<Status[]>}
     */
    async initializeThermostatSetpoints(context, delta = 0) {
        const thermostats = await this.saveThermostatSetpoints(context)
        const ops = thermostats.map(it => {
            return context.api.devices.executeCommand(it.deviceId, {
                component: it.component,
                capability: 'thermostatCoolingSetpoint',
                command: 'setCoolingSetpoint',
                arguments: [it.value + delta]
            })
        })
        return Promise.all(ops)
    },

    /**
     *
     * @param context {SmartAppContext} the SmartApp context object defining the configuration parameters and API
     * @returns {Promise<{component: string, deviceId: string, value: number}[]>}
     */
    async saveThermostatSetpoints(context) {
        const ops = context.config.thermostats.map(async (it) => {
            const item = await context.api.devices.getCapabilityStatus(
                it.deviceConfig.deviceId,
                it.deviceConfig.componentId,
                'thermostatCoolingSetpoint')

            return {
                deviceId: it.deviceConfig.deviceId,
                component: it.deviceConfig.componentId,
                value: item.coolingSetpoint.value
            }
        })

        const data = await Promise.all(ops)
        await db.putState(context.installedAppId, data)
        return data
    },

    /**
     *
     * @param context {SmartAppContext} the SmartApp context object defining the configuration parameters and API
     * @param delta {number} the number of degrees to adjust the values. Defaults to 0
     * @returns {Promise<Status[]>}
     */
    async adjustThermostatSetpoints(context, delta = 0) {
        const data = await db.getState(context.installedAppId)
        const ops = data.thermostats.map(it => {
            return context.api.devices.executeCommand(it.deviceId, {
                component: it.component,
                capability: 'thermostatCoolingSetpoint',
                command: 'setCoolingSetpoint',
                arguments: [it.value + delta]
            })
        })
        return Promise.all(ops)
    }
};
