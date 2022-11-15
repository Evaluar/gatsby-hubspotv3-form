import * as _ from 'lodash'
import * as axios from 'axios'
import * as crypto from 'crypto'

exports.sourceNodes = async ({ actions }, configOptions) => {
  try {
    const TOKEN_ACCESS = configOptions.apiKey
    const PORTAL_ID = configOptions.portalId
    if (!TOKEN_ACCESS) throw new Error("No Hubspot API key provided")
    if (!PORTAL_ID) throw new Error("No Hubspot Portal Id provided")

    const { createNode } = actions
    
    const formsList = []
    
    const apiCall = async function(url){
      const apiResponse = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${TOKEN_ACCESS}`,
          'Content-Type': 'application/json'
        }
      });

      const data = _.get(apiResponse, 'data')
      
      data.results.map((formSummary) => {
        formsList.push(formSummary)
      })
      
      return data
    };
    
    const recursiveCallApi = async function(results) {
      const nextPageLink = _.get(results, 'paging.next.link', null)
      if(nextPageLink) {
        const resultsRecursived = await apiCall(nextPageLink)
        await recursiveCallApi(resultsRecursived)
      } else {
        return
      }
    }

    const firstCallResult = await apiCall('https://api.hubapi.com/marketing/v3/forms/?limit=90&formTypes=hubspot')
    await recursiveCallApi(firstCallResult)
    
    formsList.map((item, index) => {
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
