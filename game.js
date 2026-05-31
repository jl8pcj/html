const gameAreaBg = document.getElementById('game-area-bg');
const width = gameAreaBg.clientWidth;
const height = gameAreaBg.clientHeight;

 


const {
    Engine,
    Render,
    Runner,
    Bodies,
    Composite,
    Query,
    Vector,
    Events,
    Body
} = Matter;

const engine = Engine.create();

const render = Render.create({
    element: gameAreaBg,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false,
        background: 'transparent'
    }
});

render.canvas.id = "matter-canvas";

/* ================= VARIABLES ================= */

let score = 0;
let comboCount = 0;
let comboTimer = null;

let timeLeft = 60;
let isPaused = false;
let isVoicePlaying = false;
let hasVoiceEndedOnce = false;
let isGameOver = false;
let isSkillExecuting = false;

let feverCount = 0;
let isFever = false;

const FEVER_TIME = 14;

let feverTimeLeft = FEVER_TIME;
let feverInterval = null;
let feverTimer = null;

/* SKILL (TEST MODE: MAX 3) */
let skillGauge = 0;
let isSkillFull = false;
const SKILL_MAX = 3; 

const twelveHead =document.getElementById('twelve-head');
const twelveShot =document.getElementById('twelve-shot');
const fourSkillImage =document.getElementById('four-skill-image');
const friskSkillImage =document.getElementById('frisk-skill-image');
const oneSkillImage =document.getElementById('one-skill-image');
const scoreDisplay = document.getElementById('score-display');
const comboContainer = document.getElementById('combo-container');
const comboCountText = document.getElementById('combo-count');
const timeDisplay = document.getElementById('time-display');
const pauseBtn = document.getElementById('pause-btn');
const timeBox = document.getElementById('time-box');
const feverBarFill = document.getElementById('fever-bar-fill');
const feverText = document.getElementById('fever-text');
const myTsumBtn = document.getElementById('mytsum-btn');
const myTsumImg = document.getElementById('mytsum-image');

const startVoice = document.getElementById('start-voice');
const timeupVoice = document.getElementById('timeup-voice');
const normalBgm = document.getElementById('normal-bgm');
const feverBgm = document.getElementById('fever-bgm');

const skillOverlay = document.getElementById('skill-overlay');
const asgoreWeapon = document.getElementById('asgore-weapon');
const asgoreSlash = document.getElementById('asgore-slash');
const papyrusWeapon = document.getElementById('papyrus-weapon');
const sansBlaster = document.getElementById('sans-blaster');
const sansLaser = document.getElementById('sans-laser');
const customEightWeapon = document.getElementById('custom-eight-weapon');

const temmieCanvas = document.getElementById('temmie-vine');
const temmieCtx = temmieCanvas.getContext('2d');
const temmieHead = document.getElementById('temmie-head');


const chainSoundMap = {
    2: document.getElementById('se-c'),
    3: document.getElementById('se-d'),
    4: document.getElementById('se-e'),
    5: document.getElementById('se-f'),
    6: document.getElementById('se-g'),
    7: document.getElementById('se-a')
};
const defaultChainSound = document.getElementById('se-b');

const scoreTable = {
    3:300, 4:700, 5:1300, 6:2100, 7:3100, 8:4600, 9:6100, 10:7600, 11:9600, 12:11600, 13:13600, 14:15600, 15:18100
};

let activeImages = [];
let myTsumType = "";

/* ================= AUDIO START TRIGGER ================= */

let isAudioStarted = false;
let userHasInteracted = false; 

function handleUserInteraction() {
    userHasInteracted = true; 
    tryPlayAudioIfReady();
}

function tryPlayAudioIfReady() {
    if (isAudioStarted) return;
    if (userHasInteracted) {
        if (!isPaused && !isFever && !isGameOver) {
            isVoicePlaying = true;
            startVoice.play().then(() => {
                isAudioStarted = true;
                window.removeEventListener('click', handleUserInteraction);
                window.removeEventListener('touchstart', handleUserInteraction);
                window.removeEventListener('mousedown', handleUserInteraction);
            }).catch(err => {
                console.log("Audio play blocked by browser:", err);
                isVoicePlaying = false;
            });
        }
    }
}

