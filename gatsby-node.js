const fetch = require("node-fetch");
const moment = require("moment");
const crypto = require("crypto");

const DIALOGUE_NODE_TYPE = `DialogueWise`;

function isValid(param) {
  return !(param == null || String(param).trim() == "");
}

exports.sourceNodes = async (
  { actions, createNodeId, createContentDigest },
  pluginOptions
) => {
  const { createNode } = actions;

  const apiBaseUrl = "https://api.dialoguewise.com/api/";
  const requests = {
    ...{
      apiKey: "",
      emailHash: "",
      dialogues: [],
    },
    ...pluginOptions,
  };

  var nodes = [];

  for (const dialogue of requests.dialogues) {
    // make sure we have the mandatory dialougeName
    if (!isValid(dialogue.name)) {
      throw "Dialogue Name field is mandatory";
    }

    //The page flag allows you to get paginated data. If not passed it will return all data.
    var pageFlag = "";
    if (
      (!isValid(dialogue.pageSize) && isValid(dialogue.pageIndex)) ||
      (isValid(dialogue.pageSize) && !isValid(dialogue.pageIndex))
    ) {
      throw "Please set both pageSize and pageIndex";
    } else if (isValid(dialogue.pageSize) && isValid(dialogue.pageIndex)) {
      pageFlag =
        "&pageSize=" +
        String(dialogue.pageSize) +
        "&pageIndex=" +
        String(dialogue.pageIndex);
    }

    const request = {
      apiKey: requests.apiKey,
      emailHash: requests.emailHash,
      dialogueName: dialogue.name,
      isPilot: dialogue.isPilot,
      variableList: dialogue.variableList,
    };

    const currentUtc = moment.utc().format("DD/MM/YYYY hh:mm:ss a");
    const isPilotFlag = request.isPilot ? "&isPilotVersion=true" : "";
    const apiUrl =
      apiBaseUrl +
      "dialogue/getdialogue?dialogueName=" +
      request.dialogueName +
      isPilotFlag +
      pageFlag;

    const message = "/api/dialogue/getdialogue:" + currentUtc;
    const key = request.apiKey;
    const hashMessage = crypto
      .createHmac("sha256", key)
      .update(message)
      .digest("base64");

    const authentication = request.emailHash + ":" + hashMessage;
    const headers = {
      "Content-Type": "application/json",
      Timestamp: currentUtc,
      Authentication: authentication,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "Content-Type, Timestamp, Authentication",
    };

    var nodeDialogueData = {
      name: request.dialogueName,
      content: "",
      error: "",
    };
    try {
      const response = await fetch(apiUrl, {
        method: "post",
        headers: headers,
        body: request.variableList
          ? JSON.stringify(request.variableList)
          : null,
      });

      if (response.status !== 200) {
        nodeDialogueData.error = response.statusText;
      } else {
        const respJson = await response.json();
        nodeDialogueData.content = respJson.dialogue
          ? JSON.stringify(respJson.dialogue)
          : "";
      }
    } catch (err) {
      nodeDialogueData.error = err.message;
    }
    nodes.push(nodeDialogueData);
  }

  // loop through data and create Gatsby nodes
  nodes.forEach((node) =>
    createNode({
      ...node,
      id: createNodeId(`${DIALOGUE_NODE_TYPE}-${node.name}`),
      parent: null,
      children: [],
      internal: {
        type: DIALOGUE_NODE_TYPE,
        content: JSON.stringify(node),
        contentDigest: createContentDigest(node),
      },
    })
  );

  return;
};

exports.onPreInit = () => console.log("Loaded dialoguewise-source-plugin");
