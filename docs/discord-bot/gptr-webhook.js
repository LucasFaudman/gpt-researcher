// gptr-webhook.js

const WebSocket = require('ws');

let socket = null;
let responseCallback = null;

async function initializeWebSocket() {
  if (!socket) {
    const host = 'gpt-researcher:8000';
    const ws_uri = `ws://${host}/ws`;

    socket = new WebSocket(ws_uri);

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket data received:', data);

      if (data.content === 'dev_team_result') {
        if (responseCallback) {
          responseCallback(data.output);
          responseCallback = null; // Clear callback after use
        }
      } else {
        console.log('Received data:', data);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      socket = null;
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
}

async function sendWebhookMessage({query, relevantFileNames, repoName, branchName}) {
  return new Promise((resolve, reject) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      initializeWebSocket();
    }

    const data = {
      task: `${query}. The relevant files names are: ${relevantFileNames}`,
      report_type: 'dev_team',
      report_source: 'web',
      tone: 'Objective',
      headers: {},
      repo_name: typeof repoName === 'undefined' || repoName === '' ? 'assafelovic/gpt-researcher' : repoName,
      branch_name: typeof branchName === 'undefined' || branchName === '' ? 'master' : branchName
    };

    const payload = "start " + JSON.stringify(data);

    responseCallback = (response) => {
      resolve(response); // Resolve the promise with the WebSocket response
    };

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
      console.log('Message sent:', payload);
    } else {
      socket.onopen = () => {
        socket.send(payload);
        console.log('Message sent after connection:', payload);
      };
    }
  });
}

module.exports = {
  sendWebhookMessage
};
