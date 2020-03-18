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


const int MAX_MARCHING_STEPS = 512;
//const int MAX_MARCHING_STEPS = 256;
const float MIN_DIST = 0.0;
const float MAX_DIST = 60.0;
const float EPSILON = 0.0001;



/*
 * General helper functions
 */
// :^)
mat4 inverse(mat4 m)
{
	float
	a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
	a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
	a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
	a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

	b00 = a00 * a11 - a01 * a10,
	b01 = a00 * a12 - a02 * a10,
	b02 = a00 * a13 - a03 * a10,
	b03 = a01 * a12 - a02 * a11,
	b04 = a01 * a13 - a03 * a11,
	b05 = a02 * a13 - a03 * a12,
	b06 = a20 * a31 - a21 * a30,
	b07 = a20 * a32 - a22 * a30,
	b08 = a20 * a33 - a23 * a30,
	b09 = a21 * a32 - a22 * a31,
	b10 = a21 * a33 - a23 * a31,
	b11 = a22 * a33 - a23 * a32,

	det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

	return mat4(
		a11 * b11 - a12 * b10 + a13 * b09,
		a02 * b10 - a01 * b11 - a03 * b09,
		a31 * b05 - a32 * b04 + a33 * b03,
		a22 * b04 - a21 * b05 - a23 * b03,
		a12 * b08 - a10 * b11 - a13 * b07,
		a00 * b11 - a02 * b08 + a03 * b07,
		a32 * b02 - a30 * b05 - a33 * b01,
		a20 * b05 - a22 * b02 + a23 * b01,
		a10 * b10 - a11 * b08 + a13 * b06,
		a01 * b08 - a00 * b10 - a03 * b06,
		a30 * b04 - a31 * b02 + a33 * b00,
		a21 * b02 - a20 * b04 - a23 * b00,
		a11 * b07 - a10 * b09 - a12 * b06,
		a00 * b09 - a01 * b07 + a02 * b06,
		a31 * b01 - a30 * b03 - a32 * b00,
		a20 * b03 - a21 * b01 + a22 * b00) / det;
}

