//index.js
//获取应用实例
const app = getApp()
import observe from '../../utils/oba.js';
Page({
  pageNo: 1,//页面大小
  totalPage: 1,//总页数
  data: {
    footState: 0,//0：隐藏、1：没有更多了、2：加载中
    isLoading: true,//加载状态
    orderList: [],//订单列表
    newDatas: null,//返回数据
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
    let that = this;
    if (that.data.newDatas) {
      let orderList = that.data.orderList;
      for (let i = 0; i < orderList.length;i++) {
        if (orderList[i].order_id == that.data.newDatas.orderId) {
          orderList[i].order_status = that.data.newDatas.orderStatus;
          that.setData({
            orderList: orderList,
            newDatas: null
          });
          break;
        }
      }
    }
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
      url: `${app.globalData.httpUrl}&c=user&a=order_list_json&page=${that.pageNo}`,
      datas: {
        token: app.globalData.saveInfo.token,
      }
    }, (res) => {
      if ((!params || !params.isRefresh) && params.isInit)
        wx.hideLoading();
      wx.stopPullDownRefresh();
      wx.hideNavigationBarLoading();
      if (res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        that.totalPage = res.data.pager.page_count;
        let getData = {
          footState: that.pageNo >= that.totalPage ? 1 : 0,
        };
        getData.orderList = that.pageNo == 1 ? res.data.orders_list : that.data.orderList.concat(res.data.orders_list);
        getData.isLoading = false;
        that.setData(getData);
      } else {
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    })
  },
  //订单详情
  tapOrder: function(e) {
    wx.navigateTo({
      url: `/pages/orderDetail/index?id=${e.currentTarget.dataset.id}`,
    })
  },
  //触发上拉加载
  onReachBottom: function () {
    let that = this;
    //如果是正在加载中或没有更多数据了，则返回
    if (that.data.footState != 0) {
      return;
    }
    //如果当前页大于或等于总页数，那就是到最后一页了，返回
    if ((that.pageNo != 1) && (that.pageNo >= that.totalPage)) {
      return;
    } else {
      that.pageNo++;
    }
    that.setData({ footState: 2 }, () => {
      that.fetchDatas({});
    })
  },
  //图片加载失败
  imgLoadError: function(e) {
    let that = this;
    that.data.orderList[e.currentTarget.dataset.index].img = "/images/svg/no-pic.svg";
    this.setData({
      orderList: that.data.orderList
    });
  },
  //下拉刷新
  onPullDownRefresh: function () {
    let that = this;
    wx.showNavigationBarLoading();
    if (app.globalData.loginState) {
      that.pageNo = 1,
      that.totalPage = 1,
      that.fetchDatas({ isRefresh: true });
    } else {
      wx.switchTab({
        url: '/pages/mine/index',
      })
    }
  }
})
