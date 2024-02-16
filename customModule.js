function dateFormat(givenDate) {
    const year = givenDate.getFullYear();
    const month = givenDate.getMonth() + 1; // Months are zero-based, so add 1
    const day = givenDate.getDate();
    return  {year,month,day}
}

module.exports={dateFormat}