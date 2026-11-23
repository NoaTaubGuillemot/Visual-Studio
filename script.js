
"use strict";

/* ==========================
   PIXEL ARCADE V4.1
========================== */

const $ = id => document.getElementById(id);

// Même clé que la V3/V4 pour conserver les sauvegardes
const KEY = "pixel-arcade-single-v1";

const freeAvatars = [
  "👾","🤖","🦊","🐱","🐼","🐉",
  "👑","🦄","🐸","🦖","👻","🛸"
];

const boosts = {
  memory: {
    icon:"🧠",
    name:"Vision éclair",
    price:60,
    desc:"Montre les cartes pendant 3 secondes."
  },
  lucky: {
    icon:"🔎",
    name:"Détecteur",
    price:45,
    desc:"Élimine un mauvais coffre."
  },
  target: {
    icon:"⏱️",
    name:"Temps bonus",
    price:75,
    desc:"Ajoute 10 secondes."
  },
  quiz: {
    icon:"💡",
    name:"50 / 50",
    price:40,
    desc:"Supprime deux mauvaises réponses."
  }
};

const cosmetics = {
  ninja:{
    icon:"🥷",name:"Avatar Ninja",
    type:"avatar",price:180
  },
  alien:{
    icon:"👽",name:"Avatar Alien",
    type:"avatar",price:200
  },
  mage:{
    icon:"🧙",name:"Avatar Mage",
    type:"avatar",price:250
  },
  space:{
    icon:"🧑‍🚀",name:"Astronaute",
    type:"avatar",price:270
  },
  dragon:{
    icon:"🐲",name:"Dragon rare",
    type:"avatar",price:300
  },
  robot:{
    icon:"🦾",name:"Cyborg",
    type:"avatar",price:220
  },
  neon:{
    icon:"💜",name:"Cadre néon",
    type:"frame",price:150
  },
  gold:{
    icon:"👑",name:"Cadre doré",
    type:"frame",price:260
  },
  cyber:{
    icon:"⚡",name:"Cadre cyber",
    type:"frame",price:220
  },
  cyan:{
    icon:"🩵",name:"Thème cyan",
    type:"theme",price:250
  },
  amber:{
    icon:"🧡",name:"Thème ambre",
    type:"theme",price:250
  },
  emerald:{
    icon:"💚",name:"Thème émeraude",
    type:"theme",price:300
  }
};

const recordBase = {
  memoryWins:0,
  memoryBest:0,
  luckyWins:0,
  targetTotal:0,
  quizPerfect:0,
  snakeBest:0,
  snakeApples:0,
  pongWins:0,
  boostsUsed:0
};

const blank = () => ({
  coins:500,
  plays:0,
  wins:0,
  targetBest:0,
  quizBest:0,
  nickname:"PLAYER 01",
  avatar:"👾",
  lastClaim:0,
  inventory:{
    memory:0,
    lucky:0,
    target:0,
    quiz:0
  },
  totalXp:0,
  achievements:[],
  ownedCosmetics:[],
  frame:"basic",
  theme:"purple",
  soundOn:false,
  musicOn:false,
  records:{...recordBase},
  daily:{
    day:"",
    progress:{},
    claimed:[]
  }
});

/* ==========================
   SAUVEGARDE
========================== */

function load() {
  const state = blank();

  try {
    const old = JSON.parse(localStorage.getItem(KEY));

    if (!old || typeof old !== "object") {
      return state;
    }

    for (const key of [
      "coins","plays","wins","targetBest",
      "quizBest","totalXp","lastClaim"
    ]) {
      if (Number.isFinite(old[key]) && old[key] >= 0) {
        state[key] = Math.floor(old[key]);
      }
    }

    if (
      typeof old.nickname === "string" &&
      old.nickname.trim().length >= 2 &&
      old.nickname.trim().length <= 18
    ) {
      state.nickname = old.nickname.trim();
    }

    if (typeof old.avatar === "string") {
      state.avatar = old.avatar;
    }

    for (const key of Object.keys(boosts)) {
      if (
        Number.isInteger(old.inventory?.[key]) &&
        old.inventory[key] >= 0
      ) {
        state.inventory[key] = old.inventory[key];
      }
    }

    for (const key of Object.keys(recordBase)) {
      if (
        Number.isFinite(old.records?.[key]) &&
        old.records[key] >= 0
      ) {
        state.records[key] = Math.floor(old.records[key]);
      }
    }

    if (Array.isArray(old.achievements)) {
      state.achievements = old.achievements;
    }

    if (Array.isArray(old.ownedCosmetics)) {
      state.ownedCosmetics = old.ownedCosmetics;
    }

    if (["basic","neon","gold","cyber"].includes(old.frame)) {
      state.frame = old.frame;
    }

    if (
      ["purple","cyan","amber","emerald"].includes(old.theme)
    ) {
      state.theme = old.theme;
    }

    if (typeof old.soundOn === "boolean") {
      state.soundOn = old.soundOn;
    }

    if (typeof old.musicOn === "boolean") {
      state.musicOn = old.musicOn;
    }

    if (old.daily && typeof old.daily === "object") {
      state.daily = {
        day:old.daily.day || "",
        progress:old.daily.progress || {},
        claimed:old.daily.claimed || []
      };
    }

  } catch (error) {
    console.warn("Sauvegarde illisible :",error);
  }

  return state;
}

let s = load();

let alertTimeout;
let audioCtx;
let musicInterval;

const level = () =>
  Math.min(100,1 + Math.floor(s.totalXp / 200));

const levelXp = () =>
  level() === 100 ? 200 : s.totalXp % 200;

function save() {
  try {
    localStorage.setItem(KEY,JSON.stringify(s));
  } catch (error) {
    console.warn("Sauvegarde indisponible :",error);
  }

  renderStats();
}

function notify(message) {
  const element = $("toast");

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(alertTimeout);

  alertTimeout = setTimeout(() => {
    element.classList.remove("show");
  },2900);
}

function earnCoins(amount) {
  s.coins = Math.max(0,s.coins + amount);
  save();
}

function addXP(amount) {
  const previousLevel = level();

  s.totalXp = Math.min(
    19800,
    s.totalXp + amount
  );

  const newLevel = level();

  for (
    let current = previousLevel + 1;
    current <= newLevel;
    current++
  ) {
    if (current % 5 === 0) {
      s.coins += 150;
      notify("⭐ Niveau " + current + " ! +150 coins");
    }
  }

  save();
}

