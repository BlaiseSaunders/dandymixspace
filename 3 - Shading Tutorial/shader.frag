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


// sqrt(x[1]^2, x[2]^2, x[3]^2)
float sdf_sphere(vec3 pos)
{
	return length(pos) - 1.0;
}

float sdf_scene(vec3 pos)
{
	return sdf_sphere(pos);
}

const int   MAX_STEPS = 1024;
const float MAX_DIST  = 512.0;
const float EPSILON   = 0.00001;
vec3 march(vec3 startPos, vec3 dir)
{
	vec3 pos = startPos;
	for (int i = 0; i < MAX_STEPS; i++)
	{
		float dist = sdf_sphere(pos); // Get the distance to our sphere

		pos += dist*dir;

		// We hit something!
		if (dist < EPSILON)
			return pos;

		// Went too far
		if (dist > MAX_DIST)
			return vec3(MAX_DIST);
		
	}

	// We ran out of steps
	return vec3(MAX_DIST);
}

vec3 rayDirection(float fov, vec2 size, vec2 fragCoord) 
{
	vec2 xy = fragCoord - size / 2.0; // Normalize coordinates
	float z = size.y / tan(radians(fov) / 2.0);

	return normalize(vec3(xy, -z));
}

// Get the normal for our point on the scene
vec3 estimateNormal(vec3 p) 
{
	return normalize(vec3(
		sdf_scene(vec3(p.x + EPSILON, p.y, p.z)) - sdf_scene(vec3(p.x - EPSILON, p.y, p.z)),
		sdf_scene(vec3(p.x, p.y + EPSILON, p.z)) - sdf_scene(vec3(p.x, p.y - EPSILON, p.z)),
		sdf_scene(vec3(p.x, p.y, p.z  + EPSILON)) - sdf_scene(vec3(p.x, p.y, p.z - EPSILON))
	));
}

vec3 phongShade(vec3 pos, vec3 dir)
{
	vec3 hitPos = march(pos, dir);
	vec3 normal = estimateNormal(hitPos); // Normal // N
	vec3 incidentVec = normalize(pos - hitPos); // Normalize from origin (our viewer) // V

	float shininess = 0.001;
	float specInf = 0.01;
	float diffInf = 0.8;
	float ambInf = 0.1;

	float diff = 0.0;
	float spec = 0.0;
	for (int i = 0; i < LIGHT_COUNT; i++)
	{
		vec3 lightVec = normalize(lights[i].pos - hitPos); // Vector to light // L
		vec3 reflectVec = normalize(reflect(-lightVec, normal));

		// Calculate diffuse component
		diff += max(dot(lightVec, normal), 0.0);

		// Calculate specular component
		float specAngle = max(dot(reflectVec, incidentVec), 0.0);
		spec += pow(specAngle, shininess/4.0);

	}
	float amb = 1.0;

	vec3 color = (vec3(diff)*diffInf)+(vec3(spec)*specInf)+(vec3(amb)*ambInf);

	return color;
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
	
	color = march(vec3(0.0, 0.0, 2.0), rayDirection(fieldOfView, iResolution, gl_FragCoord.xy));
	color = march(vec3(eye), rayDirection(fieldOfView, iResolution, gl_FragCoord.xy));

	color = phongShade(vec3(eye), rayDirection(fieldOfView, iResolution, gl_FragCoord.xy));

	gl_FragColor = vec4(color, 1.0);
}


`; // For da JS