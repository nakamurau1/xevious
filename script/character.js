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
  constructor(ctx, x, y, life, image) {
    this.ctx = ctx;
    this.position = new Position(x, y);
    this.life = life;
    this.image = image;
  }

  draw() {
    this.ctx.drawImage(
      this.image,
      this.position.x,
      this.position.y
    );
  }
}

class Viper extends Character {
  constructor(ctx, x, y, image) {
    super(ctx, x, y, 0, image);
  }

  setComing(startX, startY, endX, endY) {
    this.isComing = true;
    this.comingStart = Date.now();
    this.position.set(startX, startY);
    this.comingStartPosition = new Position(startX, startY);
    this.comingEndPosition = new Position(endX, endY);
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
    }

    this.draw();

    this.ctx.globalAlpha = 1.0;
  }
}
