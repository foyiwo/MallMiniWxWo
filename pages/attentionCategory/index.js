//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    isIPhoneX: app.globalData.isIPhoneX,//手机型号
    isFetchCategory: false,//分类数据请求状态
    categoryDatas: [],//分类一级数据
    myCategoryDatas: [],//我的关注
    isHandle: false,//是否操作中
  },
  onLoad: function() {
    let that = this;
    that.fetchCategory();
  },
  //获取我的关注
  fetchMyCategory: function() {
    let that = this;
    app.POST({
      url: `${app.globalData.httpUrl}&c=index&a=get_attention_json`,
      datas: {
        token: app.globalData.saveInfo.token
      }
    }, res => {
      wx.stopPullDownRefresh();
      if (res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        let categoryDatas = that.data.categoryDatas;
        for (let i in categoryDatas) {
          for (let j in categoryDatas[i].cat_id) {
            for (let k in categoryDatas[i].cat_id[j].cat_id) {
              for (let l in res.data.data) {
                if (categoryDatas[i].cat_id[j].cat_id[k].id == res.data.data[l].cat_id) {
                  categoryDatas[i].cat_id[j].cat_id[k].isSelected = true;
                }
              }
            }
          }
        }
        that.setData({
          myCategoryDatas: res.data.data,
          categoryDatas: categoryDatas
        });
      }else {
        wx.showLoading({
          title: '数据加载失败...',
        })
      }
    });
  },
  //获取分类数据
  fetchCategory: function() {
    let that = this;
    app.GET({
      url: `${app.globalData.httpUrl}&c=category&a=top_all_json`
    }, res => {
      if (res.statusCode == 200) {
        that.setData({
          categoryDatas: res.data.category,
          isFetchCategory: true
        }, () => {
          if (app.globalData.loginState) {
            that.fetchMyCategory();
          }
        });
      } else {
        wx.showToast({
          title: '数据加载失败...',
          icon: 'none'
        });
      }
    });
  },
  //点击关注
  bindAttention: function(e) {
    let that = this;
    let indexOne = e.currentTarget.dataset.indexone;
    let indexTwo = e.currentTarget.dataset.indextwo;
    let indexThree = e.currentTarget.dataset.indexthree;
    let categoryDatas = that.data.categoryDatas;
    categoryDatas[indexOne].cat_id[indexTwo].cat_id[indexThree].isSelected = !categoryDatas[indexOne].cat_id[indexTwo].cat_id[indexThree].isSelected;
    that.setData({
      categoryDatas: categoryDatas
    });
  },
  //确定选择
  tapTure: function () {
    let that = this;
    let chooseCategoryDatas = [];//所有选择的分类
    let categoryDatas = that.data.categoryDatas;
    for (let i = 0; i < categoryDatas.length;i++) {
      for (let j = 0; j < categoryDatas[i].cat_id.length; j++) {
        for (let k = 0; k < categoryDatas[i].cat_id[j].cat_id.length; k++) {
          if (categoryDatas[i].cat_id[j].cat_id[k].isSelected)
            chooseCategoryDatas.push(categoryDatas[i].cat_id[j].cat_id[k]);
        }
      }
    }
    if (chooseCategoryDatas.length > 0) {
      let catId = [];
      for (let i = 0; i < chooseCategoryDatas.length;i++) {
        catId.push(chooseCategoryDatas[i].id);
      }
      let params = {
        operation: 3,
        catId: catId.join(",")
      }
      that.fetchHandleCategory(params, (res) => {
        that.setData({ isHandle: false });
        if (res.statusCode == 200) {
          if (res.data.status == 1) {
            wx.navigateBack({
              delta: 1
            })
            return;
          }
        } else {
          wx.showToast({
            title: '关注失败!',
            icon: 'none'
          })
        }
      });
    } else {
      wx.showToast({
        title: '请先选择!',
        icon: 'none'
      })
    }
  },
  //操作关注
  fetchHandleCategory: function (params, fn) {
    let that = this;
    // 判断是否登录
    if (!app.globalData.loginState) {
      wx.navigateTo({
        url: '/pages/login/index',
      })
      return;
    }
    that.setData({ isHandle: true }, () => {
      app.POST({
        url: `${app.globalData.httpUrl}&c=index&a=update_attention_json`,
        datas: {
          token: app.globalData.saveInfo.token,
          operation: params.operation,
          cat_id: params.catId
        }
      }, fn);
    });
  },
  //下拉刷新
  onPullDownRefresh: function () {
    let that = this;
    if (app.globalData.loginState) {
      that.fetchCategory({ isRefresh: true });
    } else {
      wx.showToast({
        title: '登录失败！',
        icon: 'none'
      })
    }
  }
})
