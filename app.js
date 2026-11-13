const PHASES = [
  "Draw Phase",
  "Standby Phase",
  "Main Phase 1",
  "Battle Phase",
  "Main Phase 2",
  "End Phase"
];

const MONSTER_DATA = [
  { name: "Blue-Eyes White Dragon", type: "monster", level: 8, atk: 3000, def: 2500 },
  { name: "Dark Magician", type: "monster", level: 7, atk: 2500, def: 2100 },
  { name: "Gaia the Fierce Knight", type: "monster", level: 7, atk: 2300, def: 2100 },
  { name: "Summoned Skull", type: "monster", level: 6, atk: 2500, def: 1200 },
  { name: "Mystical Elf", type: "monster", level: 4, atk: 800, def: 2000 },
  { name: "Silver Fang", type: "monster", level: 3, atk: 1200, def: 800 },
  { name: "Mighty Warrior", type: "monster", level: 4, atk: 1400, def: 1000 },
  { name: "Battle Ox", type: "monster", level: 4, atk: 1700, def: 1000 },
  { name: "Kuriboh", type: "monster", level: 1, atk: 300, def: 200 },
  { name: "Harpie Lady", type: "monster", level: 4, atk: 1300, def: 1400 },
  { name: "Sangan", type: "monster", level: 4, atk: 1000, def: 600 },
  { name: "Flame Swordsman", type: "monster", level: 5, atk: 1800, def: 1600 },
  { name: "Jinzo", type: "monster", level: 6, atk: 2400, def: 1500 },
  { name: "Luster Dragon", type: "monster", level: 4, atk: 1900, def: 1200 },
  { name: "Red-Eyes Black Dragon", type: "monster", level: 7, atk: 2400, def: 2000 }
];

const SPELL_DATA = [
  { name: "Pot of Greed", type: "spell", effect: "draw2" },
  { name: "Raiden Burst", type: "spell", effect: "deal800" },
  { name: "Dark Hole", type: "spell", effect: "destroyAllMonsters" },
  { name: "Graceful Charity", type: "spell", effect: "draw3discard1" },
  { name: "Monster Reborn", type: "spell", effect: "revive" }
];

const TRAP_DATA = [
  { name: "Mirror Force", type: "trap", effect: "destroyAttackers" },
  { name: "Trap Hole", type: "trap", effect: "destroyLevel4" },
  { name: "Negate Attack", type: "trap", effect: "negateBattle" },
  { name: "Time Machine", type: "trap", effect: "draw1" },
  { name: "Wall of Disruption", type: "trap", effect: "reflectDamage" }
];

const MAX_FIELD = 5;
const STARTING_LP = 8000;
const STARTING_HAND = 5;

const state = {
  players: [],
  currentPlayer: 0,
  phaseIndex: 0,
  turnNumber: 1,
  selectedCard: null,
  winner: null,
  log: []
};

function cloneBaseCard(base) {
  return {
    ...base,
    id: `${base.name}-${Math.random().toString(16).slice(2, 9)}`,
    position: "attack",
    faceUp: true,
    isFaceDown: false,
    canAttack: true,
    setTurn: 0
  };
}

function createDeck() {
  const deck = [];
  for (let i = 0; i < 16; i++) {
    deck.push(cloneBaseCard(MONSTER_DATA[i % MONSTER_DATA.length]));
  }
  for (let i = 0; i < 8; i++) {
    deck.push(cloneBaseCard(SPELL_DATA[i % SPELL_DATA.length]));
  }
  for (let i = 0; i < 8; i++) {
    deck.push(cloneBaseCard(TRAP_DATA[i % TRAP_DATA.length]));
  }

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function makePlayer(name) {
  return {
    name,
    lp: STARTING_LP,
    deck: createDeck(),
    hand: [],
    monsters: Array(MAX_FIELD).fill(null),
    spellTrap: Array(MAX_FIELD).fill(null),
    graveyard: [],
    normalSummonUsed: false,
    canAttackThisTurn: true,
    hasEnteredBattlePhase: false,
    globalTurnNumber: 0
  };
}

function getCurrentPlayer() {
  return state.players[state.currentPlayer];
}

function getOpponentPlayer() {
  return state.players[1 - state.currentPlayer];
}

function logMessage(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 12);
}

