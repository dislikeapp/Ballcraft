
function DataSource() {
	this.tables = {
		accounts: new Map()
	};
	this.log("Database created.");
	this.load();
}
DataSource.Account = function(id, username, passwordHash, passwordSalt, email) {
	this.id = id;
	this.username = username;
	this.passwordHash = passwordHash;
	this.passwordSalt = passwordSalt;
	this.email = email;
};
DataSource.prototype = {
	tables: undefined,
	
	load: function() {
		this.tables = {
			accounts: new Map()
		};
		Utils.loadJSON("database/database.json", function(json) {
			this.tables.accountLevel = json.tables.accountLevel;
			var accounts = json.tables.accounts;
			for (var i = 0; i < accounts.length; i++) {
				var account = accounts[i];
				this.tables.accounts.insert(account.id, account);
				this.log("Created account "+account.id+": '"+account.username+"'");
			}
			this.log("Database loaded "+accounts.length+" accounts.");
		}.bind(this));
	},
	save: function() {
		var json = {tables: {accounts: []}};
		for (var key in this.tables.accounts.data) {
			var account = this.tables.accounts.data[key];
			json.tables.accounts.push({
				id: account.id,
				username: account.username,
				passwordHash: account.passwordHash,
				passwordSalt: account.passwordSalt,
				email: account.email
			});
		}
		Utils.saveJSON("database/database.json", json);
		this.log("Database saved "+json.tables.accounts.length+" accounts.");
	},
	getAccountById: function(id) {
		return this.tables.accounts.data[id];
	},
	getAccountByName: function(username) {
		for (var id in this.tables.accounts.data) {
			var account = this.tables.accounts.data[id];
			if (account.username == username) {
				return account;
			}
		}
		return undefined;
	},
	passwordCorrect: function(id, passClientHash) {
		var account = this.tables.accounts.data[id];
		var passHash = CryptoJS.MD5(passClientHash+account.passwordSalt).toString();
		return (account.passwordHash === passHash);
	},
	createAccount: function(username, passClientHash, email) {
		var passSalt = CryptoJS.MD5((new Date()).toString()).toString();
		var passHash = CryptoJS.MD5(passClientHash+passSalt).toString();
		var account = new DataSource.Account(0, username, passHash, passSalt, email);
		var key = this.tables.accounts.insertNext(account);
		account.id = key;
		this.log("Created account "+account.id+": '"+account.username+"'");
		this.save();
		return account;
	}
};
Utils.Loggable(DataSource, "DATA", {
	color: BashStyle.Color.DYELLOW
});
DataSource.prototype.constructor = DataSource;

var Database = new DataSource();
