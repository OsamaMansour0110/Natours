class apiFeatures {
  constructor(query, querystring) {
    this.query = query;
    this.querystring = querystring;
  }

  filter() {
    //BUILD QUERY
    let queryObj = { ...this.querystring };
    const fields = ['limit', 'page', 'sort', 'fields'];
    fields.forEach((el) => delete queryObj[el]);
    //{ duraion:{lte:'7'}, difficulty:'easy', price:{gte:'700'}}

    //1) FILTERING USING GTE LTE LT GT
    queryObj = JSON.stringify(queryObj);
    queryObj = queryObj.replace(/\b(gte|lte|gt|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryObj));
    return this;
  }

  sort() {
    //2) SORTING
    if (this.querystring.sort) {
      const SortStr = this.querystring.sort.split(',').join(' ');
      this.query = this.query.sort(SortStr);
    } else {
      this.query = this.query.sort('createdAt');
    }
    return this;
  }

  limiting() {
    //3) FIELDS LIMITING
    if (this.querystring.fields) {
      const fields = this.querystring.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    //4) PAGIGNATION
    const page = this.querystring.page;
    const limit = this.querystring.limit; // number of elements per page
    const skip = (page - 1) * limit; // elements to skip to start the page

    this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = apiFeatures;
