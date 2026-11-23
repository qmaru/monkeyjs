// ==UserScript==
// @name        373 Media Monitor
// @namespace   qmaru
// @match       https://minami-hamabe.net/video/*
// @match       https://minami-hamabe.net/audio/*
// @match       https://minami-hamabe.net/articles/news/*
// @match       https://minami-hamabe.net/articles/photo-gallery/*
// @grant       GM.addStyle
// @grant       GM.download
// @grant       GM.xmlHttpRequest
// @grant       unsafeWindow
// @connect     hls-auth.cloud.stream.co.jp
// @connect     delivery.domand.dms.minami-hamabe.net
// @connect     minami-hamabe.net
// @run-at      document-start
// @version     3.0.0
// @author      qmaru
// @description minami fanclub media download
// ==/UserScript==
// Async entry point; GM APIs below use their Promise-based GM4 forms.
(async () => {
    // Change only these site URL rules when integrating another HLS website.
    const HLS_URL_RULES = {
        video: /^https:\/\/hls-auth\.cloud\.stream\.co\.jp\//i,
        audio: /^https:\/\/delivery\.domand\.dms\.minami-hamabe\.net\//i
    }

    let articleData = null
    const articleType = location.pathname.includes("/photo-gallery/") ? "photo-gallery" : "news"
    const articleApi = `/article_themes/${articleType}/articles/${location.pathname.split("/").pop()}`

    function createHlsProcessor(urlRules) {
        const hlsUrls = []
        const streamState = {
            video: { playlist: null, key: null, requested: null },
            audio: { playlist: null, key: null, requested: null },
            media: { playlist: null, key: null, requested: null }
        }
        const masterTypes = new Set()
        const isPlaylistUrl = url => /\.m3u8(?:\?|$)/i.test(url)
        const getHlsUrlType = url => Object.entries(urlRules)
            .find(([, rule]) => rule.test(url))?.[0]
        const isHlsUrl = url => Boolean(getHlsUrlType(url))
        const getStreamType = (attributes, url) => {
            const urlType = getHlsUrlType(url)
            if (urlType) return urlType
            if (/RESOLUTION=\d+x\d+/i.test(attributes) || /(?:avc|hev|hvc|vp\d|av01)/i.test(attributes)) {
                return "video"
            }
            if (/(?:mp4a|ac-3|ec-3|opus|vorbis)/i.test(attributes)) {
                return "audio"
            }
            return "media"
        }
        const parseMasterStreams = (content, baseUrl) => {
            const lines = content.split(/\r?\n/)
            return lines.flatMap((line, index) => {
                if (!line.startsWith("#EXT-X-STREAM-INF:")) return []
                const attributes = line.slice("#EXT-X-STREAM-INF:".length)
                const streamPath = lines.slice(index + 1).find(candidate => candidate && !candidate.startsWith("#"))
                if (!streamPath) return []
                try {
                    const streamUrl = new URL(streamPath.trim(), baseUrl).href
                    return [{
                        bandwidth: Number(attributes.match(/(?:^|,)BANDWIDTH=(\d+)/i)?.[1] || 0),
                        url: streamUrl,
                        type: getStreamType(attributes, streamUrl)
                    }]
                } catch {
                    return []
                }
            }).filter(({ url }) => isPlaylistUrl(url))
        }

        async function handleHlsResponse(url, content) {
            if (!url || !content) return
            const streams = parseMasterStreams(content, url)
            streams.forEach(({ type }) => masterTypes.add(type))
            const highestStreams = streams.reduce((highest, stream) => {
                if (!highest[stream.type] || stream.bandwidth > highest[stream.type].bandwidth) {
                    highest[stream.type] = stream
                }
                return highest
            }, {})

            for (const [type, stream] of Object.entries(highestStreams)) {
                const state = streamState[type]
                const previousUrl = state.playlist
                if (previousUrl && previousUrl !== stream.url) {
                    const previousIndex = hlsUrls.indexOf(previousUrl)
                    if (previousIndex !== -1) hlsUrls.splice(previousIndex, 1)
                    if (state.key) {
                        const previousKeyIndex = hlsUrls.indexOf(state.key)
                        if (previousKeyIndex !== -1) hlsUrls.splice(previousKeyIndex, 1)
                        state.key = null
                    }
                }

                state.playlist = stream.url
                if (!hlsUrls.includes(stream.url)) hlsUrls.push(stream.url)
                if (state.requested === stream.url) continue

                state.requested = stream.url
                try {
                    const response = await GM.xmlHttpRequest({ method: "GET", url: stream.url })
                    if (response.status !== 200 || state.playlist !== stream.url) continue

                    const keyMatch = response.responseText.match(/#EXT-X-KEY:[^\r\n]*URI="([^"]+)"/)
                    if (!keyMatch) continue
                    const keyUrl = new URL(keyMatch[1], stream.url).href
                    if (state.key && state.key !== keyUrl) {
                        const previousKeyIndex = hlsUrls.indexOf(state.key)
                        if (previousKeyIndex !== -1) hlsUrls.splice(previousKeyIndex, 1)
                    }
                    state.key = keyUrl
                    if (!hlsUrls.includes(state.key)) hlsUrls.push(state.key)
                    addVideoButtons(hlsUrls)
                } catch (error) {
                    console.error("playlist request failed", stream.url, error)
                }
            }

            if (streams.length === 0 && isPlaylistUrl(url)) {
                const selectedType = Object.keys(streamState).find(key => streamState[key].playlist === url)
                const type = selectedType || getHlsUrlType(url) || "media"
                if (!selectedType && masterTypes.has(type)) return
                if (!streamState[type].playlist) {
                    streamState[type].playlist = url
                    if (!hlsUrls.includes(url)) hlsUrls.push(url)
                }
            }

            const type = Object.keys(streamState).find(key => streamState[key].playlist === url) || "media"
            const state = streamState[type]
            if (url !== state.playlist) return

            const keyMatch = content.match(/#EXT-X-KEY:[^\r\n]*URI="([^"]+)"/)
            if (!keyMatch) return
            const keyUrl = new URL(keyMatch[1], url).href
            const previousKey = state.key
            if (previousKey && previousKey !== keyUrl) {
                const previousKeyIndex = hlsUrls.indexOf(previousKey)
                if (previousKeyIndex !== -1) hlsUrls.splice(previousKeyIndex, 1)
            }
            state.key = keyUrl
            if (!hlsUrls.includes(keyUrl)) hlsUrls.push(keyUrl)
            addVideoButtons(hlsUrls)
        }

        return {
            isHlsUrl,
            handleHlsResponse,
            renderButtons: () => addVideoButtons(hlsUrls)
        }
    }

    const hlsProcessor = createHlsProcessor(HLS_URL_RULES)

    async function handleArticleResponse(url, xhr) {
        if (!url?.includes(articleApi) || !xhr.responseText) return
        try {
            // Keep the page XHR as text because Axios reads responseText; parse our copy separately.
            articleData = await new Response(xhr.responseText).json()
        } catch (error) {
            console.error("article response parse failed", url, error)
        }
    }

    function installXhrInterceptor() {
        const NativeXMLHttpRequest = unsafeWindow.XMLHttpRequest
        unsafeWindow.XMLHttpRequest = new Proxy(NativeXMLHttpRequest, {
            construct(target, args, newTarget) {
                const xhr = Reflect.construct(target, args, newTarget)
                xhr.addEventListener("load", async () => {
                    try {
                        if (xhr.readyState !== 4 || xhr.status !== 200) return
                        const url = xhr.responseURL
                        if (!url) return
                        if (hlsProcessor.isHlsUrl(url) && (xhr.responseType === "" || xhr.responseType === "text")) {
                            await hlsProcessor.handleHlsResponse(url, xhr.responseText)
                        }
                        await handleArticleResponse(url, xhr)
                    } catch (error) {
                        console.error("XHR response processing failed", error)
                    }
                })
                return xhr
            }
        })
    }

    installXhrInterceptor()

    GM.addStyle(`
        #fc_dl {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            text-align: left;
        }
        #fc_btn,
        .fc_img_dl {
            border: none;
            border-radius: 6px;
            background-color: #388e3c;
            color: #fff;
            font-family: inherit;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.2;
            cursor: pointer;
            transition: background-color 150ms ease, box-shadow 150ms ease;
        }
        #fc_btn {
            width: 100px;
            min-height: 34px;
            padding: 8px 12px;
        }
        #fc_btn:hover,
        .fc_img_dl:hover {
            background-color: #2e7d32;
        }
        #fc_btn:active,
        .fc_img_dl:active {
            background-color: #1b5e20;
        }
        #fc_btn:focus-visible,
        .fc_img_dl:focus-visible {
            outline: 2px solid #1b5e20;
            outline-offset: 2px;
        }
        .fc_art_dl {
            position: relative;
            z-index: 1000;
            margin: 20px 0;
            pointer-events: auto;
        }
        .fc_img_dl {
            margin: 4px 8px 4px 0;
            padding: 7px 12px;
            pointer-events: auto;
        }
        .fc_img_dl:disabled {
            background-color: #9e9e9e;
            cursor: wait;
        }
    `
    )

    // Capture image-download clicks before the gallery's delegated handlers.
    unsafeWindow.addEventListener("click", async event => {
        const button = event.target?.closest?.(".fc_img_dl")
        if (!button?.dataset.url || !button.dataset.filename) return

        event.preventDefault()
        event.stopImmediatePropagation()
        if (button.disabled) return

        button.disabled = true
        setTimeout(() => {
            button.disabled = false
        }, 2000)

        try {
            const response = await fetch(button.dataset.url, { credentials: "include" })
            const blob = await response.blob()
            if (!response.ok || (blob.type && !blob.type.startsWith("image/"))) {
                throw new Error(`image request failed: ${response.status} ${blob.type || "unknown content type"}`)
            }

            const objectUrl = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = objectUrl
            link.download = button.dataset.filename
            document.body.append(link)
            link.click()
            link.remove()
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
        } catch (error) {
            console.error("image download failed", button.dataset.url, error)
        }
    }, true)

    function addVideoButtons(urls) {
        if (!urls.length) return
        const buttonData = urls.map(url => ({
            name: url.includes(".m3u8") ? "PLAYLIST" : "KEY",
            url
        }))

        document.querySelectorAll(".MuiTypography-h6").forEach(heading => {
            const text = heading.textContent
            if (text !== "") {
                heading.querySelector("#fc_dl")?.remove()
                const container = document.createElement('div')
                container.id = 'fc_dl'
                buttonData.forEach(({ name, url }) => {
                    const button = document.createElement('button')
                    button.id = 'fc_btn'
                    button.type = 'button'
                    button.textContent = name
                    button.addEventListener('click', async () => {
                        try {
                            const extension = name === 'KEY' ? 'key' : 'm3u8'
                            const filename = new URL(url).pathname.split('/').pop() || `${name.toLowerCase()}.${extension}`
                            await GM.download({
                                url,
                                name: `${text}_${filename}`,
                                saveAs: true
                            })
                        } catch (error) {
                            console.error('media download failed', url, error)
                        }
                    })
                    container.append(button)
                })
                heading.append(container)
            }
        })
    }

    function addArticleImageButtons() {
        let imageUrlsLogged = false
        const timer = setInterval(() => {
            if (articleData === null) {
                return
            }
            const html = articleData?.data?.article?.article?.contents
            if (!html) {
                clearInterval(timer)
                console.error("article contents unavailable", articleData)
                return
            }
            const srcs = Array.from(html.matchAll(/<img[^>]+src="([^"]+)"/g), ([, src]) => src)
            if (!imageUrlsLogged) {
                console.log("article image urls", srcs)
                imageUrlsLogged = true
            }
            if (srcs.length === 0) {
                clearInterval(timer)
                return
            }
            const lastSource = srcs[srcs.length - 1]
            const last = Array.from(document.querySelectorAll("img")).find(image => {
                if (image.src === lastSource || image.currentSrc === lastSource) return true
                try {
                    return new URL(image.currentSrc || image.src, location.href).pathname ===
                        new URL(lastSource, location.href).pathname
                } catch {
                    return false
                }
            })
            if (!last) {
                return
            }
            const group = document.createElement('div')
            group.className = 'fc_art_dl'
            srcs.forEach((src, i) => {
                const name = src.split("?")[0].split("/").pop() || `image-${i + 1}.jpg`
                const btn = document.createElement('button')
                btn.className = 'fc_img_dl'
                btn.type = 'button'
                btn.textContent = 'download ' + (i + 1)
                btn.dataset.url = src
                btn.dataset.filename = name
                group.append(btn)
            })
            const paragraph = last.closest("p")
            const imageLink = last.closest("a")
            if (imageLink && imageLink.parentElement) {
                imageLink.insertAdjacentElement("afterend", group)
            } else if (paragraph && paragraph.parentElement) {
                paragraph.parentElement.append(group)
            } else {
                last.insertAdjacentElement("afterend", group)
            }
            clearInterval(timer)
        }, 500)
    }

    setTimeout(() => {
        hlsProcessor.renderButtons()
        addArticleImageButtons()
    }, 10000)
})()
