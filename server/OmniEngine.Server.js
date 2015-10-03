/* OmniEngine.js
 * Author: Tom Krcmar (tomkrcmar@gmail.com)
 * Website: http://omniserver.no-ip.biz
 * Copyright 2015 by Thomas Krcmar. All Rights Reserved.
 * 
 * OmniEngine-JS is a full scale game engine implemented in Javascript using an object
 * oriented approach. The mission of the project is to provide as many triple-A features
 * as possible while keeping the application level code clean, neat, and easy to
 * understand, by taking care of the complex tasks of high performance rendering,
 * material composition, resource management and loading on-demand, game logic/mechanics,
 * physics, input, etc. under the hood, and keeping the underlying techniques abstracted
 * away from the game programmer.
 * 
 */

var OE = {};

OE.Utils = {};

OE.Utils.splitLines = function(str) {
	return str.match(/[^\r\n]+/g);
	//return str.match(/(\r\n|[\n\v\f\r\x85\u2028\u2029])/g);
};
OE.Utils.splitFirstToken = function(str) {
	var m = str.match(/^\s*(\S+)\s+(.*)/);
	if (m) return m.slice(1);
	return undefined;
	//return str.match(/(\r\n|[\n\v\f\r\x85\u2028\u2029])/g);
};
OE.Utils.isPathAbsolute = function(path) {
	var r = new RegExp('^(?:[a-z]+:)?//', 'i');
	return r.test(path);
}
OE.Utils.extend = function(child, parent) {
	// Merge prototype members.
	for (var key in parent.prototype) {
		if (child.prototype[key] === undefined && key !== "constructor") {
			child.prototype[key] = parent.prototype[key];
		}
	}
	// Merge static members.
	for (var key in parent) {
		if (child[key] === undefined && key !== "constructor") {
			child[key] = parent[key];
		}
	}
};
OE.Utils.implement = function(child, parent) {
	// Merge prototype members.
	for (var key in parent.prototype) {
		if (child.prototype[key] === undefined && key !== "constructor") {
			var parentName = parent.name;
			var childName = child.name;
			console.warn("[Utils.Implement] Error: Un-implemented property in class '"+childName+"': '"+key+"' from interface '"+parentName+"'");
		}
	}
	// Merge static members.
	for (var key in parent) {
		if (child[key] === undefined && key !== "constructor") {
			var parentName = parent.name;
			var childName = child.name;
			console.warn("[Utils.Implement] Error: Un-implemented static property in class '"+childName+"': '"+key+"' from interface '"+parentName+"'");
		}
	}
};
OE.Utils.defClass = function(constr) {
	constr.constructor = constr;
	for (var i=1; i<arguments.length; i++) {
		OE.Utils.extend(constr, arguments[i]);
	}
}
OE.Utils.defClass2 = function() {
	if (arguments.length > 0) {
		var prot = arguments[arguments.length-1];
		if (prot !== undefined) {
			if (prot.constructor === undefined)
				prot.constructor = Object;
			var constr = prot.constructor;
			constr.prototype = prot;
			for (var i=0; i<arguments.length-1; i++) {
				OE.Utils.extend(constr, arguments[i]);
			}
			return constr;
		}
	}
	return undefined;
}

