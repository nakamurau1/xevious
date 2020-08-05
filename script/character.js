class Position {
  constructor(x, y) {
    this.set(x, y);
  }

  set(x, y) {
    if(x != null) {this.x = x;}
    if(y != null) {this.y = y;}
  }

  distance(target) {
    let x = this.x - target.x;
    let y = this.y - target.y;
    return Math.sqrt(x * x + y * y);
  }
}

class Character {
  constructor(ctx, x, y, w, h, life, imagePath) {
    this.ctx = ctx;
    this.position = new Position(x, y);
    this.vector = new Position(0.0, -1.0);
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

  setVector(x, y){
    // 自身の vector プロパティに設定する
    this.vector.set(x, y);
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
    this.power = 1;
    this.targetArray = [];
    this.vector = new Position(0.0, -1.0);
  }

  set(x, y) {
    this.position.set(x, y);
    this.life = 1;
  }

  update() {
    if(this.life <= 0) {return;}
    if(
      this.position.y + this.height < 0 ||
      this.position.y - this.height > this.ctx.canvas.height
    ) {
      this.life = 0;
    }
    this.position.x += this.vector.x * this.speed;
    this.position.y += this.vector.y * this.speed;

    this.targetArray.map((v) => {
      if(this.life <= 0 || v.life <= 0) {return;}
      let dist = this.position.distance(v.position);
      if(dist <= (this.width + v.width) / 4) {
        // 対象のライフを攻撃力分減算する
        v.life -= this.power;
        if(v.life <= 0) {
          for(let i = 0; i < this.explosionArray.length; ++i) {
            if(this.explosionArray[i].life !== true) {
              this.explosionArray[i].set(v.position.x, v.position.y);
              break;
            }
          }
        }
        // 自身のライフを0にする
        this.life = 0;
      }
    });
    this.draw();
  }

  setSpeed(speed) {
    if(speed != null && speed > 0) {
      this.speed = speed;
    }
  }

  // ショットの攻撃力を設定する
  setPower(power) {
    if(power != null && power > 0) {
      this.power = power;
    }
  }

  // ショットが衝突判定を行う対象を設定する
  setTargets(targets) {
    if(targets != null && Array.isArray(targets) === true && targets.length > 0) {
      this.targetArray = targets;
    }
  }

  // ショットが爆発エフェクトを発生できるようにする
  setExplosions(targets) {
    if(targets != null && Array.isArray(targets) === true && targets.length > 0) {
      this.explosionArray = targets;
    }
  }
}

class Enemy extends Character {
  constructor(ctx, x, y, w, h, imagePath) {
    super(ctx, x, y, w, h, 0, imagePath);

    this.type = 'default';
    this.frame = 0;
    this.speed = 3;
    this.shotArray = null;
  }

  set(x, y, life = 1, type = 'default') {
    this.position.set(x, y);
    this.life = life;
    this.type = type;
    this.frame = 0;
  }

  update() {
    if(this.life <= 0) { return; }

    // 敵のタイプによって挙動を変える
    switch(this.type) {
      case 'default':
      default:
        if(this.frame === 50) {
          this.fire();
        }
        // 敵キャラクターを進行方向に沿って移動させる
        this.position.x += this.vector.x * this.speed;
        this.position.y += this.vector.y * this.speed;
        // 画面外（画面下端）へ移動していたらライフを0に設定する
        if(this.position.y - this.height > this.ctx.canvas.height) {
          this.life = 0;
        }
        break;
    }
    this.draw();
    // 自身のフレームをインクリメントする
    ++this.frame;
  }

  setShotArray(shotArray){
    // 自身のプロパティに設定する
    this.shotArray = shotArray;
  }

  // 自身から指定された方向にショットを放つ
  fire(x = 0.0, y = 1.0) {
    for(let i = 0; i < this.shotArray.length; ++i) {
      // 非生存かどうかを確認する
      if(this.shotArray[i].life <= 0) {
        this.shotArray[i].set(this.position.x, this.position.y);
        this.shotArray[i].setSpeed(5.0);
        this.shotArray[i].setVector(x, y);
        break;
      }
    }
  }
}

class Explosion {
  constructor(ctx, radius, count, size, timeRange, color = '#ff1166') {
    this.ctx = ctx;
    this.life = false;
    this.color = color;
    this.position = null;
    this.radius = radius;
    this.count = count;
    this.startTime = 0;
    this.timeRange = timeRange;
    this.firePosition = [];
    this.fireVector = [];
    this.fireBaseSize = size;
    this.fireSize = [];
  }

  set(x, y) {
    for(let i = 0; i < this.count; i++) {
      this.firePosition[i] = new Position(x, y);
      // ランダムに火花が進む方向（となるラジアン）を求める
      let vr = Math.random() * Math.PI * 2.0;
      // ラジアンを基にサインとコサインを生成し進行方向に設定する
      let s = Math.sin(vr);
      let c = Math.cos(vr);
      // 進行方向ベクトルの長さをランダムに短くし移動量をランダム化する
      let mr = Math.random();
      this.fireVector[i] = new Position(c * mr, s * mr);
      // 火花の大きさをランダム化する
      this.fireSize[i] = (Math.random() * 0.5 + 0.5) * this.fireBaseSize;
    }
    this.life = true;
    this.startTime = Date.now();
  }

  update() {
    if(this.life !== true){return;}
    this.ctx.fillStyle = this.color;
    this.ctx.globalAlpha = 0.5;
    let time = (Date.now() - this.startTime) / 1000;
    let ease = this.simpleEaseIn(1.0 - Math.min(time / this.timeRange, 1.0));
    let progress = 1.0 - ease;

    for(let i = 0; i < this.firePosition.length; ++i) {
      let d = this.radius * progress;
      let x = this.firePosition[i].x + this.fireVector[i].x * d;
      let y = this.firePosition[i].y + this.fireVector[i].y * d;
      // 進捗を描かれる大きさにも反映させる
      let s = 1.0 - progress;
      // 矩形を描画する
      this.ctx.fillRect(
        x - (this.fireSize[i] * s) / 2,
        y - (this.fireSize[i] * s) / 2,
        this.fireSize[i] * s,
        this.fireSize[i] * s
      )
    }

    if(progress >= 1.0) {
      this.life = false;
    }
  }

  simpleEaseIn(t) {
    return t * t * t * t;
  }
}
