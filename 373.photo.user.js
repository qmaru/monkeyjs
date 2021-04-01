// ==UserScript==
// @name        373 FanClub Photo
// @namespace   aobeom
// @match       https://minamihamabe.futureartist.net/photogallery/*
// @require     https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// @author      qmaru
// @description 下载 Photogallery 的图片
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @grant       GM_xmlhttpRequest
// @version     1.0.1
// ==/UserScript==
(function () {
    'use strict';

    GM_addStyle(`
        #fc_dl {
            text-align: center;
        }
        #fc_btn {
            outline: none;
            border: none;
            background-color: #4CAF50;
            color: white;
        }
        #fc_btn:active {
            outline: none;
            border: none;
            background-color: #367d39;
        }
        #fc_img {
            text-align: center;
            margin: 0;
        }
        #fc_li>a {
            color: #4CAF50;
        }
    `
    )

    function DLButton() {
        var DLButton = '<div id="fc_dl"><button id="fc_btn">Get Items</button></div>'
        $('.column .medium-4').append(DLButton)
    }

    function ImgDownload(urls) {
        var imglist = ""
        for (var i in urls) {
            var url = urls[i]
            var img_id = url["id"]
            var img_url = url["url"]
            var img = '<li id="fc_li"><a target="_blank" href="' + img_url + '">' + img_id + '</a></li>'
            imglist = imglist + img
        }
        var imgBody = '<ul id="fc_img"><li>Click to download</li>' + imglist + '</ul>'
        $('.column .medium-4').append(imgBody)
    }

    $(document).ready(function () {
        DLButton()

        var prefix_url = "https://minamihamabe.futureartist.net/resources/"
        var suffix_url = "/download?lang=zh-CN"
        $("#fc_btn").click(function () {
            var imgs = []
            $(".gallery-photos div a").each(function () {
                try {
                    var img_id_raw = $(this).attr("id")
                    var img_id = img_id_raw.split("_")[1]
                    var dl_url = prefix_url + img_id + suffix_url
                } catch {
                    var dl_url = $(this).attr("href")
                    var dl_url_parts = dl_url.split("/")
                    var dl_url_name = dl_url_parts[dl_url_parts.length - 1]
                    var img_id_name = dl_url_name.split("?")[0]
                    var img_id = img_id_name.split("-")[0]
                }
                imgs.push({
                    "id": img_id,
                    "url": dl_url
                })
            })
            ImgDownload(imgs)
            $("#fc_btn").attr("disabled", "true")
        })
    });

})();