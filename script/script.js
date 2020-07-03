(() => {
  const CANVAS_WIDTH = 640;
  const CANVAS_HEIGHT = 480;

  let startTime = null;

  window.addEventListener('load', () => {
    util = new Canvas2DUtility(document.body.querySelector('#main_canvas'));
    canvas = util.canvas;
    ctx = util.context;

    util.imageLoader('./image/viper.png', (loadedImage) => {
      image = loadedImage;
      initialize();
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
    let s = Math.sin(nowTime);
    let x = s * 100.0;
    ctx.drawImage(image, CANVAS_WIDTH / 2 + x, CANVAS_HEIGHT / 2);
    requestAnimationFrame(render);
  }
})();
