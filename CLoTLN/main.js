let stages = document.getElementsByClassName("stage");
let cIndex = 0;
for (let i = 0; i < stages.length; i++) {
cIndex += 0.5;
stages[i].style.color = cIndex > 35 ? `hsl(300,${Math.max(0,975-cIndex*25)}%,${Math.max(0, 250-cIndex*5)}%)` : `hsl(${Math.max(0,cIndex*10-50)}, 100%, ${Math.max(75, 100-cIndex*5)}%)`;
}
