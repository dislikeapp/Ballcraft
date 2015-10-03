
uniform mat4 mvpMatrix;
uniform mat4 mvMatrix;
uniform mat3 nMatrix;

attribute vec3 vertPosition;
attribute vec3 vertNormal;
attribute vec2 vertTexCoord;

varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec2 fragTexCoord;

void main()
{
	fragNormal = nMatrix * vertNormal;
	fragTexCoord = vertTexCoord;
	fragPosition = (mvMatrix * vec4(vertPosition, 1.0)).xyz;
	gl_Position = mvpMatrix * vec4(vertPosition, 1.0);
}
