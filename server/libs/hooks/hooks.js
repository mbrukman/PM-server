/*
 * simple hook mechanism. can write pre and post hooks that will be executed when calling hookPre and hookPost functions.
 * */

const prehooks = {};
const posthooks = {};

TIMEOUT = 20000;

function runHooks(fns, context, resolve) {
  let timeout = setTimeout(() => {
    throw new Error("timeout error");
  }, TIMEOUT);
  const next = function(error) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      throw new Error("timeout");
    }, TIMEOUT);
    if (error) {
      throw new Error(error);
    }
    if (fns.length > 1) {
      runHooks(fns.slice(1), context, resolve);
    } else {
      resolve();
    }
  };
  callNextHook(fns[0], context, next);
}

function callNextHook(fn, context, next) {
  fn.call(context, next);
}

const Hook = {
  pre: function(name, fn) {
    if (!prehooks[name]) {
      prehooks[name] = [];
    }
    prehooks[name].push(fn);
  },
  post: function(name, fn) {
    if (!posthooks[name]) {
      posthooks[name] = [];
    }
    posthooks[name].push(fn);
  },
  hookPre: function(name, context) {
    return new Promise(function(resolve, reject) {
      if (!prehooks[name]) {
        return resolve();
      }
      const fn = [...prehooks[name]];
      if (!fn) {
        return resolve();
      }
      runHooks(fn, { obj: context }, resolve);
    });
  },
  hookPost: function(name) {
    return new Promise(function(resolve, reject) {
      const fn = [...posthooks[name]];
      if (!fn) {
        return resolve();
      }
      runHooks(fn, { obj: context }, resolve);
    });
  }
};

module.exports = Hook;
