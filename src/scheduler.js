const i18n = require('i18n');
const smartApp = require('./smartapp');
const devices = require('./devices');

/**
 * Utilities for scheduling events
 */
module.exports = {

    /**
     * Creates schedule for a demand response event, i.e. the start of the pre cool/heat period, the start of the
     * event itself, and the conclusion of the events. These schedules are used to update the device status and
     * control other devices
     *
     * @param installedAppId the installed SmartApp instance
     * @param start {Date} the start time of the demand response event
     * @param pre {Date} the start time of the pre cool/heat period. If the same as the start time then no pre
     * period is scheduled
     * @param end {Date} the end of the demand response event
     * @param duration the duration of the demand response event in minutes
     * @returns {Promise<void>}
     */
    async scheduleEvent(installedAppId, start, pre, end, duration) {

        // Constructs the context object, including the app configuration and APIs, from the persistent context store
        const context = await smartApp.withContext(installedAppId);

        // Get the ID of the demand response control/indicator device
        const deviceId = await devices.getDeviceId(context);

        // Adjust thermostat setpoints if an event is already in progress, since we can only handle one
        // event at a time. We're effectively overwriting events with this approach. The alternative would
        // be to reject requests if an event is already in progress.
        const {value} = await devices.demandResponseStatus(context, deviceId);
        if (value !== 'inactive') {
            await devices.adjustThermostatSetpoints(context)
        }

        // Delete any existing schedules
        await context.api.schedules.delete();

        // Schedule the pre-event start, if earlier than the event
        if (pre.getTime() < start.getTime()) {
            // Schedule the pre event start
            await context.api.schedules.create({
                name: 'preHandler',
                once: {
                    time: pre.getTime()
                }
            });

            // Schedule the event start
            await context.api.schedules.create({
                name: 'preStartHandler',
                once: {
                    time: start.getTime()
                }
            });
        } else {
            // Schedule the event start
            await context.api.schedules.create({
                name: 'startHandler',
                once: {
                    time: start.getTime()
                }
            });
        }

        // Schedule the event end
        await context.api.schedules.create({
            name: 'stopHandler',
            once: {
                time: end.getTime()
            }
        });

        // Get the location and format a local time string from the locale and time zome
        const location = await context.api.locations.get(context.locationId);
        const startTime = start.toLocaleTimeString(location.locale, {timeZone: location.timeZoneId});

        // Initialize translation of message strings using the location's locale
        i18n.init(location);
        const message = location.__mf('messages.drlcEventBody', {startTime, duration});

        // Update the control/indicator device
        await context.api.devices.createEvents(deviceId, [
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
                value: location.__mf('messages.drlcDeviceMessage', {startTime, duration})
            },
            {
                component: 'main',
                capability: 'detailmedia27985.demandResponseMode',
                attribute: 'mode',
                value: 'enabled'
            }
        ]);

        // Send push notifications to users. Note that all notifications will translated according to the
        // location's locale setting. Support for separate locations for different users in the same location
        // is not yet available.
        await context.api.notifications.create({
            type: 'ALERT',
            title: location.__('messages.drlcEventTitle'),
            code: message,
            deepLink: {
                type: 'device',
                id: deviceId
            },
        });
    }
};
