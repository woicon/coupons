// pages/index/index.js
let app = getApp()
Page({
  data: {
    indicatorDots: false,
    autoplay: false,
    interval: 5000,
    duration: 1000,
    receiveStatus: ['卡券失效', '超过总领取限制', '已领取', '已领完', '超过单日领取限制'],
    couponType: ['全场代金券', '全场折扣券', '礼品兑换券', '优惠券', '团购券', '单品代金券', '会员卡', '单品折扣券', '单品特价券', '全场满减券'],
    couponStatus: ['未生效', '可使用', '已使用', '已失效', '已过期', '已删除', '已锁定'],
    couponTab: ['可使用', '已使用', '已失效', '已过期'],
    errorMessage: '系统繁忙',
    banner: null,
    regStat: true,
    menuPos: false,
    pageloading: false,
    page: 0,
    tabCurr: 0,
    currentTab: 0,
    currTab: 0,
    tabPos: 0,
    status: 1,
    hasMore: false,
    hasRefesh: false,
    page: 'coupons',
    toBottom: false,
    memberCouponMore: true,
    hasMore: true,
    indexBottom: false,
    tabBar: [
      {
        pagePath: "index",
        text: "首页",
        iconPath: "home",
        selectedIconPath: "home-s",
        active: true
      },
      {
        pagePath: "coupons",
        text: "我的券",
        iconPath: "coup",
        selectedIconPath: "coup-s",
        active: false
      },
      {
        link: 'viewCard',
        text: "会员卡",
        iconPath: "user",
        selectedIconPath: "user-s",
        active: false
      }
    ],
  },

  goPage: function (e) {
    let that = this
    that.setData({
      tabCurr: e.currentTarget.dataset.id,
      page: e.currentTarget.dataset.url
    })
  },

  onLoad: function (options) {
    var that = this
    let parmas = {
      merchantId: app.api.parmas.merchantId
    }
    app.jsData('wechatAppCouponCategory', parmas).then((data) => {
      console.log(data.categoryList.length)
      let lessMenu = null, menuNum = null
      if (data.categoryList.length <= 4) {
        lessMenu = true
        menuNum = data.categoryList.length
      }

      let setData = {
        categoryList: data.categoryList,
        lessMenu: lessMenu,
        menuNum: menuNum
      }

      if (data.bannerList.length != 0) {
        setData.banner = data.bannerList
      }
      that.setData(setData)
    })
      .then(function () {
        that.couponLoad({ catId: that.data.categoryList[0].categoryId })
      })
      .then(function () {
        that.memberCoupons()
        console.log(app.globalData.isPX)
        that.setData({
          isPX: app.globalData.isPX
        })
      })
      .catch(function (error) {
        console.log(error)
      })
  },

  memberCoupons: function (currentPage) {
    //获取用户优惠券
    let that = this
    let memberCoupons = (memberInfo) => {
      let couponsParmas = {
        superMerchantId: app.api.parmas.merchantId,
        memberId: memberInfo.memberId,
        currentPage: currentPage || 1
      }
      app.jsData('couponList', couponsParmas).then((memberCoupons) => {
        console.log('获取优惠券列表', memberCoupons)
        if (currentPage) {
          let _memberCoupons = that.data.memberCouponList
          if (memberCoupons.items.length == 0) {
            console.log('没有更多了')
            that.setData({
              memberCouponMore: false
            })
          } else {
            _memberCoupons.items.push(memberCoupons.items)
            memberCoupons.items.forEach((item) => {
              _memberCoupons.items.push(item)
            })
            _memberCoupons.currentPage = memberCoupons.currentPage

            that.setData({
              memberCouponList: _memberCoupons,
            })
          }
        } else {
          that.setData({
            memberCouponList: memberCoupons,
          })
        }
      })
    }
    try {
      let memberInfo = wx.getStorageSync("memberCardInfo")
      if (memberInfo) {
        memberCoupons(memberInfo)
      } else {
        app.backGetMemberCoupons = (memberInfo) => {
          memberCoupons(memberInfo)
        }
      }
    } catch (error) {
      console.log(error)
    }
  },
  //领取优惠券
  getCoupon: function (e) {
    var that = this
    let memberInfo = wx.getStorageSync("memberCardInfo")
    var parmas = {
      cardIds: e.target.dataset.id,
      openId: app.api.parmas.openId,
      merchantId: app.api.parmas.merchantId,
      memberId: memberInfo.memberId
    }
    let couponIndex = e.target.dataset.index
    app.jsData('couponGet', parmas).then((res) => {
      if (res.returnCode === 'S') {
        wx.showModal({
          title: '领取成功',
          content: '微信支付即自动核销，每次支付仅限使用一张优惠券',
          showCancel: false
        })
        let _couponList = that.data.couponList
        _couponList.items[couponIndex].receive = false
        that.setData({
          couponList: _couponList
        })
        that.memberCoupons()
      }
    })
  },
  couponLoad: function (e) {
    let that = this
    try {
      if (e.currentPage) {
        that.setData({
          indexBottom: false
        })
      }
    } catch (error) {
      console.log(error)
    }
    let couponByCategory = (memberInfo) => {
      let params = {
        categoryId: e.catId || e.target.dataset.id,
        memberId: memberInfo.memberId,
        currentPage: e.currentPage || 1
      }
      let currId = (e.catId) ? "0" : e.currentTarget.id
      app.jsData('wechatAppCouponByCategory', params).then((coupon) => {
        console.log('获取优惠券分类', coupon)
        if (e.currentPage) {
          let _couponList = that.data.couponList
          if (!coupon.items) {
            that.setData({
              hasMore: false
            })
          } else {
            coupon.items.forEach((item) => {
              _couponList.items.push(item)
            })
            _couponList.currentPage = e.currentPage
            that.setData({
              couponList: _couponList,
              currMenu: currId,
              pageloading: true,
              page: 'index'
            })
          }
        } else {
          that.setData({
            couponList: coupon,
            currMenu: currId,
            pageloading: true,
            page: 'index'
          })
        }
        if (that.data.banner != null) {
          setTimeout(function () {
            wx.createSelectorQuery().select('#banner').boundingClientRect((rect) => {
              that.setData({
                bannerHeight: rect.height
              })
            }).exec()
          }.bind(this), 100)
        } else {
          that.setData({
            menuPos: true
          })
        }
      })
    }

    try {
      let memberInfo = wx.getStorageSync("memberCardInfo")
      if (memberInfo) {
        couponByCategory(memberInfo)
      } else {
        app.backGetMember = (memberInfo) => {
          couponByCategory(memberInfo)
        }
      }
    } catch (error) {
      console.log(error)
    }
  },
  indexScroll: function (e) {
    let that = this
    //分类位置
    if (that.data.banner != null) {
      var query = wx.createSelectorQuery()
      let bannerHeight = that.data.bannerHeight
      query.select('#banner').boundingClientRect((rect) => {
        let _menuPos = (rect.top > -bannerHeight) ? false : true
        that.setData({
          menuPos: _menuPos
        })
      }).exec()
    }
  },

  //查看优惠券详情
  couponDescription: function (e) {
    let that = this
    console.log(e)
    let touchTime = that.data.touchEnd - that.data.touchStart
    let couponNo = e.currentTarget.id
    let parmas = {
      couponNo: e.currentTarget.id,
      superMerchantId: app.api.parmas.merchantId,
      openId: app.api.parmas.openId
    }
    var _couponList = that.data.couponList
    var _colorList = that.data.colorList
    if (touchTime > 350) {
      wx.showModal({
        title: '删除优惠券？',
        content: '',
        success: function (res) {
          if (res.confirm) {
            wx.request({
              url: app.api.host + 'delCoupon.htm?json=' + JSON.stringify(parmas),
              method: 'POST',
              success: function (res) {
                if (res.data.returnCode == 'S') {
                  _couponList.items.splice(e.currentTarget.dataset.id, 1)
                  _colorList.splice(e.currentTarget.dataset.id, 1)
                  wx.showToast({
                    title: '已删除',
                    icon: 'success',
                    duration: 2000
                  })
                  that.setData({
                    couponList: _couponList,
                    colorList: _colorList,
                  })
                  wx.clearStorageSync("COUPONS");
                }
              }
            });
            return false
          } else if (res.cancel) {
          }
        }
      })
      wx.request({
        url: app.api.host + 'delCoupon.htm?json=' + JSON.stringify(parmas),
        method: 'POST',
        success: function (res) {
          wx.showToast({
            title: '删除成功',
          })
        }
      })
    } else {
      if (e.currentTarget.dataset.index) {
        let data = JSON.stringify(that.data.couponList.items[e.currentTarget.dataset.id])
        wx.navigateTo({
          url: '/pages/couponsdetail/couponsdetail?data=' + data + '&id=' + e.currentTarget.dataset.id + '&catId=' + that.data.categoryList[that.data.currMenu].categoryId
        })
      } else {
        wx.navigateTo({
          url: '/pages/couponsdetail/couponsdetail?id=' + e.currentTarget.id,
        })
      }
    }
  },

  viewCard: function () {
    app.viewCard()
  },

  loadMore: function (e) {
    let that = this
    that.setData({
      toBottom: true
    })
    let currentPage = that.data.memberCouponList.currentPage + 1
    if (that.data.memberCouponMore) {
      that.memberCoupons(currentPage)
    }
  },
  indexMore: function (e) {
    let that = this
    that.setData({
      indexButtom: true
    })
    let currentPage = that.data.couponList.currentPage + 1
    console.log(currentPage)
    that.setData({
      indexBottom: true
    })
    if (that.data.hasMore) {
      that.couponLoad({
        catId: that.data.categoryList[that.data.currMenu].categoryId,
        currentPage: currentPage
      })
    }
  },
  onReachBottom: function (e) {
    let that = this
    that.setData({
      hasMore: true
    })
  },

  //个人优惠券切换
  tabToggle: function (e) {
    let that = this
    let memberCouponList = that.data.memberCouponList.items
    let status = e.target.dataset.status
    let statusNum = []
    let couponEmpty = null
    memberCouponList.forEach((item) => {
      if (item.couponStatus === status) {
        statusNum.push(status)
      }
    })
    if (statusNum.length === 0) {
      couponEmpty = true
    }
    that.setData({
      currTab: e.target.id,
      tabPos: e.target.offsetLeft,
      status: status,
      toBottom: false,
      couponEmpty: couponEmpty
    })
  },

  onHide: function () {
    //用户优惠券状态
    this.setData({
      resMemberCoupon: false,
    })
  },

  onShow: function (options) {
    let that = this
    try {
      let memberInfo = wx.getStorageSync("memberCardInfo")
      let sessionKey = wx.getStorageSync("sessionKey")
      if (memberInfo.returnCode === 'F') {
        app.getMember(sessionKey)
      }
      console.log("主页onShow，Member", memberInfo)
      console.log("主页onShow，Session", sessionKey)
    } catch (error) {
      console.log('主页onShow错误', error)
    }
    if (that.data.resMemberCoupon) {
      that.memberCoupons()  //刷新用户优惠券
    } else {
      console.log("主页onShow，未刷新优惠券", that.data.resMemberCoupon)
    }
  }
})