/* ==========================
   SON
========================== */

function sound(frequency = 440,length = .12) {
  if (!s.soundOn) return;

  try {
    audioCtx ??= new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(
      .045,
      audioCtx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      .001,
      audioCtx.currentTime + length
    );

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + length);

  } catch (error) {
    console.warn("Son indisponible",error);
  }
}

/* ==========================
   THÈMES
========================== */

function setTheme() {
  const colors = {
    purple:["#ae68ff","#44dafa"],
    cyan:["#27bbf5","#7ee8ff"],
    amber:["#ffb04f","#ffda89"],
    emerald:["#42d99a","#a0ffd8"]
  };

  const [primary,secondary] =
    colors[s.theme] || colors.purple;

  document.documentElement.style.setProperty(
    "--purple",primary
  );

  document.documentElement.style.setProperty(
    "--cyan",secondary
  );

  $("profileAvatar").className =
    "profile-portrait " + s.frame;
}

/* ==========================
   ACTUALISATION DU SITE
========================== */

function renderStats() {
  const fields = {
    topLevel:level(),
    topCoins:s.coins,
    topAvatar:s.avatar,
    homeWins:s.wins,
    homePlays:s.plays,
    homeLevel:level(),
    shopCoins:s.coins,
    profileAvatar:s.avatar,
    profileName:s.nickname,
    profileLevel:level(),
    profileCoins:s.coins,
    profilePlays:s.plays,
    profileWins:s.wins,
    profileTarget:s.targetBest,
    profileQuiz:s.quizBest + "/10",
    targetBest:s.targetBest,
    snakeBest:s.records.snakeBest
  };

  for (const [id,value] of Object.entries(fields)) {
    if ($(id)) {
      $(id).textContent = value;
    }
  }

  for (const id of ["xpFill","profileXPFill"]) {
    $(id).style.width =
      (levelXp() / 200 * 100) + "%";
  }

  $("xpText").textContent =
    levelXp() + " / 200 XP";

  $("profileXPText").textContent =
    levelXp() + " / 200 XP";

  for (const key of Object.keys(boosts)) {
    document.querySelectorAll(
      `[data-stock="${key}"]`
    ).forEach(element => {
      element.textContent = s.inventory[key];
    });
  }

  $("soundBtn").textContent =
    s.soundOn ? "🔊" : "🔇";

  $("musicBtn").textContent =
    s.musicOn ? "🎵" : "♫";

  setTheme();
  renderAvatarChoices();
  renderCosmeticChoices();
  renderShop();
  renderMissions();
  renderAchievements();
  renderInventory();
  updateBoosterButtons();
  renderGift();
}

function gameEnd(win,xp,coins) {
  s.plays++;

  if (win) {
    s.wins++;
  }

  s.coins += coins;

  addXP(xp);
  trackMission("plays",1);

  if (win) {
    trackMission("wins",1);
  }

  checkAchievements();
  save();

  if (win) {
    sound(660,.25);
  }
}

/* ==========================
   CATALOGUE
========================== */

const cards = [
  ["memory","🃏","MEMORY FLIP","Mémoire","Trouve huit paires."],
  ["lucky","🎁","LUCKY BOX","Chance","Trouve le coffre gagnant."],
  ["target","🎯","TARGET RUSH","Réflexes","Clique sur les cibles."],
  ["quiz","🧠","PIXEL QUIZ","Quiz","10 questions gaming."],
  ["snake","🐍","NEON SNAKE","Arcade","Mange les pommes."],
  ["pong","🏓","CYBER PONG","Arcade","Défie l'ordinateur."]
];

function renderCards() {
  const html = cards.map(
    ([id,icon,name,category,description]) => `
      <a class="game-card" href="#${id}">
        <div class="game-cover">${icon}</div>
        <div class="game-info">
          <small>${category.toUpperCase()}</small>
          <h3>${name}</h3>
          <p>${description}</p>
          <strong>▶ JOUER →</strong>
        </div>
      </a>
    `
  ).join("");

  $("homeGames").innerHTML = html;
  $("allGames").innerHTML = html;
}

/* ==========================
   NAVIGATION
========================== */

let currentPage = "home";

function navigate() {
  const id = location.hash.slice(1) || "home";

  const page = $(id)?.classList.contains("page")
    ? id
    : "home";

  if (currentPage === "target" && page !== "target") {
    stopTarget();
  }

  if (currentPage === "snake" && page !== "snake") {
    stopSnake();
  }

  if (currentPage === "pong" && page !== "pong") {
    stopPong();
  }

  currentPage = page;

  document.querySelectorAll(".page").forEach(element => {
    element.classList.toggle(
      "active",
      element.id === page
    );
  });

  window.scrollTo(0,0);
}

window.addEventListener("hashchange",navigate);

/* ==========================
   PROFIL
========================== */

$("nameForm").addEventListener("submit",event => {
  event.preventDefault();

  const name = $("nameInput").value
    .trim()
    .replace(/\s+/g," ");

  if (name.length < 2 || name.length > 18) {
    notify("Pseudo : 2 à 18 caractères");
    return;
  }

  s.nickname = name;
  save();

  notify("Pseudo enregistré !");
});

function owned(id) {
  return s.ownedCosmetics.includes(id);
}

function renderAvatarChoices() {
  const available = [
    ...freeAvatars,
    ...Object.entries(cosmetics)
      .filter(([id,item]) =>
        item.type === "avatar" && owned(id)
      )
      .map(([id,item]) => item.icon)
  ];

  $("avatarGrid").innerHTML = available.map(icon => `
    <button
      class="${s.avatar === icon ? "selected" : ""}"
      data-avatar="${icon}"
      title="Choisir cet avatar"
    >
      ${icon}
    </button>
  `).join("");
}

$("avatarGrid").addEventListener("click",event => {
  const icon = event.target
    .closest("[data-avatar]")
    ?.dataset.avatar;

  if (!icon) return;

  s.avatar = icon;
  save();

  notify("Avatar modifié");
});

function renderCosmeticChoices() {
  for (const [id,type,base] of [
    ["frameChoices","frame","basic"],
    ["themeChoices","theme","purple"]
  ]) {
    const values = [
      base,
      ...Object.entries(cosmetics)
        .filter(([key,item]) =>
          item.type === type && owned(key)
        )
        .map(([key]) => key)
    ];

    $(id).innerHTML = values.map(key => `
      <button
        class="${s[type] === key ? "selected" : ""}"
        data-set="${type}"
        data-value="${key}"
      >
        ${
          key === "basic" || key === "purple"
            ? "Classique"
            : cosmetics[key]?.name || key
        }
      </button>
    `).join("");
  }
}

