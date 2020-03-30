import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { IdHash } from "./idHash"

const fetch = require('cross-fetch')
const cors = require('cors')({origin:true});

const APPLETOKEN = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IldWN1IyNEdVNkgifQ.eyJpYXQiOjE1Nzc2NTAwNzMsImV4cCI6MTU5MzIwMjA3MywiaXNzIjoiWk04UlZMRTQ5ViJ9.4P1-_Nqiy3huaTW9saNzrV5cGx41rbXvsuXSjwZ_h4WjqAomobIHNsrO0BtQjtxD3fsKP9eTPHjTc7_vypBVwA'

//TODO: Unique Errors for different cases
//(Music Not Found Error)


//ENUMS

enum MatchValue {match, nonMatch, exactMatch }
enum ServiceType {
    spotify = 'spotify', 
    apple = 'apple'
}
enum ObjectType {
    track = 'track', 
    album = 'album', 
    playlist = 'playlist'
}

//CLASSES

class SpotifyToken {
    token: string

    constructor (data:Spotify.TokenResponse){
        this.token = data.token_type + " " + data.access_token
    }
}

class ParsedUrl {
    serviceType: ServiceType
    objectType: ObjectType
    id: string
    
    constructor(serviceType:ServiceType, objectType:ObjectType, id:string){
        this.serviceType = serviceType
        this.objectType = objectType
        this.id = id
    }
}

class Track {
    name: string
    artist: string
    album: string 
    coverImage: string;

    constructor(name: string, artist: string, album: string, coverImage: string){
        this.name = name
        this.artist = artist
        this.album = album
        this.coverImage = coverImage
    }

    compare (comparisonTrack: Track): MatchValue {
        if (this.name.toLowerCase() == comparisonTrack.name.toLowerCase() && this.artist.toLowerCase() == comparisonTrack.artist.toLowerCase()) {
            if (this.album.toLowerCase() == comparisonTrack.album.toLowerCase()) {
                return MatchValue.exactMatch
            }
            return MatchValue.match
        }
        return MatchValue.nonMatch
    }

    baseTrack():Track {
        return this
    }
}

class AppleTrack extends Track{
    id: string;
    genres: Array<string>;

    constructor(data: Apple.TrackData){
        let name = data.attributes.name
        let artist = data.attributes.artistName
        let album = data.attributes.albumName
        let rawCoverImage = data.attributes.artwork.url
        let coverImage = rawCoverImage.replace('{w}x{h}', '640x640')
        super(name, artist, album, coverImage)

        this.id = data.id
        this.genres = data.attributes.genreNames
    }
}

class SpotifyTrack extends Track {
    id: string;

    constructor(data: Spotify.TrackAttributes){
        let name = data.name
        let artist = data.artists[0].name
        let album = data.album.name
        let coverImage = data.album.images[0].url
        super(name, artist, album, coverImage)

        this.id = data.id
    }
}

class SpotifyAlbumTrack extends Track implements SpotifyTrack {
    id: string;

    constructor(data: Spotify.AlbumTrack, albumName: string, albumCover: string){
        let name = data.name
        let artist = data.artists[0].name
        let album = albumName
        let coverImage = albumCover
        super(name, artist, album, coverImage)

        this.id = data.id
    }
}

class UniversalTrack extends Track {
    id: string;
    spotifyId: string;
    appleId: string;
    // coverImage: string;
    genres: string[];

    constructor(spotifyTrack: SpotifyTrack, appleTrack: AppleTrack){
        let name = spotifyTrack.name
        let artist = spotifyTrack.artist
        let album = spotifyTrack.album
        let coverImage = spotifyTrack.coverImage
        super(name, artist, album, coverImage)

        this.spotifyId = spotifyTrack.id
        

        this.appleId = appleTrack.id
        this.genres = appleTrack.genres

        this.id = ''
    }

    toFirestoreData(): any{
        return ({
            spotifyId: this.spotifyId,
            appleId: this.appleId,
            name: this.name,
            artist: this.artist,
            album: this.album,
            coverImage: this.coverImage,
            genres: this.genres
        })
    }
}

class FirestoreUniversalTrack extends Track implements UniversalTrack {
    id: string;
    spotifyId: string;
    appleId: string;
    // coverImage: string;
    genres: string[];

    constructor(firestoreData: Firestore.FirestoreTrackData, firestoreId: string){
        let name = firestoreData.name
        let artist = firestoreData.artist
        let album = firestoreData.album
        let coverImage = firestoreData.coverImage

        super(name, artist, album, coverImage)

        this.spotifyId = firestoreData.spotifyId
        this.appleId = firestoreData.appleId
        this.id = firestoreId

        if (firestoreData.genres != undefined){
            this.genres = firestoreData.genres
        } else {
            this.genres = Array<string>()
        }
    }

    toFirestoreData():any{
        return ({
            spotifyId: this.spotifyId,
            appleId: this.appleId,
            name: this.name,
            artist: this.artist,
            album: this.album,
            coverImage: this.coverImage,
            genres: this.genres
        })
    }
}

class Album {
    name: string
    artist: string
    
    constructor(name: string, artist: string){
        this.name = name
        this.artist = artist
    }