function updateTurnBadge() {
  const current = getCurrentPlayer();
  document.getElementById("turnBadge").textContent = `${current.name}'s Turn`;
  document.getElementById("phaseName").textContent = PHASES[state.phaseIndex];
}

function updateLpDisplay() {
  document.getElementById("player1Lp").textContent = state.players[0].lp;
  document.getElementById("player2Lp").textContent = state.players[1].lp;
}

function drawCard(player) {
  if (!player.deck.length) {
    logMessage(`${player.name} has no cards left to draw.`);
    return;
  }

  const card = player.deck.pop();
  player.hand.push(card);
  logMessage(`${player.name} draws ${card.name}.`);
}

function discardToSix(player) {
  while (player.hand.length > 6) {
    const discarded = player.hand.pop();
    if (discarded) {
      player.graveyard.push(discarded);
      logMessage(`${player.name} discards ${discarded.name} to 6 cards.`);
    }
  }
}

function findCardInList(list, cardId) {
  return list.findIndex((card) => card && card.id === cardId);
}

function findSelectedCard(owner) {
  if (!state.selectedCard || state.selectedCard.owner !== owner) return null;
  return state.selectedCard.cardId;
}

function onSelectCard(cardId, ownerIndex) {
  state.selectedCard = { cardId, owner: ownerIndex };
  render();
}

function getPlayerCardLocation(player, cardId) {
  const handIndex = findCardInList(player.hand, cardId);
  if (handIndex !== -1) return { zone: "hand", index: handIndex };

  const monsterIndex = findCardInList(player.monsters, cardId);
  if (monsterIndex !== -1) return { zone: "monster", index: monsterIndex };

  const spellTrapIndex = findCardInList(player.spellTrap, cardId);
  if (spellTrapIndex !== -1) return { zone: "spellTrap", index: spellTrapIndex };

  return null;
}

function isCurrentPlayerTurn() {
  return state.selectedCard && state.selectedCard.owner === state.currentPlayer;
}

function canSummonCard(card) {
  if (!card || card.type !== "monster") return false;
  if (state.phaseIndex !== 2 && state.phaseIndex !== 4) return false;
  if (getCurrentPlayer().normalSummonUsed) return false;
  if (getCurrentPlayer().monsters.filter(Boolean).length >= MAX_FIELD) return false;

  const level = card.level || 0;
  const availableTributes = getCurrentPlayer().monsters.filter(Boolean).length;
  if (level <= 4) return true;
  if (level <= 6) return availableTributes >= 1;
  return availableTributes >= 2;
}

function tributeForSummon(cardLevel) {
  const player = getCurrentPlayer();
  const required = cardLevel <= 6 ? 1 : 2;
  const tributes = [];

  for (const monster of player.monsters) {
    if (monster && tributes.length < required) {
      tributes.push(monster);
    }
  }

  if (tributes.length < required) return null;

  tributes.forEach((monster) => {
    const index = player.monsters.findIndex((slot) => slot && slot.id === monster.id);
    if (index !== -1) {
      player.graveyard.push(player.monsters[index]);
      player.monsters[index] = null;
    }
  });

  return tributes;
}

function canSetMonster(card) {
  if (!card || card.type !== "monster") return false;
  if (state.phaseIndex !== 2 && state.phaseIndex !== 4) return false;
  if (getCurrentPlayer().monsters.filter(Boolean).length >= MAX_FIELD) return false;
  return true;
}

