precision mediump float;

attribute vec4 vPosition;
attribute vec4 vNormal;
attribute vec4 vColor;

uniform vec4 uLight_position; // assumed to be in eye coordinates. 
uniform mat4 uProjection;
uniform mat4 uModel_view;

// output values that will be interpreted per-fragment
varying  vec3 fN;
varying  vec3 fE;
varying  vec3 fL;
varying vec4 color;

void main()
{
    fN = normalize( uModel_view*vNormal ).xyz;
    fE = -(uModel_view*vPosition).xyz;
    fL = uLight_position.xyz - (uModel_view * vPosition).xyz;

    gl_Position = uProjection * uModel_view * vPosition;
}
