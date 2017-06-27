(function(window, undefined) {

    'use strict';


    /**
     * Return a string representing a "type".
     *
     * @param value {*}
     * @returns {string}
     */
    const isType = function(value) {

        let type = {}.toString.call(value).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();

        if (/^html/i.test(type)) {

            type = 'html';
        }

        return type;
    };


    /**
     * Clone an object, array, or DOM element.
     *
     * @param value
     * @returns {*}
     */
    const clone = function(value) {

        let cloned = value;

        switch (isType(value))
        {
            case 'array':
                try {
                    cloned = Array.from(cloned);
                } catch(e) {
                    try {
                        cloned = cloned.slice(0);
                    } catch(e) {}
                }
                break;

            case 'object':
                cloned = Object.assign({},cloned);
                break;

            case 'html':
                cloned = document.importNode(cloned, true);
                //cloned = cloned.cloneNode(true);
                break;
        }

        return cloned;
    };


    /**
     * Return a proxy/intermediary from an object, array, or DOM element that can be manipulated just like the
     * original, but that now has a "subscription" method with an optional "observation" callback.
     *
     * @param obj {Object|Array|HTML} The object, array, or DOM element you want to append a "subscription" towards.
     * @param cloneObj {Boolean} Clone the original "obj" instead of altering the original.
     * @returns {Object}
     */
    window.kobserve = function (obj, cloneObj) {

        let callback;
        let observer;
        let intStorage = obj;
        let type = isType(obj);


        if (cloneObj === true) {

            intStorage = clone(obj);
        }


        Object.defineProperty(Object.getPrototypeOf(intStorage), 'subscribe', {
            writable: false,
            enumerable: false,
            configurable: false,
            value: function subscribe(param) {

                callback = param;

                return this;
            }
        });


        if(type === 'html') {

            observer = new MutationObserver(function(mutations) {

                mutations.forEach(function(mutation) {

                    let type            = (mutation.type||'').toLowerCase(),
                        target          = mutation.target,
                        oldAttribute    = mutation.oldValue,
                        attribute       = target.getAttribute(mutation.attributeName),
                        addedNodes      = Array.from(mutation.addedNodes),
                        removedNodes    = Array.from(mutation.removedNodes);

                    callback.call(obj, {
                        call:'mutation',
                        mutation:mutation,
                        type:type,
                        target:target,

                        attributeName:mutation.attributeName,
                        oldAttribute:oldAttribute,
                        attribute:attribute,

                        removedNodes:removedNodes,
                        addedNodes:addedNodes,

                        innerHTML:target.innerHTML,
                        outerHTML:target.outerHTML,
                        innerText:target.innerText
                    });
                });
            });

            observer.observe(intStorage, {
                attributes: true,
                attributeOldValue: true,
                childList: true,
                characterData: false,
                characterDataOldValue: false,
                subtree: true
            });

        } else {

            observer = new Proxy(intStorage, {

                set: function (oTarget, sKey, vValue) {

                    let oldValue = clone(oTarget[sKey]);

                    oTarget[sKey] = vValue;

                    if (callback) {

                        callback.call(null, clone({
                            call    : 'set',
                            obj     : oTarget,
                            key     : sKey,
                            oldValue: oldValue,
                            value   : vValue
                        }));
                    }

                    return true;
                },

                get: function (oTarget, sKey, receiver) {

                    if (callback) {

                        if (sKey !== 'length') {

                            callback.call(null, clone({
                                call    : 'get',
                                obj     : oTarget,
                                key     : sKey,
                                oldValue: null,
                                value   : oTarget[sKey]
                            }));
                        }
                    }

                    return oTarget[sKey];
                },

                deleteProperty: function (oTarget, sKey, oDesc) {

                    if (callback) {

                        callback.call(null, clone({
                            call    : 'delete',
                            obj     : oTarget,
                            key     : sKey,
                            oldValue: oTarget[sKey],
                            value   : undefined
                        }));
                    }

                    return true;
                }
            });
        }

        return observer;
    }

})(this);