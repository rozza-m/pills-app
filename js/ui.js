// Add event listeners
var mask = document.querySelector('#mask');
var ampmselector = document.querySelectorAll('.ampm .selector');
var submitbutton = document.querySelectorAll('button.submit');
var upselector = document.querySelectorAll('.upselector');
var downselector = document.querySelectorAll('.downselector');
var leftselector = document.querySelectorAll('.leftselector');
var rightselector = document.querySelectorAll('.rightselector');
var dialog = document.querySelectorAll('dialog');
var header = document.querySelector('body>header');
var clearbutton = document.querySelector('button.clear-all');
var deletebutton = document.querySelector('button.delete');
var donebutton = document.querySelector('button#settings-done');
var clearrequestbutton = document.querySelector('button#clear-all-show-dialog');


//sort out initial url
var initialUrl = window.location.href;
//test for hashes
if (initialUrl.includes('#')) {
    //remove everything including and after it
    initialUrl = initialUrl.split('#')[0];
    //replace initial url
    history.replaceState({}, '', initialUrl);
}


//Add onLoad and timers
window.onload = function() {
    waitForDBConnection().then((db)=>{
        // Perform any necessary operations with the database here
        // ...

        renderGrid(); 

        // Run the function every 20 seconds
        setInterval(updatePillStatusOnGrid, 20000);
    }
    ).catch((error)=>{
        console.error('Error occurred while establishing database connection:', error);
    }
    );
}


/* EVENT HANDLERS */

//click on header -> check for click location; if historymenuitem was clicked, activate history; same for settings, otherwise clear both
header.addEventListener('click', function(event) { 

    if (event.target.closest('#history-menu-item')) {
        if(document.querySelector('body').classList.toggle('history')) {
            showAndPushHistorypage();
        } else {
            showAndPopRoot();
        }
        document.querySelector('body').classList.toggle('settings', false);
    } else if (event.target.closest('#settings-menu-item')) {
        if(document.querySelector('body').classList.toggle('settings')){
            showAndPushSettingsPage()
        } else {
            showAndPopRoot();
        }
        document.querySelector('body').classList.toggle('history', false); //if box
        
    } else {
        document.querySelector('body').classList.toggle('history', false);
        document.querySelector('body').classList.toggle('settings', false);
        showAndPopRoot();
    }
    
})

donebutton.addEventListener('click', function() {
    document.querySelector('body').classList.toggle('settings', false);
    showAndPopRoot();
})


//click on am/pm -> toggles
for (var i = 0; i < ampmselector.length; i++) {
    ampmselector[i].addEventListener('click', function() {
        flipAmPm();
    });
}

//click on upselector -> increases adjacent content by 1
for (var i = 0; i < upselector.length; i++) {
    upselector[i].addEventListener('click', function(event) {
        if (this.parentElement.parentElement.classList.contains('minute'))
            incrementMinute(1);
        if (this.parentElement.parentElement.classList.contains('hour'))
            incrementHour(1);
    });
}

//click on downselector -> decreases adjacent content by 1
for (var i = 0; i < downselector.length; i++) {
    downselector[i].addEventListener('click', function(event) {
        if (this.parentElement.parentElement.classList.contains('minute'))
            incrementMinute(-1);
        if (this.parentElement.parentElement.classList.contains('hour'))
            incrementHour(-1);
    });
}

//click on leftselector -> decreases data-day-offset by 1 and replaces text appropriately
for (var i = 0; i < leftselector.length; i++) {
    leftselector[i].addEventListener('click', function(event) {
        incrementDate(-1);

    });
}

//click on rightselector -> increases data-day-offset by 1 and replaces text appropriately
for (var i = 0; i < rightselector.length; i++) {
    rightselector[i].addEventListener('click', function(event) {
        incrementDate(1);
    });
}

//click on submit button -> unpops and adds to history
for (var i = 0; i < submitbutton.length; i++) {
    submitbutton[i].addEventListener('click', function(event) {
        compileDoseAndSubmit();
        destroyDialog();
    });
}

