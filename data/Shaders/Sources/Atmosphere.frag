
precision highp float;

uniform vec3 sunDirection;
uniform vec3 moonDirection;

varying vec3 fragNormal;

const float PI = 3.14159265358979323846264338327950;

vec3 getSkyColor(vec3 sunDir, vec3 moonDir, vec3 ray) {
	const vec3 skyColor1 = vec3(0.0, 0.01, 0.02);
	const vec3 skyColor2 = vec3(0.2, 0.4, 0.6);
	
	const vec3 fogColor1 = vec3(0.8, 0.9, 1.0) * 0.2;
	const vec3 fogColor2 = vec3(0.6, 0.75, 1.0) * 0.6;
	//const vec3 fogColor2 = vec3(1.0) * 0.5;
	const float fogColorExp1 = 1.0;
	const float fogColorExp2 = 1.0;
	const float fogHeightExp = 8.0;
	
	//const vec3 sunGlowColor1 = vec3(1.0, 1.0, 1.0) * 0.6;
	//const vec3 sunGlowColor2 = vec3(1.0, 1.0, 1.0) * 0.6;
	const vec3 sunGlowColor1 = vec3(1.0, 0.5, 0.05) * 0.6;
	const vec3 sunGlowColor2 = vec3(1.0, 0.8, 0.6) * 0.6;
	const float sunGlowColorExp = 1.0;
	const float sunGlowFlareExp1 = 64.0;
	const float sunGlowFlareExp2 = 64.0;
	const float sunGlowHeightExp = 4.0;
	const float sunGlowBandExp = 2.0;
	const float sunGlowFadeExp = 2.0;
	
	const vec3 sunShape1 = vec3(1.0, 0.2, 0.2) * 1.5;
	const vec3 sunShape2 = vec3(1.0, 1.0, 1.0);
	
	const vec3 moonColor = vec3(0.85, 0.9, 1.0) * 0.5;
	
	vec3 norm = normalize(ray);
	
	float sunHeight = sunDir.y;
	float sunHeightScalar = sunDir.y * 0.5 + 0.5;
	float sunHeightUp = clamp(sunDir.y, 0.0, 1.0);
	
	float normHeight = norm.y;
	float normHeightScalar = norm.y * 0.5 + 0.5;
	float normHeightUp = clamp(norm.y, 0.0, 1.0);
	
	float horizonDist = 1.0 - abs(norm.y);
	float horizonDistUp = 1.0 - normHeightUp;
	float horizonDistDown = 1.0 + clamp(norm.y, -1.0, 0.0);
	float dpSun = dot(norm, sunDir) * 0.5 + 0.5;
	
	float skyExponent = mix(2.0, 1.0, sunHeightScalar);
	float skyAmount = pow(sunHeightScalar, skyExponent);
	vec3 skyColor = mix(skyColor1, skyColor2, skyAmount);
	
	float fogColorExp = mix(fogColorExp1, fogColorExp2, sunHeightScalar);
	float fogColorAmt = pow(sunHeightScalar, fogColorExp);
	vec3 fogColor = mix(fogColor1, fogColor2, fogColorAmt);
	float fogHeight = pow(sin(0.5*PI*horizonDistUp), fogHeightExp);
	fogColor = fogColor * fogHeight;
	
	float sunGlowColorAmt = pow(sunHeightUp, sunGlowColorExp);
	vec3 sunGlow = mix(sunGlowColor1, sunGlowColor2, sunGlowColorAmt);
	float sunGlowFlareExp = mix(sunGlowFlareExp1, sunGlowFlareExp2, sunHeightUp);
	float sunGlowFlareHeight = pow(horizonDist, sunGlowHeightExp);
	float flareTerm = pow(clamp(dpSun, 0.0, 1.0), sunGlowFlareExp);
	float horizonTerm = pow(dpSun*0.5+0.5, sunGlowBandExp) * sunGlowFlareHeight;
	horizonTerm = horizonTerm * pow(1.0 - abs(sunHeight), sunGlowFadeExp);
	
	sunGlow = sunGlow * (flareTerm + horizonTerm);
	sunGlow = sunGlow * pow(horizonDistDown, 6.0);
	
	vec3 sunSurface = mix(sunShape1, sunShape2, sunHeightUp);
	sunSurface = sunSurface * pow(clamp(dpSun + 0.0005, 0.0, 1.0), 4096.0);
	sunSurface = sunSurface * pow(horizonDistDown, 6.0);
	
	float dpMoon = dot(norm, moonDir) * 0.5 + 0.5;
	float moonStrength = (dot(sunDir, -moonDir) * 0.5 + 0.5) * pow(clamp(moonDir.y, 0.0, 1.0), 0.1);
	vec3 moonGlow = moonStrength * pow(dpMoon, 32.0) * moonColor;
	
	float moonShape = clamp(pow(max(dpMoon*4.0-3.0+0.001, 0.0), 8192.0), 0.0, 1.0);
	
	vec3 mPos = moonDir*100.0;
	vec3 sPos = sunDir*10000.0;
	vec3 moonToFrag = normalize(norm - mPos);
	vec3 sunToMoon = normalize(mPos - sPos);
	
	vec3 surfaceNorm = normalize(norm - moonDir*1.04);
	vec3 moonSurface = moonColor * (clamp(-dot(surfaceNorm, sunToMoon), -0.02, 1.0));
	
	vec3 c = skyColor + fogColor + moonGlow;
	c = mix(c + sunGlow + sunSurface,
			c + moonSurface,
			moonShape);
	return c;
}

void main() {
	vec3 c = getSkyColor(
				normalize(sunDirection),
				normalize(moonDirection),
				fragNormal);
	gl_FragColor = vec4(c, 1.0);
}
