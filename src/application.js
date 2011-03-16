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
        var i, len,

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

    if (node) {
        this.node = node;
        this.view = new JBNLayout.View(this, options);
        this.node.appendChild(this.view.node);

        JBNLayout.Helpers.addClassName(this.node, 'layout');
        JBNLayout.Helpers.addClassName(this.view.node, 'superview');
    }

    document.addEventListener('mousedown', mousedown, false);
};
