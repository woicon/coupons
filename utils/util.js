function formatTime(time) {

    var time = time.replace(/-/g, ':').replace(' ', ':'),
        time = time.split(':'),
        date = new Date(time[0], (time[1] - 1), time[2], time[3], time[4], time[5]),
        year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate(),
        hour = date.getHours(),
        minute = date.getMinutes(),
        second = date.getSeconds()
    //return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
    return [year, month, day].map(formatNumber).join('-')
}
function formatNumber(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
}
module.exports = {
    formatTime: formatTime
}