OE.Utils.merge = function(dst, src) {
	for (var key in src) {
		if (dst[key] === undefined)
			dst[key] = src[key];
	}
};
OE.Utils.clone = function(obj, shallow) {
	if (obj == undefined || obj == null || typeof(obj) != 'object')
		return obj;
	var temp = new obj.constructor();
	for (var key in obj) {
		temp[key] = shallow ? obj[key] : OE.Utils.clone(obj[key]);
	}
	return temp;
};
OE.Utils.ajaxRequest = function(url, params, onResponse, onError) {
	var request;
	try {
		request = new XMLHttpRequest();
	}
	catch (e) {
		try {
			request = new ActiveXObject('Msxml2.XMLHTTP');
		}
		catch (e) {
			try {
				request = new ActiveXObject('Microsoft.XMLHTTP');
			}
			catch (e) {
				if (onError) onError("Http request is not supported.");
				return false;
			}
		}
	}
	request.onreadystatechange = function() {
		if (request.readyState == 4 && request.status == 200) {
			if (onResponse) onResponse(request.responseText);
		}
	}
	request.open("POST", url, true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.send(params);
};
OE.Utils.ajaxStatic = function(url, onResponse, onError) {
	var request;
	try {
		request = new XMLHttpRequest();
	}
	catch (e) {
		try {
			request = new ActiveXObject('Msxml2.XMLHTTP');
		}
		catch (e) {
			try {
				request = new ActiveXObject('Microsoft.XMLHTTP');
			}
			catch (e) {
				if (onError) onError("Http request is not supported.");
				return false;
			}
		}
	}
	request.onreadystatechange = function() {
		if (request.readyState == 4 && request.status == 200) {
			if (onResponse) onResponse(request.responseText);
		}
	}
	request.open("GET", url, true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.setRequestHeader("Cache-Control", "must-revalidate");
	request.send();
};
OE.Utils.loadFile = function(filePath, onLoaded, onError) {
	OE.Utils.ajaxStatic(filePath,
		function(response) {
			if (onLoaded) onLoaded(response);
		},
		function(message) {
			if (onError) onError(message);
		}
	);
};
OE.Utils.loadFiles = function(filePaths, onLoaded, onError, onFinished) {
	var states = [];
	for (var i=0; i<filePaths.length; i++)
		states.push(0);
	
	var checkStates = function() {
		var done = true;
		var numLoaded = 0;
		var numErrors = 0;
		for (var i=0; i<states.length; i++) {
			var j = i;
			if (states[j] == 0) {
				done = false;
				setTimeout(function() {
					if (states[j] == 0) {
						requestFile(j);
					}
				}, 1000);
			}
			else {
				if (states[j] == 1) numLoaded++;
				if (states[j] == 2) numErrors++;
			}
		}
		if (done) {
			if (onFinished) onFinished(numLoaded, numErrors);
		}
	};
	var requestFile = function(index) {
		OE.Utils.ajaxStatic(filePaths[index],
			function(response) {
				if (onLoaded) onLoaded(response, index);
				states[index] = 1;
				checkStates();
			},
			function(message) {
				if (onError) onError(message, index);
				states[index] = 2;
				checkStates();
			}
		);
	};
	for (var i=0; i<filePaths.length; i++) {
		requestFile(i);
	}
};
OE.Utils.loadJSON = function(filePath, onLoaded, onError) {
	OE.Utils.loadFile(filePath,
		function(response) {
			var json = undefined;
			try {
				json = JSON.parse(response);
			}
			catch (e) {
				if (onError) onError("JSON syntax error.");
			}
			if (json) {
				if (onLoaded) onLoaded(json);
			}
		},
		function(message) {
			if (onError)
				onError(message);
		}
	);
};
OE.Utils.loadJSONFiles = function(filePaths, onLoaded, onError, onFinished) {
	var jsonArray = [];
	for (var i=0; i<filePaths.size; i++)
		jsonArray.push(undefined);
	
	OE.Utils.loadFiles(filePaths,
		function(response, index) {
			var json = undefined;
			try {
				json = JSON.parse(response);
			}
			catch (e) {
				if (onError) onError("JSON syntax error.", index);
			}
			if (json) {
				if (onLoaded) onLoaded(json, index);
				jsonArray[index] = json;
			}
		},
		function(message, index) {
			if (onError)
				onError(message, index);
		},
		function(numLoaded, numErrors) {
			if (onFinished)
				onFinished(jsonArray, numLoaded, numErrors);
		}
	);
};

OE.ByteBuffer = function(size) {
	this.mBuffer = new ArrayBuffer(size);
	this.mDataView = new DataView(this.mBuffer);
	this.mSize = size;
	this.mPosition = 0;
	this.mLittleEndian = false;
	
	var a = new ArrayBuffer(4);
	var b = new Uint8Array(a);
	var c = new Uint32Array(a);
	b[0] = 0xa1; b[1] = 0xb2; b[2] = 0xc3; b[3] = 0xd4;
	     if (c[0] == 0xd4c3b2a1) this.mLittleEndian = true;
	else if (c[0] == 0xa1b2c3d4) this.mLittleEndian = false;
	else throw new Error("Something crazy just happened"); 
};

OE.ByteBuffer.prototype = {
	mLittleEndian: false,
	mBuffer: undefined,
	mDataView: undefined,
	mSize: 0,
	mPosition: 0,
	
	rewind: function() {
		this.mPosition = 0;
	},
	seek: function(position) {
		this.mPosition = position;
	},
	putByte: function(value) {
		var size = 1;
		var nextPos = this.mPosition + size;
		if (nextPos <= this.mSize) {
			this.mDataView.setUint8(this.mPosition, value, this.mLittleEndian);
			this.mPosition = nextPos;
		}
	},
	putInt: function(value) {
		var size = 4;
		var nextPos = this.mPosition + size;
		if (nextPos <= this.mSize) {
			this.mDataView.setInt32(this.mPosition, value, this.mLittleEndian);
			this.mPosition = nextPos;
		}
	},
	putUint: function(value) {
		var size = 4;
		var nextPos = this.mPosition + size;
		if (nextPos <= this.mSize) {
			this.mDataView.setUint32(this.mPosition, value, this.mLittleEndian);
			this.mPosition = nextPos;
		}
	},
	putFloat: function(value) {
		var size = 4;
		var nextPos = this.mPosition + size;
		if (nextPos <= this.mSize) {
			this.mDataView.setFloat32(this.mPosition, value, this.mLittleEndian);
			this.mPosition = nextPos;
		}
	},
	putVec2: function(value) {
		var size = 8;
		if (this.mPosition + size <= this.mSize) {
			this.putFloat(value.x);
			this.putFloat(value.y);
		}
	},
	putVec3: function(value) {
		var size = 12;
		if (this.mPosition + size <= this.mSize) {
			this.putFloat(value.x);
			this.putFloat(value.y);
			this.putFloat(value.z);
		}
	},
	putVec4: function(value) {
		var size = 16;
		if (this.mPosition + size <= this.mSize) {
			this.putFloat(value.x);
			this.putFloat(value.y);
			this.putFloat(value.z);
			this.putFloat(value.w);
		}
	},
	putColor4f: function(color) {
		var size = 16;
		if (this.mPosition + size <= this.mSize) {
			this.putFloat(color.r);
			this.putFloat(color.g);
			this.putFloat(color.b);
			this.putFloat(color.a);
		}
	},
	putColor4b: function(color) {
		this.putUint(color.getUint32());
	}
};
OE.Utils.defClass(OE.ByteBuffer);

OE.Color = function(r, g, b, a) {
	if (arguments.length == 4) {
		this.r = r; this.g = g;
		this.b = b; this.a = a;
	}
	else if (arguments.length == 3) {
		this.r = r; this.g = g;
		this.b = b; this.a = 1.0;
	}
	else if (arguments.length == 2) {
		this.r = this.g = this.b = r;
		this.a = g;
	}
	else if (arguments.length == 1) {
		this.r = this.g = this.b = r;
		this.a = 1.0;
	}
	else {
		this.r = this.g = this.b = 0.0;
		this.a = 1.0;
	}
};

OE.Color.prototype = {
	r: 0.0,
	g: 0.0,
	b: 0.0,
	a: 1.0,
	
	getUint32: function() {
		var c = [this.a, this.b, this.g, this.r];
		for (var i=0; i<4; i++)
			c[i] = Math.round(Math.min(Math.max(c[i] * 255.0, 0.0), 1.0));
		
		var i = 0;
		i = (((((((i
			| c[0]) << 8)
			| c[1]) << 8)
			| c[2]) << 8)
			| c[3]);
		return i;
	}
};
OE.Utils.defClass(OE.Color);

OE.Color.BLACK	= new OE.Color(0.0);
OE.Color.GREY	= new OE.Color(0.5);
OE.Color.WHITE	= new OE.Color(1.0);
OE.Color.RED	= new OE.Color(1.0, 0.0, 0.0);
OE.Color.ORANGE	= new OE.Color(1.0, 0.5, 0.0);
OE.Color.YELLOW	= new OE.Color(1.0, 1.0, 0.0);
OE.Color.GY		= new OE.Color(0.5, 1.0, 0.0);
OE.Color.GREEN	= new OE.Color(0.0, 1.0, 0.0);
OE.Color.GC		= new OE.Color(0.0, 1.0, 0.5);
OE.Color.CYAN	= new OE.Color(0.0, 1.0, 1.0);
OE.Color.TEAL	= new OE.Color(0.0, 0.5, 1.0);
OE.Color.BLUE	= new OE.Color(0.0, 0.0, 1.0);
OE.Color.BR		= new OE.Color(0.5, 0.0, 1.0);
OE.Color.VIOLET	= new OE.Color(1.0, 0.0, 1.0);
OE.Color.RB		= new OE.Color(1.0, 0.0, 0.5);

OE.Event = function() {
	this.mListeners = new Array();
	this.mOnceListeners = new Array();
};

OE.Event.prototype = {
	mListeners: undefined,
	mOnceListeners: undefined,
	
	add: function(func) {
		this.mListeners.push(func);
	},
	addOnce: function(func) {
		this.mOnceListeners.push(func);
	},
	removeAll: function() {
		this.mListeners = new Array();
		this.mOnceListeners = new Array();
	},
	remove: function(func) {
		for (var i=0; i<this.mListeners.length; i++) {
			if (this.mListeners[i] == func) {
				this.mListeners.splice(i, 1);
				i--;
			}
		}
		for (var i=0; i<this.mOnceListeners.length; i++) {
			if (this.mOnceListeners[i] == func) {
				this.mOnceListeners.splice(i, 1);
				i--;
			}
		}
	},
	dispatch: function() {
		var list = this.mListeners;
		for (var i=0; i<list.length; i++) {
			var result;
			if (arguments.length > 0)	result = list[i].apply(undefined, arguments);
			else						result = list[i]();
		}
		
		if (this.mOnceListeners.length > 0) {
			list = this.mOnceListeners;
			this.mOnceListeners = [];
			for (var i=0; i<list.length; i++) {
				var result;
				if (arguments.length > 0)	result = list[i].apply(undefined, arguments);
				else						result = list[i]();
				if (result === undefined || result == true) {
					this.mOnceListeners.push(list[i]);
				}
			}
		}
	}
};
OE.Event.prototype.constructor = OE.Event;

OE.Exception = function(arg1, arg2) {
	if (arguments.length == 2) {
		this.mName = arg1;
		this.mMessage = arg2;
	}
	else if (arguments.length == 1) {
		this.mMessage = arg1;
	}
};

OE.Exception.prototype = {
	mName: "Exception",
	mMessage: "",
	
	toString: function() {
		return "["+name+"] "+message;
	}
};
OE.Exception.prototype.constructor = OE.Exception;

OE.KeyboardListener = function() {
	this.mKeyDown = new Array(256);
	for (var i=0; i<256; i++)
		this.mKeyDown[i] = false;
};
OE.KeyboardListener.prototype = {
	mKeyDown: undefined
	
	
};
OE.KeyboardListener.prototype.constructor = OE.KeyboardListener;

OE.PointerListener = function() {
	
};
OE.PointerListener.prototype = {
	
};
OE.PointerListener.prototype.constructor = OE.PointerListener;

OE.InputManager = function() {
	
};
OE.InputManager.prototype = {
	
};
OE.InputManager.prototype.constructor = OE.InputManager;

OE.Keys = {
	Enter: 0,
	Space: 32,
	Ctrl: 0,
	Alt: 0,
	Shift: 0,
	Tab: 0
};

(function() {
	for (var i=0; i<26; i++) {
		var K = 65+i;
		var k = 97+i;
		var C = String.fromCharCode(K);
		var c = String.fromCharCode(k);
		OE.Keys[C] = K;
		OE.Keys[c] = k;
	}
})();

OE.Observable = function() {
	this.mEventListeners = {};
};

OE.Observable.prototype = {
	mEventListeners: undefined,
	
	addEventListener: function(event, func) {
		var list = this.mEventListeners[event];
		if (list === undefined) {
			list = new Array();
			this.mEventListeners[event] = list;
		}
		list.push({
			callback: func,
			once: false
		});
	},
	addEventListenerOnce: function(event, func) {
		var list = this.mEventListeners[event];
		if (list === undefined) {
			list = new Array();
			this.mEventListeners[event] = list;
		}
		list.push({
			callback: func,
			once: true
		});
	},
	removeAllListeners: function(event) {
		var list = this.mEventListeners[event];
		if (list !== undefined) {
			delete this.mEventListeners[event];
			this.mEventListeners[event] = undefined;
		}
	},
	removeEventListener: function(event, func) {
		var list = this.mEventListeners[event];
		if (list !== undefined) {
			var index = list.indexOf(func);
			if (index >= 0) {
				list.splice(index, 1);
			}
			if (list.length == 0) {
				delete this.mEventListeners[event];
				this.mEventListeners[event] = undefined;
			}
		}
	},
	dispatchEvent: function(event, args) {
		var list = this.mEventListeners[event];
		if (list !== undefined) {
			for (var i=0; i<list.length; i++) {
				var result;
				if (args !== undefined) {
					if (Array.isArray(args)) {
						result = list[i].callback.apply(undefined, args);
					}
					else {
						result = list[i].callback.call(undefined, args);
					}
				}
				else {
					result = list[i].callback.call(undefined);
				}
				if (list[i].once) {
					if (result === undefined || result == true) {
						list.splice(i, 1);
						i--;
					}
				}
			}
			if (list.length == 0) {
				delete this.mEventListeners[event];
				this.mEventListeners[event] = undefined;
			}
		}
	}
};
OE.Utils.defClass(OE.Observable);

OE.Serializable = function() {};
OE.Serializable.prototype = {};
OE.Serializable.serialize = function() {
	return {};
};
OE.Serializable.deserialize = function(data) {
	return new OE.Serializble();
};
OE.Utils.defClass(OE.Serializable);

OE.BoundingBox = function(p1, p2) {
	this.p1 = p1 ? p1 : new OE.Vector3();
	this.p2 = p2 ? p2 : new OE.Vector3();
};
OE.BoundingBox.prototype = {
	p1: undefined,
	p2: undefined,
	
	includePoint: function(point) {
		if (point.x < this.p1.x) this.p1.x = point.x;
		if (point.x > this.p2.x) this.p2.x = point.x;
		if (point.y < this.p1.y) this.p1.y = point.y;
		if (point.y > this.p2.y) this.p2.y = point.y;
		if (point.z < this.p1.z) this.p1.z = point.z;
		if (point.z > this.p2.z) this.p2.z = point.z;
	},
	surroundPointf: function(x, y, z, xsize, ysize, zsize) {
		this.p1.setf(x, y, z);
		this.p2.setf(x, y, z);
		if (xsize) {
			var off = xsize * 0.5;
			this.p1.x -= off; this.p2.x += off;
		}
		if (ysize) {
			var off = ysize * 0.5;
			this.p1.y -= off; this.p2.y += off;
		}
		if (zsize) {
			var off = zsize * 0.5;
			this.p1.z -= off; this.p2.z += off;
		}
	},
	surroundPoint: function(point, xsize, ysize, zsize) {
		this.surroundPointf(point.x, point.y, point.z, xsize, ysize, zsize);
	},
	intersectsBox: function(bbox) {
		return !(
			bbox.p2.x < this.p1.x ||
			bbox.p2.y < this.p1.y ||
			bbox.p2.z < this.p1.z ||
			bbox.p1.x > this.p2.x ||
			bbox.p1.y > this.p2.y ||
			bbox.p1.z > this.p2.z);
	},
	containsPoint: function(point) {
		return (point.x > this.p1.x &&
				point.x < this.p2.x &&
				point.y > this.p1.y &&
				point.y < this.p2.y &&
				point.z > this.p1.z &&
				point.z < this.p2.z);
	}
};
OE.Utils.defClass(OE.BoundingBox);

OE.Plane = function(point, normal) {
	this.mPoint = point;
	this.mNormal = normal;
};
OE.Plane.prototype = {
	mPoint: undefined,
	mNormal: undefined,
	
	set: function(point, normal) {
		this.mPoint.set(point);
		this.mNormal.set(normal);
	},
	setf: function(px, py, pz, nx, ny, nz) {
		this.mPoint.setf(px, py, pz);
		this.mNormal.setf(nx, ny, nz);
	},
	pointInFront: function(point) {
		var dx = point.x - this.mPoint.x,
			dy = point.y - this.mPoint.y,
			dz = point.z - this.mPoint.z,
			dot = dx*this.mNormal.x + dy*this.mNormal.y + dz*this.mNormal.z;
		return dot > 0.0;
	},
	pointInFrontf: function(px, py, pz) {
		var dx = px - this.mPoint.x,
			dy = py - this.mPoint.y,
			dz = pz - this.mPoint.z,
			dot = dx*this.mNormal.x + dy*this.mNormal.y + dz*this.mNormal.z;
		return dot > 0.0;
	}
};
OE.Plane.prototype.constructor = OE.Plane;

OE.Frustum = function() {
	this.mPlanes = new Array(6);
	this.mPoints = new Array(8);
	
	for (var i=0; i<6; i++)
		this.mPlanes[i] = new OE.Plane(new OE.Vector3(0.0), new OE.Vector3(0.0, 0.0, 1.0));
	
	for (var i=0; i<8; i++)
		this.mPoints[i] = new OE.Vector3(0.0);
};
OE.Frustum.prototype = {
	mPlanes: undefined,
	mPoints: undefined,
	
	calcPlane: function(index, a, b, c, d) {
		var p = this.mPlanes[index].mPoint;
		var n = this.mPlanes[index].mNormal;
		
		var ab = b.sub(a).normalize(); 
		var ac = c.sub(a).normalize();
		
		p.set(a); p.addBy(b); p.addBy(c); p.addBy(d); p.mulByf(0.25);
		n.set(ab.crossBy(ac));
	},
	calcPlanes: function() {
		var p = this.mPoints;
		this.calcPlane(0, p[0], p[1], p[2], p[3]); // Front
		this.calcPlane(1, p[5], p[4], p[7], p[6]); // Back
		this.calcPlane(2, p[4], p[0], p[6], p[2]); // Left
		this.calcPlane(3, p[1], p[5], p[3], p[7]); // Right
		this.calcPlane(4, p[2], p[3], p[6], p[7]); // Top
		this.calcPlane(5, p[4], p[5], p[0], p[1]); // Bottom
	},
	containsBox: function(bbox) {
		var x1 = bbox.p1.x, y1 = bbox.p1.y, z1 = bbox.p1.z,
			x2 = bbox.p2.x, y2 = bbox.p2.y, z2 = bbox.p2.z;
		var i, out;
		// Check box outside/inside of frustum.
		for (i=0; i<6; i++)
		{
			var plane = this.mPlanes[i];
			out = 0;
			out += plane.pointInFrontf(x1, y1, z1) ? 1 : 0;
			out += plane.pointInFrontf(x2, y1, z1) ? 1 : 0;
			out += plane.pointInFrontf(x1, y2, z1) ? 1 : 0;
			out += plane.pointInFrontf(x2, y2, z1) ? 1 : 0;
			out += plane.pointInFrontf(x1, y1, z2) ? 1 : 0;
			out += plane.pointInFrontf(x2, y1, z2) ? 1 : 0;
			out += plane.pointInFrontf(x1, y2, z2) ? 1 : 0;
			out += plane.pointInFrontf(x2, y2, z2) ? 1 : 0;
			if (out == 8) return false;
		}
		/*
		// Check frustum outside/inside box.
		out=0; for (i=0; i<8; i++) {out += ((fru.mPoints[i].x > box.mMaxX)?1:0);} if (out==8) return false;
		out=0; for (i=0; i<8; i++) {out += ((fru.mPoints[i].x < box.mMinX)?1:0);} if (out==8) return false;
		out=0; for (i=0; i<8; i++) {out += ((fru.mPoints[i].y > box.mMaxY)?1:0);} if (out==8) return false;
		out=0; for (i=0; i<8; i++) {out += ((fru.mPoints[i].y < box.mMinY)?1:0);} if (out==8) return false;
		out=0; for (i=0; i<8; i++) {out += ((fru.mPoints[i].z > box.mMaxZ)?1:0);} if (out==8) return false;
		out=0; for (i=0; i<8; i++) {out += ((fru.mPoints[i].z < box.mMinZ)?1:0);} if (out==8) return false;
		*/
		return true;
	}
};
OE.Utils.defClass(OE.Frustum);

OE.Math = {};

OE.Math.PI = 3.14159265358979323846264338327950;
OE.Math.PI_BY_90 = OE.Math.PI / 90.0;
OE.Math.PI_BY_180 = OE.Math.PI / 180.0;
OE.Math.PI_BY_360 = OE.Math.PI / 360.0;
OE.Math.TWO_PI = OE.Math.PI * 2.0;
OE.Math.TWO_BY_PI = 2.0 / OE.Math.PI;

OE.Math.DEG_TO_RAD = OE.Math.PI / 180.0;
OE.Math.RAD_TO_DEG = 180.0 / OE.Math.PI;

OE.Math.clamp = function(x, a, b) {return x<a?a:(x>b?b:x);};
OE.Math.fract = function(x) {return x - Math.floor(x);};

OE.Math.mod = function(a, b) {return ((a%b)+b)%b;};

OE.Math.linInterp = function(a, b, x) {return a+(b-a)*x;};
OE.Math.cosInterp = function(a, b, x) {
	var x2 = (1.0 - Math.cos(x*OE.Math.PI)) / 2.0;
	return (a*(1.0-x2) + b*x2);
};

OE.Math.interpN = function(dim, func, bounds, factor) {
	if (dim == 0) {
		return bounds;
	}
	else if (dim == 1) {
		var a = bounds[0];
		var b = bounds[1];
		return func(a, b, factor[0]);
	}
	else {
		var a = bounds[0];
		var b = bounds[1];
		var d2 = dim-1;
		var fx = factor[dim-2];
		var fy = factor[dim-1];
		var x1 = OE.Math.interpN(d2, func, a, factor);
		var x2 = OE.Math.interpN(d2, func, b, factor);
		var y = func(x1, x2, fy);
		return y;
	}
};

OE.Math.atanBias = function(x, bias) {return Math.atan(x * bias) * OE.Math.TWO_BY_PI;};

OE.Movable = function(scene) {
	this.mTransform = new OE.Transform();
};

OE.Movable.prototype = {
	mTransform: undefined,
	
	onTransformChanged: function() {},
	
	setPos: function(pos) {
		this.mTransform.setPos(pos);
		this.onTransformChanged();
	},
	setPosf: function(x, y, z) {
		this.mTransform.setPosf(x, y, z);
		this.onTransformChanged();
	},
	setRot: function(rot) {
		this.mTransform.setRot(rot);
		this.onTransformChanged();
	},
	setRotf: function(x, y, z, w) {
		this.mTransform.setRotf(x, y, z, w);
		this.onTransformChanged();
	},
	setRotAxisAngle: function(axis, angle) {
		this.mTransform.setRotAxisAngle(axis, angle);
		this.onTransformChanged();
	},
	setScale: function(scale) {
		this.mTransform.setScale(scale);
		this.onTransformChanged();
	},
	setScalef: function(x, y, z) {
		this.mTransform.setScalef(x, y, z);
		this.onTransformChanged();
	},
	setTransform: function(xform) {
		this.mTransform.set(xform);
		this.onTransformChanged();
	},
	
	getPos: function() {
		return this.mTransform.getPos();
	},
	getRot: function() {
		return this.mTransform.getRot();
	},
	getScale: function() {
		return this.mTransform.getScale();
	},
	getTransform: function() {
		return this.mTransform;
	},
	getTransformMatrix: function() {
		return this.mTransform.getMatrix();
	}
}
OE.Utils.defClass(OE.Movable);

OE.Noise = {};

OE.Noise.mSeed = [12.9898, 77.233, 143.66337, 23.53277];

OE.Noise.noise = function(size, a, b, c, d) {
	var seed = OE.Noise.mSeed;
	var result = [a, b, c, d];
	for (var i=0; i<4; i++) {
		result[i] = OE.Noise.noiseN(size, result[i]);
	}
	return result;
};
OE.Noise.noiseN = function(size, pos) {
	var dot = 0.0;
	for (var i=0; i<size; i++) dot += pos[i]*OE.Noise.mSeed[i];
	return OE.Math.fract(Math.sin(dot) * 43758.5453) * 2.0 - 1.0;
};

OE.Noise.smoothNoise2 = function(v) {
	var C0 = [	Math.floor(v[0]),
				Math.floor(v[1])];
	var C = [C0,
			[C0[0] + 1.0, C0[1] + 0.0],
			[C0[0] + 0.0, C0[1] + 1.0],
			[C0[0] + 1.0, C0[1] + 1.0]];
	var p = [	OE.Math.fract(v[0]),
				OE.Math.fract(v[1])];
	var r = OE.Noise.noise(2, C[0], C[1], C[2], C[3]);
	return OE.Math.interpN(2, OE.Math.cosInterp, [[r[0], r[1]], [r[2], r[3]]], p);
};
OE.Noise.smoothNoise3 = function(v) {
	var C0 = [	Math.floor(v[0]),
				Math.floor(v[1]),
				Math.floor(v[2])];
	var C = [C0,
			[C0[0]+1.0, C0[1]+0.0, C0[2]+0.0],
			[C0[0]+0.0, C0[1]+1.0, C0[2]+0.0],
			[C0[0]+1.0, C0[1]+1.0, C0[2]+0.0],
			[C0[0]+0.0, C0[1]+0.0, C0[2]+1.0],
			[C0[0]+1.0, C0[1]+0.0, C0[2]+1.0],
			[C0[0]+0.0, C0[1]+1.0, C0[2]+1.0],
			[C0[0]+1.0, C0[1]+1.0, C0[2]+1.0]];
	var p = [	OE.Math.fract(v[0]),
				OE.Math.fract(v[1]),
				OE.Math.fract(v[2])];
	var r1 = OE.Noise.noise(3, C[0], C[1], C[2], C[3]);
	var r2 = OE.Noise.noise(3, C[4], C[5], C[6], C[7]);
	var r = [	[	[r1[0], r1[1]],
					[r1[2], r1[3]]],
				[	[r2[0], r2[1]],
					[r2[2], r2[3]]]
			];
	return OE.Math.interpN(3, OE.Math.cosInterp, r, p);
};
OE.Noise.smoothNoiseN = function(n, v) {
	var C0 = [];
	for (var i=0; i<n; i++)
		C0.push(Math.floor(v[i]));
	
	var numCorners = Math.pow(2, n);
	var corners = [];
	for (var i=0; i<numCorners; i++) {
		var corner = [];
		for (var j=0; j<n; j++) {
			var bit = 1&(i>>j);
			corner.push(C0[j] + bit);
		}
		corners.push(OE.Noise.noiseN(n, corner));
	}
	
	var i = 0;
	var buildTree = function(node, depth) {
		if (depth+1 < n) {
			node[0] = [];
			node[1] = [];
			buildTree(node[0], depth+1);
			buildTree(node[1], depth+1);
		}
		else {
			node[0] = corners[i++];
			node[1] = corners[i++];
		}
	};
	var r = [];
	buildTree(r, 0);
	
	var p = [];
	for (var i=0; i<n; i++)
		p.push(OE.Math.fract(v[i]));
	
	return OE.Math.interpN(n, OE.Math.cosInterp, r, p);
};

OE.Noise.perlinNoise2 = function(v, octaves, frequency, persistence) {
	var x = 0.0;
	var vx = v[0] * frequency;
	var vy = v[1] * frequency;
	for (var i = 0; i < octaves; i++) {
		var amp = Math.pow(persistence, i);
		var freq = Math.pow(2.0, i);
		x += OE.Noise.smoothNoise2([vx*freq, vy*freq]) * amp;
	}
	return x;
};
/*OE.Noise.perlinNoise3 = function(Vector3 v, int octaves, double frequency, double persistence)
{
	double x = 0.0;
	v *= (Real)frequency;
	for(int i = 0;i < octaves;i++)
	{
		double amp = pow(persistence, (double)i);
		double freq = pow(2.0, (double)i);
		x += smoothNoise3(v * (Real)freq) * amp;
	}
	return x;
};*/
OE.Noise.ridgedNoise2 = function(v, octaves, frequency, persistence) {
	var x = 0.0;
	var vx = v[0] * frequency;
	var vy = v[1] * frequency;
	for (var i = 0; i < octaves; i++)
	{
		var amp = Math.pow(persistence, i);
		var freq = Math.pow(2.0, i);
		x += Math.abs(OE.Noise.smoothNoise2([vx*freq, vy*freq]) * amp);
	}
	return -x*2.0+1.0;
};
OE.Noise.ridgedNoise3 = function(v, octaves, frequency, persistence) {
	var x = 0.0;
	var vx = v[0] * frequency;
	var vy = v[1] * frequency;
	var vz = v[2] * frequency;
	for (var i = 0; i < octaves; i++)
	{
		var amp = Math.pow(persistence, i);
		var freq = Math.pow(2.0, i);
		x += Math.abs(OE.Noise.smoothNoise3([vx*freq, vy*freq, vz*freq]) * amp);
	}
	return -x*2.0+1.0;
};
OE.Noise.ridgedNoise4 = function(v, octaves, frequency, persistence) {
	var x = 0.0;
	var vx = v[0] * frequency;
	var vy = v[1] * frequency;
	var vz = v[2] * frequency;
	var vw = v[3] * frequency;
	for (var i = 0; i < octaves; i++)
	{
		var amp = Math.pow(persistence, i);
		var freq = Math.pow(2.0, i);
		x += Math.abs(OE.Noise.smoothNoiseN(4, [vx*freq, vy*freq, vz*freq, vw*freq]) * amp);
	}
	return -x*2.0+1.0;
};

OE.Quaternion = function(x, y, z, w) {
	if (arguments.length == 4) {
		this.x = x; this.y = y;
		this.z = z; this.w = w;
	}
	else {
		this.x = this.y = this.z = 0.0;
		this.w = 1.0;
	}
};

OE.Quaternion.EPSILON = 0.000000001;

OE.Quaternion.prototype = {
	x: 0.0, y: 0.0, z: 0.0, w: 0.0,
	
	set: function(q) {this.x = q.x; this.y = q.y; this.z = q.z; this.w = q.w;},
	setf: function(x, y, z, w) {this.x = x; this.y = y; this.z = z; this.w = w;},
	
	getConjugate: function() {
		return new OE.Quaternion(-this.x, -this.y, -this.z, this.w);
	},
	normalize: function() {
		var len2 =	this.x*this.x + this.y*this.y +
					this.z*this.z + this.w*this.w;
		if (len2 > OE.Quaternion.EPSILON) {
			var len = Math.sqrt(len2);
			this.x /= len;
			this.y /= len;
			this.z /= len;
			this.w /= len;
		}
	},
	getNormal: function() {
		var len2 =	this.x*this.x + this.y*this.y +
					this.z*this.z + this.w*this.w;
		if (len2 > OE.Quaternion.EPSILON) {
			var len = Math.sqrt(len2);
			return new OE.Quaternion(
				this.x / len,
				this.y / len,
				this.z / len,
				this.w / len
			);
		}
		return new OE.Quaternion(this.x, this.y, this.z, this.w);
	},
	
	fromRotationMatrix: function(mat) {
		// This algorithm lifted from http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/
		
		var _copysign = function(x, y) {
			x = Math.abs(x);
			return y == 0.0 ? 0.0 : (y > 0.0 ? x : -x);
		};
		
		this.w = Math.sqrt(Math.max(0.0, 1.0 + mat[0] + mat[4] + mat[8])) / 2.0;
		this.x = Math.sqrt(Math.max(0.0, 1.0 + mat[0] - mat[4] - mat[8])) / 2.0;
		this.y = Math.sqrt(Math.max(0.0, 1.0 - mat[0] + mat[4] - mat[8])) / 2.0;
		this.z = Math.sqrt(Math.max(0.0, 1.0 - mat[0] - mat[4] + mat[8])) / 2.0;
		
		this.x = _copysign(this.x, mat[5] - mat[7]);
		this.y = _copysign(this.y, mat[6] - mat[2]);
		this.z = _copysign(this.z, mat[1] - mat[3]);
	},
	fromAxes: function(xAxis, yAxis, zAxis) {
		this.fromRotationMatrix();
	},
	fromAxisAngle: function(axis, angle) {
		angle *= OE.Math.PI_BY_360;
		var sinAngle = Math.sin(angle);
		this.x = (axis.x * sinAngle);
		this.y = (axis.y * sinAngle);
		this.z = (axis.z * sinAngle);
		this.w = Math.cos(angle);
	},
	fromEuler: function(euler) {
		this.fromEulerf(euler.x, euler.y, euler.z);
	},
	fromEulerf: function(ex, ey, ez) {
		var ep = ex * OE.Math.PI_BY_90;
		var eq = ey * OE.Math.PI_BY_90;
		var er = ez * OE.Math.PI_BY_90;
		var sinp = Math.sin(ep);
		var siny = Math.sin(eq);
		var sinr = Math.sin(er);
		var cosp = Math.cos(ep);
		var cosy = Math.cos(eq);
		var cosr = Math.cos(er);
		this.x = sinr * cosp * cosy - cosr * sinp * siny;
		this.y = cosr * sinp * cosy + sinr * cosp * siny;
		this.z = cosr * cosp * siny - sinr * sinp * cosy;
		this.w = cosr * cosp * cosy + sinr * sinp * siny;
		this.normalize();
	},
	
	getAxisAngle: function(axisAngle) {
		this.normalize();
		var scale = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
		if (scale > OE.Quaternion.EPSILON && Math.abs(this.w) <= 1.0) {
			axisAngle.x = this.x / scale;
			axisAngle.y = this.y / scale;
			axisAngle.z = this.z / scale;
			axisAngle.w = Math.acos(this.w) * 2.0 * OE.Math.RAD_TO_DEG;
		}
		else {
			axisAngle.x = 1.0;
			axisAngle.y = 0.0;
			axisAngle.z = 0.0;
			axisAngle.w = 0.0;
		}
	},
	getMatrix: function() {
		var x2 = this.x * this.x;
		var y2 = this.y * this.y;
		var z2 = this.z * this.z;
		var xy = this.x * this.y;
		var xz = this.x * this.z;
		var yz = this.y * this.z;
		var wx = this.w * this.x;
		var wy = this.w * this.y;
		var wz = this.w * this.z;
		return [
			1.0 - 2.0 * (y2 + z2),	2.0 * (xy - wz),		2.0 * (xz + wy),		0.0,
			2.0 * (xy + wz),		1.0 - 2.0 * (x2 + z2),	2.0 * (yz - wx),		0.0,
			2.0 * (xz - wy),		2.0 * (yz + wx),		1.0 - 2.0 * (x2 + y2),	0.0,
			0.0,					0.0,					0.0,					1.0
		];
	},
	getForward: function() {
		var x2 = this.x * this.x;
		var y2 = this.y * this.y;
		var xz = this.x * this.z;
		var yz = this.y * this.z;
		var wx = this.w * this.x;
		var wy = this.w * this.y;
		return new OE.Vector3(
			2.0 * (xz - wy),
			2.0 * (yz + wx),
			1.0 - 2.0 * (x2 + y2)
		);
	},
	getUp: function() {
		var x2 = this.x * this.x;
		var z2 = this.z * this.z;
		var xy = this.x * this.y;
		var yz = this.y * this.z;
		var wx = this.w * this.x;
		var wz = this.w * this.z;
		return new OE.Vector3(
			2.0 * (xy + wz),
			1.0 - 2.0 * (x2 + z2),
			2.0 * (yz - wx)
		);
	},
	getRight: function() {
		var y2 = this.y * this.y;
		var z2 = this.z * this.z;
		var xy = this.x * this.y;
		var xz = this.x * this.z;
		var wy = this.w * this.y;
		var wz = this.w * this.z;
		return new OE.Vector3(
			1.0 - 2.0 * (y2 + z2),
			2.0 * (xy - wz),
			2.0 * (xz + wy)
		);
	},
	
	dot: function(q) {
		return this.x*q.x + this.y*q.y + this.z*q.z + this.w*q.w;
	},
	
	lerp: function(q, t) {
		var a = OE.Quaternion._aux;
		a.set(q);
		a.subBy(this);
		a.mulByf(t);
		this.addBy(a);
		this.normalize();
	},
	slerp: function(q, t) {
		var q3;
		var d = this.dot(q);

		if (d < 0) {
			d = -d;
			q3 = q.getConjugate();
		}
		else {
			q3 = q;
		}
		
		if (d < 0.95) {
			var angle = Math.acos(d);
			this.mulByf(Math.sin(angle*(1.0-t)));
			q3.mulByf(Math.sin(angle*t));
			this.addBy(q3);
			this.divByf(Math.sin(angle));
		}
		else {
			return this.lerp(q3, t);
		}
	},
	
	getLerp: function(q, t) {
		return (this.add((q.sub(this)).mulf(t))).getNormal();
	},
	getSlerp: function(q, t) {
		var q3;
		var d = this.dot(q);

		if (d < 0) {
			d = -d;
			q3 = q.getConjugate();
		}
		else {
			q3 = q;
		}
		
		if (d < 0.95) {
			var angle = Math.acos(d);
			return (this.mulf(Math.sin(angle*(1.0-t))).add(
					q3.mulf(Math.sin(angle*t))))
					.divf(Math.sin(angle));
		}
		else {
			return this.lerp(q3, t);
		}
	},
	
	addf: function(f) {return new OE.Quaternion(this.x+f, this.y+f, this.z+f, this.w+f);},
	subf: function(f) {return new OE.Quaternion(this.x-f, this.y-f, this.z-f, this.w-f);},
	mulf: function(f) {return new OE.Quaternion(this.x*f, this.y*f, this.z*f, this.w*f);},
	divf: function(f) {return new OE.Quaternion(this.x/f, this.y/f, this.z/f, this.w/f);},
	add: function(q) {return new OE.Quaternion(this.x+q.x, this.y+q.y, this.z+q.z, this.w+q.w);},
	sub: function(q) {return new OE.Quaternion(this.x-q.x, this.y-q.y, this.z-q.z, this.w-q.w);},
	
	addByf: function(f) {this.x+=f; this.y+=f; this.z+=f; this.w+=f;},
	subByf: function(f) {this.x-=f; this.y-=f; this.z-=f; this.w-=f;},
	mulByf: function(f) {this.x*=f; this.y*=f; this.z*=f; this.w*=f;},
	divByf: function(f) {this.x/=f; this.y/=f; this.z/=f; this.w/=f;},
	addBy: function(q) {this.x+=q.x; this.y+=q.y; this.z+=q.z; this.w+=q.w;},
	subBy: function(q) {this.x-=q.x; this.y-=q.y; this.z-=q.z; this.w-=q.w;},
	
	mul: function(q) {
		return new OE.Quaternion(
			this.w*q.x + this.x*q.w + this.y*q.z - this.z*q.y,
			this.w*q.y + this.y*q.w + this.z*q.x - this.x*q.z,
			this.w*q.z + this.z*q.w + this.x*q.y - this.y*q.x,
			this.w*q.w - this.x*q.x - this.y*q.y - this.z*q.z
		);
	},
	mulBy: function(q) {
		this.setf(
			this.w*q.x + this.x*q.w + this.y*q.z - this.z*q.y,
			this.w*q.y + this.y*q.w + this.z*q.x - this.x*q.z,
			this.w*q.z + this.z*q.w + this.x*q.y - this.y*q.x,
			this.w*q.w - this.x*q.x - this.y*q.y - this.z*q.z
		);
	},
	mulv: function(v) {
		var vq = new OE.Quaternion(v.x, v.y, v.z, 0.0);
		var q = new OE.Quaternion(); q.set(this);
		var c = q.getConjugate();
		q.mulBy(vq);
		q.mulBy(c);
		return new OE.Vector3(q.x, q.y, q.z);
	},
	mulvBy: function(v) {
		var vq = new OE.Quaternion(v.x, v.y, v.z, 0.0);
		var q = new OE.Quaternion(); q.set(this);
		var c = q.getConjugate();
		q.mulBy(vq);
		q.mulBy(c);
		v.setf(q.x, q.y, q.z);
		return v;
	}
};
OE.Utils.defClass(OE.Quaternion);

OE.Quaternion.mulOut = function(result, a, b) {
	result.setf(
		a.w*b.x + a.x*b.w + a.y*b.z - a.z*b.y,
		a.w*b.y + a.y*b.w + a.z*b.x - a.x*b.z,
		a.w*b.z + a.z*b.w + a.x*b.y - a.y*b.x,
		a.w*b.w - a.x*b.x - a.y*b.y - a.z*b.z
	);
};

OE.Quaternion._aux = new OE.Quaternion();

OE.Transform = function() {
	this.mMatrix = mat4.create();
	this.mPosition = new OE.Vector3(0.0, 0.0, 0.0);
	this.mRotation = new OE.Quaternion();
	this.mScale = new OE.Vector3(1.0, 1.0, 1.0);
	this.mAxisAngle = new OE.Vector4();
	
	mat4.identity(this.mMatrix);
};
OE.Transform.prototype = {
	mMatrix: undefined,
	mPosition: undefined,
	mRotation: undefined,
	mScale: undefined,
	mAxisAngle: undefined,
	mChanged: true,
	
	set: function(transform) {
		this.mPosition.set(transform.mPosition);
		this.mRotation.set(transform.mRotation);
		this.mAxisAngle.set(transform.mAxisAngle);
		this.mScale.set(transform.mScale);
		this.mChanged = true;
		//this.updateMatrix();
	},
	
	getPos: function() {
		return this.mPosition;
	},
	getRot: function() {
		return this.mRotation;
	},
	getScale: function() {
		return this.mScale;
	},

	setPos: function(pos) {
		this.mPosition.set(pos);
		this.mChanged = true;
	},
	setPosf: function(x, y, z) {
		this.mPosition.setf(x, y, z);
		this.mChanged = true;
	},
	setRot: function(rot) {
		this.mRotation.set(rot);
		this.mRotation.getAxisAngle(this.mAxisAngle);
		this.mChanged = true;
	},
	setRotf: function(x, y, z, w) {
		this.mRotation.setf(x, y, z, w);
		this.mRotation.getAxisAngle(this.mAxisAngle);
		this.mChanged = true;
	},
	setRotAxisAngle: function(axis, angle) {
		this.mRotation.fromAxisAngle(axis, angle);
		this.mAxisAngle.setf(axis.x, axis.y, axis.z, angle);
		this.mChanged = true;
	},
	setScale: function(scale) {
		this.mScale.set(scale);
		this.mChanged = true;
	},
	setScalef: function(x, y, z) {
		this.mScale.setf(x, y, z);
		this.mChanged = true;
	},
	
	updateMatrix: function() {
		mat4.identity(this.mMatrix);
		mat4.translate(this.mMatrix,
			[this.mPosition.x, this.mPosition.y, this.mPosition.z]);
		mat4.rotate(this.mMatrix,
			this.mAxisAngle.w*OE.Math.DEG_TO_RAD,
			[this.mAxisAngle.x, this.mAxisAngle.y, this.mAxisAngle.z]);
		mat4.scale(this.mMatrix,
			[this.mScale.x, this.mScale.y, this.mScale.z]);
	},
	
	fromMatrix: function(matrix) {
		var rot = [	matrix[0], matrix[1], matrix[2],
					matrix[4], matrix[5], matrix[6],
					matrix[8], matrix[9], matrix[10]];
		
		this.mMatrix = matrix;
		this.mPosition.setf(matrix[12], matrix[13], matrix[14]);
		this.mRotation.fromRotationMatrix(rot);
		this.mRotation.getAxisAngle(this.mAxisAngle);
		
		var x2 = rot[0]*rot[0] + rot[1]*rot[1] + rot[2]*rot[2];
		var y2 = rot[3]*rot[3] + rot[4]*rot[4] + rot[5]*rot[5];
		var z2 = rot[6]*rot[6] + rot[7]*rot[7] + rot[8]*rot[8];
		this.mScale.setf(Math.sqrt(x2), Math.sqrt(y2), Math.sqrt(z2));
	},
	getMatrix: function() {
		if (this.mChanged) {
			this.mChanged = false;
			this.updateMatrix();
		}
		return this.mMatrix;
	}
};
OE.Utils.defClass(OE.Transform);

OE.Transform.apply = function(result, a, b) {
	var mat = result.mMatrix;
	mat4.multiply(a.getMatrix(), b.getMatrix(), mat);
	result.fromMatrix(mat);
};

OE.Vector2 = function(x, y) {
	if (arguments.length == 2) {
		this.x = x; this.y = y;
	}
	else if (arguments.length == 1) {
		this.x = this.y = x;
	}
	else {
		this.x = this.y = 0.0;
	}
};
OE.Vector2.prototype = {
	x: 0.0, y: 0.0,
	
	length2: function() {return this.x*this.x + this.y*this.y;},
	length: function() {return Math.sqrt(this.x*this.x + this.y*this.y);},
	normalize: function() {
		var len2 = this.x*this.x + this.y*this.y;
		if (len2 > 0.0) {
			var len = Math.sqrt(len2);
			this.x /= len;
			this.y /= len;
		}
		return this;
	},
	
	dot: function(vec) {return this.x*vec.x+this.y*vec.y;},
	
	angleBetween: function(vec) {return Math.acos(this.dot(vec)/(this.length()*vec.length()));},
	
	set: function(vec) {this.x = vec.x; this.y = vec.y;},
	setf: function(x, y) {this.x = x; this.y = y;},
	
	add: function(v) {return new OE.Vector2(this.x+v.x, this.y+v.y);},
	sub: function(v) {return new OE.Vector2(this.x-v.x, this.y-v.y);},
	mul: function(v) {return new OE.Vector2(this.x*v.x, this.y*v.y);},
	div: function(v) {return new OE.Vector2(this.x/v.x, this.y/v.y);},
	addBy: function(v) {this.x+=v.x; this.y+=v.y;},
	subBy: function(v) {this.x-=v.x; this.y-=v.y;},
	mulBy: function(v) {this.x*=v.x; this.y*=v.y;},
	divBy: function(v) {this.x/=v.x; this.y/=v.y;},
	
	addf: function(f) {return new OE.Vector2(this.x+f, this.y+f);},
	subf: function(f) {return new OE.Vector2(this.x-f, this.y-f);},
	mulf: function(f) {return new OE.Vector2(this.x*f, this.y*f);},
	divf: function(f) {return new OE.Vector2(this.x/f, this.y/f);},
	addByf: function(f) {this.x+=f; this.y+=f;},
	subByf: function(f) {this.x-=f; this.y-=f;},
	mulByf: function(f) {this.x*=f; this.y*=f;},
	divByf: function(f) {this.x/=f; this.y/=f;}
};
OE.Utils.defClass(OE.Vector2);

OE.Vector2.ZERO = new OE.Vector2(0.0, 0.0);
OE.Vector2.ONE = new OE.Vector2(1.0, 1.0);
OE.Vector2.RIGHT = new OE.Vector2(1.0, 0.0);
OE.Vector2.LEFT = new OE.Vector2(-1.0, 0.0);
OE.Vector2.UP = new OE.Vector2(0.0, 1.0);
OE.Vector2.DOWN = new OE.Vector2(0.0, -1.0);

OE.Vector3 = function(x, y, z) {
	if (arguments.length == 3) {
		this.x = x; this.y = y; this.z = z;
	}
	else if (arguments.length == 2) {
		this.x = x; this.y = y; this.z = 0.0;
	}
	else if (arguments.length == 1) {
		this.x = this.y = this.z = x;
	}
	else {
		this.x = this.y = this.z = 0.0;
	}
};
OE.Vector3.prototype = {
	x: 0.0, y: 0.0, z: 0.0,
	
	length2: function() {return this.x*this.x + this.y*this.y + this.z*this.z;},
	length: function() {return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);},
	normalize: function() {
		var len2 = this.x*this.x + this.y*this.y + this.z*this.z;
		if (len2 > 0.0) {
			var len = Math.sqrt(len2);
			this.x /= len;
			this.y /= len;
			this.z /= len;
		}
		return this;
	},
	
	cross: function(vec) {
		return new OE.Vector3(
			this.y * vec.z - this.z * vec.y,
			this.z * vec.x - this.x * vec.z,
			this.x * vec.y - this.y * vec.x);
	},
	crossBy: function(vec) {
		this.setf(
			this.y * vec.z - this.z * vec.y,
			this.z * vec.x - this.x * vec.z,
			this.x * vec.y - this.y * vec.x);
		return this;
	},
	dot: function(vec) {return this.x*vec.x+this.y*vec.y+this.z*vec.z;},
	
	angleBetween: function(vec) {return Math.acos(this.dot(vec)/(this.length()*vec.length()));},
	
	set: function(vec) {this.x = vec.x; this.y = vec.y; this.z = vec.z;},
	setf: function(x, y, z) {this.x = x; this.y = y; this.z = z;},

	add: function(v) {return new OE.Vector3(this.x+v.x, this.y+v.y, this.z+v.z);},
	sub: function(v) {return new OE.Vector3(this.x-v.x, this.y-v.y, this.z-v.z);},
	mul: function(v) {return new OE.Vector3(this.x*v.x, this.y*v.y, this.z*v.z);},
	div: function(v) {return new OE.Vector3(this.x/v.x, this.y/v.y, this.z/v.z);},
	addBy: function(v) {this.x+=v.x; this.y+=v.y; this.z+=v.z;},
	subBy: function(v) {this.x-=v.x; this.y-=v.y; this.z-=v.z;},
	mulBy: function(v) {this.x*=v.x; this.y*=v.y; this.z*=v.z;},
	divBy: function(v) {this.x/=v.x; this.y/=v.y; this.z/=v.z;},

	addf: function(f) {return new OE.Vector3(this.x+f, this.y+f, this.z+f);},
	subf: function(f) {return new OE.Vector3(this.x-f, this.y-f, this.z-f);},
	mulf: function(f) {return new OE.Vector3(this.x*f, this.y*f, this.z*f);},
	divf: function(f) {return new OE.Vector3(this.x/f, this.y/f, this.z/f);},
	addByf: function(f) {this.x+=f; this.y+=f; this.z+=f;},
	subByf: function(f) {this.x-=f; this.y-=f; this.z-=f;},
	mulByf: function(f) {this.x*=f; this.y*=f; this.z*=f;},
	divByf: function(f) {this.x/=f; this.y/=f; this.z/=f;}
};
OE.Utils.defClass(OE.Vector3);

OE.Vector3.ZERO = new OE.Vector3(0.0, 0.0, 0.0);
OE.Vector3.ONE = new OE.Vector3(1.0, 1.0, 1.0);
OE.Vector3.RIGHT = new OE.Vector3(1.0, 0.0, 0.0);
OE.Vector3.LEFT = new OE.Vector3(-1.0, 0.0, 0.0);
OE.Vector3.UP = new OE.Vector3(0.0, 1.0, 0.0);
OE.Vector3.DOWN = new OE.Vector3(0.0, -1.0, 0.0);
OE.Vector3.FORWARD = new OE.Vector3(0.0, 0.0, -1.0);
OE.Vector3.BACKWARD = new OE.Vector3(0.0, 0.0, 1.0);

OE.Vector4 = function(x, y, z, w) {
	if (arguments.length == 4) {
		this.x = x; this.y = y; this.z = z; this.w = w;
	}
	else if (arguments.length == 3) {
		this.x = x; this.y = y; this.z = z; this.w = 1.0;
	}
	else if (arguments.length == 2) {
		this.x = x.x; this.y = x.y; this.z = x.z; this.w = y;
	}
	else if (arguments.length == 1) {
		this.x = this.y = this.z = x; this.w = 1.0;
	}
	else {
		this.x = this.y = this.z = 0.0; this.w = 1.0;
	}
};
OE.Vector4.prototype = {
	x: 0.0, y: 0.0, z: 0.0, w: 0.0,
	
	length2: function() {return this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w;},
	length: function() {return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w);},
	
	normalize: function() {
		var len2 = this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w;
		if (len2 > 0.0) {
			var len = Math.sqrt(len2);
			this.x /= len;
			this.y /= len;
			this.z /= len;
			this.w /= len;
		}
		return this;
	},
	
	dot: function(vec) {return this.x*vec.x+this.y*vec.y+this.z*vec.z+this.w*vec.w;},
	angleBetween: function(vec) {return Math.acos(this.dot(vec)/(this.length()*vec.length()));},
	
	set: function(v) {this.x = v.x; this.y = v.y; this.z = v.z; this.w = v.w;},
	setf: function(x, y, z, w) {this.x = x; this.y = y; this.z = z; this.w = w;},

	add: function(v) {return new OE.Vector4(this.x+v.x, this.y+v.y, this.z+v.z, this.w+v.w);},
	sub: function(v) {return new OE.Vector4(this.x-v.x, this.y-v.y, this.z-v.z, this.w-v.w);},
	mul: function(v) {return new OE.Vector4(this.x*v.x, this.y*v.y, this.z*v.z, this.w*v.w);},
	div: function(v) {return new OE.Vector4(this.x/v.x, this.y/v.y, this.z/v.z, this.w/v.w);},
	addBy: function(v) {this.x+=v.x; this.y+=v.y; this.z+=v.z; this.w+=v.w;},
	subBy: function(v) {this.x-=v.x; this.y-=v.y; this.z-=v.z; this.w-=v.w;},
	mulBy: function(v) {this.x*=v.x; this.y*=v.y; this.z*=v.z; this.w*=v.w;},
	divBy: function(v) {this.x/=v.x; this.y/=v.y; this.z/=v.z; this.w/=v.w;},

	addf: function(f) {return new OE.Vector4(this.x+f, this.y+f, this.z+f, this.w+f);},
	subf: function(f) {return new OE.Vector4(this.x-f, this.y-f, this.z-f, this.w-f);},
	mulf: function(f) {return new OE.Vector4(this.x*f, this.y*f, this.z*f, this.w*f);},
	divf: function(f) {return new OE.Vector4(this.x/f, this.y/f, this.z/f, this.w/f);},
	addByf: function(f) {this.x+=f; this.y+=f; this.z+=f; this.w+=f;},
	subByf: function(f) {this.x-=f; this.y-=f; this.z-=f; this.w-=f;},
	mulByf: function(f) {this.x*=f; this.y*=f; this.z*=f; this.w*=f;},
	divByf: function(f) {this.x/=f; this.y/=f; this.z/=f; this.w/=f;}
};
OE.Utils.defClass(OE.Vector4);
// glMatrix v0.9.5
glMatrixArrayType=typeof Float32Array!="undefined"?Float32Array:typeof WebGLFloatArray!="undefined"?WebGLFloatArray:Array;var vec3={};vec3.create=function(a){var b=new glMatrixArrayType(3);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2]}return b};vec3.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];return b};vec3.add=function(a,b,c){if(!c||a==c){a[0]+=b[0];a[1]+=b[1];a[2]+=b[2];return a}c[0]=a[0]+b[0];c[1]=a[1]+b[1];c[2]=a[2]+b[2];return c};
vec3.subtract=function(a,b,c){if(!c||a==c){a[0]-=b[0];a[1]-=b[1];a[2]-=b[2];return a}c[0]=a[0]-b[0];c[1]=a[1]-b[1];c[2]=a[2]-b[2];return c};vec3.negate=function(a,b){b||(b=a);b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];return b};vec3.scale=function(a,b,c){if(!c||a==c){a[0]*=b;a[1]*=b;a[2]*=b;return a}c[0]=a[0]*b;c[1]=a[1]*b;c[2]=a[2]*b;return c};
vec3.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=Math.sqrt(c*c+d*d+e*e);if(g){if(g==1){b[0]=c;b[1]=d;b[2]=e;return b}}else{b[0]=0;b[1]=0;b[2]=0;return b}g=1/g;b[0]=c*g;b[1]=d*g;b[2]=e*g;return b};vec3.cross=function(a,b,c){c||(c=a);var d=a[0],e=a[1];a=a[2];var g=b[0],f=b[1];b=b[2];c[0]=e*b-a*f;c[1]=a*g-d*b;c[2]=d*f-e*g;return c};vec3.length=function(a){var b=a[0],c=a[1];a=a[2];return Math.sqrt(b*b+c*c+a*a)};vec3.dot=function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]};
vec3.direction=function(a,b,c){c||(c=a);var d=a[0]-b[0],e=a[1]-b[1];a=a[2]-b[2];b=Math.sqrt(d*d+e*e+a*a);if(!b){c[0]=0;c[1]=0;c[2]=0;return c}b=1/b;c[0]=d*b;c[1]=e*b;c[2]=a*b;return c};vec3.lerp=function(a,b,c,d){d||(d=a);d[0]=a[0]+c*(b[0]-a[0]);d[1]=a[1]+c*(b[1]-a[1]);d[2]=a[2]+c*(b[2]-a[2]);return d};vec3.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+"]"};var mat3={};
mat3.create=function(a){var b=new glMatrixArrayType(9);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9]}return b};mat3.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];return b};mat3.identity=function(a){a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=1;a[5]=0;a[6]=0;a[7]=0;a[8]=1;return a};
mat3.transpose=function(a,b){if(!b||a==b){var c=a[1],d=a[2],e=a[5];a[1]=a[3];a[2]=a[6];a[3]=c;a[5]=a[7];a[6]=d;a[7]=e;return a}b[0]=a[0];b[1]=a[3];b[2]=a[6];b[3]=a[1];b[4]=a[4];b[5]=a[7];b[6]=a[2];b[7]=a[5];b[8]=a[8];return b};mat3.toMat4=function(a,b){b||(b=mat4.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=0;b[4]=a[3];b[5]=a[4];b[6]=a[5];b[7]=0;b[8]=a[6];b[9]=a[7];b[10]=a[8];b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};
mat3.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+"]"};var mat4={};mat4.create=function(a){var b=new glMatrixArrayType(16);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=a[12];b[13]=a[13];b[14]=a[14];b[15]=a[15]}return b};
mat4.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=a[12];b[13]=a[13];b[14]=a[14];b[15]=a[15];return b};mat4.identity=function(a){a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=0;a[5]=1;a[6]=0;a[7]=0;a[8]=0;a[9]=0;a[10]=1;a[11]=0;a[12]=0;a[13]=0;a[14]=0;a[15]=1;return a};
mat4.transpose=function(a,b){if(!b||a==b){var c=a[1],d=a[2],e=a[3],g=a[6],f=a[7],h=a[11];a[1]=a[4];a[2]=a[8];a[3]=a[12];a[4]=c;a[6]=a[9];a[7]=a[13];a[8]=d;a[9]=g;a[11]=a[14];a[12]=e;a[13]=f;a[14]=h;return a}b[0]=a[0];b[1]=a[4];b[2]=a[8];b[3]=a[12];b[4]=a[1];b[5]=a[5];b[6]=a[9];b[7]=a[13];b[8]=a[2];b[9]=a[6];b[10]=a[10];b[11]=a[14];b[12]=a[3];b[13]=a[7];b[14]=a[11];b[15]=a[15];return b};
mat4.determinant=function(a){var b=a[0],c=a[1],d=a[2],e=a[3],g=a[4],f=a[5],h=a[6],i=a[7],j=a[8],k=a[9],l=a[10],o=a[11],m=a[12],n=a[13],p=a[14];a=a[15];return m*k*h*e-j*n*h*e-m*f*l*e+g*n*l*e+j*f*p*e-g*k*p*e-m*k*d*i+j*n*d*i+m*c*l*i-b*n*l*i-j*c*p*i+b*k*p*i+m*f*d*o-g*n*d*o-m*c*h*o+b*n*h*o+g*c*p*o-b*f*p*o-j*f*d*a+g*k*d*a+j*c*h*a-b*k*h*a-g*c*l*a+b*f*l*a};
mat4.inverse=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=a[4],h=a[5],i=a[6],j=a[7],k=a[8],l=a[9],o=a[10],m=a[11],n=a[12],p=a[13],r=a[14],s=a[15],A=c*h-d*f,B=c*i-e*f,t=c*j-g*f,u=d*i-e*h,v=d*j-g*h,w=e*j-g*i,x=k*p-l*n,y=k*r-o*n,z=k*s-m*n,C=l*r-o*p,D=l*s-m*p,E=o*s-m*r,q=1/(A*E-B*D+t*C+u*z-v*y+w*x);b[0]=(h*E-i*D+j*C)*q;b[1]=(-d*E+e*D-g*C)*q;b[2]=(p*w-r*v+s*u)*q;b[3]=(-l*w+o*v-m*u)*q;b[4]=(-f*E+i*z-j*y)*q;b[5]=(c*E-e*z+g*y)*q;b[6]=(-n*w+r*t-s*B)*q;b[7]=(k*w-o*t+m*B)*q;b[8]=(f*D-h*z+j*x)*q;
b[9]=(-c*D+d*z-g*x)*q;b[10]=(n*v-p*t+s*A)*q;b[11]=(-k*v+l*t-m*A)*q;b[12]=(-f*C+h*y-i*x)*q;b[13]=(c*C-d*y+e*x)*q;b[14]=(-n*u+p*B-r*A)*q;b[15]=(k*u-l*B+o*A)*q;return b};mat4.toRotationMat=function(a,b){b||(b=mat4.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};
mat4.toMat3=function(a,b){b||(b=mat3.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[4];b[4]=a[5];b[5]=a[6];b[6]=a[8];b[7]=a[9];b[8]=a[10];return b};mat4.toInverseMat3=function(a,b){var c=a[0],d=a[1],e=a[2],g=a[4],f=a[5],h=a[6],i=a[8],j=a[9],k=a[10],l=k*f-h*j,o=-k*g+h*i,m=j*g-f*i,n=c*l+d*o+e*m;if(!n)return null;n=1/n;b||(b=mat3.create());b[0]=l*n;b[1]=(-k*d+e*j)*n;b[2]=(h*d-e*f)*n;b[3]=o*n;b[4]=(k*c-e*i)*n;b[5]=(-h*c+e*g)*n;b[6]=m*n;b[7]=(-j*c+d*i)*n;b[8]=(f*c-d*g)*n;return b};
mat4.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],f=a[3],h=a[4],i=a[5],j=a[6],k=a[7],l=a[8],o=a[9],m=a[10],n=a[11],p=a[12],r=a[13],s=a[14];a=a[15];var A=b[0],B=b[1],t=b[2],u=b[3],v=b[4],w=b[5],x=b[6],y=b[7],z=b[8],C=b[9],D=b[10],E=b[11],q=b[12],F=b[13],G=b[14];b=b[15];c[0]=A*d+B*h+t*l+u*p;c[1]=A*e+B*i+t*o+u*r;c[2]=A*g+B*j+t*m+u*s;c[3]=A*f+B*k+t*n+u*a;c[4]=v*d+w*h+x*l+y*p;c[5]=v*e+w*i+x*o+y*r;c[6]=v*g+w*j+x*m+y*s;c[7]=v*f+w*k+x*n+y*a;c[8]=z*d+C*h+D*l+E*p;c[9]=z*e+C*i+D*o+E*r;c[10]=z*
g+C*j+D*m+E*s;c[11]=z*f+C*k+D*n+E*a;c[12]=q*d+F*h+G*l+b*p;c[13]=q*e+F*i+G*o+b*r;c[14]=q*g+F*j+G*m+b*s;c[15]=q*f+F*k+G*n+b*a;return c};mat4.multiplyVec3=function(a,b,c){c||(c=b);var d=b[0],e=b[1];b=b[2];c[0]=a[0]*d+a[4]*e+a[8]*b+a[12];c[1]=a[1]*d+a[5]*e+a[9]*b+a[13];c[2]=a[2]*d+a[6]*e+a[10]*b+a[14];return c};
mat4.multiplyVec4=function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2];b=b[3];c[0]=a[0]*d+a[4]*e+a[8]*g+a[12]*b;c[1]=a[1]*d+a[5]*e+a[9]*g+a[13]*b;c[2]=a[2]*d+a[6]*e+a[10]*g+a[14]*b;c[3]=a[3]*d+a[7]*e+a[11]*g+a[15]*b;return c};
mat4.translate=function(a,b,c){var d=b[0],e=b[1];b=b[2];if(!c||a==c){a[12]=a[0]*d+a[4]*e+a[8]*b+a[12];a[13]=a[1]*d+a[5]*e+a[9]*b+a[13];a[14]=a[2]*d+a[6]*e+a[10]*b+a[14];a[15]=a[3]*d+a[7]*e+a[11]*b+a[15];return a}var g=a[0],f=a[1],h=a[2],i=a[3],j=a[4],k=a[5],l=a[6],o=a[7],m=a[8],n=a[9],p=a[10],r=a[11];c[0]=g;c[1]=f;c[2]=h;c[3]=i;c[4]=j;c[5]=k;c[6]=l;c[7]=o;c[8]=m;c[9]=n;c[10]=p;c[11]=r;c[12]=g*d+j*e+m*b+a[12];c[13]=f*d+k*e+n*b+a[13];c[14]=h*d+l*e+p*b+a[14];c[15]=i*d+o*e+r*b+a[15];return c};
mat4.scale=function(a,b,c){var d=b[0],e=b[1];b=b[2];if(!c||a==c){a[0]*=d;a[1]*=d;a[2]*=d;a[3]*=d;a[4]*=e;a[5]*=e;a[6]*=e;a[7]*=e;a[8]*=b;a[9]*=b;a[10]*=b;a[11]*=b;return a}c[0]=a[0]*d;c[1]=a[1]*d;c[2]=a[2]*d;c[3]=a[3]*d;c[4]=a[4]*e;c[5]=a[5]*e;c[6]=a[6]*e;c[7]=a[7]*e;c[8]=a[8]*b;c[9]=a[9]*b;c[10]=a[10]*b;c[11]=a[11]*b;c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15];return c};
mat4.rotate=function(a,b,c,d){var e=c[0],g=c[1];c=c[2];var f=Math.sqrt(e*e+g*g+c*c);if(!f)return null;if(f!=1){f=1/f;e*=f;g*=f;c*=f}var h=Math.sin(b),i=Math.cos(b),j=1-i;b=a[0];f=a[1];var k=a[2],l=a[3],o=a[4],m=a[5],n=a[6],p=a[7],r=a[8],s=a[9],A=a[10],B=a[11],t=e*e*j+i,u=g*e*j+c*h,v=c*e*j-g*h,w=e*g*j-c*h,x=g*g*j+i,y=c*g*j+e*h,z=e*c*j+g*h;e=g*c*j-e*h;g=c*c*j+i;if(d){if(a!=d){d[12]=a[12];d[13]=a[13];d[14]=a[14];d[15]=a[15]}}else d=a;d[0]=b*t+o*u+r*v;d[1]=f*t+m*u+s*v;d[2]=k*t+n*u+A*v;d[3]=l*t+p*u+B*
v;d[4]=b*w+o*x+r*y;d[5]=f*w+m*x+s*y;d[6]=k*w+n*x+A*y;d[7]=l*w+p*x+B*y;d[8]=b*z+o*e+r*g;d[9]=f*z+m*e+s*g;d[10]=k*z+n*e+A*g;d[11]=l*z+p*e+B*g;return d};mat4.rotateX=function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[4],g=a[5],f=a[6],h=a[7],i=a[8],j=a[9],k=a[10],l=a[11];if(c){if(a!=c){c[0]=a[0];c[1]=a[1];c[2]=a[2];c[3]=a[3];c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15]}}else c=a;c[4]=e*b+i*d;c[5]=g*b+j*d;c[6]=f*b+k*d;c[7]=h*b+l*d;c[8]=e*-d+i*b;c[9]=g*-d+j*b;c[10]=f*-d+k*b;c[11]=h*-d+l*b;return c};
mat4.rotateY=function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[0],g=a[1],f=a[2],h=a[3],i=a[8],j=a[9],k=a[10],l=a[11];if(c){if(a!=c){c[4]=a[4];c[5]=a[5];c[6]=a[6];c[7]=a[7];c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15]}}else c=a;c[0]=e*b+i*-d;c[1]=g*b+j*-d;c[2]=f*b+k*-d;c[3]=h*b+l*-d;c[8]=e*d+i*b;c[9]=g*d+j*b;c[10]=f*d+k*b;c[11]=h*d+l*b;return c};
mat4.rotateZ=function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[0],g=a[1],f=a[2],h=a[3],i=a[4],j=a[5],k=a[6],l=a[7];if(c){if(a!=c){c[8]=a[8];c[9]=a[9];c[10]=a[10];c[11]=a[11];c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15]}}else c=a;c[0]=e*b+i*d;c[1]=g*b+j*d;c[2]=f*b+k*d;c[3]=h*b+l*d;c[4]=e*-d+i*b;c[5]=g*-d+j*b;c[6]=f*-d+k*b;c[7]=h*-d+l*b;return c};
mat4.frustum=function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,i=d-c,j=g-e;f[0]=e*2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=e*2/i;f[6]=0;f[7]=0;f[8]=(b+a)/h;f[9]=(d+c)/i;f[10]=-(g+e)/j;f[11]=-1;f[12]=0;f[13]=0;f[14]=-(g*e*2)/j;f[15]=0;return f};mat4.perspective=function(a,b,c,d,e){a=c*Math.tan(a*Math.PI/360);b=a*b;return mat4.frustum(-b,b,-a,a,c,d,e)};
mat4.ortho=function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,i=d-c,j=g-e;f[0]=2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=2/i;f[6]=0;f[7]=0;f[8]=0;f[9]=0;f[10]=-2/j;f[11]=0;f[12]=-(a+b)/h;f[13]=-(d+c)/i;f[14]=-(g+e)/j;f[15]=1;return f};
mat4.lookAt=function(a,b,c,d){d||(d=mat4.create());var e=a[0],g=a[1];a=a[2];var f=c[0],h=c[1],i=c[2];c=b[1];var j=b[2];if(e==b[0]&&g==c&&a==j)return mat4.identity(d);var k,l,o,m;c=e-b[0];j=g-b[1];b=a-b[2];m=1/Math.sqrt(c*c+j*j+b*b);c*=m;j*=m;b*=m;k=h*b-i*j;i=i*c-f*b;f=f*j-h*c;if(m=Math.sqrt(k*k+i*i+f*f)){m=1/m;k*=m;i*=m;f*=m}else f=i=k=0;h=j*f-b*i;l=b*k-c*f;o=c*i-j*k;if(m=Math.sqrt(h*h+l*l+o*o)){m=1/m;h*=m;l*=m;o*=m}else o=l=h=0;d[0]=k;d[1]=h;d[2]=c;d[3]=0;d[4]=i;d[5]=l;d[6]=j;d[7]=0;d[8]=f;d[9]=
o;d[10]=b;d[11]=0;d[12]=-(k*e+i*g+f*a);d[13]=-(h*e+l*g+o*a);d[14]=-(c*e+j*g+b*a);d[15]=1;return d};mat4.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+", "+a[9]+", "+a[10]+", "+a[11]+", "+a[12]+", "+a[13]+", "+a[14]+", "+a[15]+"]"};quat4={};quat4.create=function(a){var b=new glMatrixArrayType(4);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3]}return b};quat4.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];return b};
quat4.calculateW=function(a,b){var c=a[0],d=a[1],e=a[2];if(!b||a==b){a[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e));return a}b[0]=c;b[1]=d;b[2]=e;b[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e));return b};quat4.inverse=function(a,b){if(!b||a==b){a[0]*=1;a[1]*=1;a[2]*=1;return a}b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];b[3]=a[3];return b};quat4.length=function(a){var b=a[0],c=a[1],d=a[2];a=a[3];return Math.sqrt(b*b+c*c+d*d+a*a)};
quat4.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=Math.sqrt(c*c+d*d+e*e+g*g);if(f==0){b[0]=0;b[1]=0;b[2]=0;b[3]=0;return b}f=1/f;b[0]=c*f;b[1]=d*f;b[2]=e*f;b[3]=g*f;return b};quat4.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2];a=a[3];var f=b[0],h=b[1],i=b[2];b=b[3];c[0]=d*b+a*f+e*i-g*h;c[1]=e*b+a*h+g*f-d*i;c[2]=g*b+a*i+d*h-e*f;c[3]=a*b-d*f-e*h-g*i;return c};
quat4.multiplyVec3=function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2];b=a[0];var f=a[1],h=a[2];a=a[3];var i=a*d+f*g-h*e,j=a*e+h*d-b*g,k=a*g+b*e-f*d;d=-b*d-f*e-h*g;c[0]=i*a+d*-b+j*-h-k*-f;c[1]=j*a+d*-f+k*-b-i*-h;c[2]=k*a+d*-h+i*-f-j*-b;return c};quat4.toMat3=function(a,b){b||(b=mat3.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,i=e+e,j=c*f,k=c*h;c=c*i;var l=d*h;d=d*i;e=e*i;f=g*f;h=g*h;g=g*i;b[0]=1-(l+e);b[1]=k-g;b[2]=c+h;b[3]=k+g;b[4]=1-(j+e);b[5]=d-f;b[6]=c-h;b[7]=d+f;b[8]=1-(j+l);return b};
quat4.toMat4=function(a,b){b||(b=mat4.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,i=e+e,j=c*f,k=c*h;c=c*i;var l=d*h;d=d*i;e=e*i;f=g*f;h=g*h;g=g*i;b[0]=1-(l+e);b[1]=k-g;b[2]=c+h;b[3]=0;b[4]=k+g;b[5]=1-(j+e);b[6]=d-f;b[7]=0;b[8]=c-h;b[9]=d+f;b[10]=1-(j+l);b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};quat4.slerp=function(a,b,c,d){d||(d=a);var e=c;if(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3]<0)e=-1*c;d[0]=1-c*a[0]+e*b[0];d[1]=1-c*a[1]+e*b[1];d[2]=1-c*a[2]+e*b[2];d[3]=1-c*a[3]+e*b[3];return d};
quat4.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+"]"};

