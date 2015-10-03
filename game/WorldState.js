
var WorldState = function() {
	GameState.call(this);
};
WorldState.prototype = {
	clients: undefined,
	
	initState: function() {
		this.clients = [];
		this.connect();
		app.initScene();
		this.clients[app.clientKey] = app.player;
		
		this.updateTimer = setInterval(this.update.bind(this), 100);
		
		var chatInput = document.getElementById("chatMessageInput");
		chatInput.addEventListener("keydown", function(event) {
			if (event.keyCode == 13) {
				this.postChatMessage(chatInput.value);
				chatInput.value = "";
			}
		}.bind(this));
		
		var overlay = document.getElementById("ingameOverlay");
		overlay.style.display = "inline-block";
	},
	exitState: function() {
		this.disconnect();
		app.exitScene();
		app.socket.emit("postLeaveWorld");
		
		clearInterval(this.updateTimer);
		this.updateTimer = undefined;
		
		var overlay = document.getElementById("loginOverlay");
		overlay.style.display = "none";
	},
	
	postChatMessage: function(message) {
		app.socket.emit("postChatMessage", {message: message});
	},
	addClient: function(key, clientData) {
		if (key != app.clientKey) {
			if (this.clients[key] === undefined) {
				this.clients[key] = app.mScene.mRoot.addChild(new Actor(false));
				console.log("Client "+key+" added: "+clientData.alias);
			}
		}
	},
	removeClient: function(key) {
		if (key != app.clientKey) {
			if (this.clients[key] !== undefined) {
				this.clients[key].destroy();
				this.clients[key] = undefined;
				delete this.clients[key];
				console.log("Client "+key+" removed");
			}
		}
	},
	updateClient: function(key, clientData) {
		if (this.clients[key] !== undefined) {
			var actor = this.clients[key];
			var pos = clientData.pos;
			var vel = clientData.vel;
			var rot = clientData.rot;
			actor.setPosf(pos[0], pos[1], pos[2]);
			actor.velocity.setf(vel[0], vel[1], vel[2]);
			actor.setRotf(rot[0], rot[1], rot[2], rot[3]);
		}
	},
	update: function() {
		var overlay = document.getElementById("ingameOverlay");
		
		if (this.sceneX != app.mScene.mSceneX ||
			this.sceneY != app.mScene.mSceneY) {
			this.sceneX = app.mScene.mSceneX;
			this.sceneY = app.mScene.mSceneY;
			app.socket.emit("postShiftScene", {
				sceneX: this.sceneX,
				sceneY: this.sceneY
			});
			
			var text = getElementsByName(overlay, "worldPos")[0];
			text.innerHTML = "("+this.sceneX+", "+this.sceneY+")";
		}
		
		var pos = app.player.getPos();
		var vel = app.player.velocity;
		var rot = app.player.getRot();
		app.socket.emit("postAnimFrame", {
			pos: [pos.x, pos.y, pos.z],
			vel: [vel.x, vel.y, vel.z],
			rot: [rot.x, rot.y, rot.z, rot.w]
		});
		
		var text = getElementsByName(overlay, "localPos")[0];
		text.innerHTML = "("+pos.x.toFixed(2)+", "+pos.y.toFixed(2)+", "+pos.z.toFixed(2)+")";
	},
	
	connect: function() {
		var world = this;
		var socket = app.socket;
		socket.on("postMessageEvent", function(data) {
			var messageClasses = {
				"server": "serverMessage",
				"debug": "chatMessage",
				"chat": "chatMessage",
				"instance": "instanceMessage"
			};
			var output = document.getElementById("messageOutput");
			var entry = document.createElement("div");
			entry.setAttribute("class", messageClasses[data.type]);
			var content = "";
			
			switch (data.type) {
				case "server": content = "[Server] "+data.content; break;
				case "debug": content = "[Debug] "+data.content; break;
				case "chat": content = "["+data.username+"]: "+data.content; break;
				case "instance": content = "[Instance] "+data.content; break;
			}
			
			var scrollToEnd = (output.scrollTop == output.scrollHeight - output.offsetHeight);
			
			entry.innerHTML = content;
			output.appendChild(entry);
			
			if (scrollToEnd) {
				output.scrollTop = output.scrollHeight - output.offsetHeight;
			}
		});
		socket.on("postClientEnter", function(data) {
			world.addClient(data.key, data);
		});
		socket.on("postClientLeave", function(data) {
			world.removeClient(data.key);
		});
		socket.on("postFullFrame", function(data) {
			for (var key in data) {
				var clientData = data[key];
				if (world.clients[key] === undefined) {
					world.addClient(key, clientData);
				}
				world.updateClient(key, clientData);
			}
		});
		socket.on("postInputEvent", function(data) {
			var actor = world.clients[data.key];
			if (actor) {
				actor.inputEvent(data.event, data.code);
			}
		});
	},
	disconnect: function() {
		var socket = app.socket;
		socket.removeAllListeners("postMessageEvent");
		socket.removeAllListeners("postClientEnter");
		socket.removeAllListeners("postClientLeave");
		socket.removeAllListeners("postFullFrame");
		socket.removeAllListeners("postInputEvent");
	}
};
OE.Utils.merge(WorldState.prototype, GameState.prototype);
WorldState.prototype.constructor = WorldState;
