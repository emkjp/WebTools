
var stage;
var shapesLayer;
var gridGroup;
var objectGroup;
var dragGroup;
var targetObjects;
var UNIT_SCALE = 30;
var WIDTH = 700;
var HEIGHT = 600;
var backgroundColor = "white";
var gridColor = "#aaa";
var strokeColor = "black";
var mouseX;
var mouseY;

var Mode = {
    LINE_SEGMENT: 0,
    CIRCLE: 1,
    POLYGON: 2,
    DOT: 3,
};

var ui = {
    scale: 1,
    borderScale: 1,
    origin: {
        x: 0,
        y: 0
    },
    reset: function () {
        ui.scale = 1;
        shapesLayer.setScale({ x: ui.scale, y: -ui.scale });
    }
};

$(function () {
    InitCanvas();

    $("#example").change(function () {
        var example = $("#example option:selected").val();
        ShowExample(example);
    });

    Click();
});

function ShowExample(type) {
    if (type === "example1") {
        $("#input_area").val("[LINE_SEGMENT]\n3 1 5 1\n4 3 4 2\n3 1 5 5\n2 3 2 2\n1 0 1 2\n1 2 3 4\n3 4 5 5\n1 0 5 2\n4 0 4 1\n5 5 5 1\n2 3 2 4\n");

        Click();
    } else if (type === "example2") {
        $("#input_area").val("[POLYGON]\n6\n2 2\n2 5\n0 5\n0 0\n5 0\n5 2\n");

        Click();
    } else if (type === "example3") {
        $("#input_area").val("[DOT]\n6.65128 5.47490\n6.42743 6.26189\n6.35864 4.61611\n6.59020 4.54228\n4.43967 5.70059\n4.38226 5.70536\n5.50755 6.18163\n7.41971 6.13668\n6.71936 3.04496\n5.61832 4.23857\n5.99424 4.29328\n5.60961 4.32998\n6.82242 5.79683\n5.44693 3.82724\n6.70906 3.65736\n7.89087 5.68000\n6.23300 4.59530\n5.92401 4.92329\n6.24168 3.81389\n6.22671 3.62210");

        Click();
    } else if (type === "example4") {
        $("#input_area").val("[CIRCLE]\n0 0 5\n8 0 5\n18 8 10\n8 16 5\n0 16 5\n0 24 5\n3 32 5\n10 32 5\n17 28 8\n27 25 3\n30 18 5\n");
        Click();
    } else if (type === "example5") {
        $("#input_area").val("[DOT]\n1 1\n2 2\n[POLYGON]\n4\n-3 -3 4 -3 4 3 -3 3\n[CIRCLE]\n5 3 4\n1 2 3\n[LINE_SEGMENT]\n10 3 3 6\n");
        Click();
    }

}

function Redraw() {
    ui.borderScale = GetBorderScale(ui.scale);
    shapesLayer.setOffset({ x: ui.origin.x, y: ui.origin.y });
    shapesLayer.setScale({ x: ui.scale, y: -ui.scale });
    Render();
}

function GetBorderScale(scale) {
    var ret = 1.0;
    while (scale * 10 < 1.01) { scale *= 10; ret *= 10; }
    return ret;
}

