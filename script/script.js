(() => {
  const CANVAS_WIDTH = 640;
  const CANVAS_HEIGHT = 480;
  const SHOT_MAX_COUNT = 10;
  // 敵キャラクターのインスタンス数
  const ENEMY_MAX_COUNT = 10;
  // 敵キャラクターのショットの最大個数
  const ENEMY_SHOT_MAX_COUNT = 50;
  // 爆発エフェクトの最大個数
  const EXPLOSION_MAX_COUNT = 10;

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

  // キーの押下状態を調べるオブジェクト
  window.isKeyDown = {};

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

    // ショットを初期化する
    for(let i = 0; i < SHOT_MAX_COUNT; i++) {
      shotArray[i] = new Shot(ctx, 0, 0, 32, 32, './image/viper_shot.png');
      singleShotArray[i * 2] = new Shot(ctx, 0, 0, 32, 32, './image/viper_single_shot.png');
      singleShotArray[i * 2 + 1] = new Shot(ctx, 0, 0, 32, 32, './image/viper_single_shot.png');
    }
    viper.setShotArray(shotArray, singleShotArray);

    // 敵キャラクターのショットを初期化する
    for(let i = 0; i < ENEMY_SHOT_MAX_COUNT; i++) {
      enemyShotArray[i] = new Shot(ctx, 0, 0, 32, 32, './image/enemy_shot.png');
    }
    // 敵キャラクターを初期化する
    for(let i = 0; i < ENEMY_MAX_COUNT; i++) {
      enemyArray[i] = new Enemy(ctx, 0, 0, 48, 48, './image/enemy_small.png');
      enemyArray[i].setShotArray(enemyShotArray);
    }
    // 爆発エフェクトを初期化する
    for(let i = 0; i < EXPLOSION_MAX_COUNT; i++) {
      explosionArray[i] = new Explosion(ctx, 50.0, 15, 30.0, 0.25);
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

    // シーンを初期化する
    scene = new SceneManager();
  }

  // 描画処理を行なう
  function render() {
    ctx.globalAlpha = 1.0;
    // 描画前に画面全体を不透明な明るいグレーで塗りつぶす
    util.drawRect(0, 0, canvas.width, canvas.height, '#eeeeee');

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
        scene.use('invade');
      }
    });
    // invadeシーン
    scene.add('invade', (time) => {
      if(scene.frame === 0) {
        for(let i = 0; i < ENEMY_MAX_COUNT; ++i) {
          if(enemyArray[i].life <= 0) {
            let e = enemyArray[i];
            e.set(CANVAS_WIDTH / 2, -e.height);
            e.setVector(0.0, 1.0);
            break;
          }
        }
      }
      if(scene.frame === 100) {
        scene.use('invade');
      }
    });
    // 最初のシーンにはイントロを設定する
    scene.use('intro');
  }
})();
