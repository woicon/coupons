// pages/couponsdetail/couponsdetail.js
const app = getApp(),
    code = require("../../utils/code.js"),
    base = require("../../utils/util.js")
Page({
    data: {
        coupon: null,
        couponStatus: ['未生效', '可使用', '已使用', '已失效', '已过期', '已删除', '已锁定'],
        couponType: ['全场代金券', '全场折扣券', '礼品兑换券', '优惠券', '团购券', '单品代金券', '会员卡', '单品折扣券', '单品特价券', '全场满减券'],
        toggle: [false, true, false, true],
        pageloading: false,
        error: false,
        businessService: {
            BIZ_SERVICE_DELIVER: '外卖服务',
            BIZ_SERVICE_FREE_PARK: '停车位',
            BIZ_SERVICE_WITH_PET: '可带宠物',
            BIZ_SERVICE_FREE_WIFI: '免费wifi'
        }
    },

    toggleTap: function (e) {
        var that = this
        console.log(e)
        let _toggle = this.data.toggle
        let stat = _toggle[e.currentTarget.dataset.id]
        _toggle[e.currentTarget.dataset.id] = !stat
        that.setData({
            toggle: _toggle
        });
    },

    //领取优惠券
    getCoupon: function (e) {
        var that = this
        let memberInfo = wx.getStorageSync("memberCardInfo")
        var parmas = {
            cardIds: e.target.dataset.id,
            openId: app.api.openId,
            merchantId: app.api.merchantId,
            memberId: memberInfo.memberId
        }
        let couponIndex = e.target.dataset.index
        console.log(e)

        let syncParmas = {
            cardId: e.target.dataset.cardid,
            merchantId: app.api.merchantId
        }

        let detailParmas = {
            unionId: wx.getStorageInfoSync("sessionKey").unionid
        }
        wx.showLoading()
        app.request("couponNo").then((res) => {
            const couponNo = res.data.couponNo
            console.log(couponNo)
            syncParmas.cardNo = couponNo
            detailParmas.couponNo = couponNo
            app.syncCopuonToWechat(syncParmas, resDetail)
            function resDetail() {
                setTimeout(function(){
                    that.getCouponDetail(detailParmas)
                }.bind(this),300)
            }
        })
        // app.jsData('couponGet', parmas).then((res) => {
        //     if (memberInfo.memberId) {
        //         wx.showModal({
        //             title: '领取成功',
        //             content: '微信支付即自动核销，每次支付仅限使用一张优惠券',
        //             showCancel: false
        //         })
        //         const couponNo = res.coupons[0].couponNo
        //         syncParmas.cardNo = couponNo
        //         detailParmas.couponNo = couponNo
        //         app.syncCopuonToWechat(syncParmas)
        //         that.getCouponDetail(detailParmas)
        //     }else{
        //         //不是会员的用户领取优惠券
        //         wx.showLoading({
        //             title: '加载中',
        //         })
        //         app.request("couponNo").then((res) => {
        //             const couponNo = res.data.couponNo
        //             console.log(couponNo)
        //             syncParmas.cardNo = couponNo
        //             detailParmas.couponNo = couponNo
        //             app.syncCopuonToWechat(syncParmas,function(){
        //                 wx.showModal({
        //                     title: '领取成功',
        //                     content: '微信支付即自动核销，每次支付仅限使用一张优惠券',
        //                     showCancel: false
        //                 })
        //                 that.getCouponDetail(detailParmas)
        //             })
                    
        //         })
        //     }
        // })
    },
    
    onLoad: function (options) {
        let that = this
        console.log(options)
        if (options.id) {
            that.setData({
                currItems: options.id,
            })
        }
        let parmas = {
            unionId: wx.getStorageSync("sessionKey").unionid
        }

        if (options.data) {
            const coupon = JSON.parse(options.data)
            if (!coupon.receive){
                parmas.couponNo = coupon.receiveCardNo || coupon.couponNo
                that.getCouponDetail(parmas)
            }else{
                that.setDetail(coupon)
            }
        } else {
            parmas.couponNo = options.id
            that.getCouponDetail(parmas)
        }
    },
    getCouponDetail: function (parmas) {
        let that = this
        app.jsData('couponDetail', parmas).then((res) => {
            if (res.returnCode == 'S') {
                console.log(res)
                const coupon = res.coupon.cardTemplate
                console.log(res.coupon)
                coupon.couponNo = res.coupon.couponNo
                if (!coupon.receive) {
                    that.setData({
                        endTime: base.formatTime(res.coupon.endDate),
                        beginTime: base.formatTime(res.coupon.getDate),
                    })
                }
                that.setDetail(coupon)
            }
            else {
                app.setError(res.returnMessage)
                return
            }
        }).catch((error) => {
            console.log(error)
        })
    },
    onHide:function(){
        const currPage = app.currPage()
        console.log(currPage.data)
        currPage.setData({
            detailBack:false,
            isDetail:'asdfasdf'
        })
    },
    setDetail: function (coupon) {
        let that = this,
            _businessService = coupon.businessService,
            businessService = _businessService.split(',')

        if (coupon.dateType == 1) {
            that.setData({
                endTime: base.formatTime(coupon.endTime),
                beginTime: base.formatTime(coupon.beginTime),
            })
        }

        if (coupon.forbiddenTimes != '') {
            let forbiddenTimes = coupon.forbiddenTimes
            let _forbiddenTimes = forbiddenTimes.replace(/,/g, '至')
            coupon.forbiddenTimes = _forbiddenTimes.split('^')
        }

        let size = code.size()
        that.setData({
            coupon: coupon,
            color: coupon.color,
            couponNo: coupon.couponNo || '',
            service: businessService,
            qrSize: size.w,
            pageloading: true
        })

        if (coupon.receiveCardNo || coupon.couponNo) {
            let sizes = that.data.qrSize
            let qrcode = coupon.receiveCardNo || coupon.couponNo
            //绘制二维码与条形码
            code.qr(qrcode, "qrcodecav", sizes, sizes)
            code.bar(qrcode, "barcodecav", sizes, 40)
        }

        wx.setNavigationBarColor({
            frontColor: '#ffffff',
            backgroundColor: coupon.color,
        })

        wx.setNavigationBarTitle({
            title: coupon.title,
        })
        wx.hideLoading()
    }
})