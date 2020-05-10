const { getColorFromURL } = require('color-thief-node');
const { getPaletteFromURL } = require('color-thief-node');

export function getColorFromUrl (url: string): any{
    return new Promise (function(resolve, reject) {
        getPaletteFromURL(url, 2, 10)
        .then((palette:any)=>{
            for (let color of palette){
                if (getVibrancy(color) >= 50.0){
                    resolve(rgbToHex(color))
                }
            }
            resolve(resolve(rgbToHex(palette[0])))
        })
        .catch((error:Error)=>{
            reject(error)
        });
    })
}

export function getCommonColor (url: string): any{
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

function getVibrancy (colors: Array<number> ): number {

    var r = colors[0];
    var g = colors[1];
    var b = colors[2];

    if (r + g + b == 0 ){
        return 0
    }

    let min = Math.min(r,g,b)
    let max = Math.max(r,g,b)

    let value = ((max+ min) * (max-min))/max
    return value
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