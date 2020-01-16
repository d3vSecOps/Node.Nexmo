
// Assuming that we have a connection to the message broker and we have items on the queue
'use strict';

//var Channel = require('./channel'); 
var Channel = require('./chanel');
var queue = 'queue';
Channel(queue, function(err, channel, conn) {    
  if (err) {  
    console.error(err.stack);  
  }  
  else {  
    console.log('channel and queue created');  
    consume();  
  }

  // Consume the messages
  function consume() {  
    //Get a message, passing in the queue name
    channel.get(queue, {}, onConsume);

    //Callback invoked when fetching a message succeeds or fails 
    //If there is no error, we check whether there was a message waiting 
    //If no message for us, we wait for a moment and then try again to fetch another message
    function onConsume(err, msg) {  
      if (err) {  
        console.warn(err.message);  
      }  
      else if (msg) {  
        console.log('consuming %j', msg.content.toString());  
        setTimeout(function() {  
          channel.ack(msg);  
          consume();    
        }, 1e3); 
        sendSMS(); 
      }        
      else {  
        console.log('no message, waiting...');  
        setTimeout(consume, 1e3);  
      }  
    }  

    //Begin Nexmo
    function sendSMS (){

            const config = require('./Config');
            const express = require('express');
            const bodyParser = require('body-parser');
            const ejs = require('ejs');
            const Nexmo = require('nexmo');
            const socketio = require('socket.io');

            const app = express();
            const server = app.listen(8000, () => {
            console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
        });

        // Nexmo init

        const nexmo = new Nexmo({
        apiKey: config.api_key,
        apiSecret: config.api_secret,
        }, {debug: true});

        // socket.io

        //const socketio = require('socket.io');
        const io = socketio(server);
        io.on('connection', (socket) => {
        console.log('Socket connected');
        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
        });

        // Configure Express

        app.set('views', __dirname + '/../Views');
        app.set('view engine', 'html');
        app.engine('html', ejs.renderFile);
        app.use(express.static(__dirname + '/../Public'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        // Express routes

        app.get('/', (req, res) => {
        res.render('Index');
        });

        app.post('/', (req, res) => {
        res.send(req.body);

        let toNumber = req.body.number;
        //let text = req.body.text;
        let text = msg;

        let data = {}; // the data to be emitted to front-end

        // Sending SMS via Nexmo

        nexmo.message.sendSms(
            config.name, config.number, toNumber, text, {type: 'unicode'},
            (err, responseData) => {
            if (err) {
                data = {error: err};
            } else {
                //console.dir(responseData);
                if(responseData.messages[0]['error-text']) {
                data = {error: responseData.messages[0]['error-text']};
                } else {
                /*let n = responseData.messages[0]['to'].substr(0, responseData.messages[0]['to'].length - 4) + '****';
                data = {id: responseData.messages[0]['message-id'], number: n};*/

                let data = {id: responseData.messages[0]['message-id'], number: responseData.messages[0]['to']};
                io.emit('smsStatus', data);

                }
                io.emit('smsStatus', data);
            }
            }
        );
      });
    }
    //End Nexmo
  }  
});