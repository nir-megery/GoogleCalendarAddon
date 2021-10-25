/**
 *  Initializes syncing of conference data by creating a sync trigger and
 *  sync token if either does not exist yet.
 *
 *  @param {String} calendarId The ID of the Google Calendar.
 */
function initializeSyncing(calendarId) {
  console.info('initializeSyncing of calendar', calendarId);

  // Create a syncing trigger if it doesn't exist yet.
  createSyncTrigger(calendarId);

  // Perform an event sync to create the initial sync token.
//  syncCalendarEvents({ 'calendarId': calendarId });
}


/**
 *  Creates a sync trigger if it does not exist yet.
 *
 *  @param {String} calendarId The ID of the Google Calendar.
 */
function createSyncTrigger(calendarId) {
  // Check to see if the trigger already exists; if does, return.
  var allTriggers = ScriptApp.getProjectTriggers();
  console.log('allTriggers.length', allTriggers.length);

  for (var i = 0; i < allTriggers.length; i++) {
    var trigger = allTriggers[i];
    console.log('trigger[', i, ']:', trigger.getUniqueId(), trigger.getEventType(), trigger.getTriggerSource(), trigger.getTriggerSourceId(), trigger.getHandlerFunction());

    if (trigger.getTriggerSourceId() === calendarId && trigger.getHandlerFunction() === 'syncEvents') {
      console.log('delete trigger[', i, ']:', trigger.getUniqueId(), trigger.getEventType(), trigger.getTriggerSource(), trigger.getTriggerSourceId(), trigger.getHandlerFunction());
      ScriptApp.deleteTrigger(trigger);
    }
  }

  var allTriggers = ScriptApp.getProjectTriggers();
  console.log('allTriggers.length', allTriggers.length);

  for (var i = 0; i < allTriggers.length; i++) {
    var trigger = allTriggers[i];
    console.log('trigger.getTriggerSourceId: ', trigger.getTriggerSourceId());
    console.log('trigger.getHandlerFunction:', trigger.getHandlerFunction());
    if (trigger.getTriggerSourceId() === calendarId && trigger.getHandlerFunction() === 'syncCalendarEvents') {
      return;
    }
  }

  //triggers[i].getHandlerFunction() === fnName

  // Trigger does not exist, so create it. The trigger calls the
  // 'syncCalendarEvents()' trigger function when it fires.
  var trigger = ScriptApp.newTrigger('syncCalendarEvents')
    .forUserCalendar(calendarId)
    .onEventUpdated()
    .create();

  console.log('new trigger:', trigger.getUniqueId(), trigger.getEventType(), trigger.getTriggerSource(), trigger.getTriggerSourceId(), trigger.getHandlerFunction());
}


/**
 *  Sync events for the given calendar; this is the syncing trigger
 *  function. If a sync token already exists, this retrieves all events
 *  that have been modified since the last sync, then checks each to see
 *  if an associated conference needs to be updated and makes any required
 *  changes. If the sync token does not exist or is invalid, this
 *  retrieves future events modified in the last 24 hours instead. In
 *  either case, a new sync token is created and stored.
 *
 *  @param {Object} e If called by a event updated trigger, this object
 *      contains the Google Calendar ID, authorization mode, and
 *      calling trigger ID. Only the calendar ID is actually used here,
 *      however.
 */
