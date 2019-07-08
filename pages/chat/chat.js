const app = app || getApp();
const zutils = require('../../utils/zutils.js');

Page({
  data: {
    content: '',
    textFocus: false,
    contentHeight: 0,
    initMsgHide: true,
    scrollTop: 100,
    moreboxClass: 'hide',
    textHoverClass: ''
  },
  socket_ready: false,
  input_data: {},
  room_infos: null,
  room_id: null,
  fans_infos: {},
  msgs_list: [],
  countdown_timer: null,
  system_info: {},

  inputChange: function (e) {
    var id = e.target.dataset.id;
    this.input_data[id] = e.detail.value;
  },
  textFocus: function () {
    this.setData({ textHoverClass: 'text-hover', moreboxClass: 'hide' })
    this.__resizeWindow()
  },
  textBlur: function () {
    this.setData({ textHoverClass: '' })
    this.__resizeWindow()
  },
  showMorebox: function () {
    if (this.data.moreboxClass == '') {
      this.setData({ moreboxClass: 'hide' })
    } else {
      this.setData({ moreboxClass: '', textFocus: false })
    }
    this.__resizeWindow()
  },

  onLoad: function (e) {
    this.room_id = e.roomid;
    this.initRoom();
    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.system_info = res;
        that.__resizeWindow();

      }
    });
  },
  onHide: function () {
    console.log('onHide');
  },
  onUnload: function () {
    console.log('onUnload');
    if (this.countdown_timer) clearInterval(this.countdown_timer);
    wx.closeSocket({
      code: 1000,
      reason: '聊天界面已卸载'
    })
  },
  __resizeWindow: function () {
    var ch = this.system_info.windowHeight - 51;
    if (this.data.moreboxClass == '') ch -= 121;
    //else if (this.data.textHoverClass == 'text-hover') ch -= 121;
    console.log('resizeWindow - ' + ch)
    this.setData({ contentHeight: ch, scrollTop: this.__scrollTop++ })
  },

  initRoom: function () {
    var that = this;
    zutils.get(app, 'api/chatroom/room-infos?room=' + that.room_id, function (res) {
      var data = res.data.data;
      that.room_infos = data;
      console.log(that.room_infos);
      that.fans_infos[data.foo_id] = [data.foo_headimg, data.foo_nick];
      that.fans_infos[data.bar_id] = [data.bar_headimg, data.bar_nick];

      var time = ~~that.room_infos.left_time;

      if (time > 1) {
        zutils.get(app, 'api/chatroom/room-init-msgs?room=' + that.room_id, function (res2) {
          that.msgs_list = res2.data.data;
          if (that.msgs_list.length == 0) {
            that.setData({
              initMsgHide: false
            });
          }
          that.__renderMsgs();
          that.initSocket();
        });
      }

      if (that.__renderTime(time) == true) {
        if (that.countdown_timer) clearInterval(that.countdown_timer);
        that.countdown_timer = setInterval(function () {
          time--;
          that.__renderTime(time);
        }, 1000);
      }
    });
  },

  initSocket: function () {
    var that = this;
    that.__connectSocket();
    wx.onSocketOpen(function (res) {
      that.socket_ready = true;
      console.log('WSS onSocketOpen - ' + JSON.stringify(res))
    });
    wx.onSocketError(function (res) {
      that.socket_ready = false;
      console.log('WSS onSocketError - ' + JSON.stringify(res))
      that.__connectSocket();
    });
    wx.onSocketClose(function (res) {
      that.socket_ready = false;
      console.log('WSS onSocketClose - ' + JSON.stringify(res))
      if (res.code != 1000) {
        that.__connectSocket();
      }
    })
    wx.onSocketMessage(function (res) {
      console.log('WSS onSocketMessage - ' + JSON.stringify(res))
      var data = JSON.parse(res.data);
      if (data.action == 0) {
        that.__renderMsg(data);
      } else if (data.action == 11) {
        wx.redirectTo({
          url: 'chat-complete?state=12'
        })
      }
    });
  },
  __connectSocket: function () {
    var ws_url = zutils.base_url.replace('https:', 'wss:') + 'ws/api/chat/echo';
    ws_url += '?fans=' + this.room_infos.fans_id + '&room=' + this.room_id;
    wx.connectSocket({
      url: ws_url,
      header: {
        'content-type': 'application/json'
      },
      complete: function (res) {
        console.log('WSS connectSocket - ' + JSON.stringify(res))
      }
    });
  },

  sendMsg: function () {
    if (!!!this.input_data['content']) return;
    if (this.socket_ready == false) return;

    console.log(this.input_data['content'])
    this.setData({
      content: '',
      textFocus: true
    });

    var data = { 'own': this.room_infos.fans_id, content: this.input_data['content'] };
    var that = this;
    wx.sendSocketMessage({
      data: JSON.stringify(data),
      complete: function (res) {
        console.log('WSS sendSocketMessage - ' + JSON.stringify(res));
        that.__renderMsg(data);
      }
    });
  },

  __scrollTop: 100000,
  __renderMsgs: function () {
    if (!this.msgs_list) return;
    var msgs = [];
    for (var i = 0; i < this.msgs_list.length; i++) {
      var line = this.msgs_list[i];
      var own = line[0];
      var msg = { content: line[1], 'class': own == this.room_infos.fans_id ? 'foo' : 'bar', headimg: this.fans_infos[own][0] };
      msgs.push(msg);
    }
    this.setData({
      msgs: msgs,
      scrollTop: msgs.length == 0 ? 0 : (this.__scrollTop++)
    });
  },
  __renderMsg: function (res) {
    this.msgs_list.push([res.own, res.content, 0]);
    this.__renderMsgs();
  },

  __renderTime: function (time) {
    if (time < 0) {
      clearInterval(this.countdown_timer);
      wx.redirectTo({
        url: 'chat-complete?state=10'
      })
      return false;
    }

    var time_m = ~~(time / 60);
    var time_s = time % 60;
    time_s = time_s < 10 ? ('0' + time_s) : time_s;
    time_m += ':' + time_s;
    wx.setNavigationBarTitle({
      title: '8分钟约会中 [0' + time_m + ']'
    });
    return true;
  },

  exitRoom: function () {
    var that = this;
    wx.showModal({
      title: '提示',
      content: '确认要结束本次约会吗？',
      success: function (res) {
        if (res.confirm) {
          zutils.post(app, 'api/chatroom/room-exit?room=' + that.room_id, function (res2) {
            wx.redirectTo({
              url: 'chat-complete?state=11'
            })
          });
        } else if (res.cancel) {
          //that.setData({ moreboxClass: 'hide' })
        }
      }
    })
  }
});