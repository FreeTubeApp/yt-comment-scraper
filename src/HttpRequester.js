const axios = require("axios")
const baseURL = "https://www.youtube.com/"
const ajaxURL = "comment_service_ajax"

// Generates random integer (start and end inclusive)
function random(start, end) {
  return Math.floor(Math.random() * (end - start + 1)) + start
}

class HttpRequester {
    constructor(setCookie = false) {
      this.session = axios.create({
        baseURL: baseURL,
        timeout: 10000,
        headers: {
          'X-YouTube-Client-Name': '1',
          'X-YouTube-Client-Version': '2.20210331.06.00',
          'accept-language': 'en-US,en;q=0.5',
        }
      })
      // NOTE: This currently provides a CONSENT cookie to
      // everyone, including non-European populations,
      // making this cookie potentially fingerprintable
      if(setCookie) {
        this.session.defaults.headers.cookie = [`CONSENT=YES+cb.20210328-17-p0.en+FX+${random(100, 999)}`]
      }

    }

    async getVideoTokens(videoId, sortBy='top', setCookie=false) {
      try {
        const response = await this.session.get(baseURL+ "watch?v=" + videoId)
        const html_data = response.data
        const pre_token = html_data.match(/"XSRF_TOKEN":"[^"]*"/)[0]

        // token embedded in page, needed for ajax request
        let xsrf = pre_token.substring(14, pre_token.length-1)
        xsrf = xsrf.replace(/\\u003d/g, "=")

        let continuation = html_data.match(/"nextContinuationData":{"continuation":"(.*?)}/)[0]
        continuation = JSON.parse(`{${continuation}}`)

        let continuationToken = continuation.nextContinuationData.continuation

        if (sortBy === 'new') {
          const letterContinuationList = {
            Q: "T",
            w: "z",
            A: "D"
          }
          let serializedToken, letterContinuation
          try {
            let serializedShareEntity = html_data.match(/"serializedShareEntity":(.*?)}/)[0]
            serializedShareEntity = JSON.parse(`{${serializedShareEntity}`)
            serializedToken = serializedShareEntity.serializedShareEntity.replace(/\w%3D%3D/, '')
            letterContinuation = serializedShareEntity.serializedShareEntity.replace(/%3D%3D/, '')
          } catch {
            let getTranscriptEndpointParams = html_data.match(/"getTranscriptEndpoint":{"params":"(.*?)}/)[0]
            getTranscriptEndpointParams = JSON.parse(`{${getTranscriptEndpointParams}}`)
            serializedToken = getTranscriptEndpointParams.getTranscriptEndpoint.params.replace(/\w%3D%3D/, '')
            letterContinuation = getTranscriptEndpointParams.getTranscriptEndpoint.params.replace(/%3D%3D/, '')
          }
          serializedToken = serializedToken.replace(/C{1}/, '')
          letterContinuation = letterContinuationList[letterContinuation.slice(-1)]
          continuationToken = continuationToken.replace('%3D', '') + `yFSIRI${serializedToken}${letterContinuation}ABeAIwAA%3D%3D`
        }
        if (setCookie) {
          for (const cookie of response.headers["set-cookie"]) {
            const prunedCookie = cookie.match(/([A-Z0-9_]+=[^;]+);.+/)[1]
            this.session.defaults.headers['cookie'].push(prunedCookie)
          }
        }

        return {
          xsrf: xsrf,
          continuation: continuationToken
        }
      } catch (e) {
        return {
            error: true,
            message: e
        }
      }
    }

    async requestCommentsPage(payload){
      let endpoint
      if (payload.useReplyEndpoint) {
        endpoint = 'action_get_comment_replies'
      } else {
        endpoint = 'action_get_comments'
      }

      const urlParams = new URLSearchParams();
      urlParams.append(endpoint, '1')
      urlParams.append('pbj', '1')
      urlParams.append('ctoken', payload.page_token)
      urlParams.append('continuation', payload.page_token)

      // This variable is necessary in order to post the data
      // as raw body and not as object
      const urlBodyParams = new URLSearchParams();
      urlBodyParams.append('session_token', payload.session_token)

      return await this.session.post(
        `${ajaxURL}?${urlParams.toString()}`,
        urlBodyParams
      )
    }
}
module.exports = HttpRequester
