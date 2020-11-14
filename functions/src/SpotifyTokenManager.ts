import * as admin from 'firebase-admin';

const fetch = require('cross-fetch')

export class SpotifyToken {
    token: string

    constructor (data:TokenResponse){
        this.token = data.token_type + " " + data.access_token
    }
}

export function getSpotifyToken (): any {
    return new Promise (function (resolve, reject) {

        if (!admin.apps.length) {
            admin.initializeApp();
        } 

        admin.firestore().collection("credentials").doc("spotify").get()
        .then(function(doc:any) {

            if (doc.exists) {
                const data = doc.data()
                const clientSecret = data["client_secret"]
                const clientId = data["client_id"]
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


            } else {
                reject("Error: could not fetch spotify credentials")
            }
        })
        .catch(function(error:Error) {
            reject(error)
        });
    })
}

export function getSpotifyAuthCodeUrl (): any {
    return new Promise (function (resolve, reject) {
        if (!admin.apps.length) {
            admin.initializeApp();
        } 

        admin.firestore().collection("credentials").doc("spotify").get()
        .then(function(doc:any) {
            if (doc.exists) {
                const clientId = doc.data()["client_id"];
                const redirectUri = 'http://recordExchange.app/spotifyCallback'; 
                const state = "";
                const scope = 'user-read-private playlist-modify-private';
            
                var url = 'https://accounts.spotify.com/authorize';
                url += '?response_type=token';
                url += '&client_id=' + encodeURIComponent(clientId);
                url += '&scope=' + encodeURIComponent(scope);
                url += '&redirect_uri=' + encodeURIComponent(redirectUri);
                url += '&state=' + encodeURIComponent(state);
            
                resolve (url)
            } else {
                reject("Error: could not fetch spotify credentials")
            }
        })
    })
}

interface TokenResponse {
    access_token: string;
    token_type: string;
}