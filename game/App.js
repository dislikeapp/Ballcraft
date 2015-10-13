
var App = function() {
	OE.BaseApp3D.call(this);
};
App.prototype = {
	STATE_LOGIN: undefined,
	STATE_LOBBY: undefined,
	STATE_WORLD: undefined,
	gameState: undefined,
	player: undefined,
	camNode: undefined,
	
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
		this.mCamera = new OE.ForceCamera(this.mScene);
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
		//this.mScene.mChunkSize = 750.0;
		//this.mScene.mChunkSegs = 25;
		//this.mScene.mTerrainHeight = 800.0;
		this.mScene.mChunkSize = 450.0;//750.0;
		this.mScene.mChunkSegs = 32;//35;
		this.mScene.mTerrainHeight = 800.0;
		this.mScene.mNumChunks = 7;
		
		this.mCamera.setNearPlane(0.5);
		this.mCamera.setFarPlane(1700.0);
		
		this.resize(this.mSurface.mCanvas.clientWidth,
					this.mSurface.mCanvas.clientHeight);
		
		var weather = this.mCamera.addChild(new WeatherSystem(1650.0));
		weather.mBoundingBox = undefined;
		
		function terrace(value, interval, slope) {
			var virtual = (value / interval);
			var fract = OE.Math.fract(virtual);
			virtual -= fract;
			var dist_from_endpoint = fract;//Math.abs(fract*2.0-1.0);
			var bias = OE.Math.atanBias(fract, dist_from_endpoint*slope);
			return (virtual+bias)*interval;
		}
		
		this.mScene.init();
		this.mScene.setHeightmap(function(data) {
			var fx = data.heightmapIndex.x / (data.terrain.mSizeX-1);
			var fy = data.heightmapIndex.y / (data.terrain.mSizeY-1);
			var world_x = (fx + data.chunkWorldOffset.x) * data.scene.mChunkSize;
			var world_y = (fy + data.chunkWorldOffset.y) * data.scene.mChunkSize;
			var x = world_x;
			var y = world_y;
			
			var result = 0.0;
			var freq;
			
			freq = 1.0 / 3000.0;
			var hills_mask = OE.Noise.perlinNoise2([x+9278, y-8827], 10, (1.0/3000.0), 0.45);
			var hills_major = OE.Noise.ridgedNoise2([x, y], 10, (1.0/2000.0), 0.45);
			//var hills_detail = OE.Noise.ridgedNoise2([x, y], 8, (1.0/500.0), 0.5)*0.2-0.1;
			var hills_detail = OE.Noise.perlinNoise2([x, y], 8, (1.0/1000.0), 0.45)*0.2-0.1;
			
			hills_mask = OE.Math.clamp(
				OE.Math.atanBias(hills_mask, 6.0)*0.4+0.4, 0.0, 1.0);
			
			result = (terrace(hills_major, 0.5, 50.0)
					+ terrace(hills_detail, 0.125, 10.0)) * hills_mask;
			
			var mountains_major = OE.Noise.ridgedNoise2([x+2168, y+5827], 10, (1.0/3000.0), 0.45)*0.9-0.1;
			mountains_major = OE.Math.atanBias(mountains_major, 4.0);
			
			result += terrace(mountains_major, 0.5, 10.0);
			
			return (result * 0.5 + 0.5) * data.scene.mTerrainHeight;
		});
		var mtls = [OE.MaterialManager.getLoaded("Terrain")];
		for (var i=0; i<this.mScene.mChunks.length; i++) {
			var mtl = mtls[Math.floor(Math.random()*mtls.length)];
			this.mScene.mChunks[i].mMaterial = mtl;
		}
		
		this.player = this.mScene.setPlayerObject(new Actor(true, this.clientAlias));
		this.mScene.mRoot.addChild(this.mCamera);
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
			case OE.Keys.K: return 7;
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
	
	camDist: 5.0,
	onMouseWheel: function(delta) {
		delta = OE.Math.clamp(delta, -1.0, 1.0);
		this.camDist -= delta * 0.5;
	},
	
	xprev: 0, yprev: 0,
	onMouseDown: function(x, y, k) {
		this.xprev = x;
		this.yprev = y;
	},
	onMouseMove: function(x, y) {
		if (this.player) {
			if (this.mKeyDown[16]) {
				var rayPos = new OE.Vector3();
				var rayDir = new OE.Vector3();
				this.mViewport.unproject(x, y, rayPos, rayDir);
				rayPos.addBy(rayDir);
				
				if (this.ball == undefined) {
					this.ball = this.mScene.addObject(new OE.Sphere(0.5, 16));
					this.ball.setMaterial("Car Paint");
				}
				this.ball.setPos(rayPos);
			}
			if (this.mMouseDown[0]) {
				var dx = x - this.xprev;
				var dy = y - this.yprev;
				this.xprev = x;
				this.yprev = y;
				
				this.mCamera.mLockY = true;
				this.mCamera.mouseLook(dx, dy, -0.075);
			}
		}
	},
	onMouseUp: function(x, y, k) {},
	
	onUpdate: function() {
		if (this.player) {
			var rot = this.mCamera.getRot();
			var pos = this.mCamera.getPos();
			pos.set(OE.Vector3.BACKWARD);
			rot.mulvBy(pos);
			pos.mulByf(this.camDist);
			pos.addBy(this.player.getPos());
			pos.y += 2.0;
			this.mCamera.setPos(pos);
			
			this.player.setRot(rot);
		}
	},
	
	onFrameRendered: function() {},
	
	connect: function() {
		this.socket = io.connect("http://"+Config.GameServer.host, {port: Config.GameServer.port});
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