startVoice.addEventListener('ended', () => {
    isVoicePlaying = false;
    hasVoiceEndedOnce = true;
    if (!isPaused && !isFever && !isGameOver) {
        normalBgm.play().catch(err => {
            console.log("BGM play blocked:", err);
        });
    }
});

window.addEventListener('click', handleUserInteraction);
window.addEventListener('touchstart', handleUserInteraction);
window.addEventListener('mousedown', handleUserInteraction);

/* ================= SKILL GAUGE ================= */

function updateSkillGauge(){
    const angle = (skillGauge / SKILL_MAX) * 360;
    myTsumBtn.style.setProperty('--skill-angle', angle + 'deg');

    if (skillGauge >= SKILL_MAX && !isSkillFull) {
        isSkillFull = true;
        triggerFullGaugeEffect();
    } else if (skillGauge < SKILL_MAX) {
        isSkillFull = false;
        myTsumImg.style.filter = 'brightness(100%)';
    }
}

function triggerFullGaugeEffect() {
    myTsumBtn.style.transform = 'scale(1.1)';
    myTsumImg.style.filter = 'brightness(200%) drop-shadow(0 0 10px white)';
    
    setTimeout(() => {
        myTsumBtn.style.transform = 'scale(1)';
    }, 300);
}

/* ================= myTsumBtn.onclick 修正 ================= */

myTsumBtn.onclick = (e) => {
    e.stopPropagation();
    handleUserInteraction();
    
    if (
        isSkillFull &&
        !isSkillExecuting &&
        !isGameOver &&
        !isPaused &&
        !isVoicePlaying
    ) {

        if (myTsumType === '11.png') {

            activateAsgoreSkill();

        } else if(myTsumType === '4.png'){

            activateFourSkill();


        } else if (myTsumType === '5.png') {

            activatePapyrusSkill();

        } else if (myTsumType === '6.png') {

            activateSansSkill();

        } else if (myTsumType === '8.png') {

            activateEightSkill();

        } else if (myTsumType === '7.png') {

            activateTemmieSkill();

        } else if (myTsumType === '1.png') {

            activateOneSkill();
        
        }else if(myTsumType === '3.png'){

            activateFriskSkill();

        }else if(myTsumType === '12.png'){

            activateTwelveSkill();

}

        
    }
};

/* =================共通スコア＆消去処理 ================= */
function processSkillElimination(targetBodies) {
    const eliminatedCount = targetBodies.length;
    if (eliminatedCount <= 0) return;

    const baseScore = scoreTable[Math.min(eliminatedCount, 15)] || (eliminatedCount * 1500);
    let finalScore = Math.floor(baseScore * (1 + (comboCount + 10) / 100));
    if (isFever) finalScore *= 3;
    
    score += finalScore;
    scoreDisplay.innerText = Math.floor(score).toLocaleString();

    if (!isFever) {
        feverCount += eliminatedCount;
        if (feverCount > 30) feverCount = 30;
        updateFeverBar();
    }

    targetBodies.forEach(b => {
        Composite.remove(engine.world, b);
    });

    for (let i = 0; i < eliminatedCount; i++) {
        Composite.add(
            engine.world,
            createTsum(Math.random() * (width - 80) + 40, -50)
        );
    }
}
/* ================= 3.png キャラ ================= */

function activateFriskSkill(){

    isSkillExecuting = true;

    skillGauge = 0;
    isSkillFull = false;

    updateSkillGauge();

    selected = [];
    isDragging = false;

    skillOverlay.style.display =
        'block';

    friskSkillImage.style.opacity =
        '1';

    friskSkillImage.style.transform =
        'translate(-50%,-50%) scale(1)';
    

    setTimeout(()=>{

        const targetBodies =
            engine.world.bodies.filter(
                b=>!b.isStatic
            );

        processSkillElimination(
            targetBodies
        );

        friskSkillImage.style.opacity =
            '0';

        friskSkillImage.style.transform =
            'translate(-50%,-50%) scale(1.1)';

        setTimeout(()=>{

            skillOverlay.style.display =
                'none';

            isSkillExecuting =
                false;

        },300);

    },1000);
}

/* ================= 12.png SKILL ================= */

