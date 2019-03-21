//index.js
//获取应用实例
const app = getApp()
Page({
  data: {
    presentDetail: {}
  },
  onLoad: function(options) {
    let that = this;
    that.setData({
      presentDetail: JSON.parse(options.params)
    })
  }
})
