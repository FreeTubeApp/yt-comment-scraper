const axios = require("axios")
const baseURL = "https://www.youtube.com/"
const ajaxURL = "comment_service_ajax"

class HttpRequester {
    async getVideoTokens(videoId, sortBy='top', setCookie=true) {
      // cookie1 = GPS=1; path=/; domain=.youtube.com; expires=Thu, 17-Sep-2020 13:03:47 GMT  cookie2 = VISITOR_INFO1_LIVE=a9IsI_YF_U8; path=/; domain=.youtube.com; secure; expires=Tue, 16-Mar-2021 12:33:47 GMT; httponly; samesite=None
      this.session = axios.create({
          baseURL: baseURL,
          timeout: 10000,
          headers: {
            'X-YouTube-Client-Name': '1',
            'X-YouTube-Client-Version': '2.20201202.06.01',
            'accept-language': 'en-US,en;q=0.5'
          }
      })
      try {
          const response =  await axios.get(baseURL+ "watch?v=" + videoId)
          const html_data = response.data
          const pre_token = html_data.match(/"XSRF_TOKEN":"[^"]*"/)[0]

          // token embedded in page, needed for ajax request
          let xsrf = pre_token.substring(14, pre_token.length-1)
          xsrf = xsrf.replace(/\\u003d/g, "=")

          let continuation = html_data.match(/"nextContinuationData":{"continuation":"(.*?)}/)[0]
          continuation = JSON.parse(`{${continuation}}`)

          let serializedShareEntity = html_data.match(/"serializedShareEntity":(.*?)}/)[0]
          serializedShareEntity = JSON.parse(`{${serializedShareEntity}`)

          let serializedToken = serializedShareEntity.serializedShareEntity.replace(/\w%3D%3D/, '')
          serializedToken = serializedToken.replace(/C{1}/, '')

          let continuationToken = continuation.nextContinuationData.continuation

          if (sortBy === 'new') {
            continuationToken = continuationToken.replace('%3D', '') + `yFSIRI${serializedToken}TABeAIwAA%3D%3D`
          }

          // const clickTrackingParams = continuation.nextContinuationData.clickTrackingParams

          if (setCookie) {
            this.cookie1 = response.headers["set-cookie"][0]
            //this.session.defaults.headers.Cookie = (response.headers["set-cookie"][1])
            this.cookie2 = response.headers["set-cookie"][0]+';'+response.headers["set-cookie"][1]+';'+response.headers["set-cookie"][2]
          }

          const returnData = {
            xsrf: xsrf,
            continuation: continuationToken
          }

          return returnData
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