for (const id of ["frameChoices","themeChoices"]) {
  $(id).addEventListener("click",event => {
    const button = event.target.closest("[data-set]");

    if (!button) return;

    s[button.dataset.set] = button.dataset.value;
    save();
  });
}

function renderInventory() {
  $("inventory").innerHTML =
    Object.entries(boosts)
      .map(([id,item]) =>
        `${item.icon} ${item.name} : <b>${s.inventory[id]}</b>`
      )
      .join(" &nbsp; • &nbsp; ");
}

/* ==========================
   BOUTIQUE
========================== */

function renderShop() {
  $("boostShop").innerHTML =
    Object.entries(boosts).map(([id,item]) => `
      <div class="panel shop-card">
        <div class="item-icon">${item.icon}</div>
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
        <small>En stock : ${s.inventory[id]}</small>
        <div class="price">🪙 ${item.price}</div>
        <button
          class="btn primary"
          data-buyboost="${id}"
          ${s.coins < item.price ? "disabled" : ""}
        >
          ACHETER +1
        </button>
      </div>
    `).join("");

  $("cosmeticShop").innerHTML =
    Object.entries(cosmetics).map(([id,item]) => `
      <div class="panel shop-card">
        <div class="item-icon">${item.icon}</div>
        <h3>${item.name}</h3>
        <p>
          ${
            item.type === "avatar" ? "Avatar exclusif" :
            item.type === "frame" ? "Cadre de profil" :
            "Thème de couleurs"
          }
        </p>
        <div class="price">🪙 ${item.price}</div>
        <button
          class="btn primary"
          data-buycos="${id}"
          ${owned(id) || s.coins < item.price ? "disabled" : ""}
        >
          ${owned(id) ? "DÉJÀ POSSÉDÉ" : "ACHETER"}
        </button>
      </div>
    `).join("");
}

$("boostShop").addEventListener("click",event => {
  const id = event.target
    .closest("[data-buyboost]")
    ?.dataset.buyboost;

  if (!boosts[id] || s.coins < boosts[id].price) {
    return;
  }

  s.coins -= boosts[id].price;
  s.inventory[id]++;

  sound(540);
  save();

  notify("Bonus acheté : " + boosts[id].name);
});

$("cosmeticShop").addEventListener("click",event => {
  const id = event.target
    .closest("[data-buycos]")
    ?.dataset.buycos;

  if (
    !cosmetics[id] ||
    owned(id) ||
    s.coins < cosmetics[id].price
  ) {
    return;
  }

  s.coins -= cosmetics[id].price;
  s.ownedCosmetics.push(id);

  sound(680);
  save();

  notify("Cosmétique débloqué !");
});

function consume(id) {
  if (s.inventory[id] < 1) {
    notify("Achète ce bonus dans la boutique");
    return false;
  }

  s.inventory[id]--;
  s.records.boostsUsed++;

  save();
  checkAchievements();

  return true;
}

/* ==========================
   MISSIONS QUOTIDIENNES
========================== */

const dayString = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  ].join("-");
};

const missions = [
  {
    id:"plays",
    name:"Joue 3 parties",
    goal:3,
    coins:90,
    xp:80
  },
  {
    id:"wins",
    name:"Remporte 2 victoires",
    goal:2,
    coins:130,
    xp:100
  },
  {
    id:"targets",
    name:"Touche 20 cibles",
    goal:20,
    coins:110,
    xp:90
  }
];

function ensureDay() {
  const today = dayString();

  if (s.daily.day !== today) {
    s.daily = {
      day:today,
      progress:{},
      claimed:[]
    };
  }
}

function trackMission(id,amount) {
  ensureDay();

  s.daily.progress[id] =
    (s.daily.progress[id] || 0) + amount;

  save();
}

function renderMissions() {
  ensureDay();

  $("missionsList").innerHTML =
    missions.map(mission => {
      const progress = Math.min(
        mission.goal,
        s.daily.progress[mission.id] || 0
      );

      const claimed =
        s.daily.claimed.includes(mission.id);

      return `
        <div class="panel mission">
          <h3>📅 ${mission.name}</h3>
          <p>${progress} / ${mission.goal}</p>
          <div class="progress-small">
            <div style="width:${
              100 * progress / mission.goal
            }%"></div>
          </div>
          <p>
            🪙 ${mission.coins}
            + ⭐ ${mission.xp} XP
          </p>
          <button
            class="btn primary"
            data-claim="${mission.id}"
            ${
              progress < mission.goal || claimed
                ? "disabled"
                : ""
            }
          >
            ${
              claimed ? "RÉCUPÉRÉ" :
              progress < mission.goal
                ? "EN COURS"
                : "RÉCUPÉRER"
            }
          </button>
        </div>
      `;
    }).join("");
}

$("missionsList").addEventListener("click",event => {
  const id = event.target
    .closest("[data-claim]")
    ?.dataset.claim;

  const mission = missions.find(item => item.id === id);

  if (
    !mission ||
    s.daily.claimed.includes(id) ||
    (s.daily.progress[id] || 0) < mission.goal
  ) {
    return;
  }

  s.daily.claimed.push(id);
  s.coins += mission.coins;

  addXP(mission.xp);
  checkAchievements();
  save();

  notify("Mission terminée !");
});

/* ==========================
   TROPHÉES
========================== */

const trophyDefs = [
  ["first","🎮","Première partie",s => s.plays >= 1],
  ["win1","🏆","Première victoire",s => s.wins >= 1],
  ["win10","🥇","10 victoires",s => s.wins >= 10],
  ["play25","⭐","25 parties",s => s.plays >= 25],
  ["money","💰","1 000 coins",s => s.coins >= 1000],
  ["lvl5","🚀","Niveau 5",s => level() >= 5],
  ["lvl10","🌌","Niveau 10",s => level() >= 10],
  ["memory","🃏","Maître Memory",s =>
    s.records.memoryWins >= 3
  ],
  ["target","🎯","Réflexes d'acier",s =>
    s.targetBest >= 25
  ],
  ["quiz","🧠","Quiz parfait",s =>
    s.quizBest === 10
  ],
  ["snake","🐍","Snake : 10 pommes",s =>
    s.records.snakeApples >= 10
  ],
  ["pong","🏓","Champion Pong",s =>
    s.records.pongWins >= 3
  ]
];

