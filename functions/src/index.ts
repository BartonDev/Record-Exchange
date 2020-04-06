import * as functions from 'firebase-functions';

import {SpotifyToken, getSpotifyToken, getSpotifyAuthCodeUrl} from "./SpotifyTokenManager"
import {ServiceType, ObjectType} from "./musicEnums"

import {AppleTrack, SpotifyTrack, UniversalTrack} from "./musicObjects"
import {SpotifyAlbum, AppleAlbum, UniversalAlbum} from "./musicObjects"
import {ApplePlaylist, SpotifyPlaylist, UniversalPlaylist, JsonUniversalPlaylist} from "./musicObjects"

import {fetchPlaylistFirestore, fetchAlbumFirestore, fetchTrackFirestore} from "./firestoreManager"
import {storeUniversalPlaylist} from "./firestoreManager"

import {getSpotifyTrack, getAppleTrack, getSpotifyAlbum, getAppleAlbum, getSpotifyPlaylist, getApplePlaylist} from "./apiManager"

import {spotifyTrackToUniversal, spotifyAlbumToUniversal, spotifyPlaylistToUniversal} from "./convertMusic"
import {appleTrackToUniversal, appleAlbumToUniversal, applePlaylistToUniversal} from "./convertMusic"

import {addPlaylistToLibrarySpotify} from "./libraryManager"
// import { user } from 'firebase-functions/lib/providers/auth';
import { APPLE_TOKEN } from './credentials';

const fetch = require('cross-fetch')
const cors = require('cors')({origin:true});

//TODO: Unique Errors for different cases  -  (Music Not Found Error)

//Misc Functions

export const getPreview = functions.https.onRequest((req, res)=> {
    return cors(req, res, () => {
        let serviceType = req.body.serviceType
        let objectType = req.body.objectType
        let id = req.body.id 

        if (serviceType == ServiceType.spotify) {
            getSpotifyToken()
            .then((spotifyToken:SpotifyToken) =>{
                if (objectType == ObjectType.playlist){
                    getSpotifyPlaylist(id, spotifyToken)
                    .then((spotifyPlaylist:SpotifyPlaylist) =>{
                        res.status(200).send(spotifyPlaylist)
                    })
                    .catch((error:Error) =>{
                        res.status(400).send(error)
                    })
                } else if (objectType == ObjectType.album){
                    getSpotifyAlbum(id, spotifyToken)
                    .then((spotifyAlbum:SpotifyAlbum)=>{
                        res.status(200).send(spotifyAlbum)
                    })
                    .catch((error:Error) =>{
                        res.status(400).send(error)
                    })
                } else if (objectType == ObjectType.track){
                    getSpotifyTrack(id, spotifyToken)
                    .then((spotifyTrack:SpotifyTrack)=>{
                        res.status(200).send(spotifyTrack)
                    })
                    .catch((error:Error) =>{
                        res.status(400).send(error)
                    })
                } else {
                    res.status(400).send('Bad Info')
                }
            })
            .catch((error:Error) =>{
                res.status(400).send(error)
            })
            
        } else if (serviceType == ServiceType.apple) {
            if (objectType == ObjectType.playlist){
                getApplePlaylist(id)
                .then((applePlaylist:ApplePlaylist) => {
                    res.status(200).send(applePlaylist)
                })
                .catch((error:Error) =>{
                    res.status(400).send(error)
                })
            } else if (objectType == ObjectType.album){
                getAppleAlbum(id)
                .then((appleAlbum:AppleAlbum) => {
                    res.status(200).send(appleAlbum)
                })
                .catch((error:Error) =>{
                    console.log(error)
                    res.status(400).send(error)
                })
            } else if (objectType == ObjectType.track){
                getAppleTrack(id)
                .then((appleTrack:AppleTrack) => {
                    res.status(200).send(appleTrack)
                })
                .catch((error:Error) =>{
                    res.status(400).send(error)
                })
            } else {
                res.status(400).send('Bad Info')
            }
        }
    })  
});

