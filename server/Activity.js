
function Activity(socket, parent) {
	this.socket = socket;
	this.parentActivity = parent;
	this.childActivities = [];
}
Activity.prototype = {
	socket: undefined,
	parentActivity: undefined,
	childActivities: undefined,
	
	finish: function() {
		for (var i = 0; i < this.childActivities.length; i++) {
			this.childActivities[i].finish();
		}
		this.onDestroy();
		if (this.parentActivity) {
			this.parentActivity.removeActivity(this);
		}
	},
	finishChildActivities: function() {
		for (var i = 0; i < this.childActivities.length; i++) {
			this.childActivities[i].finish();
		}
	},
	startActivity: function(activityClass) {
		var activity = new activityClass(this.socket, this);
		this.childActivities.push(activity);
		if (this.childActivities.length == 1) {
			this.onHide();
		}
		activity.onCreate();
	},
	removeActivity: function(activity) {
		for (var i = 0; i < this.childActivities.length; i++) {
			if (this.childActivities[i] == activity) {
				this.childActivities.splice(i, 1);
				i--;
			}
		}
		if (this.childActivities.length == 0) {
			this.onShow();
		}
	},
	
	onCreate: function() {},
	onDestroy: function() {},
	onShow: function() {},
	onHide: function() {}
};
Activity.prototype.constuctor = Activity;