    //TODO: improve album comparison, possibly involving track count or release date
    compare (comparisonAlbum: Album): MatchValue {
        if (this.name.toLowerCase() == comparisonAlbum.name.toLowerCase() && this.artist.toLowerCase() == comparisonAlbum.artist.toLowerCase()) {
            return MatchValue.exactMatch
        }
        return MatchValue.nonMatch
    }

    baseAlbum():Album {
        return this
    }
}

//TODO: Clean up artists
class SpotifyAlbum extends Album{
    id: string
    coverImage: string
    // name: string
    // artist: string
    genres: Array<any>
    tracks: Array<SpotifyTrack>

    constructor (data: Spotify.AlbumResponse){
        let artists = new Array<string>()
        for (let artist of data.artists){
            artists.push(artist.name)
        }
        let name = data.name
        let artist = artists[0]
        super(name, artist)

        // this.artist = artists[0]
        this.id = data.id
        this.coverImage = data.images[0].url
        this.genres = data.genres

        let tracks = new Array<SpotifyTrack>()
        for (let trackData of data.tracks.items) {
            let track = new SpotifyAlbumTrack(trackData, this.name, this.coverImage)
            tracks.push(track)
        }
        this.tracks = tracks
    }
}

class AppleAlbum extends Album{
    id: string
    coverImage: string
    // name: string
    // artist: string
    genres: Array<string>
    tracks: Array<AppleTrack>

    constructor (data: Apple.AlbumData){
        let name = data.attributes.name
        let artist = data.attributes.artistName
        super(name, artist)

        this.id = data.id
        let rawCoverImage = data.attributes.artwork.url
        this.coverImage = rawCoverImage.replace('{w}x{h}', '640x640')
        let tracks = new Array<AppleTrack>()
        for (let trackData of data.relationships.tracks.data) {
            let track = new AppleTrack(trackData)
            tracks.push(track)
        }
        this.tracks = tracks
        this.genres = data.attributes.genreNames
    }
}

class UniversalAlbum extends Album {
    id: string
    spotifyId: string
    appleId: string
    // name: string
    coverImage: string
    // artist: string
    genres: Array<string>
    tracks: Array<UniversalTrack>

    constructor(spotifyAlbum:SpotifyAlbum, appleAlbum:AppleAlbum){
        let name = spotifyAlbum.name
        let artist = appleAlbum.artist
        super(name, artist)

        this.spotifyId = spotifyAlbum.id,
        this.appleId = appleAlbum.id
        this.coverImage = spotifyAlbum.coverImage
        this.genres = appleAlbum.genres

        this.id = ''

        //TODO: probably a cleaner way to do this
        let spotifyTracks = spotifyAlbum.tracks
        let appleTracks = appleAlbum.tracks
        let universalTracks = Array<UniversalTrack>()
        for (let spotifyTrack of spotifyTracks){
            for (let appleTrack of appleTracks){
                if (spotifyTrack.name.toLowerCase() == appleTrack.name.toLowerCase()){
                    let universalTrack = new UniversalTrack(spotifyTrack, appleTrack)
                    universalTracks.push(universalTrack)
                    break
                }
            }
        }
        this.tracks = universalTracks
    }

    toFirestoreData(): any{
        let firestoreTracks = Array<any>()
        for (let track of this.tracks){
            let trackData = {
                id: track.id,
                name: track.name,
                artist: track.artist,
                album: track.album,
                coverImage: track.coverImage,
                spotifyId: track.spotifyId,
                appleId: track.appleId
            }
            firestoreTracks.push(trackData)
        }

        return ({
            spotifyId: this.spotifyId,
            appleId: this.appleId,
            name: this.name,
            artist: this.artist,
            coverImage: this.coverImage,
            genres: this.genres,
            tracks: firestoreTracks
           
        })
    }
}

/*
class FirestoreUniversalAlbum extends Album implements UniversalAlbum {
    id: string
    spotifyId: string
    appleId: string
    // name: string
    coverImage: string
    // artist: string
    genres: Array<string>
    tracks: Array<UniversalTrack>

    constructor(data: Firestore.FirestoreAlbumData, firestoreId: string){
        let name = data.name
        let artist = data.artist
        super(name, artist)

        this.spotifyId = data.spotifyId
        this.appleId = data.appleId
        this.coverImage = data.coverImage
        this.genres = data.genres

        this.id = firestoreId

        //TODO: probably a cleaner way to do this
        let tracksData = data.tracks
        for (let trackData of data.tracks){

        }
        // let appleTracks = appleAlbum.tracks
        let universalTracks = Array<UniversalTrack>()
        // for (let spotifyTrack of spotifyTracks){
        //     for (let appleTrack of appleTracks){
        //         if (spotifyTrack.name.toLowerCase() == appleTrack.name.toLowerCase()){
        //             let universalTrack = new UniversalTrack(spotifyTrack, appleTrack)
        //             universalTracks.push(universalTrack)
        //             break
        //         }
        //     }
        // }
        this.tracks = universalTracks
    }

    toFirestoreData(): any{
        let firestoreTracks = Array<any>()
        for (let track of this.tracks){
            let trackData = {
                id: track.id,
                name: track.name,
                artist: track.artist,
                album: track.album,
                coverImage: track.coverImage,
            }
            firestoreTracks.push(trackData)
        }

        return ({
            spotifyId: this.spotifyId,
            appleId: this.appleId,
            name: this.name,
            artist: this.artist,
            coverImage: this.coverImage,
            genres: this.genres,
            tracks: firestoreTracks
           
        })
    }
}*/