OE.Renderable = function() {};

OE.Renderable.prototype = {
	getRenderOperation: function(op) {}
};
OE.Utils.defClass(OE.Renderable);

// #include Math/Movable.js

OE.GameObject = function() {
	OE.Movable.call(this);
	this.mChildren = [];
	this.mWorldTransform = new OE.Transform();
	
	this.onCreate();
};

OE.GameObject.prototype = {
	mScene: undefined,
	mParent: undefined,
	mChildren: undefined,
	mActive: true,
	mWorldTransform: undefined,
	mCulledLastFrame: false,
	
	onCreate: function() {},
	onAddedToScene: function() {},
	onRemovedFromScene: function() {},
	onUpdate: function() {},
	onDestroy: function() {},
	queueRenderables: function(renderQueue) {},
	
	setScene: function(scene) {
		this.mScene = scene;
		for (var i=0; i<this.mChildren.length; i++) {
			this.mChildren[i].setScene(scene);
		}
	},
	addChild: function(child) {
		if (child.mParent !== undefined) {
			child.mParent.removeChild(child);
		}
		this.mChildren.push(child);
		child.setScene(this.mScene);
		child.mParent = this;
		child.onTransformChanged();
		child.onAddedToScene();
		return child;
	},
	removeChild: function(child) {
		var index = this.mChildren.indexOf(child);
		if (index >= 0) {
			child.onRemovedFromScene();
			child.mParent = undefined;
			this.mChildren.splice(index, 1);
			child.setScene(undefined);
		}
	},
	
	destroy: function() {
		this.onDestroy();
		if (this.mParent) {
			this.mParent.removeChild(this);
		}
	},
	destroyAll: function() {
		while (this.mChildren.length > 0) {
			this.mChildren[0].destroy();
		}
	},
	update: function() {
		if (this.mActive) {
			this.onUpdate();
			for (var i=0; i<this.mChildren.length; i++) {
				if (this.mChildren[i].mActive)
					this.mChildren[i].update();
			}
		}
	},
	
	getTransform: function(local) {
		return (local ? this.mTransform : this.mWorldTransform);
	},
	getWorldMatrix: function() {
		return this.mWorldTransform.getMatrix();
	},
	onTransformChanged: function() {
		if (this.mParent !== undefined) {
			OE.Transform.apply(	this.mWorldTransform,
								this.mParent.mWorldTransform,
								this.mTransform);
		}
		else {
			this.mWorldTransform.set(this.mTransform);
		}
		
		for (var i=0; i<this.mChildren.length; i++) {
			this.mChildren[i].onTransformChanged();
		}
	}
};

