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
	numSmall = Number(math.evaluate(transform).toFixed(10));
	if (numSmall < 1e+10) {
    	document.getElementById("calcOutput").innerHTML = numSmall;
  	}
	if (numSmall >= 1e+10 && numSmall < 1e+300) {
    	numSmall = numSmall.toExponential(6);
		mul = Number(numSmall.slice(0,numSmall.indexOf("e")));
		pow = Number(numSmall.slice(numSmall.indexOf("e")+2));
		document.getElementById("calcOutput").innerHTML = `${mul}×10^${pow}`;
  	}
}