function summonSelectedCard() {
  if (state.winner) return;
  const player = getCurrentPlayer();
  const selection = state.selectedCard;
  if (!selection || selection.owner !== state.currentPlayer) return;

  const location = getPlayerCardLocation(player, selection.cardId);
  if (!location || location.zone !== "hand") return;

  const card = player.hand[location.index];
  if (!card || !canSummonCard(card)) {
    logMessage("That monster cannot be summoned right now.");
    render();
    return;
  }

  if (card.level > 4) {
    const tribute = tributeForSummon(card.level);
    if (!tribute) {
      logMessage(`${card.name} requires tribute monsters.`);
      return;
    }
  }

  player.hand.splice(location.index, 1);
  const index = player.monsters.findIndex((slot) => slot === null);
  player.monsters[index] = { ...card, canAttack: true, isFaceDown: false, faceUp: true, position: "attack" };
  player.normalSummonUsed = true;
  logMessage(`${player.name} summons ${card.name}.`);
  state.selectedCard = null;
  render();
}

function setMonsterSelected() {
  if (state.winner) return;
  const player = getCurrentPlayer();
  const selection = state.selectedCard;
  if (!selection || selection.owner !== state.currentPlayer) return;

  const location = getPlayerCardLocation(player, selection.cardId);
  if (!location || location.zone !== "hand") return;

  const card = player.hand[location.index];
  if (!card || card.type !== "monster") {
    logMessage("Select a monster card to set.");
    return;
  }

  if (!canSetMonster(card)) {
    logMessage("You cannot set that monster here.");
    return;
  }

  if (player.monsters.filter(Boolean).length >= MAX_FIELD) {
    logMessage("Your monster zone is full.");
    return;
  }

  player.hand.splice(location.index, 1);
  const index = player.monsters.findIndex((slot) => slot === null);
  player.monsters[index] = { ...card, isFaceDown: true, faceUp: false, position: "defense", canAttack: false, setTurn: state.turnNumber };
  player.normalSummonUsed = true;
  logMessage(`${player.name} sets ${card.name} face-down.`);
  state.selectedCard = null;
  render();
}

function setSpellOrTrapSelected() {
  if (state.winner) return;
  const player = getCurrentPlayer();
  const selection = state.selectedCard;
  if (!selection || selection.owner !== state.currentPlayer) return;

  const location = getPlayerCardLocation(player, selection.cardId);
  if (!location || location.zone !== "hand") return;

  const card = player.hand[location.index];
  if (!card || (card.type !== "spell" && card.type !== "trap")) {
    logMessage("Select a Spell or Trap card to set.");
    return;
  }

  const index = player.spellTrap.findIndex((slot) => slot === null);
  if (index === -1) {
    logMessage("Your Spell/Trap zone is full.");
    return;
  }

  player.hand.splice(location.index, 1);
  player.spellTrap[index] = { ...card, isFaceDown: true, faceUp: false, setTurn: state.turnNumber };
  logMessage(`${player.name} sets ${card.name} face-down.`);
  state.selectedCard = null;
  render();
}

