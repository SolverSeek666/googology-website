// I use typin_ to help me lmao

appendInput = function(stuff) {
    calcInput.value += stuff;
}

calcInput.onkeydown = function(e) {
	// console.log(e.key);
	if (e.key != "Enter") return;
	transform = calcInput.value
	transform = transform.replaceAll("π", "pi");
	transform = transform.replaceAll("ϕ", "phi");
	transform = transform.replaceAll("∞", "Infinity");
	transform = transform.replaceAll("√", "nthRoot");
    transform = transform.replaceAll("ln", "log");
	transform = transform.replaceAll("Γ", "gamma");
	document.getElementById("calcOutput").innerHTML = Number(math.evaluate(transform).toFixed(10));
}
