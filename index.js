'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const prices = {'tea': 3, 'water': 2, 'coffee': 5};
const toppings = {'tea': 'Sorry, no topping', 'water': 'Sorry, no topping', 'coffee': 'Cream'};

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
  
  function getPrice(agent) {
    let drink = agent.parameters.drink.toLowerCase();
    agent.add('Your ' + drink + ' would cost ' + prices[drink] + '$');
  }
  
  function addTopping(agent) {
    let drink = agent.parameters.drink.toLowerCase();
    agent.add('For ' + drink + '? ' + toppings[drink]);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
}

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Get Price', getPrice);
  intentMap.set('Add Topping', addTopping);

  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
