const ytcm = require('../index')

describe('Standalone Mode: Comment Testing', () => {

    console.log("Please be advised that these tests only cover the Standalone mode of the module.\nThe Integration mode with applications like Electron cannot be tested without including such tools.\nUnder normal circumstances Integration mode should work, if comments on FreeTube work.")

    test('Scrape top video comments of first page', () => {
        const parameters = {videoId: 'oBLQmE-nG60', setCookie: true, sortByNewest: false};
        ytcm.getComments(parameters).then((data) => {
            expect(data.comments).toHaveLength(20);
        });
    });

    test('Scrape newest video comments of first page', () => {
        const parameters = {videoId: 'oBLQmE-nG60', setCookie: true, sortByNewest: true};
        ytcm.getComments(parameters).then((data) => {
            expect(data.comments).toHaveLength(20);
        });
    });

    test('Scrape newest video comments second page', () => {
        let parameters = {videoId: 'oBLQmE-nG60', setCookie: true, sortByNewest: true, continuation: null};
        ytcm.getComments(parameters).then((data) => {
            parameters["continuation"] = data.continuation;
            ytcm.getComments(parameters).then((data) => {
                expect(data.comments).not.toHaveLength(0);
            });
        });
    });

    test('Scrape top replies of first page', () => {
        const parameters = {videoId: 'oBLQmE-nG60', setCookie: true, sortByNewest: false};
        // This test first gets comments of the video with above Id
        ytcm.getComments(parameters).then((data) => {
            for (let i = 0; i < data.comments.length; i++) {
                // The test searches for a comment which does have at least 1 reply and then ask for the replies
                if (data.comments[i].numReplies > 0) {
                    const replyParameters = {videoId: 'oBLQmE-nG60', replyToken: data.comments[i].replyToken, setCookie: true};
                    ytcm.getCommentReplies(replyParameters).then((replyData) => {
                        expect(replyData.comments).toHaveLength(10);
                    });
                    break
                }
            }
        });
    });

    test('Scrape second batch of top replies of first page', () => {
        const parameters = {videoId: 'oBLQmE-nG60', setCookie: true, sortByNewest: false};
        // This test first gets comments of the video with above Id
        ytcm.getComments(parameters).then((data) => {
            for (let i = 0; i < data.comments.length; i++) {
                // The test searches for a comment which does have at least 1 reply and then ask for the replies
                if (data.comments[i].numReplies > 0) {
                    let replyParameters = {videoId: 'oBLQmE-nG60', replyToken: data.comments[i].replyToken, setCookie: true};
                    ytcm.getCommentReplies(replyParameters).then((replyData) => {
                        replyParameters.replyToken = replyData.continuation;
                        ytcm.getCommentReplies(replyParameters).then((replyData) => {
                            expect(replyData.comments).not.toHaveLength(0);
                        })
                    });
                    break
                }
            }
        });
    });

    test('Scrape video without comments', () => {
        const parameters = {videoId: 'Bj-3M-KqZsI', setCookie: true, sortByNewest: false};
        ytcm.getComments(parameters).then((data) => {
            expect(data.comments).toHaveLength(0);
        });
    });

})