OE.GameObject.serialize = function(object) {
	var className = object.prototype.constructor;
	var pos = object.getPos();
	var rot = object.getRot();
	return {
		transform: {
			pos: [pos.x, pos.y, pos.z],
			rot: [rot.x, rot.y, rot.z, rot.w],
			scale: [1.0, 1.0, 1.0]
		}
	};
};
OE.GameObject.decodeMtlParams = function(data) {
	if (data.mtlParams === undefined)
		return undefined;
	
	var material = OE.MaterialManager.getLoaded(data.material);
	var p = data.mtlParams;
	var shader = material.mPasses[0].mShader;
	var params = new OE.MtlParams();
	
	if (params.mUniforms == undefined)
		params.mUniforms = [];
	
	for (var key in p.uniforms) {
		var u = shader.getUniformByName(key);
		if (u != undefined) {
			var u2 = OE.Utils.clone(u, true);
			u2.mValue = p.uniforms[key];
			params.mUniforms.push(u2);
		}
	}
	
	return params;
};
OE.GameObject.deserialize = function(data) {
	var className = eval(data.className);
	var object = undefined;
	
	if (className.deserialize !== OE.GameObject.deserialize &&
		className.deserialize !== undefined)
		object = className.deserialize(data);
	else
		object = new OE.GameObject();
	
	if (data.transform) {
		var pos = data.transform.pos;
		var rot = data.transform.rot;
		var scale = data.transform.scale;
		object.setPosf(pos[0], pos[1], pos[2]);
		object.setRotf(rot[0], rot[1], rot[2], rot[3]);
	}
	return object;
};

