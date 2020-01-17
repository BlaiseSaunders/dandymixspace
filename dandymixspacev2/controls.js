var xSpeed = 0.05;
var ySpeed = 0.05;
var zSpeed = 0.05;
var yRotSpeed = 0.05;

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) 
{
	var keyCode = event.code;

	switch (keyCode)
	{
		case 'KeyA':
			window.x -= xSpeed;
			break;
		case 'KeyD':
			window.x += xSpeed;
			break;
		case 'KeyW':
			window.z -= zSpeed;
			break;
		case 'KeyS':
			window.z += zSpeed;
			break;
		case 'KeyE':
			window.y -= ySpeed;
			break;
		case 'KeyQ':
			window.y += ySpeed;
			break;
		case 'ArrowLeft':
			window.yrot -= yRotSpeed;
			break;
		case 'ArrowRight':
			window.yrot += yRotSpeed;
			break;
	}

	console.log("Updated pos, x: "+window.x+" y: "+window.y);
    
};