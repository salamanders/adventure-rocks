/*globals firebase, google, alertAndLog, setCookie, getCookie  */
/*globals getImageFbStorage, getImageWeb, qrcodegen, QRC, blockUntilDOMReady, displayOneOf */
/*jshint esversion: 8 */
/*jshint unused:true */
/*exported main */

/** @type {?String} */
let rockId = null;

/** @type {?firebase.firestore.CollectionReference} */
let rocksCollection = null;

/** @type {?firebase.firestore.DocumentSnapshot} */
let rockDocumentSnapshot = null;

/** @type {?Object} */
let rockData = null;

/** @type {?firebase.firestore.CollectionReference} */
let rockVisitsCollection = null;

/** @type {boolean} */
let ableToLogVisit = false;

/** @type {?google.maps.Map} */
let map = null;

/**
 * You have a rock-in-hand and have pressed the button.
 */
function logVisit() {
  if (!navigator.geolocation) {
    alertAndLog('Geolocation is not supported by your browser');
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    await rockVisitsCollection.add({
      ts: firebase.firestore.FieldValue.serverTimestamp(),
      gps: new firebase.firestore.GeoPoint(latitude, longitude)
    });
    alert(`Thank you for moving ${rockData.name} to an exciting new place!`);
  }, error => {
    alertAndLog('Unable to find your location, did you say no to location permissions?');
    console.error(error);
  });
}


/**
 * Ultra light Firestore to HTML
 *
 * @return {Promise<void>}
 */
async function renderRockText() {
  document.querySelectorAll(".rockName").forEach(nameSpan => nameSpan.textContent = rockData.name);
  document.getElementById('rock-likes').innerHTML = rockData.likes.map(like => `<li>${like}</li>`).join(' ');
  document.getElementById('rock-dislikes').innerHTML = rockData.dislikes.map(dislike => `<li>${dislike}</li>`).join(' ');
}

/**
 * Just the rock image
 *
 * @return {Promise<void>}
 */
async function renderRockPortrait() {
  const portraitPath = `/img/rocks/${rockId}.jpg`;
  console.info('Rendering optional portrait');

  /** @type <?Image> */
  let portraitImage = null;

  try {
    portraitImage = await getImageFbStorage(portraitPath);
  } catch (e) {
    console.info(`No portrait from FB Storage:${e}.`);
  }

  if (!portraitImage) {
    try {
      portraitImage = await getImageWeb(portraitPath);
    } catch (e) {
      console.warn(`No portrait from web-only: '${e}'.`);
    }
  }

  /** @type HTMLElement */
  const portraitHolder = document.getElementById('rockPortrait');
  if (portraitImage) {
    portraitHolder.appendChild(portraitImage);
  } else {
    portraitHolder.style.visibility = 'hidden';
    portraitHolder.style.display = 'none';
  }
}

/**
 * Just the rock's visits on the map.
 *
 * @return {Promise<void>}
 */
async function renderRockRoute() {
  console.group('Rendering route');
  const rockVisitsData = (await rockVisitsCollection.get()).docs.map(querySnapshot => querySnapshot.data());
  const coords = rockVisitsData.map(visit => new google.maps.LatLng(visit.gps.latitude, visit.gps.longitude));

  const bounds = new google.maps.LatLngBounds();
  coords.forEach(coord => bounds.extend(coord));
  window.bounds = bounds;
  console.info(`Added ${coords.length} coords to the bounds.`);

  map = new google.maps.Map(document.getElementById("map"), {
    center: bounds.getCenter(),
    mapTypeId: "terrain",
    clickableIcons: false,
    zoom: 15,
  });

  const flightPath = new google.maps.Polyline({
    path: coords,
    geodesic: true,
    strokeColor: "#00FF00",
    strokeOpacity: 1.0,
    strokeWeight: 2,
  });
  flightPath.setMap(map);
  map.fitBounds(bounds, 10);
  console.info(`Fit the map bounds to ${JSON.stringify(bounds.toJSON())}`);
  console.groupEnd();
}


function renderNewRock() {
  console.warn('Creating a new rock.');
  firebase.analytics().logEvent('rendering_newrock');

  let qr0 = qrcodegen.QrCode.encodeText(window.location, QRC.Ecc.MEDIUM);
  const image = new Image();
  const canvas = document.createElement("canvas");
  qr0.drawCanvas(8, 4, canvas);
  image.width = canvas.width;
  image.height = canvas.height;
  image.src = canvas.toDataURL("image/png");
  console.info(`Created QR code of '${window.location}'`);
}

async function main() {
  await blockUntilDOMReady();
  const pathMatch = window.location.pathname.match(/^\/([rv])\/([^\/]+)$/i);

  /**
   * Display just one of the possible states, hide the rest.
   *
   * @param {string} chosenClass
   */
  const displayOneOfRock = (chosenClass) => displayOneOf(chosenClass, ['knownRock', 'haveRock', 'noRock', 'newRock']);

  if (pathMatch) {
    rockId = pathMatch[2].toLocaleLowerCase().replace(/[^0-9a-z]+/g, '');
    console.info(`RockID: ${rockId}`);

    if (pathMatch[1] === 'r') {
      // If you arrived directly from a QR code, give super powers then redirect.
      firebase.analytics().logEvent('setting_qr_cookie', {
        rockId: rockId
      });
      setCookie('ableToLogVisit', 'true', 3);
      window.location.replace(`/v/${rockId}`);
      return;
    }

    await firebase.auth().signInAnonymously(); // auth.user.uid
    if (getCookie('ableToLogVisit') === 'true') {
      console.log('The cookie "ableToLogVisit" exists');
      ableToLogVisit = true;
    }

    firebase.analytics().logEvent('rendering_rock', {
      'ableToLogVisit': ableToLogVisit,
      'rockId': rockId,
    });
    rocksCollection = firebase.firestore().collection("rocks");

    /** @type {?firebase.firestore.DocumentReference} */
    const rockDocumentReference = rocksCollection.doc(rockId);
    rockDocumentSnapshot = await rockDocumentReference.get();
    if (rockDocumentSnapshot.exists) {
      console.info(`Rock '${rockId}' exists!`);
      if (ableToLogVisit) {
        // Good find!  Please log your visit.
        displayOneOfRock('haveRock');
      } else {
        // If you don't have the rock in hand, no logging a new location!
        displayOneOfRock('knownRock');
      }
      document.getElementById('log-visit').addEventListener('click', logVisit);
      rockData = rockDocumentSnapshot.data();
      rockVisitsCollection = rockDocumentReference.collection('visits').orderBy('ts');

      await Promise.all([renderRockText(), renderRockRoute(), renderRockPortrait()]);
    } else {
      displayOneOfRock('newRock');
      // TODO: renderNewRock
    }
  } else {
    displayOneOfRock('noRock');
  }
}

