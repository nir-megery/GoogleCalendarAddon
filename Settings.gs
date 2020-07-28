//CHANGE BEFORE GOING TO PRODUCTION
//var ENV='prod';
var ENV='dev';

function getHost() {
  return ENV=='prod' ? 'https://app.gong.io' :  'https://maximbu.ngrok.io';
}

function getAPIHost() {
  return ENV=='prod' ? 'https://webhooks.gong.io' :  'https://maximbu2.ngrok.io';
}