function InitCanvas() {
    stage = new Kinetic.Stage({
        container: 'container',
        width: WIDTH,
        height: HEIGHT
    });

    shapesLayer = new Kinetic.Layer({
        draggable: true,
        dragOnTop: false,
    });

    shapesLayer.on('dragend', function () {
        Redraw();
    });

    gridGroup = new Kinetic.Group();
    objectGroup = new Kinetic.Group();
    dragGroup = new Kinetic.Group();

    shapesLayer.add(gridGroup);
    shapesLayer.add(objectGroup);
    shapesLayer.add(dragGroup);

    stage.add(shapesLayer);

    $(stage.content).on('mousemove', function (event) {
        var offset = $("canvas").offset();
        var evt = event.originalEvent,
            mx = evt.pageX - offset.left - shapesLayer.position().x,
            my = evt.pageY - offset.top - shapesLayer.position().y;
        mouseX = (mx / ui.scale + shapesLayer.offsetX()) / UNIT_SCALE;
        mouseY = (-my / ui.scale + shapesLayer.offsetY()) / UNIT_SCALE;
        UpdateInfo();
    });

    $(stage.content).on('mousewheel', function (event) {
        event.preventDefault();
        var offset = $("canvas").offset();
        var evt = event.originalEvent,
            mx = evt.pageX - offset.left - shapesLayer.position().x,
            my = evt.pageY - offset.top - shapesLayer.position().y;
        var newscale = ui.scale * (1 + (evt.wheelDelta < 0 ? -1 : 1) * 0.3);

        ui.origin.x = mx / ui.scale + ui.origin.x - mx / newscale;
        ui.origin.y = -my / ui.scale + ui.origin.y + my / newscale;
        ui.scale = newscale;

        Redraw();

        return false;
    });
}

function Convert(x) {
    return Number(x) * UNIT_SCALE;
}

function LocateGrid(group) {
    group.destroyChildren();

    var left = -shapesLayer.position().x / ui.scale + shapesLayer.offsetX();
    var top = shapesLayer.position().y / ui.scale + shapesLayer.offsetY();
    var width = WIDTH / ui.scale;
    var height = HEIGHT / ui.scale;
    var right = left + width;
    var bottom = top - height;

    var leftX = Math.floor(left / UNIT_SCALE / ui.borderScale);
    var topY = Math.floor(top / UNIT_SCALE / ui.borderScale);

    // あまりに表示領域外(相対で1e10以上）の場所にオブジェクトを配置すると表示が乱れるため、
    // 必要最小限分だけのグリッドを設置する
    var xsize = Math.floor(WIDTH / ui.scale / UNIT_SCALE / ui.borderScale) + 2;
    var ysize = Math.floor(HEIGHT / ui.scale / UNIT_SCALE / ui.borderScale) + 2;

    var strokeWidth;
    var i;

    // 背景
    group.add(new Kinetic.Rect({
        x: left - width,
        y: bottom - height,
        width: width * 3,
        height: height * 3,
        fill: backgroundColor
    }));

    for (i = leftX - xsize; i <= leftX + xsize * 2 ; i++) {
        strokeWidth = ui.borderScale;
        if (i % 10 === 0) strokeWidth = ui.borderScale * 4;
        if (i % 100 === 0) strokeWidth = ui.borderScale * 9;
        if (i === 0) strokeWidth = Math.max(3.0 / ui.scale, ui.borderScale * 4);
        group.add(new Kinetic.Line({
            points: [Convert(i * ui.borderScale), bottom - height, Convert(i * ui.borderScale), top + height],
            stroke: gridColor,
            strokeWidth: strokeWidth
        }));
    }

    for (i = topY - ysize * 2; i <= topY + ysize; i++) {
        strokeWidth = ui.borderScale;
        if (i % 10 === 0) strokeWidth = ui.borderScale * 4;
        if (i % 100 === 0) strokeWidth = ui.borderScale * 9;
        if (i === 0) strokeWidth = Math.max(3.0 / ui.scale, ui.borderScale * 4);
        group.add(new Kinetic.Line({
            points: [left - width , Convert(i * ui.borderScale), right + width, Convert(i * ui.borderScale)],
            stroke: gridColor,
            strokeWidth: strokeWidth
        }));
    }

    // オブジェクトのストローク上ではドラッグ判定が上手くされない。
    // そのため、ObjectGroup より上の階層にあるグループに短形を置くことでドラッグできるようにする。
    dragGroup.destroyChildren();
    dragGroup.add(new Kinetic.Rect({
        x: left,
        y: bottom,
        width: width,
        height: height,
        opacity: 0.0
    }));
}

