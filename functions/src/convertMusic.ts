import {Spotify, Apple} from "./apiInterfaces"
import {SpotifyToken} from "./SpotifyTokenManager"
import {ServiceType} from "./musicEnums"

import {AppleTrack, SpotifyTrack, UniversalTrack, FirestoreUniversalTrack} from "./musicObjects"
import {SpotifyAlbum, AppleAlbum, UniversalAlbum} from "./musicObjects"
import {ApplePlaylist, SpotifyPlaylist, UniversalPlaylist} from "./musicObjects"

import {storeUniversalTrack, storeUniversalAlbum} from "./firestoreManager"
import {fetchTrackFirestore} from "./firestoreManager"

import {searchSpotifyTrack, searchAppleTrack, searchSpotifyAlbum, searchAppleAlbum} from "./apiManager"
import {getSpotifyAlbum, getAppleAlbum, getSpotifyPlaylist, getApplePlaylist} from "./apiManager"

import {APPLE_TOKEN} from "./credentials"

const fetch = require('cross-fetch')

//UNIVERSALS

export function spotifyTrackToUniversal (trackId: string, token: SpotifyToken): any {
    return new Promise (function(resolve, reject) {

        fetchTrackFirestore(trackId, ServiceType.spotify)
        .then((universalTrack: FirestoreUniversalTrack) => {
            console.log('found', universalTrack)
            resolve(universalTrack)
        })
        .catch(()=>{
            console.log('notfound')
            const url = `https://api.spotify.com/v1/tracks/${trackId}`
            const options = {
                headers: {
                    Authorization: token.token
                }
            };
        
            fetch (url, options)
            .then( (res:any) => res.json())
            .then( (data:any) => {
                let parsedData = <Spotify.TrackAttributes> data
                let spotifyTrack = new SpotifyTrack(parsedData)

                searchAppleTrack(spotifyTrack.baseTrack())
                .then((appleTrack:AppleTrack) => {
                    let universalTrack = new UniversalTrack(spotifyTrack, appleTrack)
                    storeUniversalTrack(universalTrack)
                    .then(() =>{
                        // universalTrack.id = docRef
                        resolve(universalTrack)
                    })
                    .catch((error:Error)=>{
                        console.log(error)
                    })
                    // resolve(universalTrack)
                }).catch((error:Error) =>{
                    console.log(error)
                    reject(error)
                })
            }).catch((error:Error) => {
                console.log(error)
                reject(error)
            });
        })
    })
}

export function appleTrackToUniversal (trackId: string, token: SpotifyToken):any {
    return new Promise(function(resolve, reject) {
        // const url = `https://api.music.apple.com/v1/catalog/us/songs/${trackId}`
        // const options = {
        //     headers: {
        //         Authorization: `Bearer ${APPLE_TOKEN}`
        //     }
        // };

        // fetch(url, options)
        // .then( (res:any) => res.json())
        // .then( (data:any) => {
        //     let parsedResponse = <Apple.Tracks>data
        //     let appleTrack = new AppleTrack(parsedResponse.data[0])
        //     searchSpotifyTrack(appleTrack.baseTrack(), token)
        //     .then((spotifyTrack:SpotifyTrack) =>{
        //         let universalTrack = new UniversalTrack(spotifyTrack, appleTrack)
        //         resolve(universalTrack)
        //     }).catch((error:Error) =>{
        //         reject(error)
        //     })
        // }).catch((error:Error) =>{
        //     reject(error)
        // } )
        console.log("a")
        fetchTrackFirestore(trackId, ServiceType.apple)
        .then((universalTrack: FirestoreUniversalTrack) => {
            console.log("b")
            resolve(universalTrack)
        })
        .catch(()=>{
            console.log("c")
            const url = `https://api.music.apple.com/v1/catalog/us/songs/${trackId}`
            const options = {
                headers: {
                    Authorization: `Bearer ${APPLE_TOKEN}`
                }
            };
            
            fetch (url, options)
            .then( (res:any) => res.json())
            .then( (data:any) => {
                console.log("OKEUELEEUEKE")
                let parsedResponse = <Apple.Tracks>data
                let appleTrack = new AppleTrack(parsedResponse.data[0])

                searchSpotifyTrack(appleTrack.baseTrack(), token)
                .then((spotifyTrack:SpotifyTrack) =>{
                    let universalTrack = new UniversalTrack(spotifyTrack, appleTrack)
                    storeUniversalTrack(universalTrack)
                    .then(() =>{
                        // universalTrack.id = docRef
                        resolve(universalTrack)
                    })
                    .catch((error:Error)=>{
                        console.log(error)
                    })
                }).catch((error:Error) =>{
                    reject(error)
                })
            }).catch((error:Error) => {
                console.log(error)
                reject(error)
            });
        })



    })
}

export function spotifyAlbumToUniversal (albumId: string, token: SpotifyToken):any{
    return new Promise (function(resolve, reject) {

        getSpotifyAlbum(albumId, token)
        .then((spotifyAlbum:SpotifyAlbum) =>{
            console.log("ALBUM FOUND: ", spotifyAlbum)
            searchAppleAlbum(spotifyAlbum.baseAlbum())
            .then((appleAlbum:AppleAlbum)=>{
                let universalAlbum = new UniversalAlbum(spotifyAlbum, appleAlbum)
                storeUniversalAlbum(universalAlbum)
                resolve(universalAlbum)
            })
        })
        .catch((error:Error)=>{
            reject(error)     
        })
    })
}