OE.Utils.defClass(OE.GameObject, OE.Movable);
OE.Utils.implement(OE.GameObject, OE.Serializable);

// #include Rendering/Renderable.js
// #include Scene/GameObject.js

OE.Billboard = function() {
	OE.Renderable.call(this);
	OE.GameObject.call(this);
	
	this.mVertexData = new OE.VertexData();
	this.mMaterial = undefined;
	this.mColor = new OE.Color(1.0);
	this.mSize = new OE.Vector2(1.0);
	this.mUpdateBufferFlag = false;
	
	this.updateBuffer();
};

OE.Billboard.prototype = {
	mVertexData: undefined,
	mMaterial: undefined,
	mColor: undefined,
	mSize: undefined,
	mUpdateBufferFlag: false,
	
	onUpdate: function() {
		if (this.mUpdateBufferFlag) {
			this.mUpdateBufferFlag = false;
			this.updateBuffer();
		}
	},
	updateBuffer: function() {
		var gpuBuffer = new OE.GpuBuffer();
		gpuBuffer.create();
		
		var vertexData = this.mVertexData;
		vertexData.clear();
		vertexData.addAttribute(OE.VertexAttribute.POSITION);
		vertexData.addAttribute(OE.VertexAttribute.TEXCOORD);
		vertexData.addAttribute(OE.VertexAttribute.COLOR);
		vertexData.setBuffer(gpuBuffer);
		vertexData.setNumVertices(4);
		
		var vert = function(buffer, p, t, c) {
			buffer.putVec3(p);
			buffer.putVec2(t);
			buffer.putColor4f(c);
		};
		
		var pos = [
			0.0, 0.0,
			1.0, 0.0,
			0.0, 1.0,
			1.0, 1.0
		];
		
		var p = new OE.Vector3();
		var t = new OE.Vector2();
		var c = this.mColor;
		var s = this.mSize;
		
		var bufferSize = vertexData.getByteSize();
		var buffer = gpuBuffer.map(bufferSize);
		for (var i = 0; i < 4; i++) {
			var i2 = i*2;
			p.setf(	pos[i2  ] * s.x,
					pos[i2+1] * s.y,
					0.0);
			t.setf(pos[i2], pos[i2+1]);
			vert(buffer, p, t, c);
		}
		gpuBuffer.unmap();
	},
	queueRenderables: function(renderQueue) {
		renderQueue.queueRenderable(this);
	},
	getRenderOperation: function(op) {
		op.mType = OE.RenderOperation.Type.TRIANGLE_STRIP;
		op.mVertexData = this.mVertexData;
		op.mModelMatrix = this.getWorldMatrix();
		op.mMaterial = this.mMaterial;
		op.mMtlParams = this.mMtlParams;
	}
};
OE.Utils.defClass(OE.Billboard, OE.Renderable, OE.GameObject);

