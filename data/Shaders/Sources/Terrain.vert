
uniform mat4 mvpMatrix;
uniform mat4 mvMatrix;
uniform mat4 vMatrix;
uniform mat3 nMatrix;

uniform vec3 lightPos;

attribute vec3 vertPosition;
attribute vec3 vertNormal;
attribute vec2 vertTexCoord;

varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec2 fragTexCoord;
varying float layerWeights[4];
varying vec3 lightPosV;

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
float unmix(float a, float b, float value) {
	return (value-a) / (b-a);
}
void main()
{
	fragNormal = nMatrix * vertNormal;
	
	mat4 vT = transpose(vMatrix);
	vec3 norm = normalize((vT * vec4(fragNormal, 1.0)).xyz);
	
	float flatness = clamp(unmix(0.96, 0.97, norm.y), 0.0, 1.0);
	float height = clamp(unmix(400.0, 450.0, vertPosition.y), 0.0, 1.0);
	layerWeights[1] = flatness * (1.0 - height);
	layerWeights[0] = 1.0-clamp(abs(norm.y - 0.95) / 0.05, 0.0, 1.0);
	layerWeights[2] = clamp((0.97 - norm.y) / 0.04, 0.0, 1.0);
	//layerWeights[3] = flatness * height;
	
	lightPosV = (vMatrix * vec4(lightPos, 1.0)).xyz;
	
	fragTexCoord = vertTexCoord;
	fragPosition = (mvMatrix * vec4(vertPosition, 1.0)).xyz;
	gl_Position = mvpMatrix * vec4(vertPosition, 1.0);
}
