
var Actor = function(isMe, name) {
	OE.Sphere.call(this, 1.0, 16);
	this.mMaterial = OE.MaterialManager.getLoaded("Car Paint");
	
	this.isMe = isMe === undefined ? true : false;
	this.velocity = new OE.Vector3(0.0);
	
	this.name = name;
	this.nametag = document.createElement("div");
	this.nametag.setAttribute("class", "nametag");
	this.nametag.innerHTML = name;
	document.body.appendChild(this.nametag);
	
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
	flyMode: false,
	jumpVelocity: 1.0,
	gravity: 0.1,
	groundFriction: 0.75,
	airFriction: 0.99,
	flyFriction: 0.95,
	velocity: undefined,
	grounded: false,
	inputStates: undefined,
	name: "Client",
	
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
		if (event == 0 && code == 7) {
			this.flyMode = !this.flyMode;
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
	
	wpos: undefined,
	spos: undefined,
	vpmat: undefined,
	updateNametagPos: function() {
		if (this.wpos === undefined) this.wpos = new Array(4);
		if (this.spos === undefined) this.spos = new Array(4);
		if (this.vpmat === undefined) this.vpmat = mat4.create();
		
		var wpos = this.mWorldTransform.getPos();
		var view = app.mCamera.getViewMatrix();
		var proj = app.mCamera.getProjectionMatrix();
		this.wpos[0] = wpos.x;
		this.wpos[1] = wpos.y+1.25;
		this.wpos[2] = wpos.z;
		this.wpos[3] = 1.0;
		mat4.multiplyVec4(view, this.wpos, this.spos);
		mat4.multiplyVec4(proj, this.spos, this.spos);
		var w = app.mSurface.mCanvas.offsetWidth;
		var h = app.mSurface.mCanvas.offsetHeight;
		var ntx = w * ((this.spos[0] / this.spos[3])*0.5+0.5);
		var nty = h * ((this.spos[1] / this.spos[3])*0.5+0.5);
		ntx -= this.nametag.offsetWidth/2;
		nty -= this.nametag.offsetHeight/2;
		this.nametag.style.left = ntx+"px";
		this.nametag.style.bottom = nty+"px";
	},
	
	a: new OE.Vector3(),
	onUpdate: function() {
		OE.Sphere.prototype.onUpdate.call(this);
		
		var pos = this.getPos();
		
		var kd = this.inputStates.keyDown;
		var a = this.a;
		a.setf(0.0, 0.0, 0.0);
		var m = false;
		if (kd[0])	{m = true; a.x -= 1.0;}
		if (kd[1])	{m = true; a.x += 1.0;}
		if (kd[2])	{m = true; a.y -= 1.0;}
		if (kd[3])	{m = true; a.y += 1.0;}
		if (kd[4])	{m = true; a.z -= 1.0;}
		if (kd[5])	{m = true; a.z += 1.0;}
		if (m) {
			if (this.flyMode || this.grounded) {
				a.normalize();
				this.getRot().mulvBy(a);
				if (!this.flyMode) {
					a.y = 0.0;
				}
				a.normalize();
				a.mulByf(this.flyMode ? this.flyAccel : this.walkAccel);
				this.applyForce(a);
			}
		}
		
		if (this.flyMode) {
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
	},
	onDestroy: function() {
		document.body.removeChild(this.nametag);
	}
};
OE.Utils.merge(Actor.prototype, OE.Sphere.prototype);
Actor.prototype.constructor = Actor;
