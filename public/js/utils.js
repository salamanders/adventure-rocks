/*jshint esversion: 8 */
/*jshint unused:true */
/*globals firebase, main */
/*exported alertAndLog, getImageFbStorage, getImageWeb */
/*exported setCookie, getCookie, deleteCookie */
/*exported displayOneOf */

/**
 * Generic cookie setter with a limited number of hours.
 *
 * @param {string} name Cookie key
 * @param {string} value
 * @param {number=} hours
 * @param {string=} path
 */
const setCookie = (name, value, hours = 24, path = '/') => {
  const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}`;
};

/**
 * Generic cookie getter.
 *
 * @param {string} name Cookie key
 * @return {string}
 */
const getCookie = (name) => {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, '');
};

/**
 * Clobbers the cookie.
 *
 * @param {string} name Cookie key
 * @param {string=} path
 */
const deleteCookie = (name, path = '/') => {
  setCookie(name, '', -1, path);
};

/**
 * Prototype easy messages.
 * @param {string} msg
 */
function alertAndLog(msg) {
  firebase.analytics().logEvent('alert_and_log', {
    'message':msg
  });
  console.error(msg);
  alert(msg);
}

/**
 * Wait until doc is ready then continue execution
 * @return {Promise<*>}
 */
const blockUntilDOMReady = () => new Promise(resolve => {
  // Block on document being fully ready, in case we need to build a login button
  if (document.readyState === 'complete') {
    console.info(`Was already ready: document.readyState=${document.readyState}`);
    return resolve();
  }
  const onReady = () => {
    console.info(`Document now read: document.readyState=${document.readyState}`);
    document.removeEventListener('DOMContentLoaded', onReady, true);
    window.removeEventListener('load', onReady, true);
    return resolve();
  };
  document.addEventListener('DOMContentLoaded', onReady, true);
  window.addEventListener('load', onReady, true);
});

/**
 * Async get a single image from Firebase Storage
 * @throws lack of permissions or missing image
 * @param {string} path
 * @return {Promise<Image>}
 */
async function getImageFbStorage(path) {
  console.group(`getImageFbStorage(${path})`);
  const rockPortraitRef = firebase.storage().ref().child(path);
  const url = await rockPortraitRef.getDownloadURL();
  const image = await getImageWeb(url);
  console.groupEnd();
  return image;
}

/**
 * Async get a single image from web URL
 *
 * @param {string} path
 * @return {Promise<Image>}
 */
const getImageWeb = (path) => new Promise((resolve, reject) => {
  console.group(`getImageWeb(${path})`);
  const dynamicImage = new Image();
  dynamicImage.onload = () => {
    console.info(`getImageWeb success '${path}'`);
    console.groupEnd()
    return resolve(dynamicImage);
  };
  dynamicImage.onerror = (e) => {
    const error = `No web image at '${dynamicImage.src}' because ${e}.`;
    console.warn(error);
    console.groupEnd();
    return reject(error);
  };
  dynamicImage.src = path;
});

/**
 * Display just one of the possible states, hide the rest.
 *
 * @param {string} chosenClass
 * @param {Array<string>} classNames
 */
function displayOneOf(chosenClass, classNames) {
  const globalSwitch = classNames.map(cn => `.${cn}`).join(', ');
  console.info(`Switching '${globalSwitch}' to '${chosenClass}'`);
  for (let el of document.querySelectorAll(globalSwitch)) {
    if (el.classList.contains(chosenClass)) {
      el.style.visibility = 'visible';
      el.style.display = 'block';
    } else {
      el.style.visibility = 'hidden';
      el.style.display = 'none';
    }
  }
}

// Bootstrap (Launch a "main" function when scripts are all loaded.)
blockUntilDOMReady().then(() => main());
