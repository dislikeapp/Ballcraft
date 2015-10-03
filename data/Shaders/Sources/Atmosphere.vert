
uniform mat4 mvpMatrix;
uniform mat4 vMatrix;

attribute vec3 vertPosition;
attribute vec3 vertNormal;
attribute vec2 vertTexCoord;

varying vec3 fragNormal;

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
void main()
{
	gl_Position = mvpMatrix * vec4(-vertPosition, 1.0);
	fragNormal = normalize((transpose(vMatrix) * vec4(-vertPosition, 1.0)).xyz);
}
