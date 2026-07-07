// I use typin_ to help me lmao

const PHI = (1 + Math.sqrt(5)) / 2;

appendInput = function(stuff) {
    calcInput.value += stuff;
}

calcInput.onkeydown = function(e) {
	// console.log(e.key);
	if (e.key != "Enter") return;
	document.getElementById("calcOutput").innerHTML = Number(eval(calcInput.value).toFixed(10));
}
