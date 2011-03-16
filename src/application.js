/**
 *  @constructor
 *  @param {HTMLElement} node Container node.
 *  @param {Object} options Superview options.
 *  @see JBNLayout.View
 *  @property {HTMLElement} node Container node.
 *  @property {JBNLayout.View} view Layout root superview.
**/
JBNLayout.Application = function(node, options) {
    var self = this,
        i, len, grid = 10,
        
    superview = function(options) {
        self.view = new JBNLayout.View(self, options);
        self.node.appendChild(self.view.node);

        JBNLayout.Helpers.addClassName(self.node, 'layout');
        JBNLayout.Helpers.addClassName(self.view.node, 'superview');
        
        self.toHTML = self.view.toHTML;
        self.toJSON = self.view.toJSON;
        
        return self.view;
    },

    mousedown = function(e) {
        self.withSelected('deselect');
    };

    /**
     *  @return {Number} Snapping grid size.
    **/
    this.getGrid = function() {
        return grid;
    };

    /**
     *  Sets new grid size.
     *  @param {Number} value Grid size.
     *  @return {Number} Grid size (default is 10).
    **/
    this.setGrid = function(value) {
        grid = value;

        if (self.view) {
            self.withEach(function(view) {
                view.update();
            });
        }

        return self.getGrid();
    };

    /**
     *  Executes specified method of currently selected JBNLayout.View
     *  @param {String} methodName
     *  @return {JBNLayout.View} Selected view.
    **/
    this.withSelected = function(methodName) {
        if (self.selected) {
            self.selected[methodName]();
        }

        return self.selected;
    };

    /**
     *  Executes specified function with every registred JBNLayout.View
     *  @param {Function} action
     *  @return {JBNLayout.Application}
    **/
    this.withEach = function(action) {
        collect = function(view) {
            if (!view) {
                return;
            }

            for (i = 0, len = view.views.length; i < len; i++) {
                action(view.views[i]);
                collect(view.views[i]);
            }
        };

        action(self.view);
        collect(self.view);

        return self;
    };
    
    this.fromJSON = function(json) {
        if (typeof json === 'string') {
            json = JSON.parse(json);
        }
        
        var options, subview,
        
        add = function(from, to) {
            options = JBNLayout.Helpers.clone(from);
            delete options.views;
            delete options.content;
            
            if (to) {
                subview = to.add(layout, options);
            } else {
                subview = superview(options);
            }
            
            if (from.content) {
                subview.setContent(from.content);
            }
            
            for (i = 0, len = from.views.length; i < len; i++) {                
                add(from.views[i], subview);
            }
        };
        
        if (json.views) {
            self.withEach(function(view) {
                view.remove();
            });
            
            self.view.node.parentNode.removeChild(self.view.node);
            
            add(json);
        }
    };

    if (node) {
        this.node = node;
        superview(options);
    }

    document.addEventListener('mousedown', mousedown, false);
};
