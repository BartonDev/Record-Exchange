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

        let queryName = searchTrack.name.replace(" ", "%20")
        let queryArtist = searchTrack.artist.replace(" ", "%20")

        const url = `https://api.spotify.com/v1/search?q=${queryName.concat("%20", queryArtist)}&type=track`;
        const options = {
            headers: {
                Authorization: token.token
            }
        };

        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let parsedResponse = <Spotify.SearchResponse> data

            var matchedTrack:any = undefined
            var highestPercentage = 0.0

            for (let trackData of parsedResponse.tracks.items){
                let comparisonTrack = new SpotifyTrack(trackData)

                let matchResult = searchTrack.compare(comparisonTrack)
                let matchValue = matchResult.value
                let matchPercentage = matchResult.percentage

                if (matchValue == MatchValue.exactMatch){
                    
                    matchedTrack = comparisonTrack
                    break
                } else if (matchValue == MatchValue.match && matchPercentage > highestPercentage) {
                    highestPercentage = matchPercentage
                    matchedTrack = comparisonTrack
                }
            }
            if (matchedTrack != undefined) {
                resolve(matchedTrack)
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

        //TODO: certain special characters trip up the query, needs to be refined
        let queryName = encodeURI(searchTrack.name.replace(/[&]/g, ''))
        let queryArtist = encodeURI(searchTrack.artist.replace(/[&]/g, ''))
    
        const url = `https://api.music.apple.com/v1/catalog/us/search?term=${ queryName.concat("%20", queryArtist)}&limit=5&types=songs`;
        // console.log('URL', url)
        const options = {
            headers: {
                Authorization: `Bearer ${APPLE_TOKEN}`
            }
        };
    
        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let parsedResponse = <Apple.TrackSearchResponse> data

            var matchedTrack:any = undefined
            var highestPercentage = 0.0

            for (let trackData of parsedResponse.results.songs.data){
                let comparisonTrack = new AppleTrack(trackData)

                let matchResult = searchTrack.compare(comparisonTrack)
                let matchValue = matchResult.value
                let matchPercentage = matchResult.percentage
                
    
                if (matchValue == MatchValue.exactMatch){
                    matchedTrack = comparisonTrack
                    break
                } else if (matchValue == MatchValue.match && matchPercentage > highestPercentage) {
                    highestPercentage = matchPercentage
                    matchedTrack = comparisonTrack
                }
            }
            if (matchedTrack != undefined) {
                resolve(matchedTrack)
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

        let queryName = searchAlbum.name.replace(" ", "%20")
        let queryArtist = searchAlbum.artist.replace(" ", "%20")

        const url = `https://api.spotify.com/v1/search?q=${queryName.concat("%20", queryArtist)}&type=album`;
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
                let matchPercentage = matchResult.percentage
                console.log(albumPreviewData.name, "vs", comparisonAlbum.name, matchValue, matchPercentage)
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

        // var appleAlbumId:any = undefined

        //TODO: certain special characters trip up the query, needs to be refined
        let queryName = encodeURI(searchAlbum.name.replace(/[&]/g, ''))
        let queryArtist = encodeURI(searchAlbum.artist.replace(/[&]/g, ''))
    
        const url = `https://api.music.apple.com/v1/catalog/us/search?term=${ queryName.concat("%20", queryArtist)}&limit=5&types=albums`;
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
                let matchPercentage = matchResult.percentage
                // console.log(albumData)
                console.log(albumData.attributes.name, "vs", comparisonAlbum.name, matchValue, matchPercentage)
                console.log(albumData.attributes.artistName, "vs", comparisonAlbum.artist, matchValue, matchPercentage)

                console.log("searching", comparisonAlbum.name, searchAlbum.name)

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
        console.log("id", albumId)
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

// export function getAppleCatalogPlaylist (playlistId: string): any{
//     return new Promise (function(resolve, reject) {
//         console.log("myid,", playlistId)
//         const url = `https://api.music.apple.com/v1/catalog/us/playlists/pl.${playlistId}`
//         const options = {
//             headers: {
//                 Authorization: `Bearer ${APPLE_TOKEN}`
//             }
//         };

//         fetch(url, options)
//         .then( (res:any) => res.json())
//         .then( (data:any) => {
//             console.log(data)
//             let parsedResponse= <Apple.PlaylistResponse> data
//             let playlist = new ApplePlaylist(parsedResponse.data[0])
//             resolve(playlist)
//         })
//         .catch((error:Error) => {
//             console.log(error)
//             reject(error)
//         })
//     })
// }