function activateTwelveSkill(){

    isSkillExecuting = true;

    skillGauge = 0;
    isSkillFull = false;

    updateSkillGauge();

    selected = [];
    isDragging = false;

    skillOverlay.style.display =
        'block';

    twelveHead.style.opacity = '1';
    twelveHead.style.transform =
        'rotate(0deg)';

    /* ---------- 1発目 ---------- */

    let x = 120;
    let y = 90;

    twelveShot.style.opacity = '1';
    twelveShot.style.left = x + 'px';
    twelveShot.style.top = y + 'px';
    twelveShot.style.transform =
        'rotate(0deg)';

    const hitBodies1 = [];

    const shot1 =
    setInterval(()=>{

        x += 20;

        twelveShot.style.left =
            x + 'px';

        engine.world.bodies.forEach(b=>{

            if(b.isStatic) return;

            const dx =
                b.position.x - x;

            const dy =
                b.position.y - y;

            if(
                Math.sqrt(
                    dx*dx+dy*dy
                ) < 55
            ){
                if(
                    !hitBodies1.includes(b)
                ){
                    hitBodies1.push(b);
                }
            }
        });

        if(x > width + 120){

            clearInterval(shot1);

            processSkillElimination(
                hitBodies1
            );

            /* ---------- 2発目 ---------- */

            twelveHead.style.transform =
                'rotate(45deg)';

            let x2 = 120;
            let y2 = 90;

            twelveShot.style.left =
                x2 + 'px';

            twelveShot.style.top =
                y2 + 'px';

            twelveShot.style.transform =
                'rotate(45deg)';

            const hitBodies2 = [];

            const shot2 =
            setInterval(()=>{

                x2 += 16;
                y2 += 16;

                twelveShot.style.left =
                    x2 + 'px';

                twelveShot.style.top =
                    y2 + 'px';

                engine.world.bodies.forEach(b=>{

                    if(b.isStatic) return;

                    const dx =
                        b.position.x - x2;

                    const dy =
                        b.position.y - y2;

                    if(
                        Math.sqrt(
                            dx*dx+dy*dy
                        ) < 55
                    ){
                        if(
                            !hitBodies2.includes(b)
                        ){
                            hitBodies2.push(b);
                        }
                    }
                });

                if(
                    x2 > width+120 ||
                    y2 > height+120
                ){

                    clearInterval(
                        shot2
                    );

                    processSkillElimination(
                        hitBodies2
                    );

                    twelveShot.style.opacity =
                        '0';

                    twelveHead.style.opacity =
                        '0';

                    setTimeout(()=>{

                        skillOverlay.style.display =
                            'none';

                        isSkillExecuting =
                            false;

                    },250);
                }

            },16);
        }

    },16);
}
/* ================= 1.png SKILL ================= */

function activateOneSkill() {

    isSkillExecuting = true;

    skillGauge = 0;
    isSkillFull = false;

    updateSkillGauge();

    selected = [];
    isDragging = false;

    skillOverlay.style.display = 'block';

    oneSkillImage.style.opacity = '1';

    oneSkillImage.style.transform =
        'scale(1) rotate(0deg)';

    /* ================= 開始位置 ================= */

    let startX = 65;
    let startY = 165;

    /* ================= 弧移動 ================= */

    let t = 0;

    const points = [];

    const targetBodies = [];

    const interval =
    setInterval(()=>{

        t += 0.02;

        if(t > 1){
            t = 1;
        }

        /* ================= 下へ膨らむ弧 ================= */

        const x =
            startX
            +
            (width - 140) * t;

        const y =
            startY
            +
            Math.sin(
                t * Math.PI
            ) * 90;

        oneSkillImage.style.left =
            x + 'px';

        oneSkillImage.style.top =
            y + 'px';

        points.push({x,y});

        /* ================= 軌跡上のツムを1.png化 ================= */

        engine.world.bodies.forEach(b=>{

            if(b.isStatic) return;

            const dx =
                b.position.x - x;

            const dy =
                b.position.y - y;

            const dist =
                Math.sqrt(
                    dx*dx + dy*dy
                );

            if(dist < 50){

                b.plugin.tsumType =
                    '1.png';

                b.render.sprite.texture =
                    '1.png';
            }
        });

        if(t >= 1){

            clearInterval(interval);

            oneSkillImage.style.opacity =
                '0';

            oneSkillImage.style.transform =
                'scale(1.15) rotate(8deg)';

            setTimeout(()=>{

                skillOverlay.style.display =
                    'none';

                isSkillExecuting =
                    false;

                /* ================= 元位置へ戻す ================= */

                oneSkillImage.style.left =
                    '15px';

                oneSkillImage.style.top =
                    '115px';

            },250);
        }

    },16);
}
/* ================= 4.png SKILL ================= */