function resolveCardEffect(card, owner, opponent) {
  if (card.effect === "draw2") {
    for (let i = 0; i < 2; i++) drawCard(owner);
  }

  if (card.effect === "deal800") {
    opponent.lp -= 800;
    logMessage(`${owner.name} deals 800 damage with ${card.name}.`);
  }

  if (card.effect === "destroyAllMonsters") {
    owner.monsters.forEach((monster, i) => {
      if (monster) {
        owner.graveyard.push(monster);
        owner.monsters[i] = null;
      }
    });
    opponent.monsters.forEach((monster, i) => {
      if (monster) {
        opponent.graveyard.push(monster);
        opponent.monsters[i] = null;
      }
    });
    logMessage(`${owner.name} activates ${card.name}, removing all monsters.`);
  }

  if (card.effect === "draw3discard1") {
    for (let i = 0; i < 3; i++) drawCard(owner);
    if (owner.hand.length > 6) {
      const discard = owner.hand.pop();
      if (discard) owner.graveyard.push(discard);
      logMessage(`${owner.name} discards ${discard.name} after Graceful Charity.`);
    }
  }

  if (card.effect === "revive") {
    const graveyard = owner.graveyard.filter((entry) => entry.type === "monster");
    if (graveyard.length) {
      const revived = graveyard.pop();
      const emptySlot = owner.monsters.findIndex((slot) => slot === null);
      if (emptySlot !== -1) {
        owner.monsters[emptySlot] = { ...revived, faceUp: true, isFaceDown: false, position: "attack", canAttack: false };
        logMessage(`${owner.name} revives ${revived.name} using Monster Reborn.`);
      }
    }
  }

  if (card.effect === "destroyAttackers") {
    const attacker = opponent.monsters.find((monster) => monster && monster.canAttack);
    if (attacker) {
      const index = opponent.monsters.findIndex((monster) => monster && monster.id === attacker.id);
      opponent.graveyard.push(attacker);
      opponent.monsters[index] = null;
      logMessage(`${owner.name}'s Mirror Force destroys ${attacker.name}.`);
    }
  }

  if (card.effect === "destroyLevel4") {
    const target = opponent.monsters.find((monster) => monster && monster.level <= 4);
    if (target) {
      const index = opponent.monsters.findIndex((monster) => monster && monster.id === target.id);
      opponent.graveyard.push(target);
      opponent.monsters[index] = null;
      logMessage(`${owner.name}'s Trap Hole destroys ${target.name}.`);
    }
  }

  if (card.effect === "draw1") {
    drawCard(owner);
  }

  if (card.effect === "reflectDamage") {
    const damage = 500;
    owner.lp += damage;
    opponent.lp -= damage;
    logMessage(`${owner.name} reflects 500 damage with ${card.name}.`);
  }

  if (card.effect === "negateBattle") {
    logMessage(`${owner.name} activates Negate Attack.`);
  }
}

function activateSelectedCard() {
  if (state.winner) return;
  const player = getCurrentPlayer();
  const selection = state.selectedCard;
  if (!selection || selection.owner !== state.currentPlayer) return;

  const location = getPlayerCardLocation(player, selection.cardId);
  if (!location) return;

  if (location.zone === "spellTrap") {
    const card = player.spellTrap[location.index];
    if (!card) return;
    if (card.isFaceDown && card.setTurn === state.turnNumber) {
      logMessage(`${card.name} cannot be activated on the turn it was set.`);
      return;
    }

    const opponent = getOpponentPlayer();
    resolveCardEffect(card, player, opponent);
    player.spellTrap[location.index] = null;
    player.graveyard.push(card);
    state.selectedCard = null;
    render();
    return;
  }

  if (location.zone === "hand") {
    const card = player.hand[location.index];
    if (!card || (card.type !== "spell" && card.type !== "trap")) {
      logMessage("Select a Spell or Trap card from your hand.");
      return;
    }

    if (card.type === "spell") {
      const opponent = getOpponentPlayer();
      resolveCardEffect(card, player, opponent);
      player.hand.splice(location.index, 1);
      player.graveyard.push(card);
      state.selectedCard = null;
      render();
      return;
    }

    if (card.type === "trap") {
      const opponent = getOpponentPlayer();
      resolveCardEffect(card, player, opponent);
      player.hand.splice(location.index, 1);
      player.graveyard.push(card);
      state.selectedCard = null;
      render();
      return;
    }
  }

  logMessage("That card cannot be activated right now.");
}

function directAttack(selectedMonster) {
  if (state.winner) return;
  const player = getCurrentPlayer();
  const opponent = getOpponentPlayer();

  if (!selectedMonster || selectedMonster.isFaceDown || selectedMonster.position !== "attack") {
    logMessage("Select a face-up attacking monster.");
    return;
  }

  if (!selectedMonster.canAttack) {
    logMessage(`${selectedMonster.name} has already attacked this turn.`);
    return;
  }

  const damage = selectedMonster.atk;
  opponent.lp -= damage;
  selectedMonster.canAttack = false;
  logMessage(`${player.name}'s ${selectedMonster.name} attacks directly for ${damage} damage.`);
  state.selectedCard = null;
  if (opponent.lp <= 0) declareWinner(player.name);
  render();
}

