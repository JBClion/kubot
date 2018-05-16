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

  /* Get ServerConfig intent */
  /* Return GKE Server Config */
  function getServerConfig(agent){
    return client.getServerConfig(apireq).then(r => { 
      agent.add(`Cluster version ${r[0].defaultClusterVersion} with image ${r[0].defaultImageType}.`);
      return Promise.resolve(); 
    }).catch(e => { return Promise.reject(); });
  }

  /* List Clusters intent */
  /* Return existing clusters names */
  function listClusters(agent){
      return client.listClusters(apireq).then(r => { 
        let list = r[0].clusters.map(cluster => cluster.name).join(", ");
        agent.add(`Your clusters ${list}`);
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

  /* List Nodes intent */
  /* Return Node Pools name of cluster having given clusterId */
  function listNodePools(agent){
      apireq.clusterId = agent.parameters.clusterId;
      return client.listNodePools(apireq).then(r => { 
        let list = r[0].nodePools.map(nodePool => nodePool.name).join(", ");
        agent.add(`${apireq.clusterId} node pools are ${list}`);
        return Promise.resolve(); 
      }).catch(e => { return Promise.reject(); });
  }

  /* Describe Node intent */
  /* Return details of the Node Pool with given nodePoolId from cluster having given clusterId */
  function descNodePool(agent){

      apireq.clusterId  = agent.parameters.clusterId;
      apireq.nodePoolId = agent.parameters.nodePoolId;

      return client.getNodePool(apireq).then(r => { 
        agent.add(`${r[0].name} is ${r[0].status} with ${r[0].initialNodeCount} initial nodes.`);
        return Promise.resolve(); 
      }).catch(e => {
        agent.add('I am not really sure, can you check your cluster/node names');  
        return Promise.resolve(); 
      });
  }
  
  /* Describe Node intent */
  /* Return details of the Node Pool with given nodePoolId from cluster having given clusterId */
  function descResource(agent){

    apireq.clusterId  = agent.parameters.clusterId;
    apireq.nodePoolId = agent.parameters.nodePoolId;

    return client.getNodePool(apireq).then(r => { 
      agent.add(`${r[0].name} is ${r[0].status} with ${r[0].initialNodeCount} initial nodes.`);
      return Promise.resolve(); 
    }).catch(e => {
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
  intentMap.set('Get ServerConfig', getServerConfig);
  intentMap.set('List Clusters', listClusters);
  intentMap.set('Describe Cluster', descCluster);
  intentMap.set('List Nodes', listNodePools);
  intentMap.set('Describe Node', descNodePool);
  intentMap.set('Default Fallback Intent', fallback);

  agent.handleRequest(intentMap);
});