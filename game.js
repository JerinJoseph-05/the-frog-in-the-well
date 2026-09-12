const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Load the stone image (We no longer need the frog.png because of the CSS frog!)
const stoneImg = new Image();
stoneImg.src = "assets/stone.png"; 

// The invisible physics hitbox for our frog
const frog = { x: canvas.width / 2, y: canvas.height - 100, width: 30, height: 30, dy: 0, dx: 0, gravity: 0.6, jumpPower: -12, speed: 6, onGround: false };
let ledges = [];
let totalClimbed = 0;          // Tracks our progress
const WIN_HEIGHT = 2000;       // How high they have to climb (in pixels) to "escape"
let isPaused = false;          // Stops the game when the popup is open
let isCutscene = false;        // Tracks if the troll jump animation is playing

function generateLedges() {
    ledges = [];
    ledges.push({ x: 0, y: canvas.height - 20, width: canvas.width, height: 20 });
    for (let i = 1; i < 60; i++) {
        ledges.push({ x: Math.random() * (canvas.width - 60), y: canvas.height - (i * 100), width: 60 + Math.random() * 40, height: 15 });
    }
}
generateLedges();

// Grab the CSS Frog from the HTML
const cssFrog = document.getElementById("cssFrog");

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ledges (using the stone image)
    ledges.forEach(ledge => {
        ctx.drawImage(stoneImg, ledge.x, ledge.y, ledge.width, ledge.height);
    });

    // Move the HTML frog to match the invisible physics hitbox
    // We adjust the X and Y slightly because of the CSS scale(0.25) we set in the HTML
    cssFrog.style.left = (frog.x - 15) + "px"; 
    cssFrog.style.top = (frog.y - 10) + "px";
}

function update() {
    // --- CUTSCENE LOGIC ---
    if (isCutscene) {
        frog.y += frog.dy; // The frog flies up
        
        // Let it fly way up into the "sky" before the cruel realization
        if (frog.y < -300) {
            
            // THE REALITY CHECK: Snap back to a dark well color
            const randomColors = ["#1a252f", "#2c0e0e", "#0e2c14", "#1a1a2e", "#29152b"];
            canvas.style.backgroundColor = randomColors[Math.floor(Math.random() * randomColors.length)];
            
            // Reset the world
            totalClimbed = 0;
            generateLedges();
            
            // Plop the frog back at the top of the screen so it falls down into the "new" well
            frog.y = -50;
            frog.dy = 2; // A slow, sad drop back down
            
            // End the cutscene so normal physics take over again
            isCutscene = false;
        }
        return; // Skip all other normal physics during the cutscene
    }
    // --- END CUTSCENE LOGIC ---

    if (isPaused) return; // Don't run physics if a popup is showing

    frog.x += frog.dx;
    if (frog.x > canvas.width) frog.x = 0;
    if (frog.x + frog.width < 0) frog.x = canvas.width;

    frog.dy += frog.gravity;
    frog.y += frog.dy;
    frog.onGround = false;

    ledges.forEach(ledge => {
        if (frog.dy > 0 && frog.x < ledge.x + ledge.width && frog.x + frog.width > ledge.x && frog.y + frog.height > ledge.y && frog.y + frog.height < ledge.y + frog.dy + 2) {
            frog.onGround = true;
            frog.dy = 0;
            frog.y = ledge.y - frog.height;
        }
    });

    // Camera follow & climb tracking
    if (frog.y < canvas.height / 2) {
        let difference = (canvas.height / 2) - frog.y;
        frog.y += difference;
        totalClimbed += difference; // Add to our total score!
        
        ledges.forEach(ledge => ledge.y += difference);
    }
    
    // Check if they "escaped"
    if (totalClimbed >= WIN_HEIGHT) {
        triggerFakeWin();
    }

    // Death drop
    if (frog.y > canvas.height) {
        frog.y = canvas.height - 100;
        frog.dy = 0;
        totalClimbed = 0; // Reset progress if they fall!
        generateLedges();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// THE TROLL WIN LOGIC
function triggerFakeWin() {
    isPaused = true;
    document.getElementById("winModal").classList.remove("hidden");
}

document.getElementById("yesBtn").addEventListener("click", () => {
    // 1. Hide the modal
    document.getElementById("winModal").classList.add("hidden");
    
    // 2. Start the cutscene!
    isCutscene = true;
    isPaused = false;
    
    // 3. Give the frog a massive upward boost to shoot out of the well
    frog.dy = -20; 
    
    // 4. THE FALSE HOPE: Change the well to a beautiful sky blue!
    canvas.style.backgroundColor = "#87CEEB"; 
});

window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && frog.onGround) frog.dy = frog.jumpPower; 
    if (e.code === "ArrowLeft") frog.dx = -frog.speed;
    if (e.code === "ArrowRight") frog.dx = frog.speed;
});
window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "ArrowRight") frog.dx = 0;
});

gameLoop();

// --- THE QUIT TROLL LOGIC ---

const quitModal = document.getElementById("quitModal");
const fakeYesBtn = document.getElementById("fakeYesBtn");
const noBtn = document.getElementById("noBtn");

// 1. Listen for Escape (Fake Quit) and Alt+Escape (Real Quit)
window.addEventListener("keydown", (e) => {
    // REAL QUIT (Alt + Esc)
    if (e.code === "Escape" && e.altKey) {
        document.body.innerHTML = "<h1 style='color:white; text-align:center; font-family:sans-serif; margin-top:40vh;'>You finally escaped the matrix.</h1>";
        return; // Stops everything
    }
    
    // FAKE QUIT (Just Esc)
    if (e.code === "Escape" && !e.altKey) {
        isPaused = true;
        quitModal.classList.remove("hidden");
        // Reset the fake button's position when opening
        fakeYesBtn.style.position = "static"; 
    }
});

// 2. The Unclickable "Yes" Button
fakeYesBtn.addEventListener("mouseover", () => {
    // Change position to fixed so it can fly anywhere on the screen
    fakeYesBtn.style.position = "fixed";
    
    // Calculate a random spot on the screen
    const maxX = window.innerWidth - fakeYesBtn.offsetWidth;
    const maxY = window.innerHeight - fakeYesBtn.offsetHeight;
    
    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);
    
    // Move it!
    fakeYesBtn.style.left = randomX + "px";
    fakeYesBtn.style.top = randomY + "px";
});

// 3. The "No" Button (Go back to the game)
noBtn.addEventListener("click", () => {
    quitModal.classList.add("hidden");
    isPaused = false;
});