// UI Logic
const gameContainer = document.getElementById('game-container');
const uiLayer = document.getElementById('ui-layer');
const staticResume = document.getElementById('static-resume');

document.getElementById('resume-btn').addEventListener('click', () => {
    gameContainer.style.display = 'none';
    uiLayer.style.display = 'none';
    staticResume.style.display = 'block';
});

document.getElementById('back-to-game-btn').addEventListener('click', () => {
    if (window.innerWidth >= 768) {
        gameContainer.style.display = 'block';
        uiLayer.style.display = 'block';
        staticResume.style.display = 'none';
    }
});

// Initial setup for mobile/desktop
function checkScreenSize() {
    if (window.innerWidth < 768) {
        gameContainer.style.display = 'none';
        uiLayer.style.display = 'none';
        staticResume.style.display = 'block';
    }
}
window.addEventListener('resize', checkScreenSize);
checkScreenSize();

// Game Initialization
kaplay({
    root: document.getElementById('game-container'),
    background: [13, 17, 23], // GitHub Dark Theme background (#0d1117)
    width: 800,
    height: 600,
    letterbox: true, // Maintain fixed aspect ratio
    pixelDensity: 2,
    texFilter: 'nearest', // Prevent sub-pixel bleeding
    global: true, // Make kaplay functions global
});

// Load the sprite sheet and environmental sprites
loadSprite("player", "assets/player_sheet.png", {
    sliceX: 4, // Number of horizontal frames
    sliceY: 4, // Number of vertical frames
    anims: {
        "idle": { from: 0, to: 3, loop: true },
        "run": { from: 4, to: 7, loop: true },
    },
});

loadSprite("station", "assets/station.png");
loadSprite("flask", "assets/flask.png");

// Generate placeholder sprites for floor/wall using canvas
function createColorSprite(id, color, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
    loadSprite(id, canvas.toDataURL());
}

// Floor/Wall tiles
createColorSprite("floor", "#1a2332", 64, 64);
createColorSprite("wall", "#30363d", 64, 64);


// Level Map Definition
const mapLayout = [
    "========================",
    "=                      =",
    "=   A              T   =",
    "=                      =",
    "=                      =",
    "=                      =",
    "=          @           =",
    "=                      =",
    "=                      =",
    "=                      =",
    "=   P      R      C    =",
    "=                      =",
    "========================",
];

const levelConf = {
    tileWidth: 64,
    tileHeight: 64,
    tiles: {
        "=": () => [
            sprite("wall"),
            area(),
            body({ isStatic: true }),
            "wall"
        ],
        "@": () => [
            sprite("player", { anim: "idle" }), // Start with idle animation
            area({ scale: 0.8 }), // Slightly smaller hitbox for better feel
            body(),
            anchor("center"),
            "player"
        ],
        "A": () => [
            sprite("station"),
            area(),
            body({ isStatic: true }),
            anchor("center"),
            "project",
            "aura_ai",
            {
                title: "AURA AI",
                description: "Analyzing PDFs with Agentic AI. Press 'E' to View Code.",
                repo: "https://github.com/alanl7l7"
            }
        ],
        "T": () => [
            sprite("station"),
            area(),
            body({ isStatic: true }),
            anchor("center"),
            "project",
            "tender_system",
            {
                title: "TENDER SYSTEM",
                description: "React/Postgres/Supabase integration. Press 'E' to View Code.",
                repo: "https://github.com/alanl7l7"
            }
        ],
        "P": () => [
            sprite("flask"),
            area(),
            anchor("center"),
            "skill",
            { name: "Python", xp: 80 }
        ],
        "R": () => [
            sprite("flask"),
            area(),
            anchor("center"),
            "skill",
            { name: "React", xp: 70 }
        ],
        "C": () => [
            sprite("flask"),
            area(),
            anchor("center"),
            "skill",
            { name: "Chemistry", xp: 95 }
        ]
    }
};

