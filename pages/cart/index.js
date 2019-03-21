//index.js
//获取应用实例
const app = getApp()
//引入WxParse模块
import observe from '../../utils/oba.js';
Page({
  data: {
    loginState: app.globalData.loginState,//登录状态
    imageUrl: app.globalData.httpUser,//图片路径
    isInitLoading: true,//是否初次加载
    isLoading: true,//是否加载
    isEmpty: false,//购物车是否为空
    isShowMask: false,//是否显示遮罩
    strRangeNum: [],//商品数量范围
    consignee: {},//默认地址
    consigneeList: [],//地址列表
    shippingDatas: [],//配送方式
    paymentList: [],//支付方式
    goodsList: [],//订单商品列表
    isEdit: false,//是否编辑
    inv_type: [],//税务列表
    currentInvType: "",//当前选择税务
    tax: 0,//税务
    invoice: '',//发票抬头
    total: null,//商品总价
    chooseShipping: null,//物流选择
    choosePayment: null,//付款方式选择
    postscript: '',//留言
    isHandle: false,//是否开始操作
    result: [],//渲染结果
  },
  onLoad: function () {
    let that = this;
    let strRangeNum = [];
    for(let i=1;i<100;i++)
      strRangeNum.push(i);
    this.setData({ strRangeNum: strRangeNum});
    //监听登录状态
    observe(app.globalData, ["loginState"], (name, value, old) => {
      if (!value) {
        that.setData({ loginState: app.globalData.loginState, isLoading:false});
        wx.removeTabBarBadge({
          index: 2,
        })
      }
    });
  },
  onShow: function() {
    let that = this;
    that.setData({ loginState: app.globalData.loginState, isEdit: false, isHandle: false}, () => {
      if (that.data.loginState) {
        that.setData({ isHandle: true}, () => {
          that.fetchDatas({ isRefresh: !that.data.isInitLoading });
        })
        wx.setTabBarBadge({
          index: 2,
          text: app.globalData.cartNum.toString(),
        })
      }else {
        wx.removeTabBarBadge({
          index: 2,
        })
      }
    });
  },
  //获取确认订单数据
  fetchDatas: function(params) {
    let that = this;
    if (!params || !params.isRefresh)
      wx.showLoading({
        title: '加载中...',
        mask: true
      })
    app.POST({
      url: `${app.globalData.httpUrl}&c=flow&a=checkout_json`,
      datas: {
        token: app.globalData.saveInfo.token
      }
    }, (res) => {
      if (params&&params.isRefresh)
        wx.stopPullDownRefresh() //停止下拉刷新
      if (res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        if (res.data.status == '003') {
          that.setData({
            isEmpty: true,
            isLoading: false
          });
          app.globalData.cartNum = 0;
          wx.hideLoading();
          return;
        }
        //获取购物车总数
        app.fetchCart();
        //初次获取应付金额
        that.fetchPayable({
          shipping: res.data.order.shipping_id || that.data.chooseShipping && that.data.chooseShipping.shipping_id || 0,
          payment: res.data.order.pay_id || that.data.chooseShipping && that.data.choosePayment.pay_id || 0,
          isHandle: true
        }, (ret) => {
          if (ret.statusCode == 200) {
            if (ret.data.status === '001') {
              app.reLogin();
              return;
            }
            if (ret.data.status == 1) {
              let shippingStrArr = [];
              for (let i = 0; i < res.data.shipping_list.length; i++) {
                shippingStrArr.push(res.data.shipping_list[i].shipping_name);
              }
              let order = res.data.order;
              let params = {
                isInitLoading: false,
                isHandle: false,
                isEmpty: false,
                isLoading: false,
                consignee: res.data.consignee,
                consigneeList: res.data.consignee_list,
                goodsList: res.data.goods_list,
                shippingDatas: res.data.shipping_list,
                paymentList: res.data.payment_list,
                inv_type: res.data.inv_type,
                result: ret.data.result
              }
              //物流方式
              if (res.data.order.shipping_id != "") {
                for (let i = 0; i < res.data.shipping_list.length; i++) {
                  if (res.data.order.shipping_id == res.data.shipping_list[i].shipping_id) {
                    params.chooseShipping = res.data.shipping_list[i];
                    break;
                  }
                }
              }
              //付款方式
              if (res.data.order.pay_id != "") {
                for (let i = 0; i < res.data.payment_list.length; i++) {
                  if (res.data.order.pay_id == res.data.payment_list[i].pay_id) {
                    params.choosePayment = res.data.payment_list[i];
                    break;
                  }
                }
              }
              that.setData(params);
              wx.hideLoading();
              return;
            }
            wx.showToast({
              title: '操作失败！',
              icon: 'none'
            })
            wx.hideLoading();
          } else {
            wx.showLoading({
              title: '数据加载失败...',
            })
          }
        })
      } else {
        wx.showLoading({
          title: '数据加载失败...',
        })
      }
    })
  },
  //应付金额
  fetchPayable: function(params, fn) {
    let that = this;
    params.token = app.globalData.saveInfo.token;
    params.tax_type = that.data.currentInvType;
    params.tax = that.data.tax;
    app.POST({
      url: `${app.globalData.httpUrl}&c=flow&a=mini_ChangesAll`,
      datas: { change: JSON.stringify(params)}
    }, fn?fn:(res) => {
      if (res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        that.setData({
          isHandle: false
        });
        if (res.data.status == 1) {
          that.setData({
            result: res.data.result
          })
          return;
        }
        wx.showToast({
          title: '操作失败!',
          icon: 'none'
        })
      } else {
        that.setData({
          isHandle: false
        });
        wx.showToast({
          title: '选择失败!',
        })
      }
    })
  },
  bindTip: function() {
    wx.showToast({
      title: '请先选择收货地址!',
      icon: 'none'
    })
  },
  //物流选择
  bindShipping: function(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    if (!that.data.consignee) {
      wx.showToast({
        title: '请先选择收货地址!',
        icon: 'none'
      })
      return;
    }
    if (!that.data.chooseShipping && that.data.choosePayment) {
      that.setData({
        chooseShipping: that.data.shippingDatas[index]
      }, () => {
        let oldChooseShipping = that.data.chooseShipping;
        wx.showTabBar({ animation: true });
        that.setData({
          isShowMask: false,
          chooseShipping: that.data.shippingDatas[index],
          isHandle: true
        }, () => {
          that.fetchPayable({
            shipping: that.data.shippingDatas[index].shipping_id,
            payment: that.data.choosePayment.pay_id
          }, (res) => {
            //console.log(res);
            if (res.statusCode == 200) {
              if (res.data.status === '001') {
                app.reLogin();
                return;
              }
              that.setData({
                isHandle: false
              });
              if (res.data.status == 1) {
                that.setData({
                  result: res.data.result
                })
                return;
              }
              wx.showToast({
                title: '操作失败!',
                icon: 'none'
              })
            } else {
              that.setData({
                chooseShipping: oldChooseShipping,
                isHandle: false
              });
              wx.showToast({
                title: '选择失败!',
              })
            }
          })
        });
      });
    }
    if (!that.data.choosePayment) {
      that.setData({
        chooseShipping: that.data.shippingDatas[index],
        isShowMask: false
      });
      wx.showTabBar({ animation: true });
      return;
    }
    let oldChooseShipping = that.data.chooseShipping;
    wx.showTabBar({ animation: true });
    that.setData({
      isShowMask: false,
      chooseShipping: that.data.shippingDatas[index],
      isHandle: true
    }, () => {
      that.fetchPayable({
        shipping: that.data.shippingDatas[index].shipping_id,
        payment: that.data.choosePayment.pay_id
      }, (res) => {
        if (res.statusCode == 200) {
          if (res.data.status === '001') {
            app.reLogin();
            return;
          }
          that.setData({
            isHandle: false
          });
          if (res.data.status == 1) {
            that.setData({
              result: res.data.result
            })
            return;
          }
          wx.showToast({
            title: '操作失败!',
            icon: 'none'
          })
        } else {
          that.setData({
            chooseShipping: oldChooseShipping,
            isHandle: false
          });
          wx.showToast({
            title: '选择失败!',
          })
        }
      })
    });
  },
  //付款方式
  bindPayment: function(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    if (!that.data.consignee) {
      wx.showToast({
        title: '请先选择收货地址!',
        icon: 'none'
      })
      return;
    }
    if (!that.data.choosePayment && that.data.chooseShipping) {
      that.setData({
        isHandle: true,
        choosePayment: that.data.paymentList[index]
      }, () => {
        that.fetchPayable({
          shipping: that.data.chooseShipping.shipping_id,
          payment: that.data.paymentList[index].pay_id
        }, (res) => {
          //console.log(res);
          if (res.statusCode == 200) {
            if (res.data.status === '001') {
              app.reLogin();
              return;
            }
            that.setData({
              isHandle: false
            });
            if (res.data.status == 1) {
              that.setData({
                result: res.data.result
              })
              return;
            }
            wx.showToast({
              title: '操作失败!',
              icon: 'none'
            })
          } else {
            that.setData({
              choosePayment: oldChoosePayment,
              isHandle: false
            });
            wx.showToast({
              title: '选择失败!',
            })
          }
        })
      });
      return;
    }
    if (!that.data.chooseShipping) {
      that.setData({
        choosePayment: that.data.paymentList[index]
      });
      return;
    }
    let oldChoosePayment = that.data.choosePayment
    that.setData({
      isHandle: true,
      choosePayment: that.data.paymentList[index]
    }, () => {
      that.fetchPayable({
        shipping: that.data.chooseShipping.shipping_id,
        payment: that.data.paymentList[index].pay_id
      }, (res) => {
        if (res.statusCode == 200) {
          if (res.data.status === '001') {
            app.reLogin();
            return;
          }
          that.setData({
            isHandle: false
          });
          if (res.data.status == 1) {
            that.setData({
              result: res.data.result
            })
            return;
          }
          wx.showToast({
            title: '操作失败!',
            icon: 'none'
          })
        } else {
          that.setData({
            choosePayment: oldChoosePayment,
            isHandle: false
          });
          wx.showToast({
            title: '选择失败!',
          })
        }
      })
    })
  },
  //设置发票
  bindTax: function(e) {
    let that = this;
    if (!that.data.chooseShipping || !that.data.choosePayment) {
      that.setData({
        tax: e.detail.value.length > 0 ? 1 : 0,
        currentInvType: e.detail.value.length > 0 ? e.currentTarget.dataset.invtype : ''
      })
      return;
    }
    let oldTax = that.data.tax;
    that.setData({
      isHandle: true,
      tax: e.detail.value.length>0?1:0,
      currentInvType: e.detail.value.length > 0 ? e.currentTarget.dataset.invtype:''
    }, () => {
      that.fetchPayable({
        shipping: that.data.chooseShipping.shipping_id,
        payment: that.data.choosePayment.pay_id,
      }, (res) => {
        //console.log(res);
        if (res.statusCode == 200) {
          if (res.data.status === '001') {
            app.reLogin();
            return;
          }
          that.setData({
            isHandle: false
          });
          if (res.data.status == 1) {
            that.setData({
              result: res.data.result
            })
            return;
          }
          wx.showToast({
            title: '操作失败!',
            icon: 'none'
          })
        } else {
          that.setData({
            tax: oldTax,
            isHandle: false
          });
          wx.showToast({
            title: '设置失败!',
          })
        }
      })
    });
  },
  //编辑
  tapEdit: function() {
    let that = this;
    if (!that.data.consignee) {
      wx.showToast({
        title: '请先选择收货地址！',
        icon: 'none'
      })
      return;
    }
    if (!that.data.chooseShipping) {
      wx.showToast({
        title: '请先选择配送方式！',
        icon: 'none'
      })
      return;
    }
    if (!that.data.choosePayment) {
      wx.showToast({
        title: '请先选择支付方式！',
        icon: 'none'
      })
      return;
    }
    //完成
    if(!that.data.isEdit) {
      that.setData({
        isEdit: true
      });
    }else {
      that.setData({
        isEdit: false
      });
    }
  },
  //减数量
  tapReduce: function(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    that.setData({
      isHandle: true
    } ,() => {
      that.modifyGoods({
        goods_id: e.currentTarget.dataset.id,
        'number': parseInt(that.data.goodsList[index].goods_number) - 1
      });
    })
  },
  //加数量
  tapAdd: function(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    that.setData({
      isHandle: true
    }, () => {
      that.modifyGoods({
        goods_id: e.currentTarget.dataset.id,
        'number': parseInt(that.data.goodsList[index].goods_number)+1
      });
    });
  },
  //输入商品数量
  changeGoodsNum: function(e) {
    let that = this;
    let currentNum = that.data.strRangeNum[e.detail.value];
    let oldNum = e.currentTarget.dataset.oldvalue;
    if (parseInt(currentNum) != parseInt(oldNum)) {
      that.setData({isHandle:true});
      that.modifyGoods({
        goods_id: e.currentTarget.dataset.id,
        'number': currentNum
      });
    }
  },
  //删除商品
  tapDelete: function(e) {
    let that = this;
    wx.showModal({
      title: '提示',
      content: '确定删除吗?',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            icon: 'none'
          })
          let index = e.currentTarget.dataset.index;
          that.modifyGoods({
            goods_id: e.currentTarget.dataset.id,
            'number': 0
          }, (res) => {
            if (res.statusCode == 200) {
              if (res.data.status === '001') {
                app.reLogin();
                return;
              }
              if(res.data.status == '1') {
                that.setData({ loginState: app.globalData.loginState }, () => {
                  that.fetchDatas();
                });
              }else {
                wx.showToast({
                  title: '删除失败...',
                })
              }
            } else {
              wx.showToast({
                title: '删除失败...',
              })
            }
          });
        }
      }
    })
  },
  //修改商品
  modifyGoods: function(params, fn) {
    let that = this;
    params.packtype = 0;
    params.tp_user_id = 0;
    params.token = app.globalData.saveInfo.token;
    //修改购物车数量
    app.POST({
      url: `${app.globalData.httpUrl}&c=flow&a=mini_count_add_cart`,
      datas: params
    }, fn?fn:(res) => {
      if (res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        if (res.data.status == 1) {
          //获取应付金额
          that.fetchPayable({
            shipping: that.data.chooseShipping.shipping_id,
            payment: that.data.choosePayment.pay_id,
            isHandle: true
          }, null);
          //获取购物车总数
          app.fetchCart((res) => {
            app.globalData.cartNum = res.data.cart_number;
            let goodsList = that.data.goodsList;
            for (let i = 0; i < that.data.goodsList.length;i++) {
              if (params.goods_id == that.data.goodsList[i].goods_id) {
                goodsList[i].goods_number = params.number;
                that.setData({ goodsList: goodsList, isHandle: false});
                break;
              }
            }
          })
        }
      } else {
        wx.showLoading({
          title: '数据加载失败...',
        })
      }
    });
  },
  //进行登录
  tapLogin: function() { 
    wx.navigateTo({
      url: '/pages/login/index',
    })
  },
  //挑选商品
  bindChoose: function() {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  //留言
  inputPostscript: function(e) {
    this.setData({ postscript: e.detail.value });
  },
  //发票抬头
  inputInvoice: function(e) {
    this.setData({ invoice: e.detail.value});
  },
  //订单提交
  tapSubmit: function() {
    let that = this;
    if (!that.data.consignee) {
      wx.showToast({
        title: '请先选择收货地址!',
        icon: 'none'
      })
      return;
    }
    if (!that.data.chooseShipping||!that.data.chooseShipping.shipping_id) {
      wx.showToast({
        title: '请先选择配送方式!',
        icon: 'none'
      })
      return;
    }
    if (!that.data.choosePayment||!that.data.choosePayment.pay_id) {
      wx.showToast({
        title: '请先选择支付方式！',
        icon: 'none'
      })
      return;
    }
    if (that.data.tax && that.data.invoice.replace(/\s+/g, "")=='') {
      wx.showToast({
        title: '请输入发票抬头!',
        icon: 'none'
      })
      return;
    }
    wx.showLoading({
      title: '提交中...',
      mask: true
    })
    let params = {
      token: app.globalData.saveInfo.token,
      shipping: that.data.chooseShipping.shipping_id,
      payment: that.data.choosePayment.pay_id,
      need_inv: that.data.tax,
      inv_type: that.data.currentInvType,
      inv_payee: that.data.tax ? that.data.invoice.replace(/\s+/g, ""):'',
      postscript: that.data.postscript.replace(/(^\s*)|(\s*$)/g, ""),
      address_id: that.data.consignee.address_id,
    }
    app.POST({
      url: `${app.globalData.httpUrl}&c=flow&a=done_json`,
      datas: params
    } ,(res) => {
      if (res.statusCode == 200) {
        if (res.data.status === '001') {
          app.reLogin();
          return;
        }
        if (res.data.status === '003') {
          that.fetchDatas();
          return;
        }
        if (res.data.status === '004') {
          wx.navigateTo({
            url: '/pages/addressManager/index',
          })
          return;
        }
        if (res.data.status === '005') {
          wx.showToast({
            title: '该系列商品已售罄!',
            icon: 'none'
          })
          return;
        }
        //下单成功
        if (res.data.status == 1) {
          let query = {
            amout: res.data.total.amount_formated,
            order: {
              order_sn: res.data.order.order_sn,
              shipping_name: res.data.order.shipping_name,
              pay_name: res.data.order.pay_name,
              pay_desc: res.data.order.pay_desc
            }
          }
          //微信支付
          res.data.order.pay_id == 4?query.pay_result = res.data.pay_result:null;
          app.globalData.cartNum = 0;
          wx.navigateTo({
            url: `/pages/orderSubmit/index?params=${JSON.stringify(query)}`,
          })
        }else {
          wx.showToast({
            title: '下单失败!',
            icon: 'none'
          })
        }
      } else {
        wx.showToast({
          title: '提交失败！',
        })
      }
    });
    wx.hideLoading();
  },
  //新增收货地址
  tapaddAddress: function() {
    wx.navigateTo({
      url: '/pages/address/index?type=default',
    })
  },
  //选择收获地址
  tapAddressManager: function() {
    wx.navigateTo({
      url: '/pages/addressManager/index',
    })
  },
  //改变收货地址
  changeAddress: function() {
    wx.navigateTo({
      url: '/pages/addressManager/index?isBack=true',
    })
  },
  //进入商品详情
  tapGoods: function(e) {
    wx.navigateTo({
      url: `/pages/detail/index?id=${e.currentTarget.dataset.id}`
    })
  },
  //下拉刷新
  onPullDownRefresh: function() {
    let that = this;
    that.setData({ loginState: app.globalData.loginState }, () => {
      if (app.globalData.loginState)
        that.fetchDatas({ isRefresh: true});
      else 
        wx.removeTabBarBadge({
          index: 2,
        })
        wx.stopPullDownRefresh();
    });
  },
  //打开遮罩
  bindMask: function() {
    wx.hideTabBar({ aniamtion: true });
    this.setData({
      isShowMask: true
    });
  },
  //关闭遮罩
  closeMask: function() {
    wx.showTabBar({ animation: true });
    this.setData({
      isShowMask: false
    });
  }
})
