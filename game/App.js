
var App = function() {
	OE.BaseApp3D.call(this);
};
App.prototype = {
	STATE_LOGIN: undefined,
	STATE_LOBBY: undefined,
	STATE_WORLD: undefined,
	gameState: undefined,
	player: undefined,
	
	switchStates: function(state) {
		if (this.gameState)
			this.gameState.exitState();
		
		this.gameState = state;
		
		if (this.gameState)
			this.gameState.initState();
	},
	inState: function(state) {
		return this.gameState == state;
	},
	
	onRun: function() {
		this.STATE_LOGIN = new LoginState();
		this.STATE_LOBBY = new LobbyState();
		this.STATE_WORLD = new WorldState();
		
		var container = document.getElementById("appFrame");
		var rs = this.mRenderSystem = new OE.RenderSystem();
		var rt = this.mSurface = rs.createRenderSurface(container);
		// rt.mContext = OE.WebGLSurface.makeDebugContext(rt.mContext);
		
		this.mScene = new OE.TerrainScene();
		this.mScene.setRenderSystem(rs);
		this.mCamera = new OE.Camera(this.mScene);
		this.mViewport = rt.createViewport(this.mCamera);
		
		declareResources(function() {
			preloadResources("textures", function() {
				preloadResources("shaders", function() {
					preloadResources("materials", function() {
						preloadResources("models", function() {
							app.connect();
						});
					});
				});
			});
		});
	},
	initScene: function() {
		this.mScene.mChunkSize = 750.0;
		this.mScene.mChunkSegs = 25;
		this.mScene.mTerrainHeight = 800.0;
		
		this.mClipFar = 1600.0;
		
		this.resize(this.mSurface.mCanvas.clientWidth,
					this.mSurface.mCanvas.clientHeight);
		
		var weather = this.mCamera.addChild(new WeatherSystem(1450.0));
		
		this.mScene.init();
		this.mScene.setHeightmap(function(data) {
			var fy = data.heightmapIndex.y / (data.terrain.mSizeX-1);
			var fx = data.heightmapIndex.x / (data.terrain.mSizeY-1);
			var world_x = (fx + data.chunkWorldOffset.x) * data.scene.mChunkSize;
			var world_y = (fy + data.chunkWorldOffset.y) * data.scene.mChunkSize;
			var x = world_x;
			var y = world_y;
			var freq = 1.0 / 3000.0;
			var noise = OE.Noise.ridgedNoise2([x, y], 10, freq, 0.45);
			noise = OE.Math.atanBias(noise*0.9-0.1, 4.0);
			return (noise * 0.5 + 0.5) * data.scene.mTerrainHeight;
		});
		/* 4D NOISE, 2D WRAPPING
		this.mScene.setHeightmap(function(data) {
			var fy = data.heightmapIndex.y / (data.terrain.mSizeX-1);
			var fx = data.heightmapIndex.x / (data.terrain.mSizeY-1);
			var fx2 = (fx + data.chunkWorldOffset.x) / data.scene.mNumChunks;
			var fy2 = (fy + data.chunkWorldOffset.y) / data.scene.mNumChunks;
			var fx2pi = fx2*OE.Math.TWO_PI;
			var fy2pi = fy2*OE.Math.TWO_PI;
			var x = Math.sin(fx2pi)*0.5+1.0;
			var y = Math.cos(fx2pi)*0.5+1.0;
			var z = Math.sin(fy2pi)*0.5+1.0;
			var w = Math.cos(fy2pi)*0.5+1.0;
			var noise = OE.Noise.ridgedNoise4([x, y, z, w], 10, 0.5, 0.5);
			noise = OE.Math.atanBias(noise*0.9-0.1, 4.0);
			return (noise * 0.5 + 0.5) * data.scene.mTerrainHeight;
		});*/
		
		var mtls = [OE.MaterialManager.getLoaded("Terrain")];
		for (var i=0; i<this.mScene.mChunks.length; i++) {
			var mtl = mtls[Math.floor(Math.random()*mtls.length)];
			this.mScene.mChunks[i].mMaterial = mtl;
		}
		
		this.player = this.mScene.setPlayerObject(new Actor());
		this.player.addChild(this.mCamera);
		this.mCamera.setPosf(0.0, 0.0, 30.0);
		
		OE.Utils.loadJSON("data/Scenes/TestScene.json", function(json) {
			var objects = json.scene.objects;
			for (var i=0; i<objects.length; i++) {
				var obj = OE.GameObject.deserialize(objects[i]);
				if (obj !== undefined)
					this.mScene.addObject(obj);
			}
		}.bind(this));
	},
	exitScene: function() {
		this.player.removeChild(this.mCamera);
		this.player = undefined;
		this.mScene.mPlayerObject = undefined;
		this.mScene.mRoot.destroyAll();
		this.mCamera.setPosf(0.0, 0.0, 0.0);
	},
	onFinish: function() {
		this.switchStates(undefined);
		this.disconnect();
	},
	
	onResize: function(width, height) {},
	
	mapPlayerKey: function(k) {
		switch (k) {
			case 65: return 0;
			case 68: return 1;
			case 70: return 2;
			case 82: return 3;
			case 87: return 4;
			case 83: return 5;
			case 32: return 6;
			case 16: return 7;
		}
		return undefined;
	},
	onKeyDown: function(k) {
		if (this.inState(this.STATE_WORLD)) {
			var pk = this.mapPlayerKey(k);
			if (pk !== undefined)
				this.player.inputEvent(0, pk);
				this.socket.emit("postInputEvent", {event: 0, code: pk});
		}
	},
	onKeyUp: function(k) {
		if (this.inState(this.STATE_WORLD)) {
			var pk = this.mapPlayerKey(k);
			if (pk !== undefined)
				this.player.inputEvent(1, pk);
				this.socket.emit("postInputEvent", {event: 1, code: pk});
		}
	},
	
	onMouseWheel: function(delta) {
		delta = OE.Math.clamp(delta, -1.0, 1.0);
		var pos = this.mCamera.getPos();
		pos.z -= delta * 2.0;
		this.mCamera.setPos(pos);
	},
	
	xprev: 0, yprev: 0,
	anglex: -25.0, angley: 0.0,
	rotx: new OE.Quaternion(), roty: new OE.Quaternion(),
	onMouseDown: function(x, y, k) {
		this.xprev = x;
		this.yprev = y;
	},
	onMouseMove: function(x, y) {
		if (this.player) {
			if (this.mMouseDown[0]) {
				var dx = x - this.xprev;
				var dy = y - this.yprev;
				this.xprev = x;
				this.yprev = y;
				this.angley += -dx * 0.25;
				this.anglex += -dy * 0.25;
				
				var rot = this.player.getRot();
				this.rotx.fromAxisAngle(OE.Vector3.RIGHT, this.anglex);
				this.roty.fromAxisAngle(OE.Vector3.UP, this.angley);
				rot.set(this.roty);
				rot.mulBy(this.rotx);
				this.player.setRot(rot);
			}
		}
	},
	onMouseUp: function(x, y, k) {},
	
	onUpdate: function() {},
	
	onFrameRendered: function() {},
	
	connect: function() {
		this.socket = io.connect("http://"+gConfig.serverHost, {port: gConfig.serverPort});
		var socket = this.socket;
		
		socket.on("connect", function() {
			this.switchStates(this.STATE_LOGIN);
		}.bind(this));
	},
	disconnect: function() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = undefined;
		}
	}
};
OE.Utils.extend(App, OE.BaseApp3D);
App.prototype.constructor = App;
