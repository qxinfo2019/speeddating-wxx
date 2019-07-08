const baseUrl = 'http://127.0.0.1:8180/speeddating/';
// const baseUrl = 'https://speeddating.firewe.cn/';

function __url_wrap(app, url) {
  if (app && app.GLOBAL_DATA && app.GLOBAL_DATA.USER_INFO) {
    if (url.indexOf('?') == -1) url += '?';
    else url += '&';
    url += 'wxxuid=' + app.GLOBAL_DATA.USER_INFO.uid
  }
  return url;
}

// GET 方法
function z_get(app, url, call) {
  var req_timer;
  if (url.indexOf('noloading') == -1) {
    req_timer = setTimeout(function () {
      wx.showLoading({
        title: '请稍后'
      });
    }, 200);
  }
  wx.request({
    url: baseUrl + __url_wrap(app, url),
    method: 'GET',
    success: call || function (res) { },
    fail: function (res) {
      console.error('GET ' + url + ' Error: ' + JSON.stringify(res || []));
    }, complete: function () {
      if (req_timer) clearTimeout(req_timer)
      if (url.indexOf('noloading') == -1) wx.hideLoading();
    }
  })
}

// POST 方法
function z_post(app, url, data, call) {
  if (!call && data && typeof data == 'function') {
    call = data;
    data = null;
  }
  var req_timer;
  if (url.indexOf('noloading') == -1) {
    req_timer = setTimeout(function () {
      wx.showLoading({
        title: '请稍后'
      });
    }, 200);
  }
  wx.request({
    url: baseUrl + __url_wrap(app, url),
    method: 'POST',
    data: data,
    success: call || function (res) { },
    fail: function (res) {
      console.error('POST ' + url + ' Error: ' + JSON.stringify(res || []));
    }, complete: function () {
      if (req_timer) clearTimeout(req_timer)
      if (url.indexOf('noloading') == -1) wx.hideLoading();
    }
  })
}

module.exports = {
  get: z_get,
  post: z_post,
  base_url: baseUrl
}