function checkAchievements() {
  let unlocked = 0;

  for (const [id,icon,name,test] of trophyDefs) {
    if (!s.achievements.includes(id) && test(s)) {
      s.achievements.push(id);
      s.coins += 60;
      s.totalXp = Math.min(19800,s.totalXp + 40);

      unlocked++;
      notify("🏆 Trophée : " + name);
    }
  }

  if (unlocked) {
    save();
  }
}

function renderAchievements() {
  $("trophiesList").innerHTML =
    trophyDefs.map(([id,icon,name]) => {
      const unlocked = s.achievements.includes(id);

      return `
        <div class="panel trophy ${
          unlocked ? "unlocked" : ""
        }">
          <div class="trophy-icon">
            ${unlocked ? icon : "🔒"}
          </div>
          <h3>${name}</h3>
          <p>
            ${
              unlocked
                ? "Débloqué !"
                : "Pas encore obtenu"
            }
          </p>
          <small>
            Récompense : 60 🪙 + 40 XP
          </small>
        </div>
      `;
    }).join("");
}

/* ==========================
   CADEAU QUOTIDIEN
========================== */

$("dailyGift").addEventListener("click",() => {
  if (Date.now() - s.lastClaim < 86400000) {
    return;
  }

  s.lastClaim = Date.now();

  earnCoins(100);
  notify("🎁 +100 Pixel Coins !");
});

function renderGift() {
  const available =
    Date.now() - s.lastClaim >= 86400000;

  $("dailyGift").disabled = !available;

  $("giftInfo").textContent = available
    ? "Ton cadeau quotidien est disponible."
    : "Cadeau déjà récupéré : reviens dans 24 h.";
}

$("resetProfile").addEventListener("click",() => {
  if (!confirm(
    "Effacer ton profil, ton inventaire et tous tes records ?"
  )) {
    return;
  }

  stopTarget();
  stopSnake();
  stopPong();

  s = blank();

  $("nameInput").value = s.nickname;

  initMemory();
  initLucky();
  initQuiz();

  save();

  notify("Profil remis à zéro");
});

/* ==========================
   MEMORY FLIP
========================== */

const symbols = [
  "👾","🚀","💎","⭐",
  "🎮","🔥","🛸","👑"
];

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i],result[j]] =
      [result[j],result[i]];
  }

  return result;
}

let memDeck = [];
let memShown = [];
let memMatched = [];

let memMoves = 0;
let memSeconds = 0;

let memClock;
let memWait;

let memBusy = false;
let memComplete = false;
let memGeneration = 0;

function initMemory() {
  memGeneration++;

  clearInterval(memClock);
  clearTimeout(memWait);

  memClock = null;

  memDeck = shuffle([...symbols,...symbols]);
  memShown = [];
  memMatched = [];

  memMoves = 0;
  memSeconds = 0;

  memBusy = false;
  memComplete = false;

  $("memMoves").textContent = "0";
  $("memPairs").textContent = "0/8";
  $("memTime").textContent = "00:00";
  $("memMsg").textContent = "Retourne deux cartes.";

  $("memoryBoard").innerHTML = memDeck.map(
    (symbol,index) => `
      <button data-card="${index}">?</button>
    `
  ).join("");

  updateBoosterButtons();
}

function memoryReveal() {
  document.querySelectorAll("[data-card]").forEach(button => {
    const index = Number(button.dataset.card);

    const visible =
      memMatched.includes(index) ||
      memShown.includes(index) ||
      button.classList.contains("peek");

    button.textContent =
      visible ? memDeck[index] : "?";

    button.classList.toggle("flipped",visible);

    button.classList.toggle(
      "matched",
      memMatched.includes(index)
    );
  });
}

$("memoryBoard").addEventListener("click",event => {
  const button = event.target.closest("[data-card]");

  if (!button || memBusy || memComplete) {
    return;
  }

  const index = Number(button.dataset.card);

  if (
    memShown.includes(index) ||
    memMatched.includes(index)
  ) {
    return;
  }

  if (!memClock) {
    memClock = setInterval(() => {
      memSeconds++;

      $("memTime").textContent =
        String(Math.floor(memSeconds / 60)).padStart(2,"0") +
        ":" +
        String(memSeconds % 60).padStart(2,"0");
    },1000);
  }

  memShown.push(index);
  memoryReveal();

  sound(440);

  if (memShown.length === 2) {
    memMoves++;
    $("memMoves").textContent = memMoves;

    const first = memShown[0];
    const second = memShown[1];

    if (memDeck[first] === memDeck[second]) {
      memMatched.push(first,second);
      memShown = [];

      $("memPairs").textContent =
        memMatched.length / 2 + "/8";

      memoryReveal();

      if (memMatched.length === 16) {
        memComplete = true;

        clearInterval(memClock);

        s.records.memoryWins++;

        if (
          !s.records.memoryBest ||
          memMoves < s.records.memoryBest
        ) {
          s.records.memoryBest = memMoves;
        }

        gameEnd(true,60,100);

        notify("Memory gagné ! +100 coins");
      }

    } else {
      memBusy = true;

      const generation = memGeneration;

      memWait = setTimeout(() => {
        if (generation !== memGeneration) {
          return;
        }

        memShown = [];
        memBusy = false;

        memoryReveal();
        updateBoosterButtons();
      },850);
    }
  }

  updateBoosterButtons();
});

$("memReset").addEventListener("click",initMemory);

/* ==========================
   LUCKY BOX
========================== */

let luckyWinner = 0;
let luckyUsed = false;
let luckyHint = false;
let luckyExcluded = -1;

function initLucky() {
  luckyWinner = Math.floor(Math.random() * 3);

  luckyUsed = false;
  luckyHint = false;
  luckyExcluded = -1;

  document.querySelectorAll("[data-chest]").forEach(
    (button,index) => {
      button.disabled = false;
      button.className = "";

      button.innerHTML = `
        🎁<small>COFFRE ${index + 1}</small>
      `;
    }
  );

  $("luckyMsg").textContent = "Choisis un coffre.";

  updateBoosterButtons();
}