//click on dialog -> check if click was inside dialog area
for (var i = 0; i < dialog.length; i++) {
    (function(index) {
      var dialogArray = Array.from(dialog); // Convert array-like object to array
      dialogArray[index].addEventListener('click', function(event) {
        const dialogRect = dialogArray[index].getBoundingClientRect();
        const isInsideDialog = (event.clientX >= dialogRect.left && event.clientX <= dialogRect.right && event.clientY >= dialogRect.top && event.clientY <= dialogRect.bottom);
        if (!isInsideDialog) {
          destroyDialog(true);
        }
      });
    })(i);
  }

//click on clearrequestbutton -> show clear dialog
clearrequestbutton.addEventListener('click', function(event) {
    history.pushState({}, '', '#clearalldialog');

            console.log('Showing clear all dialog');

            //show dialog as modal
            dialog = document.querySelector('dialog.clearall');
            dialog.showModal();
})

//click on clear all data -> clears all data
clearbutton.addEventListener('click', function(event) {
    clearAllData();
    //this also reloads app
})

//click on delete button -> removes from history
deletebutton.addEventListener('click', function(event) {
    destroyDialog(true);
    deleteHistoryEntry(this.dataset.time);
    fillHistory();
})



//event listeners that are added dynamically

//click on each pill -> pops and fills time. This one is not called automatically because the list is built dynamically
function addEventListenerToPills() {
    var pills = document.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) {
        pills[i].addEventListener('click', function () {

            const pill = this.dataset.pill;

            history.pushState({}, 'dialog', `#record-dose-${pill}`);

            console.log('Showing recorddose dialog for' + pill)

            //show dialog as modal
            dialog = document.querySelector('dialog.recorddose');
            dialog.showModal();

            var dateelement = dialog.querySelector('.date .content');
            var hourelement = dialog.querySelector('.hour .content');
            var minuteelement = dialog.querySelector('.minute .content');
            var ampmelement = dialog.querySelector('.ampm .content');

            //date is relative
            dateelement.setAttribute('data-day-offset', '0');
            dateelement.innerHTML = 'Today';

            //get current browser time in local timezone
            var now = new Date();
            //this is in local timezone
            var hours = now.getHours();
            var minutes = now.getMinutes();
            //format and convert to 12h
            var ampm = now.getHours() >= 12 ? 'pm' : 'am';
            if (hours > 12) {
                hours -= 12;
            }
            if (minutes < 10) {
                minutes = '0' + minutes;
            }

            //set innerHTML of hourelement to current hour
            hourelement.innerHTML = hours;
            //set innerHTML of minuteelement to current minute
            minuteelement.innerHTML = minutes;

            ampmelement.innerHTML = ampm;

            //Populate content
            canTakePill(this.dataset.pill)
                .then((result) => {
                    dialog.querySelector('header').innerHTML = pill;
                    dialog.dataset.pill = pill;

                    var guidance1 = dialog.querySelector('.guidance-part-1');
                    var guidance2 = dialog.querySelector('.guidance-part-2');
                    var guidanceTime = dialog.querySelector('.guidance-time');

                    guidance1.innerHTML = '';
                    guidance2.innerHTML = '';
                    guidanceTime.innerHTML = '';

                    if (result.canTakePill) {
                        dialog.querySelector('button.submit').classList.toggle('can-take', true);
                        dialog.querySelector('button.submit').classList.toggle('dont-take', false);
                        if (result.lastTakenAt) {
                            var timeAgo = new Date() - result.lastTakenAt;
                            guidance1.innerHTML = 'Last taken ' + formatDuration(timeAgo);
                        } else {
                            guidance1.innerHTML = 'No doses recorded yet';
                        }
                    } else {
                        dialog.querySelector('button.submit').classList.toggle('can-take', false);
                        dialog.querySelector('button.submit').classList.toggle('dont-take', true);
                        if (result.reason == 'hourLimitReached') {
                            guidance1.innerHTML = 'Your last dose was less than ' + pillTypes[pill].hoursBetweenDoses + ' hours ago.';
                        } else {
                            guidance1.innerHTML = 'You\'ve recorded ' + pillTypes[pill].maxDosesPerDay + ' or more doses in the last 24 hours.';
                        }
                        guidance2.innerHTML = 'Advise waiting until ';
                        guidanceTime.innerHTML = result.canTakeMoreAt.toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        });
                    }
                })
                .catch((error) => {

                    console.log(error);

                    dialog.querySelector('header').innerHTML = this.dataset.pill;
                    dialog.dataset.pill = this.dataset.pill;

                    var guidance1 = dialog.querySelector('.guidance-part-1');
                    var guidance2 = dialog.querySelector('.guidance-part-2');
                    var guidanceTime = dialog.querySelector('.guidance-time');

                    guidance1.innerHTML = 'Something went wrong:';
                    guidance2.innerHTML = error;
                    guidanceTime.innerHTML = '';

                });


        });
    }
}

