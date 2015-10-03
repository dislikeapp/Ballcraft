
function LoginActivity(socket, parent) {
	Activity.call(this, socket, parent);
}
LoginActivity.prototype = {
	onCreate: function() {
		this.connect();
	},
	onDestroy: function() {
		if (this.socket.client !== undefined) {
			this.postLogout();
		}
		
		this.disconnect();
	},
	
	postRegister: function(data) {
		var socket = this.socket;
		
		var username = data.username;
		var password = data.password;
		var email = data.email;
		
		if (socket.client !== undefined) {
			this.log("Failed to register user '"+username+"'. Already logged in as '"+socket.client.account.username+"'.");
			socket.emit("registerFailure", {
				"message" : "Your session is already logged in."
			});
			return false;
		}
		var accountData = Database.getAccountByName(username);
		if (accountData !== undefined) {
			this.log("Failed register for user '"+username+"'. Username already exists.");
			socket.emit("registerFailure", {
				"message" : "The username you entered already exists."
			});
			return false;
		}
		accountData = Database.createAccount(username, password, email);
		if (accountData === undefined) {
			this.log("Failed register for user '"+username+"'. Internal database error.");
			socket.emit("registerFailure", {
				"message" : "An internal database error occurred."
			});
			return false;
		}
		
		socket.emit("registerSuccess");
		this.log("New client registered as: "+accountData.username);
		return true;
	},
	
	postLogin: function(username, password) {
		var socket = this.socket;
		
		if (socket.client !== undefined) {
			this.log("Failed login for user '"+username+"'. Already logged in.");
			socket.emit("loginFailure", {
				"message" : "Your session is already logged in."
			});
			return false;
		}
		
		var accountData = Database.getAccountByName(username);
		if (accountData === undefined) {
			this.log("Failed login for user '"+username+"'. Username not found.");
			socket.emit("loginFailure", {
				"message" : "The username and password combination you entered could not be found."
			});
			return false;
		}
		if (!Database.passwordCorrect(accountData.id, password)) {
			this.log("Failed login for user '"+username+"'. Password incorrect.");
			socket.emit("loginFailure", {
				"message" : "The username and password combination you entered could not be found."
			});
			return false;
		}
		
		var account = new Account(accountData);
		var client = new Client(socket, account);
		var key = server.clients.insertNext(client);
		client.key = key;
		socket.client = client;
		socket.emit("loginSuccess", {clientKey: key});
		this.log("Client "+client.key+" logged in as: "+account.username);
		return true;
	},
	postLogout: function() {
		var socket = this.socket;
		if (socket.client === undefined) {
			this.log("Failed logout for unknown client. Not logged in.");
			return;
		}
		var client = socket.client;
		server.clients.removeKey(client.key);
		socket.client = undefined;
		this.log("Client "+client.key+" logged out of: "+client.account.username);
	},
	
	connect: function() {
		var login = this;
		var socket = this.socket;
		socket.on("register", function(data) {
			if (socket.client === undefined) {
				if (login.postRegister(data)) {
					// Do nothing
				}
			}
		});
		socket.on("login", function(data) {
			if (socket.client === undefined) {
				if (login.postLogin(data.username, data.password)) {
					login.startActivity(LobbyActivity);
				}
			}
		});
		socket.on("logout", function(data) {
			if (socket.client !== undefined) {
				login.finishChildActivities();
				login.postLogout();
			}
		});
	},
	disconnect: function() {
		var socket = this.socket;
		socket.removeAllListeners("register");
		socket.removeAllListeners("login");
		socket.removeAllListeners("logout");
	}
};
Utils.Loggable(LoginActivity, "LOGIN", {
	color: BashStyle.Color.GREEN
});
Utils.merge(LoginActivity.prototype, Activity.prototype);
LoginActivity.prototype.constructor = LoginActivity;
