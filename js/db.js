/* Structure of indexedDB is as follows

One database

An object store called system for general settings and things
An object store called pillTypes containing the pill types in use
One object store called history for consumption history
*/

// Establish database if it doesn't already exist.
version = 1;

// Check for support.
if (!('indexedDB' in window)) {
  console.log("This browser doesn't support IndexedDB.");
}

const request = indexedDB.open('pilltracker', 3);
let db; //scope cowboy

request.onupgradeneeded = function(event) {
  db = event.target.result;
  tx = event.target.transaction;
  
  console.log('Creating a new object store.');

  if (!db.objectStoreNames.contains('system')) {
    const objectStore = db.createObjectStore('system');
    console.log('Created system object store.');
  } else {
    console.log('system object store already exists.');
  }

  if (!db.objectStoreNames.contains('history')) {
    db.createObjectStore('history', { keyPath: 'timestamp' });
    console.log('Created history object store.');
  } else {
    console.log('history object store already exists.');
  }

  //create index for history if it doesn't exist

  if (!tx.objectStore('history').indexNames.contains('pill')) {
    tx.objectStore('history').createIndex('pill', 'pill', { unique: false });
    console.log('Created pill index.');
  } else {
    console.log('pill index already exists.');
  }
};

request.onsuccess = function(event) {
  db = event.target.result;
  console.log('Database opened successfully.');
  
  // Perform further operations with the opened database here
};

request.onerror = function(event) {
  console.error('Failed to open the database:', event.target.error);
};

// Function to add a pill to history
function addPillToHistory(pill, timestamp) {

  //check incoming data for errors
  if (!pill || !timestamp) { //empty
    console.log('Pill or timestamp is empty');
    return;
  } /*else if (!timestamp instanceof Date) { //now using ISO 8601
    console.log('Timestamp is not a date object');
  }*/

    const tx = db.transaction('history', 'readwrite');
    tx.objectStore('history').add({ pill: pill, timestamp: timestamp });
    tx.oncomplete = function () {
      console.log('Recorded ' + pill + ' at ' + timestamp);
    };
} 

// Function to check if another pill can be taken by looking back in history
function canTakePill(pill) {
  return new Promise((resolve, reject) => {
  console.log('canTakePill ' + pill);
  // Check incoming data for errors
  if (!pill) { // Empty
    console.log('Pill is empty');
    return;
  }
  //TODO - undefined behaviour if pill exists but no history is found
  //TODO - double check logic if both checks are positive
  
  const currentTimestamp = new Date();
  const fourHoursInMilliseconds = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

  const pillHistorySummary = {}; // This is the return object
  const pillHistorySummaryLastPill = {}; // for the first check
  const pillHistorySummary24h = {}; // for the second check

  // Get last pill that matches pill type
  const getLastPillPromise = new Promise((resolve, reject) => {
    getLastPill(pill, function(lastPill) {
      console.log('  getLastPill callback in canTakePill ' + pill);
      if (lastPill) {
        //console.log('Last pill was ' + lastPill.pill + ' at ' + lastPill.timestamp);
        // Check if last pill is within 4 hours
        const lastPillTimestamp = new Date(lastPill.timestamp);

        if (currentTimestamp - lastPillTimestamp < fourHoursInMilliseconds) {
          //console.log('Last pill is within 4 hours');
          pillHistorySummaryLastPill.canTakePill = false;
          pillHistorySummaryLastPill.canTakeMoreAt = lastPillTimestamp;
          pillHistorySummaryLastPill.canTakeMoreAt.setHours(pillHistorySummaryLastPill.canTakeMoreAt.getHours() + 4);
          pillHistorySummaryLastPill.reason = 'hourLimitReached';
        } else {
          //console.log('Last pill is not within 4 hours');
          pillHistorySummaryLastPill.canTakePill = true;
          pillHistorySummaryLastPill.lastTakenAt = lastPillTimestamp;
        }
      } else {
        console.log('    ' + pill + ' not found in history');
        pillHistorySummaryLastPill.canTakePill = true;
        pillHistorySummaryLastPill.lastTakenAt = null;
      }
      resolve();
    });
  });

  // Now check the last 24 hours. This is done as a separate check to make sure the time for the next pill is accurate
  const pillsInLastDayPromise = new Promise((resolve, reject) => {
    pillsInLastDay(pill, function(pillsInLastDay) {
      console.log('  pillsInLastDay callback in canTakePill ' + pill);
      if (pillsInLastDay) {
        // console.log(pillsInLastDay.value + ' pills in last 24 hours');
        if (pillsInLastDay.value >= 4) {
          // console.log('More than or equal to 4 pills in last 24 hours');
          pillHistorySummary24h.canTakePill = false;

          pillHistorySummary24h.canTakeMoreAt = new Date(pillsInLastDay.timestamp);
          pillHistorySummary24h.canTakeMoreAt.setDate(pillHistorySummary24h.canTakeMoreAt.getDate() + 1);

        } else {
          // console.log('Less than 4 pills in last 24 hours');
          pillHistorySummary24h.canTakePill = true;
        }
      } else {
        console.log('    ' + pill + ' not found in history');
        pillHistorySummary24h.canTakePill = true;
        pillHistorySummaryLastPill.lastTakenAt = null;
      }
      resolve();
    });
  });

  // Wait for both promises to resolve before continuing
  Promise.all([getLastPillPromise, pillsInLastDayPromise])
    .then(() => {
      console.log('  All promises resolved in canTakePill ' + pill);
      // resolve information
      if (pillHistorySummary.canTakePill = 
          pillHistorySummaryLastPill.canTakePill && pillHistorySummary24h.canTakePill) 
      { //note that that was declaritive not evaluative, it's based on the assigned value of canTakePill
        pillHistorySummary.lastTakenAt = pillHistorySummaryLastPill.lastTakenAt;
      } else if (pillHistorySummary24h.canTakePill && !pillHistorySummaryLastPill.canTakePill) {
        // if it's the short duration check only that failed, use those values
        pillHistorySummary.reason = 'hourLimitReached';
        pillHistorySummary.canTakeMoreAt = pillHistorySummaryLastPill.canTakeMoreAt;
      } else if (pillHistorySummaryLastPill.canTakePill && !pillHistorySummary24h.canTakePill) {
        // if it's the long duration check only that failed, use those values
        pillHistorySummary.reason = 'dayLimitReached';
        pillHistorySummary.canTakeMoreAt = pillHistorySummary24h.canTakeMoreAt;
      } else {
        // both checks must have failed. Establish which one provides the latest limit
        if (pillHistorySummaryLastPill.canTakeMoreAt > pillHistorySummary24h.canTakeMoreAt) {
          pillHistorySummary.reason = 'hourLimitReached';
          pillHistorySummary.canTakeMoreAt = pillHistorySummaryLastPill.canTakeMoreAt;
        } else {
          pillHistorySummary.reason = 'dayLimitReached';
          pillHistorySummary.canTakeMoreAt = pillHistorySummary24h.canTakeMoreAt;
        }
      }
      console.log(pillHistorySummary);
      resolve(pillHistorySummary); //might have to move this to the end
    })
    .catch(error => {
      console.error('An error occurred:', error);
    });
    //resolve(pillHistorySummary); //might have to move this to the end  
  })
  }

