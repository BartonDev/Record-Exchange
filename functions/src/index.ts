import * as functions from 'firebase-functions';

import {SpotifyToken, getSpotifyToken, getSpotifyAuthCodeUrl} from "./SpotifyTokenManager"
import {ServiceType, ObjectType} from "./musicEnums"

import {UniversalTrack} from "./musicObjects"
import {UniversalAlbum} from "./musicObjects"
import {UniversalPlaylist, JsonUniversalPlaylist} from "./musicObjects"

import {fetchPlaylistFirestore, fetchAlbumFirestore, fetchTrackFirestore} from "./firestoreManager"
import {storeUniversalPlaylist} from "./firestoreManager"

import {spotifyTrackToUniversal, spotifyAlbumToUniversal, spotifyPlaylistToUniversal} from "./convertMusic"
import {appleTrackToUniversal, appleAlbumToUniversal, applePlaylistToUniversal} from "./convertMusic"

import {getObjectPreview} from "./getPreview"

import {addPlaylistToLibrarySpotify, addPlaylistToLibraryApple} from "./libraryManager"
// import {getColorFromUrl} from "./colorManager"

// import { app } from 'firebase-admin';
// import { user } from 'firebase-functions/lib/providers/auth';

// const fetch = require('cross-fetch')
const cors = require('cors')({origin:true});

// const axios = require('axios')


//TODO: Unique Errors for different cases  -  (Music Not Found Error)

//Misc Functions


export const getPreview = functions.https.onRequest((req, res)=> {
    return cors(req, res, () => {
        console.log(req)
        let serviceType = req.body.serviceType
        let objectType = req.body.objectType
        let id = req.body.id 
        getObjectPreview(serviceType, objectType, id)
        .then((object:any)=>{
            res.status(200).send(object)
        })
        .catch((error:Error)=>{
            res.status(400).send(error)
        })
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
                        console.log(error)
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
                    spotifyTrackToUniversal(id, spotifyToken)
                    .then((universalTrack:UniversalTrack)=>{
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
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000/');
    res.set('Access-Control-Allow-Credentials', 'true');

    return cors(req, res, () => {
        let authCode = req.body.authorizationCode
        let playlist = new JsonUniversalPlaylist(req.body.playlistData)
        addPlaylistToLibrarySpotify(authCode, playlist)
        .then(()=>{
            res.status(200).send()
        })
        .catch((error:Error) =>{
            console.log(error)
            res.status(400).send(error)
        })
    })
})

//Apple 

export const addPlaylistToApple = functions.https.onRequest((req, res) =>{
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
      // Send response to OPTIONS requests
      console.log("AHAHAHAHAHAHHHAHAHAHH")
      res.set('Access-Control-Allow-Methods', 'GET');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
      res.status(204).send('');
      
    } else {
        console.log("whatver")
        return cors(req, res, () => {
       
    
            let userToken = req.body.userToken
            console.log("Q, req", JSON.stringify(req.body.playlistData))
            let playlist = new JsonUniversalPlaylist(JSON.stringify(req.body.playlistData))
    
            addPlaylistToLibraryApple(playlist, userToken)
            .then(()=>{
                res.status(200).send()
            })
            .catch((error:Error) =>{
                console.log(error)
                res.status(400).send(error)
            })
        })
    }

   
})

exports.getPreviewIOS = functions.https.onCall((data, context) => {
    let serviceType = data.serviceType
    let objectType = data.objectType
    let id = data.id 
    return new Promise(function(resolve, reject){
        getObjectPreview(serviceType, objectType, id)
        .then((object:any)=>{
            resolve(JSON.stringify(object))
        })
        .catch((error:Error)=>{
            reject(error)
        })
    })
});

// export const test = functions.https.onRequest((req, res) =>{
//     getColorFromUrl('https://i.scdn.co/image/ab67616d0000b273661d019f34569f79eae9e985')
//     .then((res:any)=>{
//         res.send(res)
//     })
//     .catch((error:Error) =>{   
//         res.send(error)
//     })
// })
