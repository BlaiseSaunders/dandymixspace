window.shaders = window.shaders || {};
window.shaders.fragmentShader = `



uniform vec3 colorA; 
uniform vec3 colorB; 
uniform vec2 iResolution;
uniform float iTime;
uniform float scalePower;
varying vec3 vUv;


/**
 * Part 2 Challenges
 * - Change the diffuse color of the sphere to be blue
 * - Change the specual color of the sphere to be green
 * - Make one of the lights pulse by having its intensity vary over time
 * - Add a third light to the scene
 */

//const int MAX_MARCHING_STEPS = 256;
const int MAX_MARCHING_STEPS = 512;
const float MIN_DIST = 0.0;
const float MAX_DIST = 100.0;
const float EPSILON = 0.0001;


// :^)
mat4 inverse(mat4 m) {
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



float sdf_sphere(vec3 rayPoint, vec3 center, float radius)
{
    return distance(rayPoint, center) - radius;
}

float sdf_plane(vec3 p, vec4 pos) // Ground plane
{
	return dot(p, pos.xyz) + pos.w; // xyz for angle, w for distance from origin
}


float sdf_box(vec3 p, vec3 b)
{
	vec3 q = abs(p) - b;
  	//float dist = sin(iTime*0.05)*3.0+2.0;
	float dist = sin(scalePower)*7.0+1.0;
	float newp = sin(dist*p.x) * sin(dist*p.y) * sin(dist*p.z);

	return sdf_sphere(p, vec3(0.0), b.x)+newp;

	//return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) + newp;
}

float opRep(vec3 p, vec3 c)
{
    vec3 q = mod(p+0.5*c,c)-0.5*c;
    return sdf_sphere(q, vec3(0.0, 0.0, 0.0), 1.0);
}






/**
 * Signed distance function for a sphere centered at the origin with radius 1.0;
 */
float sphereSDF(vec3 samplePoint) 
{
	//return opRep(samplePoint, vec3(1.0));
	return sdf_box(samplePoint, vec3(0.3));
	//return sdf_sphere(samplePoint, vec3(0.1), 1.0);
	//return length(samplePoint) - 1.0;
}


/**
 * Playing with translations
 */
float fScene(vec3 pt) 
{
	// Scale 2x along X
	vec3 scale = vec3(scalePower*2.0+1.0); // MUST BE >= 1
	mat4 S = mat4(
	vec4(scale.x, 0, 0, 0),
	vec4(0, scale.y, 0, 0),
	vec4(0, 0, scale.z, 0),
	vec4(0, 0, 0, 1));

	float t = iTime*0.8;
	mat4 Rz = mat4(
	vec4(cos(t), sin(t), 0, 0),
	vec4(-sin(t), cos(t), 0, 0),
	vec4(0, 0, 1, 0),
	vec4(0, 0, 0, 1));
	mat4 Rx = mat4(
	vec4(1, 0, 0, 0),
	vec4(0, cos(t), -sin(t), 0),
	vec4(0, sin(t), cos(t), 0),
	vec4(0, 0, 0, 1));
	vec3 coords = vec3(-0.3, -0.1, 0.0);
	mat4 T = mat4(
	vec4(1, 0, 0, coords.x),
	vec4(0, 1, 0, coords.y),
	vec4(0, 0, 1, coords.z),
	vec4(0, 0, 0, 1));

	mat4 prod = S * Rx * T;
	prod = S * T * Rx * Rz;
	//prod = T;
	mat4 inv = inverse(prod);

	vec3 new_pt = (vec4(pt, 1) * inv).xyz;

	//return min(min(sphereSDF(new_pt), sdf_sphere(pt, vec3(3.0, 0.0, 1.0), 1.0)), sdf_sphere(pt, vec3(2.0, 0.0, 1.0), 1.0));
	//return sdf_sphere(pt, vec3(0.0), 1.0);
	return min(max(min(
		sdf_sphere(pt, vec3(-0.5, 0.0, 1.0), 1.0), // Left Ball
		sdf_sphere(pt, vec3(0.5, 0.0, 1.0), 1.0)), // Right Ball
		-sdf_sphere(pt, vec3(0.0, -0.5, 1.5), 0.5)), // Intersection Ball
		sdf_plane(pt, vec4(0.0, 1.0, 0.0, 0.6))); // Ground Plane/**/
}

/**
 * Signed distance function describing the scene.
 * 
 * Absolute value of the return value indicates the distance to the surface.
 * Sign indicates whether the point is inside or outside the surface,
 * negative indicating inside.
 */
float sceneSDF(vec3 samplePoint) 
{
	return fScene(samplePoint);
}

/**
 * Return the shortest distance from the eyepoint to the scene surface along
 * the marching direction. If no part of the surface is found between start and end,
 * return end.
 * 
 * eye: the eye point, acting as the origin of the ray
 * marchingDirection: the normalized direction to march in
 * start: the starting distance away from the eye
 * end: the max distance away from the ey to march before giving up
 */
float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) 
{
	float depth = start;
	
	for (int i = 0; i < MAX_MARCHING_STEPS; i++) 
	{

		float dist = sceneSDF(eye + depth * marchingDirection);

		if (dist < EPSILON)
				return depth;

		depth += dist;

		if (depth >= end)
			return end;
	}


	return end;
}
            

/**
 * Return the normalized direction to march in from the eye point for a single pixel.
 * 
 * fieldOfView: vertical field of view in degrees
 * size: resolution of the output image
 * fragCoord: the x,y coordinate of the pixel in the output image
 */
vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) 
{
	vec2 xy = fragCoord - size / 2.0;
	float z = size.y / tan(radians(fieldOfView) / 2.0);
	return normalize(vec3(xy, -z));
}

/**
 * Using the gradient of the SDF, estimate the normal on the surface at point p.
 */
vec3 estimateNormal(vec3 p) 
{
	return normalize(vec3(
		sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
		sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
		sceneSDF(vec3(p.x, p.y, p.z  + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
	));
}


float rand(vec2 co)
{
	return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}


/**
 * Lighting contribution of a single point light source via Phong illumination.
 * 
 * The vec3 returned is the RGB color of the light's contribution.
 *
 * k_a: Ambient color
 * k_d: Diffuse color
 * k_s: Specular color
 * alpha: Shininess coefficient
 * p: position of point being lit
 * eye: the position of the camera
 * lightPos: the position of the light
 * lightIntensity: color/intensity of the light
 *
 * See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
 */
vec3 phongContribForLight(vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye,
                          vec3 lightPos, vec3 lightIntensity) 
{
	vec3 N = estimateNormal(p);
	vec3 L = normalize(lightPos - p);
	vec3 V = normalize(eye - p);
	vec3 R = normalize(reflect(-L, N));

	float dotLN = dot(L, N);
	float dotRV = dot(R, V);
	
	// Light not visible from this point on the surface
	if (dotLN < 0.0)
		return vec3(0.0, 0.0, 0.0);
	
	vec3 col;

	float SHADOW_FALLOFF = 10.0;
	float shadow = 0.0;
	float shadowRayCount = 1.0;
	for (float s = 0.0; s < shadowRayCount; s++)
	{
		vec3 shadowRayOrigin = p + N * 0.01;
		float r = rand(vec2(N.xy)) * 2.0 - 1.0;
		vec3 shadowRayDir = L + vec3(1.0 * SHADOW_FALLOFF) * r;
		float shadowRayIntersection = shortestDistanceToSurface(shadowRayOrigin, shadowRayDir, MIN_DIST, MAX_DIST);
		if (shadowRayIntersection < 0.0)
			shadow += 1.0;
	}



	// Light reflection in opposite direction as viewer, apply only diffuse
	// component
	if (dotRV < 0.0)
		lightIntensity * (k_d * dotLN);
	else
		col = lightIntensity * (k_d * dotLN + k_s * pow(dotRV, alpha));

	return mix(col, col*0.2, shadow/shadowRayCount);
}

/**
 * Lighting via Phong illumination.
 * 
 * The vec3 returned is the RGB color of that point after lighting is applied.
 * k_a: Ambient color
 * k_d: Diffuse color
 * k_s: Specular color
 * alpha: Shininess coefficient
 * p: position of point being lit
 * eye: the position of the camera
 *
 * See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
 */
vec3 phongIllumination(vec3 k_a, vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye) {
	const vec3 ambientLight = 0.3 * vec3(1.0, 1.0, 1.0);
	vec3 color = ambientLight * k_a;
	
	vec3 light1Pos = vec3(4.0 * sin(iTime),
				2.0,
				4.0 * cos(iTime));
	vec3 light1Intensity = vec3(0.4, 0.4, 0.4);
	
	color += phongContribForLight(k_d, k_s, alpha, p, eye,
					light1Pos,
					light1Intensity);
	
	vec3 light2Pos = vec3(2.0 * sin(0.37 * iTime),
	                      2.0 * cos(0.37 * iTime),
	                      2.0);
	vec3 light2Intensity = vec3(0.4, 0.4, 0.4);
	
	color += phongContribForLight(k_d, k_s, alpha, p, eye,
					light2Pos,
					light2Intensity);    
	return color;
}

/*
 * Calculate the ambient occlusion, p is point on object
 */
float ambientOcclusion(vec3 p)
{
	vec3 normie = estimateNormal(p);


	float total = 0.0;

	float depth = 0.0;

	const int AO_STEPS = 8;
	float AO_STEP_SIZE = 0.05;
	for (int i = 0; i < AO_STEPS; i++)
	{
		float dist = sceneSDF(p + depth * normie);
		
		depth += AO_STEP_SIZE;

		total += dist;
	}

	return total*0.1;
}

float AmbientOcclusion(vec3 point, vec3 normal, float stepDistance) 
{
	float occlusion = 1.0;
	for (float samples = 10.0; samples > 0.0; samples--) 
		occlusion -= (samples * stepDistance - (sceneSDF(point + normal * samples * stepDistance))) / pow(4.0, samples); // Set power for increased falloff
	return occlusion; 
}

vec3 hsv2rgb(vec3 c) 
{
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}


void main()
{
	vec3 dir = rayDirection(90.0, iResolution.xy, gl_FragCoord.xy);
	vec3 eye = vec3(0.5, 0.5, 9.0);
	float dist = shortestDistanceToSurface(eye, dir, MIN_DIST, MAX_DIST);
	
	if (dist > MAX_DIST - EPSILON) 
	{
		// Didn't hit anything
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
		return;
	}
	
	// The closest point on the surface to the eyepoint along the view ray
	vec3 p = eye + dist * dir;
	
	vec3 K_a = vec3(0.1, 0.7, 0.8); // Cyan
	vec3 K_d = vec3(0.4, 0.6, 0.3); // Green
	K_d = hsv2rgb(vec3(mod(0.6, 1.0), 1.0, 1.0)); // Green
	//K_d = hsv2rgb(vec3(mod(scalePower, 1.0), 1.0, 1.0)); // Green
	vec3 K_s = vec3(1.0, 1.0, 1.0);
	float shininess = 10.0;
	
	vec3 color = phongIllumination(K_a, K_d, K_s, shininess, p, eye);

	float ao;

	ao = AmbientOcclusion(p, estimateNormal(p), 0.5);

	color -= vec3(1.0-ao)*0.4;

	//color *= (1.0-vec3(steps/MAX_MARCHING_STEPS))
	
	gl_FragColor = vec4(color, 1.0);
}

//gl_FragColor = vec4(mix(colorA, colorB, vUv.z), 1.0);


/*

Hemispherical Ambient Occlusion approach


vec3 randomSphereDir(vec2 rnd)
{
	float s = rnd.x*PI*2.;
	float t = rnd.y*2.-1.;
	return vec3(sin(s), cos(s), t) / sqrt(1.0 + t * t);
}
vec3 randomHemisphereDir(vec3 dir, float i)
{
	vec3 v = randomSphereDir( vec2(hash(i+1.), hash(i+2.)) );
	return v * sign(dot(v, dir));
}
float ambientOcclusion( in vec3 p, in vec3 n, in float maxDist, in float falloff )
{
	const int nbIte = 32;
    const float nbIteInv = 1./float(nbIte);
    const float rad = 1.-1.*nbIteInv; //Hemispherical factor (self occlusion correction)
    
	float ao = 0.0;
    
    for( int i=0; i<nbIte; i++ )
    {
        float l = hash(float(i))*maxDist;
        vec3 rd = normalize(n+randomHemisphereDir(n, l )*rad)*l; // mix direction with the normal for self occlusion problems!
        
        ao += (l - max(map( p + rd ),0.)) / maxDist * falloff;
    }
	
    return clamp( 1.-ao*nbIteInv, 0., 1.);
}

*/



`;