function activateFourSkill(){

    isSkillExecuting = true;

    skillGauge = 0;
    isSkillFull = false;

    updateSkillGauge();

    selected = [];
    isDragging = false;

    skillOverlay.style.display =
        'block';

    /* 画面暗転 */

    skillOverlay.style.background =
        'rgba(0,0,0,0.85)';

    fourSkillImage.style.opacity =
        '1';

    fourSkillImage.style.transform =
        'translate(-50%,-50%) scale(1)';

    setTimeout(()=>{

        fourSkillImage.style.opacity =
            '0';

        fourSkillImage.style.transform =
            'translate(-50%,-50%) scale(1.1)';

        skillOverlay.style.background =
            'transparent';

        setTimeout(()=>{

            skillOverlay.style.display =
                'none';

            isSkillExecuting =
                false;

        },300);

    },2000);

}
/* ================= 11.png: アズゴア スキル ================= */
function activateAsgoreSkill() {
    isSkillExecuting = true;
    skillGauge = 0;
    isSkillFull = false;
    updateSkillGauge();
    
    selected = [];
    isDragging = false;

    skillOverlay.style.display = 'block';
    asgoreWeapon.style.left = '-580px';
    
    setTimeout(() => {
        asgoreWeapon.style.opacity = '1';
        asgoreWeapon.style.left = (width - 560) + 'px'; 
    }, 50);

    setTimeout(() => {
        asgoreSlash.style.opacity = '1';
        asgoreSlash.style.height = '114px'; 
        
        const centerY = height / 2;
        const lineTop = centerY - 57;
        const lineBottom = centerY + 57;
        
        let targetBodies = [];
        engine.world.bodies.forEach(b => {
            if (!b.isStatic && b.position.y >= lineTop && b.position.y <= lineBottom) {
                targetBodies.push(b);
            }
        });

        processSkillElimination(targetBodies);
    }, 850);

    setTimeout(() => {
        asgoreSlash.style.opacity = '0';
        asgoreWeapon.style.left = '-580px'; 
    }, 1100);

    setTimeout(() => {
        asgoreWeapon.style.opacity = '0';
        asgoreSlash.style.height = '0px';
        skillOverlay.style.display = 'none';
        isSkillExecuting = false;
    }, 2000);
}

/* ================= 5.png: パピルス スキル ================= */
function activatePapyrusSkill() {
    isSkillExecuting = true;
    skillGauge = 0;
    isSkillFull = false;
    updateSkillGauge();
    
    selected = [];
    isDragging = false;

    skillOverlay.style.display = 'block';
    papyrusWeapon.style.left = '100%'; 
    
    setTimeout(() => {
        papyrusWeapon.style.opacity = '1';
        papyrusWeapon.style.left = '-160px'; 
    }, 50);

    setTimeout(() => {
        const lineY = height * 0.65;
        const lineTop = lineY - 56;    
        const lineBottom = lineY + 56;
        
        let targetBodies = [];
        engine.world.bodies.forEach(b => {
            if (!b.isStatic && b.position.y >= lineTop && b.position.y <= lineBottom) {
                targetBodies.push(b);
            }
        });

        processSkillElimination(targetBodies);
    }, 950); 

    setTimeout(() => {
        papyrusWeapon.style.opacity = '0';
        skillOverlay.style.display = 'none';
        isSkillExecuting = false;
    }, 3300);
}

