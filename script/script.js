(() => {
  const CANVAS_WIDTH = 640;
  const CANVAS_HEIGHT = 480;

  let startTime = null;
  let viperX = CANVAS_WIDTH / 2;
  let viperY = CANVAS_HEIGHT / 2;

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
  }

  // 描画処理を行なう
  function render() {
    // 描画前に画面全体を不透明な明るいグレーで塗りつぶす
    util.drawRect(0, 0, canvas.width, canvas.height, '#eeeeee');

    let nowTime = (Date.now() - startTime) / 1000;
    ctx.drawImage(image, viperX, viperY);
    requestAnimationFrame(render);
  }

  // イベントを設定する
  function eventSetting() {
    window.addEventListener('keydown', (event) => {
      switch(event.key) {
        case 'ArrowLeft':
          viperX -= 10;
          break;
        case 'ArrowRight':
          viperX += 10;
          break;
        case 'ArrowUp':
          viperY -= 10;
          break;
        case 'ArrowDown':
          viperY += 10;
          break;
      }
    }, false);
  }
})();
