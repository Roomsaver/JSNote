// Global canvas variables that need to be accessed by every function  
var canvasHeight = 192;
var canvasWidth = 256;
const canvas = document.getElementById("drawing");
const ctx = canvas.getContext("2d");
let brushColor = "black";
let backgroundColor = "white";
let brushSize = 1;
let brushType = 0;

// Global mouse variables
var drawing = false;
let firstX = undefined;
let firstY = undefined;
let secondX = undefined;
let secondY = undefined;
var down = {};

// Global animation variables
let frameIndex = 0;
let frames = [];
let loop = false;
let currentSpeed = 7;


// Implementation of Bresenham's line algorithm
// We use this because the effective polling rate of our mouse pos function is slow and will just draw dots while drawing quickly
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

// Return var with min and max values applied
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

// Translate on screen position to canvas pixel position
function getPixel(x, y)
{
    let canvas = $('#drawing')[0];
    let canvasPixelOffset = canvas.offsetWidth / 256;
    let canvasX = ($('body')[0].offsetWidth - canvas.offsetWidth) / 2;
    // let canvasY = ($('body')[0].offsetHeight - $('#drawing')[0].offsetHeight) / 2;

    return [Math.round((x - canvasX) / canvasPixelOffset), Math.round(y / canvasPixelOffset)];
}

// Draw on the canvas at the specified x and y pos
function draw(x, y)
{
    // If this isn't the first position we're drawing
    if(firstX !== undefined && firstY !== undefined)
    {
        // Set our second x and y position
        // (first x and y are already set)
        secondX = x;
        secondY = y;

        // Loop for every pixel in our brush size (e.g. 2 times for a 2x2 brush)
        for(let i = 0;i<brushSize;i++)
        {
            // Determine if the line being drawn is horizontal or vertical to offset the new line drawn
            // For a brush of size 1x1 this will only run our Bresenham function once
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

    // Set our new first x and first y position
    // (effectively shifting the position to make our current secondary position the new primary position in preparation of our next point)
    firstX = x;
    firstY = y;

    // Fill in our pixel(s) with our brush color
    ctx.fillStyle = brushColor;
    ctx.fillRect(x, y, brushSize, brushSize);
}

// Function to draw a circle at the current x and y
// Unused because the circle is aliased
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

// Fill in the entire canvas with a specified color
function clearCanvas(color = "white")
{
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

// Called when we should no longer be drawing to the canvas (e.g. mouse button is lifted or cursor exits the canvas)
function drawOff()
{
    drawing = false;
    firstX = undefined;
    firstY = undefined;
    secondX = undefined;
    secondY = undefined;
}

// Write the current frame image data to our frame array
function saveCurrentFrame()
{
    frames[frameIndex] = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
}

// Display the next frame in our frame array
function nextFrame()
{
    // Create a new blank frame if the next frame doesn't exist
    // This should probably be handled differently. Like checking this at the function that calls nextFrame()
    if(frames[frameIndex + 1] === undefined)
    {
        saveCurrentFrame();
        frameIndex++;
        clearCanvas(backgroundColor);
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

// Display the previous frame in our frame array
function previousFrame()
{
    // Make sure we don't go to negative frame indices
    if(frameIndex > 0)
    {
        saveCurrentFrame();
        frameIndex--;
        ctx.putImageData(frames[frameIndex], 0, 0);
    }
}

// Effectively delete the frame by specified frame number
function deleteFrame(frameNum)
{
    // Splice the frame out of the frame array
    // This also reindexes all other frames
    frames.splice(frameNum, 1);
    // Display the previous frame, unless the current frame is index 0, then we will recreate the 0th frame
    frameNum = frameNum > 0 ? frameNum-- : 0;
    ctx.putImageData(frames[frameNum], 0, 0);
}

// Update the text that displays what the current frame is
function setFrameText(frameNum)
{
    let text = `${frameNum}/${frames.length}`;
    // Bodge!!!
    // Sometimes the frames are off by 1, this fixes that
    if(frameNum > frames.length)
    {
        text = `${frameNum}/${frames.length + 1}`;
    }
    $('#frame-index').text(text);
}

// Play the animation using the canvas and the frames array
function playAnimation(speed)
{
    // Reset to the first frame
    frameIndex = 0;
    let player = setInterval(()=>
        {
            // If the current frame is the last frame
            if(frameIndex >= frames.length)
            {
                // If we are looping the animation, return back to the first frame
                if(loop)
                {
                    frameIndex = 0;
                }
                // If we are not looping, stop the setInterval and set the frame index to the last frame
                else
                {
                    clearInterval(player);
                    frameIndex = frames.length - 1;
                }
            }
            else
            {
                // Set our text to the current frame
                setFrameText(frameIndex);
                // Display the currently selected frame
                ctx.putImageData(frames[frameIndex], 0, 0);
                // Move to the next frame
                frameIndex++;

            }
        }, speed);
}

// Run our animation with different FPSes to choose from (based on Flipnote 3DS speeds)
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

// Calculate fps to milliseconds and run the animation at that speed
function playAnimationWithFPS(fps)
{
    playAnimation(Math.round((1/fps) * 1000));
}


$(document).ready(
()=>
{
    // //////////////// //
    // Canvas functions //
    // //////////////// //

    // Fill our canvas so it is not transparent
    clearCanvas();
    // Clicking will start drawing
    $(document).on('mousedown', (e)=>{drawing = true;});
    // Letting go of the mouse button will stop drawing
    $(document).on('mouseup', ()=>{drawOff();})
    // All logic for if we should draw is handled when the mouse moves
    $(document).on('mousemove', (e)=>{
        // If we're not clicking we don't care
        if(drawing)
        {
            // Get the current cursor position
            let posArray = getPixel(e.pageX, e.pageY);
            // If the current cursor position is outside of the canvas, stop drawing
            if(posArray[0] > canvasWidth || posArray[1] > canvasHeight)
            {
                drawOff();
            }
            // If the current cursor position is inside of the canvas, run our drawing function based on the brush selected
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

    // /////////////////////// //
    // Frame control functions //
    // /////////////////////// //

    $('#delete-frame').on('click', ()=>{deleteFrame(frameIndex);setFrameText(frameIndex + 1);});

    // ////////////////////// //
    // Quick select functions //
    // ////////////////////// //

    $('#play-button').on('click', ()=>{playAnimationWithSpeed(currentSpeed);});

    $('#play-speed').on('click', ()=>{
        // Loop through the speed settings 1-10 and reset back to 1
        currentSpeed == 10 ? currentSpeed = 1 : currentSpeed++;
        $('#play-speed').text(currentSpeed);
    });

    $('#brush-size').on('click', ()=>{
        // Loop through the brush sizes 1-10 and reset back to 1
        brushSize == 10 ? brushSize = 1 : brushSize++;
        $('#brush-size').text(brushSize);
    });

    $('#clear').on('click', ()=>{clearCanvas(backgroundColor);});


    // ////////////////// //
    // Keyboard functions //
    // ////////////////// //

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
                    // left arrow
                    previousFrame();
                    setFrameText(frameIndex + 1);
                    break;
                case 39:
                    // right arrow
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
