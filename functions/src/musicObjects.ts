import { IdHash } from "./idHash"
import {Spotify, Apple, Firestore} from "./apiInterfaces"
import {ObjectType} from "./musicEnums"
import {msToStandard, sanitizeStringBasic, sanitizeStringComplex} from "./stringExtensions"
// import { app } from "firebase-admin"

import {getColorFromUrl} from "./colorManager"


export enum MatchValue {different, similar, match}

export class ComparisonResult {
    nameResult: MatchValue
    artistResult: MatchValue
    albumResult: MatchValue
    value: number
    constructor(nameResult: MatchValue, artistResult: MatchValue, albumResult: MatchValue){
        this.nameResult = nameResult
        this.artistResult = artistResult
        this.albumResult = albumResult

        this.value = nameResult * 15 + artistResult * 10 + albumResult * 1
    }
}

export class Track {
    name: string
    artist: string
    album: string 
    coverImage: string;
    duration: string;
    preview: string;
    color: string;

    constructor(name: string, artist: string, album: string, coverImage: string, duration: string, preview: string){
        this.name = name
        this.artist = artist
        this.album = album
        this.coverImage = coverImage
        this.duration = duration
        this.preview = preview
        this.color = '#FFFFFF'
    }

    compare (comparisonTrack: Track): ComparisonResult {
        let nameResult = MatchValue.different
        let artistResult = MatchValue.different
        let albumResult = MatchValue.different

        var name1 = sanitizeStringBasic(this.name)
        var name2 = sanitizeStringBasic(comparisonTrack.name)
        if (name1 == name2){
            nameResult = MatchValue.match
        } else {
            var name1Complex = sanitizeStringComplex(this.name)
            var name2Complex = sanitizeStringComplex(comparisonTrack.name)
            if (name1Complex == name2Complex){
                nameResult = MatchValue.match
            } else if (name1Complex.length >= name2Complex.length && name1Complex.includes(name2Complex)){
                nameResult = MatchValue.similar
            } else if (name2Complex.length > name1Complex.length && name2Complex.includes(name1Complex)){
                nameResult = MatchValue.similar
            } else {
                nameResult = MatchValue.different
            }
        }

        var artist1 = sanitizeStringBasic(this.artist)
        var artist2 = sanitizeStringBasic(comparisonTrack.artist)
        if (artist1 == artist2) {
            artistResult = MatchValue.match
        } else if (artist2.includes(artist1)) {
            artistResult = MatchValue.similar
        } else {
            artistResult = MatchValue.different
        }

        var album1 = sanitizeStringBasic(this.album)
        var album2 = sanitizeStringBasic(comparisonTrack.album)
        if (album1 == album2){
            albumResult = MatchValue.match
        } else {
            album1 = sanitizeStringComplex(album1)
            album2 = sanitizeStringComplex(album2)
            if (album1 == album2){
                albumResult = MatchValue.match
            } else if (album1.length >= album2.length && album1.includes(album2)){
                albumResult = MatchValue.similar
            } else if (album2.length > album1.length && album2.includes(album1)){
                albumResult = MatchValue.similar
            } else {
                albumResult = MatchValue.different
            }
        }

        return new ComparisonResult(nameResult, artistResult, albumResult)
    }

    baseTrack():Track {
        return this
    }

    updateColor():any{
        return new Promise((resolve, reject) => {
            getColorFromUrl(this.coverImage)
            .then((color:string) => {
                this.color = color
                resolve()
            })
            .catch(()=>{
                reject()
            })
        })
    }
}

export class AppleTrack extends Track{
    id: string;
    genres: Array<string>;
    link: string;

    constructor(data: Apple.TrackData){
        console.log("data", data)
        let name = data.attributes.name
        let artist = data.attributes.artistName
        let album = data.attributes.albumName
        let rawCoverImage = data.attributes.artwork.url
        let coverImage = rawCoverImage.replace('{w}x{h}', '640x640')
        let duration = msToStandard(data.attributes.durationInMillis)
        var preview = ""
        if (data.attributes.previews != undefined && data.attributes.previews.length){
            preview = data.attributes.previews[0].url
        }
        super(name, artist, album, coverImage, duration, preview)
        this.id = data.id
        this.genres = data.attributes.genreNames
        this.link = data.attributes.url
        // if data.attributes.li
    }
}

export class SpotifyTrack extends Track {
    id: string;

