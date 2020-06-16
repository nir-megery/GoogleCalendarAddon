//CHANGE BEFORE GOING TO PRODUCTION
var ENV='prod';
//var ENV='dev';

function getHost() {
  return ENV=='prod' ? 'https://app.gong.io' :  'https://' + Session.getActiveUser().getEmail().replace('@gong.io','') + '.wfe.ngrok.io';
}

function getAPIHost() {
  return ENV=='prod' ? 'https://webhooks.gong.io' :  'http://' + Session.getActiveUser().getEmail().replace('@gong.io','') + '.webhooks.ngrok.io';
}