function getLastPill(pill, callbackLastPill) {
  // deliver a callback pill object (pill.pill, pill.timestamp)

  console.log('  getLastPill ' + pill);
  const tx = db.transaction('history', 'readonly');
  const store = tx.objectStore('history');
  const index = store.index('pill');
  const request = index.openCursor(IDBKeyRange.only(pill), 'prev');

  request.onsuccess = function(event) {
    console.log('    getLastPill success ' + pill)
    const cursor = event.target.result;
    if (cursor) { 
      const lastPill = cursor.value;
      callbackLastPill(lastPill);
    } else {
      callbackLastPill(null);
    }
  };

  request.onerror = function(event) {
    // console.error('Failed to get the last pill:', event.target.error);
    callbackLastPill(null);
  };
}

function pillsInLastDay(pill, callbackPillsInLastDay) {
  console.log('  pillsInLastDay', pill);
  const callbackThis = [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1); // Subtract 1 day from the current date
  const endDate = new Date(); //Now
  
  const tx = db.transaction('history', 'readonly');
  const store = tx.objectStore('history');


  const range = IDBKeyRange.bound(startDate.toISOString(), endDate.toISOString());

  const request = store.getAll(range);

  request.onsuccess = function(event) {
    var result = event.target.result;
    // console.log('Values from the last 24 hours:', result);
  
    // iterate through and delete anything where result[i].pill !== pill
    var i = result.length;
    while (i--) {
      if (result[i].pill !== pill) {
        // delete from results array
        result.splice(i, 1);
      }
    }
  
    // console.log('Pruned values from the last 24 hours:', result);
  
    callbackThis.value = result.length;
    if (result.length < 4) {
      callbackThis.timestamp = null;
    } else {
      callbackThis.timestamp = result[3].timestamp; // the 4th entry
      // console.log('Can take more at ', callbackThis.timestamp + ' plus 24 hours');
    }
  
    callbackThis.valueOf = function() {
      return Number(this.value);
    };
    
    console.log('    pillsInLastDay success ' + pill)
    callbackPillsInLastDay(callbackThis);
  };

  request.onerror = function(event) {
    //console.error('Failed to find pills:', event.target.error);
    callbackPillsInLastDay(null);
  };
}

// Pull entire history as an array of objects.
function getHistory() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readonly');
    const store = tx.objectStore('history');

    const request = store.getAll();

    request.onsuccess = function(event) {
      const result = event.target.result;
      resolve(result);
    };

    request.onerror = function(event) {
      const error = event.target.error;
      reject(error);
    };
  });
}

// Wait for the database connection to be established
function waitForDBConnection() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pilltracker');

    request.onsuccess = function(event) {
      const db = event.target.result;
      resolve(db);
    };

    request.onerror = function(event) {
      reject(event.target.error);
    };
  });
}