const { getColorFromURL } = require('color-thief-node');
// const { getPaletteFromURL } = require('color-thief-node');

export function getColorFromUrl (url: string): any{
    return new Promise (function(resolve, reject) {
        getColorFromURL(url)
        .then((image:any)=>{
            console.log(image)
            resolve(image)
        })
        .catch((error:Error)=>{
            reject(error)
        });
    })
}