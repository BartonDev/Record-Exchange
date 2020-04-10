import {Spotify, Apple} from "./apiInterfaces"
import {SpotifyToken} from "./SpotifyTokenManager"

import {Track, AppleTrack, SpotifyTrack} from "./musicObjects"
import {Album, SpotifyAlbum, AppleAlbum} from "./musicObjects"
import {ApplePlaylist, SpotifyPlaylist} from "./musicObjects"
import {MatchValue} from "./musicObjects"

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

        var printerData = Array<any>()

        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let parsedResponse = <Spotify.SearchResponse> data

            var matchedTrack:any = undefined
            var highestArtistPercentage = 0.0
            var highestNamePercentage = 0.0
            var highestAlbumPercentage = 0.0

            

            for (let trackData of parsedResponse.tracks.items){
                let comparisonTrack = new SpotifyTrack(trackData)

                let dat = {
                    "search": JSON.stringify(searchTrack),
                    "comparison": JSON.stringify(comparisonTrack)
                }
                printerData.push(dat)

                let matchResult = searchTrack.compare(comparisonTrack)
                let matchValue = matchResult.value
                let matchNamePercentage = matchResult.namePercentage
                let matchArtistPercentage = matchResult.artistPercentage
                let matchAlbumPercentage = matchResult.albumPercentage

                if (matchValue == MatchValue.exactMatch){
                    matchedTrack = comparisonTrack
                    break
                } else if (matchArtistPercentage >= highestArtistPercentage){
                    matchedTrack = comparisonTrack
                    highestArtistPercentage = matchArtistPercentage
                    if (matchArtistPercentage == 1 && matchNamePercentage >= highestNamePercentage){
                        matchedTrack = comparisonTrack
                        highestNamePercentage = matchNamePercentage
                        if (matchNamePercentage == 1 && matchAlbumPercentage >= highestAlbumPercentage){
                            matchedTrack = comparisonTrack
                            highestAlbumPercentage = matchAlbumPercentage
                        }
                    }
                }
                // else if (matchValue == MatchValue.match && matchPercentage > highestPercentage) {
                //     highestPercentage = matchPercentage
                //     matchedTrack = comparisonTrack
                // }
            }
            if (matchedTrack != undefined) {
                resolve(matchedTrack)
            } else{
                // console.log("Not Found Data: ", JSON.stringify(printerData))
                reject("TRACK NOT FOUND")
            }
        })
        .catch((error:Error) => {
            // console.log("REJE")
            reject(error)
        })
    })
}