class Playlist {
    name: string
    description: string
    coverImage: string

    constructor (name: string, description: string, coverImage: string){
        this.name = name
        this.description = description
        this.coverImage = coverImage
    }
}

class ApplePlaylist extends Playlist{
    id: string;
    tracks: Array<AppleTrack>;

    constructor (data:Apple.PlaylistData){
        let name = data.attributes.name
        let description = data.attributes.description.standard
        let rawCoverImage = data.attributes.artwork.url
        let coverImage = rawCoverImage.replace('{w}x{h}', '640x640')
        super(name, description, coverImage)

        this.id = data.id
        this.tracks = new Array<AppleTrack>()

        let trackDataArray = data.relationships.tracks.data
        for (let trackData of trackDataArray){
            this.tracks.push(new AppleTrack(trackData))
        }
    }
}

class SpotifyPlaylist extends Playlist{
    id: string;
    tracks: Array<SpotifyTrack>;

    constructor(data: Spotify.PlaylistResponse){
        let name = data.name
        let description = data.description
        let coverImage = data.images[0].url
        super(name, description, coverImage)

        this.id = data.id
        this.tracks = new Array<SpotifyTrack>()

        let trackDataArray = data.tracks.items
        for (let trackData of trackDataArray){
            this.tracks.push(new SpotifyTrack(trackData.track))
        }
    }
}

class UniversalPlaylist extends Playlist{
    id: string;
    tracks: Array<UniversalTrack>;

    constructor(playlistDetails: Playlist, tracks:Array<UniversalTrack>){
        let name = playlistDetails.name
        let description = playlistDetails.description
        let coverImage = playlistDetails.coverImage
        super(name, description, coverImage)

        this.id = ''
        this.tracks = tracks
    }

    toFirestoreData(): any{

        var firestoreTracks = Array<any>()
        for (let track of this.tracks){
            let trackData = {
                id: track.id,
                name: track.name,
                artist: track.artist,
                album: track.album,
                coverImage: track.coverImage,
                spotifyId: track.spotifyId,
                appleId: track.appleId,
            }
            firestoreTracks.push(trackData)
        }

        return ({
            
            name: this.name,
            description: this.description,
            coverImage: this.coverImage,
            tracks: firestoreTracks
        })
    }
}

// export const processUrl = functions.https.onRequest((req, res)=> {
//     return cors(req, res, () => {
//         parseUrl(req.body.url)
//         .then((parsedUrl: ParsedUrl) => {
//             if (parsedUrl.objectType == ObjectType.track &&  parsedUrl.serviceType == ServiceType.spotify){

//             }
//             else if (parsedUrl.objectType == ObjectType.track &&  parsedUrl.serviceType == ServiceType.apple){

//             }
//             else if (parsedUrl.objectType == ObjectType.album &&  parsedUrl.serviceType == ServiceType.spotify){

//             }
//             else if (parsedUrl.objectType == ObjectType.album &&  parsedUrl.serviceType == ServiceType.apple){

//             }
//             else if (parsedUrl.objectType == ObjectType.playlist &&  parsedUrl.serviceType == ServiceType.spotify){
//                 getSpotifyToken()
//                 .then((spotifyToken:SpotifyToken) =>{
//                     getSpotifyPlaylist(parsedUrl.id, spotifyToken)
//                     .then((spotifyPlaylist:SpotifyPlaylist) =>{
//                         let responseData = {
//                             name: spotifyPlaylist.name,
//                             description: spotifyPlaylist.description,
//                             coverImage: spotifyPlaylist.coverImage
//                         }
//                         res.send(responseData)
//                     })
//                 }) 
//             }
//             else if (parsedUrl.objectType == ObjectType.playlist &&  parsedUrl.serviceType == ServiceType.apple){

//             }
//             else {

//             }
//         })
//     })   
// });

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
        fetchTrackFirestore(req.body.id)
        .then((docData: any) =>{
            res.status(200).send(docData)
        })
        .catch((error:Error) =>{
            res.status(400).send(error)
        })
    })
})

