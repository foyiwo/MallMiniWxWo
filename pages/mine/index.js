//index.js
//获取应用实例
const app = getApp()
import observe from '../../utils/oba.js';
Page({
  data: {
    loginState: app.globalData.loginState,//登录状态
    userInfo: app.globalData.saveInfo,
    windowHeight: wx.getSystemInfoSync().windowHeight,
    isContactUs: false,//是否联系我们
    animationContactUs: {},
    mineManager: [],//我的导航管理
  },
  onLoad: function () {
    let that = this;
    that.jurisdictionChange();
    //监听购物车
    observe(app.globalData, ["cartNum"], (name, value, old) => {
      if (app.globalData.loginState) {
        wx.setTabBarBadge({
          index: 2,
          text: app.globalData.cartNum < 1 ? '0' : app.globalData.cartNum.toString(),
        })
      } else {
        wx.removeTabBarBadge({
          index: 2,
        })
      }
    });
    //监听登录
    observe(app.globalData, ["loginState"], (name, value, old) => {
      that.setData({ 
        userInfo: app.globalData.saveInfo,
        loginState: app.globalData.loginState
      });
      that.jurisdictionChange();
    });
  },
  onShow: function () {
    let that = this;
    that.setData({ 
      loginState: app.globalData.loginState,
      userInfo: app.globalData.saveInfo
    });
    if (app.globalData.loginState) {
      wx.setTabBarBadge({
        index: 2,
        text: app.globalData.cartNum.toString(),
      })
    } else {
      wx.removeTabBarBadge({
        index: 2,
      })
    }
  },
  //权限改变
  jurisdictionChange: function() {
    let that = this;
    let mineManager = [
      {
        name: '全部订单',
        svg: 'order.svg',
        url: '/pages/allOrder/index',
      },
      {
        name: '收货地址',
        svg: 'address.svg',
        url: '/pages/addressManager/index',
      },
      {
        name: '修改密码',
        svg: 'change-pwd.svg',
        url: '/pages/modifyPassword/index',
      },
      {
        name: '联系我们',
        svg: 'contact-us.svg'
      }
    ]
    if (app.globalData.saveInfo.info&&app.globalData.saveInfo.info.rank_id == 2) {
      let plusManager = {
        name: '积分管理',
        svg: 'integral.svg',
        url: '/pages/integralManager/index'
      }
      mineManager.splice(1, 0, plusManager);
      plusManager = {
        name: '提现记录',
        svg: 'presentRecord.svg',
        url: '/pages/presentRecord/index'
      }
      mineManager.splice(2, 0, plusManager);
      plusManager = {
        name: '下家信息',
        svg: 'next-message.svg',
        url: '/pages/homeInformation/index'
      }
      mineManager.splice(3, 0, plusManager);
      plusManager = {
        name: '推荐给朋友',
        svg: 'recommend.svg',
        url: '/pages/recommend/index'
      }
      mineManager.splice(1, 0, plusManager);
    }
    if (app.globalData.saveInfo.info&&app.globalData.saveInfo.info.rank_id == 1) {
      let plusManager = {
        name: '推荐给朋友',
        svg: 'recommend.svg',
        url: '/pages/recommend/index'
      }
      mineManager.splice(1, 0, plusManager);
    }
    that.setData({
      mineManager: mineManager
    })
  },
  //进入登录
  tapLogin: function () {
    wx.navigateTo({
         url: '/pages/login/index',
    })
  },
  //列表点击
  tapMine: function (e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    if (index == that.data.mineManager.length -1) {
      that.contactUs();
      return;
    }
    if (index < that.data.mineManager.length - 1&&that.data.loginState) {
      wx.navigateTo({
        url: that.data.mineManager[index].url,
      })
    }else {
      wx.navigateTo({
        url: '/pages/login/index',
      })
    }
  },
  //退出
  tapExit: function() {
    let that = this;
    wx.showModal({
      title: '提示',
      content: '确定退出吗?',
      success: function(res) {
        if (res.confirm) {
          wx.startPullDownRefresh();
          app.globalData.cartNum = 0;
          wx.removeTabBarBadge({
            index: 2,
          })
          app.globalData.saveInfo = {
            avatarUrl: that.data.userInfo.avatarUrl
          };
          app.globalData.token = that.data.userInfo.token;
          app.globalData.loginState = false;
          that.setData({ loginState: app.globalData.loginState }, () => {
            that.jurisdictionChange();
            wx.stopPullDownRefresh();
          });
        }
      }
    })
  },
  //联系我们
  contactUs: function() {
    wx.makePhoneCall({
      phoneNumber: app.globalData.servicePhone.toString(),
    })
  },
  //下拉刷新
  onPullDownRefresh: function() {
    this.setData({ userInfo: app.globalData.saveInfo }, () => {
      wx.stopPullDownRefresh();
    });
  }
})
