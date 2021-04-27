require('dotenv').config();
const express = require('express');
const path = require('path');
const smartApp = require('./src/smartapp');
const scheduler = require('./src/scheduler');
const server = module.exports = express();
const PORT = process.env.PORT || 3000;

/* Configure serving of assets */
server.use(express.static(path.join(__dirname, 'public')));

/* Configure Express to handle JSON lifecycle event calls from SmartThings */
server.use(express.json());
server.post('/', (req, res, next) => {
    smartApp.handleHttpCallback(req, res);
});

/**
 * Web-hook for demand response event calls from the energy service. Durations are in minutes. The resourse_id is the
 * installedAppId of the installed instance of this app. Pre-duration can be zero, indicating that there is no pre-cool
 * period.
 *
 * Example:
 {
    "start": "2021-04-23T21:28:00Z",
    "pre_duration": 60,
    "duration": 60,
    "resource_id": ["6ac1fd71-2508-47f8-a6d8-d40036503b79"]
  }
 */
server.post('/event', async (req, res, next) => {
    try {
        console.log(JSON.stringify(req.body, null, 2));
        const start = new Date(req.body.start);
        const pre = new Date(start.getTime() - (req.body.pre_duration * 60000));
        const end = new Date(start.getTime() + (req.body.duration * 60000));

        await Promise.all(req.body.resource_id.map(id => {
            return scheduler.scheduleEvent(id, start, pre, end, req.body.duration);
        }));
        res.send({status: 'OK'});
    } catch (e) {
        console.log('Error processing event', e);
        res.status(500);
        res.send({message: e.message});
    }
});

/* Start listening at your defined PORT */
server.listen(PORT, () => console.log(`Server is up and running on port ${PORT}`));