function syncCalendarEvents(e) {
  console.log("syncCalendarEvents:", e);
  var calendarId = e.calendarId;
  var properties = PropertiesService.getUserProperties();
  var syncToken = properties.getProperty('syncToken');

  var options;
  if (syncToken) {
    // There's an existing sync token, so configure the following event
    // retrieval request to only get events that have been modified
    // since the last sync.
    options = {
      syncToken: syncToken
    };
  } else {
    // No sync token, so configure to do a 'full' sync instead. In this
    // example only recently updated events are retrieved in a full sync.
    // A larger time window can be examined during a full sync, but this
    // slows down the script execution. Consider the trade-offs while
    // designing your add-on.
    var now = new Date();
    var yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    options = {
      timeMin: now.toISOString(),          // Events that start after now...
      updatedMin: yesterday.toISOString(), // ...and were modified recently
      maxResults: 50,   // Max. number of results per page of responses
      orderBy: 'updated'
    }
  }

  // Examine the list of updated events since last sync (or all events
  // modified after yesterday if the sync token is missing or invalid), and
  // update any associated conferences as required.
  var events;
  var pageToken;
  do {
    try {
      options.pageToken = pageToken;
      events = Calendar.Events.list(calendarId, options);
    } catch (err) {
      // Check to see if the sync token was invalidated by the server;
      // if so, perform a full sync instead.
      if (err.message && err.message.toLowerCase().indexOf("a full sync is required") !== -1) {
        properties.deleteProperty('syncToken');
        syncCalendarEvents(e);
        return;
      } else {
        console.error('err', err);
        throw new Error(err.message);
      }
    }

    // Read through the list of returned events looking for conferences
    // to update.
    if (events.items && events.items.length > 0) {
      for (var i = 0; i < events.items.length; i++) {
        var calEvent = events.items[i];
        // Check to see if there is a record of this event has a
        // conference that needs updating.
        // NOTE: we do not update the server with deleted events - this is on purpose.
        // Event deletion is not a part of the addon flow - it will be done in a scheduled task.
        if (eventHasGongConference(calEvent) && calEvent.conferenceData.parameters && calEvent.conferenceData.parameters.addOnParameters && calEvent.conferenceData.parameters.addOnParameters.parameters.createMeetingPerUrl) {
          // console.log("Updating the conference!")
          updateConference(calEvent, calEvent.conferenceData.conferenceId);
        }
      }
    }

    pageToken = events.nextPageToken;
  } while (pageToken);

  // Record the new sync token.
  if (events.nextSyncToken) {
    properties.setProperty('syncToken', events.nextSyncToken);
  }
}


/**
 *  Returns true if the specified event has an associated conference
 *  of the type managed by this add-on; retuns false otherwise.
 *
 *  @param {Object} calEvent The Google Calendar event object, as defined by
 *      the Calendar API.
 *  @return {boolean}
 */
function eventHasGongConference(calEvent) {
  console.log('eventHasConference:', calEvent);
  // console.log('calEvent.conferenceData:', calEvent.conferenceData)

  var name = calEvent.conferenceData && calEvent.conferenceData.conferenceSolution && calEvent.conferenceData.conferenceSolution.name || null;

  // This version checks if the conference data solution name matches the
  // one of the solution names used by the add-on. Alternatively you could
  // check the solution's entry point URIs or other solution-specific
  // information.
  // if (name) {
  //   console.log("conferenceSolution", name)
  // }
  return (name && name.indexOf("Gong Meeting") == 0);
}

/**
 *  Update a conference based on new Google Calendar event information.
 *  The exact implementation of this function is highly dependant on the
 *  details of the third-party conferencing system, so only a rough outline
 *  is shown here.
 *
 *  @param {Object} calEvent The Google Calendar event object, as defined by
 *      the Calendar API.
 *  @param {String} conferenceId The ID used to identify the conference on
 *      the third-party conferencing system.
 */
function updateConference(calEvent, conferenceId) {
  console.info('calEvent', calEvent);
  var accessToken = getAuthService().getAccessToken();
  // console.log('accessToken', accessToken);
  try {
    var options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(calEvent),
      'headers': { Authorization: 'Bearer ' + accessToken },
      'muteHttpExceptions': true
    }

    var response = UrlFetchApp.fetch(getAPIHost() + '/calendar/updateEvent', options);

    var code = response.getResponseCode();
    console.info('Response: code=', code, ', body=', response.getContentText());
    if (code !== 200) {
      console.warn('updateEvent error');
    }

  } catch (e) {
    console.error('updateEvent error:', e);
  }


  //  // Check edge case: the event was cancelled
  //  if (calEvent.status === 'cancelled') {
  //    // Use the third-party API to delete the conference too.
  //    ...
  //
  //  } else {
  //    // Extract any necessary information from the event object, then
  //    // make the appropriate third-party API requests to update the
  //    // conference with that information.
  //    ...
  //  }
}

