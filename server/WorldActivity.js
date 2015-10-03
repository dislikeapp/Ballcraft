
function Player() {
	OE.Movable.call(this);
	this.velocity = new OE.Vector3();
	this.inputStates = {
		keyDown: new Array(8)
		//mouseDown: new Array(3)
	};
	for (var i=0; i<this.inputStates.keyDown.length; i++)
		this.inputStates.keyDown[i] = false;
	//for (var i=0; i<this.inputStates.mouseDown.length; i++)
		//this.inputStates.mouseDown[i] = false;
}
Player.prototype = {
	sceneX: 0,
	sceneY: 0,
	velocity: undefined,
	inputStates: undefined,
	
	inputEvent: function(event, code) {
		switch (event) {
			case 0: this.inputStates.keyDown[code] = true; break;
			case 1: this.inputStates.keyDown[code] = false; break;
			//case 2: this.inputStates.mouseDown[code] = true; break;
			//case 3: this.inputStates.mouseDown[code] = false; break;
		}
		if (event == 0 && code == 6) {
			// this.jump();
		}
	}
};
Utils.merge(Player.prototype, OE.Movable.prototype);
Player.prototype.constructor = Player;

function WorldActivity(socket, parent) {
	Activity.call(this, socket, parent);
	this.client = socket.client;
}
WorldActivity.prototype = {
	client: undefined,
	player: undefined,
	instance: undefined,
	
	onCreate: function() {
		this.player = this.client.player = new Player();
		this.connect();
		this.log("Client "+this.client.key+" entered world.");
		
		server.mainInstance.addClient(this.client);
		this.instance = this.client.instance;
		
		this.postClientEnter();
		this.postInstanceMessage(this.client.alias+" has joined the instance.");
		
		this.updateTimer = setInterval(this.update.bind(this), 200);
	},
	onDestroy: function() {
		this.player = this.client.player = undefined;
		this.disconnect();
		this.log("Client "+this.client.key+" left world.");
		
		clearInterval(this.updateTimer);
		this.updateTimer = undefined;
		
		this.postClientLeave();
		this.postInstanceMessage(this.client.alias+" has left the instance.");
		
		if (this.client.instance)
			this.client.instance.removeClient(this.client);
		this.instance = undefined;
	},
	
	update: function() {
		this.postFullFrame();
	},
	
	emitToInstance: function(message, data, includeSelf) {
		if (includeSelf === undefined) includeSelf = false;
		var inst = this.instance;
		for (var key in inst.clients.data) {
			var client = inst.clients.data[key];
			if (includeSelf || client !== this.client) {
				client.socket.emit(message, data);
			}
		}
	},
	emitToVisible: function(message, data, includeSelf) {
		if (includeSelf === undefined) includeSelf = false;
		var inst = this.instance;
		for (var key in inst.clients.data) {
			var client = inst.clients.data[key];
			if (includeSelf || client !== this.client) {
				var offx = client.player.sceneX - this.player.sceneX;
				var offy = client.player.sceneY - this.player.sceneY;
				if (Math.abs(offx) < 3 && Math.abs(offy) < 3) {
					client.socket.emit(message, data);
				}
			}
		}
	},
	postServerMessage: function(message) {
		this.emitToInstance("postMessageEvent", {
			type: "server",
			content: message
		}, true);
	},
	postDebugMessage: function(message) {
		this.emitToInstance("postMessageEvent", {
			type: "debug",
			content: message
		}, true);
	},
	postInstanceMessage: function(message) {
		this.emitToInstance("postMessageEvent", {
			type: "instance",
			content: message
		}, true);
	},
	postChatMessage: function(message) {
		this.emitToInstance("postMessageEvent", {
			type: "chat",
			username: this.client.alias,
			content: message
		}, true);
	},
	postClientEnter: function() {
		var inst = this.instance;
		if (inst) {
			var p = this.player.getPos();
			var data = {
				key: this.client.key,
				alias: this.client.alias,
				pos: [p.x, p.y, p.z]
			};
			this.emitToInstance("postClientEnter", data);
		}
	},
	postClientLeave: function() {
		var inst = this.instance;
		if (inst) {
			var data = {
				key: this.client.key
			};
			this.emitToInstance("postClientLeave", data);
		}
	},
	postFullFrame: function() {
		var result = {};
		var inst = this.instance;
		if (inst) {
			for (var key in inst.clients.data) {
				var client = inst.clients.data[key];
				var p = client.player.getPos();
				var v = client.player.velocity;
				var r = client.player.getRot();
				var offx = client.player.sceneX - this.player.sceneX;
				var offy = client.player.sceneY - this.player.sceneY;
				if (Math.abs(offx) < 3 && Math.abs(offy) < 3) {
					if (client !== this.client) {
						result[key] = {
							alias: client.alias,
							pos: [	p.x + offx*500.0,
									p.y,
									p.z + offy*500.0
							],
							vel: [v.x, v.y, v.z],
							rot: [r.x, r.y, r.z, r.w]
						};
					}
				}
			}
			this.socket.emit("postFullFrame", result);
		}
	},
	postShiftScene: function(data) {
		this.player.sceneX = data.sceneX;
		this.player.sceneY = data.sceneY;
		//this.emitToInstance("postShiftScene", {
		//	sceneX: this.player.sceneX,
		//	sceneY: this.player.sceneY,
		//});
	},
	
	connect: function() {
		var world = this;
		var socket = this.socket;
		var client = socket.client;
		var player = client.player;
		socket.on("postChatMessage", function(data) {
			world.postChatMessage(data.message);
		});
		socket.on("postAnimFrame", function(data) {
			player.setPosf(data.pos[0], data.pos[1], data.pos[2]);
			player.velocity.setf(data.vel[0], data.vel[1], data.vel[2]);
			player.setRotf(data.rot[0], data.rot[1], data.rot[2], data.rot[3]);
		});
		socket.on("postShiftScene", world.postShiftScene.bind(world));
		socket.on("postInputEvent", function(data) {
			player.inputEvent(data.event, data.code);
			world.emitToVisible("postInputEvent", {
				key: client.key,
				event: data.event,
				code: data.code
			});
		});
	},
	disconnect: function() {
		var socket = this.socket;
		socket.removeAllListeners("postChatMessage");
		socket.removeAllListeners("postAnimFrame");
		socket.removeAllListeners("postShiftScene");
		socket.removeAllListeners("postInputEvent");
	}
};
Utils.Loggable(WorldActivity, "WORLD", {
	color: BashStyle.Color.YELLOW
});
Utils.merge(WorldActivity.prototype, Activity.prototype);
WorldActivity.prototype.constructor = WorldActivity;
