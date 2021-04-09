    //  Youtube Player APIs for video Tracking
    if (typeof jQuery != "undefined") {
        var playerInfoList = new Array();
        var players = new Array();
        var playerCheckInterval, videoTitle, mediaLength, mediaOffset, videoTime, videoTimePrevious;
        var firstMilestoneFlag = true;
        var mileStones = [10, 25, 50, 75, 99];

        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        $("iframe[src*='enablejsapi=1']").each(function() {
            var player = jQuery(this).attr('id');
            playerInfoList.push(player);
        });
        var players = new Array();
        window.onYouTubeIframeAPIReady = function() {
            for (x = 0; x < playerInfoList.length; x++)
                players[x] = new YT.Player(playerInfoList[x], {
                    events: {
                        'onStateChange': onPlayerStateChange
                    }
                });
        }

        function onPlayerStateChange(event) {
            videoTitle = event.target.getVideoData().title;
            mediaLength = Math.floor(event.target.getDuration());
            mediaOffset = Math.floor(event.target.getCurrentTime());
            _satellite.logger.info("Inside functino onPlayerStateChange()")

            if (event.data == YT.PlayerState.PLAYING) {
                _satellite.logger.info("Inside IF YT.PlayerState.PLAYING")
                if (mediaOffset == 0) {
                    _satellite.track('trackVideoStart', {
                        videoTitle: videoTitle
                    });
                    playerCheckInterval = setInterval(mileStoneCheck, 2000);
                } else {
                    clearInterval(playerCheckInterval);
                    mediaOffset = Math.floor(event.target.getCurrentTime())
                    for (i = 0; i < mileStones.length; i++) {
                        if (mediaOffset <= mileStones[i]) {
                            mileStones.splice(0, i);
                            break;
                        }
                    }
                    playerCheckInterval = setInterval(mileStoneCheck, 2000)
                }
            } else if (event.data == YT.PlayerState.ENDED) {
                clearInterval(playerCheckInterval);
                _satellite.track('trackVideoEnd', {
                    videoTitle: videoTitle
                });
                videoTime = mediaOffset - videoTimePrevious
            }

            function mileStoneCheck() {
                mediaOffset = Math.floor(event.target.getCurrentTime());
                var percComplete = (mediaOffset / mediaLength) * 100;
                var next_ms = mileStones[0];
                if (next_ms <= percComplete) {
                    if (firstMilestoneFlag) {
                        videoTimePrevious = videoTime = mediaOffset;
                        firstMilestoneFlag = false;
                    } else {
                        videoTime = mediaOffset - videoTimePrevious;
                        videoTimePrevious = mediaOffset;
                    }
                    mileStones.shift();
                    _satellite.track('trackVideoMilestone', {
                        videoTitle: videoTitle,
                        mileStone: next_ms
                    });
                }
            } // end of mileStoneCheck()	

        } //end of function onPlayerStateChange()

    } // end of Youtube tracking
