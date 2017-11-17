attribute  vec4 vPosition;
attribute  vec4 vNormal;
attribute  vec4 vColor; // not used here

uniform vec4 uColor;
uniform vec4  uLight_position;
uniform vec4  uAmbient_product, uDiffuse_product, uSpecular_product;
uniform float uShininess;

uniform mat4 uModel_view;
uniform mat4 uProjection;

varying vec4 fColor;

void main()
{

    // Transform vertex  position into eye coordinates
    vec3 pos = (uModel_view * vPosition).xyz;

    // These are parameters we need for the Phong Lighting model:  V, R, N, L. Here, the variable E represents V, and H is R
    // This assumes the light position is passed into the shader in eye coordinates
    vec3 L = normalize( (uLight_position).xyz - pos );  // Light direction
    vec3 E = normalize( - pos );    //  V = View direction: camera sits at the origin so "eye" direction is: origin-pos = -pos
    vec3 H = normalize( L + E );   // R = Reflected direction: this formula is an approximation of R.

    // Transform vertex normal into eye coordinates
    // Be careful - generally the normals transform slightly differently than the vertices
    // however, for rotations and uniform scale, they are the same.
    // We will have to be more careful when doing non-uniform scales.
    vec3 N = normalize(uModel_view * vNormal ).xyz ;

    // Compute terms in the illumination equation
   vec4 ambient = uAmbient_product * uColor;   // Ka*LightColor*SurfaceColor

    float LN = max( dot(L, N), 0.0 ); // LdotN < 0, then there is no diffuse

    vec4  diffuse = LN * uDiffuse_product * uColor; // kd*(NdotL)*LightColor*SurfaceColor

    float NH = pow( max(dot(N, H), 0.0), uShininess );
    vec4  specular = NH * uSpecular_product * uColor;

    if( dot(L, N) < 0.0 ) {                  // specular is also 0 if LdotN<0
	   specular = vec4(0.0, 0.0, 0.0, 1.0);
    }

    gl_Position = uProjection * uModel_view * vPosition;

    fColor =  ambient + diffuse + specular;

    fColor.a = 1.0;  // set alpha channel of color to be 1

}
