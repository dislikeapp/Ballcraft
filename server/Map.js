
function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function Map() {
	this.data = {};
	this.next = 0;
}

Map.prototype.data = {};
Map.prototype.next = 0;

Map.prototype.findNext = function() {
	while(this.data[this.next] != undefined) {
		this.next++;
	}
}
Map.prototype.insert = function(key, element) {
	if (this.data[key] == undefined) {
		this.data[key] = element;
		// element.key = key;
		if (isNumber(key) && key == this.next) {
			this.findNext();
		}
		return true;
	}
	return false;
};
Map.prototype.insertNext = function(element) {
	var key = this.next;
	if (this.data[key] == undefined) {
		this.data[key] = element;
		// element.key = key;
		this.findNext();
		return key;
	}
	this.findNext();
	return this.insertNext(element);
};
Map.prototype.get = function(key) {
	return this.data[key];
};
/*Map.prototype.remove = function(element) {
	if (element.key != undefined) {
		element.key = undefined;
		delete this.data[element.key];
		if (isNumber(element.key) && element.key < this.next) {
			this.next = element.key;
		}
		return true;
	}
	return false;
};*/
Map.prototype.removeKey = function(key) {
	if (this.data[key] != undefined) {
		// this.data[key].key = undefined;
		delete this.data[key];
		if (isNumber(key) && key < this.next) {
			this.next = key;
		}
		return true;
	}
	return false;
};
/*Map.prototype.removeNumeric = function(element) {
	if (element.key != undefined) {
		// element.key = undefined;
		delete this.data[element.key];
		if (element.key < this.next) {
			this.next = element.key;
		}
		return true;
	}
	return false;
};*/
Map.prototype.removeNumericKey = function(key) {
	delete this.data[key];
	if (key < this.next) {
		this.next = key;
	}
	return true;
};
Map.prototype.clear = function() {
	this.data = {};
	this.next = 0;
};
