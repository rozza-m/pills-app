//Pill types are hardcoded for now
const pillTypes = [
    {
      name: 'Paracetemol',
      hoursBetweenDoses: 4,
      maxDosesPerDay: 4
    },
    {
      name: 'Ibuprofen',
      hoursBetweenDoses: 4,
      maxDosesPerDay: 3
    },
    {
        name: 'Oramorph',
        hoursBetweenDoses: 4,
        maxDosesPerDay: 3
    }
  ];


// Add event listeners
var pills = document.querySelectorAll('.pill');
var mask = document.querySelector('#mask');
var historydiv = document.querySelector('#history');
var ampm = document.querySelectorAll('.ampm');
var submitbutton = document.querySelectorAll('button.submit');
var upselector = document.querySelectorAll('.upselector');
var downselector = document.querySelectorAll('.downselector');
var leftselector = document.querySelectorAll('.leftselector');
var rightselector = document.querySelectorAll('.rightselector');

// Add onLoad and timers
window.onload = function() {
    waitForDBConnection()
      .then((db) => {
        // Perform any necessary operations with the database here
        // ...
  
        updatePillStatus();
  
        // Run the function every 20 seconds
        setInterval(updatePillStatus, 20000);
      })
      .catch((error) => {
        console.error('Error occurred while establishing database connection:', error);
      });
  };

//click on each pill -> pops and fills time
for (var i = 0; i < pills.length; i++) { 
    pills[i].addEventListener('click', function () {
        /*for (var j = 0; j < pills.length; j++) {
          pills[j].classList.remove('popped');
        }*/

        if (this.classList.contains('popped')) {
            return;
        }

        this.classList.add('popped');
        mask.classList.add('maskactive');


        var dateelement = this.querySelector('.date .spinnercontent');
        var hourelement = this.querySelector('.hour .spinnercontent');
        var minuteelement = this.querySelector('.minute .spinnercontent');
        var ampmelement = this.querySelector('.ampm');

        //date is relative
        dateelement.setAttribute('data-day-offset', '0');
        dateelement.innerHTML = 'Today';

        //get current browser time in local timezone
        var now = new Date(); //this is in local timezone
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
        //if ampm is pm, add pm class to ampm, else remove it and add am
        if (ampm === 'am') {
            ampmelement.classList.add('am');
            ampmelement.classList.remove('pm');
        } else {
            ampmelement.classList.remove('am');
            ampmelement.classList.add('pm');
        }

    });
}

//click on mask -> hides
mask.addEventListener('click', function () { 
    for (var j = 0; j < pills.length; j++) {
        pills[j].classList.remove('popped');
    }
    mask.classList.remove('maskactive');
    historydiv.classList.remove('popped');
})

//click on history -> shows history
historydiv.addEventListener('click', function () { 
    if (!historydiv.classList.contains('popped')) {
        historydiv.classList.add('popped');
        mask.classList.add('maskactive');
    }
})

//click on am/pm -> toggles
for (var i = 0; i < ampm.length; i++) { 
    ampm[i].addEventListener('click', function () {
        this.classList.toggle('am');
        this.classList.toggle('pm');
    });
}

//click on upselector -> increases adjacent spinnercontent by 1
for (var i = 0; i < upselector.length; i++) {
    upselector[i].addEventListener('click', function (event) {
        event.stopPropagation();
        var spinnercontent = this.parentElement.querySelector('.spinnercontent');
        spinnercontent.innerHTML = (parseInt(spinnercontent.innerHTML, 10) + 1).toString();
        //if spinnercontent is 60 and the parent is minute, set spinnercontent to 00
        if (spinnercontent.parentElement.classList.contains('minute')) { //minute
            spinnercontent.innerHTML = spinnercontent.innerHTML.padStart(2, '0'); //pad minutes
            if (parseInt(spinnercontent.innerHTML, 10) === 60) {
                spinnercontent.innerHTML = '00';
            }
        } else { //hour
            if (parseInt(spinnercontent.innerHTML, 10) === 13) {
                spinnercontent.innerHTML = '1';
            }
        }
    });
}

//click on downselector -> decreases adjacent spinnercontent by 1
for (var i = 0; i < downselector.length; i++) {
    downselector[i].addEventListener('click', function (event) {
        event.stopPropagation();
        var spinnercontent = this.parentElement.querySelector('.spinnercontent');
        spinnercontent.innerHTML = (parseInt(spinnercontent.innerHTML, 10) - 1).toString();
        //if spinnercontent is -1 and the parent is minute, set spinnercontent to 59
        if (spinnercontent.parentElement.classList.contains('minute')) { //minute
            spinnercontent.innerHTML = spinnercontent.innerHTML.padStart(2, '0'); //pad minutes
            if (parseInt(spinnercontent.innerHTML, 10) === -1) {
                spinnercontent.innerHTML = '59';
            }
        } else { //hour
            if (parseInt(spinnercontent.innerHTML, 10) === 0) {
                spinnercontent.innerHTML = '12';
            }
        }
        
        //if spinnercontent is -1 and the parent is hour, set spinnercontent to 12
    });
}