function LocateLineSegment(group, object, baseStrokeWidth)
{
    var x1 = Convert(object.x1);
    var x2 = Convert(object.x2);
    var y1 = Convert(object.y1);
    var y2 = Convert(object.y2);

    group.add(new Kinetic.Line({
        points: [x1, y1, x2, y2],
        stroke: strokeColor,
        strokeWidth: baseStrokeWidth,
        lineJoin: 'round',
    }));

    group.add(new Kinetic.Circle({
        x: x1,
        y: y1,
        radius: 1.5 * baseStrokeWidth,
        fill: strokeColor,
    }));

    group.add(new Kinetic.Circle({
        x: x2,
        y: y2,
        radius: 1.5 * baseStrokeWidth,
        fill: strokeColor,
    }));

}

function LocateCircle(group, object, baseStrokeWidth) {
    var x = Convert(object.x);
    var y = Convert(object.y);
    var r = Convert(object.r);

    group.add(new Kinetic.Circle({
        x: x,
        y: y,
        radius: r,
        stroke: strokeColor,
        strokeWidth: baseStrokeWidth
    }));

    group.add(new Kinetic.Circle({
        x: x,
        y: y,
        radius: Math.max(baseStrokeWidth, 2.0 * ui.borderScale),
        fill: strokeColor,
    }));
}

function LocatePolygon(group, object, baseStrokeWidth) {
    var array = object.points.concat();
    var i;

    for (i = 0; i < array.length; i++) {
        array[i] = Convert(array[i]);
    }

    for (i = 0; i + 1 < array.length; i += 2) {
        var x = array[i];
        var y = array[i + 1];
        group.add(new Kinetic.Circle({
            x: x,
            y: y,
            radius: baseStrokeWidth,
            fill: strokeColor,
        }));
    }

    group.add(new Kinetic.Line({
        points: array,
        stroke: strokeColor,
        strokeWidth: 1.5 * baseStrokeWidth,
        lineJoin: 'round',
        closed: true
    }));
}

function LocateDot(group, object, baseStrokeWidth) {
    var x = Convert(object.x);
    var y = Convert(object.y);

    group.add(new Kinetic.Circle({
        x: x,
        y: y,
        radius: 1.5 * baseStrokeWidth,
        fill: strokeColor,
    }));
}

function LocateObjects(group, objects) {
    group.destroyChildren();
    var baseStrokeWidth = 2.0 / ui.scale;

    for (var i = 0 ; i < objects.length ; i++){
        var object = objects[i];

        if (object.type === Mode.LINE_SEGMENT) {
            LocateLineSegment(group, object, baseStrokeWidth);
        } else if (object.type === Mode.CIRCLE) {
            LocateCircle(group, object, baseStrokeWidth);
        } else if (object.type === Mode.POLYGON) {
            LocatePolygon(group, object, baseStrokeWidth);
        } else if (object.type === Mode.DOT) {
            LocateDot(group, object, baseStrokeWidth);
        }
    }
}

