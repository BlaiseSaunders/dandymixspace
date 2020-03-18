window.shaders = window.shaders || {}; // JS Boilerplate
window.shaders.fragmentShader = `


/*
 *
 * Some implementation specifics:
 * 	- Scene returns vec3, x is dist, y is the ID of the object where ID > 0 and z is steps
 *	- Dist functions nicked from Inigo Quilez (all hail)
 *
 */

#define LIGHT_COUNT 2 // UPDATE OBJECT COUNT TOO
struct Light
{
	vec3 pos;
	vec3 colour;
	float intens;
	float dist;
};

uniform float fieldOfView; 
uniform vec3 eye;
uniform float eyeY;
uniform float eyeX;
uniform vec2 iResolution;
uniform float iTime;
uniform float scalePower;

uniform int shadowCalcPhong;

uniform int pbr;

uniform int shadowWorld;
uniform int ambientWorld;
uniform int distWorld;

uniform float slider;

uniform Light lights[LIGHT_COUNT];

varying vec3 vUv;

float rand(vec2 co)
{
	return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}


// gl_FragCoord.xy --> The x and y coordinates of the pixel we're calculating the value of
// iResolution.xy  --> The resolution of the screen


// You tell me :^)
void main()
{

	vec3 color = vec3(0.0);

	// Colour of the pixel from 0.0 to 1.0
	//            R    G    B
	color = vec3(0.0, 1.0, 0.0);

	// Now we're setting the red colour based on our position out of the total position.
	// e.g. Pixel 100 out of 1000, red value = 0.1
	color = vec3(gl_FragCoord.x/iResolution.x, 0.0, 0.0);


	color = vec3(gl_FragCoord.y/iResolution.y, 0.0, 0.0);
	color = vec3(rand(gl_FragCoord.xy), rand(gl_FragCoord.yx), rand(gl_FragCoord.xy/gl_FragCoord.yx));
	color = vec3(rand(gl_FragCoord.xy), rand(gl_FragCoord.yx+iTime), rand(gl_FragCoord.xy/gl_FragCoord.yx*iTime));
	color = vec3(gl_FragCoord.y/iResolution.y, gl_FragCoord.x/iResolution.x, 0.0);
	

	gl_FragColor = vec4(color, 1.0);
}


`; // For da JS