// ==========================================
// PROJECTS RENDER LOGIC
// ==========================================
const containerProjects = document.getElementById('container-projects');

function renderProjects() {
    const myProjects = window.myProjects;
    if (!containerProjects || !myProjects) return;

    containerProjects.innerHTML = myProjects.map(project => {
        const tagsHTML = project.tags.map(tag => {
            let tagClass = "sys-tag secondary";
            const tagNormalized = tag.toLowerCase();
            if (tagNormalized.includes('react') || tagNormalized.includes('nextjs')) {
                tagClass = "sys-tag blue";
            } else if (tagNormalized.includes('ai') || tagNormalized.includes('web3') || tagNormalized.includes('python')) {
                tagClass = "sys-tag primary";
            }
            return `<span class="${tagClass}">${tag}</span>`;
        }).join('');

        const imagesList = project.imagens || [];
        let projectArtHTML = '';
        if (imagesList.length > 0) {
            const slidesHTML = imagesList.map((img, index) => `
                <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                    <img src="static/img/${img}" alt="Screen ${index + 1} of ${project.titulo}">
                </div>
            `).join('');
            
            projectArtHTML = `
                <div class="project-art carousel-container">
                    <div class="carousel-track">
                        ${slidesHTML}
                    </div>
                    <button class="carousel-btn btn-prev" aria-label="Previous Slide">&lt;</button>
                    <button class="carousel-btn btn-next" aria-label="Next Slide">&gt;</button>
                </div>
            `;
        }

        let btnDemoHTML = '';
        if (project.linkDemo && project.linkDemo !== '#' && project.linkDemo.trim() !== '') {
            btnDemoHTML = `<a href="${project.linkDemo}" target="_blank" class="project-link"><i class='bx bx-link-external'></i> VISIT SITE</a>`;
        }

        let btnCodeHTML = '';
        if (project.linkCodigo && project.linkCodigo !== '#' && project.linkCodigo.trim() !== '') {
            btnCodeHTML = `<a href="${project.linkCodigo}" target="_blank" class="project-link" style="margin-right: 15px;"><i class='bx bx-code-alt'></i> CODE</a>`;
        }

        return `
            <div class="brutalist-card project-card" style="--accent-color: ${project.corAccent || 'var(--cor-primary)'}">
                <div class="card-header">
                    <span class="sys-folder font-pixel">PROJECT_${project.id}.EXE</span>
                    <div class="header-controls"><i class='bx bx-x'></i></div>
                </div>
                <div class="card-body">
                    <h3>${project.titulo}</h3>
                    <p style="margin-bottom: 1rem; font-size: 0.9rem;">${project.descricao}</p>
                    ${projectArtHTML}
                    <div class="tag-grid tiny" style="margin-bottom: 20px;">
                        ${tagsHTML}
                    </div>
                    <div class="project-actions">
                        ${btnCodeHTML}
                        ${btnDemoHTML}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// THEME TOGGLE LOGIC
// ==========================================
function initThemeMenu() {
    const btnTheme = document.querySelector('.theme-toggle-btn');
    if (!btnTheme) return;
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateBtnIcon(btnTheme, savedTheme);

    btnTheme.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateBtnIcon(btnTheme, newTheme);
    });
}

function updateBtnIcon(btn, theme) {
    const icon = btn.querySelector('i');
    if (!icon) return;
    icon.className = theme === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
}

// ==========================================
// BRUTALIST MINI-GAME LOGIC (ANIME/LEGENDARY TIERS & DYNAMIC SPEED)
// ==========================================
function initMiniGame() {
    const canvas = document.getElementById('snakeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Grid Setup
    const gridSize = 15;
    const tileCount = canvas.width / gridSize;
    
    let snake = [];
    let velocity = { x: 0, y: 0 };
    let apple = { x: 15, y: 15 };
    let score = 0;
    let gameLoop;
    let isPlaying = false;
    let currentSpeed = 100; // Starting speed in ms
    
    const overlay = document.getElementById('gameOverlay');
    const startBtn = document.getElementById('startGameBtn');
    const gameOverText = document.getElementById('gameOverText');
    const scoreDisplay = document.getElementById('scoreDisplay');
    
    // THE 15 UNIQUE ANIME & LEGENDARY TIERS
    const tiers = [
        { max: 0, rank: "NOOB_CODER", status: "> ERR: Refused to read documentation.", color: "#ef4444", art: `<path d="M110 110 L190 190 M190 110 L110 190" stroke="#ef4444" stroke-width="16" stroke-linecap="round"/>` },
        { max: 50, rank: "SLIME_DEV", status: "> STATUS: Reincarnated as a Slime Dev.", color: "#3b82f6", art: `<path d="M100 180 Q150 70 200 180 Q150 200 100 180 Z" fill="#3b82f6"/><circle cx="130" cy="150" r="8" fill="#fff"/><circle cx="170" cy="150" r="8" fill="#fff"/><circle cx="130" cy="150" r="3" fill="#000"/><circle cx="170" cy="150" r="3" fill="#000"/>` },
        { max: 100, rank: "GENIN_HACKER", status: "> STATUS: Just passed the Chunin Exams.", color: "#64748b", art: `<path d="M150 80 L160 140 L220 150 L160 160 L150 220 L140 160 L80 150 L140 140 Z" fill="#cbd5e1"/><circle cx="150" cy="150" r="15" fill="#0f172a"/><circle cx="150" cy="150" r="5" fill="#cbd5e1"/>` },
        { max: 150, rank: "CODE_SAMURAI", status: "> STATUS: Slicing bugs with a Katana.", color: "#f8fafc", art: `<path d="M120 220 Q150 150 200 80 L210 90 Q160 160 130 230 Z" fill="#e2e8f0"/><rect x="110" y="210" width="20" height="40" fill="#b91c1c" transform="rotate(-45 120 220)"/><path d="M130 200 L110 180" stroke="#facc15" stroke-width="6"/>` },
        { max: 200, rank: "ALCHEMIST_DEV", status: "> STATUS: Equivalent Exchange for Code.", color: "#f59e0b", art: `<circle cx="150" cy="150" r="60" fill="none" stroke="#f59e0b" stroke-width="4"/><polygon points="150,90 202,180 98,180" fill="none" stroke="#f59e0b" stroke-width="4"/><polygon points="150,210 98,120 202,120" fill="none" stroke="#f59e0b" stroke-width="4"/>` },
        { max: 250, rank: "SUPER_SAIYAN", status: "> STATUS: Power level is over 9000!", color: "#fde047", art: `<path d="M150 150 L120 80 L135 130 L90 100 L120 150 L80 160 L120 170 L100 220 L140 180 L160 230 L170 180 L210 200 L180 160 L220 140 L180 130 L210 90 L165 120 Z" fill="#fde047"/>` },
        { max: 300, rank: "BANKAI_UNLOCKED", status: "> STATUS: 'Bankai: Tensa Zangetsu.'", color: "#1e293b", art: `<path d="M145 250 L145 90 L155 70 L155 250 Z" fill="#111827" stroke="#334155" stroke-width="2"/><rect x="135" y="200" width="30" height="10" fill="#000"/><path d="M150 250 L150 280" stroke="#dc2626" stroke-width="4"/>` },
        { max: 350, rank: "DOMAIN_EXPANSION", status: "> STATUS: Domain Expansion: Infinite Void.", color: "#c084fc", art: `<circle cx="150" cy="150" r="70" fill="#000" stroke="#c084fc" stroke-width="6"/><circle cx="150" cy="150" r="20" fill="#fff"/><circle cx="150" cy="150" r="8" fill="#000"/><path d="M150 130 L150 80 M150 170 L150 220 M130 150 L80 150 M170 150 L220 150" stroke="#fff" stroke-width="2"/>` },
        { max: 400, rank: "S_CLASS_HUNTER", status: "> STATUS: Solo Leveling the codebase.", color: "#0ea5e9", art: `<path d="M110 220 L150 100 L130 100 L90 220 Z" fill="#38bdf8"/><path d="M190 220 L150 100 L170 100 L210 220 Z" fill="#0284c7"/><circle cx="150" cy="180" r="10" fill="#0ea5e9" opacity="0.5"/>` },
        { max: 450, rank: "NINE_TAILS_DEV", status: "> STATUS: Tapping into Kyuubi chakra.", color: "#ea580c", art: `<path d="M150 220 Q80 150 100 90 Q120 150 150 220" fill="none" stroke="#ea580c" stroke-width="8"/><path d="M150 220 Q100 130 140 80 Q145 130 150 220" fill="none" stroke="#f97316" stroke-width="8"/><path d="M150 220 Q200 130 160 80 Q155 130 150 220" fill="none" stroke="#ea580c" stroke-width="8"/><path d="M150 220 Q220 150 200 90 Q180 150 150 220" fill="none" stroke="#f97316" stroke-width="8"/><circle cx="150" cy="220" r="15" fill="#dc2626"/>` },
        { max: 500, rank: "GEAR_5_ARCHITECT", status: "> STATUS: Coding with the Drums of Liberation.", color: "#f8fafc", art: `<circle cx="150" cy="150" r="50" fill="#fef08a"/><path d="M100 150 Q120 100 150 130 Q180 100 200 150 Q230 170 200 190 Q180 220 150 190 Q120 220 100 190 Q70 170 100 150 Z" fill="#fff" opacity="0.9"/>` },
        { max: 550, rank: "DEMON_LORD", status: "> STATUS: Ruling the Isekai Backend.", color: "#9333ea", art: `<path d="M120 130 Q100 80 80 100 Q110 150 120 130 Z" fill="#a855f7"/><path d="M180 130 Q200 80 220 100 Q190 150 180 130 Z" fill="#a855f7"/><circle cx="150" cy="160" r="30" fill="#000" stroke="#9333ea" stroke-width="6"/><path d="M150 160 L150 120 M140 150 L160 150" stroke="#c084fc" stroke-width="4"/>` },
        { max: 600, rank: "DRAGON_EMPEROR", status: "> STATUS: Summoned the Shenron of Scripts.", color: "#22c55e", art: `<path d="M100 200 Q150 100 200 150 Q250 200 150 80" fill="none" stroke="#22c55e" stroke-width="14"/><circle cx="150" cy="80" r="18" fill="#22c55e"/><circle cx="160" cy="75" r="4" fill="#ef4444"/><circle cx="200" cy="150" r="10" fill="#facc15"/>` },
        { max: 800, rank: "ELITE_TEN", status: "> STATUS: The absolute peak of syntax.", color: "#eab308", art: `<polygon points="150,70 170,120 220,130 185,160 195,210 150,185 105,210 115,160 80,130 130,120" fill="#eab308"/><circle cx="150" cy="140" r="20" fill="#000"/><text x="150" y="146" fill="#eab308" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle">X</text>` },
        { max: 1000, rank: "KAMI_SAMA", status: "> STATUS: Reached the realm of the gods.", color: "#fcd34d", art: `<circle cx="150" cy="150" r="60" fill="none" stroke="#fcd34d" stroke-width="8" stroke-dasharray="20,10"/><circle cx="150" cy="150" r="40" fill="none" stroke="#fff" stroke-width="4"/><circle cx="150" cy="150" r="10" fill="#fff"/><circle cx="100" cy="100" r="8" fill="#fcd34d"/><circle cx="200" cy="100" r="8" fill="#fcd34d"/><circle cx="100" cy="200" r="8" fill="#fcd34d"/><circle cx="200" cy="200" r="8" fill="#fcd34d"/>` },
        { max: Infinity, rank: "ASTRAL_TITAN", status: "> STATUS: Forging universes in Assembly.", color: "#14b8a6", art: `<polygon points="150,60 210,150 150,240 90,150" fill="#0d9488"/><polygon points="150,60 150,240 90,150" fill="#115e59"/><circle cx="150" cy="150" r="10" fill="#ccfbf1"/><path d="M50 150 Q150 50 250 150 Q150 250 50 150 Z" fill="none" stroke="#5eead4" stroke-width="2"/>` }
    ];

    function resetGame() {
        snake = [
            {x: 10, y: 10},
            {x: 10, y: 11},
            {x: 10, y: 12}
        ];
        velocity = { x: 0, y: -1 };
        score = 0;
        currentSpeed = 100; // Reset speed
        scoreDisplay.innerText = score;
        spawnApple();
        overlay.style.display = 'none';
        
        const existingStatus = document.getElementById('dynamicStatusMsg');
        if(existingStatus) existingStatus.remove();
        
        const existingDl = document.getElementById('downloadRewardBtn');
        if(existingDl) existingDl.remove();
        
        isPlaying = true;
        if(gameLoop) clearTimeout(gameLoop);
        runGameLoop();
    }
    
    function runGameLoop() {
        if (!isPlaying) return;
        update();
        if (isPlaying) {
            gameLoop = setTimeout(runGameLoop, currentSpeed);
        }
    }
    
    function update() {
        const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };
        
        // Wall Collision
        if(head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            return gameOver();
        }
        // Self Collision
        for(let i=0; i<snake.length; i++) {
            if(head.x === snake[i].x && head.y === snake[i].y) return gameOver();
        }
        
        snake.unshift(head);
        
        // Eat Bug (Apple)
        if(head.x === apple.x && head.y === apple.y) {
            score += 10;
            scoreDisplay.innerText = score;
            
            // DYNAMIC ACCELERATION: Drop by 2ms every 50 points, capped at 40ms for insane difficulty
            currentSpeed = Math.max(40, 100 - Math.floor(score / 50) * 2);
            
            spawnApple();
        } else {
            snake.pop();
        }
        draw();
    }
    
    function draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--cor-secondary').trim() || '#10b981';
        snake.forEach(part => {
            ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize-1, gridSize-1);
        });
        
        ctx.fillStyle = '#ff3366';
        ctx.fillRect(apple.x * gridSize, apple.y * gridSize, gridSize-1, gridSize-1);
    }
    
    function spawnApple() {
        apple.x = Math.floor(Math.random() * tileCount);
        apple.y = Math.floor(Math.random() * tileCount);
        snake.forEach(part => {
            if(part.x === apple.x && part.y === apple.y) spawnApple();
        });
    }
    
    function gameOver() {
        isPlaying = false;
        clearTimeout(gameLoop);
        
        let currentTier = tiers[tiers.length - 1];
        for (let i = 0; i < tiers.length; i++) {
            if (score <= tiers[i].max) {
                currentTier = tiers[i];
                break;
            }
        }
        
        let statusMsg = document.createElement('p');
        statusMsg.id = 'dynamicStatusMsg';
        statusMsg.className = 'font-pixel';
        statusMsg.style = `color: ${currentTier.color}; font-size: 0.65rem; margin-top: 1rem; text-align: center; max-width: 90%; line-height: 1.5; text-shadow: 2px 2px 0 #000;`;
        statusMsg.innerText = currentTier.status;
        overlay.appendChild(statusMsg);
        
        let dlBtn = document.createElement('button');
        dlBtn.id = 'downloadRewardBtn';
        dlBtn.className = 'sys-btn-contato';
        dlBtn.style = `font-family: var(--font-pixel); font-size: 0.6rem; margin-top: 1.5rem; background-color: ${currentTier.color}; color: #000; border: 2px solid #fff; cursor: pointer; padding: 0.8rem 1rem; border-radius: 4px; font-weight: 800;`;
        dlBtn.innerText = 'COLLECT ' + currentTier.rank + ' BADGE';
        dlBtn.onclick = () => generateReward(score, currentTier);
        overlay.appendChild(dlBtn);
        
        overlay.style.display = 'flex';
        startBtn.innerText = 'REBOOT SYSTEM';
        gameOverText.style.display = 'block';
    }

    // ULTRA HIGH-RES BADGE GENERATOR
    function generateReward(score, tier) {
        const bg = "#0f172a";
        const scale = 4; // Scales native 300x400 to 1200x1600 Collectible Quality
        const w = 300 * scale;
        const h = 400 * scale;
        
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="${w}" height="${h}">
            <rect width="100%" height="100%" fill="${bg}" stroke="${tier.color}" stroke-width="12"/>
            <rect x="15" y="15" width="270" height="370" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="10,5"/>
            ${tier.art}
            <text x="150" y="270" font-family="monospace" font-size="22" font-weight="bold" fill="#fff" text-anchor="middle">RANK: ${tier.rank}</text>
            <text x="150" y="300" font-family="monospace" font-size="16" fill="${tier.color}" text-anchor="middle">SCORE: ${score} LOC</text>
            <text x="150" y="340" font-family="monospace" font-size="10" fill="#64748b" text-anchor="middle">ISSUED BY:</text>
            <text x="150" y="360" font-family="monospace" font-size="12" fill="#fff" font-weight="bold" text-anchor="middle">GOKUL_DEV</text>
        </svg>`;

        const blob = new Blob([svg], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const ctx = c.getContext('2d');
            
            // Smooth out pixel rendering for large export
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            
            ctx.drawImage(img, 0, 0, w, h);
            const a = document.createElement('a');
            a.download = `${tier.rank}_Badge_${score}LOC.png`;
            a.href = c.toDataURL('image/png', 1.0);
            a.click();
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }
    
    startBtn.addEventListener('click', resetGame);
    
    document.addEventListener('keydown', (e) => {
        if(!isPlaying) return;
        if([37, 38, 39, 40].includes(e.keyCode)) e.preventDefault();
        
        if(e.key === 'ArrowUp' && velocity.y === 0) velocity = {x: 0, y: -1};
        if(e.key === 'ArrowDown' && velocity.y === 0) velocity = {x: 0, y: 1};
        if(e.key === 'ArrowLeft' && velocity.x === 0) velocity = {x: -1, y: 0};
        if(e.key === 'ArrowRight' && velocity.x === 0) velocity = {x: 1, y: 0};
    });
    
    const handleDir = (dir) => {
        if(!isPlaying) return;
        if(dir === 'up' && velocity.y === 0) velocity = {x: 0, y: -1};
        if(dir === 'down' && velocity.y === 0) velocity = {x: 0, y: 1};
        if(dir === 'left' && velocity.x === 0) velocity = {x: -1, y: 0};
        if(dir === 'right' && velocity.x === 0) velocity = {x: 1, y: 0};
    }
    
    document.getElementById('btnUp')?.addEventListener('click', () => handleDir('up'));
    document.getElementById('btnDown')?.addEventListener('click', () => handleDir('down'));
    document.getElementById('btnLeft')?.addEventListener('click', () => handleDir('left'));
    document.getElementById('btnRight')?.addEventListener('click', () => handleDir('right'));
    
    draw(); 
}

document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    initThemeMenu();
    initMiniGame();
});
