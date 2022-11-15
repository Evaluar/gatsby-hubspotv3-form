const _ = require(`lodash`)
const Promise = require(`bluebird`)
const path = require(`path`)
const slash = require(`slash`)
const axios = require("axios")
const crypto = require("crypto")
var fs = require("fs")

exports.sourceNodes = async ({ actions }, configOptions) => {
  try {
    const TOKEN_ACCESS = configOptions.apiKey
    const PORTAL_ID = configOptions.portalId
    if (!TOKEN_ACCESS) throw new Error("No Hubspot API key provided")
    const { createNode } = actions
    const fetchAllFormNodes = await axios.get(
      `https://api.hubapi.com/marketing/v3/forms/?limit=90&formTypes=hubspot`, 
        {
          headers: {
            'Authorization': `Bearer ${TOKEN_ACCESS}`,
            'Content-Type': 'application/json'
          }
        },
    )
    const response = await fetchAllFormNodes.data
    const response2 = await axios.get(response.paging.next.link,{
      headers: {
        'Authorization': `Bearer ${TOKEN_ACCESS}`,
        'Content-Type': 'application/json'
      }
    })
    const results = _.union(response.results, response2.data.results)
    
    console.log(results.length)
    results.map((item, index) => {
      if(index === 0) {
        console.log(item)
      }
      const formNode = {
        id: item.id ,
        portalId: PORTAL_ID,
        guid: item.guid,
        name: item.name,
        action: item.action || '',
        method: item.method || 'POST',
        cssClass: item.cssClass,
        redirect: item.redirect,
        submitText: item.submitText,
        followUpId: item.followUpId,
        notifyRecipients: item.notifyRecipients,
        leadNurturingCampaignId: item.leadNurturingCampaignId,
        formFieldGroups: item.fieldGroups,
        metaData: item.metaData,
        inlineMessage: item.inlineMessage,
        isPublished: item.isPublished,
        thankYouMessageJson: item.thankYouMessageJson,
        children: [],
        parent: `__SOURCE__`,
        internal: {
          type: `HubspotForm`,
        },
      }
      console.log(` ${index + 1} :Creating Hubspot Form  ${item.name}`)
      const contentDigest = crypto
        .createHash(`md5`)
        .update(JSON.stringify(formNode))
        .digest(`hex`)
      formNode.internal.contentDigest = contentDigest
      createNode(formNode)
    })
    return
  } catch (err) {
    throw new Error(err)
  }
}
