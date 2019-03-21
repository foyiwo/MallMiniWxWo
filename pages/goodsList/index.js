//index.js
//获取应用实例
const app = getApp()

Page({
  pageNo: 1,//页面大小
  totalPage: 1,//总页数
  data: {
    openStatus: {
      isOpen: false,
      isBottom: true
    },//是否展开按钮
    isLoading: true,
    navIndex: -1,//遮罩层数据
    isShowMask: false,//是否显示遮罩
    animationCategory: {},
    windowHeight: wx.getSystemInfoSync().windowHeight,
    animationBrand: {},
    animationOrder: {},//动画数据
    categoryData: [],//分类数据
    categoryIndex: 0,
    quotedTime: '',//报价时间
    catName: '',//消费名称
    goodsDatas: {
      list: []
    },//商品数据
    id: null,//当前查询id
    bid: null,//当前查询品牌id
    brandDatas: [],//品牌数据
    footState: 0,//0：隐藏、1：没有更多了、2：加载中
    orderIndex: null,//排序下标 0:销量、1:人气、2:价格、3:利润
    orderDesc: null,//排序描述、desc降 asc升
    keywords: null,//搜索关键字
  },
  onLoad: function (options) {
    let that = this;
    if (options.id) {
      //通过id搜索
      that.setData({ id: options.id }, () => {
        that.fetchData({ isInit: true });
      });
    } else if (options.searchContent) {
      //通过关键字搜索
      that.setData({ keywords: options.searchContent }, () => {
        that.fetchData({ isInit: true });
      })
    }
    that.loadCategory();
  },
  onShow: function() {
    let that = this;
    if (app.globalData.loginState) {
      that.fetchGoodsNum();//获取商品数量
    }
  },
  //获取数据
  fetchData: function (params) {
    let that = this;
    if ((!params || !params.isRefresh) && params.isInit)
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    let requestDatas = {}; 
    that.data.id ? requestDatas.id = that.data.id:null;
    that.data.keywords ? requestDatas.keywords = that.data.keywords:null;
    that.data.bid ? requestDatas.bid = that.data.bid:null;
    that.data.orderIndex == 0 ? requestDatas.sort = "sales_volum" : 
      that.data.orderIndex == 1 ? requestDatas.sort = "click_count" :
        that.data.orderIndex == 2 ? requestDatas.sort = "shop_price" :
          that.data.orderIndex == 3 ? requestDatas.sort = "diff_price" : null;
    that.data.orderDesc == "desc" ? requestDatas.order = "desc" : 
      that.data.orderDesc == "asc" ? requestDatas.order = "asc" : null;
    requestDatas.token = app.globalData.saveInfo.token;
    app.POST({
      url: `${app.globalData.httpUrl}&c=category&a=goods_list_json&page=${that.pageNo}`,
      datas: requestDatas
    }, (res) => {
      if (params && params.isRefresh) {
        wx.hideNavigationBarLoading();
        wx.stopPullDownRefresh();
      }
      if (res.statusCode == 200) {
        /* 商品数据 */
        let list = [];
        for (let key in res.data.goods_list) {
          if (typeof res.data.goods_list[key] != 'function')
            list.push(res.data.goods_list[key]);
        }
        let goodsDatas = { list: res.data.goods_list };
        /* end */
        /* 品牌数据 */
        let brandDatas = [];
        for(let key in res.data.brands) {
          if (typeof res.data.brands[key] != 'function')
            brandDatas.push(res.data.brands[key]);
        }
        /* end */
        that.totalPage = res.data.pager.page_count;
        let getData = {
          footState: that.pageNo >= that.totalPage ? 1 : 0,
          goodsDatas: {}
        };
        if(that.pageNo == 1) {
          getData.quotedTime = res.data.quoted_time;
          getData.catName = res.data.cat_name;
          getData.goodsDatas.list = list;
          getData.brandDatas = brandDatas;
        }else {
          getData.goodsDatas.list = that.data.goodsDatas.list.concat(list);
        }
        getData.isLoading = false;
        that.setData(getData);
        if (params.isInit) wx.hideLoading();
      } else {
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    })
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
        let goodsDatasList = that.data.goodsDatas.list;
        for (let i = 0; i < goodsDatasList.length; i++) {
          for (let j = 0; j < res.data.length; j++) {
            if (goodsDatasList[i].goods_id == res.data[j].goods_id)
              goodsDatasList[i].goods_number = res.data[j].goods_number;
          }
        }
        that.data.goodsDatas.list = goodsDatasList;
        that.setData({
          goodsDatas: that.data.goodsDatas
        });
      }
    })
  },
  tapNav: function (e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    let animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out',
    });
    this.animation = animation;
    if (that.data.navIndex > -1) {//已经打开遮罩
      //相同遮罩
      if(index == that.data.navIndex) {
        that.closeMask(index, animation, {navIndex: -1});
      }else {
        let animationClose = wx.createAnimation({duration: 0});
        that.closeMask(that.data.navIndex, animationClose, {});
        that.openMask(index, animation, {navIndex: index});
      }
    } else {//未打开
      let params = { navIndex: index };
      that.openMask(index, animation, params);
    }
  },
  //加载分类数据
  loadCategory: function() {
    let that = this;
    if (app.globalData.categoryData.length > 0) {
      this.setData({
        categoryData: app.globalData.categoryData
      });
    }else {
      app.GET({
        url: `${app.globalData.httpUrl}&c=category&a=top_all_json`
      }, res => {
        if (res.statusCode == 200) {
          this.setData({
            categoryData: res.data.category
          });
          app.globalData.categoryData = res.data.category;
        }
      });
    }
  },
  //触发遮罩
  tapMask: function() {
    let that = this;
    let animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out',
    });
    this.closeMask(that.data.navIndex, animation, {navIndex: -1});
  },
  //打开遮罩
  openMask: function (index, animation, params) {
    let that = this;
    let navIndex = that.data.navIndex;
    index == 0 ? animation.translateY(0).opacity(1).step() : index == 1 ?
      animation.translateY(0).opacity(1).step() : index == 2 ?
        animation.translateY(0).opacity(1).step() : null;
    index == 0 ? params.animationCategory = animation.export() : index == 1 ?
      params.animationBrand = animation.export() : index == 2 ?
        params.animationOrder = animation.export() : null;
    that.setData(params);
  },
  //关闭遮罩
  closeMask: function(index, animation, params) {
    let that = this;
    index == 0 ? animation.translateY('-100%').opacity(0).step() : index == 1 ?
      animation.translateY('-160px').opacity(0).step() : index == 2 ?
        animation.translateY('-160px').opacity(0).step() : null;
    index == 0 ? params.animationCategory = animation.export() : index == 1 ?
      params.animationBrand = animation.export() : index == 2 ?
        params.animationOrder = animation.export() : null;
    that.setData(params);
  },
  //切换分类
  tapCategory: function (e) {
    this.setData({ categoryIndex: e.currentTarget.dataset.index });
  },
  //进入商品详情
  tapGoods: function (e) {
    wx.navigateTo({
      url: `/pages/detail/index?id=${e.currentTarget.dataset.id}`
    })
  },
  //触发上拉加载
  onReachBottom: function () {
    let that = this;
    //如果是正在加载中或没有更多数据了，则返回
    if(that.data.footState != 0) {
      return;
    }
    //如果当前页大于或等于总页数，那就是到最后一页了，返回
    if ((that.pageNo != 1) && (that.pageNo >= that.totalPage)) {
      return;
    }else {
      that.pageNo++;
    }
    that.setData({footState:2}, () => {
      that.fetchData({});
    })
  },
  //品牌切换
  tapBrand: function(e) {
    let that = this;
    let animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out',
    });
    this.closeMask(that.data.navIndex, animation, { navIndex: -1 });
    that.pageNo = 1;
    that.totalPage = 1;
    that.setData({
      orderIndex: null,
      orderDesc: null,
      bid: parseInt(e.currentTarget.dataset.bid)
    }, () => {
      that.fetchData({
        isInit: true,
      });
    });
  },
  //分类列表
  tapGoodsList: function(e) {
    let that = this;
    let animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out',
    });
    this.closeMask(that.data.navIndex, animation, { navIndex: -1 });
    that.pageNo = 1;
    that.totalPage = 1;
    that.setData({
      orderIndex: null,
      orderDesc: null,
      bid: null,
      keywords: null,
      id: parseInt(e.currentTarget.dataset.id),
    }, () => {
      that.fetchData({isInit: true});
    });
  },
  //排序选择
  tapOrder: function(e) {
    let that = this;
    let animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out',
    });
    this.closeMask(that.data.navIndex, animation, { navIndex: -1 });
    let index = e.currentTarget.dataset.index;
    that.pageNo = 1;
    that.totalPage = 1;
    let params = {
      orderIndex: index,
    };
    if (that.data.orderIndex == null || (that.data.orderIndex != null && that.data.orderIndex != index)) {
      params.orderDesc = "asc";
    } else if (that.data.orderIndex != null && that.data.orderIndex == index) {
      params.orderDesc = that.data.orderDesc == "asc" ? "desc" :"asc";
    }
    that.setData(params, () => {
      that.fetchData({ isInit: true });
    });
  },
  //绑定搜索内容
  bindSearchContent: function(e) {
    this.setData({ keywords: e.detail.value });
  },
  //开始搜索
  tapSearch: function() {
    let that = this;
    let content = that.data.keywords.replace(/(^\s*)|(\s*$)/g, "");
    if (content == null || content == "") {
      wx.showToast({
        title: '请输入内容!',
        icon: 'none'
      })
      return;
    }
    let animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out',
    });
    that.closeMask(that.data.navIndex, animation, { navIndex: -1 });
    that.pageNo = 1;
    that.totalPage = 1;
    that.setData({
      orderIndex: null,
      orderDesc: null,
      bid: null,
      id: null
    }, () => {
      that.fetchData({
        isInit: true,
      });
    });
  },
  //下拉刷新
  onPullDownRefresh: function() {
    wx.showNavigationBarLoading();
    this.pageNo=1;
    this.totalPage=1;
    this.fetchData({ isRefresh: true });
  },
  /****************************************/ 
  //监听页面滚动
  onPageScroll: function () {
    if (this.data.openStatus.isOpen) {
      let openStatus = this.data.openStatus;
      openStatus.isOpen = false;
      this.setData({ openStatus: openStatus });
    }
  },
  tapOpen: function () {
    let openStatus = this.data.openStatus;
    openStatus.isOpen = !openStatus.isOpen;
    this.setData({ openStatus: openStatus });
  },
  bindNavigation: function (e) {
    let index = e.currentTarget.dataset.index;
    wx.switchTab({
      url: index == 1 ? "/pages/index/index" :
        index == 2 ? "/pages/category/index" :
          index == 3 ? "/pages/cart/index" :
            index == 4 ? "/pages/mine/index" : null
    });
  },
  preventTransmission: function () {
  },
  /*********数量操作**********/
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
    that.joinCart({ num: parseInt(num) - 1, id: e.currentTarget.dataset.id, handle: 0 });
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
    let num = e.currentTarget.dataset.number == '' ? 0 : e.currentTarget.dataset.number;
    if (num >= 99)
      return;
    that.joinCart({ num: parseInt(num) + 1, id: e.currentTarget.dataset.id, handle: 1 });
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
    }, res => {
      if (res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        //成功
        if (res.data.status == 1) {
          let goodsDatas = that.data.goodsDatas;
          for (let i = 0; i < goodsDatas.list.length;i++) {
            if (goodsDatas.list[i].goods_id == params.id) {
              if (params.handle == 1) {
                goodsDatas.list[i].goods_number = goodsDatas.list[i].goods_number == '' ? 1 : ++goodsDatas.list[i].goods_number;
              } else {
                goodsDatas.list[i].goods_number = --goodsDatas.list[i].goods_number;
              }
              break;
            }
          }
          that.setData({
            goodsDatas: goodsDatas
          });
          //获取购物车总数
          app.fetchCart((res) => {
            app.globalData.cartNum = res.data.cart_number == '' ? '0' : res.data.cart_number.toString();
          })
        }
      } else {
        wx.showLoading({
          title: '数据加载失败...',
        })
      }
    });
  },
})