    constructor(data: Spotify.TrackAttributes){
        let name = data.name
        let artist = data.artists[0].name
        let album = data.album.name
        let coverImage = data.album.images[0].url
        let duration =  msToStandard(data.duration_ms)
        let preview = data.preview_url
        super(name, artist, album, coverImage, duration, preview)

        this.id = data.id
    }
}

export class SpotifyAlbumTrack extends Track implements SpotifyTrack {
    id: string;
    preview: string;

    constructor(data: Spotify.AlbumTrack, albumName: string, albumCover: string){
        let name = data.name
        let artist = data.artists[0].name
        let album = albumName
        let coverImage = albumCover
        let duration =  msToStandard(data.duration_ms)
        //TODO
        let preview = ""
        super(name, artist, album, coverImage, duration, preview)

        this.id = data.id
        this.preview = data.preview_url
    }
}

export class UniversalTrack extends Track {
    id: string;
    spotifyId: string;
    appleId: string;
    genres: string[];
    appleLink: string;

    constructor(spotifyTrack: SpotifyTrack, appleTrack: AppleTrack){
        let name = spotifyTrack.name
        let artist = spotifyTrack.artist
        let album = spotifyTrack.album
        let coverImage = spotifyTrack.coverImage
        let duration = spotifyTrack.duration
        var preview = ""
        if (spotifyTrack.preview){
            preview = spotifyTrack.preview
        } else if (appleTrack.preview){
            preview = appleTrack.preview
        }
        super(name, artist, album, coverImage, duration, preview)

        this.spotifyId = spotifyTrack.id
        this.appleId = appleTrack.id
        this.genres = appleTrack.genres
        this.appleLink = appleTrack.link
        this.id = IdHash.createUniversalId(this.spotifyId, this.appleId, ObjectType.track)
    }

    toFirestoreData(): any{
        return ({
            spotifyId: this.spotifyId,
            appleId: this.appleId,
            name: this.name,
            artist: this.artist,
            album: this.album,
            coverImage: this.coverImage,
            genres: this.genres,
            duration: this.duration,
            preview: this.preview,
            appleLink: this.appleLink,
            color: this.color,
        })
    }
}

export class UniversalAlbumTrack extends Track {
    id: string;
    spotifyId: string;
    appleId: string;
    genres: string[];
    appleLink: string;

    constructor(appleTrack: AppleTrack){
        let name = appleTrack.name
        let artist = appleTrack.artist
        let album = appleTrack.album
        let coverImage = appleTrack.coverImage
        let duration = appleTrack.duration
        var preview = appleTrack.preview
        super(name, artist, album, coverImage, duration, preview)

        this.spotifyId = ""
        this.appleId = appleTrack.id
        this.genres = appleTrack.genres
        this.appleLink = appleTrack.link
        this.id = IdHash.createUniversalId(this.spotifyId, this.appleId, ObjectType.track)
    }

    toFirestoreData(): any{
        return ({
            spotifyId: this.spotifyId,
            appleId: this.appleId,
            name: this.name,
            artist: this.artist,
            album: this.album,
            coverImage: this.coverImage,
            genres: this.genres,
            duration: this.duration,
            preview: this.preview,
            appleLink: this.appleLink,
            color: this.color,
        })
    }
}

export class FirestoreUniversalTrack extends Track implements UniversalTrack {
    id: string;
    spotifyId: string;
    appleId: string;
    genres: string[];
    appleLink: string;

    constructor(firestoreData: Firestore.FirestoreTrackData, firestoreId: string){
        let name = firestoreData.name
        let artist = firestoreData.artist
        let album = firestoreData.album
        let coverImage = firestoreData.coverImage
        let duration = firestoreData.duration
        let preview = firestoreData.preview
        super(name, artist, album, coverImage, duration, preview)

        this.spotifyId = firestoreData.spotifyId
        this.appleId = firestoreData.appleId
        this.id = firestoreId
        this.appleLink = firestoreData.appleLink;
        this.color = firestoreData.color

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
            genres: this.genres,
            duration: this.duration,
            preview: this.preview,
            appleLink: this.appleLink,
            color: this.color,
        })
    }
}

export class JsonUniversalTrack extends Track implements UniversalTrack {
    id: string;
    spotifyId: string;
    appleId: string;
    genres: string[];
    appleLink: string;

