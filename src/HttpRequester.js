const axios = require("axios")
const baseURL = "https://www.youtube.com/"
const ajaxURL = "comment_ajax"

class HttpRequester {
    async getXsrfToken(videoId, setCookie=true) {
      // cookie1 = GPS=1; path=/; domain=.youtube.com; expires=Thu, 17-Sep-2020 13:03:47 GMT  cookie2 = VISITOR_INFO1_LIVE=a9IsI_YF_U8; path=/; domain=.youtube.com; secure; expires=Tue, 16-Mar-2021 12:33:47 GMT; httponly; samesite=None
      this.session = axios.create({
          baseURL: baseURL,
          timeout: 10000,
          headers: {
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

          if (setCookie) {
            this.cookie1 = response.headers["set-cookie"][0]
            //this.session.defaults.headers.Cookie = (response.headers["set-cookie"][1])
            this.cookie2 = response.headers["set-cookie"][0]+';'+response.headers["set-cookie"][1]+';'+response.headers["set-cookie"][2]
          }

          return xsrf
      } catch (e) {
          return {
              error: true,
              message: e
          }
      }
    }

    async requestCommentsPage(payload){

        this.session = axios.create({
            baseURL: baseURL,
            timeout: 10000,
            headers: {
                'accept-language': 'en-US,en;q=0.5'
            }
        })

        if (this.cookie1 && this.cookie2) {
          this.session.defaults.headers.Cookie = this.cookie1
          this.session.defaults.headers.Cookie = this.cookie2
        }

        const config = {
            headers: {
                'x-youtube-client-name': '1',
                'x-youtube-client-version': '2.20180222',
                'accept-language': 'en-US,en;q=0.5'
            }
        }

        // this params variable is needed in order to post the data as raw body and not as object
        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append('video_id', payload.videoId)
        urlSearchParams.append('session_token', payload.session_token)
        urlSearchParams.append('page_token', payload.page_token)

        return await this.session.post(ajaxURL + `?action_load_comments=1&order_by_time=${payload.order_by_time}&filter=${payload.filter}&order_menu=${payload.order_menu}`, urlSearchParams)
    }
}
module.exports = HttpRequester
