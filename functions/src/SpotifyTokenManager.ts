const fetch = require('cross-fetch')

export class SpotifyToken {
    token: string

    constructor (data:TokenResponse){
        this.token = data.token_type + " " + data.access_token
    }
}

export function getSpotifyToken (): any {
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
        }

        fetch(url, options)
        .then((res:any) => res.json())
        .then((data:any) => {
            let spotifyToken = new SpotifyToken(<TokenResponse> data)
            resolve(spotifyToken)
        })
        .catch((error:Error) =>{
            reject(error)
        })
    })
}

export function getSpotifyAuthCodeUrl (): string {
    const clientId = 'a46438b4ef724143bd34928fee96a742';
    const redirectUri = 'http://localhost:3000/spotifyCallback'; 
    const state = "abcdefg";
    const scope = 'user-read-private playlist-modify-private';

    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(clientId);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirectUri);
    url += '&state=' + encodeURIComponent(state);

    return (url)
}

interface TokenResponse {
    access_token: string;
    token_type: string;
}