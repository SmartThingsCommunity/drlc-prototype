# Example Demand Response SmartApp

This SmartApp integrates with a hypothetical energy services provider to 
enable SmartThings devices to participate in a demand response program. 
The SmartApp sends a push notification to users informing them when a demand response
event is scheduled and provides direct control of thermostats during the event.
It also creates a device that can be used in the SmartThings rule builder
to take additional actions during events and to opt out of participation in
an event at the user's discretion.

## Prerequisites

To run your own version of this prototype you need:

* The SmartThings mobile app for 
  [Android](https://play.google.com/store/apps/details?id=com.samsung.android.oneconnect) 
  or [iOS](https://apps.apple.com/us/app/smartthings/id1222822904)
* A [SmartThings developer account](https://smartthings.developer.samsung.com/)
* The latest release of the [SmartThings CLI](https://github.com/SmartThingsCommunity/smartthings-cli/releases)  
* [NodeJS](https://nodejs.org/en/) 12.X or later
* A server reachable from the Internet. This can be a local server and tunneling software such as 
  [ngrok](https://ngrok.com/)
* Either [Docker](https://www.docker.com/) or an [Amazon AWS account](https://aws.amazon.com/)


## Running the SmartApp

#### 1. Clone this repository and change to the project directory
```bash
git clone https://github.com/SmartThingsCommunity/drlc-prototype
cd drlc-prototype
```

#### 2. Create the .env file
Copy the .env.example file to .env
```bash
cp .env.example .env
```
You'll edit this file later. Just copying it is OK for now.

#### 3. Start the Docker container hosting the local DynamoDB instance
```bash
docker-compose up -d
```
If you have an AWS account and prefer to use the real DynamoDB cloud server, you can 
configure that and remove the DYNAMODB_ENDPOINT line from the `.env` file.

#### 4. Start the server
```bash
npm start
```

#### 5. Start the tunneling software (unless the server is already accessible from the internet)
```bash
ngrok start http 3000
```
You can use the free version of ngrok but be aware that it creates a new hostname every time you
restart it, which will require updating your SmartApp registration, so you may want to keep it
running for the duration of the test.

#### 6. Register your SmartApp in the SmartThings Developer Workspace
* Sign in to the [Developer Workspace](https://smartthings.developer.samsung.com/workspace)
* Create a [new project](https://smartthings.developer.samsung.com/workspace/projects/new)
  * Click the _Automation for the SmartThings App_ option and click _CONTINUE_.
  * Enter a project name and click _CREATE PROJECT_.
  * Click _REGISTER APP_.
  * Select _WebHook Endpoint_.
  * Enter your server's public HTTPS URL as the TargetURL (from ngrok, if you are using it) 
    and click _NEXT_.
  * Fill in the _App Display Name_ and _Description_ fields
  * Select the `i:deviceprofiles:*`, `r:devices:*`, `x:devices:*`, and `r:locations:*` scopes 
    and click _NEXT_.
  * Leave the fields on the next page blank and click _SAVE_ (you don't need to do anything
    with the client ID and client secret yet)
  * Look in your server log for a "confirmationUrl" and either paste that URL into a browser
    window or request it with curl. This action confirms your ownership of the server.
  * Go to the _Overview_ page and click _DEPLOY TO TEST_.
  * Enable [Developer Mode](https://smartthings.developer.samsung.com/docs/testing/developer-mode.html)
    in the SmartThings mobile app so that you can install your app when the time comes.
    
#### 7. Add the notifications scope to your app
The scope necessary for sending push notifications is not yet available in the Developer Workspace.
To add it:

* Go to the _Develop -> Automation Connector_ page of your app in the Developer Workspace and note
  the _App ID_
* While in the project directory, run this SmartThings CLI command, replacing `APP_ID` with the ID you just copies
  from the Developer Workspace.
  ```
  smartthings apps:oauth:generate APP_ID -i oauth.json
  ```
* Make note of the new client ID and client secret output from the command.

#### 8. Customize the .env file with your app and server information
Edit the `.env. file and replace the APP_ID value with the one from the Developer Workspace and the CLIENT_ID and 
CLIENT_SECRET values from the CLI command output. Replace SERVER_URL with the URL of your public
server (the same one you entered at Target URL in the workspace).

#### 9. Get an NREL API key and add it to the .env file

Signup for an [API key at NREL](https://developer.nrel.gov/signup/) and replace the NREL_API_KEY
value in the .env file with it.

#### 10. Restart your server
Restart you server by killing and re-running `npm start`. Note that you do not have to restart
ngrok.

## Installing the SmartApp

Your SmartApp is now running and ready to go. To install it in your SmartThings account open 
the SmartThings mobile app and:
* Tap the **+** icon in the upper right corner of the screen.
* Tap _SmartApp_
* Scroll down and you should see the display name you entered in the workspace (make sure you have
  put your mobile app in [developer mode](https://smartthings.developer.samsung.com/docs/testing/developer-mode.html))
* Tap _Next_ twice to move through the introduction screens.
* Enter your zip code on the third screen and tap _Next_.
* Select your electric utility and select any thermostats you want to be controlled during demand
  response event. You can also adjust the pre-cool and event temperature values. Tap _Done_ 
  when you are finished.
* Tap _Allow_ to finish app installation.

## Simulating demand response events

You can simulate demand response events by making HTTP requests to your server 
using the `http:/localhost:3000/event` endpoint if on the same machine as the server 
or the SERVER_URL endpoint if not. To do so, you need the 
installedAppId of your installed SmartApp instance. You can get
that using the CLI with:
```bash
smartthings installedapps
```
To create a demand response event make an HTTP request with a payload like this one:
```json
{
  "start": "2021-04-27T13:30:00Z",
  "pre_duration": 2,
  "duration": 5,
  "resource_id": ["29769bdf-5c63-4df6-9ac2-d6408e9efb47"]
}
```
This  payload creates a 5-minute event with a 2-minute pre-cool period. Set the 
_start_ property to a time in 
the future and replace the _resource_id_ value with
your installedAppId and make a POST request to the event endpoint. For example, if 
you put the above payload in a file named
`event.json` then run:
```bash
curl -H "Content-Type: application/json" http://localhost:3000/event -d @event.json
```

You should receive a push notification informing you of the upcoming event. Tap on that notification
to be taken to the demand response device. At the scheduled times you should see the event status 
update on the device. If you selected a thermostat you should also see its cooling setpoint adjusted
for the pre-cool and event periods. You can create automations in the SmartThings app to take other 
actions when the demand response event status changes.


