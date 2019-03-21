//index.js
//获取应用实例
const app = getApp()
import observe from '../../utils/oba.js';
Page({
  data: {
    templateType: 1,//模板类型
    listTemplate: 2,//列表模板
    httpUrl: `${app.globalData.httpUser + 'webapp/'}`,
    headerBgOpacity: 0,
    inputBgOpacity: 0,
    isLoadComplete: false,
    navData: [],//顶部导航数据
    salesGoodsData: [],//今日特价,
    bestGoodsData: {
      list: []
    },//精品推荐
    newGoodsData: {
      list: []
    },//新品上架
    hotGoodsData: {
      list: []
    },//热销产品
    categoryDatas: [],//分类数据
    swiperDatas: [],//首页轮播数据
    shopInfo: {},//商店信息
    currentNav: 0,//模板2的时候的导航
    isCeiling: false,//是否吸顶
  },
  onLoad: function () {
    let that = this;
    wx.showLoading({
      title: '加载中...',
    })
    if (app.globalData.isCodeLogin) that.fetchData();
    //监听是否code登录过
    observe(app.globalData, ["isCodeLogin"], (name, value, old) => {
      if (value) that.fetchData();
    });
    //监听登录状态
    observe(app.globalData, ["loginState"], (name, value, old) => {
      if (value) {
        app.fetchCart();//获取购物车数量
        that.fetchMyCategory();//获取我的关注
      } else {
        that.setData({ categoryDatas: [] });
      }
    });
    //监听购物车
    observe(app.globalData, ["cartNum"], (name, value, old) => {
      if (app.globalData.loginState) {
        wx.setTabBarBadge({
          index: 2,
          text: value < 1 ? '0' : value.toString(),
        })
      } else {
        wx.removeTabBarBadge({
          index: 2,
        })
      }
    });
  },
  onShow: function () {
    let that = this;
    if (app.globalData.loginState) {
      that.fetchGoodsNum();//获取商品数量
      that.fetchMyCategory();//获取我的关注
      wx.setTabBarBadge({
        index: 2,
        text: app.globalData.cartNum.toString(),
      })
    } else {
      wx.removeTabBarBadge({
        index: 2,
      })
    }
    that.setData({
      bestGoodsData: that.data.bestGoodsData,
      newGoodsData: that.data.newGoodsData,
      hotGoodsData: that.data.hotGoodsData
    });
  },
  //获取数据
  fetchData: function (params) {
    let that = this;
    if (!params)
      wx.showLoading({
        title: '加载中...',
        mask: true
      })
    app.POST({
      url: `${app.globalData.httpUrl}&c=index&a=index_json`,
      datas: {
        token: app.globalData.saveInfo.token
      }
    }, res => {
      if (res.statusCode == 200) {
        let bestGoodsData = { list: res.data.best_goods, goodsindex: 1 };
        let newGoodsData = { list: res.data.new_goods, goodsindex: 2 };
        let hotGoodsData = { list: res.data.hot_goods, goodsindex: 3 };
        app.globalData.servicePhone = res.data.shop_info.service_phone;
        that.setData({
          shopInfo: res.data.shop_info,
          navData: res.data.navigator,
          salesGoodsData: res.data.sales_goods,
          bestGoodsData: bestGoodsData,
          newGoodsData: newGoodsData,
          hotGoodsData: hotGoodsData,
          swiperDatas: res.data.ads,
          isLoadComplete: true
        });
        if (!params) wx.hideLoading();
      } else {
        wx.showLoading({
          title: '数据加载失败...',
        })
      }
    })
  },
  //获取我的关注
  fetchMyCategory: function (fn) {
    let that = this;
    app.POST({
      url: `${app.globalData.httpUrl}&c=index&a=get_attention_json`,
      datas: {
        token: app.globalData.saveInfo.token
      }
    }, res => {
      if (res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        that.setData({ categoryDatas: res.data.data });
      } else {
        wx.showLoading({
          title: '数据加载失败...',
        })
      }
    });
  },
  //获取商品数量
  fetchGoodsNum: function () {
    let that = this;
    app.POST({
      url: `${app.globalData.httpUrl}&c=index&a=each_cart_number`,
      datas: {
        token: app.globalData.saveInfo.token
      }
    }, (res) => {
      if (res.statusCode == 200) {
        let bestGoodsList = that.data.bestGoodsData.list;
        let newGoodsList = that.data.newGoodsData.list;
        let hotGoodsList = that.data.hotGoodsData.list;
        for (let i = 0; i < bestGoodsList.length; i++) {
          for (let j = 0; j < res.data.length; j++) {
            if (bestGoodsList[i].id == res.data[j].goods_id)
              bestGoodsList[i].goods_number = res.data[j].goods_number;
          }
        }
        for (let i = 0; i < newGoodsList.length; i++) {
          for (let j = 0; j < res.data.length; j++) {
            if (newGoodsList[i].id == res.data[j].goods_id)
              newGoodsList[i].goods_number = res.data[j].goods_number;
          }
        }
        for (let i = 0; i < hotGoodsList.length; i++) {
          for (let j = 0; j < res.data.length; j++) {
            if (hotGoodsList[i].id == res.data[j].goods_id)
              hotGoodsList[i].goods_number = res.data[j].goods_number;
          }
        }
        that.data.bestGoodsData.list = bestGoodsList;
        that.data.newGoodsData.list = newGoodsList;
        that.data.hotGoodsData.list = hotGoodsList;
        that.setData({
          bestGoodsData: that.data.bestGoodsData,
          newGoodsData: that.data.newGoodsData,
          hotGoodsData: that.data.hotGoodsData
        });
      }
    })
  },
  //下拉刷新
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading();
    let that = this;
    if (app.globalData.loginState)
      that.fetchMyCategory();//获取我的关注
    //加载
    app.POST({
      url: `${app.globalData.httpUrl}&c=index&a=index_json`,
      datas: {
        token: app.globalData.saveInfo.token
      }
    }, (res) => {
      if (res.statusCode == 200) {
        let bestGoodsData = { list: res.data.best_goods, goodsindex: 1 };
        let newGoodsData = { list: res.data.new_goods, goodsindex: 2 };
        let hotGoodsData = { list: res.data.hot_goods, goodsindex: 3 };
        app.globalData.servicePhone = res.data.shop_info.service_phone;
        that.setData({
          shopInfo: res.data.shop_info,
          navData: res.data.navigator,
          salesGoodsData: res.data.sales_goods,
          bestGoodsData: bestGoodsData,
          newGoodsData: newGoodsData,
          hotGoodsData: hotGoodsData,
          swiperDatas: res.data.ads,
          isLoadComplete: true
        });
      }
      //停止下拉刷新
      wx.stopPullDownRefresh();
      wx.hideNavigationBarLoading();
    });
  },
  //导航跳转
  tapNav: function (e) {
    let index = e.currentTarget.dataset.index;
    if (index == 0) {
      wx.switchTab({
        url: '/pages/category/index'
      });
    } else if (index == 1) {
      wx.navigateTo({
        url: '/pages/allOrder/index',
      });
    } else if (index == 2) {
      wx.makePhoneCall({
        phoneNumber: app.globalData.servicePhone.toString(),
      })
    } else if (index == 3) {
      wx.navigateTo({
        url: '/pages/attentionCategory/index',
      });
    }
  },
  //进入商品详情
  tapGoods: function (e) {
    wx.navigateTo({
      url: `/pages/detail/index?id=${e.currentTarget.dataset.id}`
    })
  },
  //进入搜索
  tapSearch: function () {
    wx.navigateTo({
      url: '/pages/search/index',
    })
  },
  // 进入商品列表
  tapAttention: function (e) {
    wx.navigateTo({
      url: `/pages/goodsList/index?id=${e.currentTarget.dataset.id}`,
    })
  },
  preventTransmission: function () {
  },
  //减数量
  reduceOrderNum: function (e) {
    let that = this;
    if (!app.globalData.loginState) {
      wx.showToast({
        title: '请先登录!',
        icon: 'none'
      })
      return;
    }
    let num = e.currentTarget.dataset.number;
    num = num < 1 ? 0 : num;
    that.joinCart({ num: parseInt(num) - 1, id: e.currentTarget.dataset.id, goodsindex: e.currentTarget.dataset.goodsindex, handle: 0 });
  },
  //加数量
  addOrderNum: function (e) {
    let that = this;
    if (!app.globalData.loginState) {
      wx.showToast({
        title: '请先登录!',
        icon: 'none'
      })
      return;
    }
    let num = e.currentTarget.dataset.number == '' || e.currentTarget.dataset.number == null ? 0 : e.currentTarget.dataset.number;
    if (num >= 99)
      return;
    that.joinCart({ num: parseInt(num) + 1, id: e.currentTarget.dataset.id, goodsindex: e.currentTarget.dataset.goodsindex, handle: 1 });
  },
  //加入购物车
  joinCart: function (params) {
    let that = this;
    let querys = {
      goods_id: params.id,
      packtype: 0,
      tp_user_id: 0,
      'number': params.num,
      token: app.globalData.saveInfo.token
    }
    //加入购物车
    app.POST({
      url: `${app.globalData.httpUrl}&c=flow&a=mini_count_add_cart`,
      datas: querys
    }, (res) => {
      if (res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        //成功
        if (res.data.status == 1) {
          let goodsindex = params.goodsindex;
          let list = goodsindex == 1 ? that.data.bestGoodsData.list :
            goodsindex == 2 ? that.data.newGoodsData.list :
              goodsindex == 3 ? that.data.hotGoodsData.list : null;
          for (let i = 0; i < list.length; i++) {
            if (list[i].id == params.id) {
              list[i].goods_number = res.data.goods_munber
              break;
            }
          }
          let getDatas = goodsindex == 1 ? that.data.bestGoodsData :
            goodsindex == 2 ? that.data.newGoodsData :
              goodsindex == 3 ? that.data.hotGoodsData : null;
          getDatas.list = list;
          goodsindex == 1 ? that.setData({ bestGoodsData: getDatas }) :
            goodsindex == 2 ? that.setData({ newGoodsData: getDatas }) :
              goodsindex == 3 ? that.setData({ hotGoodsData: getDatas }) : null;
          //改变购物车总数
          app.globalData.cartNum = res.data.cart_number == '' ? '0' : res.data.cart_number.toString();
        }
      } else {
        wx.showLoading({
          title: '数据加载失败...',
        })
      }
    });
  },
  //分享
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      //console.log(res.target)
    }
    return {
      title: '首页',
      path: '/pages/index/index',
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },
  //模板二导航
  catchTapNav: function (e) {
    let that = this;
    that.setData({ currentNav: e.currentTarget.dataset.index });
  },
  //监听页面滚动
  onPageScroll: function (options) {
    let that = this;
    let scrollTop = options.scrollTop;
    that.setData({
      headerBgOpacity: scrollTop <= 187.5 ? (1 / 187.5) * scrollTop : 1,
      inputBgOpacity: scrollTop <= 187.5 ? (0.6 / 187.5) * scrollTop : 1
    })
    if (that.data.templateType == 2)
      wx.createSelectorQuery().select('#threeNav').boundingClientRect(function (rect) {
        that.setData({ isCeiling: rect.top <= 45 })
      }).exec()
  }
})
