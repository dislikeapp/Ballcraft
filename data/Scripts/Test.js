
OE.Script.Exports.Test = {
	mPrefix: "Test Script: ",
	
	onInit: function() {
		alert(mPrefix+"Script Init");
	},
	onAdded: function() {
		alert(mPrefix+"Object Added");
	},
	onRemoved: function() {
		alert(mPrefix+"Object Removed");
	},
	onDestroy: function() {
		alert(mPrefix+"Object Destroyed");
	},
	onUpdate: function() {
		
	}
};
