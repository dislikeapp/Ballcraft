
var Instance = function() {
	this.clients = new Map();
	this.log("Instance created.");
};
Instance.prototype = {
	started: false,
	
	start: function() {
		if (!this.started) {
			this.started = true;
			this.log("Instance started.");
		}
	},
	stop: function() {
		if (this.started) {
			this.started = false;
			this.log("Instance stopped.");
		}
	},
	
	addClient: function(client) {
		this.clients.insert(client.key, client);
		client.instance = this;
		this.connect(client);
		this.log("Client "+client.key+" joined instance.");
	},
	removeClient: function(client) {
		this.disconnect(client);
		client.instance = undefined;
		this.clients.removeKey(client.key);
		this.log("Client "+client.key+" left instance.");
	},
	
	update: function() {
		var client = this;
	},
	
	connect: function(client) {
		var inst = this;
		var socket = this.socket;
	},
	disconnect: function(client) {
		var socket = this.socket;
	}
};
Utils.Loggable(Instance, "INSTANCE", {
	color: BashStyle.Color.RED
});
Instance.prototype.constructor = Instance;