// #include Scene/GameObject.js

OE.Emitter = function(params) {
	OE.GameObject.call(this);
	
	this.mEmitClass = params.emitClass;
	this.mClassArgs = params.classArgs;
	
	this.mMaterial = params.material;
	
	if (params.emitsPerBurst !== undefined) this.mEmitsPerBurst = params.emitsPerBurst;
	if (params.framesPerBurst !== undefined) this.mFramesPerBurst = params.framesPerBurst;
	if (params.lifespan !== undefined) this.mLifespan = params.lifespan;
	
	if (params.radiusMin !== undefined) this.mRadiusMin = params.radiusMin;
	if (params.radiusMax !== undefined) this.mRadiusMax = params.radiusMax;
	if (params.speedMin !== undefined) this.mSpeedMin = params.speedMin;
	if (params.speedMax !== undefined) this.mSpeedMax = params.speedMax;
	
	this.mOnEmit = params.onEmit;
	
	this.mTimer = this.mFramesPerBurst - 1;
	
	this.mChildData = {};
};

OE.Emitter.prototype = {
	mEmitClass: undefined,
	mClassArgs: undefined,
	mMaterial: undefined,
	mEmitsPerBurst: 1,
	mFramesPerBurst: 5,
	mLifespan: 30,
	mRadiusMin: 0.0,
	mRadiusMax: 0.0,
	mSpeedMin: 0.0,
	mSpeedMax: 0.125,
	mOnEmit: undefined,
	
	mTimer: 0,
	
	onUpdate: function() {
		this.mTimer++;
		if (this.mTimer >= this.mFramesPerBurst) {
			this.burst();
			this.mTimer = 0;
		}
		
		for (var i=0; i<this.mChildren.length; i++) {
			var obj = this.mChildren[i];
			var data = obj.mEmitterData;
			if (data !== undefined) {
				var p = obj.getPos();
				p.addBy(data.velocity);
				obj.setPos(p);
				
				data.lifetime++;
				if (data.lifetime > this.mLifespan) {
					obj.destroy();
					i--;
				}
			}
		}
	},
	burst: function() {
		for (var i=0; i<this.mEmitsPerBurst; i++) {
			this.emit();
		}
	},
	rad2fwd: function(radx, rady, result) {
		var yinv = Math.cos(radx);
		result.setf(Math.sin(rady) * yinv,
					Math.sin(radx),
					-Math.cos(rady) * yinv);
	},
	deg2fwd: function(degx, degy, result) {
		this.rad2fwd(degx * OE.Math.DEG_TO_RAD, degy * OE.Math.DEG_TO_RAD, result);
	},
	emit: function() {
		if (this.mEmitClass !== undefined) {
			function construct(constructor, args) {
				function F() {
					return constructor.apply(this, args);
				}
				F.prototype = constructor.prototype;
				return new F();
			}
			
			var obj = construct(this.mEmitClass, this.mClassArgs);
			this.addChild(obj);
			obj.mMaterial = this.mMaterial;
			
			var pos = obj.getPos();
			var ax = Math.random() * 360.0;
			var ay = Math.random() * 180.0 - 90.0;
			var r = this.mRadiusMin + (this.mRadiusMax - this.mRadiusMin) * Math.random();
			var s = this.mSpeedMin + (this.mSpeedMax - this.mSpeedMin) * Math.random();
			
			this.deg2fwd(ax, ay, pos);
			
			var v = new OE.Vector3();
			v.set(pos);
			v.mulByf(s);
			
			pos.mulByf(r);
			obj.setPos(pos);
			
			obj.mEmitterData = {
				velocity: v,
				lifetime: 0
			};
			
			if (this.mOnEmit !== undefined)
				this.mOnEmit(obj);
		}
	},
	
	queueRenderables: function(renderQueue) {}
};
OE.Utils.defClass(OE.Emitter, OE.GameObject);

// #include Rendering/Renderable.js
// #include Scene/GameObject.js

OE.SubEntity = function(entity, mesh, material) {
	OE.Renderable.call(this);
	this.mEntity = entity;
	this.mMesh = mesh;
	this.mMaterial = material;
	this.mVertexData = new OE.VertexData();
	this.mIndexData = new OE.IndexData();
	this.updateBuffer();
};
OE.SubEntity.prototype = {
	mEntity: undefined,
	mMesh: undefined,
	mMaterial: undefined,
	mVertexData: undefined,
	mIndexData: undefined,
	
	onDestroy: function() {
		this.mMesh = undefined;
		this.mMaterial = undefined;
		if (this.mVertexData) this.mVertexData.clear();
		if (this.mIndexData) this.mIndexData.clear();
	},
	updateBuffer: function() {
		var vertexData = this.mVertexData;
		var indexData = this.mIndexData;
		vertexData.clear();
		indexData.clear();
		
		if (this.mMesh) {
			var vertexBuffer = new OE.GpuBuffer();
			vertexBuffer.create();
			vertexData.setBuffer(vertexBuffer);
			vertexData.mAttributes = this.mMesh.mVertexFormat.mAttributes;
			vertexData.mVertexSize = this.mMesh.mVertexFormat.mVertexSize;
			vertexData.setNumVertices(this.mMesh.mNumVertices);
			
			var bufferSize = vertexData.getByteSize();
			var buffer = vertexBuffer.map(bufferSize);
			for (var i = 0; i < this.mMesh.mVertexData.length; i++) {
				buffer.putFloat(this.mMesh.mVertexData[i]);
			}
			vertexBuffer.unmap();
			
			var indexBuffer = new OE.GpuBuffer(OE.GpuBuffer.Target.ELEMENT_ARRAY);
			indexBuffer.create();
			indexData.setBuffer(indexBuffer);
			indexData.setNumIndices(this.mMesh.mNumIndices);
			
			bufferSize = indexData.getByteSize();
			buffer = indexBuffer.map(bufferSize);
			for (var i = 0; i < this.mMesh.mIndexData.length; i++) {
				buffer.putUint(this.mMesh.mIndexData[i]);
			}
			indexBuffer.unmap();
		}
	},
	getRenderOperation: function(op) {
		op.mType = OE.RenderOperation.Type.TRIANGLES;
		op.mVertexData = this.mVertexData;
		op.mIndexData = this.mIndexData;
		op.mModelMatrix = this.mEntity.getWorldMatrix();
		op.mMaterial = this.mMaterial;
	}
};
OE.Utils.defClass(OE.SubEntity, OE.Renderable);

OE.Entity = function(model, material) {
	OE.GameObject.call(this);
	this.mModel = undefined;
	this.mSubEntities = [];
	
	if (typeof model === "string") model = OE.ModelManager.getLoaded(model);
	if (typeof material === "string") material = OE.MaterialManager.getLoaded(material);
	
	if (model !== undefined) {
		this.fromModel(model, material);
	}
};
OE.Entity.prototype = {
	mSubEntities: undefined,
	
	clear: function() {
		for (var i=0; i<this.mSubEntities.length; i++) {
			this.mSubEntities[i].clear();
		}
		this.mModel = undefined;
		this.mSubEntities = [];
	},
	fromModel: function(model, material) {
		this.clear();
		
		var onLoaded = function(res) {
			this.mModel = res;
			for (var i=0; i<res.mMeshes.length; i++) {
				var mesh = res.mMeshes[i];
				var mtl = res.mMtlMapping[i];
				
				if (material !== undefined) mtl = material;
				else if (mtl !== undefined) mtl = OE.MaterialManager.getLoaded(mtl);
				
				this.mSubEntities.push(new OE.SubEntity(this, mesh, mtl));
			}
		}.bind(this);
		
		OE.ModelManager.load(model.mResKey, onLoaded);
	},
	queueRenderables: function(renderQueue) {
		for (var i=0; i<this.mSubEntities.length; i++) {
			renderQueue.queueRenderable(this.mSubEntities[i]);
		}
	}
};

OE.Entity.deserialize = function(data) {
	var model = OE.ModelManager.getLoaded(data.model);
	var material = OE.MaterialManager.getLoaded(data.material);
	var object = new OE.Entity(model, material);
	
	var mtlParams = OE.GameObject.decodeMtlParams(data);
	for (var i=0; i<object.mSubEntities.length; i++) {
		var e = object.mSubEntities[i];
		e.mMtlParams = mtlParams;
	}
	return object;
};

OE.Utils.defClass(OE.Entity, OE.GameObject);

// #include Rendering/Renderable.js
// #include Scene/GameObject.js

OE.ParticleSystem = function() {
	OE.Renderable.call(this);
	OE.GameObject.call(this);
};

OE.ParticleSystem.prototype = {
	onUpdate: function() {},
	queueRenderables: function(renderQueue) {
		renderQueue.queueRenderable(this);
	},
	getRenderOperation: function(op) {
		op.mType = OE.RenderOperation.Type.TRIANGLE_STRIP;
		op.mVertexData = this.mVertexData;
		op.mModelMatrix = this.getWorldMatrix();
		op.mMaterial = this.mMaterial;
		op.mMtlParams = this.mMtlParams;
	}
};
OE.Utils.defClass(OE.ParticleSystem, OE.Renderable, OE.GameObject);

// #include Rendering/Renderable.js
// #include Scene/GameObject.js

OE.Sphere = function(radius, stacks, slices) {
	OE.Renderable.call(this);
	OE.GameObject.call(this);
	
	this.mVertexData = new OE.VertexData();
	this.mMaterial = undefined;
	this.mColor = new OE.Color(1.0);
	this.mUpdateBufferFlag = false;
	this.mBoundingBox = new OE.BoundingBox();
	
	if (stacks == undefined) stacks = 16;
	if (slices == undefined) slices = stacks*2;
	
	this.mRadius = radius == undefined ? 1.0 : radius;
	this.mStacks = stacks;
	this.mSlices = slices;
	
	var r2 = this.mRadius*2.0;
	this.mBoundingBox.surroundPoint(OE.Vector3.ZERO, r2, r2, r2);
	
	this.updateBuffer();
};

OE.Sphere.prototype = {
	mVertexData: undefined,
	mMaterial: undefined,
	mColor: undefined,
	mUpdateBufferFlag: false,
	mBoundingBox: undefined,
	
	mRadius: 1.0,
	mStacks: 16,
	mSlices: 16,
	
	setRadius: function(radius) {
		this.mRadius = radius;
		var r2 = this.mRadius*2.0;
		this.mBoundingBox.surroundPoint(OE.Vector3.ZERO, r2, r2, r2);
		this.updateBuffer();
	},
	
	onUpdate: function() {
		if (this.mUpdateBufferFlag) {
			this.mUpdateBufferFlag = false;
			this.updateBuffer();
		}
	},
	onDestroy: function() {
		if (this.mVertexData)
			this.mVertexData.clear();
		this.mUpdateBufferFlag = false;
	},
	onTransformChanged: function() {
		OE.GameObject.prototype.onTransformChanged.call(this);
		//var r2 = this.mRadius*2.0;
		//this.mBoundingBox.surroundPoint(this.getTransform().getPos(), r2, r2, r2);
	},
	updateBuffer: function() {
		var r = this.mRadius;
		var st = this.mStacks;
		var sl = this.mSlices;
		var num = st*2*(sl+2);
		
		var gpuBuffer = new OE.GpuBuffer();
		gpuBuffer.create();
		
		var vertexData = this.mVertexData;
		vertexData.clear();
		vertexData.addAttribute(OE.VertexAttribute.POSITION);
		vertexData.addAttribute(OE.VertexAttribute.NORMAL);
		vertexData.addAttribute(OE.VertexAttribute.TEXCOORD);
		vertexData.addAttribute(OE.VertexAttribute.COLOR);
		vertexData.setBuffer(gpuBuffer);
		vertexData.setNumVertices(num);
		
		var vert = function(buffer, p, n, t, c) {
			buffer.putVec3(p);
			buffer.putVec3(n);
			buffer.putVec2(t);
			buffer.putColor4f(c);
		};
		
		var n1 = new OE.Vector3(), n2 = new OE.Vector3(),
			p1 = new OE.Vector3(), p2 = new OE.Vector3();
		var t1 = new OE.Vector2(), t2 = new OE.Vector2();
		var c = this.mColor;
		
		var rad2fwd = function(radx, rady, result) {
			var yinv = Math.cos(radx);
			result.setf(Math.sin(rady) * yinv,
						Math.sin(radx),
						-Math.cos(rady) * yinv);
		}
		var deg2fwd = function(degx, degy, result) {
			rad2fwd(degx * OE.Math.DEG_TO_RAD, degy * OE.Math.DEG_TO_RAD, result);
		}
		
		var bufferSize = vertexData.getByteSize();
		var buffer = gpuBuffer.map(bufferSize);
		for (var ix = 0; ix < st; ix++)
		{
			var fx1 = ix / st;
			var fx2 = (ix+1) / st;
			var ax1 = fx1 * 180.0 - 90.0;
			var ax2 = fx2 * 180.0 - 90.0;
			for (var iy = 0; iy <= sl; iy++)
			{
				var fy = iy / sl;
				var ay = fy * 360.0;
				deg2fwd(ax1, ay, n1); n1.normalize();
				deg2fwd(ax2, ay, n2); n2.normalize();
				p1.set(n1); p1.mulByf(r);
				p2.set(n2); p2.mulByf(r);
				t1.setf(fy, fx1);
				t2.setf(fy, fx2);
				
				if (iy == 0) {
					vert(buffer, p2, n2, t2, c);
				}
				vert(buffer, p2, n2, t2, c);
				vert(buffer, p1, n1, t1, c);
			}
			vert(buffer, p1, n1, t1, c);
		}
		gpuBuffer.unmap();
	},
	queueRenderables: function(renderQueue) {
		renderQueue.queueRenderable(this);
	},
	getRenderOperation: function(op) {
		op.mType = OE.RenderOperation.Type.TRIANGLE_STRIP;
		op.mVertexData = this.mVertexData;
		op.mModelMatrix = this.getWorldMatrix();
		op.mMaterial = this.mMaterial;
		op.mMtlParams = this.mMtlParams;
	}
};

