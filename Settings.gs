//CHANGE BEFORE GOING TO PRODUCTION
// var ENV='prod';
var ENV='dev';

function getHost() {
  //return ENV=='prod' ? 'https://app.gong.io' :  'https://' + Session.getActiveUser().getEmail().replace('@gong.io','').replace('.', '') + 'wfe.ngrok.io';
  return 'https://yarinbenadowfe.ngrok.io'
}

function getAPIHost() {
  //return ENV=='prod' ? 'https://webhooks.gong.io' :  'https://' + Session.getActiveUser().getEmail().replace('@gong.io','').replace('.', '') + 'webhooks.ngrok.io';
    return 'https://yarinbenadowebhooks.ngrok.io'
}
