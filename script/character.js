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
    this.angle = 270 * Math.PI / 180;
  }

  setVectorFromAngle(angle) {
    this.angle = angle;
    let sin = Math.sin(angle);
    let cos = Math.cos(angle);
    this.vector.set(cos, sin);
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

  rotationDraw() {
    // 座標系を回転する前の状態を保存する
    this.ctx.save();
    // 自身の位置が座標系の中心と重なるように平行移動する
    this.ctx.translate(this.position.x, this.position.y);
    // 座標系を回転させる（270度の位置を基準にするためにMath.PI * 1.5を引いている）
    this.ctx.rotate(this.angle - Math.PI * 1.5);

    // キャラクターの幅を考慮してオフセットする量
    let offsetX = this.width / 2;
    let offsetY = this.heigh / 2;
    // キャラクターの幅やオフセットする様をかみして描画する
    this.ctx.drawImage(
      this.image,
      -offsetX,
      -offsetY,
      this.width,
      this.height
    );

    // 座標系を回転する前の状態に戻す
    this.ctx.restore();
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
    this.singleShotArray = null;
  }

  setComing(startX, startY, endX, endY) {
    this.isComing = true;
    this.comingStart = Date.now();
    this.position.set(startX, startY);
    this.comingStartPosition = new Position(startX, startY);
    this.comingEndPosition = new Position(endX, endY);
  }

  setShotArray(shotArray, singleShotArray) {
    this.shotArray = shotArray;
    this.singleShotArray = singleShotArray;
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

          for(let i = 0; i < this.singleShotArray.length; i+= 2) {
            if(this.singleShotArray[i].life <= 0 && this.singleShotArray[i+1].life <= 0) {
              // 真上方向から左右10度に傾いたラジアン
              let radCW = 280 * Math.PI / 180;
              let radCCW = 260 * Math.PI / 180;
              this.singleShotArray[i].set(this.position.x, this.position.y);
              this.singleShotArray[i].setVectorFromAngle(radCW);
              this.singleShotArray[i + 1].set(this.position.x, this.position.y);
              this.singleShotArray[i + 1].setVectorFromAngle(radCCW);
              this.shotCheckCounter = -this.shotInterval;
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

class Enemy extends Character {
  constructor(ctx, x, y, w, h, imagePath) {
    super(ctx, x, y, w, h, 0, imagePath);

    this.speed = 3;
  }

  set(x, y, life = 1) {
    this.position.set(x, y);
    this.life = life;
  }

  update() {
    if(this.life <= 0) { return; }
    if(this.position.y - this.height > this.ctx.canvas.height) {
      this.life = 0;
    }
    this.position.x += this.vector.x * this.speed;
    this.position.y += this.vector.y * this.speed;

    this.draw();
  }
}