$("chests").addEventListener("click",event => {
  const button = event.target.closest("[data-chest]");

  if (!button || button.disabled || luckyUsed) {
    return;
  }

  if (s.coins < 20) {
    notify("Il faut 20 coins pour jouer");
    return;
  }

  luckyUsed = true;

  s.coins -= 20;

  const selected = Number(button.dataset.chest);
  const win = selected === luckyWinner;

  document.querySelectorAll("[data-chest]").forEach(
    (chest,index) => {
      chest.disabled = true;

      if (index === luckyWinner) {
        chest.className = "win";

        chest.innerHTML = `
          💎<small>GAGNANT</small>
        `;
      } else if (index === selected) {
        chest.className = "lose";

        chest.innerHTML = `
          💀<small>PERDU</small>
        `;
      }
    }
  );

  if (win) {
    s.records.luckyWins++;
  }

  gameEnd(
    win,
    win ? 40 : 5,
    win ? 60 : 0
  );

  $("luckyMsg").textContent = win
    ? "💎 JACKPOT ! +60 coins"
    : "💀 Raté, essaie encore !";

  updateBoosterButtons();
});

$("luckyReset").addEventListener("click",initLucky);

/* ==========================
   TARGET RUSH V4.1
   NOUVELLES MÉCANIQUES
========================== */

let targetRunning = false;
let targetSeconds = 30;
let targetScore = 0;

let targetTimer;
let targetRespawnTimer;

let targetBoosted = false;

// Chaque cible reste 1,5 seconde maximum
const TARGET_LIFETIME = 1500;

function placeTarget() {
  if (!targetRunning) return;

  clearTimeout(targetRespawnTimer);

  const arena = $("arena");
  const dot = $("targetDot");

  const maxX = Math.max(
    0,
    arena.clientWidth - dot.offsetWidth - 16
  );

  const maxY = Math.max(
    0,
    arena.clientHeight - dot.offsetHeight - 16
  );

  // Position aléatoire
  dot.style.left =
    (8 + Math.random() * maxX) + "px";

  dot.style.top =
    (8 + Math.random() * maxY) + "px";

  // Déplacement automatique après 1,5 seconde
  targetRespawnTimer = setTimeout(() => {
    if (targetRunning) {
      placeTarget();
    }
  },TARGET_LIFETIME);
}

function targetOverlay(text) {
  $("targetOverlay").style.display = "flex";

  $("targetOverlay").innerHTML = `
    <h2>${text}</h2>
    <button class="btn primary" id="targetStart">
      ▶ JOUER
    </button>
  `;
}

function startTarget() {
  clearInterval(targetTimer);
  clearTimeout(targetRespawnTimer);

  targetRunning = true;
  targetSeconds = 30;
  targetScore = 0;
  targetBoosted = false;

  $("targetTime").textContent = "30";
  $("targetScore").textContent = "0";

  $("targetDot").style.display = "block";
  $("targetOverlay").style.display = "none";

  placeTarget();

  targetTimer = setInterval(() => {
    targetSeconds--;

    $("targetTime").textContent = targetSeconds;

    if (targetSeconds <= 0) {
      finishTarget();
    }
  },1000);

  updateBoosterButtons();
}

function finishTarget() {
  if (!targetRunning) return;

  clearInterval(targetTimer);
  clearTimeout(targetRespawnTimer);

  targetRunning = false;

  $("targetDot").style.display = "none";

  s.targetBest = Math.max(
    s.targetBest,
    targetScore
  );

  s.records.targetTotal += targetScore;

  trackMission("targets",targetScore);

  const win = targetScore >= 15;

  gameEnd(
    win,
    win ? 60 : 10,
    win ? 100 : 0
  );

  targetOverlay(
    "SCORE : " + targetScore +
    (win ? " 🏆" : "")
  );

  updateBoosterButtons();
}

function stopTarget() {
  clearInterval(targetTimer);
  clearTimeout(targetRespawnTimer);

  targetRunning = false;

  $("targetDot").style.display = "none";

  targetOverlay("PARTIE INTERROMPUE");

  updateBoosterButtons();
}

// Bouton démarrer
$("targetOverlay").addEventListener("click",event => {
  if (event.target.closest("#targetStart")) {
    startTarget();
  }
});

// Cible touchée
$("targetDot").addEventListener("click",event => {
  event.stopPropagation();

  if (!targetRunning) return;

  targetScore++;

  $("targetScore").textContent = targetScore;

  sound(650,.04);

  // Nouvelle cible immédiatement
  placeTarget();
});

// Clic raté sur le terrain
$("arena").addEventListener("click",event => {
  if (!targetRunning) return;

  if (event.target.closest("#targetDot")) {
    return;
  }

  // Aucun point si on rate
  sound(220,.06);

  // La cible change de place immédiatement
  placeTarget();
});

/* ==========================
   PIXEL QUIZ
========================== */

const questions = [
  [
    "⛏️",
    "Quel jeu met en scène Steve ?",
    ["Roblox","Minecraft","Fortnite","Terraria"],
    1
  ],
  [
    "🎮",
    "Qui a créé la PlayStation ?",
    ["Nintendo","Microsoft","Sony","Sega"],
    2
  ],
  [
    "🚗",
    "Dans quel jeu trouve-t-on Los Santos ?",
    ["GTA V","The Sims","Forza","Cyberpunk"],
    0
  ],
  [
    "🍄",
    "Quel est le frère de Mario ?",
    ["Yoshi","Toad","Wario","Luigi"],
    3
  ],
  [
    "⚽",
    "Quel studio développe EA Sports FC ?",
    ["Ubisoft","EA Sports","Valve","Rockstar"],
    1
  ],
  [
    "🔫",
    "Quel jeu comporte une carte appelée Ascent ?",
    ["Overwatch","Apex","Valorant","CS"],
    2
  ],
  [
    "🧱",
    "Quel bloc est le plus résistant ?",
    ["Obsidienne","Terre","Sable","Laine"],
    0
  ],
  [
    "🏎️",
    "Quelle franchise est liée à Xbox ?",
    ["Gran Turismo","Forza","Mario Kart","Trackmania"],
    1
  ],
  [
    "🪂",
    "Quel Battle Royale permet de construire ?",
    ["Minecraft","GTA","Rocket League","Fortnite"],
    3
  ],
  [
    "🐉",
    "Quel jeu se déroule à Bordeciel ?",
    ["The Witcher","Elden Ring","Skyrim","Dark Souls"],
    2
  ]
];

let quizIndex = 0;
let quizScore = 0;

