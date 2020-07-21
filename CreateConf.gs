/**
 *  Creates a conference, then builds and returns a ConferenceData object
 *  with the corresponding conference information. This method is called
 *  when a user selects a conference solution defined by the add-on that
 *  uses this function as its 'onCreateFunction' in the add-on manifest.
 *
 *  @param {Object} arg The default argument passed to a 'onCreateFunction';
 *      it carries information about the Google Calendar event.
 *  @return {ConferenceData}
 */

function createConference(arg) {    // arg={eventData={eventId=01vac5ke5s6cciv4k7ncoe1mn5, calendarId=shmulik.shnoll@gong.io}}
  console.info("eventData: ", arg);
  var calendarId = arg.eventData.calendarId;
  var conferenceData = getConferenceData();
  var createMeetingPerUrl = conferenceData.createMeetingPerUrl;
  var dataBuilder = ConferenceDataService.newConferenceDataBuilder();

  if (conferenceData.error) {
    dataBuilder.setError(
      ConferenceDataService.newConferenceError()
      .setConferenceErrorType(conferenceData.error)
      .setAuthenticationUrl(getAuthService().getAuthorizationUrl()));
    
  } else {
      var conferenceDataEntryPoint = ConferenceDataService.newEntryPoint()
      .setEntryPointType(ConferenceDataService.EntryPointType.VIDEO)
      .setUri(conferenceData.videoUri);

      if (createMeetingPerUrl) {
        conferenceDataEntryPoint.setMeetingCode(conferenceData.gongMeetingKey)
      }

      dataBuilder.addEntryPoint(conferenceDataEntryPoint);

      if (createMeetingPerUrl) {
        dataBuilder.addConferenceParameter(ConferenceDataService.newConferenceParameter().setKey("createMeetingPerUrl").setValue(conferenceData.createMeetingPerUrl));
        console.log("about to initializeSyncing calendarId: ", calendarId);
        initializeSyncing(calendarId);
      }

      dataBuilder.setNotes("Click the link to enter the meeting or view dial-in options");
    
      // TODO 
      //    dataBuilder.addEntryPoint(
      //      ConferenceDataService.newEntryPoint()
      //        .setEntryPointType(ConferenceDataService.EntryPointType.MORE)
      //        .setUri("https://app.gong.io/join-instrctions")
      //    );
    }
  
  return dataBuilder.build();
}

function getConferenceData() {
  var accessToken;
  try {    
    accessToken = getAuthService().getAccessToken();
  } catch (e) {
    console.warn('Error getting existing access token=', e);
  }
  
  if (!accessToken) {
    return {error: ConferenceDataService.ConferenceErrorType.AUTHENTICATION};
  }
  
  try {  
  
    console.info(getAPIHost() + '/calendar/getJumpPageInfo');

    var response = UrlFetchApp.fetch(getAPIHost() + '/calendar/getJumpPageInfo', {
                                     headers: {Authorization: 'Bearer ' + accessToken},
                                     muteHttpExceptions: true});

      var code = response.getResponseCode();
      console.info('Response: code=', code, ', body=', response.getContentText());
    
      if (code == 401) {
        return {error: ConferenceDataService.ConferenceErrorType.AUTHENTICATION};
    
      } else if (code == 200) {
          var responseObj = JSON.parse(response); 
          var videoUri = responseObj.url;
          var createMeetingPerUrl = responseObj.createMeetingPerUrl;
          var gongMeetingKey = responseObj.gongMeetingKey;
          if (videoUri) {
            return {videoUri: videoUri, createMeetingPerUrl: createMeetingPerUrl, gongMeetingKey: gongMeetingKey };
          } else {
              return {error: ConferenceDataService.ConferenceErrorType.PERMISSION_DENIED};
          }
      } else {
          return {error: ConferenceDataService.ConferenceErrorType.TEMPORARY};
      }
    
  } catch (e) {
      console.error('getConferenceData error:', e);
      return {error: ConferenceDataService.ConferenceErrorType.TEMPORARY};
  }
}

