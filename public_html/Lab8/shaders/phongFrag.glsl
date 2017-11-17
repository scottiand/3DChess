precision mediump float;

// per-fragment interpolated values from the vertex shader
varying vec3 fN;
varying vec3 fL;
varying vec3 fE;

// incoming uniform values
uniform vec4  uColor;
uniform vec4  uLight_position;
uniform vec4  uAmbient_product, uDiffuse_product, uSpecular_product;
uniform float uShininess;

void main()
{

    // Normalize the input lighting vectors
    vec3 N = normalize(fN);
    vec3 E = normalize(fE);
    vec3 L = normalize(fL);

    vec3 H = normalize( L + E );

    vec4 ambient = uAmbient_product*uColor;

    float diffDot = max(dot(L, N), 0.0);
    vec4 diffuse = diffDot*uDiffuse_product*uColor;

    float specDot = pow(max(dot(N, H), 0.0), uShininess);
    vec4 specular = specDot*uSpecular_product*uColor;

    // discard the specular highlight if the light's behind the vertex
    if( dot(L, N) < 0.0 ) {
	   specular = vec4(0.0, 0.0, 0.0, 1.0);
    }

    gl_FragColor  = ambient + diffuse + specular;

    gl_FragColor.a = 1.0;
}