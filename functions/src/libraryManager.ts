import {UniversalTrack, UniversalPlaylist} from "./musicObjects"

const fetch = require('cross-fetch')

//SPOTIFY

export function addPlaylistToLibrarySpotify (authCode:string, playlist: UniversalPlaylist):any{
    return new Promise (function (resolve, reject) {
        getUserIdSpotify(authCode)
        .then((userId:string) =>{
            createSpotifyPlaylist(authCode, userId, playlist)
            .then(()=>{
                resolve()
            })
        })
        .catch((error:Error) =>{
            reject(error)
        })
    })
}

function createSpotifyPlaylist (authCode: string, userId: string, playlist: UniversalPlaylist):any {
    return new Promise (function (resolve, reject) {
        const url = `https://api.spotify.com/v1/users/${userId}/playlists`

        let playlistData = {
            name: playlist.name,
            description: playlist.description,
            public: false,
        }

        const options = {
            method: 'POST',
            headers: {
                Authorization: authCode,
                "Content-Type": 'application/json',
            },
            body: JSON.stringify(playlistData)
        };

        let trackUris = tracksToUrisSpotify(playlist.tracks)

        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let playlistId = data.id
            let trackPromise = addTracksToPlaylistSpotify(authCode, playlistId, trackUris)
            let coverImagePromise = setCoverImageSpotify(authCode, playlistId, playlist.coverImage)

            Promise.all([trackPromise, coverImagePromise])
            .then( () =>{
                resolve()
            })
        })
        .catch((error:Error) => {
            reject(error)
        })

    })
}

function getUserIdSpotify (authCode: string):any {
    return new Promise (function(resolve, reject) {
        const url = "https://api.spotify.com/v1/me"

        const options = {
            method: 'GET',
            headers: {
                Authorization: authCode,
                "Content-Type": 'application/json'
            },
        };
    
        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let userId = data.id
            resolve(userId)
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

function tracksToUrisSpotify (tracks: Array<UniversalTrack>):Array<string> {
    var uris = Array<string>()
    for (let track of tracks){
        let uri = "spotify:track:".concat(track.spotifyId)
        uris.push(uri)
    }
    return uris 
}

function addTracksToPlaylistSpotify (authCode: string, playlistId: string, uris: Array<string>): any {
    console.log("playlist ID: ", playlistId)
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`

    let data = {
        uris: uris
    }

    const options = {
        method: 'POST',
        headers: {
            Authorization: authCode,
            "Content-Type": 'application/json',
        },
        body: JSON.stringify(data)
    };

    fetch(url, options)
    .then( (res:any) => res.json())
    .then( (data:any) => {
        console.log("return", data)
    })
    .catch((error:Error) => {
        console.log("error", error)
    })

}

//TODO: Actually Implement
function setCoverImageSpotify (authCode: string, playlistId: string, imageUrl: string):any {
    return new Promise (function (resolve, reject) {
        resolve ()
        // const url = `https://api.spotify.com/v1/playlists/${playlistId}/images`
        // const options = {
        //     method: 'POST',
        //     headers: {
        //         Authorization: authCode,
        //         "Content-Type": 'image/jpeg',
        //     },
        //     body: "IMAGE DATA HERE"
        // };
        
        // fetch(url, options)
        // .then((res:any)=>{
        //     console.log(res)
        // })
        // .catch((error:Error)=>{
        //     console.log(error)
        // })
    })
}

//APPLE

