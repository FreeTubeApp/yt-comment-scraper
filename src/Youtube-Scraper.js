const HttpRequester = require('./HttpRequester')
const htmlParser = require('./htmlParser')

const ValidationId = {
  getComments: 0,
  getCommentReplies: 1
}

function validateArgs(id, payload) {
  // Common properties
  if (typeof payload.videoId !== 'string') {
    throw new TypeError('videoId is required and must be of type "string"')
  }
  if (typeof payload.mustSetCookie !== 'boolean') payload.mustSetCookie = false
  if (typeof payload.httpsAgent !== 'object') payload.httpsAgent = null

  // Specific properties
  switch (id) {
    case ValidationId.getComments:
      if (typeof payload.sortByNewest !== 'boolean') payload.sortByNewest = false
      if (typeof payload.continuation !== 'string') payload.continuation = null
      return payload

    case ValidationId.getCommentReplies:
      if (typeof payload.replyToken !== 'string') {
        throw new TypeError('replyToken is required and must be of type "string"')
      }
      return payload
  }
}
class CommentScraper {
  static async getComments(payload) {
    const { videoId, sortByNewest, continuation, mustSetCookie, httpsAgent } =
      validateArgs(ValidationId.getComments, payload)

    const requester = await HttpRequester.create(videoId, mustSetCookie, httpsAgent)
    if (requester.error) {
      throw new Error(requester.message)
    }

    let token = continuation ?? requester.getContinuationToken(sortByNewest)
    if (!token) {
      return { comments: [], continuation: token }
    }

    const commentPageResponse = await requester.requestCommentsPage(token)
    let commentHtml
    if (continuation) {
      commentHtml = commentPageResponse.data.onResponseReceivedEndpoints[0].appendContinuationItemsAction
    } else {
      commentHtml = commentPageResponse.data.onResponseReceivedEndpoints[1].reloadContinuationItemsCommand
    }

    // Reset to return new token back to caller (or null, in case it doesn't exist)
    token = null

    let commentData = []
    if ('continuationItems' in commentHtml) {
      commentData = htmlParser.parseCommentData(commentHtml.continuationItems)
      const continuationElem = commentHtml.continuationItems[commentHtml.continuationItems.length - 1]
      if ('continuationItemRenderer' in continuationElem) {
        if (typeof continuationElem.continuationItemRenderer.continuationEndpoint === 'undefined') {
          token = continuationElem.continuationItemRenderer.button.buttonRenderer.command.continuationCommand.token
        } else {
          token = continuationElem.continuationItemRenderer.continuationEndpoint.continuationCommand.token
        }
      }
    }

    let total = null
    if (!continuation) {
      const headerElem = commentPageResponse.data.onResponseReceivedEndpoints[0].reloadContinuationItemsCommand.continuationItems[0]
      if ('commentsHeaderRenderer' in headerElem) {
        total = Number(headerElem?.commentsHeaderRenderer?.countText?.runs?.[0]?.text?.replace(',', '')) ?? null
      }
    }

    return { total, comments: commentData, continuation: token }
  }

  static async getCommentReplies(payload) {
    const { videoId, replyToken, mustSetCookie, httpsAgent } =
      validateArgs(ValidationId.getCommentReplies, payload)

    const requester = await HttpRequester.create(videoId, mustSetCookie, httpsAgent)
    if (requester.error) {
      throw new Error(requester.message)
    }

    const commentPageResponse = await requester.requestCommentsPage(replyToken)
    const commentHtml = commentPageResponse.data.onResponseReceivedEndpoints[0].appendContinuationItemsAction
    const commentData = htmlParser.parseCommentData(commentHtml.continuationItems)

    let token = null
    const continuationElem = commentHtml.continuationItems[commentHtml.continuationItems.length - 1]
    if ('continuationItemRenderer' in continuationElem) {
      token = continuationElem.continuationItemRenderer.button.buttonRenderer.command.continuationCommand.token
    }

    return { comments: commentData, continuation: token }
  }
}

module.exports = CommentScraper
