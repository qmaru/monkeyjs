// ==UserScript==
// @name         maaya Blog Image
// @namespace    qmaru
// @match        https://maaya-fc.jp/special_contents/*
// @grant        GM.addStyle
// @grant        GM.download
// @version      2.0.0
// @description  maaya Blog Image Downloader
// ==/UserScript==

// Use the same Promise-based GM4 style as the redesigned media monitor.
(async () => {
  'use strict'

  GM.addStyle(`
    .fc_img_btn {
      display: block;
      width: max-content;
      margin: 20px 8px 4px 0;
      padding: 7px 12px;
      border: none;
      border-radius: 6px;
      background-color: #388e3c;
      color: #fff;
      font-family: inherit;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.2;
      position: relative;
      z-index: 9999;
      pointer-events: auto;
      cursor: pointer;
      transition: background-color 150ms ease, box-shadow 150ms ease;
    }
    .fc_img_btn:hover {
      background-color: #2e7d32;
    }
    .fc_img_btn:active {
      background-color: #1b5e20;
    }
    .fc_img_btn:focus-visible {
      outline: 2px solid #1b5e20;
      outline-offset: 2px;
    }
  `)

  const validImgRegex = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i

  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true })
    })
  }

  document.querySelectorAll('img').forEach(image => {
    const src = image.getAttribute('src')
    if (
      !src ||
      src.startsWith('data:') ||
      !validImgRegex.test(src) ||
      src.includes('/common/')
    ) {
      return
    }

    const fullUrl = src.startsWith('//')
      ? `${window.location.protocol}${src}`
      : src
    const container = image.closest('span.js-protect') || image
    if (container.nextElementSibling?.classList.contains('fc_img_btn')) {
      return
    }

    const filename = fullUrl.split('/').pop().split('?')[0]
    const button = document.createElement('span')
    button.textContent = 'download'
    button.className = 'fc_img_btn'
    button.addEventListener('click', async () => {
      try {
        await GM.download({
          url: fullUrl,
          name: filename
        })
      } catch (error) {
        console.error('download failed', error)
      }
    })

    container.insertAdjacentElement('afterend', button)
  })
})()
