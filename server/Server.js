
eval(readFile("Data.js"));
eval(readFile("Instance.js"));
eval(readFile("Activity.js"));

eval(readFile("LoginActivity.js"));
eval(readFile("LobbyActivity.js"));
eval(readFile("WorldActivity.js"));

function Account(accountData) {
	this.accountKey = accountData.id;
	this.username = accountData.username;
};

function Client(socket, account) {
	this.key = undefined;
	this.socket = socket;
	this.account = account;
	this.alias = account.username;
};

function Server() {
	this.SERVER_NAME = "Test Server";
	this.MAX_CLIENTS = 100;
};
Server.prototype = {
	run: function() {
		this.clients = new Map();
		this.instances = new Map();
		
		this.connect();
		this.log("Server started.");
		
		this.mainInstance = new Instance();
		this.instances.insertNext(this.mainInstance);
		this.mainInstance.start();
	},
	finish: function() {
		this.disconnect();
	},
	connect: function() {
		var server = this;
		io.sockets.on("connection", function(socket) {
			server.log("Client connected.");
			
			var login = new LoginActivity(socket);
			socket.client = undefined;
			socket.mainActivity = login;
			socket.mainActivity.onCreate();
			
			socket.on("disconnect", function() {
				socket.mainActivity.finish();
				socket.mainActivity = undefined;
				server.log("Client disconnected.");
			});
			socket.on("getServerInfo", function() {
				var numUsers = 0;
				for (var key in server.clients.data) {
					numUsers++;
				}
				socket.emit("serverInfo", {
					"name"		: server.SERVER_NAME,
					"maxUsers"	: server.MAX_CLIENTS,
					"numUsers"	: numUsers
				});
			});
			socket.on("exec", function(data) {
				var result = {
					requestID: data.requestID,
					data: ""
				};
				try {
					result.data = Utils.censor(eval("(function() {"+data.code+"})();"));
				}
				catch(e) {
					result.data = "Exception: "+e.message+"\nStack: "+e.stack;
				}
				socket.emit("execResult", result);
			});
		});
	},
	disconnect: function() {
		io.sockets.removeAllListeners("connection");
	}
};
Utils.Loggable(Server, "SERVER", {
	color: BashStyle.Color.CYAN
});
