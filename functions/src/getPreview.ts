import {SpotifyToken, getSpotifyToken} from "./SpotifyTokenManager"
import {ServiceType, ObjectType} from "./musicEnums"

import {AppleTrack, SpotifyTrack} from "./musicObjects"
import {SpotifyAlbum, AppleAlbum} from "./musicObjects"
import {ApplePlaylist, SpotifyPlaylist} from "./musicObjects"

import {getSpotifyTrack, getAppleTrack, getSpotifyAlbum, getAppleAlbum, getSpotifyPlaylist, getApplePlaylist} from "./apiManager"

export function getObjectPreview (serviceType: string, objectType: string, id: string):any{
    return new Promise (function (resolve, reject) {
        if (serviceType == ServiceType.spotify) {
            getSpotifyToken()
            .then((spotifyToken:SpotifyToken) =>{
                if (objectType == ObjectType.playlist){
                    getSpotifyPlaylist(id, spotifyToken)
                    .then((spotifyPlaylist:SpotifyPlaylist) =>{
                        resolve(spotifyPlaylist)
                    })
                    .catch((error:Error) =>{
                        reject(error)
                    })
                } else if (objectType == ObjectType.album){
                    getSpotifyAlbum(id, spotifyToken)
                    .then((spotifyAlbum:SpotifyAlbum)=>{
                        resolve(spotifyAlbum)
                    })
                    .catch((error:Error) =>{
                        reject(error)
                    })
                } else if (objectType == ObjectType.track){
                    getSpotifyTrack(id, spotifyToken)
                    .then((spotifyTrack:SpotifyTrack)=>{
                        resolve(spotifyTrack)
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
                    resolve(applePlaylist)
                })
                .catch((error:Error) =>{
                    reject(error)
                })
            } else if (objectType == ObjectType.album){
                getAppleAlbum(id)
                .then((appleAlbum:AppleAlbum) => {
                    resolve(appleAlbum)
                })
                .catch((error:Error) =>{
                    reject(error)
                })
            } else if (objectType == ObjectType.track){
                getAppleTrack(id)
                .then((appleTrack:AppleTrack) => {
                    resolve(appleTrack)
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