//index.js
//获取应用实例
const app = getApp()
import observe from '../../utils/oba.js';
Page({
  data: {
    isLoading: true,//加载状态
    homeInformation: [],//下家信息
  },
  onLoad: function () {
    let that = this;
    that.fetchDatas({ isInit:true});
    //监听登录状态
    observe(app.globalData, ["loginState"], (name, value, old) => {
      if (!value) {
        wx.switchTab({
          url: '/pages/mine/index',
        })
      }
    });
  },
  onShow: function() {
    this.setData({
      info: app.globalData.saveInfo.info
    });
  },
  //获取数据
  fetchDatas: function(params) {
    let that = this;
    if ((!params || !params.isRefresh) && params.isInit)
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    app.POST({
      url: `${app.globalData.httpUrl}&c=user&a=lower_id_json`,
      datas: {
        token: app.globalData.saveInfo.token,
      }
    }, (res) => {
      //console.log(res);
      wx.hideLoading();
      if (params && params.isRefresh) {
        wx.stopPullDownRefresh();
        wx.hideNavigationBarLoading();
      }
      if (res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        if (res.data.status == 1) {
          that.setData({
            homeInformation: res.data.data,
            isLoading: false
          });
          return;
        }
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      } else {
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    })
  },
  //下拉刷新
  onPullDownRefresh: function () {
    let that = this;
    if (app.globalData.loginState) {
      wx.showNavigationBarLoading();
      that.fetchDatas({ isRefresh: true });
    } else {
      wx.switchTab({
        url: '/pages/mine/index',
      })
    }
  }
})
