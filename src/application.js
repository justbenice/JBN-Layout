/**
 *  @constructor
 *  @param {HTMLElement} node Container node.
 *  @param {Object} options Superview options.
 *  @see JBN.Layout.View
 *  @property {HTMLElement} node Container node.
 *  @property {JBN.Layout.View} view Layout root superview.
**/
JBN.Layout.Application = function(node, options) {
    var self = this,
        i, len,

    /**
     *  Initializes application superview.
     *  @param {Object} options Superview options.
     *  @return {JBN.Layout.View} Superview.
    **/
    superview = function(options) {
        self.view = new JBN.Layout.View(self, options);
        self.node.appendChild(self.view.node);

        JBN.Layout.Helpers.addClassName(self.node, 'layout');
        JBN.Layout.Helpers.addClassName(self.view.node, 'superview');

        self.toHTML = self.view.toHTML;
        self.toJSON = self.view.toJSON;

        return self.view;
    },

    mousedown = function(e) {
        self.withSelected('deselect');
    };

    /**
     *  Executes specified method of currently selected JBN.Layout.View.
     *  @param {String} methodName
     *  @return {JBN.Layout.View} Selected view.
    **/
    this.withSelected = function(methodName) {
        if (self.selected) {
            self.selected[methodName]();
        }

        return self.selected;
    };

    /**
     *  Executes specified function with every registred JBN.Layout.View.
     *  @param {Function} action
     *  @return {JBN.Layout.Application}
    **/
    this.withEach = function(action) {
        collect = function(view) {
            if (!view) {
                return;
            }

            for (var i = 0, len = view.views.length; i < len; i++) {
                action(view.views[i]);
                collect(view.views[i]);
            }
        };

        action(self.view);
        collect(self.view);

        return self;
    };

    /**
     *  Loads HTML string to the application.
     *  @param {String} html
     *  @return {JBN.Layout.Application}
    **/
    this.fromHTML = function(html) {
        html = html.replace(/\t|\n/gi, '')
            .replace(/\>\s+\</gi, '><')
            .replace(/\&nbsp\;/, '&#160;');
        
        var parser = new DOMParser(),
            serializer = new XMLSerializer(),
            doc = parser.parseFromString(html, 'text/xml'),
        
        serialize = function(n) {
            return serializer.serializeToString(n);
        },

        add = function(from, to) {
            var node, subview, options, hasSubviews;
            
            if (from.nodeType !== 1) {
                return;
            }
            
            node = document.createElement('div');
            node.style.cssText = from.getAttribute('style');

            options = {
                x: parseInt(node.style.left, 10),
                y: parseInt(node.style.top, 10),
                z: parseInt(node.style.zIndex, 10),
                width: parseInt(node.style.width, 10),
                height: parseInt(node.style.height, 10)
            };

            if (to) {
                subview = to.add(layout, options);
            } else {
                subview = superview(options);
            }
            
            hasSubviews = from.childNodes[0].nodeName === 'div' &&
                from.childNodes[0].getAttribute('class') &&
                from.childNodes[0].getAttribute('class') === 'view';
            
            if (hasSubviews) {
                for (var i = 0, len = from.childNodes.length; i < len; i++) {
                    add(from.childNodes[i], subview);
                }
            } else {
                subview.editable = true;
                subview.setContent(serialize(from.firstChild));
            }
        };

        if (doc.firstChild.nodeType === 1) {
            self.node.innerHTML = '';
            add(doc.firstChild);
        }

        return self;
    };

    /**
     *  Loads JSON object or string to the application.
     *  @param {Object} json
     *  @return {JBN.Layout.Application}
    **/
    this.fromJSON = function(json) {
        if (typeof json === 'string') {
            json = JSON.parse(json);
        }

        var add = function(from, to) {
            var options, subview;
            
            options = JBN.Layout.Helpers.clone(from);
            delete options.views;
            delete options.content;

            if (to) {
                subview = to.add(self, options);
            } else {
                subview = superview(options);
            }

            if (from.content) {
                subview.editable = true;
                subview.setContent(from.content);
            }

            for (var i = 0, len = from.views.length; i < len; i++) {
                add(from.views[i], subview);
            }
        };

        if (json.views) {
            self.node.innerHTML = '';
            add(json);
        }

        return self;
    };

    if (node) {
        this.node = node;
        superview(options);
    }

    /**
     *  Application sizing and positioning grid.
     *  @param {Number} value
     *  @return {Number}
    **/
    Object.defineProperty(self, 'grid', {
        set: function(value) {
            var changed = self._grid !== value;

            if (!changed) {
                return;
            }

            self._grid = value;

            if (self.view) {
                self.withEach(function(view) {
                    view.update();
                });
            }
        },
        get: function() {
            return self._grid;
        }
    });

    document.addEventListener('mousedown', mousedown, false);
};
