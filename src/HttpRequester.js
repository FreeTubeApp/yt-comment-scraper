const axios = require('axios')
const baseURL = 'https://www.youtube.com'

class HttpRequester {
  constructor(mustSetCookie, httpsAgent) {
    this.mustSetCookie = mustSetCookie
    this.session = axios.create({
      baseURL: baseURL,
      timeout: 10000,
      headers: {
        'accept-language': 'en-US,en;q=0.5',
      },
      httpsAgent: httpsAgent
    })

    // NOTE: This currently provides a CONSENT cookie to
    // everyone, including non-European populations,
    // making this cookie potentially fingerprintable
    if (this.mustSetCookie) {
      this.session.defaults.headers.cookie = ['CONSENT=YES+']
    }
  }

  static async create(videoId, mustSetCookie, httpsAgent) {
    const requester = new HttpRequester(mustSetCookie, httpsAgent)
    let initialResponse
    try {
      initialResponse = await requester.session.get(`/watch?v=${videoId}`)
    } catch {
      return {
        error: true,
        message: `Unable to reach ${baseURL}/watch?v=${videoId}`
      }
    }

    const htmlData = initialResponse.data

    // Cache data in the requester for future use
    requester.cachedInitialData = htmlData

    const ytConfigSelectors = [
      /"INNERTUBE_CONTEXT_CLIENT_NAME":(\d*)/, // X-YouTube-Client-Name
      /"INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]*)"/, // X-YouTube-Client-Version
    ]

    const ytConfigData = htmlData.match(
      new RegExp(ytConfigSelectors.map(r => r.source).join('.*'))
    )

    // Set YouTube specific headers for the subsequent requests
    requester.session.defaults.headers = {
      ...requester.session.defaults.headers,
      'X-YouTube-Client-Name': ytConfigData[1],
      'X-YouTube-Client-Version': ytConfigData[2]
    }

    return requester
  }

  getContinuationToken(sortByNewest) {
    const result = this.cachedInitialData.match(
      /"itemSectionRenderer".*"token":"([^"]*)".*"targetId":"comments-section"/
    )

    if (!result) {
      return null
    }

    const continuation = result[1]
    // Gets top comments by default, and new comments if true
    return sortByNewest
      ? (continuation.slice(0, 47) + 'B' + continuation.substring(48))
      : continuation
  }

  async requestCommentsPage(continuation) {
    const payload = {
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: this.session.defaults.headers['X-YouTube-Client-Version']
        }
      },
      continuation
    }

    return await this.session.post(
      '/youtubei/v1/next?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
      payload
    )
  }
}
module.exports = HttpRequester
