const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

//Connect to Mongo
mongo.connect('mongodb://127.0.0.1/websocket_mongodb_tutorial', function(err, db){
	if(err){
		throw err;
	}
	console.log('MongoDB connected....');

	//Connect to socket.io
	client.on('connection', function(socket){
		let chat = db.collection('chats');

		//Create function to send status
		sendStatus = function(s){
			socket.emit('status', s);
		}

		//Get chats from collection
		chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
			if(err){
				throw err;
			}

			//if no error Emit the messages
			socket.emit('output', res);
		});

		//Handle input events
		socket.on('input', function(data){
			let name = data.name;
			let message = data.message;

			//Check for name & message
			if(name == '' || message == ''){
				// Send error status
				sendStatus('Please enter a name and message');
			} else {
				//Insert Message to db
				chat.insert({name: name, message: message}, function(){
					client.emit('output', [data]);

					//Send Status objects
					sendStatus({
						message:'Message sent',
						clear: true
					});
				});
			}
		});

		//Handle clear
		socket.on('clear', function(data){
			//Remove all chats from collection
			chat.remove({}, function(){
				//Emit cleared
				socket.emit('cleared');
			});
		});
	});
});