function ParseTokens(tokens) {

    var cur = 0;
    var mode = Mode.DOT;
    
    var objects = [];
    var x, y;

    while (cur < tokens.length) {
        var current = tokens[cur];
        if (current === "[LINE_SEGMENT]") {
            mode = Mode.LINE_SEGMENT;
            cur++; continue;
        } else if (current === "[CIRCLE]") {
            mode = Mode.CIRCLE;
            cur++; continue;
        } else if (current === "[POLYGON]") {
            mode = Mode.POLYGON;
            cur++; continue;
        } else if (current === "[DOT]") {
            mode = Mode.DOT;
            cur++; continue;
        }

        if (mode === Mode.LINE_SEGMENT) {
            if (cur + 3 >= tokens.length) break;
            var x1 = Number(tokens[cur++]);
            var y1 = Number(tokens[cur++]);
            var x2 = Number(tokens[cur++]);
            var y2 = Number(tokens[cur++]);

            objects.push({
                type: Mode.LINE_SEGMENT,
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                boundingBox: {
                    minx: Math.min(x1, x2),
                    maxx: Math.max(x1, x2),
                    miny: Math.min(y1, y2),
                    maxy: Math.max(y1, y2)
                }
            });
        } else if (mode === Mode.CIRCLE) {
            if (cur + 2 >= tokens.length) break;
            x = Number(tokens[cur++]);
            y = Number(tokens[cur++]);
            var r = Number(tokens[cur++]);

            objects.push({
                type: Mode.CIRCLE,
                x: x,
                y: y,
                r: r,
                boundingBox: {
                    minx: x - r,
                    maxx: x + r,
                    miny: y - r,
                    maxy: y + r
                }
            });
         } else if (mode === Mode.POLYGON) {
            var n = Number(tokens[cur++]);
            var array = [];
            var minx = +1e10, miny = +1e10;
            var maxx = -1e10, maxy = -1e10;
            while (cur + 1 < tokens.length && n-- > 0) {
                x = Number(tokens[cur++]);
                y = Number(tokens[cur++]);
                array.push(x);
                array.push(y);
                minx = Math.min(minx, x);
                miny = Math.min(miny, y);
                maxx = Math.max(maxx, x);
                maxy = Math.max(maxy, y);
            }

            objects.push({
                type: Mode.POLYGON,
                points: array,
                boundingBox: {
                    minx: minx,
                    maxx: maxx,
                    miny: miny,
                    maxy: maxy
                }
            });
         } else if (mode === Mode.DOT) {
             if (cur + 1 >= tokens.length) break;
             x = Number(tokens[cur++]);
             y = Number(tokens[cur++]);

             objects.push({
                 type: Mode.DOT,
                 x: x,
                 y: y,
                 boundingBox: {
                     minx: x - 0.5,
                     maxx: x + 0.5,
                     miny: y - 0.5,
                     maxy: y + 0.5
                 }
             });
         }
    }
    return objects;
}

function UpdateInfo() {
    var text = "";
    text += "grid line per " + ui.borderScale + "<br>";
    text += "mouse coordinates : (" + Math.round(mouseX) + "," + Math.round(mouseY) + ")";
    $("#info").html(text);
}

function Adjust(boundingBox) {
    var padding = 0.1;
    var width = Math.abs(boundingBox.maxx - boundingBox.minx) + 1;
    var height = Math.abs(boundingBox.maxy - boundingBox.miny) + 1;
    if (width === 0 || height === 0) return;
    var scale = Math.min(1.0 * WIDTH * (1 - padding) / width, 1.0 * HEIGHT * (1 - padding) / height);

    var remX = WIDTH / scale - width;
    var remY = HEIGHT / scale - height;

    ui.scale = scale;
    ui.origin.x = boundingBox.minx - remX / 2;
    ui.origin.y = boundingBox.maxy + remY / 2;

    // ドラッグで移動されたオブジェクトを元の位置に戻す
    shapesLayer.position({ x: 0, y: 0 });
    Redraw();
}

function GetBoundingBox(objects) {
    var boundingBox = {
        minx: +1e10,
        miny: +1e10,
        maxx: -1e10,
        maxy: -1e10,
    };

    if (objects.length === 0) {
        boundingBox.minx = Convert(0);
        boundingBox.miny = Convert(0);
        boundingBox.maxx = Convert(10);
        boundingBox.maxy = Convert(10);
    }

    for (var i = 0; i < objects.length; i++) {
        var object = objects[i];
        boundingBox.minx = Math.min(boundingBox.minx, Convert(object.boundingBox.minx));
        boundingBox.miny = Math.min(boundingBox.miny, Convert(object.boundingBox.miny));
        boundingBox.maxx = Math.max(boundingBox.maxx, Convert(object.boundingBox.maxx));
        boundingBox.maxy = Math.max(boundingBox.maxy, Convert(object.boundingBox.maxy));
    }

    return boundingBox;
}

function Click() {
    var text = $("#input_area").val();

    var tokens = text
        .replace(/\[/g, " [")
        .replace(/\]/g, "] ")
        .split(/[\s]+/)
        .filter(function (v) { return v !== ''; });

    targetObjects = ParseTokens(tokens);

    Adjust(GetBoundingBox(targetObjects));

    Render(targetObjects);
}

function Render() {
    LocateObjects(objectGroup, targetObjects);
    LocateGrid(gridGroup);
    stage.draw();
    UpdateInfo();
}
