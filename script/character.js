class Position {
  constructor(x, y) {
    this.set(x, y);
  }

  set(x, y) {
    if(x != null) {this.x = x;}
    if(y != null) {this.y = y;}
  }
}

class Character {
  constructor(ctx, x, y, w, h, life, imagePath) {
    this.ctx = ctx;
    this.position = new Position(x, y);
    this.width = w;
    this.height = h;
    this.life = life;
    this.ready = false;
    this.image = new Image();
    this.image.addEventListener('load', () => {
      this.ready = true;
    }, false);
    this.image.src = imagePath;
  }

  draw() {
    let offsetX = this.width / 2;
    let offsetY = this.height / 2;
    this.ctx.drawImage(
      this.image,
      this.position.x - offsetX,
      this.position.y - offsetY,
      this.width,
      this.height
    );
  }
}

class Viper extends Character {
  constructor(ctx, x, y, w, h, image) {
    super(ctx, x, y, w, h, 0, image);

    this.speed = 3;
    this.isComing = false;
    this.comingStart = null;
    this.comingStartPosition = null;
    this.comingEndPosition = null;
    this.shotArray = null;
    // ショットを撃った後のチェック用カウンター
    this.shotCheckCounter = 0;
    // ショットを撃つことができる間隔（フレーム数）
    this.shotInterval = 10;
  }

  setComing(startX, startY, endX, endY) {
    this.isComing = true;
    this.comingStart = Date.now();
    this.position.set(startX, startY);
    this.comingStartPosition = new Position(startX, startY);
    this.comingEndPosition = new Position(endX, endY);
  }

  setShotArray(shotArray) {
    this.shotArray = shotArray;
  }

  update() {
    let justTime = Date.now();
    if(this.isComing === true) {
      let justTime = Date.now();
      let comingTime = (justTime - this.comingStart) / 1000;
      let y = this.comingStartPosition.y - comingTime * 50;
      if(y <= this.comingEndPosition.y) {
        this.isComing = false;
        y = this.comingEndPosition.y;
      }

      this.position.set(this.position.x, y);

      if(justTime % 100 < 50) {
        this.ctx.globalAlpha = 0.5;
      }
    } else {
      if(window.isKeyDown.key_ArrowLeft === true) {
        this.position.x -= this.speed;
      }
      if(window.isKeyDown.key_ArrowRight === true) {
        this.position.x += this.speed;
      }
      if(window.isKeyDown.key_ArrowUp === true) {
        this.position.y -= this.speed;
      }
      if(window.isKeyDown.key_ArrowDown === true) {
        this.position.y += this.speed;
      }
      let canvasWidth = this.ctx.canvas.width;
      let canvasHeight = this.ctx.canvas.height;
      let tx = Math.min(Math.max(this.position.x, 0), canvasWidth);
      let ty = Math.min(Math.max(this.position.y, 0), canvasHeight)
      this.position.set(tx, ty);

      if(window.isKeyDown.key_z === true) {
        if(this.shotCheckCounter >= 0) {
          for(let i = 0; i < this.shotArray.length; i++) {
            if(this.shotArray[i].life <= 0) {
              this.shotArray[i].set(this.position.x, this.position.y);
              this.shotCheckCounter = -this.shotInterval;
              // 1つ生成したらループを抜ける
              break;
            }
          }
        }
      }
      ++this.shotCheckCounter;
    }

    this.draw();

    this.ctx.globalAlpha = 1.0;
  }
}

class Shot extends Character {
  constructor(ctx, x, y, w, h, imagePath) {
    super(ctx, x, y, w, h, 0, imagePath);

    this.speed = 7;
    this.vector = new Position(0.0, -1.0);
  }

  set(x, y) {
    this.position.set(x, y);
    this.life = 1;
  }

  setVector(x, y) {
    this.vector.set(x, y);
  }

  update() {
    if(this.life <= 0) {return;}
    if(this.position.y + this.height < 0) {
      this.life = 0;
    }
    this.position.x += this.vector.x * this.speed;
    this.position.y += this.vector.y * this.speed ;
    this.draw();
  }
}
