
function loadStart() {
	var overlay = document.getElementById("loadingOverlay");
	if (overlay.mTimer) {
		clearTimeout(overlay.mTimer);
		overlay.mTimer = undefined;
	}
	var status = getElementsByName(overlay, "status")[0];
	status.innerHTML = "";
	overlay.style.display = "inline-block";
}
function loadStatus(statusText) {
	var overlay = document.getElementById("loadingOverlay");
	var status = getElementsByName(overlay, "status")[0];
	status.innerHTML = statusText;
}
function loadFinish() {
	loadStatus("Done!");
	var overlay = document.getElementById("loadingOverlay");
	overlay.mTimer = setTimeout(function() {
		overlay.mTimer = undefined;
		var status = getElementsByName(overlay, "status")[0];
		status.innerHTML = "";
		overlay.style.display = "none";
	}, 2000);
}

function declareResources(callback) {
	loadStart();
	loadStatus("0");
	var count = 0;
	var onDeclared = function() {
		count++;
		loadStatus(count);
		if (count == 1) {
			loadFinish();
			callback();
		}
	};
	
	OE.ResourceManager.declareLibrary("data/Library.json", onDeclared);
}

function preloadResources(type, callback) {
	var resources = {
		textures: [	"White",		"Black",
					"Terrain_diff_spec", "Terrain_norm",
					"City_env",
					"Metal_norm"],
		shaders: [	"Terrain",		"Atmosphere",	"Solid"],
		materials: ["Terrain",		"Atmosphere",	"Car Paint",
					"Metal",		"Chocolate"],
		models: [	"Bunny_low",	"Diamond"]
	}
	var list = resources[type];
	var num = list.length;
	
	loadStart();
	loadStatus("0 of "+num+" "+type);
	var count = 0;
	var onLoaded = function() {
		count++;
		loadStatus(count+" of "+num+" "+type);
		if (count == num) {
			loadFinish();
			callback();
		}
	};
	
	var mgr;
	if (type == "textures") mgr = OE.TextureManager;
	if (type == "shaders") mgr = OE.ShaderManager;
	if (type == "materials") mgr = OE.MaterialManager;
	if (type == "models") mgr = OE.ModelManager;
	if (mgr) {
		for (var i=0; i<num; i++) {
			mgr.load(list[i], onLoaded);
		}
	}
}

var app;
var io;
var menuBar;

function init() {
	var io = undefined;
	
	requirejs.onError = function (e) {
		if (e.requireType === "timeout") {
			alert("Timeout while connecting to game server.");
		}
		else if (e.requireType === "scripterror") {
			// Also because of timeout.
		}
		else {
			throw e;
		}
	};
	
	require(["socket.io"], function(_io) {
		io = _io;
		app = new App();
		app.run();
	});
	
	/*
	menuBar = new MenuBar("menuBar");
	menuBar.setSubMenu("file", "fileSub");
	menuBar.setSubMenu("view", "viewSub");*/
}
function finish() {
	if (app)
		app.finish();
}

window.addEventListener("load", init);
window.addEventListener("unload", finish);