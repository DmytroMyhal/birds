const canvas = document.querySelector('#birds');
const ctx = canvas.getContext('2d');
const birds = [];
const landPoints = [];

const tree1 = new Image();
tree1.src = 'tree1.png';

const birdsStates = {
  0: 'landed',
  1: 'fly up',
  2: 'fly down',
  3: 'in flock'
}

let flockPoint;
const ravenImg = new Image();
ravenImg.src = 'raven.png';

const canvasResize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

const getRandomFromRange = (range) => {
  if(range[0] > range[1])
    throw new Error("Range error: The start of the range cannot exceed the end of the range");
  else 
    return Math.random()*(range[1] - range[0]) + range[0];
};

const getRandomSign = () => Math.sign(getRandomFromRange([-1,1]));

const playFlyUpSound = () => {
//  var audio = new Audio(); // Создаём новый элемент Audio
//  audio.src = 'flyUp.mp3'; // Указываем путь к звуку "клика"
//  audio.autoplay = true; // Автоматически запускаем
}

class Vector {
  constructor(options) {
    this.setCoordinates(options);
  }
  
  setCoordinates(options = {}) {
    if('x' in options && 'y' in options) {
      this.x = options.x;
      this.y = options.y;
    }
    else if('x' in options && 'length' in options) {
      this.x = options.x;
      this.y = getRandomSign() * Math.sqrt(Math.pow(options.length,2) - Math.pow(this.x,2));
    }
    else if('y' in options && 'length' in options) {
      this.y = options.y;
      this.x = getRandomSign() * Math.sqrt(Math.pow(options.length,2) - Math.pow(this.y,2));
    }
    else if('length' in options) {
      this.x = options.length * getRandomFromRange([-1,1]);
      this.y = getRandomSign() * Math.sqrt(Math.pow(options.length,2) - Math.pow(this.x,2));
    }
    else {
      throw Error('Vector error: there is not enough data to set coordinates!');
    }
  }
  
  distanceFrom(vector) {
    return Math.sqrt(Math.pow(this.x - vector.x,2) + Math.pow(this.y - vector.y,2));
  }
  
  getLength() {return this.distanceFrom({x: 0, y: 0});}
  
  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
  }
  
  substract(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
  }
  
  multiply(number) {
    this.x *= number;
    this.y *= number;
  }
}

class Bird {
  constructor(options = {}) {
    this.pos = new Vector({
      x: ('x' in options) ? options.x : getRandomFromRange([0, canvas.width]),
      y: ('y' in options) ? options.y : getRandomFromRange([0, canvas.height])
    });
    this.vel = new Vector({
      length: ('speed' in options) ? options.speed : 0
    });
    this.acc = new Vector({x: 0, y: 0});
    this.state = 3;
    this.timer = Math.random() * 2000;
  }
  
  joinFlock() {
    this.state = 3;
    
    let distanceToFlock = this.pos.distanceFrom(flockPoint.pos);
    this.acc.setCoordinates({
      x: flockPoint.gravity * (flockPoint.pos.x - this.pos.x)/(distanceToFlock + 100),
      y: flockPoint.gravity * (flockPoint.pos.y - this.pos.y)/(distanceToFlock + 100)
    });
  }
  
  land(point) {
    let target;
    let distance;
    
    if(!point) {
      let minDistance, id;
      landPoints.forEach((point, i) => {
        let distanceFromPoint = this.pos.distanceFrom(point);
        if(distanceFromPoint < minDistance || !i) {
          minDistance = distanceFromPoint;
          id = i;
        }
      });
      distance = minDistance;
      target = landPoints[id];
    }
    else {
      distance = this.pos.distanceFrom(point.pos);
      target = point;
    }
    
    this.acc.setCoordinates({
      x: .1 * (target.x - this.pos.x)/(distance),
      y: .1 * (target.y - this.pos.y)/(distance)
    });
    
    if(distance < .5) {
      this.state = 0;
      this.pos.setCoordinates(target);
      this.vel.setCoordinates({x: 0, y: 0});
      this.acc.setCoordinates({x: 0, y: 0});
    }
  }
  
