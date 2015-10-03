
var WeatherSystem = function(radius) {
	OE.GameObject.call(this);
	
	this.skysphere = this.addChild(new OE.Sphere(radius, 16));
	this.skysphere.mMaterial = OE.MaterialManager.getLoaded("Atmosphere");
	
	this.sunPos = new OE.Vector3(0.0, 0.0, 0.0);
	this.sunColor = new OE.Color(1.0, 1.0, 1.0);
};
WeatherSystem.prototype = {
	skysphere: undefined,
	
	t: 0.0,
	sunPos: undefined,
	sunColor: undefined,
	
	setMtlParams: function() {
		var skyMtl = this.skysphere.mMaterial;
		var solidMtl = OE.MaterialManager.getLoaded("Terrain");
		var params;
		var value;
		
		if (skyMtl.mLoadState == OE.Resource.LoadState.LOADED) {
			params = skyMtl.mPasses[0].mMtlParams;
			value = params.getUniformValue("sunDirection");
			value[0] = this.sunPos.x;
			value[1] = this.sunPos.y;
			value[2] = this.sunPos.z;
		}
		
		if (solidMtl.mLoadState == OE.Resource.LoadState.LOADED) {
			params = solidMtl.mPasses[0].mMtlParams;
			value = params.getUniformValue("lightPos");
			value[0] = this.sunPos.x;
			value[1] = this.sunPos.y;
			value[2] = this.sunPos.z;
			value = params.getUniformValue("lightColor");
			value[0] = this.sunColor.r;
			value[1] = this.sunColor.g;
			value[2] = this.sunColor.b;
		}
	},
	onUpdate: function() {
		this.t += 0.00001;
		if (this.t >= 1.0) this.t -= 1.0;
		
		var t2pi = this.t * OE.Math.TWO_PI;
		var sin = Math.sin(t2pi);
		var cos = Math.cos(t2pi);
		
		this.sunPos.setf(cos * 10000.0, sin * 10000.0, 0.0);
		
		var bright = OE.Math.clamp(sin + 0.5, 0.0, 1.0);
		var hstr = Math.pow(OE.Math.clamp(1.0 - Math.abs(sin), 0.0, 1.0), 4.0);
		this.sunColor.r = OE.Math.linInterp(0.0, 2.0, hstr) + OE.Math.linInterp(0.2, 1.0, bright);
		this.sunColor.g = OE.Math.linInterp(0.0, 1.0, hstr) + OE.Math.linInterp(0.15, 1.0, bright);
		this.sunColor.b = OE.Math.linInterp(0.0, 0.3, hstr) + OE.Math.linInterp(0.1, 1.0, bright);
		
		var sunAmount = Math.pow(OE.Math.clamp(sin*2.0+1.0, 0.0, 1.0), 1.0);
		this.sunColor.r *= sunAmount;
		this.sunColor.g *= sunAmount;
		this.sunColor.b *= sunAmount;
		
		this.setMtlParams();
	}
};
OE.Utils.merge(WeatherSystem.prototype, OE.GameObject.prototype);
WeatherSystem.prototype.constructor = WeatherSystem;
