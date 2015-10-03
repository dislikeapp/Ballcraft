
var fs = require("fs");
var EOL = require('os').EOL;

var Utils = {};

Utils.merge = function(dst, src) {
	for (var key in src) {
		if (dst[key] === undefined)
			dst[key] = src[key];
	}
};
Utils.clone = function(obj, shallow) {
	if (obj == undefined || obj == null || typeof(obj) != 'object')
		return obj;
	var temp = new obj.constructor();
	for (var key in obj) {
		temp[key] = shallow ? obj[key] : Utils.clone(obj[key]);
	}
	return temp;
};

Utils.indexOf = function(arr, obj) {
	for (var i=0; i<arr.length; i++)
		if (arr[i] == obj)
			return i;
	return -1;
};
Utils.censor = function(object, depth, ancestors) {
	if (depth == undefined) depth = 0;
	if (ancestors == undefined) ancestors = [];
	
	if (depth > 20) {
		return "[Unknown]";
	}
	else if (typeof(object) === "function") {
		// return "[Function]"; Ignore
	}
	else if (typeof(object) === "object") {
		if (object === null) {
			return null;
		}
		if (object.constructor != undefined) {
			var _io = require("socket.io");
			if (object.constructor == _io.Socket) {
				return "[io.Socket]";
			}
			else if (object.constructor == _io.Manager) {
				return "[io.Manager]";
			}
		}
		if (Utils.indexOf(ancestors, object) >= 0) {
			return "[Circular]";
		}
		ancestors.push(object);
		var objectPos = ancestors.length;
		var result = {};
		for (var key in object) {
			var value = object[key];
			result[key] = Utils.censor(value, depth+1, ancestors);
			ancestors.splice(objectPos, ancestors.length);
		}
		return result;
	}
	else {
		return object;
	}
}

Utils.escapeHtml = function(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
};

Utils.loadJSON = function(filePath, onLoaded, onError) {
	fs.readFile(filePath, "utf8", function (error, data) {
		if (error) {
			if (onError) onError(error);
			else throw error;
		}
		var json = JSON.parse(data);
		onLoaded(json);
	});
};
Utils.saveJSON = function(filePath, json, onError) {
	var data = JSON.stringify(json, null, "\t");
	fs.writeFile(filePath, data, "utf8", function (error) {
		if (error) {
			if (onError) onError(error);
			else throw error;
		}
	});
};

Utils.getFilenameTimestamp = function(date) {
	var yr = date.getFullYear();
	var mth = date.getMonth()+1;	if (mth < 10) mth = "0"+mth;
	var day = date.getDate();		if (day < 10) day = "0"+day;
	var hr = date.getHours();		if (hr < 10) hr = "0"+hr;
	var min = date.getMinutes();	if (min < 10) min = "0"+min;
	var sec = date.getSeconds();	if (sec < 10) sec = "0"+sec;
	return "["+yr+"-"+mth+"-"+day+"] ["+hr+"-"+min+"-"+sec+"]";
};
Utils.initLogger = function() {
	try {
		var ts = Utils.getFilenameTimestamp(new Date());
		var logPath = __dirname + "/logs/log "+ts+".txt";
		var logFile = fs.createWriteStream(logPath, {flags : 'w'});
		var logout = logFile;
		var logerr = logFile;
		logFile.on("error", function (e) {
			console.log("Could not log to file: "+e);
		});
		
		process.on("uncaughtException", function(err) {
			console.log("Exception: " + err);
			console.log("Stack: " + err.stack);
			fs.appendFileSync(logPath, "Exception: " + err + EOL);
			fs.appendFileSync(logPath, "Stack: " + err.stack + EOL);
			process.exit(1);
		});
		
		var stdoutWrite = process.stdout.write;
		var stderrWrite = process.stderr.write;
		
		process.stdout.write = function() {
			logout.write.apply(logout, arguments);
			stdoutWrite.apply(process.stdout, arguments);
		};
		process.stderr.write = function() {
			logerr.write.apply(logerr, arguments);
			stderrWrite.apply(process.stderr, arguments);
		};
	}
	catch (e) {
		console.log("Could not log to file: "+e);
	}
};

var BashStyle = {};
BashStyle.build = function(attribs) {
	var result = '';
	if (attribs.color) result += (attribs.color+30)+';';
	if (attribs.color256) result += '38;5;'+attribs.color256+';';
	if (attribs.colorRGB) {
		var rgb = colorRGB;
		result += '38;2;'+rgb[0]+';'+rgb[1]+';'+rgb[2]+';';
	}
	if (attribs.bgColor) result += (attribs.bgColor+40)+';';
	if (attribs.bgColor256) result += '48;5;'+attribs.bgColor256+';';
	if (attribs.bgColorRGB) {
		var rgb = bgColorRGB;
		result += '48;2;'+rgb[0]+';'+rgb[1]+';'+rgb[2]+';';
	}
	if (attribs.bold) result += '1;';
	if (attribs.dim) result += '2;';
	if (attribs.underline) result += '4;';
	if (attribs.blink) result += '5;';
	if (attribs.invert) result += '7;';
	if (attribs.hidden) result += '8;';
	
	var last = result.length-1;
	result = result.substr(0, last) + 'm';
	return '\x1b['+result;
};
BashStyle.RESET = '\x1b[0m';
BashStyle.Color = {
	DEFAULT: 9,
	
	BLACK:	0,	DRED:	1,
	DGREEN:	2,	DYELLOW:3,
	DBLUE:	4,	DPURPLE:5,
	DCYAN:	6,	LGRAY:	7,
	
	DGRAY:	60,	RED:	61,
	GREEN:	62,	YELLOW:	63,
	BLUE:	64,	PURPLE:	65,
	CYAN:	66,	WHITE:	67
};
Utils.Loggable = function(constructor, name, style) {
	if (style) name = BashStyle.build(style) + name + BashStyle.RESET;
	constructor.prototype.log = function(message) {
		console.log("["+name+"] "+message);
	};
};
