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
        //couponTab: ['可使用', '已使用', '已失效', '已过期'],
        couponTab: ['可使用', '已使用', '未生效', '已过期'],
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
        hasRefesh: false,
        couponList: null,
        page: 'coupons',
        toBottom: false,
        memberCouponMore:true,
        indexCouponMore: true,
        indexBottom: false,
        memberCouponLoad:true,
        tabBar: [
            {
                pagePath: "index",
                text: "首页",
                iconPath: "home",
                active: true
            },
            {
                pagePath: "coupons",
                text: "我的券",
                iconPath: "coup",
                active: false
            },
            {
                link: 'viewCard',
                text: "会员卡",
                iconPath: "user",
                active: false
            }
        ],
    },
    goPage: function (e) {
        let that = this
        const dataset = e.currentTarget.dataset
        if (dataset.url === 'index') {
            that.couponCategory().then((res) => {
                that.couponLoad({ catId: that.data.currCat,currMenu:that.data.currMenu})
            })
        }
        if (dataset.url === 'coupons') {
            that.memberCoupons({status: that.data.status})
        }
        that.setData({
            tabCurr: dataset.id,
            page: dataset.url
        })
    },
    onLoad: function (options) {
        let that = this
        that.couponCategory().then((res) => {
            that.couponLoad({ catId: that.data.categoryList[0].categoryId })
        })
    },
    onReady: function () {
        this.setData({
            isPX: app.globalData.isPX
        })
    },
    
    couponCategory: function (res) {
        //优惠券分类
        let that = this
        let parmas = {
            merchantId: app.api.parmas.merchantId
        }
        return app.jsData('wechatAppCouponCategory', parmas).then(function (data) {
            if (data.returnCode == 'S') {
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
                return data
            } else {
                console.log(data)
                app.setError(data.returnMessage)
                return
            }
        })
    },
    memberCoupons: function (couponsData) {
        //获取用户优惠券
        let that = this
        let parmas = couponsData || {}
        let memberCoupons = (memberInfo) => {
            let couponsParmas = {
                superMerchantId: app.api.parmas.merchantId,
                memberId: memberInfo.memberId,
                currentPage: parmas.currentPage || 1,
                status: parmas.status || that.data.status
            }
            if (!parmas.currentPage){
                that.setData({
                    memberCouponLoading:true
                })
            }
            app.jsData('couponList', couponsParmas).then((memberCoupons) => {
                if (parmas.currentPage) {
                    let _memberCoupons = that.data.memberCouponList
                    if (memberCoupons.items.length == 0) {
                        that.setData({
                            memberMoreStat: false
                        })
                    } else {
                        memberCoupons.items.forEach((item) => {
                            _memberCoupons.items.push(item)
                        })
                        _memberCoupons.currentPage = memberCoupons.currentPage
                        that.setData({
                            memberCouponList: _memberCoupons,
                            memberMoreStat: true
                        })
                    }
                } else {
                    console.log('用户已领取的优惠券',memberCoupons)
                    let couponEmpty = (memberCoupons.items.length == 0) ? true : false
                    that.setData({
                        memberCouponList: memberCoupons,
                        couponEmpty: couponEmpty,
                        memberCouponBottom:false,
                        memberCouponLoading:false,
                        memberMoreStat:true
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
                //that.memberCoupons({})
            }
        })
    },
    
    couponLoad: function (curr) {
        let that = this
        var e = curr || {}
        if (e.currentPage) {
            that.setData({
                indexBottom:true,
                loadStat:false
            })
        }else{
            that.setData({
                indexCouponMore:true
            })
        }
        let couponByCategory = (memberInfo) => {
            let params = {
                categoryId: e.catId || e.target.dataset.id,
                memberId: memberInfo.memberId,
                currentPage: e.currentPage || 1
            }
            app.jsData('wechatAppCouponByCategory', params).then((coupon) => {
                console.log('获取优惠券分类', coupon)
                if (coupon.returnCode ==  'S'){
                    let currId = (e.catId) ? "0" : e.currentTarget.id
                    if (e.currentPage) {
                        let _couponList = that.data.couponList
                        if (!coupon.items) {
                            that.setData({
                                indexCouponMore: false
                            })
                        } else {
                            coupon.items.forEach((item) => {
                                _couponList.items.push(item)
                            })
                            _couponList.currentPage = e.currentPage
                            that.setData({
                                couponList: _couponList,
                                pageloading: true
                            })
                        }
                    } else {
                        that.setData({
                            couponList: coupon,
                            currMenu: e.currMenu || currId,
                            currCat: that.data.categoryList[currId].categoryId,
                            pageloading: true,
                            loadStat:true,
                            page: 'index',
                        })
                    }
                }
                if (that.data.banner != null) {
                    setTimeout(function () {
                        wx.createSelectorQuery().select('#banner').boundingClientRect((rect) => {
                            that.setData({
                                bannerHeight: rect.height
                            })
                        }).exec()
                    }.bind(this), 300)
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
    },

    viewCard: function () {
        app.viewCard()
    },

    indexMore: function (e) {
        let that = this,
        currentPage = that.data.couponList.currentPage + 1
        that.setData({
            indexBottom: true,
            loadStat:false
        })

        if (that.data.indexCouponMore) {
            //setTimeout(function(){
                    that.couponLoad({
                        catId: that.data.categoryList[that.data.currMenu].categoryId,
                        currentPage: currentPage
                    })
            //}.bind(this), 1200)
        }
    },

    getUserInfo: function () {
        //跳转设置页面授权
        var that = this
        if (wx.openSetting) {
            wx.openSetting({
                success: function (res) {
                    //尝试再次登录
                    app.login()
                }
            })
        } else {
            wx.showModal({
                title: '授权提示',
                content: '小程序需要您的微信授权才能使用哦~ 错过授权页面的处理方法：删除小程序->重新搜索进入->点击授权按钮'
            })
        }
    },

    //用户优惠券Tab切换
    tabToggle: function (e) {
        let that = this,
        statusIndex = that.data.couponStatus.findIndex( item => item == e.target.dataset.txt)
        setTimeout(function() {
            that.memberCoupons({status:statusIndex})
        }.bind(this),200)
        that.setData({
            currTab: e.target.id,
            tabPos: e.target.offsetLeft,
            toBottom: false,
            status: statusIndex,
            memberCouponMore:true
        })
    },

    //用户优惠券下拉加载更多
    moreMemberCoupons: function (e) {
        let that = this
        console.log("用户优惠下拉GetMore", e)
        that.setData({
            memberCouponBottom: true
        })
        setTimeout(function(){
            let currentPage = that.data.memberCouponList.currentPage + 1
            if (that.data.memberMoreStat) {
                that.memberCoupons({ currentPage: currentPage, status: that.data.status })
            }
        }.bind(this),1500)
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
                console.log("重新加载会员信息", sessionKey)
            }
            console.log("主页onShow，Member", memberInfo)
            console.log("主页onShow，Session", sessionKey)
        } catch (error) {
            console.log('主页onShow错误', error)
        }
        if (that.data.resMemberCoupon) {
            //详情页领取优惠券后刷新用户优惠券 
            that.memberCoupons({ status: that.data.status})
        }
    }
})