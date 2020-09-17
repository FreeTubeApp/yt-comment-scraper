# YouTube Comment Scraper NodeJS Documentation
This NodeJS library scrapes the comments of the YouTube provided HTML comment data without any API usage. It is developed for and tailored towards easy usage in the [FreeTube](https://github.com/FreeTubeApp/FreeTube-Vue) rewrite but can be used with any other project as well.

Therefore, this library does not require any API keys, with the attached maximum quotas, but instead might take longer to receive the required data.

The library works as long as YouTube keeps its web page layout the same. Therefore, there is **no guarantee** that this library will work at all times.
If this library should not work at some point, please create an issue and let me know so that I can take a look into it. Pull requests are also welcomed in this case.

## Installation
`npm install yt-comment-scraper`

##Usage
`const ytcomments = require("yt-comment-scraper")`

## API
**scrape_trending_page()**
Returns a list of objects containing all the information of the trending videos.
```javascript
ytcomments.scrape_trending_page().then((data) =>{
    console.log(data);
}).catch((error)=>{
    console.log(error);
});

// The data is a list of objects containing the following attributes:
{
    videoId:            String,
    title:              String,
    type:               "video",
    author:             String,
    authorId:           String,
    authorUrl:          String,
    videoThumbnails:    Array[Objects],
    description:        String,
    viewCount:          Number,
    published:          Number as timestamp,
    publishedText:      String,
    lengthSeconds:      Number,
    timeText:           String,
    liveNow:            false,
    paid:               false,
    premium:            false,
    isUpcoming:         false
}

// The thumbnail objects:
{
    quality:    "String",
    url:        "String",
    width:      Number,
    height:     Number
}
```
## Credits
Thanks to egbertbouman for his/her Python [project](https://github.com/egbertbouman/youtube-comment-downloader) which guided this project through the difficult HTTP calls. 
