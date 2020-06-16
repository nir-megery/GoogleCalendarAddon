//CHANGE BEFORE GOING TO PRODUCTION
var ENV='prod';
//var ENV='dev';

function getHost() {
  return ENV=='prod' ? 'https://3de41531f815.ngrok.io' :  'https://' + Session.getActiveUser().getEmail().replace('@gong.io','') + '.wfe.ngrok.io';
}

function getAPIHost() {
  return ENV=='prod' ? 'https://6aadc2ec1892.ngrok.io' :  'http://' + Session.getActiveUser().getEmail().replace('@gong.io','') + '.wfe.ngrok.io';
}
