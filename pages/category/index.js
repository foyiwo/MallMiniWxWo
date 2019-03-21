//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    windowHeight: wx.getSystemInfoSync().windowHeight,
    categoryData: [],
    categoryIndex: 0
  },
  onLoad: function() {
    let that = this;
    that.loadCaregory();
  },
  onShow: function() {
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
  //加载分类数据
  loadCaregory: function() {
    let that = this;
    if (app.globalData.categoryData.length > 0) {
      this.setData({
        categoryData: app.globalData.categoryData
      });
    } else {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
      app.GET({
        url: `${app.globalData.httpUrl}&c=category&a=top_all_json`
      }, res => {
        if (res.statusCode == 200) {
          that.setData({
            categoryData: res.data.category
          });
          app.globalData.categoryData = res.data.category;
          wx.hideLoading();
        } else {
          wx.showLoading({
            title: '数据加载失败...',
          })
        }
      });
    }
  },
  onPullDownRefresh: function() {
    //加载
    app.GET({
      url: `${app.globalData.httpUrl}&c=category&a=top_all_json`
    }, res => {
      if (res.statusCode == 200) {
        this.setData({
          categoryData: res.data.category
        });
        app.globalData.categoryData = res.data.category;
      }
      wx.stopPullDownRefresh() //停止下拉刷新
    });
  },
  //切换分类
  tapCategory: function(e){
    this.setData({ categoryIndex: e.currentTarget.dataset.index});
  },
  //进入商品列表
  tapGoodsList: function(e) {
    wx.navigateTo({
      url: `/pages/goodsList/index?id=${e.currentTarget.dataset.id}`,
    })
  }
})