OE.Sphere.serialize = function(object) {
	return {
		radius: object.mRadius,
		segments: object.mSlices
	};
};
OE.Sphere.deserialize = function(data) {
	var object = new OE.Sphere(data.radius, data.segments);
	object.mMaterial = OE.MaterialManager.getLoaded(data.material);
	object.mMtlParams = OE.GameObject.decodeMtlParams(data);
	return object;
};

OE.Utils.defClass(OE.Sphere, OE.Renderable, OE.GameObject);

// #include Scene/GameObject.js
// #include Objects/Sphere.js

OE.PointLight = function(rad) {
	OE.Sphere.call(this, rad, 16, 24);
	
	this.mMaterial = OE.MaterialManager.getLoaded("LightVolume");
	
	this.mBillboard = new OE.Billboard();
};
OE.PointLight.prototype = {
	mBillboard: undefined,
	
};
OE.Utils.defClass(OE.PointLight, OE.Sphere);


// #include Rendering/Renderable.js
// #include Scene/GameObject.js

OE.Spline = function() {
	OE.Renderable.call(this);
	OE.GameObject.call(this);
	
	this.mVertexData = new OE.VertexData();
	this.mMaterial = undefined;
	this.mColor = new OE.Color(1.0);
	this.mUpdateBufferFlag = false;
	
	this.mPoints = new Array();
	this.updateBuffer();
};

OE.Spline.prototype = {
	mVertexData: undefined,
	mMaterial: undefined,
	mColor: undefined,
	mUpdateBufferFlag: false,
	mBoundingBox: undefined,
	
	mPoints: undefined,
	
	onUpdate: function() {
		if (this.mUpdateBufferFlag) {
			this.mUpdateBufferFlag = false;
			this.updateBuffer();
		}
	},
	onDestroy: function() {
		if (this.mVertexData)
			this.mVertexData.clear();
		this.mUpdateBufferFlag = false;
	},
	updateBuffer: function() {
		var num = this.mPoints.length;
		if (num > 1) {
			var gpuBuffer = new OE.GpuBuffer();
			gpuBuffer.create();
			
			var vertexData = this.mVertexData;
			vertexData.clear();
			vertexData.addAttribute(OE.VertexAttribute.POSITION);
			vertexData.addAttribute(OE.VertexAttribute.COLOR);
			vertexData.setBuffer(gpuBuffer);
			vertexData.setNumVertices(num);
			
			var vert = function(buffer, p, c) {
				buffer.putVec3(p);
				buffer.putColor4f(c);
			};
			
			var p = new OE.Vector3();
			var c = this.mColor;
			
			var bufferSize = vertexData.getByteSize();
			var buffer = gpuBuffer.map(bufferSize);
			for (var i = 0; i < this.mPoints.length; i++) {
				p.set(this.mPoints[i]);
				vert(buffer, p, c);
			}
			gpuBuffer.unmap();
		}
	},
	queueRenderables: function(renderQueue) {
		renderQueue.queueRenderable(this);
	},
	getRenderOperation: function(op) {
		op.mType = OE.RenderOperation.Type.LINE_STRIP;
		op.mVertexData = this.mVertexData;
		op.mModelMatrix = this.getWorldMatrix();
		op.mMaterial = this.mMaterial;
		op.mMtlParams = this.mMtlParams;
	}
};

OE.Spline.serialize = function(object) {
}
OE.Spline.deserialize = function(data) {
}

OE.Utils.defClass(OE.Spline, OE.Renderable, OE.GameObject);

// #include Rendering/Renderable.js
// #include Scene/GameObject.js

OE.Sprite = function() {
	OE.Renderable.call(this);
	OE.GameObject.call(this);
	
	this.mVertexData = new OE.VertexData();
	this.mMaterial = undefined;
	this.mColor = new OE.Color(1.0);
	this.mAnchor = new OE.Vector2(0.5),
	this.mSize = new OE.Vector2(1.0);
	this.mUpdateBufferFlag = false;
	
	this.updateBuffer();
};

OE.Sprite.prototype = {
	mVertexData: undefined,
	mMaterial: undefined,
	mColor: undefined,
	mAnchor: undefined,
	mSize: undefined,
	mUpdateBufferFlag: false,
	
	onUpdate: function() {
		if (this.mUpdateBufferFlag) {
			this.mUpdateBufferFlag = false;
			this.updateBuffer();
		}
	},
	updateBuffer: function() {
		var gpuBuffer = new OE.GpuBuffer();
		gpuBuffer.create();
		
		var vertexData = this.mVertexData;
		vertexData.clear();
		vertexData.addAttribute(OE.VertexAttribute.POSITION);
		vertexData.addAttribute(OE.VertexAttribute.TEXCOORD);
		vertexData.addAttribute(OE.VertexAttribute.COLOR);
		vertexData.setBuffer(gpuBuffer);
		vertexData.setNumVertices(4);
		
		var vert = function(buffer, p, t, c) {
			buffer.putVec3(p);
			buffer.putVec2(t);
			buffer.putColor4f(c);
		};
		
		var bufferSize = vertexData.getByteSize();
		
		var pos = [
			0.0, 0.0,
			1.0, 0.0,
			0.0, 1.0,
			1.0, 1.0
		];
		
		var p = new OE.Vector3();
		var t = new OE.Vector2();
		var c = this.mColor;
		var a = this.mAnchor;
		var s = this.mSize;
		
		var buffer = gpuBuffer.map(bufferSize);
		for (var i = 0; i < 4; i++)
		{
			var i2 = i*2;
			p.setf(	(pos[i2  ]-a.x) * s.x,
					(pos[i2+1]-a.y) * s.y,
					0.0);
			t.setf(pos[i2], pos[i2+1]);
			
			vert(buffer, p, t, c);
		}
		gpuBuffer.unmap();
	},
	queueRenderables: function(renderQueue) {
		renderQueue.queueRenderable(this);
	},
	getRenderOperation: function(op) {
		op.mType = OE.RenderOperation.Type.TRIANGLE_STRIP;
		op.mVertexData = this.mVertexData;
		op.mModelMatrix = this.getWorldMatrix();
		op.mMaterial = this.mMaterial;
		op.mMtlParams = this.mMtlParams;
	}
};
OE.Utils.defClass(OE.Sprite, OE.Renderable, OE.GameObject);

// #include Rendering/Renderable.js
// #include Scene/GameObject.js

OE.TerrainPatch = function(width, height, xSegs, ySegs) {
	OE.Renderable.call(this);
	OE.GameObject.call(this);
	
	this.mVertexData = new OE.VertexData();
	this.mMaterial = undefined;
	this.mUpdateBufferFlag = false;
	this.mBoundingBox = new OE.BoundingBox();
	
	this.mHeightmap = [];
	this.mNormals = [];
	
	this.mWidth = width;
	this.mHeight = height;
	this.mSizeX = xSegs != undefined ? xSegs : 255;
	this.mSizeY = ySegs != undefined ? ySegs : this.mSizeX;
	this.mSizeX++; this.mSizeY++;
	this.mSize = this.mSizeX * this.mSizeY;
	
	for (var i = 0; i < this.mSize; i++) {
		this.mHeightmap.push(0);
		this.mNormals.push(new OE.Vector3(0.0, 1.0, 0.0));
	}
	
	this.mBoundingBox.surroundPoint(OE.Vector3.ZERO, this.mWidth, 50.0, this.mHeight);
	
	this.updateBuffer();
};
OE.TerrainPatch.prototype = {
	mVertexData: undefined,
	mMaterial: undefined,
	mUpdateBufferFlag: false,
	mBoundingBox: undefined,
	
	mHeightmap: undefined,
	mNormals: undefined,
	mWidth: 128.0,
	mHeight: 128.0,
	mMinHeight: 0.0,
	mMaxHeight: 0.0,
	mSizeX: 256,
	mSizeY: 256,
	mSize: 256*256,
	
	onUpdate: function() {
		if (this.mUpdateBufferFlag) {
			this.mUpdateBufferFlag = false;
			this.updateBuffer();
		}
	},
	onTransformChanged: function() {
		OE.GameObject.prototype.onTransformChanged.call(this);
		this.mBoundingBox.surroundPoint(OE.Vector3.ZERO, this.mWidth, 0.0, this.mHeight);
		this.mBoundingBox.p1.y += this.mMinHeight;
		this.mBoundingBox.p2.y += this.mMaxHeight;
	},
	getHeight: function(x, y) {
		var i = this.mSizeX*y+x;
		return this.mHeightmap[i];
	},
	setHeight: function(x, y, height) {
		this.mHeightmap[this.mSizeX*y+x] = height;
	},
	getHeightInterp: function(px, py) {
		px = (px / this.mWidth) * (this.mSizeX-1);
		py = (py / this.mHeight) * (this.mSizeY-1);
		var x = Math.floor(px);
		var y = Math.floor(py);
		var h1 = this.getHeight(x,   y);
		var h2 = this.getHeight(x+1, y);
		var h3 = this.getHeight(x,   y+1);
		var h4 = this.getHeight(x+1, y+1);
		px = OE.Math.fract(px);
		py = OE.Math.fract(py);
		var height = OE.Math.interpN(2, OE.Math.linInterp, [[h1, h2], [h3, h4]], [px, py]);
		return height;
	},
	getNormal: function(x, y) {
		var i = this.mSizeX*y+x;
		return this.mNormals[i];
	},
	setNormal: function(x, y, normal) {
		this.mNormals[this.mSizeX*y+x] = normal;
	},
	getNormalInterp: function(px, py) {
		px = (px / this.mWidth) * (this.mSizeX-1);
		py = (py / this.mHeight) * (this.mSizeY-1);
		var x = Math.floor(px);
		var y = Math.floor(py);
		return this.getNormal(x, y);
	},
	setHeightmap: function(heightFunc, callback) {
		var thread = {
			patch: this,
			x: 0, y: 0, index: 0,
			interval: undefined,
			heightFunc: heightFunc,
			start: function() {
				this.patch.mMinHeight = this.patch.mMinHeight = 0.0;
				this.updateBBox();
				
				this.interval = setInterval(
					this.updateHeights.bind(this),
					Math.random()*10+20);
			},
			updateHeights: function() {
				for (var i=0; i<100; i++) {
					var height = this.heightFunc(this.x, this.y);
					this.patch.setHeight(this.x, this.y, height);
					if (height < this.patch.mMinHeight) this.patch.mMinHeight = height;
					if (height > this.patch.mMaxHeight) this.patch.mMaxHeight = height;
					
					this.index++;
					this.x++;
					if (this.x == this.patch.mSizeX+1) {
						this.x = 0;
						this.y++;
						if (this.y == this.patch.mSizeY+1) {
							clearInterval(this.interval);
							this.updateBBox();
							this.updateNormals();
							this.patch.mUpdateBufferFlag = true;
							callback();
							break;
						}
					}
					//if (this.index % Math.round(this.patch.mSize/5) == 0) {
					//	this.patch.mUpdateBufferFlag = true;
					//}
				}
			},
			updateBBox: function() {
				this.patch.mBoundingBox.surroundPoint(OE.Vector3.ZERO, this.patch.mWidth, 0.0, this.patch.mHeight);
				this.patch.mBoundingBox.p1.y += this.patch.mMinHeight;
				this.patch.mBoundingBox.p2.y += this.patch.mMaxHeight;
			},
			updateNormals: function() {
				var p = this.patch;
				var h1, h2, h3,
					fx, fy, px, py,
					n1, n2, n3, n4, n;
				var dx = p.mWidth / (p.mSizeX-1);
				var dy = p.mHeight / (p.mSizeY-1);
				
				n1 = new OE.Vector3();
				n2 = new OE.Vector3();
				n3 = new OE.Vector3();
				n4 = new OE.Vector3();
				n = new OE.Vector3();
				
				for (var y=0; y<p.mSizeY; y++) {
					var fy = y / (p.mSizeY-1);
					py = (fy-0.5)*p.mHeight;
					for (var x=0; x<p.mSizeX; x++) {
						var fx = x / (p.mSizeX-1);
						px = (fx-0.5)*p.mWidth;
						var i = p.mSizeX*y+x;
						
						h1 = h2 = h3 = p.getHeight(x, y);
						if (x > 0) h1 = p.getHeight(x-1, y);
						if (x+1 < p.mSizeX) h3 = p.getHeight(x+1, y);
						
						n1.setf(-(h2 - h1), dx, 0.0);
						n2.setf((h2 - h3), dx, 0.0);
						
						h1 = h2 = h3 = p.getHeight(x, y);
						if (y > 0) h1 = p.getHeight(x, y-1);
						if (y+1 < p.mSizeY) h3 = p.getHeight(x, y+1);
						
						n3.setf(0.0, dy, -(h2 - h1));
						n4.setf(0.0, dy, (h2 - h3));
						
						n.set(n1); n.addBy(n2);
						n.addBy(n3); n.addBy(n4);
						n.normalize();
						
						p.mNormals[i].set(n);
					}
				}
			}
		};
		thread.start();
	},
	updateBuffer: function() {
		var w = this.mWidth;
		var h = this.mHeight;
		var xsegs = this.mSizeX-1;
		var ysegs = this.mSizeY-1;
		var num = ysegs + ysegs*(xsegs+1)*2 + ysegs;
		
		var gpuBuffer = new OE.GpuBuffer();
		gpuBuffer.create();
		
		var vertexData = this.mVertexData;
		vertexData.clear();
		vertexData.addAttribute(OE.VertexAttribute.POSITION);
		vertexData.addAttribute(OE.VertexAttribute.NORMAL);
		vertexData.addAttribute(OE.VertexAttribute.TEXCOORD);
		vertexData.addAttribute(OE.VertexAttribute.COLOR);
		vertexData.setBuffer(gpuBuffer);
		vertexData.setNumVertices(num);
		
		var vert = function(buffer, p, n, t) {
			buffer.putVec3(p);
			buffer.putVec3(n);
			buffer.putVec2(t);
			buffer.putColor4f(OE.Color.WHITE);
		};
		
		var bufferSize = vertexData.getByteSize();
		
		var p1 = new OE.Vector3(), p2 = new OE.Vector3(),
			n1 = new OE.Vector3(), n2 = new OE.Vector3();
		var t1 = new OE.Vector2(), t2 = new OE.Vector2();
		
		var buffer = gpuBuffer.map(bufferSize);
		for (var iy = 0; iy < ysegs; iy++)
		{
			var fy1 = iy / ysegs;
			var fy2 = (iy+1) / ysegs;
			for (var ix = 0; ix <= xsegs; ix++)
			{
				var fx = ix / xsegs;
				var i1 = this.mSizeX*iy+ix;
				var i2 = this.mSizeX*(iy+1)+ix;
				p1.setf((fx-0.5)*w, this.mHeightmap[i1], (fy1-0.5)*h);
				p2.setf((fx-0.5)*w, this.mHeightmap[i2], (fy2-0.5)*h);
				n1.set(this.mNormals[i1]);
				n2.set(this.mNormals[i2]);
				t1.setf(fx, fy1);
				t2.setf(fx, fy2);
				
				if (ix == 0) {
					vert(buffer, p2, n2, t2);
				}
				vert(buffer, p2, n2, t2);
				vert(buffer, p1, n1, t1);
			}
			vert(buffer, p1, n1, t1);
		}
		gpuBuffer.unmap();
	},
	queueRenderables: function(renderQueue) {
		renderQueue.queueRenderable(this);
	},
	getRenderOperation: function(op) {
		op.mType = OE.RenderOperation.Type.TRIANGLE_STRIP;
		op.mVertexData = this.mVertexData;
		op.mModelMatrix = this.getWorldMatrix();
		op.mMaterial = this.mMaterial;
	}
};
OE.Utils.defClass(OE.TerrainPatch, OE.Renderable, OE.GameObject);

