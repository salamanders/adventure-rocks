/*globals firebase  */
/*jshint esversion: 8 */
/*jshint unused:true */
/*exported main */


/**
 * @type {?firebase.firestore.CollectionReference}
 */
let rocksCollection = null;

/**
 * @type {?firebase.firestore.DocumentReference}
 */
let rockDocumentReference = null;

/**
 * @type {?firebase.firestore.DocumentSnapshot}
 */
let rockDocumentSnapshot = null;

/**
 * @type {?Object}
 */
let rockData = null;


/**
 *
 * @param {string} msg
 */
function alertAndLog(msg) {
    console.error(msg);
    alert(msg);
}

const blockUntilDOMReady = () => new Promise(resolve => {
    // Block on document being fully ready, in case we need to build a login button
    if (document.readyState === 'complete') {
        console.info(`Was already ready: document.readyState=${document.readyState}`);
        resolve();
        return;
    }
    const onReady = () => {
        console.info(`Document now read: document.readyState=${document.readyState}`);
        resolve();
        document.removeEventListener('DOMContentLoaded', onReady, true);
        window.removeEventListener('load', onReady, true);
    };
    document.addEventListener('DOMContentLoaded', onReady, true);
    window.addEventListener('load', onReady, true);
});

function logVisit() {
    if (!navigator.geolocation) {
        alertAndLog('Geolocation is not supported by your browser')
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        await rockDocumentReference.collection('visits').add({
            ts: firebase.firestore.FieldValue.serverTimestamp(),
            gps: new firebase.firestore.GeoPoint(latitude, longitude)
        });
        alert(`Thank you for moving ${rockData.name} to an exciting new place!`);
    }, error => {
        alertAndLog('Unable to find your location, did you say no to location permissions?');
        console.error(error);
    });
}

function renderRock() {
    document.querySelectorAll(".rock-name").forEach(nameSpan => nameSpan.textContent = rockData.name);
    document.getElementById('rock-likes').innerHTML = rockData.likes.map(like => `<li>${like}</li>`).join(' ');
    document.getElementById('rock-dislikes').innerHTML = rockData.dislikes.map(dislike => `<li>${dislike}</li>`).join(' ');
}

async function main() {
    await blockUntilDOMReady();
    const path = window.location.pathname;
    if (path.startsWith('/r/')) {
        const rockId = path.substr('/r/'.length)
            .toLocaleLowerCase()
            .replace(/[^0-9a-z]+/g, '');
        console.info(`RockID: ${rockId}`);


        rocksCollection = firebase.firestore().collection("rocks");
        rockDocumentReference = rocksCollection.doc(rockId);
        rockDocumentSnapshot = await rockDocumentReference.get();
        document.getElementById('log-visit').addEventListener('click', logVisit);
        rockData = rockDocumentSnapshot.data();
        renderRock();
    } else {
        alertAndLog('Unsure which rock you found!');
    }

}