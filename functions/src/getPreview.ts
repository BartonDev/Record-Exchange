import {SpotifyToken, getSpotifyToken} from "./SpotifyTokenManager"
import {ServiceType, ObjectType} from "./musicEnums"

import {AppleTrack, SpotifyTrack} from "./musicObjects"
import {SpotifyAlbum, AppleAlbum} from "./musicObjects"
import {ApplePlaylist, SpotifyPlaylist} from "./musicObjects"

import {getSpotifyTrack, getAppleTrack, getSpotifyAlbum, getAppleAlbum, getSpotifyPlaylist, getApplePlaylist} from "./apiManager"

// import {getColorFromUrl} from "./colorManager"

export function getObjectPreview (serviceType: string, objectType: string, id: string):any{
    return new Promise (function (resolve, reject) {
        if (serviceType == ServiceType.spotify) {
            getSpotifyToken()
            .then((spotifyToken:SpotifyToken) =>{
                if (objectType == ObjectType.playlist){
                    getSpotifyPlaylist(id, spotifyToken)
                    .then((spotifyPlaylist:SpotifyPlaylist) =>{
                        spotifyPlaylist.updateColor()
                        .then(()=>{
                            resolve(spotifyPlaylist)
                        })
                        .catch((error:Error)=>{
                            reject()
                        })
                    })
                    .catch((error:Error) =>{
                        reject(error)
                    })
                } else if (objectType == ObjectType.album){
                    getSpotifyAlbum(id, spotifyToken)
                    .then((spotifyAlbum:SpotifyAlbum)=>{
                        spotifyAlbum.updateColor()
                        .then(()=>{
                            resolve(spotifyAlbum)
                        })
                        .catch((error:Error)=>{
                            reject()
                        })
                    })
                    .catch((error:Error) =>{
                        reject(error)
                    })
                } else if (objectType == ObjectType.track){
                    getSpotifyTrack(id, spotifyToken)
                    .then((spotifyTrack:SpotifyTrack)=>{
                        spotifyTrack.updateColor()
                        .then(()=>{
                            resolve(spotifyTrack)
                        })
                        .catch((error:Error)=>{
                            reject()
                        })
                    })
                    .catch((error:Error) =>{
                        reject(error)
                    })
                } else {
                    reject()
                }
            })
            .catch((error:Error) =>{
                reject(error)
            })
            
        } else if (serviceType == ServiceType.apple) {
            if (objectType == ObjectType.playlist){
                getApplePlaylist(id)
                .then((applePlaylist:ApplePlaylist) => {
                    applePlaylist.updateColor()
                    .then(()=>{
                        resolve(applePlaylist)
                    })
                    .catch((error:Error)=>{
                        reject()
                    })
                })
                .catch((error:Error) =>{
                    reject(error)
                })
            } else if (objectType == ObjectType.album){
                getAppleAlbum(id)
                .then((appleAlbum:AppleAlbum) => {
                    appleAlbum.updateColor()
                    .then(()=>{
                        resolve(appleAlbum)
                    })
                    .catch((error:Error)=>{
                        reject()
                    })
                })
                .catch((error:Error) =>{
                    reject(error)
                })
            } else if (objectType == ObjectType.track){
                getAppleTrack(id)
                .then((appleTrack:AppleTrack) => {
                    appleTrack.updateColor()
                    .then(()=>{
                        resolve(appleTrack)
                    })
                    .catch((error:Error)=>{
                        reject()
                    })
                })
                .catch((error:Error) =>{
                    reject(error)
                })
            } else {
                reject()
            }
        }
    })
}