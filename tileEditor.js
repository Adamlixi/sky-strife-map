var tinyMapEditor = (function() {
    var win = window,
        doc = document,
        pal = doc.getElementById('palette').getContext('2d'),
        map = doc.getElementById('tileEditor').getContext('2d'),
        width = 10,
        height = 10,
        tileSize = 32,
        srcTile = 0,
        imgHeight = 8,
        sprite = new Image(),
        tiles, // used for demo, not *really* needed atm
        alpha,

        player,
        draw,
        build = doc.getElementById('build'),
        test = doc.getElementById('test');
        mapId = []

    var app = {
        getTile : function(e) {
            if (e.target.nodeName === 'CANVAS') {
                var row = e.layerX / tileSize | 0,
                    col = e.layerY / tileSize | 0;

                if (e.target.id === 'palette') srcTile = { row : row, col : col , id : row + imgHeight * col};
                return { row : row, col : col };
            }
        },

        setTile : function(e) {
            var destTile;

            if (e.target.id === 'tileEditor' && srcTile && !draw) {
                destTile = this.getTile(e);
                map.clearRect(destTile.row * tileSize, destTile.col * tileSize, tileSize, tileSize);
                map.drawImage(sprite, srcTile.row * tileSize, srcTile.col * tileSize, tileSize, tileSize, destTile.row * tileSize, destTile.col * tileSize, tileSize, tileSize);
                mapId[destTile.row + destTile.col * height] = srcTile.id;
                console.log(mapId);
            }
        },

        drawTool : function() {
            var rect = doc.createElement('canvas'),
                ctx = rect.getContext('2d'),
                eraser = function() {
                    ctx.fillStyle = 'red';
                    ctx.fillRect(0, 0, tileSize, tileSize);
                    ctx.fillStyle = 'white';
                    ctx.fillRect(2, 2, tileSize - 4, tileSize - 4);
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 2;
                    ctx.moveTo(tileSize, 0);
                    ctx.lineTo(0, tileSize);
                    ctx.stroke();
                };

            rect.width = rect.height = tileSize;
            doc.getElementById('selected').appendChild(rect);
            eraser();

            this.drawTool = function() {
                rect.width = tileSize;
                srcTile ? ctx.drawImage(sprite, srcTile.row * tileSize, srcTile.col * tileSize, tileSize, tileSize, 0, 0, tileSize, tileSize) : eraser();
            };
        },

        eraseTile : function(e) {
            var destTile;
            if (!draw) {
                if (e.target.id === 'erase' && srcTile) {
                    srcTile = 0;
                } else if (e.target.id === 'tileEditor' && !srcTile) {
                    destTile = this.getTile(e);
                    map.clearRect(destTile.row * tileSize, destTile.col * tileSize, tileSize, tileSize);
                    mapId[destTile.row + height * destTile.col] = undefined;
                }
            }
        },

        drawMap : function() {
            var i, j, invert = document.getElementById('invert').checked ? 0 : 1;

            map.fillStyle = 'black';
            for (i = 0; i < width; i++) {
                for (j = 0; j < height; j++) {
                    if (alpha[i][j] === invert) {
                        map.fillRect(i * tileSize, j * tileSize, tileSize, tileSize);
                    } else if (typeof alpha[i][j] === 'object') {
                        // map.putImageData(tiles[i][j], i * tileSize, j * tileSize); // temp fix to colour collision layer black
                    }
                }
            }
        },

        clearMap : function(e) {
            if (e.target.id === 'clear') {
                map.clearRect(0, 0, map.canvas.width, map.canvas.height);
                this.destroy();
                mapId = []
                build.disabled = false;
            }
        },

        buildMap : function(e) {
            if (e.target.id === 'build') {
                var obj = {},
                    pixels,
                    len,
                    x, y, z, i, v, t;
                t = 0;

                tiles = []; // graphical tiles (not currently needed, can be used to create standard tile map)
                alpha = []; // collision map
                outPut = [];

                for (i = 0; i < mapId.length ; i ++) {
                    x = i % height;
                    y = Math.floor(i / height);
                    v = mapId[i];
                    if (v === -1 || v === undefined) {
                        continue
                    }
                    if (!tileMap[v]) {
                        continue
                    }
                    outPut[t] = {
                        templateId:tileMap[v],
                        values:{
                            Position:{
                                x:x,
                                y:y,
                            }
                        }
                    }
                    t ++;
                }
                console.log(outPut)
                output = JSON.stringify(outPut);
                doc.getElementsByTagName('textarea')[0].value = output;
            }
        },

        sortPartial : function(arr) {
            var len = arr.length,
                temp = [],
                i, j;

            for (i = 0; i < tileSize; i++) {
                temp[i] = [];
                for (j = 0; j < len; j++) {
                    if (j % tileSize === j) {
                        temp[i][j] = arr[j * tileSize + i];
                    }
                }
                temp[i] = temp[i].indexOf(255);
            }
            return temp;
        },

        outputJSON : function() {
            var output = '',
                invert = document.getElementById('invert').checked;

            if (invert) {
                alpha.forEach(function(arr) {
                    arr.forEach(function(item, index) {
                        // using bitwise not to flip values
                        if (typeof item === 'number') arr[index] = Math.abs(~-item);
                    });
                });
            }

            // output = (output.split('],'));
            // output = output.concat('],');

            output = JSON.stringify(alpha);
            doc.getElementsByTagName('textarea')[0].value = output;
        },

        bindEvents : function() {
            var _this = this;


            /**
             * Window events
             */

            win.addEventListener('click', function(e) {
                _this.setTile(e);
                _this.getTile(e);
                _this.eraseTile(e);
                _this.drawTool();
                _this.clearMap(e);
                _this.buildMap(e);
            }, false);


            /**
             * Image load event
             */

            sprite.addEventListener('load', function() {
                pal.canvas.width = this.width;
                pal.canvas.height = this.height;
                pal.drawImage(this, 0, 0);
            }, false);


            /**
             * Input change events
             */

            document.getElementById('width').addEventListener('change', function() {
                width = +this.value;
                _this.destroy();
                _this.init();
            }, false);

            document.getElementById('height').addEventListener('change', function() {
                height = +this.value;
                _this.destroy();
                _this.init();
            }, false);
        },

        init : function() {
            sprite.src = 'assets/map-maker-tileset.png';
            map.canvas.width = width * tileSize;
            map.canvas.height = height * tileSize;
            this.drawTool();
        },

        destroy : function() {
            clearInterval(draw);
            alpha = [];
        }
    };



    app.bindEvents();
    app.init();
    return app;

})();

tileMap = {
    0:"Grass",
    1:"Forest",
    2:"Mountain",
    3:"Water",
    4:"WoodenWall",
    5:"StoneWall",
    8:"Settlement",
    9:"SpawnSettlement",
    10:"BlazingHeartShrine",
    11:"Portal",
    12:"SummoningAltar",
    13:"GoldMine",
    16:"EmberCrownShrine",
    18:"EscapePortal",
    19:"MapCenterMarker",
    22:"Village",
    24:"LavaGround",
    25:"Sand",
    26:"LavaMountain",
    27:"LavaForest",
    28:"MetalGenerator",
    29:"CrystalGenerator",
    30:"FossilGenerator",
    31:"WidgetGenerator",
    32:"Lava",
    33:"RockWall",
    35:"LavaForest",
}