    constructor(jsonString: string ){
        let trackData = JSON.parse(jsonString)
        let name = trackData.name
        let artist = trackData.artist
        let album = trackData.album
        let coverImage = trackData.coverImage
        let duration = trackData.duration
        let preview = trackData.preview

        super(name, artist, album, coverImage, duration, preview)

        this.appleLink = trackData.appleLink
        this.spotifyId = trackData.spotifyId
        this.appleId = trackData.appleId
        this.id = trackData.id
        this.genres = trackData.genres
    }

    toFirestoreData():any{
        return ({
            spotifyId: this.spotifyId,
            appleId: this.appleId,
            name: this.name,
            artist: this.artist,
            album: this.album,
            coverImage: this.coverImage,
            genres: this.genres,
            duration: this.duration,
            preview: this.preview,
            appleLink: this.appleLink,
            color: this.color,
        })
    }
}


export class Album {
    name: string
    artist: string
    coverImage: string
    color: string

    constructor(name: string, artist: string, coverImage: string
        ){
        this.name = name
        this.artist = artist
        this.coverImage = coverImage
        this.color = '#FFFFFF'
    }

    compare (comparisonAlbum: Album): ComparisonResult {
        let nameResult = MatchValue.different
        let artistResult = MatchValue.different

        var name1 = sanitizeStringBasic(this.name)
        var name2 = sanitizeStringBasic(comparisonAlbum.name)
        if (name1 == name2){
            nameResult = MatchValue.match
        } else {
            name1 = sanitizeStringComplex(name1)
            name2 = sanitizeStringComplex(name2)
            if (name1 == name2){
                nameResult = MatchValue.match
            } else if (name1.length >= name2.length && name1.includes(name2)){
                nameResult = MatchValue.similar
            } else if (name2.length > name1.length && name2.includes(name1)){
                nameResult = MatchValue.similar
            } else {
                nameResult = MatchValue.different
            }
        }

        var artist1 = sanitizeStringBasic(this.artist)
        var artist2 = sanitizeStringBasic(comparisonAlbum.artist)
        if (artist1 == artist2) {
            artistResult = MatchValue.match
        } else if (artist2.includes(artist1)) {
            artistResult = MatchValue.similar
        } else {
            artistResult = MatchValue.different
        }

        return new  ComparisonResult(nameResult, artistResult, MatchValue.match)
    }

    baseAlbum():Album {
        return this
    }

    updateColor():any{
        return new Promise((resolve, reject) => {
            console.log("TEST11")
            getColorFromUrl(this.coverImage)
            .then((color:string) => {
                console.log("TEST12")
                this.color = color
                resolve()
            })
            .catch(()=>{
                reject()
            })
        })
    }
}

//TODO: Clean up artists
export class SpotifyAlbum extends Album{
    id: string
    genres: Array<any>
    tracks: Array<SpotifyTrack>

    constructor (data: Spotify.AlbumResponse){
        let artists = new Array<string>()
        for (let artist of data.artists){
            artists.push(artist.name)
        }
        let name = data.name
        let artist = artists[0]
        let coverImage = data.images[0].url
        super(name, artist, coverImage)

        this.id = data.id
        
        this.genres = data.genres

        let tracks = new Array<SpotifyTrack>()
        for (let trackData of data.tracks.items) {
            let track = new SpotifyAlbumTrack(trackData, this.name, this.coverImage)
            tracks.push(track)
        }
        this.tracks = tracks
    }
}

export class AppleAlbum extends Album{
    id: string
    genres: Array<string>
    tracks: Array<AppleTrack>

    constructor (data: Apple.AlbumData){
        
        let name = data.attributes.name
        let artist = data.attributes.artistName
        let rawCoverImage = data.attributes.artwork.url
        let coverImage = rawCoverImage.replace('{w}x{h}', '640x640')
        super(name, artist, coverImage)

        this.id = data.id
        
        
        let tracks = new Array<AppleTrack>()
        for (let trackData of data.relationships.tracks.data) {
            let track = new AppleTrack(trackData)
            tracks.push(track)
        }
        this.tracks = tracks
        this.genres = data.attributes.genreNames
    }
}

export class UniversalAlbum extends Album {
    id: string
    spotifyId: string
    appleId: string
    genres: Array<string>
    tracks: Array<UniversalTrack>

