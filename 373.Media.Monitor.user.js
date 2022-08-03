// ==UserScript==
// @name        373 Media Monitor
// @namespace   qmaru
// @match       https://minami-hamabe.net/video/*
// @require     https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// @grant       GM_addStyle
// @run-at      document-start
// @version     1.0.0
// @author      qmaru
// ==/UserScript==
(function () {
    var hls_urls = [];
    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
        this.addEventListener('load', function () {
            if (this.readyState == 4 && this.status == 200) {
                var url = this.responseURL
                if (this.responseType === "text") {
                    var content = this.responseText
                    if (content.indexOf("https://hls-auth.cloud.stream.co.jp") !== -1) {
                        var result = content.match(/https:\/\/.*1080p\.m3u8.*/)
                        if (result !== null) {
                            var url1080 = result[0]
                            hls_urls.push(url1080)
                        }
                    }
                }
                if (url.indexOf("key") !== -1) {
                    hls_urls.push(url)
                }
            }
        });
        origOpen.apply(this, arguments)
    };

    GM_addStyle(`
        #fc_dl {
            text-align: left;
        }
        #fc_a {
            padding:10px;
        }
        #fc_btn {
            outline: none;
            border: none;
            background-color: #4CAF50;
            color: white;
            width: 100px;
            height: 30px;
        }
        #fc_btn:active {
            outline: none;
            border: none;
            background-color: #367d39;
        }
    `
    )

    function DLButton(hls_urls) {
        var btn_html = ""
        for (i in hls_urls) {
            var url = hls_urls[i]
            var btn_name = ""
            if (url.indexOf("mediaplaylist") !== -1) {
                btn_name = "PLAYLIST"
            } else {
                btn_name = "KEY"
            }
            btn_html = btn_html + '<a id="fc_a" href="' + url + '"><button id="fc_btn">' + btn_name + '</button></a>'
        }

        $('.MuiTypography-h6').each(function () {
            var text = $(this).text()
            if (text !== "") {
                var DLButton = '<div id="fc_dl">' + btn_html + '</div>'
                $(this).append(DLButton)
            }
        })
    }

    setTimeout(() => {
        DLButton(hls_urls)
    }, 10000);
})();