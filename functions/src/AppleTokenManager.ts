import * as admin from 'firebase-admin';

export function getAppleToken (): any {
    return new Promise (function (resolve, reject) {
        if (!admin.apps.length) {
            admin.initializeApp();
        } 

        admin.firestore().collection("credentials").doc("apple").get()
        .then(function(doc:any) {
            if (doc.exists) {
                resolve(doc.data()["token"])
            } else {
                reject("Error: could not fetch apple credentials")
            }
        })
        .catch(function(error:Error) {
            reject(error)
        });
    })
}
