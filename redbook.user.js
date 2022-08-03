// ==UserScript==
// @name        RedBook - API Data
// @namespace   qmaru
// @match       https://influencer.xiaohongshu.com/solar/*
// @require     https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// @author      青蛙王子
// @description 获取小红书页面信息
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @grant       GM_xmlhttpRequest
// @version     1.1.2
// ==/UserScript==
(function () {
    'use strict';

    GM_addStyle(`
        #rb_click {
            background-color: #4CAF50; /* Green */
            border: none;
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
        }
        #rb_body>div {
            padding: 4px;
        }
        #rb_body>div>span {
            padding: 2px;
        }
        .rb_tips {
            font-size: 14px;
            color: red;
        }
    `
    )

    function RBInfoButton() {
        var RBHTML = '<div id="rb_body">'
        var RBButton = '<div><button id="rb_click">获取本页信息</button></div>'
        var RBTIPS = '<div><p class="rb_tips">1.多个[地理位置]或[标签]用英文逗号(,)隔开</p><p class="rb_tips">2.留空的值表示全部或不限制大小</p></div>'
        var RBminPrice = '<div><span>最低报价</span><input type="text" id="rb_minPrice"></input></div>'
        var RBmaxPrice = '<div><span>最高报价</span><input type="text" id="rb_maxPrice"></input></div>'
        var RBminFans = '<div><span>粉丝最少</span><input type="text" id="rb_minFans"></input></div>'
        var RBmaxFans = '<div><span>粉丝最多</span><input type="text" id="rb_maxFans"></input></div>'
        var RBlocation = '<div><span>地理位置</span><input type="text" id="rb_location"></input></div>'
        var RBtype = '<div><span>设置标签</span><input type="text" id="rb_type"></input></div>'
        var RBpageSize = '<div><span>每页条数</span><input type="text" id="rb_pageSize" value="100"></input></div>'
        var RBpageNum = '<div><span>当前页码</span><input type="text" id="rb_pageNum"></input></div>'
        RBHTML = RBHTML + RBTIPS + RBpageSize + RBminFans + RBmaxFans + RBminPrice + RBmaxPrice + RBlocation + RBtype + RBpageNum + RBButton + "</div>"
        $('body').prepend(RBHTML)
    }

    $(document).ready(function () {
        RBInfoButton()

        $("#rb_click").click(function () {
            if ($("#rb_pageNum").val() === "") {
                alert("页码为空")
                return false
            }
            var api_url = "https://influencer.xiaohongshu.com/api/solar/cooperator/blogger/v1?"
            var paramas = "cpc=false&sort=asc&userType=0&column=comprehensiverank&"
            var rb_minPrice = "minPrice=" + $("#rb_minPrice").val()
            var rb_maxPrice = "maxPrice=" + $("#rb_maxPrice").val()
            var rb_minFans = "minFans=" + $("#rb_minFans").val()
            var rb_maxFans = "maxFans=" + $("#rb_maxFans").val()
            var rb_location = "location=" + $("#rb_location").val()
            var rb_type = "type=" + $("#rb_type").val()
            var rb_pageSize = "pageSize=" + $("#rb_pageSize").val()
            var rb_pageNum = "pageNum=" + $("#rb_pageNum").val()
            paramas = paramas + rb_minPrice + "&" + rb_maxPrice + "&" + rb_minFans + "&" + rb_maxFans + "&" + rb_location + "&" + rb_type + "&" + rb_pageSize + "&" + rb_pageNum
            var url = api_url + paramas

            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                headers: {
                    "User-Agent": navigator.userAgent,
                },
                onload: function (response) {
                    var parsedJson = $.parseJSON(response.response)
                    var kols = parsedJson['data']['kols']
                    var all_data = ""
                    for (var i in kols) {
                        var r_data = kols[i]
                        var r_name = r_data["name"]
                        var r_redID = r_data["redId"]
                        var r_location = r_data["location"].replaceAll(" ", "")
                        var r_type = r_data["type"].join(",")
                        var r_fansCount = r_data["fansCount"]
                        var r_likeCollectCountInfo = r_data["likeCollectCountInfo"]
                        var r_totalNoteCount = r_data["totalNoteCount"]
                        var r_picturePrice = parseInt(r_data["picturePrice"])
                        var r_videoPrice = parseInt(r_data["videoPrice"])
                        var r_homepage = "https://www.xiaohongshu.com/user/profile/" + r_data["userId"]
                        var data = r_name + ";" + r_redID + ";" + r_homepage + ";" + r_location + ";" + r_type + ";" + r_fansCount + ";" + r_likeCollectCountInfo + ";" + r_totalNoteCount + ";" + r_picturePrice + ";" + r_videoPrice
                        all_data = all_data + data + "\n"
                    }
                    GM_setClipboard(all_data.trim())
                    alert("已复制第" + $("#rb_pageNum").val() + "页的内容")
                }
            });
        });
    });

})();