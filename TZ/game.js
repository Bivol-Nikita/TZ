const WIDTH = 40;
const HEIGHT = 24;

const TILE_WALL = '#';
const TILE_FLOOR = '.';

const OBJ_NONE = 0;
const OBJ_SWORD = 1;
const OBJ_POTION = 2;
const OBJ_PLAYER = 3;
const OBJ_ENEMY = 4;

let map = [];
let objects = [];
let player = {x:0, y:0, hp: 20, attack: 1};
let enemies = [];

function fillMapWalls() {
  for(let y=0; y<HEIGHT; y++) {
    map[y] = [];
    objects[y] = [];
    for(let x=0; x<WIDTH; x++) {
      map[y][x] = TILE_WALL;
      objects[y][x] = OBJ_NONE;
    }
  }
}

function randInt(min, max) {
  return Math.floor(Math.random()*(max - min + 1)) + min;
}

function createRooms() {
  let rooms = [];
  let roomCount = randInt(5, 10);

  for (let i=0; i<roomCount; i++) {
    let w = randInt(3,8);
    let h = randInt(3,8);
    let x = randInt(1, WIDTH - w - 1);
    let y = randInt(1, HEIGHT - h - 1);
    let failed = false;
    for (const r of rooms) {
      if (x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y) {
        failed = true; break;
      }
    }
    if (failed) continue;

    rooms.push({x, y, w, h});

    for(let yy = y; yy < y + h; yy++) {
      for(let xx = x; xx < x + w; xx++) {
        map[yy][xx] = TILE_FLOOR;
      }
    }
  }
  return rooms;
}

function createPassages() {
  let vertCount = randInt(3,5);
  let horCount = randInt(3,5);

  for(let i=0; i<vertCount; i++) {
    let x = randInt(1, WIDTH-2);
    for(let y=0; y<HEIGHT; y++) {
      map[y][x] = TILE_FLOOR;
    }
  }

  for(let i=0; i<horCount; i++) {
    let y = randInt(1, HEIGHT-2);
    for(let x=0; x<WIDTH; x++) {
      map[y][x] = TILE_FLOOR;
    }
  }
}

function connectRooms(rooms) {
  for (let i = 1; i < rooms.length; i++) {
    let prev= rooms[i - 1];
    let curr = rooms[i];

    let x1 = Math.floor(prev.x + prev.w / 2);
    let y1 = Math.floor(prev.y + prev.h / 2);
    let x2 = Math.floor(curr.x + curr.w / 2);
    let y2 = Math.floor(curr.y + curr.h / 2);

    if (Math.random() < 0.5) {
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        map[y1][x] = TILE_FLOOR;
      }
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        map[y][x2] = TILE_FLOOR;
      }
    } else {
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        map[y][x1] = TILE_FLOOR;
      }
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        map[y2][x] = TILE_FLOOR;
      }
    }
  }
}

function findEmptyCell() {
  while(true) {
    let x = randInt(1, WIDTH - 2);
    let y = randInt(1, HEIGHT - 2);
    if(map[y][x] === TILE_FLOOR && objects[y][x] === OBJ_NONE) { return {x,y};
    }
  }
}

function placeItems() {
  for(let i=0; i<2; i++) {
    let {x,y} = findEmptyCell();
    objects[y][x] = OBJ_SWORD;
  }

  for(let i=0; i<10; i++) {
    let {x,y} = findEmptyCell();
    objects[y][x] = OBJ_POTION;
  }
}

function placePlayer() {
  let pos = findEmptyCell();
  player.x = pos.x;
  player.y = pos.y;
  objects[pos.y][pos.x] = OBJ_PLAYER;
}

function placeEnemies() {
  enemies = [];
  for(let i=0; i<10; i++) {
    let pos = findEmptyCell();
    objects[pos.y][pos.x] = OBJ_ENEMY;
    enemies.push({x: pos.x, y: pos.y, hp: 3});
  }
}

const container = document.getElementById('gameMap');

