
var Actor = function(isMe) {
	OE.Sphere.call(this, 1.0, 16);
	this.mMaterial = OE.MaterialManager.getLoaded("Car Paint");
	
	this.isMe = isMe === undefined ? true : false;
	this.velocity = new OE.Vector3(0.0);
	
	this.inputStates = {
		keyDown: new Array(8)
	};
	for (var i=0; i<this.inputStates.keyDown.length; i++)
		this.inputStates.keyDown[i] = false;
};
Actor.prototype = {
	run: true,
	walkAccel: 0.15,
	flyAccel: 0.3,
	jumpVelocity: 1.0,
	gravity: 0.1,
	groundFriction: 0.75,
	airFriction: 0.99,
	flyFriction: 0.95,
	velocity: undefined,
	grounded: false,
	inputStates: undefined,
	
	inputEvent: function(event, code) {
		switch (event) {
			case 0: this.inputStates.keyDown[code] = true; break;
			case 1: this.inputStates.keyDown[code] = false; break;
			//case 2: this.inputStates.mouseDown[code] = true; break;
			//case 3: this.inputStates.mouseDown[code] = false; break;
		}
		if (event == 0 && code == 6) {
			this.jump();
		}
	},
	applyForce: function(accel) {
		this.velocity.addBy(accel);
	},
	jump: function(direction) {
		if (this.grounded) {
			this.grounded = false;
			this.velocity.y = this.jumpVelocity;
		}
	},
	
	a: new OE.Vector3(),
	onUpdate: function() {
		OE.Sphere.prototype.onUpdate.call(this);
		
		var pos = this.getPos();
		
		var kd = this.inputStates.keyDown;
		var a = this.a;
		a.setf(0.0, 0.0, 0.0);
		var m = false;
		if (kd[0])			{m = true; a.x -= 1.0;}
		if (kd[1])			{m = true; a.x += 1.0;}
		if (kd[2] && kd[7])	{m = true; a.y -= 1.0;}
		if (kd[3] && kd[7])	{m = true; a.y += 1.0;}
		if (kd[4])			{m = true; a.z -= 1.0;}
		if (kd[5])			{m = true; a.z += 1.0;}
		if (m) {
			if (kd[7] || this.grounded) {
				a.normalize();
				this.getRot().mulvBy(a);
				a.mulByf(kd[7] ? this.flyAccel : this.walkAccel);
				this.applyForce(a);
			}
		}
		
		if (kd[7]) {
			this.velocity.mulByf(this.flyFriction);
		}
		else {
			this.velocity.y -= this.gravity;
			this.velocity.mulByf(this.grounded ? this.groundFriction : this.airFriction);
		}
		pos.addBy(this.velocity);
		
		var floor = app.mScene.getHeight(pos) + this.mRadius;
		var norm = app.mScene.getNormal(pos);
		var walkable = norm ? (norm.y > 0.95) : true;
		
		if (this.grounded) {
			if (!walkable || pos.y + this.velocity.y > floor + 0.5) {
				this.grounded = false;
			}
			if (pos.y < floor)
				pos.y = floor;
		}
		else {
			if (pos.y < floor) {
				var dh = floor - pos.y;
				var offset = norm.mulf(dh);
				var dot = norm.dot(OE.Vector3.UP);
				offset.mulByf(dot);
				pos.addBy(offset);
				if (walkable && this.velocity.y < 0.0) {
					this.velocity.y = 0.0;
					this.grounded = true;
				}
			}
		}
		
		this.setPos(pos);
	}
};
OE.Utils.merge(Actor.prototype, OE.Sphere.prototype);
Actor.prototype.constructor = Actor;