//click on #pill-list li -> toggle pill active function. This one is not called automatically because the list is built dynamically
function addEventListenerToSettingsList() {
    var pills = document.querySelectorAll('#pill-list li');
    for (var i = 0; i < pills.length; i++) {
        pills[i].addEventListener('click', function (event) {
            event.stopPropagation();
            togglePillActive(this);
        });
    }
}

//click on any history entry #history div.pill-row -> update info in dialog and show as modal
function addEventListenerToHistoryEntry() {
    var pills = document.querySelectorAll('#history div.pill-row-container');
    for (var i = 0; i < pills.length; i++) {
        pills[i].addEventListener('click', function (event) {
            event.stopPropagation();
            showClearHistoryModal(this.dataset.pill, this.dataset.timestamp, this.dataset.friendlyTime);
        });
    }
}

function showClearHistoryModal(pill, timestamp, friendlyTime) {
    console.log('showClearHistoryModal');
    console.log('pill: ' + pill);
    console.log('timestamp: ' + timestamp);
    console.log('friendlyTime: ' + friendlyTime);

    history.pushState({}, 'dialog', '#clear-history-'+timestamp);

    clearHistoryModal = document.querySelector('dialog.deletepillfromhistory');

    clearHistoryModal.querySelector('#pill-name').innerHTML = pill;
    clearHistoryModal.querySelector('#pill-time').innerHTML = friendlyTime;
    clearHistoryModal.querySelector('button.delete').dataset.time = timestamp;

    clearHistoryModal.showModal();

}

/* MUSTACHE BUILDING FUNCTIONS */

function renderGrid() {
    console.log('renderGrid');

    //const template = document.querySelector('#grid').innerHTML;
    const template = document.getElementById('pill-grid-template').innerHTML;

    loadActivePillList()
        .then((activePillList) => {
            console.log('renderGrid: loaded ' + activePillList.length + ' pills, rendering grid now');
            renderGridContent(template, activePillList);
            addEventListenerToPills();
            updatePillStatusOnGrid();
        })
        .catch((error) => {
            console.error('Error occurred while loading active pill list:', error);
        });

    console.log('renderGrid complete');
}

function renderGridContent(template, pillList) {
    console.log('  renderGridContent');
    const renderedHtml = mustache(template, pillList);
    if (renderedHtml) {
        document.querySelector('#grid').innerHTML = renderedHtml;
    } else {
        // No pills are configured yet.
        document.querySelector('#grid').innerHTML = '<div id="no-pills-configured"><h1>No medications set up yet</h1><button id="add-pill-button">Set up now</button>';
        document.querySelector('#add-pill-button').addEventListener('click', function () {
            document.querySelector('body').classList.toggle('settings')
            renderSettingsPillsList();
            history.replaceState({}, '', '/'); //kill history so we're only one level from root
            history.pushState({state: 'settings'}, '', '#settings');
            console.log('settings');
        })
        
    }
    console.log('  renderGridContent complete');
}

