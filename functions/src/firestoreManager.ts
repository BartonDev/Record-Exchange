import * as admin from 'firebase-admin';
import {Firestore} from "./apiInterfaces"
import {ServiceType} from "./musicEnums"
import {UniversalTrack, FirestoreUniversalTrack, UniversalAlbum, UniversalPlaylist} from "./musicObjects"

//TODO: 
// Currently setting document without pre-checking its existence.
// could save on writes if we do a read before hand, may take longer 
// but if we're storing documents asynchronous it shouldnt matter 

//STORE

export function storeUniversalTrack (track: UniversalTrack): any {
    if (!admin.apps.length) {
        admin.initializeApp();
    } 

    return new Promise (function (resolve, reject) {
        admin.firestore().collection("tracks").doc(track.id).set(track.toFirestoreData())
        .then(function() {
            resolve()
        })
        .catch(function(error) {
            reject(error)
        });
    })
}

export function frugalStoreUniversalTrack(track: UniversalTrack): any {
    if (!admin.apps.length) {
        admin.initializeApp();
    } 

    return new Promise (function (resolve, reject) {
        admin.firestore().collection("tracks").doc(track.id).get()
        .then(function(doc:any) {
            if (!doc.exists) {
                admin.firestore().collection("tracks").doc(track.id).set(track.toFirestoreData())
                .then(function() {
                    resolve()
                })
                .catch(function(error) {
                    reject(error)
                });
            } else {
                resolve()
            }
        })
        .catch((error:Error) =>{
            admin.firestore().collection("tracks").doc(track.id).set(track.toFirestoreData())
            .then(function() {
                resolve()
            })
            .catch(function(error) {
                reject(error)
            });
        })
    })
}

export function storeUniversalTracks (tracks: Array<UniversalTrack>): any {
    if (!admin.apps.length) {
        admin.initializeApp();
    } 
    
    return new Promise (function(resolve, reject){
        let goalPromises = tracks.length
        let allPromises = new Array<any>()
    
        for (let track of tracks){
            let storagePromise = new Promise (function(resolve, reject) {
                storeUniversalTrack(track)
                .then(()=>{
                    resolve()
                })
                .catch((error:Error)=>{
                    reject(error)
                })
            })

            allPromises.push(storagePromise)
            
            if (allPromises.length == goalPromises){
                Promise.all(allPromises)
                .then(()=>{
                    resolve()
                })
                .catch((error:Error) =>{
                    reject(error)
                })
            }
        }
    })
}

export function storeUniversalAlbum(album: UniversalAlbum):any {
    if (!admin.apps.length) {
        admin.initializeApp();
    }

    let tracksPromise = new Promise (function(resolve, reject) {
        resolve()
        // storeUniversalTracks(album.tracks)
        // .then(()=>{
        //     resolve()
        // })
        // .catch((error:Error) =>{
        //     reject(error)
        // })
    })

    let albumPromise = new Promise (function(resolve, reject){
        admin.firestore().collection("albums").doc(album.id).set(album.toFirestoreData())
        .then(function() {
            resolve()
        })
        .catch(function(error) {
            reject(error)
        });
    })

    return new Promise (function (resolve, reject) {
        admin.firestore().collection("albums").doc(album.id).get()
        .then(function(doc:any) {
            if (!doc.exists) {
                Promise.all([tracksPromise, albumPromise])
                .then(()=>{
                    resolve()
                })
                .catch((error:Error)=>{
                    reject(error)
                })
            } else {
                resolve()
            }
        })
        .catch((error:Error) =>{
            reject(error)
        })
    })
}

export function storeUniversalPlaylist (playlist: UniversalPlaylist): any {
    if (!admin.apps.length) {
        admin.initializeApp();
    } 

    return new Promise (function (resolve, reject) {
        admin.firestore().collection("playlists").add(playlist.toFirestoreData())
        .then(function(docRef) {
            resolve(docRef.id)
        })
        .catch(function(error) {
            reject(error)
        });
    })
}

//FETCH

export function fetchPlaylistFirestore (playlistId: string): any{
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


export function fetchAlbumFirestore(id: string, serviceType?:ServiceType):any{
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
                if (!querySnapshot.empty){
                    let doc = querySnapshot.docs[0]
                    resolve(doc.data())
                } else {
                    reject()
                }
            })
            .catch(function(error) {
                reject(error)
            });
        }
    })
}

export function fetchTrackFirestore(id: string, serviceType?:ServiceType):any{
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
                reject(error)
            });
        }
        else if (serviceType == ServiceType.apple) {
            admin.firestore().collection("tracks").where("appleId", "==", id).get()
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
                reject(error)
            });
        }
    })
}