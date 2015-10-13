
function gotoLogin() {
	if (app.inState(app.STATE_LOGIN)) {
		var login = document.getElementById("loginOverlay");
		var register = document.getElementById("registerOverlay");
		login.style.display = "inline-block";
		register.style.display = "none";
		app.STATE_LOGIN.state = 0;
	}
}
function gotoRegister() {
	if (app.inState(app.STATE_LOGIN)) {
		var login = document.getElementById("loginOverlay");
		var register = document.getElementById("registerOverlay");
		login.style.display = "none";
		register.style.display = "inline-block";
		app.STATE_LOGIN.state = 1;
	}
}
function postLogin() {
	if (app.inState(app.STATE_LOGIN)) {
		var overlay = document.getElementById("loginOverlay");
		var user = getElementsByName(overlay, "username")[0];
		var pass = getElementsByName(overlay, "password")[0];
		app.STATE_LOGIN.postLogin(user.value, pass.value);
	}
}
function postRegister() {
	if (app.inState(app.STATE_LOGIN)) {
		var overlay = document.getElementById("registerOverlay");
		var data = {
			username: getElementsByName(overlay, "username")[0].value,
			password: getElementsByName(overlay, "password")[0].value,
			password2: getElementsByName(overlay, "password2")[0].value,
			email: getElementsByName(overlay, "email")[0].value,
		};
		app.STATE_LOGIN.postRegister(data);
	}
}

var LoginState = function() {
	GameState.call(this);
	this.state = 0;
};
LoginState.prototype = {
	initState: function() {
		this.connect();
		var overlay = document.getElementById("loginOverlay");
		overlay.style.display = "inline-block";
	},
	exitState: function() {
		this.disconnect();
		var overlay = document.getElementById("loginOverlay");
		overlay.style.display = "none";
	},
	
	postLogin: function(username, password) {
		var passHash = CryptoJS.MD5(password+username).toString();
		app.clientAlias = username;
		app.socket.emit("login", {
			"username"	: username,
			"password"	: passHash
		});
	},
	postRegister: function(data) {
		if (data.password != data.password2) {
			this.setError("The passwords you entered do not match.");
			return;
		}
		var passHash = CryptoJS.MD5(data.password+data.username).toString();
		app.socket.emit("register", {
			"username"	: data.username,
			"password"	: passHash,
			"email"		: data.email
		});
	},
	setError: function(message) {
		var msg = document.getElementById(this.state==0?"loginMsg":"registerMsg");
		msg.innerHTML = '<font style="color:red;">Error: '+message+'</font>';
	},
	
	connect: function() {
		var login = this;
		var socket = app.socket;
		socket.on("loginSuccess", function(data) {
			alert("Login success.");
			app.clientKey = data.clientKey;
			app.switchStates(app.STATE_LOBBY);
		});
		socket.on("loginFailure", function(error) {
			login.setError(error.message);
		});
		socket.on("registerSuccess", function(data) {
			alert("Register success.");
		});
		socket.on("registerFailure", function(error) {
			login.setError(error.message);
		});
	},
	disconnect: function() {
		var socket = app.socket;
		socket.removeAllListeners("loginSuccess");
		socket.removeAllListeners("loginFailure");
		socket.removeAllListeners("registerSuccess");
		socket.removeAllListeners("registerFailure");
	}
};
OE.Utils.merge(LoginState.prototype, GameState.prototype);
LoginState.prototype.constructor = LoginState;