export const test = functions.https.onRequest((request, response) => {
    const url = 'https://music.apple.com/us/album/me-my-dog/1438946531?i=1438946537'
    // const url = 'https://open.spotify.com/album/3wRBlpk5PRoixwOnLujTal?si=aQAL9xwmQAmDY_gL0lKoEg'
    // const url = 'https://open.spotify.com/album/28fJkC8VzTy7IXxTriq8fd?si=rZ99_h9XRTaG3SWtsyMOhQ'

    // const url = 'https://open.spotify.com/track/03hUwBvGTrQpHpvE4pO2oq?si=Ss8GSZH-QQ6Boafmd2B-PA'

    // const url = 'https://music.apple.com/us/playlist/test/pl.u-xlyNEdNCXV9zk5'
    // const url = 'https://open.spotify.com/playlist/053IhHPaTtzkmmSUovoZj3?si=yTRju2YcQC2ljC_N86auag'

    let parsePromise = parseUrl(url)
    let spotifyTokenPromise = getSpotifyToken()
    Promise.all([parsePromise, spotifyTokenPromise])
    .then( values => {
        let parsedUrl = <ParsedUrl>values[0]
        let spotifyToken = <SpotifyToken>values[1]
        if (parsedUrl.serviceType == ServiceType.spotify){
            if (parsedUrl.objectType == ObjectType.track){
                spotifyTrackToUniversal(parsedUrl.id, spotifyToken)
                .then((result:any) => {
                    response.send(result)
                }).catch ((error:Error) => {
                    response.send(error)
                })
            } else if (parsedUrl.objectType == ObjectType.album){
                spotifyAlbumToUniversal(parsedUrl.id, spotifyToken)
                .then((result:any) =>{
                    response.send(result)
                }).catch((error:Error)=>{
                    response.send(error)
                })
            } else if (parsedUrl.objectType == ObjectType.playlist){
                spotifyPlaylistToUniversal(parsedUrl.id, spotifyToken)
                .then((universalPlaylist:UniversalPlaylist) => {
                    response.send(universalPlaylist)
                }).catch ((error:Error) => {
                    response.send(error)
                })
            }
        } else if (parsedUrl.serviceType == ServiceType.apple){
            if (parsedUrl.objectType == ObjectType.track){
                console.log(parsedUrl.id)
                appleTrackToUniversal(parsedUrl.id, spotifyToken)
                .then((data:any) =>{
                    response.send(data)
                }).catch((error:Error) => {
                    response.send(error)
                })
            } else if (parsedUrl.objectType == ObjectType.album){
                //
            } else if (parsedUrl.objectType == ObjectType.playlist){
                applePlaylistToUniversal(parsedUrl.id, spotifyToken)
                .then((universalPlaylist:UniversalPlaylist) => {
                    response.send(universalPlaylist)
                }).catch ((error:Error) => {
                    response.send(error)
                })
            }
        }
    })
    .catch((error:Error) => {
       
    })
});

function parseUrl (url: string): any {
    //TODO: rework with REGEX, currently not handling edge cases
    return new Promise (function (resolve, reject) {
        if (url.search('open.spotify.com') != -1){
            if (url.search('track/') != -1 ){
                let startIndex = url.search('track/') + 6
                let endIndex = startIndex + 22
                let id = url.substring(startIndex, endIndex)
                let parsedUrl = new ParsedUrl(ServiceType.spotify, ObjectType.track, id)
                resolve(parsedUrl)
            } else if (url.search('album/') != -1 ){
                let startIndex = url.search('album/') + 6
                let endIndex = startIndex + 22
                let id = url.substring(startIndex, endIndex)
                let parsedUrl = new ParsedUrl(ServiceType.spotify, ObjectType.album, id)
                resolve(parsedUrl)
            } else if (url.search('playlist/') != -1 ){
                let startIndex = url.search('playlist/') + 9
                let endIndex = startIndex + 22
                let id = url.substring(startIndex, endIndex)
                let parsedUrl = new ParsedUrl(ServiceType.spotify, ObjectType.playlist, id)
                resolve(parsedUrl)
            }
        } else if (url.search('music.apple.com') != -1){
            if (url.search('album/') != -1){
                if (url.search('i=') != -1){
                    let startIndex = url.search('i=') + 2
                    let endIndex = startIndex + 10
                    let id = url.substring(startIndex, endIndex)
                    let parsedUrl = new ParsedUrl(ServiceType.apple, ObjectType.track, id)
                    resolve(parsedUrl)
                } else {
                    let startIndex = url.search('album/')
                    let endIndex = startIndex + 10
                    let id = url.substring(startIndex, endIndex)
                    let parsedUrl = new ParsedUrl(ServiceType.apple, ObjectType.album, id)
                    resolve(parsedUrl)
                }                
            } else if (url.search('playlist/') != -1){
                let startIndex = url.search('pl.u-')
                let endIndex = startIndex + 19
                let id = url.substring(startIndex, endIndex)
                let parsedUrl = new ParsedUrl(ServiceType.apple, ObjectType.playlist, id)
                resolve(parsedUrl)
            }
        }
        reject()
    })
}

//SEARCHS

