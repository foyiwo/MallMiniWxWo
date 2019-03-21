//index.js
//获取应用实例
var app = getApp()
import observe from '../../utils/oba.js';
Page({
  data: {
    isIPhoneX: app.globalData.isIPhoneX,
    isLoading: true,//是否加载
    addressList: [],//地址列表
    isBack: false,//是否立即返回
  },
  onLoad: function (options) {
    let that = this;
    options.isBack ? this.setData({ isBack: options.isBack }):null;
    //监听登录状态
    observe(app.globalData, ["loginState"], (name, value, old) => {
      if (!value) {
        wx.switchTab({
          url: '/pages/mine/index',
        })
      }
    });
  },
  onShow: function () {
    this.fetchDatas({ isLoading: this.data.isLoading, isRefresh: true});
  },
  fetchDatas: function(params) {
    let that = this;
    if ((params && params.isLoading) || (!params || !params.isRefresh))
      wx.showLoading({
        title: '加载中...',
      })
    app.POST({
      url: `${app.globalData.httpUrl}&c=user&a=address_list_json`,
      datas: {
        token: app.globalData.saveInfo.token,
      }
    }, (res) => {
      if (params && params.isRefresh)
        wx.stopPullDownRefresh() //停止下拉刷新
      if (res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        let getData = { addressList: res.data};
        getData.isLoading = false;
        that.setData(getData);
        wx.hideLoading();
      } else {
        wx.showLoading({
          title: '数据加载失败...',
        })
      }
    })
  },
  //添加收货地址
  addAddess: function() {
    wx.navigateTo({
      url: '/pages/address/index?type=add',
    })
  },
  //进入地址详情
  selectTap: function(e) {
    let that = this;
    wx.navigateTo({
      url: `/pages/address/index?type=edit&id=${e.currentTarget.dataset.id}`,
    })
  },
  //设置默认
  radioChange: function(e) {
    let that = this;
    wx.showLoading({
      title: '设置中...',
      mask: true
    })
    app.POST({
      url: `${app.globalData.httpUrl}&c=user&a=default_address_json`,
      datas: {
        token: app.globalData.saveInfo.token,
        address_id: e.detail.value
      }
    }, (res) => {
      if(res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        if(res.data.status == 1) {
          wx.hideLoading();
          if (that.data.isBack)
            wx.navigateBack({
              delta: 1
            })
          return;
        }
        wx.showToast({
          title: '设置失败!',
          icon: 'none'
        })
      }
    });
  },
  //下拉刷新
  onPullDownRefresh: function () {
    let that = this;
    if (app.globalData.loginState) {
      that.fetchDatas({isRefresh: true});
    }else {
      wx.switchTab({
        url: '/pages/mine/index',
      })
    }
  }
})
