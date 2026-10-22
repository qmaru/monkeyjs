// ==UserScript==
// @name        373 Media Monitor
// @namespace   qmaru
// @match       https://minami-hamabe.net/video/*
// @match       https://minami-hamabe.net/articles/news/*
// @require     https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// @grant       GM_addStyle
// @run-at      document-start
// @version     2.0.0
// @author      qmaru
// @description minami fanclub media download
// ==/UserScript==
(function () {
    var hls_urls = [];
    var article_data = null;
    var article_api = "/article_themes/news/articles/" + location.pathname.split("/").pop();
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
                if (url.indexOf(article_api) !== -1) {
                    article_data = typeof this.response === "string" ? JSON.parse(this.response) : this.response
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
        .fc_art_dl {
            margin: 20px 0;
        }
        .fc_img_dl {
            margin: 4px 8px 4px 0;
            outline: none;
            border: none;
            background-color: #4CAF50;
            color: white;
            padding: 4px 12px;
        }
        .fc_img_dl:active {
            background-color: #367d39;
        }
        .fc_img_dl:disabled {
            background-color: #999;
            opacity: 0.6;
            cursor: wait;
        }
    `
    )

    function DLButton(hls_urls) {
        var btn_data = []
        for (i in hls_urls) {
            var url = hls_urls[i]
            var btn_name = ""
            if (url.indexOf("mediaplaylist") !== -1) {
                btn_name = "PLAYLIST"
            } else {
                btn_name = "KEY"
            }
            btn_data.push({
                "name": btn_name,
                "url": url
            })
        }

        $('.MuiTypography-h6').each(function () {
            var text = $(this).text()
            if (text !== "") {
                btn_html = ""
                for (i in btn_data) {
                    btn = btn_data[i]
                    btn_html = btn_html + '<a id="fc_a" href="' + btn.url + "#" + text + '"><button id="fc_btn">' + btn.name + '</button></a>'
                }
                var DLButton = '<div id="fc_dl">' + btn_html + '</div>'
                $(this).append(DLButton)
            }
        })
    }

    function ArticleButton() {
        var timer = setInterval(function () {
            if (article_data === null) {
                return
            }
            var html = article_data.data.article.article.contents
            if (!html) {
                clearInterval(timer)
                console.error("article contents empty", article_data)
                return
            }
            var srcs = Array.from(html.matchAll(/<img[^>]+src="([^"]+)"/g), function (m) {
                return m[1]
            })
            console.log("article image urls", srcs)
            var last = $("img").filter(function () {
                return this.src === srcs[srcs.length - 1]
            })
            if (last.length === 0) {
                return
            }
            clearInterval(timer)
            var group = $('<div class="fc_art_dl"></div>')
            srcs.forEach(function (src, i) {
                var name = src.split("?")[0].split("/").pop()
                var btn = $('<button class="fc_img_dl">download ' + (i + 1) + '</button>')
                btn.on("click", function () {
                    btn.prop("disabled", true)
                    setTimeout(function () {
                        btn.prop("disabled", false)
                    }, 2000)
                    fetch(src, { credentials: "include" })
                        .then(function (res) {
                            return res.blob().then(function (blob) {
                                console.log("image download response", {
                                    url: src,
                                    status: res.status,
                                    type: res.headers.get("content-type"),
                                    size: blob.size
                                })
                                if (!res.ok) {
                                    throw new Error("image request failed: " + res.status)
                                }
                                return blob
                            })
                        })
                        .then(function (blob) {
                            var a = document.createElement("a")
                            a.href = URL.createObjectURL(blob)
                            a.download = name
                            document.body.appendChild(a)
                            a.click()
                            a.remove()
                            setTimeout(function () {
                                URL.revokeObjectURL(a.href)
                            }, 1000)
                        })
                        .catch(function (error) {
                            console.error("image download failed", src, error)
                        })
                })
                group.append(btn)
            })
            last.closest("p").parent().append(group)
        }, 500)
    }

    setTimeout(() => {
        DLButton(hls_urls)
        ArticleButton()
    }, 10000);
})();