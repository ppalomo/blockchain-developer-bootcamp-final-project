export function parseDate(str) {
    var mdy = str.split('/');
    return new Date(mdy[2], mdy[0]-1, mdy[1]);
}

export function datediff(firstDate, secondDate) {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
    return diffDays;
}

export function getNextDay1(){    
    var now = new Date();
    let month = now.getMonth() + 1;
    let year = now.getFullYear()
    if (month === 12) {
        month = 1;
        year += 1;
    } else {
        month +=1;
    }
    return month + "/1/" + year;
}