OE.Camera = function(scene) {
	OE.GameObject.call(this);
	this.mParentScene = scene;
	this.mFrustum = new OE.Frustum();
	this.mLocalFrustum = new OE.Frustum();
	this.mProjectionMatrix = mat4.create();
	this.mViewMatrix = mat4.create();
	mat4.identity(this.mProjectionMatrix);
	mat4.identity(this.mViewMatrix);
};

OE.Camera.prototype = {
	mParentScene: undefined,
	mFrustum: undefined,
	mLocalFrustum: undefined,
	mProjectionMatrix: undefined,
	mViewMatrix: undefined,
	
	setPerspective: function(	fieldOfView, aspectRatio,
								nearClipPlane, farClipPlane) {
		mat4.perspective(fieldOfView, aspectRatio,
						nearClipPlane, farClipPlane,
						this.mProjectionMatrix);
		
		var tan = Math.tan(fieldOfView * 0.5 * OE.Math.DEG_TO_RAD);
		var nh = nearClipPlane * tan;
		var fh = farClipPlane * tan;
		var nw = nh * aspectRatio;
		var fw = fh * aspectRatio;
		
		var nz = -nearClipPlane;
		var fz = -farClipPlane;
		var nxoff = nw; var nyoff = nh;
		var fxoff = fw; var fyoff = fh;
		
		var p = this.mLocalFrustum.mPoints;
		p[0].setf(-nxoff, -nyoff, nz);
		p[1].setf( nxoff, -nyoff, nz);
		p[2].setf(-nxoff,  nyoff, nz);
		p[3].setf( nxoff,  nyoff, nz);
		p[4].setf(-fxoff, -fyoff, fz);
		p[5].setf( fxoff, -fyoff, fz);
		p[6].setf(-fxoff,  fyoff, fz);
		p[7].setf( fxoff,  fyoff, fz);
		this.mLocalFrustum.calcPlanes();
		
		this.updateWorldFrustum();
	},
	setOrtho: function(left, right, bottom, top, near, far) {
		mat4.ortho(left, right, bottom, top, near, far, this.mProjectionMatrix);
		this.updateWorldFrustum();
	},
	
	updateWorldFrustum: function() {
		var localPlanes = this.mLocalFrustum.mPlanes;
		var planes = this.mFrustum.mPlanes;
		
		var pos = this.getTransform().getPos();
		var rot = this.getTransform().getRot();
		
		for (var i=0; i<6; i++) {
			var plane = planes[i];
			var localPlane = localPlanes[i];
			plane.set(localPlane.mPoint, localPlane.mNormal);
			rot.mulvBy(plane.mPoint);
			plane.mPoint.addBy(pos);
			rot.mulvBy(plane.mNormal);
		}
	},
	
	mMLookX: 0.0, mMLookY: 0.0,
	mouseLook: function(dx, dy, sensitivity, lockY) {
		if (sensitivity === undefined) sensitivity = 0.25;
		if (lockY === undefined) lockY = false;
		
		this.mMLookX += dy * sensitivity;
		this.mMLookY += dx * sensitivity;
		
		if (lockY) {
			// TODO: Do something
		}
		else {
			var rot = this.getRot();
			OE.Quaternion._aux.fromAxisAngle(OE.Vector3.RIGHT, this.mMLookX);
			rot.fromAxisAngle(OE.Vector3.UP, this.mMLookY);
			rot.mulBy(OE.Quaternion._aux);
			this.setRot(rot);
		}
	},
	
	onTransformChanged: function() {
		OE.GameObject.prototype.onTransformChanged.call(this);
		mat4.inverse(this.getWorldMatrix(), this.mViewMatrix);
		this.updateWorldFrustum();
	},
	
	getProjectionMatrix: function() {
		return this.mProjectionMatrix;
	},
	getViewMatrix: function() {
		return this.mViewMatrix;
	}
};
OE.Utils.defClass(OE.Camera, OE.GameObject);

OE.ForceCamera = function(scene) {
	OE.Camera.call(this, scene);
	
	this.mVelocity = new OE.Vector3(0.0);
	this.mRotVel = new OE.Quaternion();
	this.mMLookA = new OE.Quaternion();
};

OE.ForceCamera.prototype = {
	mVelocity: undefined,
	mRotVel: undefined,
	mFriction: 0.875,
	mRotFriction: 0.625,
	
	onCreate: function() {
		
	},
	
	accel: function(accel, local) {
		if (local) {
			var rot = this.getRot();
			rot.mulvBy(accel);
		}
		this.mVelocity.addBy(accel);
	},
	rotAccel: function(accel, local) {
		/*if (local) {
			var rot = this.getRot();
			rot.mulBy(accel);
		}*/
		this.mRotVel.mulBy(accel);
	},
	
	nullQuat: new OE.Quaternion(),
	
	onUpdate: function() {
		var pos = this.getPos();
		pos.addBy(this.mVelocity);
		this.mVelocity.mulByf(this.mFriction);
		this.setPos(pos);
		
		var rot = this.getRot();
		rot.mulBy(this.mRotVel);
		this.mRotVel.lerp(this.nullQuat, 1.0-this.mRotFriction);
		this.setRot(rot);
	},
	
	mMLookA: undefined,
	mouseLook: function(dx, dy, sensitivity, lockY) {
		if (sensitivity === undefined) sensitivity = 0.1;
		if (lockY === undefined) lockY = false;
		
		this.mMLookX = dy * sensitivity;
		this.mMLookY = dx * sensitivity;
		
		if (lockY) {
			// TODO: Do something
		}
		else {
			OE.Quaternion._aux.fromAxisAngle(OE.Vector3.RIGHT, this.mMLookX);
			this.mMLookA.fromAxisAngle(OE.Vector3.UP, this.mMLookY);
			this.mMLookA.mulBy(OE.Quaternion._aux);
			this.rotAccel(this.mMLookA);
		}
	}
};
OE.Utils.defClass(OE.ForceCamera, OE.Camera);

OE.Scene = function() {
	this.mRoot = new OE.GameObject();
	this.mRoot.setScene(this);
};

OE.Scene.prototype = {
	mRenderSystem: undefined,
	mRenderQueue: undefined,
	mRoot: undefined,
	
	setRenderSystem: function(rs) {
		this.mRenderSystem = rs;
		this.mRenderQueue = rs.mRenderQueue;
	},
	
	addObject: function(object) {
		return this.mRoot.addChild(object);
	},
	auxBbox: undefined,
	objectVisible: function(object, camera) {
		var bbox = object.mBoundingBox;
		if (bbox) {
			if (this.auxBbox === undefined) this.auxBbox = new OE.BoundingBox();
			var pos = object.mWorldTransform.mPosition;
			this.auxBbox.p1.setf(
				pos.x + bbox.p1.x,
				pos.y + bbox.p1.y,
				pos.z + bbox.p1.z);
			this.auxBbox.p2.setf(
				pos.x + bbox.p2.x,
				pos.y + bbox.p2.y,
				pos.z + bbox.p2.z);
			object.mCulledLastFrame = camera.mFrustum.containsBox(this.auxBbox);
		}
		else {
			object.mCulledLastFrame = true;
		}
		return object.mCulledLastFrame;
	},
	queueObject: function(object, rq, camera) {
		if (object.mActive) {
			object.queueRenderables(rq);
			for (var i=0; i<object.mChildren.length; i++) {
				if (this.objectVisible(object.mChildren[i], camera)) {
					this.queueObject(object.mChildren[i], rq, camera);
				}
			}
		}
	},
	renderViewport: function(viewport, camera) {
		this.mRenderQueue.clearRenderables();
		this.queueObject(this.mRoot, this.mRenderQueue, camera);
		
		this.mRenderSystem.startFrame();
		
		if (viewport.mCompositor !== undefined) {
			viewport.mCompositor.renderScene(this, viewport, camera);
		}
		else {
			this.mRenderSystem.activateViewport(viewport);
			this.mRenderQueue.renderAll();
		}
	},
	update: function() {
		this.mRoot.update();
	}
};
OE.Utils.defClass(OE.Scene);

OE.TerrainScene = function() {
	OE.Scene.call(this);
};

OE.TerrainScene.prototype = {
	mChunks: undefined,
	mNumChunks: 5,
	mChunkSegs: 127,
	mChunkSize: 500.0,
	mTerrainHeight: 100.0,
	mMainChunk: undefined,
	mPlayerObject: undefined,
	mSceneX: 0,
	mSceneY: 0,
	
	init: function() {
		this.mChunks = [];
		var centerOffset = Math.floor((this.mNumChunks-1)/2);
		for (var y=0; y<this.mNumChunks; y++) {
			for (var x=0; x<this.mNumChunks; x++) {
				var i = this.mNumChunks*y+x;
				var offx = (x - centerOffset);
				var offy = (y - centerOffset);
				var terrain = this.mChunks[i] = new OE.TerrainPatch(
					this.mChunkSize, this.mChunkSize,
					this.mChunkSegs, this.mChunkSegs);
				terrain.setPosf(
					offx*this.mChunkSize, 0.0,
					offy*this.mChunkSize);
				this.mRoot.addChild(terrain);
			}
		}
		var size = this.mNumChunks * this.mNumChunks;
		this.mMainChunk = this.mChunks[Math.floor(size/2)];
	},
	addObject: function(object) {
		var chunk = this.getChunkForPoint(object.getPos());
		return chunk.addChild(object);
	},
	setPlayerObject: function(object) {
		this.mPlayerObject = object;
		return this.mRoot.addChild(this.mPlayerObject);
	},
	onObjectMoved: function(object) {
		var chunk = this.getChunkForPoint(object.getPos());
		if (object.mParent != chunk) {
			chunk.addChild(object);
		}
	},
	setHeightmap: function(heightFunc) {
		this.mHeightFunc = heightFunc;
		var centerOffset = Math.floor((this.mNumChunks-1)/2);
		for (var y=0; y<this.mNumChunks; y++) {
			for (var x=0; x<this.mNumChunks; x++) {
				this.updateHeightmap(x, y);
			}
		}
	},
	updateHeightmap: function(x, y) {
		var centerOffset = Math.floor((this.mNumChunks-1)/2);
		var i = this.mNumChunks*y+x;
		var terrain = this.mChunks[i];
		var offx = (x - centerOffset) + this.mSceneX;
		var offy = (y - centerOffset) + this.mSceneY;
		var data = {
			scene: this,
			terrain: terrain,
			chunkIndex: {x: x, y: y},
			chunkWorldOffset: {x: offx, y: offy},
			heightmapIndex: {x: 0, y: 0}
		};
		data.terrain.mActive = false;
		terrain.setHeightmap(
			function(ix, iy) {
				this.heightmapIndex.x = ix;
				this.heightmapIndex.y = iy;
				return this.scene.mHeightFunc(this);
			}.bind(data),
			function() {
				data.terrain.mActive = true;
			}.bind(data)
		);
	},
	getHeight: function(pos) {
		var chunk = this.getChunkForPoint(pos);
		if (chunk) {
			var cp = chunk.getPos();
			var cx = cp.x - this.mChunkSize/2.0;
			var cz = cp.z - this.mChunkSize/2.0;
			var px = (pos.x - cx);
			var pz = (pos.z - cz);
			return chunk.getHeightInterp(px, pz);
		}
		return 0.0;
	},
	getNormal: function(pos) {
		var chunk = this.getChunkForPoint(pos);
		if (chunk) {
			var cp = chunk.getPos();
			var cx = cp.x - this.mChunkSize/2.0;
			var cz = cp.z - this.mChunkSize/2.0;
			var px = (pos.x - cx);
			var pz = (pos.z - cz);
			return chunk.getNormalInterp(px, pz);
		}
		return OE.Vector3.UP;
	},
	shiftChunks: function(x_offset, y_offset) {
		var n = this.mNumChunks * this.mNumChunks;
		var objects = new Array(n);
		var new_index = new Array(n);
		var needs_update = new Array(n);
		var centerOffset = Math.floor((this.mNumChunks-1)/2);
		
		console.log("Shift("+x_offset+", "+y_offset+")");
		
		for (var y=0; y<this.mNumChunks; y++) {
			for (var x=0; x<this.mNumChunks; x++) {
				var x2 = OE.Math.mod(x-x_offset, this.mNumChunks);
				var y2 = OE.Math.mod(y-y_offset, this.mNumChunks);
				var i = this.mNumChunks*y+x;
				var i2 = this.mNumChunks*y2+x2;
				objects[i] = this.mChunks[i];
				new_index[i] = [x2, y2, i2];
				needs_update[i] = (	x2 !== x-x_offset ||
									y2 !== y-y_offset);
				
				if (needs_update[i]) {
					console.log("Update Terrain ("+x2+", "+y2+") (was "+x+", "+y+")");
					
				}
			}
		}
		var size = this.mNumChunks * this.mNumChunks;
		for (var i=0; i<size; i++) {
			var offx = new_index[i][0];
			var offy = new_index[i][1];
			var i2 = new_index[i][2];
			var c = objects[i];
			this.mChunks[i2] = c;
			
			c.setPosf(	(offx - centerOffset)*this.mChunkSize, 0.0,
						(offy - centerOffset)*this.mChunkSize);
			
			if (needs_update[i])
				this.updateHeightmap(offx, offy);
		}
		this.mMainChunk = this.mChunks[Math.floor(size/2)];
	},
	getChunkForPoint: function(point) {
		var corner = -this.mChunkSize * this.mNumChunks / 2.0;
		var fx = (point.x - corner) / this.mChunkSize;
		var fz = (point.z - corner) / this.mChunkSize;
		var x = Math.floor(fx);
		var y = Math.floor(fz);
		var i = this.mNumChunks*y+x;
		return this.mChunks[i];
	},
	update: function() {
		OE.Scene.prototype.update.call(this);
		
		if (this.mPlayerObject) {
			var b = (this.mChunkSize / 2.0) * 1.125;
			var pos = this.mPlayerObject.getPos();
			var offx = 0;
			var offy = 0;
				 if (pos.x < -b) offx = -1;
			else if (pos.x > b)  offx = 1;
				 if (pos.z < -b) offy = -1;
			else if (pos.z > b)  offy = 1;
			
			if (offx != 0 || offy != 0) {
				this.mSceneX += offx;
				this.mSceneY += offy;
				this.shiftChunks(offx, offy);
				pos.x -= this.mChunkSize * offx;
				pos.z -= this.mChunkSize * offy;
				this.mPlayerObject.setPos(pos);
			}
		}
	}
};
OE.Utils.defClass(OE.TerrainScene, OE.Scene);

OE.Viewport = function(renderTarget, camera) {
	this.mRenderTarget = renderTarget;
	this.mCamera = camera;
	this.mExtents = {
		left: 0.0, top: 0.0,
		right: 1.0, bottom: 1.0,
	};
};

OE.Viewport.prototype = {
	mRenderTarget: undefined,
	mCamera: undefined,
	mResetColor: true,
	mResetDepth: true,
	mCompositor: undefined,
	mExtents: undefined,
	mChanged: false,
	
	setExtents: function(left, top, right, bottom) {
		this.mExtents.left = left;
		this.mExtents.top = top;
		this.mExtents.right = right;
		this.mExtents.bottom = bottom;
	},
	getScreenRect: function() {
		var w = this.mRenderTarget.getWidth();
		var h = this.mRenderTarget.getHeight();
		var x = this.mExtents.left * w;
		var y = this.mExtents.top * h;
		w *= (this.mExtents.right - this.mExtents.left);
		h *= (this.mExtents.bottom - this.mExtents.top);
		
		return {x: x, y: y, width: w, height: h};
	}
};
OE.Utils.defClass(OE.Viewport);