// Main Scene
scene("main", () => {
    // Draw floor everywhere within map bounds
    for (let i = 0; i < mapLayout.length; i++) {
        for (let j = 0; j < mapLayout[i].length; j++) {
            add([
                sprite("floor"),
                pos(j * 64, i * 64)
            ]);
        }
    }

    const level = addLevel(mapLayout, levelConf);

    // Get player reference
    let player = level.get("player")[0];
    if (!player) {
        const players = get("player", { recursive: true });
        if (players && players.length > 0) player = players[0];
    }
    if (!player) {
        const players = get("player");
        if (players && players.length > 0) player = players[0];
    }

    const SPEED = 250;

    // Camera follow player
    player.onUpdate(() => {
        camPos(player.pos);
    });

    // Movement controls (WASD and Arrows) with State Machine
    onKeyDown(["left", "a"], () => {
        player.move(-SPEED, 0);
        player.flipX = true; // Face left
        if (player.curAnim() !== "run") player.play("run");
    });

    onKeyDown(["right", "d"], () => {
        player.move(SPEED, 0);
        player.flipX = false; // Face right
        if (player.curAnim() !== "run") player.play("run");
    });

    onKeyDown(["up", "w"], () => {
        player.move(0, -SPEED);
        if (player.curAnim() !== "run") player.play("run");
    });

    onKeyDown(["down", "s"], () => {
        player.move(0, SPEED);
        if (player.curAnim() !== "run") player.play("run");
    });

    onKeyRelease(() => {
        if (!isKeyDown("left") && !isKeyDown("right") && !isKeyDown("up") && !isKeyDown("down") &&
            !isKeyDown("a") && !isKeyDown("d") && !isKeyDown("w") && !isKeyDown("s")) {
            player.play("idle");
        }
    });

    // Dialog system logic
    const dialogContainer = document.getElementById("dialog-container");
    const dialogTitle = document.getElementById("dialog-title");
    const dialogText = document.getElementById("dialog-text");
    let isDialogActive = false;
    let currentDialogRepo = null;
    let currentTypingInterval = null;

    // SFX setup
    const sfxToggleBtn = document.getElementById("sfx-toggle");
    let sfxEnabled = false;
    let audioCtx = null;

    sfxToggleBtn.addEventListener("click", () => {
        sfxEnabled = !sfxEnabled;
        sfxToggleBtn.innerText = sfxEnabled ? "SFX: ON" : "SFX: OFF";
        sfxToggleBtn.classList.toggle("is-success");

        // Initialize AudioContext on first user interaction if enabled
        if (sfxEnabled && !audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Play tiny blip to confirm
        if (sfxEnabled) playBlip();
    });

    function playBlip() {
        if (!sfxEnabled || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    }

    function playTypingSound() {
        if (!sfxEnabled || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        // Randomize frequency slightly for typewriter effect
        osc.frequency.setValueAtTime(600 + Math.random() * 200, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.03);
    }

    function showDialog(title, text, repoLink) {
        if (isDialogActive) return; // Prevent restarting if already active
        isDialogActive = true;
        currentDialogRepo = repoLink;
        dialogTitle.innerText = title;
        dialogText.innerText = "";
        dialogContainer.style.display = "block";

        let index = 0;
        if (currentTypingInterval) clearInterval(currentTypingInterval);

        currentTypingInterval = setInterval(() => {
            dialogText.innerText += text[index];
            if (text[index] !== ' ') {
                playTypingSound();
            }
            index++;
            if (index >= text.length) {
                clearInterval(currentTypingInterval);
            }
        }, 30); // 30ms per character
    }

    function hideDialog() {
        isDialogActive = false;
        currentDialogRepo = null;
        dialogContainer.style.display = "none";
        if (currentTypingInterval) {
            clearInterval(currentTypingInterval);
        }
    }

    // Gamification logic: Colliding with projects
    player.onCollide("project", (proj) => {
        showDialog(proj.title, proj.description, proj.repo);
    });

    // Hide dialog when moving away from a project
    player.onCollideEnd("project", () => {
        hideDialog();
    });

    // Action prompt 'E' logic
    onKeyPress("e", () => {
        if (isDialogActive && currentDialogRepo) {
            playBlip();
            window.open(currentDialogRepo, '_blank');
        }
    });

    // Skill Tree Gamification Logic: Hover effect
    const skillOverlay = document.getElementById("skill-overlay");
    const skillName = document.getElementById("skill-name");
    const skillProgress = document.getElementById("skill-progress");

    // Skill Tree Gamification Logic: Hover effect using player proximity
    let currentCloseSkill = null;
    let fillInterval = null;

    player.onUpdate(() => {
        const skills = get("skill");
        let closeSkill = null;

        for(let s of skills) {
            // Check distance between player and skill
            if (player.pos.dist(s.pos) < 64) {
                closeSkill = s;
                break;
            }
        }

        if (closeSkill) {
            if(currentCloseSkill !== closeSkill) {
                currentCloseSkill = closeSkill;
                skillOverlay.style.display = "block";
                skillName.innerText = closeSkill.name + " Lvl";

                // Animate progress bar filling up
                skillProgress.value = 0;
                let targetVal = closeSkill.xp;
                let curVal = 0;

                if (fillInterval) clearInterval(fillInterval);
                fillInterval = setInterval(() => {
                    if (curVal >= targetVal) {
                        clearInterval(fillInterval);
                    } else {
                        curVal += 5;
                        skillProgress.value = curVal;
                    }
                }, 20);
                playBlip();
            }
        } else {
            currentCloseSkill = null;
            skillOverlay.style.display = "none";
            if (fillInterval) clearInterval(fillInterval);
        }
    });

});

go("main");
