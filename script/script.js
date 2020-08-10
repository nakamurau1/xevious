(() => {
  const CANVAS_WIDTH = 640;
  const CANVAS_HEIGHT = 480;
  const SHOT_MAX_COUNT = 10;
  // 敵キャラクター（小）のインスタンス数
  const ENEMY_SMALL_MAX_COUNT = 20;
  // 敵キャラクター（大）のインスタンス数
  const ENEMY_LARGE_MAX_COUNT = 5;
  // 敵キャラクターのショットの最大個数
  const ENEMY_SHOT_MAX_COUNT = 50;
  // 爆発エフェクトの最大個数
  const EXPLOSION_MAX_COUNT = 10;
  // 背景を流れる星の数
  const BACKGROUND_STAR_MAX_COUNT = 100;
  // 背景を流れる星の最大サイズ
  const BACKGROUND_STAR_MAX_SIZE = 3;
  // 背景を流れる星の最大速度
  const BACKGROUND_STAR_MAX_SPEED = 4;

  // 流れる星のインスタンスを格納する配列
  let backgroundStarArray = [];

  let startTime = null;

  // 自機のインスタンス
  let viper = null;

  // 自機が登場中かどうかを表すフラグ
  let isComing = false;
  // 登場演出を開始した際のタイムスタンプ
  let comingStart = null;
  // ショットのインスタンスを格納する配列
  let shotArray = [];
  // シングルショットのインスタンスを格納する配列
  let singleShotArray = [];
  // 敵キャラクターのインスタンスを格納する配列
  let enemyArray = [];
  // 敵キャラクターのショットのインスタンスを格納する配列
  let enemyShotArray = [];
  // シーンマネージャー
  let scene = null;
  // 爆発エフェクトのインスタンスを格納する配列
  let explosionArray = [];
  // 再スタートするためのフラグ
  let restart = false;

  // キーの押下状態を調べるオブジェクト
  window.isKeyDown = {};

  // スコアを格納する
  // このオブジェクトはプロジェクトのどこからでも参照できるように
  // windowオブジェクトのカスタムプロパティとして設定する
  window.gameScore = 0;

  window.addEventListener('load', () => {
    util = new Canvas2DUtility(document.body.querySelector('#main_canvas'));
    canvas = util.canvas;
    ctx = util.context;

    initialize();
    loadCheck();
  }, false);

  // canvas やコンテキストを初期化する
  function initialize() {
    let i;
    // canvasの大きさを設定
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // 登場シーンからスタートするための設定
    viper = new Viper(ctx, 0, 0, 64, 64, './image/viper.png');
    viper.setComing(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT - 100
    );
    // 爆発エフェクトを初期化する
    for(let i = 0; i < EXPLOSION_MAX_COUNT; ++i) {
      explosionArray[i] = new Explosion(ctx, 50.0, 15, 30.0, 0.25);
    }
    // ショットを初期化する
    for(let i = 0; i < SHOT_MAX_COUNT; i++) {
      shotArray[i] = new Shot(ctx, 0, 0, 32, 32, './image/viper_shot.png');
      singleShotArray[i * 2] = new Shot(ctx, 0, 0, 32, 32, './image/viper_single_shot.png');
      singleShotArray[i * 2 + 1] = new Shot(ctx, 0, 0, 32, 32, './image/viper_single_shot.png');
    }
    viper.setShotArray(shotArray, singleShotArray);

    // 敵キャラクターのショットを初期化する
    for(let i = 0; i < ENEMY_SHOT_MAX_COUNT; ++i) {
      enemyShotArray[i] = new Shot(ctx, 0, 0, 32, 32, './image/enemy_shot.png');
      enemyShotArray[i].setTargets([viper]);
      enemyShotArray[i].setExplosions(explosionArray);
    }
    // 敵キャラクター（小）を初期化する
    for(let i = 0; i < ENEMY_SMALL_MAX_COUNT; ++i) {
      enemyArray[i] = new Enemy(ctx, 0, 0, 48, 48, './image/enemy_small.png');
      enemyArray[i].setShotArray(enemyShotArray);
      // 敵キャラクターは常に自機キャラクターを攻撃対象とする
      enemyArray[i].setAttackTarget(viper);
    }
    // 敵キャラクター（大）を初期化する
    for(let i = 0; i < ENEMY_LARGE_MAX_COUNT; ++i) {
      enemyArray[ENEMY_SMALL_MAX_COUNT + i] = new Enemy(ctx, 0, 0, 64, 64, './image/enemy_large.png');
      enemyArray[ENEMY_SMALL_MAX_COUNT + i].setShotArray(enemyShotArray);
      enemyArray[ENEMY_SMALL_MAX_COUNT + i].setAttackTarget(viper);
    }
    // 衝突判定を行うために対象を設定する
    for(let i = 0; i < SHOT_MAX_COUNT; ++i) {
      shotArray[i].setTargets(enemyArray);
      singleShotArray[i * 2].setTargets(enemyArray);
      singleShotArray[i * 2 + 1].setTargets(enemyArray);
      shotArray[i].setExplosions(explosionArray);
      singleShotArray[i * 2].setExplosions(explosionArray);
      singleShotArray[i * 2 + 1].setExplosions(explosionArray);
    }
    // 流れる星を初期化する
    for(let i = 0; i < BACKGROUND_STAR_MAX_COUNT; ++i) {
      // 星の速度と大きさはランダムと最大値で決まるようにする
      let size = 1 + Math.random() * (BACKGROUND_STAR_MAX_SIZE - 1);
      let speed = 1 + Math.random() * (BACKGROUND_STAR_MAX_SPEED - 1);
      backgroundStarArray[i] = new BackgroundStar(ctx, size, speed);
      // 星の初期位置もランダムで決まるようにする
      let x = Math.random() * CANVAS_WIDTH;
      let y = Math.random() * CANVAS_HEIGHT;
      backgroundStarArray[i].set(x, y);
    }

    // シーンを初期化する
    scene = new SceneManager();
  }

  // 描画処理を行なう
  function render() {
    ctx.globalAlpha = 1.0;
    // 描画前に画面全体を不透明な明るいグレーで塗りつぶす
    util.drawRect(0, 0, canvas.width, canvas.height, '#111122');

    let nowTime = (Date.now() - startTime) / 1000;

    viper.update();
    scene.update();

    shotArray.map((v) => {
      v.update();
    });

    singleShotArray.map((v) => {
      v.update();
    });

    enemyArray.map((v) => {
      v.update();
    });

    enemyShotArray.map((v) => {
      v.update();
    });

    // 爆発エフェクトの状態を更新する
    explosionArray.map((v) => {
      v.update();
    });

    backgroundStarArray.map((v) => {
      v.update();
    });

    // スコアの表示
    ctx.font = 'bold 24px monospace';
    util.drawText(zeroPadding(gameScore, 5), 30, 50, '#111111');

    // 恒常ループのために描画処理を再帰呼び出しする
    requestAnimationFrame(render);
  }

  // インスタンスの準備が完了しているか確認する
  function loadCheck() {
    let ready = true;
    ready = ready && viper.ready;
    shotArray.map((v) => {
      ready = ready && v.ready;
    });
    singleShotArray.map((v) => {
      ready = ready && v.ready;
    });
    // 敵キャラクターの準備状況も確認する
    enemyArray.map((v) => {
      ready = ready && v.ready;
    });
    // 敵キャラクターのショットの準備状況も確認する
    enemyShotArray.map((v) => {
      ready = ready && v.ready;
    });

    if(ready === true) {
      eventSetting();
      sceneSetting();
      startTime = Date.now()
      render();
    } else {
      setTimeout(loadCheck, 100);
    }
  }

  // イベントを設定する
  function eventSetting() {
    // キーの押下時に呼び出されるイベントリスナーを設定する
    window.addEventListener('keydown', (event) => {
      // キーの押下状態を管理するオブジェクトに押下されたことを設定する
      isKeyDown[`key_${event.key}`] = true;
      // ゲームオーバーから再スタートするための設定
      if(event.key === 'Enter') {
        if(viper.life <= 0) {
          // 再スタートフラグを立てる
          restart = true;
        }
      }
    }, false);
    // キーが離された時に呼び出されるイベントリスナーを設定する
    window.addEventListener('keyup', (event) => {
      isKeyDown[`key_${event.key}`] = false;
    });
  }

  // シーンを設定する
  function sceneSetting() {
    // イントロシーン
    scene.add('intro', (time) => {
      if(time > 2.0) {
        scene.use('invade_default_type');
      }
    });
    // invadeシーン
    scene.add('invade_default_type', (time) => {
      if(scene.frame % 30 === 0) {
        for(let i = 0; i < ENEMY_SMALL_MAX_COUNT; ++i) {
          if(enemyArray[i].life <= 0) {
            let e = enemyArray[i];
            // ここからさらに２パターンに分ける
            // frameを60で割り切れるかどうかで分岐する
            if(scene.frame % 60 === 0) {
              // 左側面から出てくる
              e.set(-e.width, 30, 2, 'default');
              // 進行方向は30度の方向
              e.setVectorFromAngle(degreesToRadians(30));
            } else {
              // 右側面から出てくる
              e.set(CANVAS_WIDTH + e.width, 30, 2, 'default');
              // 進行方向は150度の方向
              e.setVectorFromAngle(degreesToRadians(150));
            }
            break;
          }
        }
      }
      if(scene.frame === 270) {
        scene.use('blank');
      }
      // 自機キャラクターが被弾してライフが0になっていたらゲームオーバー
      if(viper.life <= 0) {
        scene.use('gameover');
      }
    });
    // 間隔調整のための空白シーン
    scene.add('blank', (time) => {
      if(scene.frame === 150) {
        scene.use('invade_wave_move_type');
      }
      if(viper.life <= 0) {
        scene.use('gameover');
      }
    });
    // invadeシーン（wave move type の敵キャラクターを生成）
    scene.add('invade_wave_move_type', (time) => {
      if(scene.frame % 50 === 0) {
        for(let i = 0; i < ENEMY_SMALL_MAX_COUNT; ++i) {
          if(enemyArray[i].life <= 0) {
            let e = enemyArray[i];
            if(scene.frame <= 200) {
              // 左側を進む
              e.set(CANVAS_WIDTH * 0.2, -e.height, 2, 'wave');
            } else {
              // 右側を進む
              e.set(CANVAS_WIDTH * 0.8, -e.height, 2, 'wave');
            }
            break;
          }
        }
      }
      if(scene.frame === 450) {
        scene.use('invade_large_type');
      } 
      if(viper.life <= 0) {
        scene.use('gameover');
      }
    });
    // invadeシーン（large type の敵キャラクターを生成）
    scene.add('invade_large_type', (time) => {
      if(scene.frame === 100) {
        let i = ENEMY_SMALL_MAX_COUNT + ENEMY_LARGE_MAX_COUNT;
        for(let j = ENEMY_SMALL_MAX_COUNT; j < i; ++j) {
          if(enemyArray[j].life <= 0) {
            let e = enemyArray[j];
            // 画面中央あたりから出現しライフが多い
            e.set(CANVAS_WIDTH / 2, -e.height, 50, 'large');
            break;
          }
        }
      }
      if(scene.frame === 500) {
        scene.use('intro');
      }
      if(viper.life <= 0) {
        scene.use('gameover');
      }
    });
    // ゲームオーバーシーン
    scene.add('gameover', (time) => {
      // 流れる文字の幅は画面の幅の半分を最大の幅とする
      let textWidth = CANVAS_WIDTH / 2;
      // 文字の幅を全体の幅に足し、ループする幅を決める
      let loopWidth = CANVAS_WIDTH + textWidth;
      // フレーム数に対する除算の剰余を計算し、文字列の位置とする
      let x = CANVAS_WIDTH - (scene.frame * 2) % loopWidth;
      // 文字列の描画
      ctx.font = 'bold 72px sans-serif';
      util.drawText('GAME OVER', x, CANVAS_HEIGHT / 2, '#ff0000', textWidth);
      // 再スタートのための処理
      if(restart === true) {
        // 再スタートフラグはここで最初に下げておく
        restart = false;
        // スコアをリセットしておく
        gameScore = 0;
        // 再度スタートするための座標等の設定
        viper.setComing(
          CANVAS_WIDTH / 2,    // 登場演出時の開始X座標
          CANVAS_HEIGHT + 50,  // 登場演出時の開始Y座標
          CANVAS_WIDTH / 2,    // 登場演出を終了とするX座標
          CANVAS_HEIGHT - 100  // 登場演出を終了とするY座標
        );
        // シーンをintroに設定
        scene.use('intro');
      }
    });

    // 最初のシーンにはイントロを設定する
    scene.use('intro');
  }

  // 数値の不足した桁数をゼロで埋めた文字列を返す
  function zeroPadding(number, count) {
    // 配列を指定の桁数分の長さで初期化する
    let zeroArray = new Array(count);
    // 配列の要素を'0'を挟んで連結する（=>「桁数 - 1」の0が連なる）
    let zeroString = zeroArray.join('0') + number;
    // 文字列の後ろから桁数分だけ文字を抜き取る
    return zeroString.slice(-count);
  }

  // 度数法の角度からラジアンを生成する
  function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
  }
})();
