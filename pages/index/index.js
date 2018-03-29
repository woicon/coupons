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
        couponTab: ['可使用', '已使用', '未生效', '已过期'],
        errorMessage: '系统繁忙',
        banner: null,
        regStat:true,
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
        page: 'index',
        currMenu:0,
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

    onShareAppMessage: function (res) {
        return {
            title: '来领取优惠券吧！',
            path: '/pages/index/index',
            success: function (res) {
                // 转发成功
            },
            fail: function (res) {
                // 转发失败
            }
        }
    },
    
    goPage: function (e) {
        let that = this
        const dataset = e.currentTarget.dataset
        if (dataset.url === 'index') {
            that.couponCategory().then((res) => {
                that.couponLoad({ catId: that.data.catId,currMenu:that.data.currMenu})
            })
        }
        if (dataset.url === 'coupons') {
            that.memberCoupons({status:that.data.status})
        }
        that.setData({
            tabCurr: dataset.id,
            page: dataset.url
        })
    },
    
    couponCategory: function (res) {
        let that = this
        let parmas = {
            merchantId: app.api.merchantId
        }
        return app.jsData('wechatAppCouponCategory', parmas).then(function (catdata) {
            if (catdata.returnCode == 'S') {
                let lessMenu = null, menuNum = null
                if (catdata.categoryList.length <= 4) {
                    lessMenu = true
                    menuNum = catdata.categoryList.length
                }
                //userLimit用户领取限制 0不限 1会员专享
                let setData = {
                    categoryList: catdata.categoryList,
                    lessMenu: lessMenu,
                    menuNum: menuNum,
                    catId: catdata.categoryList[0].categoryId,
                    userLimit: catdata.userLimit,
                    regStat: (that.data.isMember || catdata.userLimit === 0) ? true : false
                }
                
                if (catdata.bannerList.length != 0) {
                    setData.banner = catdata.bannerList
                }
                that.setData(setData)
            } else {
                app.setError(catdata.returnMessage)
                return false
            }

            return catdata
        })
    },

    //获取用户信息
    getMember: function (sessionKey) {
        let that = this
        let parmas = {
            merchantId: app.api.merchantId,
            unionId: sessionKey.unionid
        }
        return app.jsData('memberCardInfo', parmas).then((memberInfo) => {
            console.log(memberInfo)
            that.setData({
                error: false,
                failUserInfo: false,
                isMember: memberInfo.memberId ? true : false
            })
            wx.setStorageSync("memberCardInfo", memberInfo)
            return memberInfo
        })
    },

    //用户优惠券
    memberCoupons: function (couponsData) {
        //获取用户优惠券
        let that = this
        let parmas = couponsData || {}
        let couponsParmas = {
            superMerchantId: app.api.merchantId,
            currentPage: parmas.currentPage || 1,
            status: parmas.status || that.data.status
        }
        if(that.data.isMember){
            couponsParmas.memberId = wx.getStorageSync("memberCardInfo").memberId
        }else{
            couponsParmas.unionId = wx.getStorageSync("sessionKey").unionid
        }
        if (!parmas.currentPage){
            that.setData({
                memberCouponLoading:true
            })
        }
        return app.jsData('couponList', couponsParmas).then((memberCoupons) => {
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
                let couponEmpty = (memberCoupons.items && memberCoupons.items.length == 0) ? true : false
                that.setData({
                    memberCouponList: memberCoupons,
                    couponEmpty: couponEmpty,
                    memberCouponBottom:false,
                    memberCouponLoading:false,
                    memberMoreStat:true
                })
            }
            return memberCoupons
        })
    },

    //领取优惠券
    getCoupon: function (e) {
        app.getCoupon(e)
    },

    couponLoad: function (e) {
        let that = this
        if (e.currentPage) {
            that.setData({
                indexBottom:true,
            })
        }else{
            that.setData({
                indexCouponLoading:true,
                indexBottom:false,
                indexCouponMore:true
            })
        }
       
        let params = {
            categoryId: e.catId,
            currentPage: e.currentPage || 1
        }
        let sessionKey = wx.getStorageSync("sessionKey")
        let memberInfo = wx.getStorageSync("memberCardInfo")
        if(that.data.isMember){
            params['memberId'] = memberInfo.memberId
        } else{
            params['unionId'] = sessionKey.unionid
        }
        return app.jsData('wechatAppCouponByCategory', params)
            .then((coupon) => {
                console.log(coupon)
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
                        pageloading: true,
                        indexCouponLoading:false,
                        page: e.page || 'index',
                    })
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
    },

    catToggle:function(e){
        let that = this
        console.log(e)
        that.couponLoad({ catId: e.currentTarget.dataset.id}).then((coupon)=>{
            that.setData({
                currMenu:e.currentTarget.id,
                currCat:e.currentTarget.dataset.id
            })
        })
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
        let touchTime = that.data.touchEnd - that.data.touchStart
        let couponNo = e.currentTarget.id
        let parmas = {
            couponNo: e.currentTarget.id,
            superMerchantId: app.api.merchantId,
            openId: app.api.openId
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
            indexCouponMore: true,
        })

        if (that.data.indexCouponMore) {
            that.couponLoad({
                catId:that.data.catId,
                currentPage: currentPage
            })
        }
    },
    //跳转设置页面授权
    getUserInfo: function () {
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

    resPage: function (sessionKey) {
        let that = this
        that.getMember(sessionKey).then((res)=>{
            that.couponCategory()
            .then((catdata) => {
                console.log(catdata)
                that.couponLoad({
                    catId: catdata.categoryList[0].categoryId,
                    page: that.data.page,
                })
            })
        })
    },
    
    onLoad: function (options) {
        let that = this
        console.log("onload")
        this.setData({
            isPX: app.globalData.isPX
        })
    },

    onShow: function () {
        let that = this
        console.log("onshow")
        try {
            let memberInfo = wx.getStorageSync("memberCardInfo")
            let sessionKey = wx.getStorageSync("sessionKey")
            if (sessionKey) {
                that.resPage(sessionKey)
            } else {
                app.backResPage = (sessionKey) => {
                    that.resPage(sessionKey)
                }
            }
        } catch (error) {
            console.log('not success loading', error)
        }
    }
})