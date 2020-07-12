/**
 * see https://github.com/gsuitedevs/apps-script-oauth2
 */
function getAuthService() {
  // Create a new service with the given name. The name will be used when
  // persisting the authorized token, so ensure it is unique within the
  // scope of the property store.
  return OAuth2.createService('gong')

      // Set the endpoint URLs, which are the same for all Google services.
      .setAuthorizationBaseUrl(getHost() + '/oauth/add-on/authorize')
      .setTokenUrl(getHost() + '/oauth/generate-token')

      // Set the client ID and secret, from the Google Developers Console.
      .setClientId('730875102')
      .setClientSecret('ecXeyM22GMHcwHRz')

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scopes to request (space-separated for Google services).
      .setScope('https://app.gong.io/calendar/add-on')
  
      .setParam('approval_prompt', 'auto');
  
      //.setParam('email',Session.getActiveUser().getEmail());
}

/**
 * webpp handler
 */
function doGet(e) {  
  console.log(e);
  if(e.parameter['code'] != null){
    return authCallback(e);
    
  } else if (e.parameter['logout']){
    return logout(e);
    
  } else if (e.parameter['settings'] != null) {    
    var html = HtmlService.createHtmlOutputFromFile('SettingsPage');
    return html.setTitle('Gong for Google Calendar Settings');
  } else {
    return HtmlService.createHtmlOutput('');
  }
}


function authCallback(request) {
    console.log(request);

  var authService = getAuthService();
  var code = request.parameter['code'];
  var isAuthorized = code.length>0 && authService.handleCallback(request);
  var additionalInfo = request.parameter['additional-info'];
  if (isAuthorized) {
    if (additionalInfo) {//no-provider-url
      var provider = additionalInfo.split('/')[1];
      var htmlTemplate = HtmlService.createTemplateFromFile('Feedback');
      htmlTemplate.imgSrc = 'https://lh3.googleusercontent.com/-igkjzvTY6mQ/Xe_L2Npz0KI/AAAAAAAABKY/RgmWNGNkXlkEUkqFW6YJy1pTcchWgeH2wCLcBGAsYHQ/s400/link.png';
      htmlTemplate.title = 'Add your personal meeting room link';
      htmlTemplate.text = 'Log in succeeded. Before scheduling the first Gong meeting, add your ' + provider + ' personal meeting room link to "My Profile" page in Gong.';
      return htmlTemplate.evaluate();
    } else {
      var htmlTemplate = HtmlService.createTemplateFromFile('Close');
      htmlTemplate.imgSrc = 'https://lh3.googleusercontent.com/-QOasKMjlVaU/Xe_MRnbQFhI/AAAAAAAABKk/EAmtmPkG79IqmwoVSMCv7eVvzyqg0tk0wCLcBGAsYHQ/s400/success.png';
      htmlTemplate.title = 'Log in succeeded';
      htmlTemplate.text = '';
      return htmlTemplate.evaluate();
    }
  } else {
    var htmlTemplate = HtmlService.createTemplateFromFile('Feedback');
      htmlTemplate.title = 'You cannot log in at this time';
      htmlTemplate.imgSrc = 'https://lh3.googleusercontent.com/-7JXDRT2bhcg/Xe_LdnzEauI/AAAAAAAABKM/cuRFEgW9x4c_Ig2zkxnQRY43FQCZON-DgCLcBGAsYHQ/s400/ic_cant_login.png';
    if (additionalInfo) {//consent-page-disabled
      htmlTemplate.text = 'The consent page is not enabled for your company.\nAsk your Gong admin to set it up before you can log in to Gong for Google calendar. ';
    } else {
      htmlTemplate.text = 'If the problem persist contact Gong support.';
    }
    return htmlTemplate.evaluate();
  }
}

function logout(request) {
  console.info('Resetting oauth credentials');
  getAuthService().reset();
  return HtmlService.createHtmlOutput('ok');
}

OAuth2.getRedirectUri = function(scriptId) {
  console.info(scriptId);
  return getScriptUri();
}

function isLoggedIn() {
  return getAuthService().hasAccess();
}

function getScriptUri() {
    return ScriptApp.getService().getUrl();
}