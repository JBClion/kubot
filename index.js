'use strict';

// Import required libraries
const functions = require('firebase-functions');
const container = require('@google-cloud/container');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

// GCP Project and zone details
const projectId = process.env.GCLOUD_PROJECT;
const zone = 'us-central1-a';

// Google Kubernetes Engine Client API
const client = new container.ClusterManagerClient(); 

// Basic Authorization credentials (admin:root)
const security = "Basic YWRtaW46cm9vdA==";

// Enables lib debugging statements
process.env.DEBUG = 'dialogflow:debug'; 

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  
  /* Handle Basic Authorization */
  if(request.headers.authorization !== security){ response.send(401); }    
  
  /* DialogFlow Fulfillement Client API */
  const agent = new WebhookClient({ request, response });
  
  /* Default API Request */
  var apireq  = { projectId: projectId, zone: zone };

  /* List Clusters intent */
  /* Return existing clusters names */
  function listClusters(agent){
      return client.listClusters(apireq).then(r => { 
        let list = r[0].clusters.map(cluster => cluster.name).join(", ");
        agent.add(`Hi! Your clusters for today: ${list}. On which one would you like to work?`);
        return Promise.resolve(); 
      }).catch(e => { return Promise.reject(); });
  }

  /* Describe Cluster intent */
  /* Return details of cluster having given clusterId */
  function descCluster(agent){
      apireq.clusterId = agent.parameters.clusterId;
      return client.getCluster(apireq).then(r => {
        agent.add(`${r[0].name} created ${r[0].createTime} in ${r[0].locations} is ${r[0].status}.`);
        return Promise.resolve(); 
      }).catch(e => { return Promise.reject(); });
  }

  /* List Opertations on cluster */
  /* Return Operations on clusters */
  function listOperations(agent){
      apireq.clusterId = agent.parameters.clusterId;
      
      return client.listOperations(apireq).then(r => { 
        let list = r[0].operations.filter((o) => o.status == "RUNNING").map(o => o.operationType);
        let ops = list.join(", ");
        agent.add(`${list.length} running operations on ${apireq.clusterId}: ${ops}`);
        return Promise.resolve(); 
      }).catch(e => { return Promise.reject(); });
  }
  
  /* Start IP Rotation intent */
  /* Return details of the Node Pool with given nodePoolId from cluster having given clusterId */
  function enableLoggingService(agent){

    apireq.clusterId  = agent.parameters.clusterId;
    apireq.loggingService = 'logging.googleapis.com';    

    return client.setLoggingService(apireq).then(r => { 
      agent.add(`Done! Enabling logging operation is ${r[0].status} on ${apireq.clusterId}.`);
      return Promise.resolve(); 
    }).catch(e => {
      console.log(e);
      agent.add('I am not really sure, can you check your cluster/node names');
      return Promise.resolve(); 
    });
  }

  /* Start IP Rotation intent */
  /* Return details of the Node Pool with given nodePoolId from cluster having given clusterId */
  function disableLoggingService(agent){

    apireq.clusterId  = agent.parameters.clusterId;
    apireq.loggingService = 'none';    

    return client.setLoggingService(apireq).then(r => { 
      agent.add(`Done! Disabling logging operation is ${r[0].status} on ${apireq.clusterId}.`);
      return Promise.resolve(); 
    }).catch(e => {
      console.log(e);
      agent.add('I am not really sure, can you check your cluster/node names');
      return Promise.resolve(); 
    });
  }


  /* Return default fallback intent */
  function fallback (agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  /* Intent Map */ 
  /* Run the proper function handler based on the matched Dialogflow intent name */
  let intentMap = new Map();
  intentMap.set('List Clusters', listClusters);
  intentMap.set('Describe Cluster', descCluster);
  intentMap.set('List Operations', listOperations);
  intentMap.set('Enable Logging Service', enableLoggingService);
  intentMap.set('Disable Logging Service', disableLoggingService);

  intentMap.set('Default Fallback Intent', fallback);
  agent.handleRequest(intentMap);
});