function renderSettingsPillsList() {
    console.log('renderSettingsPillsList');

    //const template = document.querySelector('#pill-list').innerHTML;
    const template = document.getElementById('pill-list-template').innerHTML;
    var pillList = pillTypes;

    loadActivePillList()
        .then((activePillList) => {
            console.log('renderSettingsPillsList: loaded pills, ' + activePillList.length + ' pills in use, rendering list now');

            for (const pillName in pillList) {
                if (pillList.hasOwnProperty(pillName)) {
                  const pill = pillList[pillName];
                  // Perform operations with the pill object
                  // Example: Add additional info active: true if pill is in activePillList
                  pill.active = activePillList.some((activePill) => activePill.pill === pillName);
                }
              }
            renderSettingsPillsListContent(template, pillList);
            addEventListenerToSettingsList();
        })
        .catch((error) => {
            console.error('Error occurred while loading active pill list:', error);
        })

    console.log('renderSettingsPillsList complete');
}

function renderSettingsPillsListContent(template, pillList) {
    console.log('  renderSettingsPillsListContent');
    const renderedHtml = mustache(template, Object.values(pillList));
    document.querySelector('#pill-list').innerHTML = renderedHtml;
    console.log('  renderSettingsPillsListContent complete');
}

/* NAVIGATION */
function showAndPushHistorypage() { //this doesn't actually change the body class
    fillHistory();
    history.replaceState({}, '', initialUrl); //kill history so we're only one level from root
    history.pushState({state: 'history'}, '', initialUrl + '#history');
    console.log('history');
}

function showAndPushSettingsPage() { //this doesn't actually change the body class
    renderSettingsPillsList();
    history.replaceState({}, '', initialUrl); //kill history so we're only one level from root
    history.pushState({state: 'settings'}, '', initialUrl + '#settings');
    console.log('settings');
}

function showAndPopRoot(){ //this doesn't actually change the body class
    renderGrid(); 
    history.replaceState({}, '', initialUrl);
    console.log('root');
}

/* BEHAVIOURS */

//handle back button being pressed

let previousState;
window.onpopstate = function(event) {
    console.log(
        `location: ${document.location}, state: ${JSON.stringify(event.state)}`,
    );
  if (event.state === null || event.state === undefined || Object.keys(event.state).length === 0) {
    // The user navigated to /
    console.log('Navigated to /');
    if (document.querySelector(':scope dialog[open]')) {
        destroyDialog(true);
        console.log('Destroyed dialog');
    }
    document.querySelector('body').classList.toggle('history', false);
    document.querySelector('body').classList.toggle('settings', false);
    history.replaceState({}, '', '/'); //kill history
  //else if event.state is 'dialog'
  } else if (event.state.state === 'dialog') {
    // The user navigated to /a dialog
    console.log('Attempted to navigate to a dialog, cancelling');
    history.go(-1);
      
  } else if (event.state.state === 'history') {
    console.log('Navigated to history');
    document.querySelector('body').classList.toggle('history', true);
    fillHistory();
    document.querySelector('body').classList.toggle('settings', false);
  } else if (event.state.state === 'settings') {
    console.log('Navigated to settings');
    renderSettingsPillsList();
    document.querySelector('body').classList.toggle('history', false);
    document.querySelector('body').classList.toggle('settings', true);
  } else {
    console.log('Something else happened:');
    console.log(event.state);
  }

  previousState = event.state;
}



//destroy popup
function destroyDialog(immediately = false) {
    //find first dialog with the "open" attribute
    const dialog = document.querySelector(':scope dialog[open]');

    dialog.classList.toggle('leaving', true);
    if (immediately) dialog.classList.toggle('leaving-fast', true);
    //close dialog in 500ms
    setTimeout(()=>{
        dialog.close();

        setTimeout(() => {
            dialog.classList.toggle('leaving', false);
            dialog.classList.toggle('leaving-fast', false);
        }, 25);
    }
    , (immediately? 300: 500));

    history.replaceState(null, null, document.location.pathname); //replace history. this should remove the dialog from the back stack....?
}

