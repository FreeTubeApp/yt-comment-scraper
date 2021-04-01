const axios = require("axios")
const baseURL = "https://www.youtube.com/"
const ajaxURL = "comment_service_ajax"

// Generates random integer (start and end inclusive)
function random(start, end) {
  return Math.floor(Math.random() * (end - start + 1)) + start
}

class HttpRequester {
    constructor() {
      this.session = axios.create({
        baseURL: baseURL,
        timeout: 10000,
        headers: {
          'X-YouTube-Client-Name': '1',
          'X-YouTube-Client-Version': '2.20210331.06.00',
          'accept-language': 'en-US,en;q=0.5',
          // NOTE: This currently provides a CONSENT cookie to
          // everyone, including non-European populations,
          // making this cookie potentially fingerprintable
          'cookie': [
            `CONSENT=YES+cb.20210328-17-p0.en+FX+${random(100, 999)}`
          ]
        }
      })
    }

    async getVideoTokens(videoId, sortBy='top', setCookie=true) {
      try {
          const response =  await axios.get(baseURL+ "watch?v=" + videoId)
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

          // const clickTrackingParams = continuation.nextContinuationData.clickTrackingParams

          if (setCookie) {
            this.cookie1 = response.headers["set-cookie"][0]
            //this.session.defaults.headers.Cookie = (response.headers["set-cookie"][1])
            this.cookie2 = response.headers["set-cookie"][0]+';'+response.headers["set-cookie"][1]+';'+response.headers["set-cookie"][2]
          }

        for (const cookie of response.headers["set-cookie"]) {
          const prunedCookie = cookie.match(/([A-Z0-9_]+=[^;]+);.+/)[1]
          this.session.defaults.headers['cookie'].push(prunedCookie)
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
        if (this.cookie1 && this.cookie2) {
          this.session.defaults.headers.Cookie = this.cookie1
          this.session.defaults.headers.Cookie = this.cookie2
        }

        // this params variable is needed in order to post the data as raw body and not as object
        const urlSearchParams = new URLSearchParams();
        // urlSearchParams.append('video_id', payload.videoId)
        urlSearchParams.append('session_token', payload.session_token)
        // urlSearchParams.append('page_token', payload.page_token)

        let urlParams

        if (payload.useReplyEndpoint) {
          urlParams = `?action_get_comment_replies=1&pbj=1&ctoken=${payload.page_token}&continuation=${payload.page_token}`
        } else {
          urlParams = `?action_get_comments=1&pbj=1&ctoken=${payload.page_token}&continuation=${payload.page_token}`
        }

        return await this.session.post(ajaxURL + urlParams, urlSearchParams)
    }
}
module.exports = HttpRequester
