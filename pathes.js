var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var watson = require('watson-developer-cloud');
var app = express();
var contexid = "";

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var conversation_id = "";
var w_conversation = watson.conversation({
    url: 'https://gateway.watsonplatform.net/conversation/api',
    username: process.env.CONVERSATION_USERNAME || '35d3fbc2-8461-4190-bab5-01ee0f9f7c42',
    password: process.env.CONVERSATION_PASSWORD || 's5WwF5Jjnv1w',
    version: 'v1',
    version_date: '2016-07-11'
});
var workspace = process.env.WORKSPACE_ID || '099c102c-a1c7-4acb-a24e-9b65f526f19e';

app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'EAAFtDLAGOc0BAGNL2EfNzW1jLKBpiwLBOKxgQjHeuvwsubMFi3dhproo9Nlb1soJ6LX8qPIcZBgUzYfQtuZBUdhineS5LAP5lZBrfnq3XIFC9G8HRMSMMtAbH2u4ZCvJ1CDRWkqNFdnnYyGeudDHZAoW8O6ZAKp1jIPQ6FCIDR8gZDZD') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Erro de validação no token.');
});

app.post('/webhook/', function (req, res) {
	request({
    uri: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token=EAAFtDLAGOc0BAGNL2EfNzW1jLKBpiwLBOKxgQjHeuvwsubMFi3dhproo9Nlb1soJ6LX8qPIcZBgUzYfQtuZBUdhineS5LAP5lZBrfnq3XIFC9G8HRMSMMtAbH2u4ZCvJ1CDRWkqNFdnnYyGeudDHZAoW8O6ZAKp1jIPQ6FCIDR8gZDZD',
    qs: { access_token:  'EAAFtDLAGOc0BAGNL2EfNzW1jLKBpiwLBOKxgQjHeuvwsubMFi3dhproo9Nlb1soJ6LX8qPIcZBgUzYfQtuZBUdhineS5LAP5lZBrfnq3XIFC9G8HRMSMMtAbH2u4ZCvJ1CDRWkqNFdnnYyGeudDHZAoW8O6ZAKp1jIPQ6FCIDR8gZDZD'},
    method: 'POST',
    json: {
        get_started: {
            payload: 'GET_STARTED_PAYLOAD'
        }
    }
}, function(e, r, b){
    if (!e) {
        console.log(r)
    }
});
	var text = null;
	
    messaging_events = req.body.entry[0].messaging;
	for (i = 0; i < messaging_events.length; i++) {	
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;

        if (event.message && event.message.text) {
			text = event.message.text;
		}else if (event.postback && !text) {
			text = event.postback.payload;
		}else{
			break;
		}
		
		var params = {
			input: text,
			// context: {"conversation_id": conversation_id}
			context:contexid
		}

		var payload = {
			workspace_id: "099c102c-a1c7-4acb-a24e-9b65f526f19e"
		};

		if (params) {
			if (params.input) {
				params.input = params.input.replace("\n","");
				payload.input = { "text": params.input };
			}
			if (params.context) {
				payload.context = params.context;
			}
		}
		callWatson(payload, sender);
    }
    res.sendStatus(200);
});

function callWatson(payload, sender) {
	w_conversation.message(payload, function (err, convResults) {
		 console.log(convResults);
		contexid = convResults.context;
		
        if (err) {
            return responseToRequest.send("Erro.");
        }
		
		if(convResults.context != null)
    	   conversation_id = convResults.context.conversation_id;
        if(convResults != null && convResults.output != null){
			var i = 0;
			while(i < convResults.output.text.length){
				sendMessage(sender, convResults.output.text[i++]);
			}
		}
            
    });
}

function sendMessage(sender, text_) {
	text_ = text_.substring(0, 319);
	messageData = {	text: text_  };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: 'EAAFtDLAGOc0BAGNL2EfNzW1jLKBpiwLBOKxgQjHeuvwsubMFi3dhproo9Nlb1soJ6LX8qPIcZBgUzYfQtuZBUdhineS5LAP5lZBrfnq3XIFC9G8HRMSMMtAbH2u4ZCvJ1CDRWkqNFdnnYyGeudDHZAoW8O6ZAKp1jIPQ6FCIDR8gZDZD'},
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

var token = "EAAFtDLAGOc0BAGNL2EfNzW1jLKBpiwLBOKxgQjHeuvwsubMFi3dhproo9Nlb1soJ6LX8qPIcZBgUzYfQtuZBUdhineS5LAP5lZBrfnq3XIFC9G8HRMSMMtAbH2u4ZCvJ1CDRWkqNFdnnYyGeudDHZAoW8O6ZAKp1jIPQ6FCIDR8gZDZD";
var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3000);
app.listen(port, host);