//click on leftselector -> decreases data-day-offset by 1 and replaces text appropriately
for (var i = 0; i < leftselector.length; i++) {
    leftselector[i].addEventListener('click', function (event) {
        event.stopPropagation();
        var spinnercontent = this.parentElement.querySelector('.spinnercontent');
        var dayOffset = spinnercontent.getAttribute('data-day-offset');
        dayOffset--;
        spinnercontent.setAttribute('data-day-offset', dayOffset);

        //replace text as appropriate
        if (dayOffset === 0) {
            spinnercontent.innerHTML = 'Today';
        } else if (dayOffset === -1) {
            spinnercontent.innerHTML = 'Yesterday';
        } else { // if it's before yesterday, format as DDDD DD MM
            const today = new Date();

            const targetDate = new Date();
            targetDate.setDate(today.getDate() + dayOffset);

            const options = { weekday: 'long', day: 'numeric', month: 'short' };
            const formattedDate = targetDate.toLocaleDateString('en-US', options);

            spinnercontent.innerHTML = formattedDate;
            
        }

    });
}

//click on rightselector -> increases data-day-offset by 1 and replaces text appropriately
for (var i = 0; i < rightselector.length; i++) {
    rightselector[i].addEventListener('click', function (event) {
        event.stopPropagation();
        var spinnercontent = this.parentElement.querySelector('.spinnercontent');
        var dayOffset = spinnercontent.getAttribute('data-day-offset');
        if(dayOffset < 1) dayOffset++; //clamp to tomorrow
        spinnercontent.setAttribute('data-day-offset', dayOffset);

        //replace text as appropriate
        if (dayOffset == 1) {
            spinnercontent.innerHTML = 'Tomorrow';
        } else if (dayOffset === 0) {
            spinnercontent.innerHTML = 'Today';
        } else if (dayOffset === -1) {
            spinnercontent.innerHTML = 'Yesterday';
        } else { // if it's before yesterday, format as DDDD DD MM
            const today = new Date();

            const targetDate = new Date();
            targetDate.setDate(today.getDate() + dayOffset);

            const options = { weekday: 'long', day: 'numeric', month: 'short' };
            const formattedDate = targetDate.toLocaleDateString('en-US', options);

            spinnercontent.innerHTML = formattedDate;
            
        }
    });
}

//click on submit button -> unpops and adds to history
for (var i = 0; i < submitbutton.length; i++) { 
    submitbutton[i].addEventListener('click', function (event) {
        event.stopPropagation();

        //get time by building from elements
        var hour = this.parentElement.querySelector('.hour .spinnercontent').innerHTML;
        var minute = this.parentElement.querySelector('.minute .spinnercontent').innerHTML;
        //if .ampm has am element, we are in am
        var ampm = this.parentElement.querySelector('.ampm').classList.contains('am') ? 'am' : 'pm';



        for (var j = 0; j < pills.length; j++) {
            pills[j].classList.remove('popped');
        }
        mask.classList.remove('maskactive');

        //format time into a standard ISO 8601 format

        var date = new Date();
        const now = new Date(); //creating Date without any arguments gives today
        date.setHours(parseInt(hour, 10));
        date.setMinutes(parseInt(minute, 10));
        //if .ampm has pm element, we are in pm and need to add 12
        if (ampm === 'pm') {
            date.setHours(date.getHours() + 12);
        }

        //offset day by data-day-offset. Remember it's already set to today's date
        const dayOffset = this.parentElement.querySelector('.date .spinnercontent').getAttribute('data-day-offset');
        date.setDate(date.getDate() + parseInt(dayOffset));

        //format to ISO 8601 format
        var isoDate = date.toISOString(); //this converts from local timezone to UTC

        //find out what type of pill we are by going back up the tree to find the ID of .pill
        let parent = this.parentNode;
        var pillId;

        while (parent !== null) {
            if (parent.classList.contains('pill')) {
                pillId = parent.id;
                break;
            }
            
            parent = parent.parentNode;
        }

        //add pill to history
        console.log('Adding pill', pillId, 'at', isoDate);
        addPillToHistory(pillId, isoDate);

        updatePillStatus();
    });
}

//fill in the status of pills, for each pill.
function updatePillStatus() {
    const pills = Array.from(document.querySelectorAll('.pill'));
  
    pills.forEach((pill) => {
      const pillType = pill.id;
      const articleElement = pill.querySelector('.titlegroup article');
  
      canTakePill(pillType)
        .then((result) => {
          if(result.canTakePill) {
            var timeAgo = new Date() - result.lastTakenAt;
            
            articleElement.textContent = 'Last taken ' + formatDuration(timeAgo);
          } else {
            if (result.reason === 'hourLimitReached') {
              articleElement.textContent = 'It\'s less than 4 hours since your last dose';
            } else {
              articleElement.textContent = 'You\'ve had 4 or more doses in the last 24 hours';
            }
          }
        })
        .catch((error) => {
          console.error('Error occurred while checking pill status:', error);
        });
    });
  }

  function formatDuration(duration) {
    const minutes = Math.floor(duration / 60000); // 60000 milliseconds in a minute
    const hours = Math.floor(duration / 3600000); // 3600000 milliseconds in an hour
  
    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      const remainingMinutes = minutes % 60;
      return `${hours} hours ${remainingMinutes} minutes ago`;
    } else {
      return "more than 24 hours ago";
    }
  }