//index.js
const app = getApp()
import observe from '../../utils/oba.js';
Page({
  data: {
    isLoading: true,//加载状态
    orderId: null,//当前订单id
    order:{},//当前订单
    goodsList: [],//商品列表
    payDesc: null,//描述 
    isPass: false,//是否传递数据
  },
  onLoad: function (options) {
    this.setData({
      orderId: options.id
    }, () => {
      this.fecthData();
    });
    //监听登录状态
    observe(app.globalData, ["loginState"], (name, value, old) => {
      if (!value) {
        wx.switchTab({
          url: '/pages/mine/index',
        })
      }
    });
  },
  fecthData: function (params) {
    let that = this;
    if (!params || !params.isRefresh)
      wx.showLoading({
        title: '加载中...',
      })
    app.POST({
      url: `${app.globalData.httpUrl}&c=user&a=order_detail_json`,
      datas: {
        order_id: that.data.orderId,
        token: app.globalData.saveInfo.token
      }
    }, (res) => {
      //console.log(res.data.order);
      if (params && params.isRefresh)
        wx.stopPullDownRefresh() //停止下拉刷新
      if (res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        that.setData({
          payDesc: res.data.pay_desc ? res.data.pay_desc:null,
          goodsList: res.data.goods_list,
          order: res.data.order,
          isLoading: false
        });
        wx.hideLoading();
      }else {
        wx.showLoading({
          title: '数据加载失败...',
        })
      }
    });
  },
  //取消订单
  cancleOrder: function() {
    let that = this;
    wx.showModal({
      title: '提示',
      content: '确认取消该订单吗？',
      success: (ret) => {
        if(ret.confirm) {
          wx.showLoading({
            title: '取消中...',
            mask: true
          })
          app.POST({
            url: `${app.globalData.httpUrl}&c=user&a=cancel_order_json`,
            datas: {
              token: app.globalData.saveInfo.token,
              order_id: that.data.orderId
            }
          }, (res) => {
            //console.log(res);
            wx.hideLoading();
            if (res.statusCode == 200) {
              if(res.data.status == 1) {
                that.setData({
                  isPass: true
                }, () => {
                  that.fecthData();
                });
                return;
              }
              wx.showToast({
                title: res.data.msg,
                icon: 'none'
              })
            } else {
              wx.showToast({
                title: '操作失败！',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },
  //确认收货
  confirmGoodsReceipt: function() {
    let that = this;
    wx.showModal({
      title: '提示',
      content: '确定已收到您的货物吗？',
      success: (ret) => {
        if (ret.confirm) {
          wx.showLoading({
            title: '操作中...',
            mask: true
          })
          app.POST({
            url: `${app.globalData.httpUrl}&c=user&a=affirm_received_json`,
            datas: {
              token: app.globalData.saveInfo.token,
              order_id: that.data.orderId
            }
          }, (res) => {
            //console.log(res);
            wx.hideLoading();
            if (res.statusCode == 200) {
              if (res.data.status == 1) {
                that.setData({
                  isPass: true
                }, () => {
                  that.fecthData();
                });
                return;
              }
              wx.showToast({
                title: res.data.msg,
                icon: 'none'
              })
            } else {
              wx.showToast({
                title: '操作失败！',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },
  //微信支付
  bindPay: function() {
    let that = this;
    app.POST({
      url: `${app.globalData.httpUrl}&c=user&a=wx_pay_json`,
      datas: {
        token: app.globalData.saveInfo.token,
        order_id: that.data.orderId
      }
    }, (res) => {
      //console.log(res);
      if (res.statusCode == 200) {
        if (res.data.status == '001') {
          app.reLogin();
          return;
        }
        if (res.data.status == 1) {
          that.pay(res.data.result);
          return;
        }
        wx.showToast({
          title: '获取支付信息失败!',
          icon: 'none'
        })
      }else {
        wx.showToast({
          title: '获取支付信息失败!',
          icon: 'none'
        })
      }
    })
  },
  //微信支付
  pay: function (params) {
    let that = this;
    wx.requestPayment({
      'timeStamp': params.timestamp.toString(),
      'nonceStr': params.noncestr,
      'package': params.package,
      'signType': 'MD5',
      'paySign': params.sign,
      success: function (res) {
        that.setData({
          isPass: true
        }, () => {
          that.fecthData();
        });
        wx.showModal({
          title: '提示',
          showCancel: false,
          content: '付款成功！',
          success: (res) => {
          }
        })
      },
      fail: function (res) {
        wx.showModal({
          title: '提示',
          content: '付款失败，重新支付！',
          success: (res) => {
            if (res.confirm) {
              that.pay(params);
            }
          }
        })
      }
    });
  },
  //下拉刷新
  onPullDownRefresh: function () {
    let that = this;
    if (app.globalData.loginState) {
      that.fecthData({ isRefresh: true });
    } else {
      wx.switchTab({
        url: '/pages/mine/index',
      })
    }
  },
  //进入商品详情
  tapGoods: function (e) {
    wx.navigateTo({
      url: `/pages/detail/index?id=${e.currentTarget.dataset.id}`
    })
  },
  //返回
  onUnload: function() {
    let that = this;
    if(that.data.isPass) {
      let pages = getCurrentPages();
      let prevPage = pages[pages.length - 2];//上一个页面
      prevPage.setData({
        newDatas: { orderId: that.data.orderId, orderStatus: that.data.order.order_status + ',' + that.data.order.pay_status + ',' + that.data.order.shipping_status }
      })
    }
  }
})
