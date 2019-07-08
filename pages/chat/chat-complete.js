Page({
  data: {
    icon: 'waiting',
    tips: '意犹未尽吗？\n马上开始一轮新的约会吧。'
  },
  onShareAppMessage: function () {
    return { title: '八分钟约会源于犹太人的传统习俗，年轻的单身男女在互不了解的情况下进行八分钟的交谈', path: '/pages/index/index' };
  },

  onLoad: function(res){
    if (res.state == 11){
      this.setData({
        icon: 'info',
        tips: '话不投机半句多。\n继续找寻下一个约会对象吧。'
      })
    } else if (res.state == 12){
      this.setData({
        icon: 'info',
        tips: '对方结束了约会。\n懂你的人仍在这里等你。'
      })
    } else if (res.state == 99) {
      this.setData({
        icon: 'cancel',
        tips: '服务器开小差了\n等会再来试试吧'
      })
    }
  }
})