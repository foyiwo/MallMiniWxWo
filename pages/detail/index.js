//index.js
//获取应用实例
const app = getApp();
//引入WxParse模块
var WxParse = require('../../wxParse/wxParse.js');
import observe from '../../utils/oba.js';
Page({
  data: {
    openStatus: {
      isOpen: false
    },//是否展开按钮
    isLoading: true,//是否加载中
    isIPhoneX: app.globalData.isIPhoneX,
    loginState: app.globalData.loginState,//登录状态
    cartNum: app.globalData.cartNum,//购物车数量
    detailHeight: 0,
    swiperShoppingData: [],//轮播图数据
    currentSwiper: 0,//当前所在滑块
    goods: {},//商品
    goodList: [],//商店信息
    aliasData: [],//版本数据
    currentAlias: [],//当前版本
    properties: [],//商品属性
    orderNum: 0,//订单数量（需要用户登录之后才有值）
    id: null,//当前商品id
    strRangeNum: [],//商品数量范围
  },
  onLoad: function (options) {
    let that = this;
    let strRangeNum = [];
    for (let i = 1; i < 100; i++)
      strRangeNum.push(i);
    that.setData({
      id: options.id,
      loginState: app.globalData.loginState,
      cartNum: app.globalData.cartNum,
      strRangeNum: strRangeNum
    }, () => {
      that.fetchData({
        url: `${app.globalData.httpUrl}&c=goods&a=goods_info`,
        datas: { id: options.id }
      });
    });
    //监听登录状态
    observe(app.globalData, ["loginState"], (name, value, old) => {
      that.fetchData({
        url: `${app.globalData.httpUrl}&c=goods&a=goods_info`,
        datas: { id: options.id || that.data.id },
        isRefresh: true
      });
    });
  },
  onShow: function() {
    this.setData({ 
      loginState: app.globalData.loginState,
      cartNum: app.globalData.cartNum
    });
  },
  //加载数据
  fetchData: function(params) {
    let that = this;
    if (!params || !params.isRefresh)
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    params.datas.token = app.globalData.saveInfo.token;
    app.POST(params, res => {
      //console.log(res);
      if (params && params.isRefresh)
        wx.stopPullDownRefresh() //停止下拉刷新
      if (res.statusCode == 200) {
        /* 获取版本 */
        let aliasData = [];
        for (let key in res.data.alias) {
          aliasData.push(res.data.alias[key]);
        }
        /* end */
        /* 获取属性 */
        let properties = [];
        for (let k in res.data.properties) {
          for (let j in res.data.properties[k]) {
            properties.push(res.data.properties[k][j]);
          }
        }
        /* end */
        that.setData({
          isLoading: false,
          id: res.data.goods.goods_id,
          currentSwiper: 0,
          goods: res.data.goods,
          goodList: res.data.good_list,
          swiperShoppingData: res.data.pictures,
          aliasData: aliasData,
          currentAlias: res.data.default_alias,
          properties: properties,
          orderNum: res.data.good_list[0].goods_number != '' ? res.data.good_list[0].goods_number:0
        }, () => {
          //渲染商品描述
          that.renderDesc(that.data.goods.goods_desc);
          that.getDetailHeight();
          wx.hideLoading();
        });
      } else {
        wx.showLoading({
          title: '数据加载失败...',
        })
      }
    });
  },
  //渲染商品描述  
  renderDesc: function(html) {
    let that = this;
    let imgReg = /<img [^>]*src=['"]([^'"]+)[^>]*>/gi;
    let imagesUrl = [];
    let newImagesUrl = [];
    //寻找不合格路径 
    html.replace(imgReg, (match, srcCapture) => {
      imagesUrl.push(srcCapture);
      newImagesUrl.push(srcCapture.substring(0, 6) == 'https:' ? srcCapture : app.globalData.imageHost + srcCapture);
    });
    //替换路径
    for (let i = 0;i < imagesUrl.length;i++) {
      html = html.replace(imagesUrl[i], newImagesUrl[i]);
    }
    let desc = html;
    WxParse.wxParse('desc', 'html', desc, that);
  },
  //获取商品详情高度
  getDetailHeight: function() {
    //创建节点选择器
    var query = wx.createSelectorQuery();
    query.select('#detailCount').boundingClientRect()
    query.exec(res => {
      this.setData({
        detailHeight: res[0].height
      });
    })
  },
  //监听页面滚动
  onPageScroll: function(opations) {
    if (this.data.openStatus.isOpen) {
      let openStatus = this.data.openStatus;
      openStatus.isOpen = false;
      this.setData({ openStatus: openStatus });
    }
    wx.setNavigationBarTitle({
      title: opations.scrollTop > this.data.detailHeight?'商品描述':'商品详情',
    })
  },
  //图片预览
  previewImage: function(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    let pictures = [];
    for (let i = 0; i < that.data.swiperShoppingData.length;i++) {
      pictures.push(that.data.swiperShoppingData[i].img_url);
    }
    wx.previewImage({
      current: pictures[index],
      urls: pictures,
      success: (res => {
        //console.info("success---" + res);
      }),
      fail: (res => {
        //console.info("fail---" + res);
      })
    })
  },
  //版本选择
  tapType: function(e) {
    let that = this;
    this.fetchData({
      url: `${app.globalData.httpUrl}&c=goods&a=goods_info`,
      datas: { id: e.currentTarget.dataset.url.split("id=")[1] }
    });
  },
  //分享
  onShareAppMessage: function(ops) {
    let that = this;
    if (ops.from === 'button') {
      // 来自页面内转发按钮
      //console.log(ops.target)
    }
    return {
      title: that.data.goods.goods_name,
      path: `/pages/detail/index?id=${that.data.id}`,
      imageUrl: that.data.goods.goods_img,
      success: function (res) {
        // 转发成功
        //console.log("转发成功:" + JSON.stringify(res));
      },
      fail: function (res) {
        // 转发失败
        //console.log("转发取消" + JSON.stringify(res));
      }
    }

  },
  //改变订单数
  changeOrderNum: function (e) {
    let that = this;
    let currentNum = that.data.strRangeNum[e.detail.value];
    let oldNum = e.currentTarget.dataset.oldvalue;
    if (parseInt(currentNum) != parseInt(oldNum))
      that.joinCart({ orderNum: currentNum });
  },
  //减数量
  tapReduceNum: function() {
    let that = this;
    if (app.globalData.loginState) {
      that.joinCart({ orderNum: --this.data.orderNum});
    }else {
      wx.showModal({
        title: '提示',
        content: '请先进行登录！',
        success: (res) => {
          if(res.confirm) 
            wx.navigateTo({
              url: '/pages/login/index'
            })
        }
      });
    }
  },
  //加数量
  tapAddNum: function() {
    let that = this;
    if (app.globalData.loginState) {
      let orderNum = this.data.orderNum;
      orderNum = this.data.orderNum == 99 ? 99 : ++this.data.orderNum;
      that.joinCart({ orderNum: orderNum});
    } else {
      wx.showModal({
        title: '提示',
        content: '请先进行登录！',
        success: (res) => {
          if (res.confirm)
            wx.navigateTo({
              url: '/pages/login/index'
            })
        }
      });
    }
  },
  //加入购物车
  joinCart: function(querys) {
    let that = this;
    let regNum = /^[1-9]*[1-9][0-9]*$/;
    if (regNum.test(that.data.orderNum) || that.data.orderNum==0) {
      let params = {
        goods_id: that.data.goods.goods_id,
        packtype: 0,
        tp_user_id: 0,
        'number': querys.orderNum,
        token: app.globalData.saveInfo.token
      }
      //加入购物车
      app.POST({
        url: `${app.globalData.httpUrl}&c=flow&a=mini_count_add_cart`,
        datas: params
      }, (res) => {
        if (res.statusCode == 200) {
          if (res.data.status === '001') {
            app.reLogin();
            return;
          }
          if (res.data.status == 1) {
            that.setData({
              orderNum: res.data.goods_munber,
              cartNum: res.data.cart_number == '' ? '0' : res.data.cart_number.toString()
            }, () => {
              app.globalData.cartNum = res.data.cart_number == '' ? '0' : res.data.cart_number.toString();
            });
            if (querys.sType === 1) {
              wx.switchTab({
                url: '/pages/cart/index'
              })
            }
          }
        }else {
          wx.showLoading({
            title: '数据加载失败...',
          })
        }
      });
    } else {
      that.setData({ orderNum: 0 });
    }
  },
  //立即结算
  tapSettlement: function() {
    if (this.data.orderNum == 0) {
      this.joinCart({
        orderNum: 1,
        sType: 1
      })
    } else {
      wx.switchTab({
        url: '/pages/cart/index'
      })
    }
  },
  //下拉刷新
  onPullDownRefresh: function () {
    let that = this;
    that.setData({
      loginState: app.globalData.loginState,
      cartNum: app.globalData.cartNum
    }, () => {
      that.fetchData({
        url: `${app.globalData.httpUrl}&c=goods&a=goods_info`,
        datas: { id: that.data.id },
        isRefresh: true
      });
    });
  },
  tapOpen: function() {
    let openStatus = this.data.openStatus;
    openStatus.isOpen = !openStatus.isOpen;
    this.setData({ openStatus: openStatus });
  },
  bindNavigation: function(e) {
    let index = e.currentTarget.dataset.index;
    wx.switchTab({
      url: index==1?"/pages/index/index":
        index == 2 ? "/pages/category/index":
        index == 3 ? "/pages/cart/index":
        index == 4 ? "/pages/mine/index":null
    });
  }
})
