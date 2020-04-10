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

        console.log(serviceType, objectType, id)
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
                        console.log(error)
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
                    console.log(error)
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
                res.status(400).send('BAD INFO')
            }
        }
    })  
});

export const convertObject = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        let serviceType = req.body.serviceType
        let objectType = req.body.objectType
        let id = req.body.id 

        console.log(serviceType, objectType)

        getSpotifyToken()
        .then((spotifyToken:SpotifyToken) =>{
            if (serviceType == ServiceType.spotify) {
                if (objectType == ObjectType.playlist){
                    spotifyPlaylistToUniversal(id, spotifyToken)
                    .then((universalPlaylist:UniversalPlaylist) =>{
                        // console.log("sofarsogood.jpeg")
                        storeUniversalPlaylist(universalPlaylist)
                        .then( (docId:any) => {
                            universalPlaylist.id = docId
                            res.status(200).send(universalPlaylist)
                        })
                        .catch((error:Error) =>{
                            // console.log(error)
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
                    console.log("WHAT")
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

//Something is wrong here with cors, come back to it
export const test = functions.https.onRequest((req, res) =>{
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
    return cors(req, res, () => {
        const url = 'https://api.music.apple.com/v1/me/library/playlists'
        let userToken = req.body.userToken
        // console.log()
        console.log(userToken)
        console.log(APPLE_TOKEN)
        let playlistData = req.body.playlistData
        console.log(playlistData)
        var trackDataArray  = Array<any>()
        for (let track of playlistData.tracks){
            let trackData = {
                "id": track.appleId,
                "type":"songs"
            }
            trackDataArray.push(trackData)
        }
        console.log(trackDataArray)
        let data = {
            "attributes":{
               "name":playlistData.name,
               "description":playlistData.description
            },
            "relationships":{
               "tracks":{
                  "data": trackDataArray
               }
            }
        }
        console.log("da", data)

        const options = {
            method: 'POST',
            headers: {
                'Music-User-Token': userToken,
                Authorization: `Bearer ${APPLE_TOKEN}`,
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

export const test1345 = functions.https.onRequest((req, res) =>{
    let songName = "(Blue He!n Geology? Version)"
    let artist = "Me  YOU"


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
    if (songNameProcessed.length > 40){
        let nameComponents = songNameProcessed.split(" ")
        
        for (let comp of nameComponents){
            if (nameString.concat(' ', comp).length <= 40){
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
    if(queryString.concat(' ', artistProcessed).length > 40){
        let artistComponents = artistProcessed.split(" ")
        
        for (let comp of artistComponents){
            console.log(comp)
            if (queryString.concat(' ', comp).length <= 40){
                queryString = queryString.concat(' ', comp)
            } else {
                break
            }
        }
    } else {
        queryString = queryString.concat(' ' , artistProcessed)
    }

    queryString = queryString.replace(/\s/g, '+')
    res.send( queryString)
})

export const test5463 = functions.https.onRequest((req, res) =>{
    // let query = 
    // let queryName = searchTrack.name.replace(" ", "%20")
    // let queryArtist = searchTrack.artist.replace(" ", "%20")
    let a = 'The Ballad of Peter 205 Remaster Potoato aas'
    let b = createQueryUri(a, "XTC")
    res.send(b)
    // let query = a.split(' ').join('+')
    // console.log(query)
    // let enc =  encodeURI(query)
    // // console.log(enc)
    // const url = `https://api.music.apple.com/v1/catalog/us/search?term=${enc}&limit=5&types=songs`;
    // console.log('URL', url)
    // const options = {
    //     headers: {
    //         limit: 5,
    //         types: "songs",
    //         search_term: "your graduation",
    //         Authorization: `Bearer ${APPLE_TOKEN}`
    //     }
    // };
    // fetch(url, options)
    // .then( (res:any) => {
    //     return res.json()
    // })
    // .then( (data:any) => {
    //     res.send(data)
    // })
    // .catch((error:Error)=>{
    //     res.send(error)
    // })
})


function createQueryUri (songName: string, artist: string){
    var songNameProcessed = songName.replace(/[-:&()]/g, '')
    songNameProcessed = songNameProcessed.replace(/remastered\ (\d+)/i, '')
    songNameProcessed = songNameProcessed.replace(/remaster\ (\d+)/i, '')
    songNameProcessed = songNameProcessed.replace(/(\d+) remastered/i, '')
    songNameProcessed = songNameProcessed.replace(/(\d+) remaster/i, '')

    var artistProcessed = artist.replace(/[-:&()]/g, '')
    artistProcessed = artistProcessed.replace(/remastered\ (\d+)/i, '')
    artistProcessed = artistProcessed.replace(/remaster\ (\d+)/i, '')
    artistProcessed = artistProcessed.replace(/(\d+) remastered/i, '')
    artistProcessed = artistProcessed.replace(/(\d+) remaster/i, '')

    console.log(artistProcessed)

    let nameString = ""
    if (songNameProcessed.length > 30){
        let nameComponents = songNameProcessed.split(" ")
        
        for (let comp of nameComponents){
            if (nameString.concat(comp).length <= 29){
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
    if(queryString.concat(artistProcessed).length > 30){
        let artistComponents = artistProcessed.split(" ")
        
        for (let comp of artistComponents){
            console.log(comp)
            if (queryString.concat(comp).length <= 29){
                queryString = queryString.concat(' ', comp)
            } else {
                break
            }
        }
    } else {
        console.log("coolio")
        queryString = queryString.concat(artistProcessed)
    }

    queryString = queryString.replace(/\s/g, '+')
    return queryString
}