function searchSpotifyTrack (searchTrack:Track, token: SpotifyToken): any{
    return new Promise (function(resolve, reject) {
        var matchedTrack:any = undefined

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
            for (let trackData of parsedResponse.tracks.items){
                let comparisonTrack = new SpotifyTrack(trackData)
                let matchValue = searchTrack.compare(comparisonTrack)

                if (matchValue == MatchValue.exactMatch){
                    // matchedTrack = comparisonTrack
                    break
                }else if (matchValue == MatchValue.match) {
                    matchedTrack = comparisonTrack
                }
            }
            if (matchedTrack != undefined) {
                resolve(matchedTrack)
            } else{
                reject(Error())
            }
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

function searchAppleTrack(searchTrack:Track): any {
    return new Promise (function(resolve, reject) {

        var matchedTrack:any = undefined

        //TODO: certain special characters trip up the query, needs to be refined
        let queryName = encodeURI(searchTrack.name.replace(/[&]/g, ''))
        let queryArtist = encodeURI(searchTrack.artist.replace(/[&]/g, ''))
    
        const url = `https://api.music.apple.com/v1/catalog/us/search?term=${ queryName.concat("%20", queryArtist)}&limit=5&types=songs`;
        console.log('URL', url)
        const options = {
            headers: {
                Authorization: `Bearer ${APPLETOKEN}`
            }
        };
    
        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let parsedResponse = <Apple.TrackSearchResponse> data

            for (let trackData of parsedResponse.results.songs.data){
                let comparisonTrack = new AppleTrack(trackData)
                console.log(searchTrack.name, comparisonTrack.name)
                console.log(searchTrack.artist, comparisonTrack.artist)
                let matchValue = searchTrack.compare(comparisonTrack)
    
                if (matchValue == MatchValue.exactMatch){
                    matchedTrack = comparisonTrack
                    break
                }else if (matchValue == MatchValue.match) {
                    matchedTrack = comparisonTrack
                }
            }
            if (matchedTrack != undefined) {
                resolve(matchedTrack)
            } else{
                reject(Error())
            }
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

function searchSpotifyAlbum (searchAlbum:Album, token:SpotifyToken):any {
    return new Promise (function(resolve, reject) {

        var spotifyAlbumId:any = undefined

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
            // let albums = parsedResponse.albums.items
            for (let albumPreviewData of parsedResponse.albums.items){
                let comparisonAlbum = new Album(albumPreviewData.name, albumPreviewData.artists[0].name)
                let matchValue = searchAlbum.compare(comparisonAlbum)

                if (matchValue == MatchValue.exactMatch){
                    spotifyAlbumId = albumPreviewData.id
                    break
                }
            }
            
            getSpotifyAlbum(spotifyAlbumId, token)
            .then((spotifyAlbum:SpotifyAlbum) =>{
                console.log('ablum', spotifyAlbum)
                resolve(spotifyAlbum)
            })
            .catch((error:Error) =>{
                reject(error)
            })

            // resolve(data)
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

function searchAppleAlbum (searchAlbum:Album):any{
    //https://api.music.apple.com/v1/catalog/us/search?term=james+brown&limit=2&types=artists,albums
    return new Promise (function(resolve, reject) {

        var appleAlbumId:any = undefined

        //TODO: certain special characters trip up the query, needs to be refined
        let queryName = encodeURI(searchAlbum.name.replace(/[&]/g, ''))
        let queryArtist = encodeURI(searchAlbum.artist.replace(/[&]/g, ''))
    
        const url = `https://api.music.apple.com/v1/catalog/us/search?term=${ queryName.concat("%20", queryArtist)}&limit=5&types=albums`;
        console.log('URL', url)
        const options = {
            headers: {
                Authorization: `Bearer ${APPLETOKEN}`
            }
        };
    
        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            // resolve(data)
            let parsedResponse = <Apple.AlbumSearchResponse> data

            for (let albumData of parsedResponse.results.albums.data){
                let comparisonAlbum = new Album(albumData.attributes.name, albumData.attributes.artistName)
                let matchValue = searchAlbum.compare(comparisonAlbum)

                if (matchValue == MatchValue.exactMatch){
                    appleAlbumId = albumData.id
                    break
                }
            }

            getAppleAlbum(appleAlbumId)
            .then((appleAlbum:AppleAlbum) =>{
                console.log('ablum2', appleAlbum)
                resolve(appleAlbum)
            })
            .catch((error:Error) =>{
                reject(error)
            })

        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

//GETTERS

export const TEST2 = functions.https.onRequest((req, res) => {
    let example = new Album('Talon of the Hawk', 'The Front Bottoms')
    searchAppleAlbum(example)
    .then((data:any) =>{
        console.log("end", data)
        res.send(data)
    })
    .catch((error:Error)=>{
        res.send(error)
    })

})

export const TEST3 = functions.https.onRequest((req, res) => {

    //spotify:album:1v7hBIWUmfhggbxYd9HIW7
    let example = new Album('Talon of the Hawk', 'The Front Bottoms')
    getSpotifyToken()
    .then((spotifyToken:SpotifyToken) =>{

        // SpotifyAlbumToUniversal('1v7hBIWUmfhggbxYd9HIW7',spotifyToken)
        searchSpotifyAlbum(example, spotifyToken)
        .then((data:any) =>{
            res.send(data)
        })
        .catch((error:Error)=>{
            res.send(error)
        })
    })
    

})

//fetchAlbumFirestore

export const TEST4 = functions.https.onRequest((req, res) => {

    //spotify:album:1v7hBIWUmfhggbxYd9HIW7

    fetchAlbumFirestore('DNUKzrAz7JwXyBh63oKn', ServiceType.spotify)
    .then((data:any)=>{
        res.send(data)
    })
    .catch((error:Error)=>{
        res.send(error)
    })    

})

export const TEST5 = functions.https.onRequest((req, res) => {

    //spotify:album:1v7hBIWUmfhggbxYd9HIW7

    // fetchAlbumFirestore('DNUKzrAz7JwXyBh63oKn', ServiceType.spotify)
    // .then((data:any)=>{
    //     res.send(data)
    // })
    // .catch((error:Error)=>{
    //     res.send(error)
    // })    

    if (!admin.apps.length) {
        admin.initializeApp();
    } 
    return new Promise (function (resolve, reject) {
        admin.firestore().collection("test").doc("ababababababababababababab").set({
            test:'test'
        })
        .then(function(docRef) {
            // console.log("Document written with ID: ", docRef);
            res.send('succ')
        })
        .catch(function(error) {
            // console.error("Error adding document: ", error);
            res.send(error)
        });
    })

})

export const TEST6 = functions.https.onRequest((req, res) => {
    let appleId = '1476463542'
    let spotifyId = '77G0k1La0c5Dw8bAFANcyp'
    // let num = 6987790567
    // let num = 9999999999

    let universalId = IdHash.createUniversalTrackId(spotifyId, appleId)

    let decodedIds = IdHash.decodeUniversalTrackId(universalId)

    let response = {
        preSpotify: spotifyId,
        preApple: appleId,
        universal: universalId,
        postSpotify: decodedIds.spotifyId,
        postApple: decodedIds.appleId

    }
    res.send(response)
}) 

function getSpotifyTrack (trackId: string, token: SpotifyToken): any {
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

function getAppleTrack (trackId: string): any {
    return new Promise (function(resolve, reject) {
        const url = `https://api.music.apple.com/v1/catalog/us/songs/${trackId}`
        const options = {
            headers: {
                Authorization: `Bearer ${APPLETOKEN}`
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

function getSpotifyAlbum (albumId: string, token: SpotifyToken): any {
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

function getAppleAlbum (albumId: string): any {
    return new Promise (function(resolve, reject) {
        console.log("id", albumId)
        const url = `https://api.music.apple.com/v1/catalog/us/albums/${albumId}`
        const options = {
            headers: {
                Authorization: `Bearer ${APPLETOKEN}`
            }
        };

        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let parsedData = <Apple.AlbumResponse> data
            console.log('parnisp', parsedData.data[0])
            let album = new AppleAlbum(parsedData.data[0])
            console.log('album', album)
            resolve(album)
        })
        .catch((error:Error) => {
            reject(error)
        })
    })
}

function getSpotifyPlaylist (playlistId: string, token: SpotifyToken): any {
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

function getApplePlaylist (playlistId: string): any {
    return new Promise (function(resolve, reject) {

        const url = `https://api.music.apple.com/v1/catalog/us/playlists/${playlistId}`
        const options = {
            headers: {
                Authorization: `Bearer ${APPLETOKEN}`
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

//UNIVERSALS

function spotifyTrackToUniversal (trackId: string, token: SpotifyToken): any {
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
                    .then((docRef: string) =>{
                        universalTrack.id = docRef
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

function appleTrackToUniversal (trackId: string, token: SpotifyToken):any {
    return new Promise(function(resolve, reject) {
        const url = `https://api.music.apple.com/v1/catalog/us/songs/${trackId}`
        const options = {
            headers: {
                Authorization: `Bearer ${APPLETOKEN}`
            }
        };

        fetch(url, options)
        .then( (res:any) => res.json())
        .then( (data:any) => {
            let parsedResponse = <Apple.Tracks>data
            let appleTrack = new AppleTrack(parsedResponse.data[0])
            searchSpotifyTrack(appleTrack.baseTrack(), token)
            .then((spotifyTrack:SpotifyTrack) =>{
                let universalTrack = new UniversalTrack(spotifyTrack, appleTrack)
                resolve(universalTrack)
            }).catch((error:Error) =>{
                reject(error)
            })
        }).catch((error:Error) =>{
            reject(error)
        } )
    })
}

//TODO 
function spotifyAlbumToUniversal (albumId: string, token: SpotifyToken):any{
    return new Promise (function(resolve, reject) {

        getSpotifyAlbum(albumId, token)
        .then((spotifyAlbum:SpotifyAlbum) =>{
            searchAppleAlbum(spotifyAlbum.baseAlbum())
            .then((appleAlbum:AppleAlbum)=>{
                console.log('12',appleAlbum)
                let universalAlbum = new UniversalAlbum(spotifyAlbum, appleAlbum)
                console.log('13',universalAlbum)

                storeUniversalAlbum(universalAlbum)
                .then((docId:any)=>{
                    
                    universalAlbum.id = docId
                    resolve(universalAlbum)
                })
                .catch((error:Error)=>{
                    console.log("PISS")
                })
            })
        })
        .catch((error:Error)=>{
            reject(error)     
        })
    })
}

function appleAlbumToUniversal (albumId: string, token: SpotifyToken):any{
    return new Promise (function(resolve, reject) {
        console.log('ok1')
        getAppleAlbum(albumId)
        .then((appleAlbum:AppleAlbum)=>{
            console.log('ok2')
            searchSpotifyAlbum(appleAlbum.baseAlbum(), token)
            .then((spotifyAlbum: SpotifyAlbum)=>{
                console.log('1', spotifyAlbum)
                let universalAlbum = new UniversalAlbum(spotifyAlbum, appleAlbum)
                console.log('2', universalAlbum)
                storeUniversalAlbum(universalAlbum)
                .then((docId:any)=>{
                    universalAlbum.id = docId
                    resolve(universalAlbum)
                })
            })
        })
        .catch((error:Error)=>{
            reject(error)     
        })
    })
}

function spotifyPlaylistToUniversal(playlistId: string, token: SpotifyToken): any {
    return new Promise (function(resolve, reject) {
        getSpotifyPlaylist(playlistId, token)
        .then((playlist: SpotifyPlaylist) =>{
            var fullfilledPromises:number = 0
            let goalPromises = playlist.tracks.length
            var universalTracks = new Array<UniversalTrack>()
            for (const [index, spotifyTrack] of playlist.tracks.entries()){
                console.log(index, spotifyTrack.name)
                fetchTrackFirestore(spotifyTrack.id, ServiceType.spotify)
                .then((universalTrack: FirestoreUniversalTrack) => {
                    //TODO: Fix sorting
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
                .catch(() => {
                    searchAppleTrack(spotifyTrack.baseTrack())
                    .then((appleTrack:AppleTrack) => {
                        let universalTrack = new UniversalTrack(spotifyTrack, appleTrack)
                        storeUniversalTrack(universalTrack)
                        .then((docRef: string) =>{
                            //TODO: Fix sorting
                            universalTrack.id = docRef
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
                        .catch((error:Error) =>{
                            console.log(error)
                        })
                    })
                    .catch( (error:Error) => {
                        fullfilledPromises += 1
                        if (fullfilledPromises == goalPromises){
                            let universalPlaylist = new UniversalPlaylist(playlist, universalTracks)
                            resolve(universalPlaylist)
                        }
                    })
                })
            }
        })
        .catch((error:Error) =>{
            reject(error)
        })
    })
}

function applePlaylistToUniversal (playlistId: string, token: SpotifyToken): any {
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

//STORE

function storeUniversalTrack (track: UniversalTrack): any {
    if (!admin.apps.length) {
        admin.initializeApp();
    } 

    return new Promise (function (resolve, reject) {
        admin.firestore().collection("tracks").add(track.toFirestoreData())
        .then(function(docRef) {
            // console.log("Document written with ID: ", docRef);
            resolve(docRef.id)
        })
        .catch(function(error) {
            // console.error("Error adding document: ", error);
            reject(error)
        });
    })
}

function storeUniversalAlbum(album: UniversalAlbum):any {
    if (!admin.apps.length) {
        admin.initializeApp();
    } 
    return new Promise (function (resolve, reject) {
        console.log('14')
        admin.firestore().collection("albums").add(album.toFirestoreData())
        .then(function(docRef) {
            console.log('15', docRef)

            resolve(docRef.id)
        })
        .catch(function(error) {
            console.log('AAAA')
            reject(error)
        });
    })
}

function storeUniversalPlaylist (playlist: UniversalPlaylist): any {
    if (!admin.apps.length) {
        admin.initializeApp();
    } 

    return new Promise (function (resolve, reject) {
        admin.firestore().collection("playlists").add(playlist.toFirestoreData())
        .then(function(docRef) {
            // console.log('DOCRED', docRef)
            resolve(docRef.id)
        })
        .catch(function(error) {
            reject(error)
        });
    })
}

//FETCH

function fetchPlaylistFirestore (playlistId: string): any{
    return new Promise (function(resolve, reject) {
        if (!admin.apps.length) {
            admin.initializeApp();
        } 
    
        admin.firestore().collection("playlists").doc(playlistId).get()
        .then(function(doc) {
            if (doc.exists) {
                resolve(doc.data())
            } else {
                reject('Document Does Dont Exist')
            }
        })
        .catch(function(error) {
            reject(error)
        });
    })
}

function fetchAlbumFirestore(id: string, serviceType?:ServiceType):any{
    return new Promise (function(resolve, reject) {
        if (!admin.apps.length) {
            admin.initializeApp();
        } 

        if (!serviceType){
            admin.firestore().collection("albums").doc(id).get()
            .then(function(doc) {
                if (doc.exists) {
                    resolve(doc.data())
                } else {
                    reject('Document Does Dont Exist')
                }
            })
            .catch(function(error) {
                reject()
            });
        }

        else if (serviceType == ServiceType.spotify){
            admin.firestore().collection("albums").where("spotifyId", "==", id).get()
            .then(function(querySnapshot) {
                if (!querySnapshot.empty){
                    let doc = querySnapshot.docs[0]
                    resolve(doc.data())
                    // let docData = <Firestore.FirestoreTrackData> doc.data()
                    // let universalTrack = new FirestoreUniversalTrack(docData, doc.id)
                    // resolve(universalTrack)
                } else {
                    reject()
                }
            })
            .catch(function(error) {
                reject()
            });
        }
        else if (serviceType == ServiceType.apple) {
            admin.firestore().collection("albums").where("appleId", "==", id).get()
            .then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                });
            })
            .catch(function(error) {
            });
        }
    })
}

function fetchTrackFirestore(id: string, serviceType?:ServiceType):any{
    return new Promise (function(resolve, reject) {
        if (!admin.apps.length) {
            admin.initializeApp();
        } 
        if (!serviceType){
            admin.firestore().collection("tracks").doc(id).get()
            .then(function(doc) {
                if (doc.exists) {
                    resolve(doc.data())
                } else {
                    reject('Document Does Dont Exist')
                }
            })
            .catch(function(error) {
                reject()
            });
        }
        else if (serviceType == ServiceType.spotify){
            admin.firestore().collection("tracks").where("spotifyId", "==", id).get()
            .then(function(querySnapshot) {
                if (!querySnapshot.empty){
                    let doc = querySnapshot.docs[0]
                    let docData = <Firestore.FirestoreTrackData> doc.data()
                    let universalTrack = new FirestoreUniversalTrack(docData, doc.id)
                    resolve(universalTrack)
                } else{
                    reject()
                }
            })
            .catch(function(error) {
                reject()
            });
        }
        else if (serviceType == ServiceType.apple) {
            admin.firestore().collection("tracks").where("appleId", "==", id).get()
            .then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                });
            })
            .catch(function(error) {
            });
        }
    })
}

//TOKEN

function getSpotifyToken (): any {
    return new Promise (function (resolve, reject) {
        const clientSecret = '36e635baad4c4430a5b04b4d45bd32ea'
        const clientId = 'a46438b4ef724143bd34928fee96a742'

        const url = 'https://accounts.spotify.com/api/token'
        const options = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=client_credentials&client_secret=${clientSecret}&client_id=${clientId}`
            // body: 'grant_type=client_credentials&client_secret=36e635baad4c4430a5b04b4d45bd32ea&client_id=a46438b4ef724143bd34928fee96a742'
        }

        fetch(url, options)
        .then((res:any) => res.json())
        .then((data:any) => {
            let spotifyToken = new SpotifyToken(<Spotify.TokenResponse> data)
            resolve(spotifyToken)
        })
        .catch((error:Error) =>{
            reject(error)
        })
    })
}

declare module Apple {

    export interface Artwork {
        url: string;
    }

    export interface Description {
        standard: string;
    }

    export interface PlaylistAttributes {
        artwork: Artwork;
        name: string;
        description: Description;
    }

    export interface TrackAttributes {
        artwork: Artwork;
        artistName: string;
        genreNames: string[];
        name: string;
        albumName: string;
    }

    export interface AlbumAttributes {
        artwork: Artwork;
        artistName: string;
        genreNames: string[];
        name: string;
    }

    export interface TrackData {
        id: string;
        attributes: TrackAttributes;
    }

    export interface Tracks {
        data: TrackData[];
    }

    export interface Relationships {
        tracks: Tracks;
    }

    export interface AlbumData {
        id: string;
        attributes: AlbumAttributes;
        relationships: Relationships;
    }

    export interface PlaylistData {
        id: string;
        attributes: PlaylistAttributes;
        relationships: Relationships;
    }

    export interface PlaylistResponse {
        data: PlaylistData[];
    }

    export interface TrackResults {
        songs: Tracks;
    }

    export interface TrackSearchResponse {
        results: TrackResults;
    }

    export interface AlbumPreviewData {
        id: string;
        attributes: AlbumAttributes;
    }

    export interface Albums {
        data: AlbumPreviewData[];
    }

    export interface AlbumResults {
        albums: Albums;
    }

    export interface AlbumSearchResponse {
        results: AlbumResults;
    }

    export interface AlbumResponse {
        data: AlbumData[];
    }
}

declare module Spotify {

    export interface ResultTracks {
        items: TrackAttributes[];
    }

    export interface SearchResponse {
        tracks: ResultTracks;
    }

    export interface Image {
        url: string;
    }

    export interface Album {
        artists: Artist[];
        images: Image[];
        name: string;
    }

    export interface Artist {
        name: string;
    }

    export interface TrackAttributes {
        album: Album;
        artists: Artist[];
        id: string;
        name: string;
    }
    
    export interface TrackItem {
        track: TrackAttributes;
    }

    export interface Tracks {
        items: TrackItem[];
    }

    export interface PlaylistResponse {
        description: string;
        id: string;
        images: Image[];
        name: string;
        tracks: Tracks;
    }

    export interface TokenResponse {
        access_token: string;
        token_type: string;
    }

    export interface AlbumTrack {
        artists: Artist[];
        id: string;
        name: string;
    }

    export interface AlbumTracks {
        items: AlbumTrack[];
    }

    export interface AlbumResponse {
        artists: Artist[];
        genres: any[];
        id: string;
        images: Image[];
        name: string;
        tracks: AlbumTracks;
    }

    export interface AlbumSearchAlbum {
        artists: Artist[];
        id: string;
        images: Image[];
        name: string;
    }

    export interface AlbumSearchItems {
        items: AlbumSearchAlbum[];
    }

    export interface AlbumSearchResponse {
        albums: AlbumSearchItems;
    }
}

declare module Firestore {
    export interface FirestoreTrackData {
        spotifyId: string;
        appleId: string;
        name: string;
        artist: string;
        album: string;
        coverImage: string;
        genres?: [string];
    }

    // export interface AlbumTrack {
    //     album: string;
    //     coverImage: string;
    //     id: string;
    //     artist: string;
    //     name: string;
    // }

    export interface FirestoreAlbumData {
        artist: string;
        name: string;
        coverImage: string;
        spotifyId: string;
        appleId: string;
        tracks: FirestoreTrackData[];
        genres: string[];
    }
}