let quizAnswered = false;
let quizHint = false;
let quizDone = false;

function initQuiz() {
  quizIndex = 0;
  quizScore = 0;
  quizDone = false;

  showQuestion();
}

function showQuestion() {
  quizAnswered = false;
  quizHint = false;

  $("quizProgress").textContent =
    `QUESTION ${quizIndex + 1}/10`;

  $("quizScore").textContent =
    "SCORE " + quizScore;

  $("quizIcon").textContent =
    questions[quizIndex][0];

  $("quizQuestion").textContent =
    questions[quizIndex][1];

  $("quizMsg").textContent = "";

  $("quizAnswers").innerHTML =
    questions[quizIndex][2].map(
      (answer,index) => `
        <button data-answer="${index}">
          ${answer}
        </button>
      `
    ).join("");

  $("quizNext").disabled = true;

  $("quizNext").textContent =
    quizIndex === 9
      ? "VOIR LE RÉSULTAT →"
      : "QUESTION SUIVANTE →";

  updateBoosterButtons();
}

$("quizAnswers").addEventListener("click",event => {
  const button = event.target.closest("[data-answer]");

  if (!button || quizAnswered || quizDone) {
    return;
  }

  quizAnswered = true;

  const correct = questions[quizIndex][3];
  const selected = Number(button.dataset.answer);

  if (selected === correct) {
    quizScore++;
  }

  $("quizScore").textContent =
    "SCORE " + quizScore;

  document.querySelectorAll("[data-answer]").forEach(
    answer => {
      answer.disabled = true;

      if (Number(answer.dataset.answer) === correct) {
        answer.classList.add("correct");
      } else if (
        Number(answer.dataset.answer) === selected
      ) {
        answer.classList.add("wrong");
      }
    }
  );

  $("quizNext").disabled = false;

  updateBoosterButtons();

  sound(
    selected === correct ? 740 : 240
  );
});

$("quizNext").addEventListener("click",() => {
  if (quizDone) {
    initQuiz();
    return;
  }

  if (!quizAnswered) {
    return;
  }

  if (quizIndex < 9) {
    quizIndex++;
    showQuestion();
    return;
  }

  quizDone = true;

  s.quizBest = Math.max(
    s.quizBest,
    quizScore
  );

  if (quizScore === 10) {
    s.records.quizPerfect++;
  }

  const win = quizScore >= 7;

  gameEnd(
    win,
    win ? 60 : 10,
    win ? 100 : 0
  );

  $("quizQuestion").textContent =
    "RÉSULTAT : " + quizScore + "/10" +
    (win ? " 🏆" : "");

  $("quizAnswers").innerHTML = "";

  $("quizMsg").textContent = win
    ? "+100 coins et +60 XP"
    : "Rejoue pour améliorer ton score !";

  $("quizNext").disabled = false;
  $("quizNext").textContent = "↻ REJOUER";

  updateBoosterButtons();
});

/* ==========================
   BONUS DES MINI-JEUX
========================== */

function updateBoosterButtons() {
  document.querySelectorAll("[data-use]").forEach(button => {
    const key = button.dataset.use;

    button.disabled =
      s.inventory[key] < 1 ||
      (
        key === "memory" &&
        (
          memBusy ||
          memComplete ||
          memShown.length > 0
        )
      ) ||
      (
        key === "lucky" &&
        (luckyUsed || luckyHint)
      ) ||
      (
        key === "target" &&
        (!targetRunning || targetBoosted)
      ) ||
      (
        key === "quiz" &&
        (quizAnswered || quizHint || quizDone)
      );
  });
}

document.querySelectorAll("[data-use]").forEach(button => {
  button.addEventListener("click",() => {
    const key = button.dataset.use;

    if (button.disabled || !consume(key)) {
      return;
    }

    // BONUS MEMORY
    if (key === "memory") {
      memBusy = true;

      const cards = [
        ...document.querySelectorAll("[data-card]")
      ];

      cards.forEach(card => {
        const index = Number(card.dataset.card);

        if (!memMatched.includes(index)) {
          card.classList.add("peek");
        }
      });

      memoryReveal();

      const generation = memGeneration;

      setTimeout(() => {
        if (generation !== memGeneration) {
          return;
        }

        cards.forEach(card => {
          card.classList.remove("peek");
        });

        memBusy = false;

        memoryReveal();
        updateBoosterButtons();
      },3000);
    }

    // BONUS LUCKY
    if (key === "lucky") {
      const losers = [0,1,2].filter(
        index => index !== luckyWinner
      );

      luckyExcluded = losers[
        Math.floor(Math.random() * losers.length)
      ];

      luckyHint = true;

      const chest = document.querySelector(
        `[data-chest="${luckyExcluded}"]`
      );

      chest.disabled = true;
      chest.className = "excluded";

      chest.innerHTML = `
        ❌<small>VIDE</small>
      `;
    }

    // BONUS TARGET
    if (key === "target") {
      targetSeconds += 10;
      targetBoosted = true;

      $("targetTime").textContent = targetSeconds;
    }

    // BONUS QUIZ
    if (key === "quiz") {
      quizHint = true;

      const wrongAnswers = shuffle(
        [0,1,2,3].filter(
          index => index !== questions[quizIndex][3]
        )
      ).slice(0,2);

      wrongAnswers.forEach(index => {
        const answer = document.querySelector(
          `[data-answer="${index}"]`
        );

        answer.disabled = true;
        answer.classList.add("hidden-answer");
      });
    }

    notify("⚡ Bonus utilisé !");

    updateBoosterButtons();
  });
});

/* ==========================
   NEON SNAKE
========================== */

const snakeCanvas = $("snakeCanvas");
const sc = snakeCanvas.getContext("2d");

let snake = [];
let apple = {x:10,y:10};

let dir = {x:1,y:0};
let nextDir = {x:1,y:0};

let snakeTimer;
let snakeRunning = false;
let snakeScore = 0;

function newApple() {
  let position;

  do {
    position = {
      x:Math.floor(Math.random() * 20),
      y:Math.floor(Math.random() * 20)
    };
  } while (
    snake.some(segment =>
      segment.x === position.x &&
      segment.y === position.y
    )
  );

  return position;
}

