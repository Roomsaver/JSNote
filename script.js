var canvasHeight = 192;
var canvasWidth = 256;
const canvas = document.getElementById("drawing");
const ctx = canvas.getContext("2d");
let brushColor = "black";
let backgroundColor = "white";
let brushSize = 1;
let brushType = 0;
var drawing = false;
let firstX = undefined;
let firstY = undefined;
let secondX = undefined;
let secondY = undefined;

let frameIndex = 0;
let frames = [];
let loop = false;
let currentSpeed = 7;

var down = {};

function BMFastPixelArtLine(x1, y1, x2, y2, color) {
    ctx.fillStyle = color;
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    x2 = Math.round(x2);
    y2 = Math.round(y2);
    const dx = Math.abs(x2 - x1);
    const sx = x1 < x2 ? 1 : -1;
    const dy = Math.abs(y2 - y1);
    const sy = y1 < y2 ? 1 : -1;
    var error, len, rev, count = dx;
    ctx.beginPath();
    if (dx > dy) {
        error = dx / 2;
        rev = x1 > x2 ? 1 : 0;
        if (dy > 1) {
            error = 0;
            count = dy - 1;
            do {
                len = error / dy + 2 | 0;
                ctx.rect(x1 - len * rev, y1, len, 1);
                x1 += len * sx;
                y1 += sy;
                error -= len * dy - dx;
            } while (count--);
        }
        if (error > 0) {ctx.rect(x1, y2, x2 - x1, 1) }
    } else if (dx < dy) {
        error = dy / 2;
        rev = y1 > y2 ? 1 : 0;
        if (dx > 1) {
            error = 0;
            count --;
            do {
                len = error / dx + 2 | 0;
                ctx.rect(x1 ,y1 - len * rev, 1, len);
                y1 += len * sy;
                x1 += sx;
                error -= len * dx - dy;
            } while (count--);
        }
        if (error > 0) { ctx.rect(x2, y1, 1, y2 - y1) }
    } else {
        do {
            ctx.rect(x1, y1, 1, 1);
            x1 += sx;
            y1 += sy;
        } while (count --); 
    }
    ctx.fill();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function getPixel(x, y)
{
    let canvas = $('#drawing')[0];
    let canvasPixelOffset = canvas.offsetWidth / 256;
    let canvasX = ($('body')[0].offsetWidth - canvas.offsetWidth) / 2;
    // let canvasY = ($('body')[0].offsetHeight - $('#drawing')[0].offsetHeight) / 2;

    return [Math.round((x - canvasX) / canvasPixelOffset), Math.round(y / canvasPixelOffset)];
}

function draw(x, y)
{
    if(firstX !== undefined && firstY !== undefined)
    {
        secondX = x;
        secondY = y;

        for(let i = 0;i<brushSize;i++)
        {
            let xDelta = Math.abs(firstX - secondX);
            let yDelta = Math.abs(firstY - secondY);
            if(xDelta > yDelta)
            {
                BMFastPixelArtLine(firstX, firstY + i, secondX, secondY + i, brushColor);
            }
            else
            {
                BMFastPixelArtLine(firstX + i, firstY, secondX + i, secondY, brushColor);
            }

        }
        
    }

    firstX = x;
    firstY = y;

    ctx.fillStyle = brushColor;
    ctx.fillRect(x, y, brushSize, brushSize);
}

function drawCircle(x, y)
{
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = brushColor;
    ctx.fill();
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;
    ctx.stroke();
}

function clearCanvas(color = "white")
{
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function drawOff()
{
    drawing = false;
    firstX = undefined;
    firstY = undefined;
    secondX = undefined;
    secondY = undefined;
}

function saveCurrentFrame()
{
    frames[frameIndex] = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
}

function nextFrame()
{
    if(frames[frameIndex + 1] === undefined)
    {
        saveCurrentFrame();
        frameIndex++;
        clearCanvas();
    }
    else
    {
        saveCurrentFrame();
        frameIndex++;
        ctx.putImageData(frames[frameIndex], 0, 0);
    }

    // let index = 0;
    // let anim = setInterval(()=>
    // {
    //     if(index - 1 >= -canvasWidth)
    //     {
    //         ctx.putImageData(frames[frameIndex-1], index, 0);
    //         index--;
    //     }
    //     else
    //     {
    //         clearInterval(anim);
    //         ctx.putImageData(frames[frameIndex], 0, 0);
    //     }
    // }, 1);
    
}

function previousFrame()
{
    if(frameIndex > 0)
    {
        saveCurrentFrame();
        frameIndex--;
        ctx.putImageData(frames[frameIndex], 0, 0);
    }
}

function deleteFrame(frameNum)
{
    frames.splice(frameNum, 1);
    frameIndex--;
    ctx.putImageData(frames[frameIndex], 0, 0);
}

function setFrameText(frameNum)
{
    let text = `${frameNum}/${frames.length}`;
    if(frameNum > frames.length)
    {
        text = `${frameNum}/${frames.length + 1}`;
    }
    $('#frame-index').text(text);
}

function playAnimation(speed)
{
    let player = setInterval(()=>
        {
            if(frameIndex >= frames.length)
            {
                if(loop)
                {
                    frameIndex = 0;
                }
                else
                {
                    clearInterval(player);
                    frameIndex = frames.length - 1;
                }
            }
            else
            {
                ctx.putImageData(frames[frameIndex], 0, 0);
                frameIndex++;
                setFrameText(frameIndex + 1);

            }
        }, speed);
}

function playAnimationWithSpeed(speedSetting)
{
    // fps to ms
    // (1/fps)*1000 
    switch(speedSetting)
    {
        case 1:
            // 0.5 fps
            playAnimation(2000);
            break;
        case 2:
            // 1 fps
            playAnimation(1000);
            break;
        case 3:
            // 2 fps
            playAnimation(500);
            break;
        case 4:
            // 4 fps
            playAnimation(250);
            break;
        case 5:
            // 6 fps
            playAnimation(166);
            break;
        case 6:
            // 8 fps
            playAnimation(125);
            break;
        case 7:
            // 12 fps
            playAnimation(83);
            break;
        case 8:
            // 20 fps
            playAnimation(50);
            break;
        case 9:
            // 24 fps
            playAnimation(41);
            break;
        case 10:
            // 30 fps
            playAnimation(33);
            break;
    }
}

function playAnimationWithFPS(fps)
{
    playAnimation(Math.round((1/fps) * 1000));
}


$(document).ready(
()=>
{
    clearCanvas();
    $(document).on('mousedown', (e)=>{drawing = true;});
    $(document).on('mouseup', ()=>{drawOff();})
    $(document).on('mousemove', (e)=>{
        if(drawing)
        {
            let posArray = getPixel(e.pageX, e.pageY);
            if(posArray[0] > canvasWidth || posArray[1] > canvasHeight)
            {
                drawOff();
            }
            else
            {
                switch(brushType)
                {
                    case 0:
                        draw(posArray[0], posArray[1]);
                        break;
                    case 1:
                        drawCircle(posArray[0], posArray[1]);
                }
            }
        }
    });

    $('#delete-frame').on('click', ()=>{deleteFrame(frameIndex);setFrameText(frameIndex + 1);});


    $('#play-button').on('click', ()=>{playAnimationWithSpeed(currentSpeed);});

    $('#play-speed').on('click', ()=>{
        currentSpeed == 10 ? currentSpeed = 1 : currentSpeed++;
        $('#play-speed').text(currentSpeed);
    });

    $('#brush-size').on('click', ()=>{
        brushSize == 10 ? brushSize = 1 : brushSize++;
        $('#brush-size').text(brushSize);
    });

    $('#clear').on('click', ()=>{clearCanvas(backgroundColor);});


                // space bar
                // case 32:

    $(document).keydown(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);

        // if(down[keycode] == null)
        // {
            switch(Number(keycode))
            {
                case 32:
                    // space
                    break;
                case 37:
                    previousFrame();
                    setFrameText(frameIndex + 1);
                    break;
                case 39:
                    nextFrame();
                    setFrameText(frameIndex + 1);
                    break;
            }

        //     down[keycode] = true;
        // }
        

        // if(keycode == '39'){
        //     { // first press
        //     if (down['39'] == null)
        //         nextFrame();
        //         down['39'] = true; // record that the key's down
        //     }
        // } 
    });

    $(document).keyup(function(event) {
        //  var keycode = (event.keyCode ? event.keyCode : event.which);
        //  down[keycode] = null;
    });
});
