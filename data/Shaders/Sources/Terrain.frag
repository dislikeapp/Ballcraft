
#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform mat3 nMatrix;
uniform mat4 vMatrix;
uniform mat4 mvMatrix;

uniform sampler2D diffSampler;
uniform sampler2D normSampler;
uniform sampler2D envSampler;

uniform vec3 lightPos;
uniform vec3 lightColor;

uniform float normMapIntensity;
uniform float specMapIntensity;

uniform vec2 atlasSize;
uniform vec2 tileCount;
uniform float tilePadding;

uniform float emission;
uniform float shininess;
uniform float diffusivity;
uniform float reflectivity;

varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec2 fragTexCoord;
varying float layerWeights[4];
varying vec3 lightPosV;

const float PI = 3.14159265358979323846264338327950;

mat3 transpose(mat3 matrix) {
	vec3 i0 = matrix[0];
	vec3 i1 = matrix[1];
	vec3 i2 = matrix[2];
	return mat3(
		vec3(i0.x, i1.x, i2.x),
		vec3(i0.y, i1.y, i2.y),
		vec3(i0.z, i1.z, i2.z)
	);
}
mat4 transpose(mat4 matrix) {
	vec4 i0 = matrix[0];
	vec4 i1 = matrix[1];
	vec4 i2 = matrix[2];
	vec4 i3 = matrix[3];
	return mat4(
		vec4(i0.x, i1.x, i2.x, i3.x),
		vec4(i0.y, i1.y, i2.y, i3.y),
		vec4(i0.z, i1.z, i2.z, i3.z),
		vec4(i0.w, i1.w, i2.w, i3.w)
	);
}

mat3 calcTBN(vec3 pos, vec2 texcoord, vec3 normal) {
	// compute derivations of the world position
	vec3 p_dx = dFdx(pos);
	vec3 p_dy = dFdy(pos);
	// compute derivations of the texture coordinate
	vec2 tc_dx = dFdx(texcoord);
	vec2 tc_dy = dFdy(texcoord);
	// compute initial tangent and bi-tangent
	vec3 t = normalize( tc_dy.y * p_dx - tc_dx.y * p_dy );
	vec3 b = normalize( tc_dy.x * p_dx - tc_dx.x * p_dy ); // sign inversion
	// get new tangent from a given mesh normal
	vec3 n = normalize(normal);
	vec3 x = cross(n, t);
	t = cross(x, n);
	t = normalize(t);
	// get updated bi-tangent
	x = cross(b, n);
	b = cross(n, x);
	b = normalize(b);
	return mat3(t, b, n);
}

vec2 getTileUV(vec2 texCoord, float tileIndex, vec2 tileScale) {
	vec2 tileOffset;
	tileOffset.y = floor(tileIndex / tileCount.x);
	tileOffset.x = tileIndex - tileCount.x * tileOffset.y;
	tileOffset /= tileCount;
	return abs(fract(texCoord)*2.0-1.0) * tileScale + tileOffset;
}

const int numLayers = 3;

vec4 sampleWeighted(sampler2D sampler, vec2 texCoord1, vec2 texCoord2, float weights[4]) {
	vec2 tileScaleFull = 1.0 / tileCount;
	vec2 tileScalePadded = (1.0 - 2.0*tilePadding) * tileScaleFull;
	vec2 texelSize = 0.5 / (tileScalePadded * atlasSize);
	vec2 paddingOffset = tileScaleFull * tilePadding + texelSize * 0.5;
	
	float total = 0.0;
	for (int i = 0; i < numLayers; i++)
		total += weights[i];
	
	vec4 result;
	for (int i = 0; i < numLayers; i++) {
		float index = float(i);
		vec2 tc1 = getTileUV(texCoord1, index, tileScalePadded) + paddingOffset;
		vec2 tc2 = getTileUV(texCoord2, index, tileScalePadded) + paddingOffset;
		vec4 col = (texture2D(sampler, tc1) + texture2D(sampler, tc2)) * 0.5;
		result += col * weights[i] / total;
	}
	return result;
}

float unmix(float a, float b, float value) {
	return (value-a) / (b-a);
}

void main()
{
	vec3 E = normalize(-fragPosition);
	vec3 N;
	
	vec2 texCoord1 = fragTexCoord*2.0;
	vec2 texCoord2 = texCoord1*8.0;
	
	if (normMapIntensity > 0.0) {
		vec3 normSample = sampleWeighted(normSampler, texCoord1, texCoord2, layerWeights).xyz * 2.0 - 1.0;
		normSample.xy *= normMapIntensity;
		normSample = normalize(normSample);
		mat3 tbn = calcTBN(fragPosition, texCoord1, fragNormal);
		N = tbn * normSample;
	}
	else {
		N = normalize(fragNormal);
	}
	
	vec3 L = normalize(lightPosV - fragPosition);
	vec3 R = reflect(-L, N);
	float kD = max(dot(N, L), 0.0) * (1.0 - emission);
	float kS = pow(max(dot(R, E), 0.0), shininess);
	
	vec4 diffSample = sampleWeighted(diffSampler, texCoord1, texCoord2, layerWeights);
	
	vec3 diffFinal = diffSample.rgb * diffusivity * (emission + lightColor * kD);
	vec3 specFinal = lightColor * kS;
	
	if (reflectivity > 0.0) {
		vec2 envCoord;
		vec3 reflection = reflect(E, N);
		reflection = normalize((transpose(vMatrix) * vec4(reflection, 1.0)).xyz);
		envCoord.x = atan(reflection.x, reflection.z) / PI;
		envCoord.y = dot(reflection, vec3(0, 1, 0));
		envCoord = envCoord * 0.5 + 0.5;
		vec3 reflectSample = texture2D(envSampler, envCoord).rgb;
		specFinal += reflectSample * reflectivity;
	}
	
	if (specMapIntensity > 0.0) {
		float specSample = 1.0 + (diffSample.a - 1.0) * specMapIntensity;
		specFinal *= specSample;
	}
	
	vec3 color = diffFinal + specFinal;
	
	vec3 fogColor = vec3(0.46, 0.53, 0.63);
	float fog = pow(clamp(-fragPosition.z / 1500.0, 0.0, 1.0), 4.0);
	//color.a *= (1.0 - fog);
	color = mix(color, fogColor, fog);
	
	gl_FragColor = vec4(color, 1.0);
}
