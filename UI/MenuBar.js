
var getElementsByName = function(parent, name) {
	var elements = [];
	var find = function(children) {
		for (var child in children) {
			if (children[child].nodeType != 1)
				continue;
			
			if (children[child].getAttribute("name") == name)
				elements.push(children[child]);
			
			if (children[child].childNodes.length > 0)
				find(children[child].childNodes);
		}
	};
	find(parent.childNodes);
	return elements;
};

var MenuBar = function(id) {
	this.mElement = document.getElementById(id);
}
MenuBar.prototype = {
	mElement: undefined,
	
	setAction: function(name, action) {
		var link = getElementsByName(this.mElement, name)[0];
		link.addEventListener("click", action.bind(this));
	},
	setSubMenu: function(name, subName) {
		var link = getElementsByName(this.mElement, name)[0];
		var sub = getElementsByName(this.mElement, subName)[0];
		this.mElement.appendChild(sub);
		var visible = false;
		sub.style.display = "none";
		this.setAction(name, function() {
			if (!visible) {
				var rect = link.getBoundingClientRect();
				sub.style.left = (rect.left + 12) + "px";
				sub.style.top = (rect.bottom + 2) + "px";
				sub.style.display = "inline-block";
				visible = true;
			}
		});
		document.addEventListener("mousedown", function(e) {
			if (visible) {
				var x = e.clientX;
				var y = e.clientY;
				var rect = sub.getBoundingClientRect();
				if (x < rect.left || x > rect.right ||
					y < rect.top || y > rect.bottom) {
						sub.style.display = "none";
						visible = false;
				}
			}
		});
	}
};
MenuBar.prototype.constructor = MenuBar;