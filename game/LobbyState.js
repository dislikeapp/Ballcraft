
var LobbyState = function() {
	GameState.call(this);
};
LobbyState.prototype = {
	initState: function() {
		this.connect();
		this.enterWorld();
	},
	exitState: function() {
		this.disconnect();
	},
	
	enterWorld: function() {
		app.socket.emit("postEnterWorld");
		app.switchStates(app.STATE_WORLD);
	},
	
	connect: function() {
		var login = this;
		var socket = app.socket;
	},
	disconnect: function() {
		var socket = app.socket;
	}
};
OE.Utils.merge(LobbyState.prototype, GameState.prototype);
LobbyState.prototype.constructor = LobbyState;