//increment or decrement date
function incrementDate(increment) {
    var contentElement = document.querySelector('dialog.recorddose .date .content');
    var dayOffset = parseInt(contentElement.dataset.dayOffset);
    dayOffset += increment;
    if (dayOffset > 1)
        dayOffset = 1;
    //clamp to tomorrow
    contentElement.dataset.dayOffset = dayOffset.toString();

    //replace text as appropriate
    if (dayOffset == 1) {
        contentElement.innerHTML = 'Tomorrow';
    } else if (dayOffset === 0) {
        contentElement.innerHTML = 'Today';
    } else if (dayOffset === -1) {
        contentElement.innerHTML = 'Yesterday';
    } else {
        // if it's before yesterday, format as DDDD DD MM
        const today = new Date();

        const targetDate = new Date();
        targetDate.setDate(today.getDate() + dayOffset);

        const options = {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        };
        const formattedDate = targetDate.toLocaleDateString('en-US', options);

        contentElement.innerHTML = formattedDate;

    }

}

//increment or decrement hour
function incrementHour(increment) {
    var contentElement = document.querySelector('dialog.recorddose .hour .content');
    const hourValue = parseInt(contentElement.innerHTML);
    var newHourValue = hourValue + increment;
    if (newHourValue > 12) {
        newHourValue = 1;
    } else if (newHourValue < 1) {
        newHourValue = 12;
    }

    if (newHourValue == 12 && hourValue == 11 ) { //we've gone forwards, need to flip am/pm
        if (flipAmPm() == "PmToAm") {
            incrementDate(1);
        }
    } else if (newHourValue == 11 && hourValue == 12) { //we've gone backwards, need to flip am/pm
        if (flipAmPm() == "AmToPm") {
            incrementDate(-1);
        }
    }
    contentElement.innerHTML = newHourValue.toString();
}

//increment or decrement minute
function incrementMinute(increment) {
    var contentElement = document.querySelector('dialog.recorddose .minute .content');
    var minuteValue = parseInt(contentElement.innerHTML);
    minuteValue += increment;
    if (minuteValue > 59) {
        minuteValue = 0;
        incrementHour(1);
    } else if (minuteValue < 0) {
        minuteValue = 59;
        incrementHour(-1);
    }
    contentElement.innerHTML = minuteValue.toString().padStart(2, '0');
}

//flip am/pm of timespinner
function flipAmPm() {
    var contentElement = document.querySelector('dialog.recorddose .ampm .content');
    if (contentElement.textContent === 'AM') {
        contentElement.textContent = 'PM';
        return "AmToPm";
        //signals that a day might have changed if used from another function
    } else {
        contentElement.textContent = 'AM';
        return "PmToAm";
        //signals that a day might have changed if used from another function
    }
}

//Collect values from dialog and send them to be recorded
function compileDoseAndSubmit() {

    const pillId = document.querySelector('dialog.recorddose').dataset.pill;

    const hour = document.querySelector('dialog.recorddose .hour .content').innerHTML;
    const minute = document.querySelector('dialog.recorddose .minute .content').innerHTML;
    const ampm = document.querySelector('dialog.recorddose .ampm .content').innerHTML;
    const dayOffset = document.querySelector('dialog.recorddose .date .content').dataset.dayOffset;

    var date = new Date();
    const now = new Date();
    //creating Date without any arguments gives today
    date.setHours(parseInt(hour, 10));
    date.setMinutes(parseInt(minute, 10));
    //if .ampm has pm element, we are in pm and need to add 12
    if (ampm === 'pm') {
        date.setHours(date.getHours() + 12);
    }
    date.setDate(date.getDate() + parseInt(dayOffset));

    var isoDate = date.toISOString();

    console.log('Adding pill', pillId, 'at', isoDate);
    addPillToHistory(pillId, isoDate);

    updatePillStatusOnGrid();
}