export function appleAlbumToUniversal (albumId: string, token: SpotifyToken):any{
    return new Promise (function(resolve, reject) {
        console.log('ok1')
        getAppleAlbum(albumId)
        .then((appleAlbum:AppleAlbum)=>{
            console.log('ok2')
            searchSpotifyAlbum(appleAlbum.baseAlbum(), token)
            .then((spotifyAlbum: SpotifyAlbum)=>{
                let universalAlbum = new UniversalAlbum(spotifyAlbum, appleAlbum)
                storeUniversalAlbum(universalAlbum)
                resolve(universalAlbum)
                
            })
        })
        .catch((error:Error)=>{
            reject(error)     
        })
    })
}

export function spotifyPlaylistToUniversal (playlistId: string, token: SpotifyToken): any {
    return new Promise (function(resolve, reject) {
        getSpotifyPlaylist(playlistId, token)
        .then((playlist: SpotifyPlaylist) =>{
            var fullfilledPromises:number = 0
            let goalPromises = playlist.tracks.length
            var universalTracks = new Array<UniversalTrack>()
            for (const [index, spotifyTrack] of playlist.tracks.entries()){
                console.log(index, spotifyTrack.name)
                
                setTimeout(function(){
                    searchAppleTrack(spotifyTrack.baseTrack())
                    .then((appleTrack:AppleTrack) => {
                        let universalTrack = new UniversalTrack(spotifyTrack, appleTrack)

                        storeUniversalTrack(universalTrack)
                        .catch((error:Error) =>{
                            console.log(error)
                        })

                        //TODO fix sorting
                        if (universalTracks.length > index){
                            universalTracks.splice(index, 0, universalTrack)
                        } else {
                            universalTracks.push(universalTrack)
                        }
                        fullfilledPromises += 1
                        if (fullfilledPromises == goalPromises){
                            let universalPlaylist = new UniversalPlaylist(playlist, universalTracks)
                            resolve(universalPlaylist)
                        }

                    })
                    .catch( (error:Error) => {
                        console.log("NOT FOUND", error)
                        fullfilledPromises += 1
                        if (fullfilledPromises == goalPromises){
                            let universalPlaylist = new UniversalPlaylist(playlist, universalTracks)
                            resolve(universalPlaylist)
                        }
                    })
                }, (100 * index));

                // fetchTrackFirestore(spotifyTrack.id, ServiceType.spotify)
                // .then((universalTrack: FirestoreUniversalTrack) => {
                //     //TODO: Fix sorting
                //     if (universalTracks.length > index){
                //         universalTracks.splice(index, 0, universalTrack)
                //     } else {
                //         universalTracks.push(universalTrack)
                //     }
                //     fullfilledPromises += 1
                //     if (fullfilledPromises == goalPromises){
                //         let universalPlaylist = new UniversalPlaylist(playlist, universalTracks)
                //         resolve(universalPlaylist)  
                //     }
                // })
                // .catch(() => {
                //     searchAppleTrack(spotifyTrack.baseTrack())
                //     .then((appleTrack:AppleTrack) => {
                //         let universalTrack = new UniversalTrack(spotifyTrack, appleTrack)
                //         storeUniversalTrack(universalTrack)
                //         .then((docRef: string) =>{
                //             //TODO: Fix sorting
                //             universalTrack.id = docRef
                //             if (universalTracks.length > index){
                //                 universalTracks.splice(index, 0, universalTrack)
                //             } else {
                //                 universalTracks.push(universalTrack)
                //             }
                //             fullfilledPromises += 1
                //             if (fullfilledPromises == goalPromises){
                //                 let universalPlaylist = new UniversalPlaylist(playlist, universalTracks)
                //                 resolve(universalPlaylist)
                //             }
                //         })
                //         .catch((error:Error) =>{
                //             console.log(error)
                //         })
                //     })
                //     .catch( (error:Error) => {
                //         fullfilledPromises += 1
                //         if (fullfilledPromises == goalPromises){
                //             let universalPlaylist = new UniversalPlaylist(playlist, universalTracks)
                //             resolve(universalPlaylist)
                //         }
                //     })
                // })
            }
        })
        .catch((error:Error) =>{
            reject(error)
        })
    })
}

export function applePlaylistToUniversal (playlistId: string, token: SpotifyToken): any {
    return new Promise (function(resolve, reject) {
        var universalTracks = new Array<UniversalTrack>()
        getApplePlaylist(playlistId)
        .then((playlist: ApplePlaylist) =>{

            var fullfilledPromises:number = 0
            let goalPromises = playlist.tracks.length

            for (let appleTrack of playlist.tracks){
                searchSpotifyTrack(appleTrack.baseTrack(), token)
                .then((spotifyTrack:SpotifyTrack) => {
                    universalTracks.push(new UniversalTrack(spotifyTrack, appleTrack))
                })
                .catch( (error:Error) => {
                })
                .then (()=>{
                    fullfilledPromises += 1
                    if (fullfilledPromises == goalPromises){
                        let universalPlaylist = new UniversalPlaylist(playlist, universalTracks)
                        resolve(universalPlaylist)
                    }
                })
                
            }
        })
        .catch((error:Error) =>{
            reject(error)
        })
    })
}