function drawSnake() {
  sc.fillStyle = "#0b1429";
  sc.fillRect(0,0,400,400);

  sc.strokeStyle = "#1c3050";

  for (let i = 0; i < 400; i += 20) {
    sc.beginPath();

    sc.moveTo(i,0);
    sc.lineTo(i,400);

    sc.moveTo(0,i);
    sc.lineTo(400,i);

    sc.stroke();
  }

  sc.fillStyle = "#fb6885";

  sc.fillRect(
    apple.x * 20 + 3,
    apple.y * 20 + 3,
    14,14
  );

  snake.forEach((segment,index) => {
    sc.fillStyle =
      index === 0 ? "#bc88ff" : "#53e5ae";

    sc.fillRect(
      segment.x * 20 + 2,
      segment.y * 20 + 2,
      16,16
    );
  });
}

function startSnake() {
  clearInterval(snakeTimer);

  snake = [
    {x:8,y:10},
    {x:7,y:10},
    {x:6,y:10}
  ];

  dir = {x:1,y:0};
  nextDir = {x:1,y:0};

  snakeScore = 0;
  snakeRunning = true;

  apple = newApple();

  $("snakeScore").textContent = "0";

  drawSnake();

  snakeTimer = setInterval(stepSnake,140);
}

function stepSnake() {
  dir = nextDir;

  const head = {
    x:snake[0].x + dir.x,
    y:snake[0].y + dir.y
  };

  const eating =
    head.x === apple.x &&
    head.y === apple.y;

  const body = eating
    ? snake
    : snake.slice(0,-1);

  const collision =
    head.x < 0 ||
    head.x >= 20 ||
    head.y < 0 ||
    head.y >= 20 ||
    body.some(segment =>
      segment.x === head.x &&
      segment.y === head.y
    );

  if (collision) {
    stopSnake();

    if (snakeScore > 0) {
      s.records.snakeBest = Math.max(
        s.records.snakeBest,
        snakeScore
      );

      const apples = snakeScore / 10;

      s.records.snakeApples += apples;

      gameEnd(
        apples >= 3,
        10 + apples * 5,
        apples >= 3 ? 50 : 0
      );

      notify("🐍 Score Snake : " + snakeScore);
    }

    return;
  }

  snake.unshift(head);

  if (eating) {
    snakeScore += 10;

    $("snakeScore").textContent = snakeScore;

    apple = newApple();

    sound(710,.07);
  } else {
    snake.pop();
  }

  drawSnake();
}

function stopSnake() {
  clearInterval(snakeTimer);

  snakeRunning = false;
}

function setDirection(direction) {
  const directions = {
    up:{x:0,y:-1},
    down:{x:0,y:1},
    left:{x:-1,y:0},
    right:{x:1,y:0}
  };

  const next = directions[direction];

  if (
    next &&
    !(
      next.x === -dir.x &&
      next.y === -dir.y
    )
  ) {
    nextDir = next;
  }
}

$("snakeStart").addEventListener("click",startSnake);

document.querySelectorAll("[data-direction]").forEach(
  button => {
    button.addEventListener("click",() => {
      setDirection(button.dataset.direction);
    });
  }
);

/* ==========================
   CYBER PONG V4.1
   3 DIFFICULTÉS
   ADVERSAIRE IMPARFAIT
========================== */

const pongCanvas = $("pongCanvas");
const pc = pongCanvas.getContext("2d");

let pongRunning = false;
let pongRAF;

let pongY = 135;
let botY = 135;

let pBall = {
  x:300,
  y:175,
  vx:4,
  vy:2
};

let pScore = 0;
let bScore = 0;

// Paramètres de l'adversaire
let pongDifficulty = "normal";
let botError = 0;
let botReaction = 0;
let botTarget = 175;

// Trois niveaux disponibles
const pongModes = {
  easy:{
    speed:2.5,
    error:95,
    reaction:32,
    ballSpeed:4.2
  },

  normal:{
    speed:4.2,
    error:50,
    reaction:20,
    ballSpeed:5
  },

  hard:{
    speed:6,
    error:22,
    reaction:12,
    ballSpeed:5.8
  }
};

function drawPong() {
  // Fond
  pc.fillStyle = "#0a1325";
  pc.fillRect(0,0,600,350);

  // Ligne du milieu
  pc.fillStyle = "#2a3856";

  for (let y = 0; y < 350; y += 25) {
    pc.fillRect(298,y,4,12);
  }

  // Raquette du joueur
  pc.fillStyle = "#54dfff";
  pc.fillRect(20,pongY,12,80);

  // Raquette de l'ordinateur
  pc.fillStyle = "#ad6bff";
  pc.fillRect(568,botY,12,80);

  // Balle
  pc.fillStyle = "#ffffff";

  pc.beginPath();
  pc.arc(pBall.x,pBall.y,8,0,Math.PI * 2);
  pc.fill();
}

// Balle au centre avec angle aléatoire
function resetBall(direction = 1) {
  const mode = pongModes[pongDifficulty];

  const angle =
    Math.random() * 1.4 - 0.7;

  pBall = {
    x:300,
    y:175,
    vx:Math.cos(angle) * mode.ballSpeed * direction,
    vy:Math.sin(angle) * mode.ballSpeed
  };

  // Nouvelle erreur de l'ordinateur
  botError = 0;
  botReaction = 0;
}

// Rebond sur une raquette
function bounceBall(paddleY,direction) {
  const center = paddleY + 40;

  // Position de l'impact sur la raquette
  const impact = Math.max(
    -1,
    Math.min(
      1,
      (pBall.y - center) / 40
    )
  );

  // Plus l'impact est éloigné du centre,
  // plus l'angle de rebond est important
  const angle = impact * 1.05;

  // Ajout de hasard
  const variation =
    (Math.random() - .5) * .28;

  const finalAngle = angle + variation;

  // Accélération progressive
  const speed = Math.min(
    9,
    Math.hypot(pBall.vx,pBall.vy) + .22
  );

  pBall.vx =
    Math.cos(finalAngle) * speed * direction;

  pBall.vy =
    Math.sin(finalAngle) * speed;

  // Évite les échanges parfaitement horizontaux
  if (Math.abs(pBall.vy) < .8) {
    pBall.vy =
      (Math.random() < .5 ? -1 : 1) * .8;
  }

  sound(520,.05);
}