    constructor(spotifyAlbum:SpotifyAlbum, appleAlbum:AppleAlbum){
        let name = spotifyAlbum.name
        let artist = appleAlbum.artist
        let coverImage = spotifyAlbum.coverImage
        super(name, artist, coverImage)

        this.spotifyId = spotifyAlbum.id,
        this.appleId = appleAlbum.id
        
        this.genres = appleAlbum.genres

        this.id = IdHash.createUniversalId(this.spotifyId, this.appleId, ObjectType.album)

        // :/
        let appleTracks = appleAlbum.tracks
        let universalTracks = Array<UniversalTrack>()
        
        for (let appleTrack of appleTracks){
            let universalTrack = new UniversalAlbumTrack(appleTrack)
            universalTracks.push(universalTrack)
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
                appleId: track.appleId,
                duration: track.duration,
                preview: track.preview
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
            color: this.color,
            tracks: firestoreTracks
           
        })
    }
}


export class FirestoreUniversalAlbum extends Album implements UniversalAlbum {
    id: string
    spotifyId: string
    appleId: string
    genres: Array<string>
    tracks: Array<UniversalTrack>

    constructor(data: Firestore.FirestoreAlbumData, firestoreId: string){
        let name = data.name
        let artist = data.artist
        let coverImage =  data.coverImage
        super(name, artist, coverImage)

        this.spotifyId = data.spotifyId
        this.appleId = data.appleId
        this.genres = data.genres

        this.id = firestoreId
        this.color = data.color

        //TODO: ???
        let universalTracks = Array<UniversalTrack>()
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
                appleId: track.appleId,
                duration: track.duration,
                preview: track.preview

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
            color: this.color,
            tracks: firestoreTracks
           
        })
    }
}

export class Playlist {
    name: string
    description: string
    coverImage: string
    color: string 

    constructor (name: string, description: string, coverImage: string){
        this.name = name
        this.description = description
        this.coverImage = coverImage
        this.color = '#FFFFFF'

        this.updateColor = this.updateColor.bind(this)
    }

    updateColor():any{
        return new Promise((resolve, reject) => {
            getColorFromUrl(this.coverImage)
            .then((color:string) => {
                this.color = color
                resolve()
            })
            .catch(()=>{
                reject()
            })
        })
    }
}

export class ApplePlaylist extends Playlist{
    id: string;
    tracks: Array<AppleTrack>;

    constructor (data:Apple.PlaylistData){
        let name = data.attributes.name
        var description = ''
        if (data.attributes.description){
            description = data.attributes.description.standard
        }
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

export class SpotifyPlaylist extends Playlist{
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


export class UniversalPlaylist extends Playlist{
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
                duration: track.duration,
                preview: track.preview
            }
            firestoreTracks.push(trackData)
        }

        return ({
            
            name: this.name,
            description: this.description,
            coverImage: this.coverImage,
            color: this.color,
            tracks: firestoreTracks
        })
    }
}

export class FirestoreUniversalPlaylist extends Playlist implements UniversalPlaylist{
    id: string;
    tracks: Array<UniversalTrack>;

    constructor(data: Firestore.FirestorePlaylistData, playlistId: string){
        let name = data.name
        let description = data.description
        let coverImage = data.coverImage
        super(name, description, coverImage)

        this.id = playlistId
        this.color = data.color
        var tracks = new Array<UniversalTrack>()
        for (let trackData of data.tracks){
            let trackId = IdHash.createUniversalId(trackData.spotifyId, trackData.appleId, ObjectType.track)
            let newTrack = new FirestoreUniversalTrack(trackData, trackId)
            tracks.push(newTrack)
        }
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
                duration: track.duration,
                preview: track.preview
            }
            firestoreTracks.push(trackData)
        }

        return ({  
            name: this.name,
            description: this.description,
            coverImage: this.coverImage,
            color: this.color,
            tracks: firestoreTracks
        })
    }
}

export class JsonUniversalPlaylist extends Playlist implements UniversalPlaylist{
    id: string;
    tracks: Array<UniversalTrack>;

    constructor(jsonString: string){
        let data = JSON.parse(jsonString)
        let name = data.name
        let description = data.description
        let coverImage = data.coverImage
        super(name, description, coverImage)

        this.id = data.id
        var tracks = new Array<UniversalTrack>()
        for (let trackData of data.tracks){
            let trackJson = JSON.stringify(trackData)
            let newTrack = new JsonUniversalTrack(trackJson)
            tracks.push(newTrack)
        }
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
                duration: track.duration,
                preview: track.preview
            }
            firestoreTracks.push(trackData)
        }

        return ({  
            name: this.name,
            description: this.description,
            coverImage: this.coverImage,
            color: this.color,
            tracks: firestoreTracks
        })
    }
}