/* ================= 6.png: サンズ スキル ================= */
function activateSansSkill() {
    isSkillExecuting = true;
    skillGauge = 0;
    isSkillFull = false;
    updateSkillGauge();
    
    selected = [];
    isDragging = false;

    skillOverlay.style.display = 'block';
    skillOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    
    setTimeout(() => {
        sansBlaster.style.opacity = '1';
        sansBlaster.style.transform = 'translate(-50%, 0%) scale(1)';
    }, 50);

    setTimeout(() => {
        sansLaser.style.opacity = '1';
        sansLaser.style.width = '70px'; 

        const centerX = width / 2;
        const lineLeft = centerX - 35;  
        const lineRight = centerX + 35;
        
        let targetBodies = [];
        engine.world.bodies.forEach(b => {
            if (!b.isStatic && b.position.x >= lineLeft && b.position.x <= lineRight) {
                targetBodies.push(b);
            }
        });

        processSkillElimination(targetBodies);
    }, 450);

    setTimeout(() => {
        sansLaser.style.opacity = '0';
        sansBlaster.style.transform = 'translate(-50%, -100%) scale(0)';
        sansBlaster.style.opacity = '0';
        skillOverlay.style.backgroundColor = 'transparent';
    }, 950);

    setTimeout(() => {
        sansLaser.style.width = '0px';
        skillOverlay.style.display = 'none';
        isSkillExecuting = false;
    }, 1200);
}

/* ================= 8.png: 新スキル (全ツム変化) ================= */
function activateEightSkill() {
    isSkillExecuting = true;
    skillGauge = 0;
    isSkillFull = false;
    updateSkillGauge();
    
    selected = [];
    isDragging = false;

    skillOverlay.style.display = 'block';
    
    // 8s.png を中央にポップアップ
    setTimeout(() => {
        customEightWeapon.style.opacity = '1';
        customEightWeapon.style.transform = 'translate(-50%, -50%) scale(1.1)';
    }, 50);

    // 演出終了（縮小しながら消滅＆フィールド上のツム全変化）
    setTimeout(() => {
        customEightWeapon.style.transform = 'translate(-50%, -50%) scale(0)';
        customEightWeapon.style.opacity = '0';

        engine.world.bodies.forEach(b => {
            if (!b.isStatic && b.plugin && b.plugin.tsumType) {
                b.plugin.tsumType = '8.png';
                b.render.sprite.texture = '8.png';
            }
        });
    }, 900);

    setTimeout(() => {
        skillOverlay.style.display = 'none';
        isSkillExecuting = false;
    }, 1200);
}

/* ================= 7.png: TEMMIE スキル ================= */

function activateTemmieSkill() {

    isSkillExecuting = true;

    skillGauge = 0;
    isSkillFull = false;

    updateSkillGauge();

    selected = [];
    isDragging = false;

    skillOverlay.style.display = 'block';

    temmieCanvas.width = width;
    temmieCanvas.height = height;

    temmieCtx.clearRect(0,0,width,height);

    temmieHead.style.opacity = '1';
    temmieHead.style.transform = 'scale(1)';

    const points = [];

    /* ================= さらに左から開始 ================= */

    let x = 70;
    let y = 95;

    points.push({x,y});

    /* ================= 長さ ================= */

    const down1Length =
        Math.random() * 180 + 140;

    const rightLength =
        Math.random() * 220 + 120;

    /*
        0 = 下
        1 = 右
        2 = 下
    */

    let phase = 0;

    let moved = 0;

    let targetBodies = [];

    function drawVine(count = points.length) {

        temmieCtx.clearRect(0,0,width,height);

        temmieCtx.lineCap = 'round';
        temmieCtx.lineJoin = 'round';

        /* ================= 白い足 ================= */

        temmieCtx.strokeStyle = '#ffffff';

        /* ================= 少し細め ================= */

        temmieCtx.lineWidth = 18;

        temmieCtx.shadowBlur = 10;
        temmieCtx.shadowColor = '#ffffff';

        temmieCtx.beginPath();

        temmieCtx.moveTo(
            points[0].x,
            points[0].y
        );

        for(let i=1;i<count;i++) {

            temmieCtx.lineTo(
                points[i].x,
                points[i].y
            );
        }

        temmieCtx.stroke();

        temmieCtx.shadowBlur = 0;
    }

    const extendInterval = setInterval(()=> {

        /* ================= 真下 ================= */

        if(phase === 0) {

            y += 16;
            moved += 16;

            if(moved >= down1Length) {

                phase = 1;
                moved = 0;
            }
        }

        /* ================= 右へ90度 ================= */

        else if(phase === 1) {

            x += 16;
            moved += 16;

            if(moved >= rightLength) {

                phase = 2;
            }
        }

        /* ================= 再び真下 ================= */

        else {

            y += 16;
        }

        if(x > width - 60) {
            x = width - 60;
        }

        points.push({x,y});

        drawVine();

        /* ================= 軌跡上のツム取得 ================= */

        engine.world.bodies.forEach(b=> {

            if(b.isStatic) return;

            const dx = b.position.x - x;
            const dy = b.position.y - y;

            const dist =
                Math.sqrt(dx*dx + dy*dy);

            if(
                dist < 48 &&
                !targetBodies.includes(b)
            ) {
                targetBodies.push(b);
            }
        });

        /* ================= 画面最下端まで伸ばす ================= */

        if(y >= height + 40) {

            clearInterval(
                extendInterval
            );

            processSkillElimination(
                targetBodies
            );

            setTimeout(()=> {

                let retractCount =
                    points.length;

                const retractInterval =
                setInterval(()=> {

                    retractCount--;

                    drawVine(retractCount);

                    if(retractCount <= 1) {

                        clearInterval(
                            retractInterval
                        );

                        temmieCtx.clearRect(
                            0,
                            0,
                            width,
                            height
                        );

                        temmieHead.style.opacity =
                        '0';

                        temmieHead.style.transform =
                        'scale(0)';

                        setTimeout(()=> {

                            skillOverlay.style.display =
                            'none';

                            isSkillExecuting = false;

                        },250);
                    }

                },16);

            },120);
        }

    },16);
}