export function searchAppleTrack(searchTrack:Track): any {
    return new Promise (function(resolve, reject) {

        //TODO: certain special characters trip up the query, needs to be refined

        let query = createQueryUri(searchTrack.name, searchTrack.artist)
        console.log("Q", query)
    
        const url = `https://api.music.apple.com/v1/catalog/us/search?term=${query}&limit=5&types=songs`;
        // console.log('URL', url)
        const options = {
            headers: {
                Authorization: `Bearer ${APPLE_TOKEN}`
            }
        };
        fetch(url, options)
        .then( (res:any) => {
            console.log("rpe", res)
            return res.json()
        })
        .then( (data:any) => {
            console.log("day", data)


            let parsedResponse = <Apple.TrackSearchResponse> data

            var matchedTrack:any = undefined
            var highestArtistPercentage = 0.0
            var highestNamePercentage = 0.0
            var highestAlbumPercentage = 0.0

            var printerData = Array<any>()
            

            for (let trackData of parsedResponse.results.songs.data){
                let comparisonTrack = new AppleTrack(trackData)


                

                let matchResult = searchTrack.compare(comparisonTrack)
                let matchValue = matchResult.value
                let matchNamePercentage = matchResult.namePercentage
                let matchArtistPercentage = matchResult.artistPercentage
                let matchAlbumPercentage = matchResult.albumPercentage

                let dat = {
                    "search": JSON.stringify(searchTrack),
                    "comparison": JSON.stringify(comparisonTrack),
                    "percentages": JSON.stringify([matchNamePercentage, matchNamePercentage, matchAlbumPercentage])
                }
                printerData.push(dat)
                

                if (matchValue == MatchValue.exactMatch){
                    matchedTrack = comparisonTrack
                    break
                } else if (matchArtistPercentage >= highestArtistPercentage){
                    matchedTrack = comparisonTrack
                    highestArtistPercentage = matchArtistPercentage
                    if (matchArtistPercentage == 1 && matchNamePercentage >= highestNamePercentage){
                        matchedTrack = comparisonTrack
                        highestNamePercentage = matchNamePercentage
                        if (matchNamePercentage == 1 && matchAlbumPercentage >= highestAlbumPercentage){
                            matchedTrack = comparisonTrack
                            highestAlbumPercentage = matchAlbumPercentage
                        }
                    }
                }
            }
            if (matchedTrack != undefined) {
                console.log("printerData; ", printerData)
                resolve(matchedTrack)
            } else{
                console.log("appleTrackNotFoundData; ", printerData)
                reject("TRACK NOT FOUND")
            }
        })
        .catch((error:Error) => {
            console.log("error", error, url)
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

            var spotifyAlbumId:any = undefined
            var highestPercentage = 0.0

            for (let albumPreviewData of parsedResponse.albums.items){
                let comparisonAlbum = new Album(albumPreviewData.name, albumPreviewData.artists[0].name)
                let matchResult = searchAlbum.compare(comparisonAlbum)
                let matchValue = matchResult.value
                let matchPercentage = matchResult.albumPercentage
                // console.log(albumPreviewData.name, "vs", comparisonAlbum.name, matchValue, matchPercentage)
                if (matchValue == MatchValue.exactMatch){
                    spotifyAlbumId = albumPreviewData.id
                    break
                } else if (matchValue == MatchValue.match && matchPercentage > highestPercentage) {
                    highestPercentage = matchPercentage
                    spotifyAlbumId = albumPreviewData.id
                }
            }

            if (spotifyAlbumId){
                getSpotifyAlbum(spotifyAlbumId, token)
                .then((spotifyAlbum:SpotifyAlbum) =>{
                    resolve(spotifyAlbum)
                })
                .catch((error:Error) =>{
                    reject(error)
                })
            }
            else {
                reject("ALBUM NOT FOUND")
            }
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

export function searchAppleAlbum (searchAlbum:Album):any{
    //https://api.music.apple.com/v1/catalog/us/search?term=james+brown&limit=2&types=artists,albums
    return new Promise (function(resolve, reject) {


        //TODO: certain special characters trip up the query, needs to be refined
        //(Possibly Fixed Now, needs testing)
        let query = createQueryUri(searchAlbum.name, searchAlbum.artist)
    
        const url = `https://api.music.apple.com/v1/catalog/us/search?term=${query}&limit=5&types=albums`;
        const options = {
            headers: {
                Authorization: `Bearer ${APPLE_TOKEN}`
            }
        };
    
        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            // resolve(data)
            let parsedResponse = <Apple.AlbumSearchResponse> data

            var appleAlbumId:any = undefined
            var highestPercentage = 0.0

            for (let albumData of parsedResponse.results.albums.data){
                
                let comparisonAlbum = new Album(albumData.attributes.name, albumData.attributes.artistName)
                let matchResult = searchAlbum.compare(comparisonAlbum)
                let matchValue = matchResult.value
                let matchPercentage = matchResult.albumPercentage

                if (matchValue == MatchValue.exactMatch){
                    appleAlbumId = albumData.id
                    break
                } else if (matchValue == MatchValue.match && matchPercentage > highestPercentage) {
                    highestPercentage = matchPercentage
                    appleAlbumId = albumData.id
                }
            }
            if (appleAlbumId) {
                getAppleAlbum(appleAlbumId)
                .then((appleAlbum:AppleAlbum) =>{
                    resolve(appleAlbum)
                })
                .catch((error:Error) =>{
                    reject(error)
                })
            }
            else {
                reject ("ALBUM NOT FOUND")
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
        // console.log("id", albumId)
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
            // console.log('parnisp', parsedData.data[0])
            let album = new AppleAlbum(parsedData.data[0])
            // console.log('album', album)
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

function createQueryUri (songName: string, artist: string){
    var songNameProcessed = songName
    if (songNameProcessed.replace(/(\(.*?\))/i, '').trim() != ''){
        songNameProcessed = songNameProcessed.replace(/(\(.*?\))/i, '').trim()
    }
    songNameProcessed = songNameProcessed.replace(/[-:&!?()]/g, '')
    songNameProcessed = songNameProcessed.replace(/remastered\ (\d+)/i, '')
    songNameProcessed = songNameProcessed.replace(/remaster\ (\d+)/i, '')
    songNameProcessed = songNameProcessed.replace(/(?<=remastered) version/i, '')
    songNameProcessed = songNameProcessed.replace(/(\d+) remastered/i, '')
    songNameProcessed = songNameProcessed.replace(/(\d+) remaster/i, '')
    songNameProcessed = songNameProcessed.replace(/(\d+) mix/i, '')
    songNameProcessed = songNameProcessed.replace(/\s+/g,' ').trim()

    var artistProcessed = artist.replace(/[-:&()]/g, '')
    artistProcessed = artistProcessed.replace(/\s+/g,' ').trim()

    console.log(artistProcessed)

    let nameString = ""
    if (songNameProcessed.length > 50){
        let nameComponents = songNameProcessed.split(" ")
        
        for (let comp of nameComponents){
            if (nameString.concat(' ', comp).length <= 50){
                if (nameString != ""){
                    nameString = nameString.concat(' ',comp)
                } else {
                    nameString = nameString.concat(comp)
                }
            } else {
                break
            }
        }

    } else {
        nameString = songNameProcessed
    }

    let queryString = nameString
    if(queryString.concat(' ', artistProcessed).length > 50){
        let artistComponents = artistProcessed.split(" ")
        
        for (let comp of artistComponents){
            console.log(comp)
            if (queryString.concat(' ', comp).length <= 50){
                queryString = queryString.concat(' ', comp)
            } else {
                break
            }
        }
    } else {
        queryString = queryString.concat(' ' , artistProcessed)
    }

    queryString = queryString.replace(/\s/g, '+')
    return queryString
}
