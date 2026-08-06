function makeThenable(executor) {
  const chain = {
    _opts: {},
    select(field) {
      if (field === "+password" || field === "+otp") {
        this._opts.includeHidden = true;
      }
      return this;
    },
    populate(field, fields) {
      this._opts.populate = this._opts.populate || [];
      this._opts.populate.push({ field, fields });
      return this;
    },
    then(onFulfilled, onRejected) {
      return executor(this._opts).then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return executor(this._opts).catch(onRejected);
    },
  };
  return chain;
}

module.exports = { makeThenable };
