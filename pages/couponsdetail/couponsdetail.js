// pages/couponsdetail/couponsdetail.js
const app = getApp()
const code = require("../../utils/code.js")
const base = require("../../utils/util.js")
Page({
    data: {
        coupon: null,
        couponStatus: ['未生效', '可使用', '已使用', '已失效', '已过期', '已删除', '已锁定'],
        couponType: ['代金券', '折扣券', '兑换券', '优惠券', '团购券', '单品代金券', '会员卡', '单品折扣'],
        toggle: [false, false, false],
        pageloading: false,
        businessService: {
            BIZ_SERVICE_DELIVER: '外卖服务',
            BIZ_SERVICE_FREE_PARK: '停车位',
            BIZ_SERVICE_WITH_PET: '可带宠物',
            BIZ_SERVICE_FREE_WIFI: '免费wifi'
        }
    },
    toggleTap: function (e) {
        var that = this;
        var _toggle = this.data.toggle;
        var stat = _toggle[e.currentTarget.dataset.id];
        _toggle[e.currentTarget.dataset.id] = !stat;
        that.setData({
            toggle: _toggle
        });
    },

    onLoad: function (options) {
        var that = this
        var parmas = {
            openId: app.api.parmas.openId,
            couponNo: options.id || "907325499011624335"
        }
        wx.request({
            url: app.api.host + 'couponDetail.htm',
            data: {
                json: parmas,
            },
            success: (res) => {
                console.log(res)
                let _businessService = res.data.coupon.cardTemplate.businessService;
                let businessService = _businessService.split(',')
                let size = code.size()
                let endDate = new Date(res.data.coupon.endDate)
                that.setData({
                    coupon: res.data.coupon.cardTemplate,
                    color: res.data.coupon.cardTemplate.color,
                    couponNo: res.data.coupon.couponNo,
                    service: businessService,
                    qrSize: size.w,
                    endDate: base.formatTime(endDate),
                    pageloading: true
                })
                let sizes = that.data.qrSize
                let qrcode = "907325499011624335" //res.data.coupon.couponNo || ;
                //绘制二维码与条形码
                code.qr(qrcode, "qrcodecav", sizes, sizes)
                code.bar(qrcode, "barcodecav", sizes, 40)
                wx.setNavigationBarColor({
                    frontColor: '#ffffff',
                    backgroundColor: res.data.coupon.cardTemplate.color,
                });
                wx.setNavigationBarTitle({
                    title: res.data.coupon.cardTemplate.title,
                })
            }
        });
    },
    onReady: function () {
    },
    onShow: function () {
    },
    onHide: function () {

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