// Initialize game values using break_eternity.js (Decimal)
let game = {
    numbers: new Decimal(0),
    clickValue: new Decimal(1),
    upgrade1Cost: new Decimal(10),
};

// Target elements from our HTML
const numberCountEl = document.getElementById("number-count");
const upgradeBtn1 = document.getElementById("upgrade-btn-1");
const upgradeCost1El = document.getElementById("upgrade-cost-1");

// A standard incremental game function to update visual numbers smoothly
function updateDisplay() {
    // break_eternity automatically handles massive numbers elegantly via .toString()
    numberCountEl.innerText = game.numbers.toString();
    upgradeCost1El.innerText = game.upgrade1Cost.toString();
}

// Click header action (for early game testing)
document.querySelector(".game-header").addEventListener("click", () => {
    game.numbers = game.numbers.add(game.clickValue);
    updateDisplay();
});

// Upgrade purchasing logic
upgradeBtn1.addEventListener("click", () => {
    // check if players numbers are Greater Than or Equal to (gte) the cost
    if (game.numbers.gte(game.upgrade1Cost)) {
        game.numbers = game.numbers.sub(game.upgrade1Cost); // Subtract cost
        game.clickValue = game.clickValue.add(1);           // Buff clicking
        
        // Increase the upgrade cost exponentially for Googology scale!
        game.upgrade1Cost = game.upgrade1Cost.mul(1.5).floor(); 
        
        updateDisplay();
    }
});

// Initial screen layout render on launch
updateDisplay();
