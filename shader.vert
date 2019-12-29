window.shaders = window.shaders || {};
window.shaders.vertexShader = `




varying vec3 vUv; 

void main() 
{
	vUv = position; 

	// Vert boi

	vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * modelViewPosition; 
}

`;