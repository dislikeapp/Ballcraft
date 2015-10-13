
var vm = require("vm");
var fs = require("fs");
var util = require('util');
//var XMLHttpRequest = require("../libs/XMLHttpRequest").XMLHttpRequest;

global.require = require;
global.io = io;

// Includes code that does not include other
// code, or use global variables.
function include(path) {
	var code = fs.readFileSync(path, "utf-8");
	vm.runInThisContext(code, path);
}

function readFile(path) {
	return fs.readFileSync(path, "utf-8");
}

var window = undefined;

// Shared systems (Must be self-contained, ex. definitions only, no calls)
include("Map.js");
include("../libs/md5.js");
include("OmniEngine.Server.js");
/*
include("../../OmniEngine/src/Library.js");
include("../../OmniEngine/src/Utils.js");
include("../../OmniEngine/src/Math/glMatrix-0.9.5.min.js");
include("../../OmniEngine/src/Math/Math.js");
include("../../OmniEngine/src/Math/Vector.js");
include("../../OmniEngine/src/Math/Quaternion.js");
include("../../OmniEngine/src/Math/Transform.js");
include("../../OmniEngine/src/Math/Movable.js");*/

// Server systems (These are allowed to use global variables)
eval(readFile("Utils.js")); Utils.initLogger();

var io = require("socket.io").listen(3000);
io.set("log level", 1);

// Server systems (These are allowed to use global variables)
eval(readFile("Server.js"));

var server;

function init() {
	server = new Server(io);
	server.run();
}

init();
