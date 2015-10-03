
function LobbyActivity(socket, parent) {
	Activity.call(this, socket, parent);
	this.client = socket.client;
}
LobbyActivity.prototype = {
	inWorld: false,
	
	onCreate: function() {
		this.connect();
		this.log("Client "+this.client.key+" entered lobby.");
	},
	onDestroy: function() {
		if (this.inWorld)
			this.postLeaveWorld();
		this.disconnect();
		this.log("Client "+this.client.key+" left lobby.");
	},
	
	postEnterWorld: function() {
		var client = this.socket.client;
		if (this.inWorld) {
			this.log("Client "+client.key+" failed to enter world. Already in-world.");
			return false;
		}
		this.inWorld = true;
		return true;
	},
	postLeaveWorld: function() {
		var client = this.socket.client;
		if (!this.inWorld) {
			this.log("Client "+client.key+" failed to leave world. Not in-world.");
			return;
		}
		this.inWorld = false;
		return;
	},
	
	connect: function() {
		var lobby = this;
		var socket = this.socket;
		socket.on("postEnterWorld", function(data) {
			if (lobby.postEnterWorld()) {
				lobby.startActivity(WorldActivity);
			}
		});
		socket.on("postLeaveWorld", function(data) {
			lobby.finishChildActivities();
			lobby.postLeaveWorld();
		});
	},
	disconnect: function(socket) {
		var socket = this.socket;
		socket.removeAllListeners("postEnterWorld");
		socket.removeAllListeners("postLeaveWorld");
	}
};
Utils.Loggable(LobbyActivity, "LOBBY", {
	color: BashStyle.Color.BLUE
});
Utils.merge(LobbyActivity.prototype, Activity.prototype);
LobbyActivity.prototype.constructor = LobbyActivity;
