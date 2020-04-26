const { getColorFromURL } = require('color-thief-node');
// const { getPaletteFromURL } = require('color-thief-node');

export function getColorFromUrl (url: string): any{
    return new Promise (function(resolve, reject) {
        getColorFromURL(url)
        .then((color:any)=>{
            let hex = rgbToHex(color)
            console.log(hex)
            resolve(hex)
        })
        .catch((error:Error)=>{
            reject(error)
        });
    })
}

function rgbToHex (colors:Array<number>): string{
    var redHex = numberToHex(colors[0]);
    var greenHex = numberToHex(colors[1]);
    var blueHex = numberToHex(colors[2]);
    return "#"+redHex+greenHex+blueHex;
}

function numberToHex (num:number): string{
    var hex = Number(Math.floor(num)).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
}