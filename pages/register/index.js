//index.js
//获取应用实例
const app = getApp()
Page({
  data: {
    isInit: true,//是否初始化中
    isChecked: true,//复选框选择
    isSendCode: false,//是否开始发送验证码
    time: '获取验证码',//倒计时
    currentTime: 60,//验证码时间
    phone: '',//手机号
    pwd: '',//密码
    isCheckInvitationCode: false,//是否检验邀请码
    invitationCodeStatus: -1,//邀请码状态：-1、不使用邀请码 0、不存在 1、存在
    invitationCode: '',//邀请码
    registerType: 0,//注册类型： 0、未选择 1、普会 2、商家
    isHandle: false,//是否操作中
    amount: '',//应缴金额,
    isShare: 0,//是否分享
    model: 1,//注册模式：1、普通会员 2、普会+商家
    modelList: [],//注册模式列表
    isSuccess: false,//是否注册成功
  },
  onLoad: function (options) {
    let that = this;
    if (options&&options.scene) {
      let scene = decodeURIComponent(options.scene);
      options = {
        isShare: scene.split("_")[0],
        invide_code: scene.split("_")[1]
      }
    }
    that.setData({
      isSuccess: false,
      isShare: options.isShare?options.isShare:0,
      invitationCode: options.invide_code ? options.invide_code:''
    }, () => {
      if (options.invide_code) that.invitationCode();//检验邀请码
      that.fetchModel();//获取注册模式
    });
  },
  //请求注册模式
  fetchModel: function() {
    let that = this;
    wx.showNavigationBarLoading();
    app.POST({
      url: `${app.globalData.httpUrl}&c=user&a=register_model_json`
    }, (res) =>{
      wx.stopPullDownRefresh(); 
      wx.hideNavigationBarLoading();
      if (res.statusCode == 200) {
        if(res.data.status == 1) {
          if (res.data.model == 1) {
            that.setData({
              isInit: false
            });
          } else if (res.data.model == 2) {
            that.fetchAmount();//获取商家类型应缴金额
          }
          let modelList = [];
          modelList.push(res.data.one_rank);
          modelList.push(res.data.two_rank);
          that.setData({
            model: res.data.model,
            modelList: modelList,
            registerType: res.data.one_rank.default == 1 ? 1 : res.data.two_rank.default == 1?2:0
          });
          return;
        }
        wx.showModal({
          title: '提示',
          content: '获取注册数据失败，请重新获取!',
          success: (res) => {
            if(res.confirm) {
              that.fetchModel();
            }
          }
        })
      }
    })
  },
  //获取应缴金额
  fetchAmount: function() {
    let that = this;
    wx.showNavigationBarLoading();
    app.POST({
      url: `${app.globalData.httpUrl}&c=user&a=register_pay_json`   
    }, (res) => {
      wx.hideNavigationBarLoading();
      if (res.statusCode == 200) {
        if(res.data.status == 1) {
          that.setData({
            isInit: false,
            amount: res.data.pay
          });
          return;
        }
        wx.showModal({
          title: '提示',
          content: '获取应缴金额失败，请重新获取!',
          success: (res) => {
            if (res.confirm) {
              that.fetchModel();
            }
          }
        })
      }
    })
  },
  //绑定手机号
  inputPhone: function(e) {
    let that = this;
    that.setData({
      phone: e.detail.value
    });
  },
  //绑定密码
  inputPwd: function(e) {
    let that = this;
    that.setData({
      pwd: e.detail.value
    });
  },
  //发送验证码
  tapSendCode: function () {
    this.getCode();
  },
  //获取验证码
  getCode: function () {
    let that = this;
    if (that.data.phone == '') {
      wx.showToast({
        title: '请输入手机号码!',
        icon: 'none'
      })
      return;
    }
    if (!(/^1[3|4|5|7|8]\d{9}$/).test(that.data.phone)) {
      wx.showToast({
        title: '手机号码格式不正确!',
        icon: 'none'
      })
      return;
    }
    that.setData({
      isSendCode: true
    }, () => {
      app.POST({
        url: `${app.globalData.httpUrl}&c=user&a=get_code_json`,
        datas: {
          token: app.globalData.token,
          phone: that.data.phone
        }
      }, (res) => {
        //console.log(res.data.code);
        if (res.statusCode == 200) {
          if (res.data.status == 1) {
            let currentTime = that.data.currentTime;
            let interval = setInterval(() => {
              currentTime--;
              that.setData({
                time: currentTime + '秒'
              })
              if (currentTime <= 0) {
                clearInterval(interval)
                that.setData({
                  time: '重新发送',
                  currentTime: 60,
                  isSendCode: false
                })
              }
            }, 1000);
            return;
          }
          that.setData({
            isSendCode: false
          });
          if (res.data.status == 498) {
            wx.showToast({
              title: `${res.data.msg}!`,
              icon: 'none'
            })
            return;
          }
          if (res.data.status == 499) {
            wx.showModal({
              title: '提示',
              content: '未知错误，请重新进入！',
              success: (res) => {
                if(res.confirm) {
                  wx.reLaunch({
                    url: '/pages/index/index',
                  })
                }
              }
            })
            return;
          }
        }else {
          wx.showToast({
            title: '操作失败！',
            icon: 'none'
          })
        }
      }, (err) => {
        wx.showModal({
          title: '提示',
          content: '网络不给力哦！',
          showCancel: false,
          success: (res) => {
            if (res.confirm) {
              that.setData({
                time: '发送验证码',
                currentTime: 60,
                isSendCode: false
              })
            }
          }
        })
      });
    });
  },
  //类型改变
  radioChange: function(e) {
    let that = this;
    that.setData({ registerType:e.detail.value});
  },
  focusInvitationCode: function() {
    this.setData({ isCheckInvitationCode: true, invitationCodeStatus: -1});
  },
  //邀请码验证
  blurInvitationCode: function(e) {
    let that = this;
    let value = e.detail.value;
    if (value.replace(/(^\s*)|(\s*$)/g, "") == '') {
      that.setData({
        isCheckInvitationCode: false,
        invitationCodeStatus: -1
      });
      return;
    }
    that.setData({
      invitationCode: value,
      isCheckInvitationCode: true
    }, () => {
      that.invitationCode();
    });
  },
  invitationCode: function() {
    let that = this;
    //验证邀请码
    app.POST({
      url: `${app.globalData.httpUrl}&c=user&a=check_invide_json`,
      datas: {
        invide_code: that.data.invitationCode
      }
    }, (res) => {
      if (res.statusCode == 200) {
        if (res.data.status == 1) {
          that.setData({
            isCheckInvitationCode: false,
            invitationCodeStatus: 1
          });
          return;
        }
        if (res.data.status == '401') {
          wx.showToast({
            title: '请填写邀请码!',
            icon: 'none'
          })
          that.setData({
            isCheckInvitationCode: false,
            invitationCodeStatus: -1
          });
          return;
        }
        if (res.data.status == '402') {
          that.setData({
            isCheckInvitationCode: false,
            invitationCodeStatus: 0
          });
          return;
        }

      } else {
        wx.showToast({
          title: '操作失败!',
          icon: 'none'
        })
      }
    })
  },
  //协议同意
  tapchecked: function () {
    this.setData({ isChecked: !this.data.isChecked });
  },
  //注册保存
  registerSave: function(e) {
    let that = this;
    //判断是否通过分享进入
    let data = e.detail.value;
    if (that.data.isCheckInvitationCode) {
      wx.showToast({
        title: '邀请码校验中...',
        icon: 'none'
      })
      return;
    }
    if (data.phone == '') {
      wx.showToast({
        title: '请输入手机号码!',
        icon: 'none'
      })
      return;
    }
    if (!(/^1[3|4|5|7|8]\d{9}$/).test(data.phone)) {
      wx.showToast({
        title: '手机号码格式不正确!',
        icon: 'none'
      })
      return;
    }
    if (data.pwd.indexOf(" ") != -1 || data.pwd.replace(/\s+/g, "").length < 6) {
      wx.showToast({
        title: '密码最少六位字符,且不能为空字符串!',
        icon: 'none'
      })
      return;
    }
    if (data.code == '') {
      wx.showToast({
        title: '请输入验证码!',
        icon: 'none'
      })
      return;
    }
    if (that.data.model == 2&&that.data.registerType == 0) {
      wx.showToast({
        title: '请先选择注册类型!',
        icon: 'none'
      })
      return;
    }
    if (!that.data.isChecked) {
      wx.showToast({
        title: '请先同意我们的协议!',
        icon: 'none'
      })
      return;
    } 
    if (that.data.registerType == 2 && !that.data.amount) {
      wx.showToast({
        title: '获取应缴金额失败，请联系客服！',
        icon: 'none'
      })
      return;
    }
    let params = {
      token: app.globalData.token,
      register_type: that.data.registerType,
      phone: data.phone,
      password: data.pwd,
      code: data.code
    }
    //邀请码存在
    that.data.invitationCodeStatus == 1 ? params.invide_code = that.data.invitationCode : null;
    that.setData({isHandle:true}, () => {
      app.POST({
        url: `${app.globalData.httpUrl}&c=user&a=register_json`,
        datas: params
      }, (res) => {
        //console.log(res);
        that.setData({ isHandle: false });
        if (res.statusCode == 200) {
          if (res.data.status == 1) {
            //判断注册类型
            if (that.data.model==1||that.data.registerType == 1) {
              that.setData({
                isSuccess: true
              }, () => {
                wx.showModal({
                  title: '恭喜',
                  showCancel: false,
                  content: '注册成功，前往登录...',
                  success: (res) => {
                    if (res.confirm) {
                      //判断是否通过分享进入
                      that.data.isShare ? wx.redirectTo({
                        url: `/pages/login/index?isShare=1&phone=${that.data.phone}&pwd=${that.data.pwd}`,
                      }) : wx.navigateBack({
                        delta: 1
                      })
                    }
                  }
                })
              });
            } else if (that.data.registerType == 2) {
              //付款注册
              that.pay(res.data.result);
            }
            return;
          }
          if (res.data.status == '022') {
            wx.showToast({
              title: '手机号码重复!',
              icon: 'none'
            })
            return;
          }
          if (res.data.status == '402') {
            wx.showToast({
              title: '验证码有误!',
              icon: 'none'
            })
            return;
          }
          if (res.data.status == '403') {
            wx.showToast({
              title: '验证码超时!',
              icon: 'none'
            })
            return;
          }
        } else {
          wx.showToast({
            title: '操作失败！',
            icon: 'none'
          })
        }
      }, (error) => {
        wx.showModal({
          title: '提示',
          content: '网络不给力哦！',
          showCancel: false,
          success: (res) => {
            if(res.confirm) {
              that.setData({
                isHandle: false
              })
            }
          }
        })
      })
    })
  },
  //付款
  pay: function (data) {
    let that = this;
    wx.requestPayment({
      'timeStamp': data.timestamp.toString(),
      'nonceStr': data.noncestr,
      'package': data.package,
      'signType': 'MD5',
      'paySign': data.sign,
      success: function (res) {
        that.setData({
          isSuccess: true
        }, () => {
          wx.showModal({
            title: '恭喜',
            showCancel: false,
            content: '注册成为商家类型，前往登录...',
            success: (res) => {
              if (res.confirm) {
                //判断是否通过分享进入
                that.data.isShare ? wx.redirectTo({
                  url: `/pages/login/index?isShare=1&phone=${that.data.phone}&pwd=${that.data.pwd}`,
                }) : wx.navigateBack({
                  delta: 1
                })
              }
            }
          })
        });
      },
      fail: function (res) {
        wx.showToast({
          title: '注册商家类型失败!',
          icon: 'none'
        })
        //console.info(res);
      }
    });
  },
  //注册成功返回用户名和密码
  onUnload: function() {
    let that = this;
    //注册成功并且不是通过分享进入
    if (that.data.isSuccess && !that.data.isShare) {
      let pages = getCurrentPages();
      let prevPage = pages[pages.length - 2];//上一个页面
      prevPage.setData({
        userName: that.data.phone,
        pwd: that.data.pwd
      })
      return;
    }
  },
  //返回首页
  backHome: function() {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  //分享
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      //console.log(res.target)
    }
    return {
      title: '欢迎加入我们!',
      path: '/pages/register/index?isShare=1',
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },
  //下拉刷新
  onPullDownRefresh: function () {
    let that = this;
    that.fetchModel();//获取注册模式
  }
})
