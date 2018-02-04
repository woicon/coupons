// pages/index/index.js
let app = getApp()
//let apiHost = "http://wxcs.liantuo.com/api/apiJsConfig.do"
Page({
    data: {
        indicatorDots: false,
        autoplay: false,
        interval: 5000,
        duration: 1000,
        receiveStatus: ['卡券失效', '超过总领取限制', '已领取', '已领完', '超过单日领取限制'],
        couponType: ['代金券','折扣券','兑换券','优惠券','团购券','单品代金券','会员卡','单品折扣','单品特价券','全场满减券'],
        banner: null,
        regStat: true,
        menuPos: false,
        errorMessage: '系统繁忙',
        pageloading:false,
        page:0,
        tabCurr:0,
        currentTab: 0,
        couponTab: ['可使用', '已使用', '已失效', '已过期'],
        currTab: 0,
        tabPos: 0,
        status: 1,
        couponStatus: ['未生效', '可使用', '已使用', '已失效', '已过期', '已删除', '已锁定'],
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
                text: "优惠券",
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

    goPage:function(e){
        let that = this
        that.setData({
            tabCurr:e.currentTarget.dataset.id,
            page: e.currentTarget.dataset.url
        })
    },

    onLoad: function (options) {
        var that = this
        console.log('load load')
        let parmas = {
            merchantId: app.api.parmas.merchantId
        }
        app.jsData('wechatAppCouponCategory', parmas).then( (data) => {
            let setData = {
                categoryList: data.categoryList
            }
            if (data.bannerList.length != 0) {
                setData.banner = data.bannerList
            }
            that.setData(setData)
        })
        .then(function () {
            that.couponLoad({ catId: that.data.categoryList[0].categoryId })
        })
        .then(function(){
            that.memberCoupons()
            that.setData({
                isPX: app.globalData.isPX
            })
        })
        .catch(function (error) {
            console.log(error)
        })
    },

    memberCoupons:function(){
        //获取用户优惠券
        let that = this
        let memberCoupons = (memberInfo) =>{
            let couponsParmas = {
                superMerchantId: app.api.parmas.merchantId,
                memberId: memberInfo.memberId
            }
            app.jsData('couponList', couponsParmas).then( (memberCoupons) => {
                that.setData({
                    memberCouponList: memberCoupons,
                })
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

    couponLoad: function (e) {
        let that = this
        let couponByCategory = (memberInfo) => {
            let params = {
                categoryId: e.catId || e.target.dataset.id,
                memberId: memberInfo.memberId
            }
            let currId = (e.catId) ? "0" : e.currentTarget.id
            app.jsData('wechatAppCouponByCategory', params).then( (coupon) => {
                console.log(coupon)
                that.setData({
                    couponList: coupon,
                    currMenu: currId,
                    pageloading: true,
                    page:'index'
                })
                setTimeout(function(){
                    wx.createSelectorQuery().select('#banner').boundingClientRect( (rect) => {
                        that.setData({
                            bannerHeight: rect.height
                        })
                    }).exec()
                }.bind(this),100)
            })
        }
        try{ 
            let memberInfo = wx.getStorageSync("memberCardInfo")
            if (memberInfo){
                couponByCategory(memberInfo)
            }else{
                app.backGetMember = (memberInfo) => {
                    couponByCategory(memberInfo)
                }
            }
        } catch (error) {
            console.log(error)
        }
    },
    onPageScroll: function (e) {
        let that = this
        //分类位置
        var query = wx.createSelectorQuery()
        let bannerHeight = that.data.bannerHeight
        query.select('#container').boundingClientRect( (rect) => {
            let _menuPos = (rect.top > -bannerHeight) ? false : true
            that.setData({
                menuPos: _menuPos
            })
        }).exec()
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
        app.jsData('couponGet', parmas).then( (res) => {
            if(res.returnCode === 'S'){
                wx.showToast({
                    title: '领取成功',
                    icon: 'success',
                    duration: 2000
                })
                let _couponList = that.data.couponList
                _couponList.items[couponIndex].receive = false
                that.setData({
                    couponList:_couponList
                })
                that.memberCoupons()
            }
        })
    },

    //查看优惠券详情
    couponDescription: function (e) {
        let that = this
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
            wx.navigateTo({
                url: '/pages/couponsdetail/couponsdetail?id=' + e.currentTarget.id,
            });
        }
    },

    viewCard: function () {
        app.viewCard()
    },

    tabToggle: function (e) {
        let that = this
        console.log(e)
        that.setData({
            currTab: e.target.id,
            tabPos: e.target.offsetLeft,
            status: e.target.dataset.status
        })
    },
    
    onShow: function (options) {
        let that = this
        try{
            let memberInfo = wx.getStorageSync("memberCardInfo")
            let sessionKey = wx.getStorageSync("sessionKey")
            if (memberInfo.returnCode === 'F'){
                app.getMember(sessionKey)
            }
        }catch(error){
            console.log(error)
        }
    }
})