function render() {
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${WIDTH}, 32px)`;
  container.style.gridTemplateRows = `repeat(${HEIGHT}, 32px)`;

  for(let y=0; y<HEIGHT; y++) {
    for(let x=0; x<WIDTH; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.classList.add(map[y][x] === TILE_WALL ? 'wall' : 'floor');
      switch(objects[y][x]) {
        case OBJ_SWORD:
          cell.classList.add('sword');
          break;
        case OBJ_POTION:
          cell.classList.add('potion');
          break;
        case OBJ_PLAYER:
          cell.classList.add('player');
          const healthBar_P = document.createElement('div');
          healthBar_P.className = 'health_p';
          healthBar_P.style.width = (player.hp/20 * 100) + '%';
          cell.appendChild(healthBar_P);
        break;
        case OBJ_ENEMY:
          cell.classList.add('enemy');
          const healthBar_E = document.createElement('div');
          healthBar_E.className = 'health_e';
          const currentEnemy = enemies.find(e => e.x === x && e.y === y);
          healthBar_E.style.width = (currentEnemy.hp / 3 * 100) + '%';
          cell.appendChild(healthBar_E);  
        break;
      }
      container.appendChild(cell);
    }
  }
}

function tryMovePlayer(dx, dy) {
  let nx = player.x + dx;
  let ny = player.y + dy;
  if(nx < 0 || nx >= WIDTH || ny < 0 || ny >= HEIGHT) return;
  if(map[ny][nx] === TILE_WALL) return;
  let obj = objects[ny][nx];
  if(obj === OBJ_ENEMY) {
    attackEnemyAt(nx, ny);
    return;
  }
  if(obj === OBJ_SWORD) {
    player.attack += 1;
    console.log('Меч подобран! Сила атаки:', player.attack);
  }
  if(obj === OBJ_POTION) {
    player.hp += 5;
    if(player.hp > 20) player.hp = 20;
    console.log('Зелье здоровья выпито! HP:', player.hp);
  }

  objects[player.y][player.x] = OBJ_NONE;
  player.x = nx;
  player.y = ny;
  objects[ny][nx] = OBJ_PLAYER;
  render();
}

function attackNearbyEnemies() {
  let directions = [
    [0, -1], [0, 1], [-1, 0], [1, 0]
  ];
  let attacked = false;
  for(let [dx, dy] of directions) {
    let nx = player.x + dx;
    let ny = player.y + dy;
    let enemy = enemies.find(e => e.x === nx && e.y === ny);
    if(enemy) {
      enemy.hp -= player.attack;
      console.log(`Атака врага на (${nx},${ny}), HP осталось: ${enemy.hp}`);
      if(enemy.hp <= 0) {
        enemies = enemies.filter(e => e !== enemy);
        objects[ny][nx] = OBJ_NONE;
        attacked = true;
      }
    }
  }
  if(attacked) {
    render();
  }
}

function enemyAttackPlayer() {
  let directions = [
    [0, -1], [0, 1], [-1, 0], [1, 0]
  ];
  for(let enemy of enemies) {
    for(let [dx, dy] of directions) {
      if(enemy.x + dx === player.x && enemy.y + dy === player.y) {
        player.hp -= 1;
        console.log('Враг атаковал героя! HP героя:', player.hp);
        if(player.hp <= 0) {
          alert('Игра окончена! Герой погиб.');
        }
        return;
      }
    }
  }
}

function moveEnemies() {
  const directions = [
    [0, -1], [0, 1], [-1, 0], [1, 0], [0,0]
  ];
  for(let enemy of enemies) {
    let dir = directions[randInt(0, directions.length-1)];
    let nx = enemy.x + dir[0];
    let ny = enemy.y + dir[1];
    if(nx >= 0 && nx < WIDTH && ny >=0 && ny < HEIGHT &&
        map[ny][nx] === TILE_FLOOR &&
        objects[ny][nx] !== OBJ_ENEMY &&
        objects[ny][nx] !== OBJ_PLAYER
    ) {
      objects[enemy.y][enemy.x] = OBJ_NONE;
      enemy.x = nx;
      enemy.y = ny;
      objects[ny][nx] = OBJ_ENEMY;
    }
  }
}

function attackEnemyAt(x,y) {
  let enemy = enemies.find(e => e.x === x && e.y === y);
  if(enemy) {
    enemy.hp -= player.attack;
    console.log(`Атака врага на (${x},${y}), HP осталось: ${enemy.hp}`);
    if(enemy.hp <= 0) {
      enemies = enemies.filter(e => e !== enemy);
      objects[y][x] = OBJ_NONE;
    }
    render();
  }
}

window.addEventListener('keydown', e => {
  if(player.hp <= 0) return; 
  switch(e.key.toLowerCase()) {
    case 'w': tryMovePlayer(0,-1); break;
    case 'a': tryMovePlayer(-1,0); break;
    case 's': tryMovePlayer(0,1); break;
    case 'd': tryMovePlayer(1,0); break;
    case ' ': attackNearbyEnemies(); break;
  }
  enemyAttackPlayer();
  moveEnemies();
  enemyAttackPlayer(); 
  render();
  document.title = `HP: ${player.hp} | Атака: ${player.attack} | Врагов осталось: ${enemies.length}`;
  if(enemies.length === 0) {  
    console.log("Все враги уничтожены! Вы победили!");
    alert('Все враги уничтожены! Вы победили!'); 
  }
});

function init() {
  fillMapWalls();
  let rooms = createRooms();
  connectRooms(rooms);
  createPassages();
  placeItems();
  placePlayer();
  placeEnemies();
  render();
}

init();