export const convertObject = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        let serviceType = req.body.serviceType
        let objectType = req.body.objectType
        let id = req.body.id 

        getSpotifyToken()
        .then((spotifyToken:SpotifyToken) =>{
            if (serviceType == ServiceType.spotify) {
                if (objectType == ObjectType.playlist){
                    spotifyPlaylistToUniversal(id, spotifyToken)
                    .then((universalPlaylist:UniversalPlaylist) =>{
                        storeUniversalPlaylist(universalPlaylist)
                        .then( (docId:any) => {
                            universalPlaylist.id = docId
                            res.status(200).send(universalPlaylist)
                        })
                        .catch((error:Error) =>{
                            res.status(400).send(error)
                        })
                    })
                    .catch((error:Error) =>{
                        console.log("500ERROR", error)
                        res.status(500).send(error)
                    })
                } else if (objectType == ObjectType.album){
                    spotifyAlbumToUniversal(id, spotifyToken)
                    .then((universalAlbum:UniversalAlbum)=>{
                        res.status(200).send(universalAlbum)
                    })
                    .catch((error:Error)=>{
                        console.log(error)
                        res.status(400).send(error)
                    })
                } else if (objectType == ObjectType.track){
                    console.log('start')
                    spotifyTrackToUniversal(id, spotifyToken)
                    .then((universalTrack:UniversalTrack)=>{
                        console.log('ok', universalTrack)
                        res.status(200).send(universalTrack)
                    })
                    .catch((error:Error)=>{
                        console.log(error)
                        res.status(400).send(error)

                    })
                } else {
                    res.status(400).send('Bad Info')
                }  
            } else if (serviceType == ServiceType.apple) {
                if (objectType == ObjectType.playlist){
                    applePlaylistToUniversal(id, spotifyToken)
                    .then((universalPlaylist:UniversalPlaylist) =>{
                        storeUniversalPlaylist(universalPlaylist)
                        .then( (docId:any) => {
                            universalPlaylist.id = docId
                            res.status(200).send(universalPlaylist)
                        })
                        .catch((error:Error) =>{
                            res.status(400).send(error)
                        })
                    })
                    .catch((error:Error) =>{
                        res.status(400).send(error)
                    })
                } else if (objectType == ObjectType.album){
                    appleAlbumToUniversal(id, spotifyToken)
                    .then((universalAlbum:UniversalAlbum)=>{
                        res.status(200).send(universalAlbum)
                    })
                    .catch((error:Error)=>{
                        console.log(error)
                        res.status(400).send(error)
                    })
                } else if (objectType == ObjectType.track){
                    appleTrackToUniversal(id, spotifyToken)
                    .then((universalTrack:UniversalTrack)=>{
                        console.log('ok', universalTrack)
                        res.status(200).send(universalTrack)
                    })
                    .catch((error:Error)=>{
                        console.log(error)
                        res.status(400).send(error)

                    })
                } else {
                    res.status(502).send('Bad Info')
                }
            }
        })
        .catch((error:Error) =>{
            res.status(503).send(error)
        })
    })  
})

//Firestore Functions

export const fetchPlaylist = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        fetchPlaylistFirestore(req.body.id)
        .then((docData: any) =>{
            res.status(200).send(docData)
        })
        .catch((error:Error) =>{
            res.status(400).send(error)
        })
    })
})

export const fetchTrack = functions.https.onRequest((req,res) =>{
    return cors(req, res, () => {
        fetchTrackFirestore(req.body.id)
        .then((docData: any) =>{
            res.status(200).send(docData)
        })
        .catch((error:Error) =>{
            res.status(400).send(error)
        })
    })
})

export const fetchAlbum = functions.https.onRequest((req,res) =>{
    return cors(req, res, () => {
        fetchAlbumFirestore(req.body.id)
        .then((docData: any) =>{
            res.status(200).send(docData)
        })
        .catch((error:Error) =>{
            res.status(400).send(error)
        })
    })
})

//Library Functions

//Spotify
export const getSpotifyAuthUrl = functions.https.onRequest((req, res) =>{
    return cors(req, res, () => {
        let url = getSpotifyAuthCodeUrl()
        res.status(200).send(url)
    })
})

export const addPlaylistToSpotify = functions.https.onRequest((req, res) =>{
    return cors(req, res, () => {
        let authCode = req.body.authorizationCode
        let playlist = new JsonUniversalPlaylist(req.body.playlistData)
        addPlaylistToLibrarySpotify(authCode, playlist)
        .then(()=>{
            res.status(200).send()
        })
        .catch((error:Error) =>{
            res.status(400).send()
        })
        
    })
})

//Apple 

export const addPlaylistToApple = functions.https.onRequest((req, res) =>{
    return cors(req, res, () => {
        const url = 'https://api.music.apple.com/v1/me/library/playlists'
        let userToken = req.body.userToken
        console.log(userToken)
        console.log(APPLE_TOKEN)
        let data = {
            "attributes":{
               "name":"Some Playlist",
               "description":"My description"
            },
            // "relationships":{
            //    "tracks":{
            //       "data":[
            //          {
            //             "id":"900032829",
            //             "type":"songs"
            //          }
            //       ]
            //    }
            // }
        }

        const options = {
            method: 'POST',
            headers: {
                'Music-User-Token': userToken,
                Authorization: APPLE_TOKEN,
                "Content-Type": 'application/json',
            },
            body: JSON.stringify(data)
        };
    
        fetch(url, options)
        .then( (res:any) => console.log(res))
        // .then( (data:any) => {
        //     console.log("return", data)
        // })
        .catch((error:Error) => {
            console.log("error", error)
        })


    })
})