  render() {
    if(this.timer > 2000) {
      switch(this.state) {
        case 0: this.state = 1;break;
        case 3: this.state = 2;break;
      }
      this.timer = 0;
    }
    
    if(this.state == 0) this.timer++;
    else if(this.state == 1) this.joinFlock();
    else if(this.state == 3) {
      this.timer++;
      this.joinFlock();
    }
    else if(this.state == 2) this.land();
    
    if(cursor.active) {
      let distanceFromCursor = this.pos.distanceFrom(cursor.pos);
      if(distanceFromCursor <= cursor.radius) {
        this.acc.add({
          x: cursor.gravity * (cursor.pos.x - this.pos.x)/distanceFromCursor,
          y: cursor.gravity * (cursor.pos.y - this.pos.y)/distanceFromCursor
        });
        if(this.state == 0) {this.state = 1;this.timer = 0;}
      }
    }
    
    this.vel.add(this.acc);
    
    if(this.vel.getLength() > 5)
      this.vel.multiply(.95);
    
    this.pos.add(this.vel);
    
    ctx.beginPath();
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(Math.PI + Math.atan2(this.vel.y, this.vel.x));
    ctx.scale(.7, .7);
    ctx.drawImage(ravenImg, 0, 0);
//    ctx.moveTo(5, 0);
//    ctx.lineTo(-3, 2);
//    ctx.lineTo(-3, -2);
//    ctx.closePath();
//    ctx.fill();
    ctx.restore();
  }
}

class GravityPoint {
  constructor(options = {}) {
    this.pos = new Vector({x: options.x, y: options.y});
    this.vel = new Vector({x: 1, y: .2});
    this.gravity = options.gravity;
    this.radius = options.radius;
  }
  
  render() {
    if(this.pos.x > 600 || this.pos.x < 200)
      this.vel.x *= -1;
    
    if(this.pos.y > 250 || this.pos.y < 150)
      this.vel.y *= -1;
    
    this.pos.add(this.vel);
    
//    ctx.fillStyle = 'black';
//    ctx.beginPath();
//    ctx.save();
//    ctx.translate(this.pos.x, this.pos.y);
//    ctx.arc(0,0,2,0,2*Math.PI,false);
//    ctx.fill();
//    ctx.restore();
  }
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
  
  const sun = ctx.createRadialGradient(400, 200, 18, 400, 200, 24);
  sun.addColorStop(0, '#ffffff');
  sun.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = sun;
  ctx.arc(400,200,24,0,2*Math.PI,false);
  ctx.fill();
  
  ctx.drawImage(tree1, 800, 210, 400, 400);
  

  birds.forEach((bird, i) => {
    bird.render();
  });
  
  flockPoint.render();
  
  const fog = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 300, canvas.width/2, canvas.height/2, 800);
  fog.addColorStop(0, 'rgba(255, 255, 255, 0)');
  fog.addColorStop(1, '#d1d1d1');
  
  ctx.fillStyle = fog;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0,600,canvas.width,canvas.height);
  
  window.requestAnimationFrame(update);
}

const cursor = new GravityPoint({gravity: -0.3, radius: 100});

canvas.onmousemove = function(e) {
  cursor.pos.x = e.pageX + canvas.offsetLeft;
  cursor.pos.y = e.pageY + canvas.offsetTop;
  cursor.active = true;
}

canvas.onmouseout = () => cursor.active = false;
//
//canvas.ontouchstart = canvas.ontouchmove = function(e) {
//  cursor.x = e.touches[0].clientX + canvas.offsetLeft;
//  cursor.y = e.touches[0].clientY + canvas.offsetTop;
//}

window.onload = () => {
  canvasResize();
  
  for(let i = 0; i < 200; i++)
    birds.push(new Bird({speed: 1}));
  
  flockPoint = new GravityPoint({
    x: 400,
    y: 200, 
    gravity: .15
  });
  
  for(let i = 0; i < 300; i++) {
    let x = Math.random()*150 + 950;
    let y = Math.random()*200 + 280;
    landPoints.push({x, y});
  }

  window.requestAnimationFrame(update);
}