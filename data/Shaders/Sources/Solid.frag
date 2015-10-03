
#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform mat3 nMatrix;
uniform mat4 vMatrix;
uniform mat4 mvMatrix;

uniform sampler2D diffSampler;
uniform sampler2D normSampler;
uniform sampler2D specSampler;
uniform sampler2D envSampler;

uniform float normMapIntensity;
uniform float specMapIntensity;

uniform vec3 diffuse;
uniform vec3 specular;
uniform float emission;
uniform float shininess;
uniform float diffusivity;
uniform float reflectivity;

varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec2 fragTexCoord;

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

void main()
{
	vec3 E = normalize(-fragPosition);
	vec3 N;
	
	vec3 lightPos = (vMatrix * vec4(vec3(4000.0, 8000.0, 7000.0), 1.0)).xyz;
	vec3 L = normalize(lightPos - fragPosition);
	vec3 R;
	
	if (normMapIntensity > 0.0) {
		vec3 normSample = normalize((texture2D(normSampler, fragTexCoord).xyz * 2.0 - 1.0));
		normSample.xy *= normMapIntensity;
		normSample = normalize(normSample);
		mat3 tbn = calcTBN(fragPosition, fragTexCoord, fragNormal);
		N = tbn * normSample;
	}
	else {
		N = normalize(fragNormal);
	}
	R = reflect(-L, N);
	
//	gl_FragColor = vec4(N*0.5+0.5, 1.0); return;
//	gl_FragColor = vec4(vec3(-fragPosition*0.5+0.5), 1.0); return;
//	gl_FragColor = vec4(E*10.0+0.5, 1.0); return;
//	gl_FragColor = vec4(N*10.0+0.5, 1.0); return;
	
	float kD = mix(max(dot(N, L), 0.0), 1.0, emission);
	float kS = pow(max(dot(R, E), 0.0), shininess);
	
	vec3 diffFinal = diffuse * kD;
	vec3 specFinal = specular * kS;
	
	vec4 diffSample = texture2D(diffSampler, fragTexCoord);
	diffFinal *= diffSample.rgb * diffusivity;
	
	if (reflectivity > 0.0) {
		vec2 envCoord;
		vec3 reflection = reflect(E, N);
		reflection = normalize((transpose(vMatrix) * vec4(reflection, 1.0)).xyz);
		envCoord.x = atan(reflection.x, reflection.z) / PI;
		envCoord.y = dot(reflection, vec3(0, 1, 0));
		envCoord = envCoord * 0.5 + 0.5;
		vec3 reflectSample = texture2D(envSampler, envCoord).xyz;
		specFinal += reflectSample * reflectivity;
	}
	
	if (specMapIntensity > 0.0) {
		vec3 specSample = texture2D(specSampler, fragTexCoord).xyz;
		specSample = 1.0 + (specSample - 1.0) * specMapIntensity;
		specFinal *= specSample;
	}
	
	vec3 color = diffFinal + specFinal;
	
	float fog = pow(clamp(-fragPosition.z / 1000.0, 0.0, 1.0), 3.0);
	color *= (1.0 - fog);
	
	gl_FragColor = vec4(color, diffSample.a);
}
