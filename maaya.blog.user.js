// ==UserScript==
// @name         maaya Blog Image
// @namespace    qmaru
// @match        https://maaya-fc.jp/special_contents/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// @grant        GM_addStyle
// @grant        GM_download
// @version      1.0.0
// @description  maaya Blog Image Downloader
// ==/UserScript==

(function () {
  'use strict';

  GM_addStyle(`
    .fc_img_btn {
      display: inline-block;
      margin: 0 10px;
      padding: 4px 8px;
      background-color: #4CAF50;
      color: white;
      font-size: 12px;
      text-decoration: none;
      border-radius: 3px;
      vertical-align: middle;
      position: relative;
      z-index: 9999;
      pointer-events: auto;
      cursor: pointer;
    }
    .fc_img_btn:active {
      background-color: #367d39;
    }
  `);

  const validImgRegex = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;

  $(function () {
    $('img').each(function () {
      const src = $(this).attr('src');
      if (
        src &&
        !src.startsWith('data:') &&
        validImgRegex.test(src) &&
        !src.includes('/common/')
      ) {
        const fullUrl = src.startsWith('//')
          ? window.location.protocol + src
          : src;

        const $container = $(this).closest('span.js-protect').length
          ? $(this).closest('span.js-protect')
          : $(this);

        if (!$container.next('.fc_img_btn').length) {
          const filename = fullUrl.split('/').pop().split('?')[0];

          const $btn = $('<span>', {
            text: 'download',
            class: 'fc_img_btn'
          }).on('click', function () {
            GM_download({
              url: fullUrl,
              name: filename,
              onerror: err => console.error('download failed', err)
            });
          });

          $container.after($btn);
        }
      }
    });
  });
})();
