// pages/couponsdetail/couponsdetail.js
const app = getApp(),code = require("../../utils/code.js"),base = require("../../utils/util.js")
Page({
    data: {
        coupon: null,
        couponStatus: ['未生效', '可使用', '已使用', '已失效', '已过期', '已删除', '已锁定'],
        couponType: ['全场代金券', '全场折扣券', '礼品兑换券', '优惠券', '团购券', '单品代金券', '会员卡', '单品折扣券', '单品特价券', '全场满减券'],
        toggle: [false, true, false, true],
        pageloading: false,
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
            openId: app.api.parmas.openId,
            merchantId: app.api.parmas.merchantId,
            memberId: memberInfo.memberId
        }
        let couponIndex = e.target.dataset.index
        app.jsData('couponGet', parmas).then((res) => {
            if (res.returnCode === 'S') {
                wx.showToast({
                    title: '领取成功',
                    icon: 'success',
                    duration: 2000
                })
                let _couponList = that.data.coupon
                _couponList.receive = false
                that.setData({
                    coupon: _couponList
                })

                //设置首页优惠券领取状态
                var pages = getCurrentPages()
                var prevPage = pages[pages.length - 2]

                let indexCouponList = prevPage.data.couponList
                indexCouponList.items[that.data.currItems].receive = false

                prevPage.setData({
                    couponList: indexCouponList,
                    resMemberCoupon:true,
                })
            }
        })
    },

    onLoad: function (options) {
        let that = this
        console.log(options)
        if (options.id){
            that.setData({
                currItems: options.id
            })
        }
        if (options.data){
            let coupon = JSON.parse(options.data)
            console.log(coupon)
            console.log("解析优惠券详情", coupon)
            setDetail(coupon)
        }else{
            let parmas = {
                openId: app.api.parmas.openId,
                couponNo: options.id || "907325499011624335"
            }
            app.jsData('couponDetail', parmas).then((res) => {
                let coupon = res.coupon.cardTemplate
                console.log("获取优惠券详情", coupon)
                coupon.couponNo = res.coupon.couponNo
                console.log(coupon)
                setDetail(coupon)
                
            }).catch((error) => {
                console.log(error)
            })
        }

        //设置详情
        function setDetail(coupon){
            let _businessService = coupon.businessService,
                businessService = _businessService.split(',')
            if (coupon.dateType == 1){
                that.setData({
                    endTime: base.formatTime(new Date(coupon.endTime)),
                    beginTime: base.formatTime(new Date(coupon.beginTime)),
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
                couponNo:coupon.couponNo||'',
                service: businessService,
                qrSize: size.w,
                pageloading: true
            })

            if (coupon.receiveCardNo || coupon.couponNo ){
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
        }
    },
    onHide:function(){
    },
    onUnload: function () {
        
    },
    onPullDownRefresh: function () {

    },
    onReachBottom: function () {

    },
    onShareAppMessage: function () {

    }
})