/* ================= EFFECT ================= */

function createGaugeEffect(x,y,target){
    const el = document.createElement('img');
    if(target === 'fever'){
        el.src = '1.png';
    }else{
        el.src = myTsumType;
    }

    el.style.position = 'absolute';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.width = '35px';
    el.style.height = '35px';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '5000';
    el.style.transition = 'all 0.45s ease';

    document.getElementById('game-container').appendChild(el);

    let targetRect = target === 'fever'
        ? document.getElementById('fever-container').getBoundingClientRect()
        : myTsumBtn.getBoundingClientRect();

    const containerRect = document.getElementById('game-container').getBoundingClientRect();

    setTimeout(()=>{
        el.style.left = (targetRect.left - containerRect.left + 10) + 'px';
        el.style.top = (targetRect.top - containerRect.top + 10) + 'px';
        el.style.transform = 'scale(0.3)';
        el.style.opacity = '0';
    },10);

    setTimeout(()=>{
        el.remove();
    },500);
}

/* ================= TSUM ================= */

function selectTsums(){
    activeImages = [
        '1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png',
        '8.png', '9.png', '10.png', '11.png', '12.png', '13.png', '14.png'
    ];
    
    // スキル対象プールに全4キャラを含める
    const skillPool = ['1.png', '3.png', '4.png', '5.png', '6.png', '11.png', '8.png', '7.png', '12.png'];
    myTsumType = skillPool[Math.floor(Math.random() * skillPool.length)];

    let remain = activeImages.filter(img => img !== myTsumType)
                               .sort(() => 0.5 - Math.random())
                               .slice(0, 4);
    remain.push(myTsumType);
    activeImages = remain.sort(() => 0.5 - Math.random());

    myTsumImg.src = myTsumType;
}

selectTsums();

function createTsum(x,y){
    const type = activeImages[Math.floor(Math.random()*activeImages.length)];
    return Bodies.circle(x,y,28,{
        restitution:0.2,
        friction:0.1,
        render:{
            sprite:{
                texture:type,
                xScale:0.45,
                yScale:0.45
            }
        },
        plugin:{
            tsumType:type
        }
    });
}

/* ================= WALL ================= */

Composite.add(engine.world,[
    Bodies.rectangle(10, height/2, 20, height, {isStatic:true,render:{visible:false}}),
    Bodies.rectangle(width - 10, height/2, 20, height, {isStatic:true,render:{visible:false}}),
    Bodies.rectangle(width/2, height - 10, width, 20, {isStatic:true,render:{visible:false}}),
    Bodies.rectangle(55, height - 35, 70, 20, {isStatic:true,render:{visible:false},angle:0.8}),
    Bodies.rectangle(width - 55, height - 35, 70, 20, {isStatic:true,render:{visible:false},angle:-0.8})
]);

function spawnTsums(){
    for(let i=0;i<45;i++){
        Composite.add(
            engine.world,
            createTsum(
                Math.random()*(width-80)+40,
                Math.random()*-400
            )
        );
    }
}

