//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    isIPhoneX: app.globalData.isIPhoneX,//是否iphonex
    order: {}
  },
  onLoad: function (options) {
    let that = this;
    let order = JSON.parse(options.params);
    this.setData({ order:order}, () => {
      order.pay_result ? that.pay() : null;//进行微信支付
    });
  },
  //微信支付
  pay: function() {
    let that = this;
    let data = that.data.order.pay_result;
    wx.requestPayment({
      'timeStamp': that.data.order.pay_result.timestamp.toString(),
      'nonceStr': that.data.order.pay_result.noncestr,
      'package': `prepay_id=${that.data.order.pay_result.prepay_id}`,
      'signType': 'MD5',
      'paySign': that.data.order.pay_result.sign,
      success: function (res) {
        wx.showModal({
          title: '提示',
          showCancel: false,
          content: '付款成功！',
          success: (res) => {
            if(res.confirm) {
            }
          }
        })
      },
      fail: function (res) {
        wx.showModal({
          title: '提示',
          content: '付款失败，重新支付！',
          success: (res) => {
            if (res.confirm) {
              that.pay();
            }
          }
        })
        //console.info(res);
      }
    });
  },
  //返回
  bindBack: function(e) {
    let index = e.currentTarget.dataset.index;
    wx.switchTab({
      url: index==1?'/pages/index/index':index==4?'/pages/mine/index':null,
    })
  }
})
