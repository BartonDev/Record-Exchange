import Vibrant = require('node-vibrant')
const request = require('request').defaults({encoding:null});

//DEPRECATED
// ~3x slower than color theif
// provides better information but isnt worth performance trade-off at this time

export class ColorPalette {
    vibrant: string
    lightVibrant: string
    darkVibrant: string
    muted: string
    lightMuted: string
    darkMuted: string

    primaryColor: string
    secondaryColor: string
    primaryVibrant: string
    primaryMuted: string

    constructor(palette:Vibrant.VibrantResponse){
        var topColor = 0
        var topVibrant = 0
        var topMuted = 0 

        this.vibrant = rgbToHex(palette.Vibrant.rgb)
        this.lightVibrant = rgbToHex(palette.LightVibrant.rgb)
        this.darkVibrant = rgbToHex(palette.DarkVibrant.rgb)

        this.muted = rgbToHex(palette.Muted.rgb)
        this.lightMuted = rgbToHex(palette.LightMuted.rgb)
        this.darkMuted = rgbToHex(palette.DarkMuted.rgb)

        this.primaryColor = ""
        this.secondaryColor = ""
        this.primaryVibrant = ""
        this.primaryMuted = ""

        let vibrantPopulation = palette.Vibrant.population
        let lightVibrantPopulation = palette.LightVibrant.population
        let darkVibrantPopulation = palette.DarkVibrant.population
        let mutedPopulation = palette.Muted.population
        let lightMutedPopulation = palette.LightMuted.population
        let darkMutedPopulation = palette.DarkMuted.population

        //Incase of tied Population, perform checks in reverse priority order

        
        //Dark Muted
        if (darkMutedPopulation >= topColor) {
            this.secondaryColor = this.primaryColor
            this.primaryColor = this.darkMuted
            topColor = darkMutedPopulation
        }
        if (darkMutedPopulation >= topMuted) {
            this.primaryMuted = this.darkMuted
            topMuted = darkMutedPopulation
        }
        //Light Muted
        if (lightMutedPopulation >= topColor) {
            this.secondaryColor = this.primaryColor
            this.primaryColor = this.lightMuted
            topColor = lightMutedPopulation
        }
        if (lightMutedPopulation >= topMuted) {
            this.primaryMuted = this.lightMuted
            topMuted = lightMutedPopulation
        }
        //Muted
        if (mutedPopulation >= topColor) {
            this.secondaryColor = this.primaryColor
            this.primaryColor = this.muted
            topColor = mutedPopulation
        }
        if (mutedPopulation >= topMuted) {
            this.primaryMuted = this.muted
            topMuted = mutedPopulation
        }
        //Dark Vibrant
        if (darkVibrantPopulation >= topColor) {
            this.secondaryColor = this.primaryColor
            this.primaryColor = this.darkVibrant
            topColor = darkVibrantPopulation
        }
        if (darkVibrantPopulation >= topVibrant) {
            this.primaryVibrant = this.darkVibrant
            topVibrant = darkVibrantPopulation
        }
        //Light Vibrant
        if (lightVibrantPopulation >= topColor) {
            this.secondaryColor = this.primaryColor
            this.primaryColor = this.lightVibrant
            topColor = lightVibrantPopulation
        }
        if (lightVibrantPopulation >= topVibrant) {
            this.primaryVibrant = this.lightVibrant
            topVibrant = lightVibrantPopulation
        }
        //Vibrant
        if (vibrantPopulation >= topColor) {
            this.secondaryColor = this.primaryColor
            this.primaryColor = this.vibrant
            topColor = vibrantPopulation
        }
        if (vibrantPopulation >= topVibrant) {
            this.primaryVibrant = this.vibrant
            topVibrant = vibrantPopulation
        }
    }
}

export function getPaletteFromUrl (url: string): any{
    return new Promise (function(resolve, reject) {
        request(url, function (error:any, response:any, body:any) {
            //TODO
            // console.log(error)

            const buffer = new Buffer(body)
            let vibrantRequest = new Vibrant(buffer)
            vibrantRequest.getPalette()
            .then((palette:any) => {
                let vibrant = <Vibrant.VibrantResponse>palette
                let colorPalette = new ColorPalette(vibrant)
                resolve(colorPalette)
            })
            .catch((error:Error) =>{
                reject(error)
            })
    
        });
    })
}

export function getPaletteFromBuffer (buffer:Buffer): any {
    return new Promise (function(resolve, reject) {
        let v = Vibrant.from(buffer).quality(100)
        v.getPalette()
        .then((palette:any) => {
           resolve(palette)
        })
        .catch((error:Error) =>{
            reject(error)
        })
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

declare module Vibrant {
    export interface Swatch {
        rgb: number[];
        population: number;
    }

    export interface VibrantResponse {
        Vibrant: Swatch;
        LightVibrant: Swatch;
        DarkVibrant: Swatch;
        Muted: Swatch;
        LightMuted: Swatch;
        DarkMuted: Swatch;
    }
}