function attackMonster(attackerId, targetId) {
  if (state.winner) return;
  const player = getCurrentPlayer();
  const opponent = getOpponentPlayer();

  const attackerIndex = findCardInList(player.monsters, attackerId);
  if (attackerIndex === -1) return;

  const attacker = player.monsters[attackerIndex];
  if (!attacker || attacker.isFaceDown || attacker.position !== "attack") {
    logMessage("You must select a face-up attacking monster.");
    return;
  }

  const targetIndex = findCardInList(opponent.monsters, targetId);
  if (targetIndex === -1) {
    directAttack(attacker);
    return;
  }

  const target = opponent.monsters[targetIndex];
  if (!target) return;

  if (!attacker.canAttack) {
    logMessage(`${attacker.name} has already attacked this turn.`);
    return;
  }

  attacker.canAttack = false;

  if (attacker.atk > target.atk) {
    opponent.lp -= attacker.atk - target.atk;
    opponent.graveyard.push(target);
    opponent.monsters[targetIndex] = null;
    logMessage(`${attacker.name} defeats ${target.name} and deals ${attacker.atk - target.atk} damage.`);
  } else if (attacker.atk < target.atk) {
    player.lp -= target.atk - attacker.atk;
    player.graveyard.push(attacker);
    player.monsters[attackerIndex] = null;
    logMessage(`${target.name} defeats ${attacker.name} and deals ${target.atk - attacker.atk} damage.`);
  } else {
    opponent.graveyard.push(target);
    player.graveyard.push(attacker);
    opponent.monsters[targetIndex] = null;
    player.monsters[attackerIndex] = null;
    logMessage(`${attacker.name} and ${target.name} are both destroyed.`);
  }

  if (player.lp <= 0) declareWinner(opponent.name);
  if (opponent.lp <= 0) declareWinner(player.name);

  state.selectedCard = null;
  render();
}

function declareWinner(name) {
  state.winner = name;
  logMessage(`${name} wins the duel!`);
}

function nextPhase() {
  if (state.winner) return;

  const current = getCurrentPlayer();

  if (state.phaseIndex === 0) {
    if (state.turnNumber > 1 || state.currentPlayer === 1) {
      drawCard(current);
    } else {
      logMessage(`${current.name} does not draw on the first turn.`);
    }
  }

  if (state.phaseIndex < PHASES.length - 1) {
    state.phaseIndex += 1;
  } else {
    discardToSix(current);
    state.currentPlayer = 1 - state.currentPlayer;
    state.turnNumber += 1;
    state.phaseIndex = 0;
    state.selectedCard = null;
    logMessage(`${getCurrentPlayer().name} begins their turn.`);
    render();
    return;
  }

  if (PHASES[state.phaseIndex] === "Battle Phase") {
    current.monsters.forEach((monster) => {
      if (monster) monster.canAttack = true;
    });
    logMessage(`${current.name} enters the Battle Phase.`);
  }

  if (PHASES[state.phaseIndex] === "End Phase") {
    discardToSix(current);
    logMessage(`${current.name} ends the turn.`);
  }

  updateTurnBadge();
  render();
}

function startGame() {
  state.players = [makePlayer("Player 1"), makePlayer("Player 2")];
  state.currentPlayer = 0;
  state.phaseIndex = 0;
  state.turnNumber = 1;
  state.selectedCard = null;
  state.winner = null;
  state.log = ["Player 1 starts the duel. Player 1 does not draw on turn 1."];

  for (const player of state.players) {
    for (let i = 0; i < STARTING_HAND; i++) {
      if (player.deck.length) {
        player.hand.push(player.deck.pop());
      }
    }
  }

  updateLpDisplay();
  updateTurnBadge();
  render();
}

function renderStatusLog() {
  const logEl = document.getElementById("statusLog");
  logEl.innerHTML = state.log.map((entry) => `<div>${entry}</div>`).join("");
}

