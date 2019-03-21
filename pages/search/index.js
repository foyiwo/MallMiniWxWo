//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    hotDatas: [],//热门搜索数据
    searchContent: '',//搜索内容
  },
  onLoad: function () {
    let that = this;
    app.GET({
      url: `${app.globalData.httpUrl}&c=category&a=top_all_json`
    }, res => {
      //console.log(res);
      if (res.statusCode == 200) {
        this.setData({
          hotDatas: res.data.hot_search_keywords?res.data.hot_search_keywords:[]
        });
      } else {
        wx.showToast({
          title: '数据获取失败!',
          icon: 'none'
        })
      }
    });
  },
  //绑定搜索内容
  bindSearchContent: function(e) {
    this.setData({ searchContent:e.detail.value});
  },
  //开始搜索
  tapSearch: function() {
    let that = this;
    let content = that.data.searchContent.replace(/(^\s*)|(\s*$)/g, "");
    if(content==null||content=="") {
      wx.showToast({
        title: '请输入内容!',
        icon: 'none'
      })
      return;
    }
    wx.navigateTo({
      url: `/pages/goodsList/index?searchContent=${that.data.searchContent}`,
    })
  },
  //点击热门搜索
  tapHotSearch: function(e) {
    wx.navigateTo({
      url: `/pages/goodsList/index?searchContent=${e.currentTarget.dataset.content}`,
    })
  }
})