spawnTsums();

/* ================= FEVER ================= */

function updateFeverBar(){
    if (isGameOver) return;
    const percent = Math.min((feverCount / 30) * 100, 100);
    feverBarFill.style.width = percent + "%";

    if(percent >= 100 && !isFever){
        startFever();
    }
}

function startFever(){
    isFever = true;
    feverCount = 30;
    feverTimeLeft = FEVER_TIME;
    feverBarFill.style.width = "100%";
    feverText.innerText = "FEVER!!";
    timeLeft += 5;

    if(timeLeft > 99) timeLeft = 99;

    document.getElementById('game-area-bg').style.boxShadow =
    `
    inset 0 0 40px rgba(255,255,0,0.9),
    inset 0 0 80px rgba(255,180,0,0.8)
    `;

    startVoice.pause();
    normalBgm.pause();
    feverBgm.currentTime = 0;
    feverBgm.play();

    clearInterval(feverInterval);
    feverInterval = setInterval(() => {
        if(isPaused || !hasVoiceEndedOnce || isVoicePlaying || isGameOver) return; 
        feverTimeLeft -= 0.1;
        if(feverTimeLeft < 0) feverTimeLeft = 0;
        feverCount = (feverTimeLeft / FEVER_TIME) * 30;
        updateFeverBar();
    },100);

    clearTimeout(feverTimer);
    feverTimer = setTimeout(() => {
        if (!isGameOver) endFever();
    },FEVER_TIME * 1000);
}

function endFever(){
    clearInterval(feverInterval);
    isFever = false;
    feverCount = 0;
    updateFeverBar();
    feverText.innerText = "FEVER";

    document.getElementById('game-area-bg').style.boxShadow =
    `
    inset 0 8px 20px rgba(255,255,255,0.12),
    inset 0 -10px 20px rgba(0,0,0,0.35)
    `;

    feverBgm.pause();
    feverBgm.currentTime = 0;
    if (!isGameOver) normalBgm.play();
}

/* ================= TIMER & TIME UP ================= */

const timerInterval = setInterval(() => {
    if(!isPaused && hasVoiceEndedOnce && !isVoicePlaying && !isGameOver && timeLeft > 0){
        timeLeft--;
        timeDisplay.innerText = timeLeft;
        const angle = (timeLeft / 60) * 360;
        timeBox.style.setProperty('--timer-angle', angle);

        if(timeLeft <= 0){
            triggerTimeUp();
        }
    }
},1000);

function triggerTimeUp() {
    isGameOver = true;
    clearInterval(timerInterval);
    clearInterval(feverInterval);
    clearTimeout(feverTimer);

    normalBgm.pause();
    feverBgm.pause();
    startVoice.pause();

    timeupVoice.currentTime = 0;
    timeupVoice.play().catch(err => console.log("Timeup audio play blocked:", err));

    timeDisplay.innerText = "0";
    
    selected = [];
    isDragging = false;
}

/* ================= PAUSE ================= */

pauseBtn.onclick = () => {
    if (isGameOver || isSkillExecuting) return; 
    handleUserInteraction();
    isPaused = !isPaused;
    if(isPaused){
        pauseBtn.innerText = "▶";
        startVoice.pause();
        normalBgm.pause();
        feverBgm.pause();
    }else{
        pauseBtn.innerText = "Ⅱ";
        if(isFever){
            feverBgm.play();
        }else{
            if (startVoice.currentTime > 0 && !startVoice.ended) {
                startVoice.play();
            } else {
                normalBgm.play();
            }
        }
    }
};

/* ================= FAN ================= */

document.getElementById('fan-btn').onclick = () => {
    if(isVoicePlaying || isGameOver || isPaused || isSkillExecuting) return; 
    handleUserInteraction();
    engine.world.bodies.forEach(b => {
        if(!b.isStatic){
            Body.setPosition(b,{
                x:Math.random()*(width-80)+40,
                y:Math.random()*(height-100)+50
            });
        }
    });
};

/* ================= CHAIN ================= */

let selected = [];
let isDragging = false;