function renderHand() {
  const current = getCurrentPlayer();
  const handEl = document.getElementById("handArea");
  handEl.innerHTML = "";

  current.hand.forEach((card) => {
    const cardEl = document.createElement("div");
    const selected = state.selectedCard && state.selectedCard.cardId === card.id && state.selectedCard.owner === state.currentPlayer;
    cardEl.className = `hand-card ${selected ? "selected" : ""}`;
    cardEl.innerHTML = `
      <div class="type">${card.type}</div>
      <div class="name">${card.name}</div>
      <div class="meta">
        <span>${card.type === "monster" ? `Lv ${card.level}` : ""}</span>
        <span>${card.type === "monster" ? `${card.atk}/${card.def}` : ""}</span>
      </div>
    `;
    cardEl.onclick = () => onSelectCard(card.id, state.currentPlayer);
    handEl.appendChild(cardEl);
  });

  document.getElementById("handCount").textContent = String(current.hand.length);
}

function renderField(player, fieldEl, isEnemy = false) {
  fieldEl.innerHTML = "";

  for (let i = 0; i < MAX_FIELD; i++) {
    const monster = player.monsters[i];
    const slot = document.createElement("div");

    if (!monster) {
      slot.className = "card-slot empty";
      slot.textContent = "Empty";
    } else {
      const selected = state.selectedCard && state.selectedCard.cardId === monster.id && state.selectedCard.owner === (isEnemy ? 1 - state.currentPlayer : state.currentPlayer);
      slot.className = `card-slot filled ${isEnemy ? "enemy-filled" : ""} ${selected ? "selected" : ""}`;
      const name = monster.isFaceDown && !isEnemy ? "Set Monster" : monster.name;
      const atk = monster.isFaceDown && isEnemy ? "?" : monster.atk;
      const def = monster.isFaceDown && isEnemy ? "?" : monster.def;
      const statusText = monster.isFaceDown ? "Set" : (monster.position === "attack" ? "ATK" : "DEF");
      slot.innerHTML = `
        <h4 class="name">${name}</h4>
        <p class="stats">ATK ${atk} / DEF ${def}</p>
        <p class="status">${statusText}</p>
      `;

      slot.onclick = () => {
        if (isEnemy) {
          if (state.selectedCard && state.selectedCard.owner === state.currentPlayer) {
            const selectedMonster = getCurrentPlayer().monsters.find((entry) => entry && entry.id === state.selectedCard.cardId);
            if (selectedMonster) {
              attackMonster(selectedMonster.id, monster.id);
            }
          }
        } else {
          onSelectCard(monster.id, state.currentPlayer);
        }
      };
    }

    fieldEl.appendChild(slot);
  }
}

function renderSpellTrapZones() {
  const zoneEl = document.getElementById("spellTrapArea");
  zoneEl.innerHTML = "";

  for (let i = 0; i < MAX_FIELD; i++) {
    const slot = getCurrentPlayer().spellTrap[i];
    const div = document.createElement("div");

    if (!slot) {
      div.className = "card-slot empty";
      div.textContent = "Empty";
    } else {
      const selected = state.selectedCard && state.selectedCard.cardId === slot.id && state.selectedCard.owner === state.currentPlayer;
      div.className = `card-slot filled ${selected ? "selected" : ""}`;
      const label = slot.isFaceDown ? "Set" : slot.name;
      div.innerHTML = `
        <h4 class="name">${label}</h4>
        <p class="stats">${slot.type.toUpperCase()}</p>
        <p class="status">${slot.isFaceDown ? "Face down" : "Face up"}</p>
      `;
      div.onclick = () => onSelectCard(slot.id, state.currentPlayer);
    }

    zoneEl.appendChild(div);
  }

  document.getElementById("spellTrapCount").textContent = String(getCurrentPlayer().spellTrap.filter(Boolean).length);
}