// Intelligence artificielle du gardien adverse
function moveBot() {
  const mode = pongModes[pongDifficulty];

  botReaction++;

  // L'ordinateur réévalue périodiquement
  // la position de la balle
  if (botReaction >= mode.reaction) {
    botReaction = 0;

    // Il commet parfois une erreur
    botError =
      (Math.random() * 2 - 1) * mode.error;

    botTarget = pBall.y + botError;
  }

  if (pBall.vx > 0) {
    // La balle arrive vers l'ordinateur
    const difference =
      botTarget - (botY + 40);

    const movement = Math.max(
      -mode.speed,
      Math.min(mode.speed,difference)
    );

    botY += movement;

  } else {
    // Quand la balle s'éloigne,
    // l'adversaire se recentre
    const difference =
      175 - (botY + 40);

    botY += Math.max(
      -mode.speed * .5,
      Math.min(
        mode.speed * .5,
        difference
      )
    );
  }

  // L'ordinateur reste dans le terrain
  botY = Math.max(
    0,
    Math.min(270,botY)
  );
}

// Boucle du jeu
function tickPong() {
  if (!pongRunning) return;

  moveBot();

  pBall.x += pBall.vx;
  pBall.y += pBall.vy;

  // Rebonds sur les murs haut et bas
  if (pBall.y <= 8) {
    pBall.y = 8;
    pBall.vy = Math.abs(pBall.vy);
  }

  if (pBall.y >= 342) {
    pBall.y = 342;
    pBall.vy = -Math.abs(pBall.vy);
  }

  // Collision avec la raquette du joueur
  if (
    pBall.vx < 0 &&
    pBall.x <= 40 &&
    pBall.x >= 20 &&
    pBall.y + 8 >= pongY &&
    pBall.y - 8 <= pongY + 80
  ) {
    pBall.x = 40;

    bounceBall(pongY,1);
  }

  // Collision avec la raquette adverse
  if (
    pBall.vx > 0 &&
    pBall.x >= 560 &&
    pBall.x <= 580 &&
    pBall.y + 8 >= botY &&
    pBall.y - 8 <= botY + 80
  ) {
    pBall.x = 560;

    bounceBall(botY,-1);
  }

  // Point remporté par l'ordinateur
  if (pBall.x < 0) {
    bScore++;

    $("pongBot").textContent = bScore;

    sound(200,.15);

    if (bScore < 5) {
      resetBall(1);
    }
  }

  // Point remporté par le joueur
  if (pBall.x > 600) {
    pScore++;

    $("pongPlayer").textContent = pScore;

    sound(800,.15);

    if (pScore < 5) {
      resetBall(-1);
    }
  }

  drawPong();

  // Fin du match à cinq points
  if (pScore >= 5 || bScore >= 5) {
    const win = pScore >= 5;

    stopPong();

    if (win) {
      s.records.pongWins++;
    }

    gameEnd(
      win,
      win ? 60 : 15,
      win ? 100 : 0
    );

    notify(
      win
        ? "🏆 Victoire Pong !"
        : "Pong perdu, retente ta chance !"
    );

    return;
  }

  pongRAF = requestAnimationFrame(tickPong);
}

// Lancement d'une partie
function startPong() {
  stopPong();

  // Lecture de la difficulté choisie
  pongDifficulty = $("pongDifficulty").value;

  pongRunning = true;

  pScore = 0;
  bScore = 0;

  pongY = 135;
  botY = 135;

  $("pongPlayer").textContent = "0";
  $("pongBot").textContent = "0";

  // Impossible de changer la difficulté
  // pendant une partie en cours
  $("pongDifficulty").disabled = true;

  resetBall(
    Math.random() < .5 ? -1 : 1
  );

  pongRAF = requestAnimationFrame(tickPong);
}

// Arrêt d'une partie
function stopPong() {
  pongRunning = false;

  cancelAnimationFrame(pongRAF);

  $("pongDifficulty").disabled = false;
}

$("pongStart").addEventListener("click",startPong);

// Contrôle souris
pongCanvas.addEventListener("mousemove",event => {
  const rect = pongCanvas.getBoundingClientRect();

  pongY = Math.min(
    270,
    Math.max(
      0,
      (event.clientY - rect.top) *
      350 / rect.height - 40
    )
  );
});

// Contrôle tactile
pongCanvas.addEventListener("touchmove",event => {
  event.preventDefault();

  const rect = pongCanvas.getBoundingClientRect();

  pongY = Math.min(
    270,
    Math.max(
      0,
      (event.touches[0].clientY - rect.top) *
      350 / rect.height - 40
    )
  );

},{passive:false});

/* ==========================
   CONTRÔLES DU CLAVIER
========================== */

window.addEventListener("keydown",event => {
  if (
    ["INPUT","TEXTAREA","SELECT"].includes(
      document.activeElement?.tagName
    )
  ) {
    return;
  }

  const direction = {
    ArrowUp:"up",
    ArrowDown:"down",
    ArrowLeft:"left",
    ArrowRight:"right",
    z:"up",
    Z:"up",
    q:"left",
    Q:"left",
    s:"down",
    S:"down",
    d:"right",
    D:"right"
  }[event.key];

  // Snake
  if (currentPage === "snake" && direction) {
    event.preventDefault();

    setDirection(direction);
  }

  // Pong
  if (
    currentPage === "pong" &&
    (
      event.key === "ArrowUp" ||
      event.key === "ArrowDown"
    )
  ) {
    event.preventDefault();

    pongY = Math.min(
      270,
      Math.max(
        0,
        pongY + (
          event.key === "ArrowUp" ? -22 : 22
        )
      )
    );
  }
});

/* ==========================
   MUSIQUE ET BRUITAGES
========================== */

$("soundBtn").addEventListener("click",() => {
  s.soundOn = !s.soundOn;

  save();

  sound(660);
});

$("musicBtn").addEventListener("click",() => {
  s.musicOn = !s.musicOn;

  clearInterval(musicInterval);

  if (s.musicOn) {
    s.soundOn = true;

    let step = 0;

    musicInterval = setInterval(() => {
      sound(
        [330,392,440,523,440,392,294,392][
          step++ % 8
        ],
        .16
      );
    },350);
  }

  save();
});

/* ==========================
   DÉMARRAGE DU SITE
========================== */

renderCards();
ensureDay();

initMemory();
initLucky();
initQuiz();

$("nameInput").value = s.nickname;
$("snakeScore").textContent = "0";

// Préparation des terrains de jeu
drawSnake();
drawPong();

// Mise à jour de tous les éléments
renderStats();
checkAchievements();

// Affiche la page demandée
navigate();

console.log(
  "👾 PIXEL ARCADE V4.1 chargé avec succès !"
);
