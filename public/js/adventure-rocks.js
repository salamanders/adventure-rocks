/*globals firebase  */
/*jshint esversion: 8 */
/*jshint unused:true */
/*exported main */

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
        const msg = 'Geolocation is not supported by your browser';
        alert(msg);
        console.error(msg);
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
    }, error => {
        const msg = 'Unable to find your location, did you say no?';
        alert(msg);
        console.error(msg);
        console.error(error);
    });
};

async function main() {
    await blockUntilDOMReady();
    const path = window.location.pathname;
    if(path.startsWith('/r/')) {
      const rockName = path.substr('/r/'.length);
      console.info(`Rock Name: ${rockName}`);
      document.querySelectorAll(".rock-name").forEach(nameSpan=>nameSpan.textContent=rockName);
    }
    document.getElementById('log-visit').addEventListener('click', logVisit);
    const fs = firebase.firestore();

    fs.doc(`/rocks/${rockName.toLowerCase()}`).get().then(() => {
        console.info(`Got a firestore doc.`);
    });
}