Events.on(render,'afterRender',() => {
    if(selected.length > 0){
        const ctx = render.context;
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00e1ff';
        ctx.strokeStyle = '#a0f0ff';
        ctx.lineWidth = 10;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(selected[0].position.x, selected[0].position.y);
        selected.forEach(t => {
            ctx.lineTo(t.position.x, t.position.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        if(selected.length >= 2){
            const lastTsum = selected[selected.length - 1];
            
            ctx.save();
            ctx.font = 'italic bold 24px "Arial Black", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0055ff';
            ctx.lineWidth = 5;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textX = lastTsum.position.x + 25;
            const textY = lastTsum.position.y - 25;
            
            ctx.strokeText(selected.length, textX, textY);
            ctx.fillText(selected.length, textX, textY);
            ctx.restore();
        }
    }
});

const canvas = render.canvas;

function startDrag(e) {
    handleUserInteraction();
    if(isPaused || isVoicePlaying || isGameOver || isSkillExecuting) return; 
    isDragging = true;
    selected = [];
    
    if(e.type === 'touchstart') {
        handleDragMove(e);
    }
}

function endDrag() {
    if(isPaused || isVoicePlaying || isGameOver || isSkillExecuting) return; 

    if(selected.length >= 3){
        const type = selected[0].plugin.tsumType;

        if(selected.every(t => t.plugin.tsumType === type)){
            const areaRect = gameAreaBg.getBoundingClientRect();
            const containerRect = document.getElementById('game-container').getBoundingClientRect();
            const offsetX = areaRect.left - containerRect.left;
            const offsetY = areaRect.top - containerRect.top;

            selected.forEach(t => {
                createGaugeEffect(
                    t.position.x + offsetX,
                    t.position.y + offsetY,
                    t.plugin.tsumType === myTsumType ? myTsumType : 'fever'
                );
            });

            const baseScore = scoreTable[Math.min(selected.length,15)] || 0;
            let finalScore = Math.floor(baseScore * (1 + (comboCount + 10) / 100));

            if(isFever) finalScore *= 3;

            score += finalScore;
            scoreDisplay.innerText = Math.floor(score).toLocaleString();

            comboCount++;
            comboContainer.style.opacity = "1";
            comboCountText.innerText = comboCount;

            clearTimeout(comboTimer);
            if(!isFever){
                comboTimer = setTimeout(() => {
                    comboCount = 0;
                    comboContainer.style.opacity = "0";
                },4000);
            }

            const myTsumRemoved = selected.filter(t => t.plugin.tsumType === myTsumType).length;
            const normalRemoved = selected.length - myTsumRemoved;

            if(myTsumRemoved > 0){
                skillGauge += myTsumRemoved;
                if(skillGauge > SKILL_MAX) skillGauge = SKILL_MAX;
                updateSkillGauge();
            }

            if(!isFever && normalRemoved > 0){
                feverCount += normalRemoved;
                if(feverCount > 30) feverCount = 30;
                updateFeverBar();
            }

            selected.forEach(b => {
                Composite.remove(engine.world, b);
            });

            for(let i=0;i<selected.length;i++){
                Composite.add(
                    engine.world,
                    createTsum(Math.random()*(width-80)+40, -50)
                );
            }
        }
    }
    selected = [];
    isDragging = false;
}

function handleDragMove(e) {
    if(isPaused || isVoicePlaying || isGameOver || isSkillExecuting) return; 
    if(!isDragging) return;

    if (e.cancelable) e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const found = Query.point(engine.world.bodies, {
        x: clientX - rect.left,
        y: clientY - rect.top
    })[0];

    if(found && !found.isStatic){
        const last = selected[selected.length - 1];
        if(selected.length === 0){
            selected.push(found);
        } else if (found.plugin.tsumType === last.plugin.tsumType && !selected.includes(found) && Vector.magnitude(Vector.sub(found.position, last.position)) < 80) {
            selected.push(found);
            playChainSound(selected.length);
        }
    }
}

function playChainSound(count) {
    let sound = chainSoundMap[count] || (count >= 8 ? defaultChainSound : null);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(err => console.log("SE play blocked:", err));
    }
}

canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('mousemove', handleDragMove);

canvas.addEventListener('touchstart', startDrag, { passive: false });
canvas.addEventListener('touchend', endDrag, { passive: false });
canvas.addEventListener('touchmove', handleDragMove, { passive: false });

/* ================= START ================= */

updateSkillGauge();
Render.run(render);
Runner.run(Runner.create(), engine);