function renderBoard() {
  const playerField = document.getElementById("playerField");
  const opponentField = document.getElementById("opponentField");
  const current = getCurrentPlayer();
  const opponent = getOpponentPlayer();

  renderField(current, playerField, false);
  renderField(opponent, opponentField, true);

  document.getElementById("playerFieldCount").textContent = `${current.monsters.filter(Boolean).length} / 5`;
  document.getElementById("enemyFieldCount").textContent = `${opponent.monsters.filter(Boolean).length} / 5`;
}

function renderButtons() {
  const selected = state.selectedCard;
  const current = getCurrentPlayer();
  const hasSelectedCurrentCard = selected && selected.owner === state.currentPlayer;

  const handHasSelected = hasSelectedCurrentCard && getCurrentPlayer().hand.some((card) => card.id === selected.cardId);
  const spellTrapHasSelected = hasSelectedCurrentCard && current.spellTrap.some((card) => card && card.id === selected.cardId);
  const monsterFieldSelected = hasSelectedCurrentCard && current.monsters.some((card) => card && card.id === selected.cardId);

  document.getElementById("summonBtn").disabled = !(handHasSelected && current.phaseIndex >= 2 && current.phaseIndex <= 4 && !current.normalSummonUsed);
  document.getElementById("setMonsterBtn").disabled = !(handHasSelected && current.phaseIndex >= 2 && current.phaseIndex <= 4);
  document.getElementById("setSpellBtn").disabled = !(handHasSelected && current.phaseIndex >= 2 && current.phaseIndex <= 4);
  document.getElementById("activateBtn").disabled = !(spellTrapHasSelected || (handHasSelected && current.hand.some((card) => card && card.id === selected.cardId && (card.type === "spell" || card.type === "trap"))));
  document.getElementById("attackBtn").disabled = !(monsterFieldSelected && current.phaseIndex === 3);
}

function render() {
  updateLpDisplay();
  updateTurnBadge();
  renderBoard();
  renderHand();
  renderSpellTrapZones();
  renderStatusLog();
  renderButtons();
}

function handleAttackButton() {
  if (state.winner) return;
  if (state.phaseIndex !== 3) {
    logMessage("You can only attack during the Battle Phase.");
    return;
  }

  const current = getCurrentPlayer();
  const opponent = getOpponentPlayer();
  const selected = state.selectedCard;

  if (!selected || selected.owner !== state.currentPlayer) {
    logMessage("Select a monster in your field to attack.");
    return;
  }

  const monster = current.monsters.find((entry) => entry && entry.id === selected.cardId);
  if (!monster) {
    logMessage("Select a monster in your field to attack.");
    return;
  }

  if (!monster.canAttack) {
    logMessage(`${monster.name} has already attacked this turn.`);
    return;
  }

  if (!opponent.monsters.some(Boolean)) {
    directAttack(monster);
    return;
  }

  const target = opponent.monsters.find((entry) => entry && entry !== null);
  if (target) {
    attackMonster(monster.id, target.id);
  }
}

function bindButtons() {
  document.getElementById("nextPhaseBtn").addEventListener("click", nextPhase);
  document.getElementById("endTurnBtn").addEventListener("click", () => {
    if (state.winner) return;
    discardToSix(getCurrentPlayer());
    state.currentPlayer = 1 - state.currentPlayer;
    state.turnNumber += 1;
    state.phaseIndex = 0;
    state.selectedCard = null;
    logMessage(`${getCurrentPlayer().name} begins their turn.`);
    render();
  });
  document.getElementById("restartBtn").addEventListener("click", startGame);
  document.getElementById("summonBtn").addEventListener("click", summonSelectedCard);
  document.getElementById("setMonsterBtn").addEventListener("click", setMonsterSelected);
  document.getElementById("setSpellBtn").addEventListener("click", setSpellOrTrapSelected);
  document.getElementById("activateBtn").addEventListener("click", activateSelectedCard);
  document.getElementById("attackBtn").addEventListener("click", handleAttackButton);
}

bindButtons();
startGame();

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "n") {
    nextPhase();
  }
});












































































































































































































































































































































































































































































































n




















































































































