const zutils = require('utils/zutils.js');

App({
  GLOBAL_DATA: {
    USER_INFO: null
  },
  onLaunch: function (e) {
    var that = this;
    wx.getStorage({
      key: 'USER_INFO',
      success: function (res) {
        that.GLOBAL_DATA.USER_INFO = res.data;
        console.log('checkUserInfo 1 - ' + JSON.stringify(res))
      }
    });
    this.checkUserInfo(null, true);
  },
  checkUserInfo: function (cb, needLogin) {
    var that = this;
    wx.checkSession({
      fail: function () {
        if (needLogin == true) that.getUserInfo()
      },
      success: function () {
        if (that.GLOBAL_DATA.USER_INFO) {
          typeof cb == 'function' && cb(this.GLOBAL_DATA.USER_INFO);
        } else {
          wx.getStorage({
            key: 'USER_INFO',
            success: function (res) {
              that.GLOBAL_DATA.USER_INFO = res.data;
              typeof cb == 'function' && cb(this.GLOBAL_DATA.USER_INFO);
              console.log('checkUserInfo 2 - ' + JSON.stringify(res))
            },
            fail: function () {
              if (needLogin == true) that.getUserInfo()
            }
          });
        }
      }
    });
  },
  getUserInfo000: function (cb) {
    if (this.GLOBAL_DATA.USER_INFO) {
      typeof cb == 'function' && cb(this.GLOBAL_DATA.USER_INFO)
    } else {
      var that = this;
      wx.login({
        success: function (res) {
          wx.getUserInfo({
            success: function (res2) {
              zutils.post(that, 'api/user/wxx-login', { code: res.code, iv: res2.iv, data: res2.encryptedData }, function (res3) {
                that.GLOBAL_DATA.USER_INFO = res3.data.data;
                wx.setStorage({ key: 'USER_INFO', data: that.GLOBAL_DATA.USER_INFO })
                typeof cb == 'function' && cb(that.GLOBAL_DATA.USER_INFO)
                wx.hideLoading()
              })
            }
          })
        }
      })
    }
  },

  // 需要授权才能访问的页面/资源先调用此方法
  // 在回调函数中执行实际的业务操作
  getUserInfo: function (cb, _retry) {
    if (this.GLOBAL_DATA.USER_INFO) {
      typeof cb == 'function' && cb(this.GLOBAL_DATA.USER_INFO)
    } else {
      let that = this;
      _retry = _retry || 1;
      if (that.__inLogin == true && _retry <= 10) {
        console.log('已在登陆中 WAIT-' + _retry + ' ...')
        setTimeout(function () {
          that.getUserInfo(cb, _retry + 1);
        }, 200 + (_retry * 20));
        return;
      }

      that.__inLogin = true;
      wx.login({
        success: function (res) {
          that.__storeUserInfo(res, cb);
        }
      })
    }
  },
  
  // 存储授权
  __storeUserInfo: function (res, cb) {
    console.log('存储授权 - ' + JSON.stringify(res))
    let that = this;
    let _data = {
      code: res.code,
      iv: res.iv || '',
      data: res.encryptedData || ''
    };
    _data.enterSource = that.enterSource;
    zutils.post(that, 'api/user/wxx-login', _data, function (res) {
      that.GLOBAL_DATA.USER_INFO = res.data.data;
      wx.setStorage({
        key: 'USER_INFO',
        data: that.GLOBAL_DATA.USER_INFO,
        success: function () {
          that.__inLogin = false;
        }
      })
      typeof cb == 'function' && cb(that.GLOBAL_DATA.USER_INFO);
    });
  },
})