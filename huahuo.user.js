// ==UserScript==
// @name        Huahuo - API Data
// @namespace   qmaru
// @match       https://huahuo.bilibili.com/#/upper/*
// @require     https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// @author      青蛙王子
// @description 获取哔哩哔哩页面信息
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @grant       GM_xmlhttpRequest
// @version     1.0.0
// ==/UserScript==
(function () {
    'use strict';

    // 全局CSS样式
    GM_addStyle(`
        #hh_click {
            background-color: #4CAF50; /* Green */
            border: none;
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
        }
        #hh_body>div {
            padding: 4px;
        }
        #hh_body>div>span {
            padding: 2px;
        }
        .hh_tips {
            font-size: 14px;
            color: red;
        }
        #hh_type_list {
            padding: 6px
        }
        #hh_type_list>span>label {
            padding: 6px
        }
    `
    )

    // 从远程获取【内容类型】的列表
    function HHTagList() {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://huahuo.bilibili.com/commercialorder/api/web_api/v1/advertiser/content/tags",
            headers: {
                "User-Agent": navigator.userAgent,
            },
            onload: function (response) {
                var tagData = $.parseJSON(response.response)
                var result = tagData["result"]
                var idList = []
                idList.push({
                    "id": "",
                    "label": "全部"
                })
                for (var i in result) {
                    var pdata = result[i]
                    var pid = pdata["id"]
                    var plabel = pdata["label"]
                    idList.push({
                        "id": pid,
                        "label": plabel
                    })

                    var children1 = pdata["children"]
                    if (children1.length !== 0) {
                        for (var j in children1) {
                            var cdata1 = children1[j]
                            var cid1 = cdata1["id"]
                            var clabel1 = cdata1["label"]
                            idList.push({
                                "id": cid1,
                                "label": plabel + "-" + clabel1
                            })
                            var children2 = cdata1["children"]
                            if (children2.length !== 0) {
                                for (var k in children2) {
                                    var cdata2 = children2[k]
                                    var cid2 = cdata2["id"]
                                    var clabel2 = cdata2["label"]
                                    idList.push({
                                        "id": cid2,
                                        "label": plabel + "-" + clabel1 + "-" + clabel2
                                    })
                                }
                            }
                        }
                    }
                }
                // 生成select菜单
                for (var l in idList) {
                    var ids = idList[l]
                    var tid = ids["id"]
                    var tlabel = ids["label"]
                    $("#hh_tag_list").append('<option value="' + tid + '">' + tlabel + '</option>')
                }
            }
        });
    }

    // 从远程获取【全部区域】的列表
    function HHRegionList() {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://huahuo.bilibili.com/commercialorder/api/web_api/v1/advertiser/region/drop",
            headers: {
                "User-Agent": navigator.userAgent,
            },
            onload: function (response) {
                var tagData = $.parseJSON(response.response)
                var result = tagData["result"]
                var idList = [{
                    "id": "",
                    "label": "全部"
                }]
                for (var i in result) {
                    var pdata = result[i]
                    var pid = pdata["id"]
                    var plabel = pdata["label"]
                    idList.push({
                        "id": pid,
                        "label": plabel
                    })
                    var children1 = pdata["children"]
                    if (children1.length !== 0) {
                        for (var j in children1) {
                            var cdata1 = children1[j]
                            var cid1 = cdata1["id"]
                            var clabel1 = cdata1["label"]
                            idList.push({
                                "id": pid + "|" + cid1,
                                "label": plabel + "|" + clabel1
                            })
                        }
                    }
                }
                for (var l in idList) {
                    var ids = idList[l]
                    var tid = ids["id"]
                    var tlabel = ids["label"]
                    $("#hh_region_list").append('<option value="' + tid + '">' + tlabel + '</option>')
                }
            }
        });
    }

    // 从远程获取【全部分区】的列表
    function HHPartitionList() {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://huahuo.bilibili.com/commercialorder/api/web_api/v1/advertiser/partition/drop",
            headers: {
                "User-Agent": navigator.userAgent,
            },
            onload: function (response) {
                var tagData = $.parseJSON(response.response)
                var result = tagData["result"]
                var idList = [{
                    "id": "",
                    "label": "全部"
                }]
                for (var i in result) {
                    var pdata = result[i]
                    var pid = pdata["id"]
                    var plabel = pdata["label"]
                    idList.push({
                        "id": pid,
                        "label": plabel
                    })
                    var children1 = pdata["children"]
                    if (children1.length !== 0) {
                        for (var j in children1) {
                            var cdata1 = children1[j]
                            var cid1 = cdata1["id"]
                            var clabel1 = cdata1["label"]
                            idList.push({
                                "id": pid + "|" + cid1,
                                "label": plabel + "|" + clabel1
                            })
                        }
                    }
                }
                for (var l in idList) {
                    var ids = idList[l]
                    var tid = ids["id"]
                    var tlabel = ids["label"]
                    $("#hh_partition_list").append('<option value="' + tid + '">' + tlabel + '</option>')
                }
            }
        });
    }

    // 生成功能按钮
    function HHInfoButton() {
        var HHHTML = '<div id="hh_body">'
        var HHButton = '<div><button id="hh_click">获取本页信息</button></div>'
        var HHTIPS = '<div><p class="hh_tips">留空的值表示全部或不限制大小</p></div>'

        var HHpageSize = '<div><span>每页条数</span><input type="text" id="hh_pageSize" value="100"></input></div>'
        var HHTag = '<div><span>内容类型</span><select id="hh_tag_list"></select></div>'
        var HHminFans = '<div><span>粉丝最少</span><input type="text" id="hh_minFans"></input></div>'
        var HHmaxFans = '<div><span>粉丝最多</span><input type="text" id="hh_maxFans"></input></div>'
        var HHminPrice = '<div><span>最低报价</span><input type="text" id="hh_minPrice"></input></div>'
        var HHmaxPrice = '<div><span>最高报价</span><input type="text" id="hh_maxPrice"></input></div>'
        var HHPartition = '<div><span>内容分区</span><select id="hh_partition_list"></select></div>'
        var HHregionId = '<div><span>地理位置</span><select id="hh_region_list"></select></div>'
        var HHcoopType = '<div><span>合作类型</span><div id="hh_type_list"><span><input type="checkbox" id="hh_type_1" value="2"><label for="hh_type_1">定制</label></span><span><input type="checkbox" id="hh_type_2" value="1"><label for="hh_type_2">植入</label></span></div></div>'
        var HHpageNum = '<div><span>当前页码</span><input type="text" id="hh_pageNum"></input></div>'

        HHHTML = HHHTML + HHTIPS + HHpageSize + HHTag + HHminFans + HHmaxFans + HHminPrice + HHmaxPrice + HHPartition + HHregionId + HHcoopType + HHpageNum + HHButton + "</div>"
        $('body').prepend(HHHTML)
    }

    // 开始
    $(document).ready(function () {
        HHInfoButton()
        HHTagList()
        HHRegionList()
        HHPartitionList()

        // 内容类型选择
        $("#hh_tag_list").change(function () {
            var opt = $("#hh_tag_list ").val();
            if (opt !== "") {
                $('#hh_tag_list option[value="' + opt + '"]').attr('selected', 'selected');
                $('#hh_tag_list option[value!="' + opt + '"]').removeAttr('selected', 'selected');
            }
        });

        // 地理位置选择
        $("#hh_region_list").change(function () {
            var opt = $("#hh_region_list ").val();
            if (opt !== "") {
                $('#hh_region_list option[value="' + opt + '"]').attr('selected', 'selected');
                $('#hh_region_list option[value!="' + opt + '"]').removeAttr('selected', 'selected');
            }
        });

        // 内容分区选择
        $("#hh_partition_list").change(function () {
            var opt = $("#hh_partition_list ").val();
            if (opt !== "") {
                $('#hh_partition_list option[value="' + opt + '"]').attr('selected', 'selected');
                $('#hh_partition_list option[value!="' + opt + '"]').removeAttr('selected', 'selected');
            }
        });

        // 合作类型选择
        $("#hh_type_list input[type='checkbox']").click(function () {
            if ($(this).attr('checked')) {
                $(this).removeAttr('checked');
            } else {
                $(this).attr('checked', 'checked')
            }
        });

        $("#hh_click").click(function () {
            // 内容类型
            var hh_tagID = $("#hh_tag_list option:selected").val();
            // 地理位置
            var hh_region_id = $("#hh_region_list option:selected").val();
            var hh_region_html = ""
            if (hh_region_id.indexOf("|") !== -1) {
                var hh_region_ids = hh_region_id.split("|")
                hh_region_html = "region_id=" + hh_region_ids[0] + "&second_region_id=" + hh_region_ids[1]
            } else {
                hh_region_html = "region_id=" + hh_region_id + "&second_region_id="
            }
            // 内容分区
            var hh_partition_id = $("#hh_partition_list option:selected").val();
            var hh_partition_html = ""
            if (hh_partition_id.indexOf("|") !== -1) {
                var hh_partition_ids = hh_partition_id.split("|")
                hh_partition_html = "partition_id=" + hh_partition_ids[0] + "&second_partition_id=" + hh_partition_ids[1]
            } else {
                hh_partition_html = "partition_id=" + hh_partition_id + "&second_partition_id="
            }
            // 合作类型
            var typeList = []
            $("#hh_type_list input[type='checkbox']").each(function () {
                if ($(this).is(":checked")) {
                    typeList.push($(this).val())
                }
            })
            var hh_types = ""
            if (typeList.length !== 0) {
                hh_types = typeList.join(",")
            }

            if ($("#hh_pageNum").val() === "") {
                alert("页码为空")
                return false
            }
            var api_url = "https://huahuo.bilibili.com/commercialorder/api/web_api/v1/advertiser/search?"
            var paramas = "nickname=&upper_mid=&task_type=1&order_bys=&is_include_potential_upper=0&style_tag_id=0&provider_id=&"

            var hh_region_id = hh_region_html + "&"
            var hh_partition_id = hh_partition_html + "&"
            var hh_min_fans_num = "min_fans_num=" + $("#hh_minFans").val() + "&"
            var hh_max_fans_num = "max_fans_num=" + $("#hh_maxFans").val() + "&"
            var hh_content_tag_id = "content_tag_id=" + hh_tagID + "&"
            var hh_cooperation_types = "cooperation_types=" + hh_types + "&"
            var hh_min_task_price = "min_task_price=" + $("#hh_minPrice").val() + "&"
            var hh_max_task_price = "max_task_price=" + $("#hh_maxPrice").val() + "&"
            var hh_pageNum = "page=" + $("#hh_pageNum").val() + "&"
            var hh_pageSize = "size=" + $("#hh_pageSize").val()

            paramas = paramas + hh_region_id + hh_partition_id + hh_min_fans_num + hh_max_fans_num + hh_content_tag_id + hh_cooperation_types + hh_min_task_price + hh_max_task_price + hh_pageNum + hh_pageSize

            var url = api_url + paramas

            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                headers: {
                    "User-Agent": navigator.userAgent,
                },
                onload: function (response) {
                    var parsedJson = $.parseJSON(response.response)
                    var hdata = parsedJson['result']['data']
                    var all_data = ""
                    for (var i in hdata) {
                        var hh_data = hdata[i]
                        var hh_upper_mid = hh_data["upper_mid"]
                        var hh_nickname = hh_data["nickname"]
                        var hh_gender_desc = hh_data["gender_desc"]
                        var hh_region_desc = hh_data["region_desc"]
                        var hh_tags = hh_data["tags"].join(",")
                        var hh_fans_num = hh_data["fans_num"]
                        var hh_average_play_cnt = hh_data["average_play_cnt"]

                        var hh_price_infos = hh_data["price_infos"]
                        var hh_zhiru_price = 0
                        var hh_dingzhi_price = 0
                        for (var j in hh_price_infos) {
                            var hh_price_info = hh_price_infos[j]
                            var hh_cooperation_type_desc = hh_price_info["cooperation_type_desc"]
                            var hh_platform_price = parseInt(hh_price_info["platform_price"])
                            if (hh_cooperation_type_desc === "植入视频") {
                                hh_zhiru_price = hh_platform_price
                            } else if (hh_cooperation_type_desc === "定制视频") {
                                hh_dingzhi_price = hh_platform_price
                            }
                        }
                        var hh_homepage = "https://space.bilibili.com/" + hh_upper_mid

                        var dataArray = [
                            hh_upper_mid,
                            hh_nickname,
                            hh_gender_desc,
                            hh_region_desc,
                            hh_tags,
                            hh_fans_num,
                            hh_average_play_cnt,
                            hh_zhiru_price,
                            hh_dingzhi_price,
                            hh_homepage
                        ]
                        var dataStr = dataArray.join(";")
                        all_data = all_data + dataStr + "\n"
                    }
                    if (all_data.trim() !== "") {
                        GM_setClipboard(all_data.trim())
                        alert("已复制第" + $("#hh_pageNum").val() + "页的内容")
                    } else {
                        alert("警告！！！！第" + $("#hh_pageNum").val() + "页没用内容")
                    }
                }
            });
        });
    });
})();