// Cheap rand helper function
float rand(vec2 co)
{
	return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

// Convert a HSV vec3 to RGB
vec3 hsv2rgb(vec3 c) 
{
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}



/*
 * Some Translation, rotation and scale code
 */
vec3 rotate_x_point(vec3 pt, float t) 
{
	mat4 Rx = mat4(
	vec4(1, 0, 0, 0),
	vec4(0, cos(t), -sin(t), 0),
	vec4(0, sin(t), cos(t), 0),
	vec4(0, 0, 0, 1));

	mat4 inv = inverse(Rx);
	vec3 new_pt = (vec4(pt, 1) * inv).xyz;
	return new_pt;
}
vec3 rotate_y_point(vec3 pt, float t) 
{
	mat4 Ry = mat4(
	vec4(cos(t), 0, sin(t), 0),
	vec4(0, 1, 0, 0),
	vec4(-sin(t), 0, cos(t), 0),
	vec4(0, 0, 0, 1));

	mat4 inv = inverse(Ry);
	vec3 new_pt = (vec4(pt, 1) * inv).xyz;
	return new_pt;
}
vec3 rotate_y_x_point(vec3 pt, float x, float y) // TODO: Optimize
{
	mat4 Rx = mat4(
	vec4(1, 0, 0, 0),
	vec4(0, cos(x), -sin(x), 0),
	vec4(0, sin(x), cos(x), 0),
	vec4(0, 0, 0, 1));

	mat4 Ry = mat4(
	vec4(cos(y), 0, sin(y), 0),
	vec4(0, 1, 0, 0),
	vec4(-sin(y), 0, cos(y), 0),
	vec4(0, 0, 0, 1));

	mat4 inv = inverse(Ry*Rx);
	vec3 new_pt = (vec4(pt, 1) * inv).xyz;
	return new_pt;	
}

vec3 translate_point(vec3 pt, vec3 trans) 
{
	vec3 coords = trans;
	mat4 T = mat4(
	vec4(1, 0, 0, coords.x),
	vec4(0, 1, 0, coords.y),
	vec4(0, 0, 1, coords.z),
	vec4(0, 0, 0, 1));

	mat4 inv = inverse(T);
	vec3 new_pt = (vec4(pt, 1) * inv).xyz;
	return new_pt;
}


vec3 twist_point(vec3 p, float k)
{
    float c = cos(k*p.y);
    float s = sin(k*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xz,p.y);
    return q;
}


/*
 * Our distance primitive definitions
 */
float sdf_plane(vec3 pos, vec4 off)
{
	// Off must be normalized
	return dot(pos, off.xyz) + off.w;
}
float sdf_sphere(vec3 pos, float size)
{
	return length(pos)-size;
}

float sdf_box(vec3 pos, vec3 dim)
{
  vec3 q = abs(pos) - dim;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}


float repeat(float d, float domain)
{
    return mod(d, domain)-domain/2.0;
}

float sdf_abstract(vec3 pos, float off)
{
	vec3 z = pos;
	if(z.x+z.y < 0.0) z.xy = -z.yx; // fold 1
	if(z.x+z.z < 0.0) z.xz = -z.zx; // fold 2
	if(z.y+z.z < 0.0) z.zy = -z.yz; // fold 3
	pos = z;


	vec3 boxpt = translate_point(pos, vec3(cos(2.0*iTime+off)*0.3, cos(2.0*iTime+0.5+off)*0.2, 0.0));
	boxpt = rotate_x_point(boxpt, sin(iTime+off));
	boxpt = rotate_y_point(boxpt, cos(iTime+off));
	vec3 c = vec3(4.0);

	float box = sdf_box(boxpt, vec3(0.7));


	return box;
}


/*
 * Scene generation function
 */

float lightSize = 0.1;

// Add light count
#define NON_LIGHT_OBJECT_COUNT 8
#define OBJECT_COUNT 8 // Manually add for amount of lights
float distances[OBJECT_COUNT];
vec2 sdf_scene(vec3 pos)
{

	vec3 leftPt = translate_point(pos, vec3(0.5, 0.0, 0.0));
	vec3 rightPt = translate_point(pos, vec3(-0.5, 0.0, 0.0));

	distances[0] = sdf_plane(pos, vec4(0.0, 1.0, 0.0, 5.0)); // Our floor
	distances[1] = sdf_plane(pos, vec4(0.0, 0.0, 1.0, 20.0)); // Backing plane
	distances[2] = sdf_plane(pos, vec4(1.0, 0.0, 0.0, 20.0)); // Backing plane
	distances[3] = sdf_plane(pos, vec4(-1.0, 0.0, 0.0, 20.0)); // Backing plane
	distances[4] = sdf_plane(pos, vec4(0.0, -1.0, 0.0, 20.0)); // Backing plane
	distances[5] = sdf_plane(pos, vec4(0.0, 0.0, -1.0, 20.0)); // Roof
	distances[6] = sdf_abstract(leftPt, 0.0); // Abstract shape
	distances[7] = sdf_abstract(rightPt, 0.5); // Abstract shape
	//distances[1] = sdf_fractal(pos); // Abstract shape

	// Add in the lights
	//for (int i = 0; i < LIGHT_COUNT; i++)
	//	distances[NON_LIGHT_OBJECT_COUNT+i] = sdf_sphere(translate_point(pos, lights[i].pos), lightSize);

	// Calculate minimum over an array of points
	float smallest_i = -1.0;
	float smallest_point = MAX_DIST+1.0;
	for (int i = 0; i < OBJECT_COUNT; i++)
		if (distances[i] < smallest_point)
		{
			smallest_point = distances[i];
			smallest_i = float(i);
		}

	return vec2(smallest_point, smallest_i); // Return the smallest point of all our objects
}


/*
 * Ray Marching core functions live here
 */
vec3 getDistToScene(vec3 viewer, vec3 marchDir, float start, float end) 
{
	float depth = start;
	int steps = 0;
	
	for (int i = 0; i < MAX_MARCHING_STEPS; i++) 
	{
		vec2 dist = sdf_scene(viewer + depth * marchDir);

		if (dist.x < EPSILON) // We hit something! (or close enough lol)
			return vec3(depth, dist.y, float(i));

		depth += dist.x;

		if (depth >= end) // Marched to the end, didn't hit anything
			return vec3(end, -1.0, float(i));
		
		steps = i;
	}


	return vec3(end, -1.0, float(steps));
}


// Get a ray direction based off of the pixel coordinate
vec3 rayDirection(float fov, vec2 size, vec2 fragCoord, vec3 rot) 
{
	vec2 xy = fragCoord - size / 2.0; // Normalize coordinates
	float z = size.y / tan(radians(fov) / 2.0);

	
	return rotate_y_x_point(normalize(vec3(xy, -z)), rot.x, rot.y); // TODO: Have it not be shit
}



// Get the normal for our point on the scene
vec3 estimateNormal(vec3 p) 
{
	return normalize(vec3(
		sdf_scene(vec3(p.x + EPSILON, p.y, p.z)).x - sdf_scene(vec3(p.x - EPSILON, p.y, p.z)).x,
		sdf_scene(vec3(p.x, p.y + EPSILON, p.z)).x - sdf_scene(vec3(p.x, p.y - EPSILON, p.z)).x,
		sdf_scene(vec3(p.x, p.y, p.z  + EPSILON)).x - sdf_scene(vec3(p.x, p.y, p.z - EPSILON)).x
	));
}

/*
 * Standard marching code, except looking for the nearest spot we graze on the scene
 * for penumbra puproses
 */
vec2 shadowCheck(vec3 viewer, vec3 marchDir, float start, float end) 
{
	float depth = start;
	
	float nearestHit = MAX_DIST;


	for (int i = 0; i < MAX_MARCHING_STEPS; i++) 
	{
		vec2 dist = sdf_scene(viewer + depth * marchDir);
		
		if (dist.x < nearestHit)
			nearestHit = dist.x;

		if (dist.x < EPSILON) // We hit something! (or close enough lol)
			return vec2(depth, nearestHit);

		depth += dist.x;

		if (depth >= end) // Marched to the end, didn't hit anything
			return vec2(end, nearestHit);
	}


	return vec2(end, nearestHit);
}



#define SHADOW_EPSILON 0.3
#define SHADOW_FALLOFF 0.0001
float calculateShadow(vec3 p)
{
	float shadowStrength = 0.0;
	vec3 N = estimateNormal(p);

	for (int i = 0; i < LIGHT_COUNT; i++)
	{
		vec3 lightVec = normalize(lights[i].pos - p); // Vector to light // L

		vec2 shadowHit = shadowCheck(p + N, normalize(lights[i].pos) + vec3(1.0 * SHADOW_FALLOFF), MIN_DIST, MAX_DIST);
		float dist = shadowHit.x;
		float closestDist = shadowHit.y;

		float diff = dist - distance(p, lights[i].pos);
		if (diff <= 0.0) // If we're in the shadow
			shadowStrength += 1.0/float(LIGHT_COUNT);
			
		else  // TODO: Solve mathematically
		{
			float off = SHADOW_EPSILON - closestDist;
			if (off > 0.0)
				shadowStrength += off;
				
		}

		

	}
	return shadowStrength;
}

// Calculate standard phong lighting for all lights and return a colour contribution
vec3 phongContribution(vec3 p, vec3 viewer, float id, int shadowCalc)
{
	vec3 normal = estimateNormal(p); // N
	vec3 incidentVec = normalize(viewer - p); // Normalize from origin (our viewer) // V

	float shininess = 0.0001;
	float specInf = 0.001;
	float diffInf = 0.5;
	float ambInf = 0.01;

	vec3 outCol = vec3(0.0);

	for (int i = 0; i < LIGHT_COUNT; i++)
	{
		float diff = 0.0;
		float spec = 0.0;
		float scaleDown = 1.0;
		vec3 amb = vec3(0.0);

		vec3 lightVec = normalize(lights[i].pos - p); // Vector to light // L
		vec3 reflectVec = normalize(reflect(-lightVec, normal));

		// Check if we want to calculate shadows
		if (shadowCalc == 1)
		{


			// Check if we are in view of light
			vec2 march = shadowCheck(p + lightVec*0.1, lightVec, MIN_DIST, MAX_DIST);
			float distToSceneLightDir = march.x;
			float distToLight = distance(p, lights[i].pos);

			float lightTolerance = 0.2;
			float penTolerance = lightTolerance+0.7;
			if (distToSceneLightDir < distToLight-lightSize-lightTolerance)
				continue;
			else if (distToSceneLightDir < distToLight-lightSize-penTolerance)
				scaleDown -= march.y;
		}



		amb = lights[i].colour*ambInf; // Calculate ambient contribution

		// Calculate diffuse component
		diff += max(dot(lightVec, normal), 0.0);

		// Calculate specular component
		float specAngle = max(dot(reflectVec, incidentVec), 0.0);
		spec += pow(specAngle, shininess/4.0) * specInf;

		// Scale diff by distance from light // FAILED ATTEMPT AT LIGHTING FALLOFF
		/*float scalar = (distance(lights[i].pos, p)/lights[i].dist);
		spec -= spec*scalar;
		diff -= diff*scalar;
		amb -= amb*scalar;*/


		outCol += (((diff + spec)*lights[i].colour) + amb)*scaleDown;
	}

	return outCol;
}



// Shadow strengths calculated in main
float shadowStrength = 0.1;
float fogStrength = 0.1;
float stepEffectStrength = 1.0;

vec3 getColour(vec3 hitPos, vec3 viewer, float id, int shadowCalc)
{
	vec3 color = vec3(0.0);

	// If we have a glossy object
	vec3 prevPoint = eye;
	if (id == float(NON_LIGHT_OBJECT_COUNT-1))
	{
		vec3 normal = estimateNormal(hitPos); // N
		vec3 incidentVec = normalize(hitPos - prevPoint); // Normalize from origin (our viewer point) // V

		vec3 bounceAngle = normalize(reflect(incidentVec, normal));
		vec3 bounceHit = getDistToScene(hitPos + 0.1 * bounceAngle, bounceAngle, MIN_DIST, MAX_DIST);
		float bounceDist = bounceHit.x;
		float bounceId = bounceHit.y;
		float bounceSteps = bounceHit.z;

		vec3 bounceHitPos = hitPos + bounceDist * bounceAngle;

		vec3 bounceColor = phongContribution(bounceHitPos, hitPos, bounceId, shadowCalc);

		color = bounceColor;
		prevPoint = hitPos;
		hitPos = bounceHitPos;
	}
	else // Otherwise just use standard phong
		color += phongContribution(hitPos, viewer, id, shadowCalc);

 

	return color;
}

vec3 fastRender(vec3 dir, vec3 eye)
{
	// Cast a ray from our eye (where we are) (set from JS) to the scene, get the dist	
	// ID of the object we've hit (if any)
	vec3 hit = getDistToScene(eye, dir, MIN_DIST, MAX_DIST);
	float dist = hit.x;
	float id = hit.y;
	float steps = hit.z;

	vec3 color = vec3(0.0);

	// Check to make sure we hit something
	if (hit.y == -1.0) 
		return vec3(0.0, 0.0, 0.0);


	// The point our view ray hit
	vec3 hitPos = eye + dist * dir;
	

	color = getColour(hitPos, eye, id, shadowCalcPhong);
	// Attenuate to the distance (fog)
	//color -= dist/MAX_DIST*fogStrength;

	//color -= vec3(steps/float(MAX_MARCHING_STEPS))*stepEffectStrength;

	/*if (id != 6.0 && id != 7.0) // It's da floor
		color = color*0.01;*/

	return color;
}


// You tell me :^)
void main()
{
	// Get the angle of our ray
	vec3 dir = rayDirection(fieldOfView, iResolution.xy, gl_FragCoord.xy, vec3(eyeX, eyeY, 0.0));

	vec3 color = vec3(0.0);

	color = fastRender(dir, eye);
	

	gl_FragColor = vec4(color, 1.0);
}


`; // For da JS