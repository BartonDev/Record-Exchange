export module Apple {

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

export module Spotify {

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

    // export interface TokenResponse {
    //     access_token: string;
    //     token_type: string;
    // }

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

export module Firestore {
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