//fill in the status of pills, for each pill on the grid.
function updatePillStatusOnGrid() {
    console.log('updatePillStatusOnGrid');
    const pills = Array.from(document.querySelectorAll('.pill'));

    pills.forEach((pill)=>{
        const pillType = pill.id;
        const article = pill.querySelector('article');

        canTakePill(pillType).then((result)=>{
            if (result.canTakePill) {
                pill.classList.toggle('dont-take', false);
                if (result.lastTakenAt) {
                    pill.classList.toggle('can-take', true);
                    var timeAgo = new Date() - result.lastTakenAt;
                    article.textContent = 'Last taken ' + formatDuration(timeAgo);
                } else {
                    //hasn't been recorded before
                    article.textContent = 'No previous doses recorded';
                }
            } else {
                pill.classList.toggle('can-take', false);
                pill.classList.toggle('dont-take', true);
                article.textContent = 'Advise waiting until ' + result.canTakeMoreAt.toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }
        }
        ).catch((error)=>{
            console.error('Error occurred while checking pill status:', error);
            article.textContent = 'There was an error.';
        }
        );
    }
    );
    console.log('updatePillStatusOnGrid complete');
}

//crawl the history of pills and add them to the history list
function fillHistory() {
    var historyListElement = document.querySelector('#history-list');
    historyListElement.innerHTML = '';

    getHistory()
        .then((result) => {
            
            console.log(result);
            createHistoryDivs(result, historyListElement);

        })
        .catch((error) => {
            // Handle any errors that occurred during the execution
            console.error(error);
        });
}

function createHistoryDivs(historyData) {
    let previousDay = null;
    const historyContainer = document.getElementById('history-list');
  
    historyData.reverse().forEach((item) => {
      const { pill, timestamp } = item;
      const currentDay = new Date(timestamp).toLocaleDateString();
      
      let dayText;
      const today = new Date().toLocaleDateString();
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
      const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString();
      
      if (currentDay === today) {
        dayText = 'Today';
      } else if (currentDay === yesterday) {
        dayText = 'Yesterday';
      } else if (currentDay === tomorrow) {
        dayText = 'Tomorrow';
      } else {
        dayText = new Date(timestamp).toLocaleDateString([], {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        });
      }
  
      if (currentDay !== previousDay) {
        // Create a header row with the new date
        const headerDiv = document.createElement('div');
        //headerDiv.innerHTML = dayText;
        headerDiv.innerHTML = `<div class="date-row">${dayText}</div>`
        historyContainer.appendChild(headerDiv);
        previousDay = currentDay;
      }
  
      // Create a div for the pill and timestamp
      const pillDiv = document.createElement('div');
      pillDiv.classList.add('pill-row-container');
      //pillDiv.textContent = `Pill: ${pill} | Timestamp: ${timestamp}`;
      const timeString = new Date(timestamp).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
        });
      pillDiv.innerHTML = `<div class="pill-row"><span class="history-pill">${pill}</span><span class="history-time">${timeString}</span></div>`;
      pillDiv.dataset.pill = pill;
      pillDiv.dataset.timestamp = timestamp;
      pillDiv.dataset.friendlyTime = dayText + ' at ' + timeString;
      historyContainer.appendChild(pillDiv);
    });

    addEventListenerToHistoryEntry();
  }



function formatDuration(duration) {
    const minutes = Math.floor(duration / 60000);
    // 60000 milliseconds in a minute
    const hours = Math.floor(duration / 3600000);
    // 3600000 milliseconds in an hour

    if (minutes < 60) {
        return `${minutes} minutes ago`;
    } else if (hours < 24) {
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}min ago`;
    } else {
        return "more than 24h ago";
    }
}

//set the pill to active or inactive
function togglePillActive(pillLi) {
    console.log('togglePillActive', pillLi.dataset.pill);
    if (pillLi.classList.toggle('active')) { //returns true if it's turned to active
        addPillType(pillLi.dataset.pill);
        pillLi.querySelector('input').checked = true;
    } else {
        removePillType(pillLi.dataset.pill);
        pillLi.querySelector('input').checked = false;
    }
}