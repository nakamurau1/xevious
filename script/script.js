(() => {
  const CANVAS_WIDTH = 640;
  const CANVAS_HEIGHT = 480;

  let startTime = null;

  // 自機のインスタンス
  let viper = null;

  // 自機が登場中かどうかを表すフラグ
  let isComing = false;
  // 登場演出を開始した際のタイムスタンプ
  let comingStart = null;

  // キーの押下状態を調べるオブジェクト
  window.isKeyDown = {};

  window.addEventListener('load', () => {
    util = new Canvas2DUtility(document.body.querySelector('#main_canvas'));
    canvas = util.canvas;
    ctx = util.context;

    util.imageLoader('./image/viper.png', (loadedImage) => {
      image = loadedImage;
      initialize();
      eventSetting();
      startTime = Date.now();
      render();
    });
  }, false);

  // canvas やコンテキストを初期化する
  function initialize() {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // 登場シーンからスタートするための設定
    viper = new Viper(ctx, 0, 0, 64, 64, image);
    viper.setComing(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT - 100
    );
  }

  // 描画処理を行なう
  function render() {
    ctx.globalAlpha = 1.0;
    // 描画前に画面全体を不透明な明るいグレーで塗りつぶす
    util.drawRect(0, 0, canvas.width, canvas.height, '#eeeeee');

    let nowTime = (Date.now() - startTime) / 1000;

    viper.update();

    // 恒常ループのために描画処理を再帰呼び出しする
    requestAnimationFrame(render);
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
})();
