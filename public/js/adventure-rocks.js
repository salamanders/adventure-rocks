/*globals firebase, ol  */
/*jshint esversion: 8 */
/*jshint unused:true */
/*exported main */


/**
 * @type {?String}
 */
let rockId = null;


/**
 * @type {?firebase.firestore.CollectionReference}
 */
let rocksCollection = null;

/**
 * @type {?firebase.firestore.DocumentSnapshot}
 */
let rockDocumentSnapshot = null;

/**
 * @type {?Object}
 */
let rockData = null;


/**
 * @type {?firebase.firestore.CollectionReference}
 */
let rockVisitsCollection = null;

/**
 * @type {?Array<Object>}
 */
let rockVisitsData = null;

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

function renderRock() {
  document.querySelectorAll(".rockName").forEach(nameSpan => nameSpan.textContent = rockData.name);
  document.getElementById('rock-likes').innerHTML = rockData.likes.map(like => `<li>${like}</li>`).join(' ');
  document.getElementById('rock-dislikes').innerHTML = rockData.dislikes.map(dislike => `<li>${dislike}</li>`).join(' ');

  console.info('Rendering optional portrait');
  const rockPortrait = new Image();
  rockPortrait.portraitHolder = document.getElementById('rockPortrait');
  rockPortrait.onload = () => {
    console.info('Found a rock portrait.');
    rockPortrait.portraitHolder.appendChild(rockPortrait);
  };
  rockPortrait.onerror = () => {
    console.warn(`No rock portrait at '${rockPortrait.src}'.`);
    rockPortrait.portraitHolder.style.visibility = 'hidden';
    rockPortrait.portraitHolder.style.display = 'none';
  };
  rockPortrait.src = `/img/rocks/${rockId}.jpg`;

  // If you don't have the rock in hand, no logging a new location!
  if (!window.location.pathname.startsWith('/r/')) {
    for (let el of document.querySelectorAll('.haveRock')) {
      el.style.visibility = 'hidden';
      el.style.display = 'none';
    }
  }
}

function renderRockRoute() {
  console.group('Rendering route');
  const centerLocation = rockVisitsData.reduce((accumulator, currentValue, index, array) => {
    return {
      latitude: accumulator.latitude + currentValue.gps.latitude / array.length,
      longitude: accumulator.longitude + currentValue.gps.longitude / array.length
    };
  }, {latitude: 0, longitude: 0});

  const map = new ol.Map({
    target: 'map',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      })
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([centerLocation.longitude, centerLocation.latitude]),
      zoom: 8
    })
  });

  console.info(rockVisitsData);
  if (rockVisitsData.length > 1) {
    const coords = rockVisitsData.map(visit => [visit.gps.longitude, visit.gps.latitude]);
    console.info(`Visit coords: ${JSON.stringify(coords)}`);
    const lineString = new ol.geom.LineString(coords);
    lineString.transform('EPSG:4326', 'EPSG:3857');
    const feature = new ol.Feature({
      geometry: lineString,
      name: 'Line'
    });
    const lineStyle = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: '#52ff33',
        width: 5
      })
    });
    const source = new ol.source.Vector({
      features: [feature]
    });
    const vector = new ol.layer.Vector({
      source: source,
      style: [lineStyle]
    });
    map.addLayer(vector);
  } else {
    console.warn(`Need more than ${rockVisitsData.length} visit!`);
  }
  console.groupEnd();
}

function renderUnknownRock() {
  console.warn('No rock specified.');
  firebase.analytics().logEvent('rendering_default');

  for (let el of document.querySelectorAll('.knownRock')) {
    el.style.visibility = 'hidden';
    el.style.display = 'none';
  }

  for (let el of document.querySelectorAll('.unknownRock')) {
    el.style.visibility = 'visible';
    el.style.display = 'block';
  }
}

async function main() {
  await blockUntilDOMReady();
  const pathMatch = window.location.pathname.match(/^\/([rv])\/([^\/]+)$/i);
  if (pathMatch) {
    firebase.analytics().logEvent('rendering_rock');
    rockId = pathMatch[2].toLocaleLowerCase().replace(/[^0-9a-z]+/g, '');
    console.info(`RockID: ${rockId}`);
    rocksCollection = firebase.firestore().collection("rocks");
    /**
     * @type {?firebase.firestore.DocumentReference}
     */
    const rockDocumentReference = rocksCollection.doc(rockId);
    rockDocumentSnapshot = await rockDocumentReference.get();
    document.getElementById('log-visit').addEventListener('click', logVisit);
    rockData = rockDocumentSnapshot.data();
    rockVisitsCollection = rockDocumentReference.collection('visits');
    rockVisitsData = (await rockVisitsCollection.get()).docs.map(querySnapshot => querySnapshot.data());
    renderRock();
    renderRockRoute();
  } else {
    renderUnknownRock();
  }
}
