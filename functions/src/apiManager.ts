import {Spotify, Apple} from "./apiInterfaces"
import {SpotifyToken} from "./SpotifyTokenManager"

import {Track, AppleTrack, SpotifyTrack} from "./musicObjects"
import {Album, SpotifyAlbum, AppleAlbum} from "./musicObjects"
import {ApplePlaylist, SpotifyPlaylist} from "./musicObjects"
import {sanitizeStringBasic, sanitizeStringComplex} from "./stringExtensions"

import {APPLE_TOKEN} from "./credentials"

const fetch = require('cross-fetch')

//SEARCHS

export function searchSpotifyTrack (searchTrack:Track, token: SpotifyToken): any{
    return new Promise (function(resolve, reject) {

        let query = createQueryUri(searchTrack.name, searchTrack.artist)

        const url = `https://api.spotify.com/v1/search?q=${query}&type=track`;
        const options = {
            headers: {
                Authorization: token.token
            }
        };

        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let parsedResponse = <Spotify.SearchResponse> data

            var bestMatch :any = undefined
            var bestMatchComparisonResult: any = undefined

            for (let trackData of parsedResponse.tracks.items){
                let comparisonTrack = new SpotifyTrack(trackData)
                let comparisonResult = searchTrack.compare(comparisonTrack)
                let comparisonValue = comparisonResult.value

                if (comparisonValue == 52) {
                    bestMatch = comparisonTrack
                    break
                } else if (bestMatch && bestMatchComparisonResult){
                    if (comparisonValue > bestMatchComparisonResult.value  && comparisonValue >= 25){
                        bestMatch = comparisonTrack
                        bestMatchComparisonResult = comparisonResult
                    }

                } else if (comparisonValue >= 25) {
                    bestMatch = comparisonTrack
                    bestMatchComparisonResult = comparisonResult
                } 

            }
            if (bestMatch != undefined) {
                resolve(bestMatch)
            } else{
                reject("TRACK NOT FOUND")
            }
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

export function searchAppleTrack(searchTrack:Track): any {
    return new Promise (function(resolve, reject) {
        
        let query = createQueryUri(searchTrack.name, searchTrack.artist)
        const url = `https://api.music.apple.com/v1/catalog/us/search?term=${query}&limit=5&types=songs`;
        const options = {
            headers: {
                Authorization: `Bearer ${APPLE_TOKEN}`
            }
        };
        fetch(url, options)
        .then( (res:any) => {
            return res.json()
        })
        .then( (data:any) => {
            let parsedResponse = <Apple.TrackSearchResponse> data
            var bestMatch :any = undefined
            var bestMatchComparisonResult: any = undefined

            for (let trackData of parsedResponse.results.songs.data){
                let comparisonTrack = new AppleTrack(trackData)
                let comparisonResult = searchTrack.compare(comparisonTrack)
                let comparisonValue = comparisonResult.value
                if (comparisonValue == 52) {
                    bestMatch = comparisonTrack
                    break
                } else if (bestMatch && bestMatchComparisonResult){
                    if (comparisonValue > bestMatchComparisonResult.value  && comparisonValue >= 25){
                        bestMatch = comparisonTrack
                        bestMatchComparisonResult = comparisonResult
                    }

                } else if (comparisonValue >= 25) {
                    bestMatch = comparisonTrack
                    bestMatchComparisonResult = comparisonResult
                } 

            }
            if (bestMatch != undefined) {
                resolve(bestMatch)
            } else{
                reject("TRACK NOT FOUND")
            }

        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

export function searchSpotifyAlbum (searchAlbum:Album, token:SpotifyToken):any {
    return new Promise (function(resolve, reject) {
        let query = createQueryUri(searchAlbum.name, searchAlbum.artist)

        const url = `https://api.spotify.com/v1/search?q=${query}&type=album`;
        const options = {
            headers: {
                Authorization: token.token
            }
        };

        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {

            let parsedResponse = <Spotify.AlbumSearchResponse>data
            var bestMatchComparisonResult: any = undefined
            var bestMatchId: any = undefined

            for (let albumPreviewData of parsedResponse.albums.items){
                let comparisonAlbum =  new Album(albumPreviewData.name, albumPreviewData.artists[0].name, albumPreviewData.images[0].url)
                let comparisonResult = searchAlbum.compare(comparisonAlbum)
                let comparisonValue = comparisonResult.value

                if (comparisonValue == 52) {
                    bestMatchId = albumPreviewData.id
                    break
                } else if (bestMatchId && bestMatchComparisonResult){
                    if (comparisonValue > bestMatchComparisonResult.value  && comparisonValue >= 25){
                        bestMatchId = albumPreviewData.id
                        bestMatchComparisonResult = comparisonResult
                    }

                } else if (comparisonValue >= 25) {
                    bestMatchId = albumPreviewData.id
                    bestMatchComparisonResult = comparisonResult
                } 
            }
            if (bestMatchId != undefined) {
                getSpotifyAlbum(bestMatchId, token)
                .then((spotifyAlbum:SpotifyAlbum) =>{
                    resolve(spotifyAlbum)
                })
                .catch((error:Error) =>{
                    reject(error)
                })
            } else{
                reject("ALBUM NOT FOUND")
            }
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

export function searchAppleAlbum (searchAlbum:Album):any{
    return new Promise (function(resolve, reject) {
        let query = createQueryUri(searchAlbum.name, searchAlbum.artist)
        const url = `https://api.music.apple.com/v1/catalog/us/search?term=${query}&limit=5&types=albums`;
        const options = {
            headers: {
                Authorization: `Bearer ${APPLE_TOKEN}`
            }
        };
    
        fetch(url, options)
        .then( (res:any) => {
            console.log("TEST21")
            console.log(res)
            return res.json()
        })
        .then( (data:any) => {
            let parsedResponse = <Apple.AlbumSearchResponse> data
            var bestMatchComparisonResult: any = undefined
            var bestMatchId: any = undefined

            for (let albumData of parsedResponse.results.albums.data){
                let comparisonAlbum =  new Album(albumData.attributes.name, albumData.attributes.artistName, albumData.attributes.artwork.url)
                let comparisonResult = searchAlbum.compare(comparisonAlbum)
                let comparisonValue = comparisonResult.value

                if (comparisonValue == 52) {
                    bestMatchId = albumData.id
                    break
                } else if (bestMatchId && bestMatchComparisonResult){
                    if (comparisonValue > bestMatchComparisonResult.value  && comparisonValue >= 25){
                        bestMatchId = albumData.id
                        bestMatchComparisonResult = comparisonResult
                    }

                } else if (comparisonValue >= 25) {
                    bestMatchId = albumData.id
                    bestMatchComparisonResult = comparisonResult
                } 

            }
            if (bestMatchId != undefined) {
                getAppleAlbum(bestMatchId)
                .then((appleAlbum:AppleAlbum) =>{
                    resolve(appleAlbum)
                })
                .catch((error:Error) =>{
                    reject(error)
                })
            } else{
                reject("ALBUM NOT FOUND")
            }
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

//GETTERS
export function getSpotifyTrack (trackId: string, token: SpotifyToken): any {
    return new Promise (function(resolve, reject) {
        const url = `https://api.spotify.com/v1/tracks/${trackId}`
        const options = {
            headers: {
                Authorization: token.token
            }
        };

        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let parsedData = <Spotify.TrackAttributes>data
            let track = new SpotifyTrack(parsedData)
            resolve(track)
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

export function getAppleTrack (trackId: string): any {
    return new Promise (function(resolve, reject) {
        const url = `https://api.music.apple.com/v1/catalog/us/songs/${trackId}`
        const options = {
            headers: {
                Authorization: `Bearer ${APPLE_TOKEN}`
            }
        };

        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let parsedResponse= <Apple.Tracks> data
            let track = new AppleTrack(parsedResponse.data[0])
            resolve(track)
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

export function getSpotifyAlbum (albumId: string, token: SpotifyToken): any {
    return new Promise (function(resolve, reject) {
        const url = `https://api.spotify.com/v1/albums/${albumId}`
        const options = {
            headers: {
                Authorization: token.token
            }
        };

        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let parsedData = <Spotify.AlbumResponse>data
            let album = new SpotifyAlbum(parsedData)
            resolve(album)
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

export function getAppleAlbum (albumId: string): any {
    return new Promise (function(resolve, reject) {
        const url = `https://api.music.apple.com/v1/catalog/us/albums/${albumId}`
        const options = {
            headers: {
                Authorization: `Bearer ${APPLE_TOKEN}`
            }
        };

        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let parsedData = <Apple.AlbumResponse> data
            let album = new AppleAlbum(parsedData.data[0])
            resolve(album)
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

export function getSpotifyPlaylist (playlistId: string, token: SpotifyToken): any {
    return new Promise (function(resolve, reject) {

        const url = `https://api.spotify.com/v1/users//playlists/${playlistId}`;
        const options = {
            headers: {
                Authorization: token.token
            }
        };

        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let parsedResponse= <Spotify.PlaylistResponse> data
            let playlist = new SpotifyPlaylist(parsedResponse)
            resolve(playlist)
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

export function getApplePlaylist (playlistId: string): any {
    return new Promise (function(resolve, reject) {

        const url = `https://api.music.apple.com/v1/catalog/us/playlists/${playlistId}`
        const options = {
            headers: {
                Authorization: `Bearer ${APPLE_TOKEN}`
            }
        };

        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let parsedResponse= <Apple.PlaylistResponse> data
            let playlist = new ApplePlaylist(parsedResponse.data[0])
            resolve(playlist)
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

function createQueryUri (name: string, artist: string){
    var nameProcessed = sanitizeStringComplex(name)
    var artistProcessed = sanitizeStringBasic(artist)

    var queryString = nameProcessed.concat(" ", artistProcessed)
    queryString = queryString.replace(/\s/g, '+')
    return queryString
}
