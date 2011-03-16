/**
 *  @constructor
 *  @param {JBNLayout.Application} layout Layout which this view belongs to.
 *  @param {Object} options View options.
 *  Every option becomes a public property after intializing.
 *  Possible options:
 *  - x {Number}
 *  - y {Number}
 *  - width {Number}
 *  - height {Number}
 *  - editable {Boolean} Edit HTML code of view.
 *  - draggable {Boolean} Move view by dragging it.
 *  - resizable {Boolean} Change view size by gragging its BR corner.
 *  - resizeProportionally {Boolean} Keep view proportions while resizing.
 *  - droppable {Boolean} Drop files onto view.
 *  - snapSize {Boolean} Snap view size to grid.
 *  - snapPosition {Boolean} Snap view position to gird.
 *  
 *  @property {HTMLElement} node Container node.
 *  @property {JBNLayout.View} superview A view where current view is placed.
 *  @property {Array} views Child views.
 *  @property {Number} depth Heighest subview zIndex.
 *  @property {Boolean} dragging
 *  @property {Boolean} resizing
**/

JBNLayout.View = function(layout, options) {
    var self = this,
        dragStart, resStart,
        resizeHint, content, textarea,
        lock = false,

    stopPropagation = function(e) {
        if (self.width - e.layerX < 16 && self.height - e.layerY < 16) {
            return;
        }

        e.stopPropagation();
        return;
    },

    dblclick = function(e) {
        var cursor = textarea.value.length;

        content.style.display = 'none';

        textarea.style.display = 'block';
        textarea.value = content.innerHTML;
        textarea.focus();

        textarea.setSelectionRange(cursor, cursor);
        textarea.addEventListener('mousedown', stopPropagation);
        textarea.addEventListener('keydown', stopPropagation);

        e.stopPropagation();
        e.preventDefault();
    },

    blur = function(e) {
        content.style.display = 'block';
        content.innerHTML = textarea.value;

        textarea.style.display = 'none';
        textarea.removeEventListener('mousedown', stopPropagation);
        textarea.removeEventListener('keydown', stopPropagation);
    },

    mousedown = function(e) {
        var selfX, selfY,

        targetIsDescendant = function() {
            var nodes = self.node.getElementsByTagName(e.target.nodeName);
            nodes = Array.prototype.slice.call(nodes);
            return nodes.indexOf(e.target) > -1;
        };

        if (self.superview && self.superview.isLocked()) {
            return;
        }

        if (e.target !== self.node) {
            if (!targetIsDescendant()) {
                return;
            }
        }

        self.select();

        selfX = self.width - e.layerX;
        selfY = self.height - e.layerY;

        if (options.resizable && selfX < 16 && selfY < 16) {
            self.resizing = true;

            resStart = {
                x: e.pageX,
                y: e.pageY,
                width: self.width,
                height: self.height
            };

            resizeHint.style.display = 'block';
        }

        if (!self.resizing && options.draggable) {
            self.dragging = true;

            dragStart = {
                x: e.pageX - self.x,
                y: e.pageY - self.y
            };
        }

        e.stopPropagation();
        e.preventDefault();
    },

    mousemove = function(e) {
        if (!(self.dragging || self.resizing)) {
            return;
        }

        if (self.resizing) {
            self.width = resStart.width + e.pageX - resStart.x;

            if (self.resizeProportionally) {
                self.height = self.width * resStart.height / resStart.width;
            } else {
                self.height = resStart.height + e.pageY - resStart.y;
            }
        }

        if (self.dragging) {
            self.x = e.pageX - dragStart.x;
            self.y = e.pageY - dragStart.y;
        }

        self.update();
    },

    mouseup = function(e) {
        var preventLocked = e.type === 'keydown' &&
            ((self.superview && self.superview.isLocked()) || self.isLocked());

        if (!(self.dragging || self.resizing) || preventLocked) {
            return;
        }

        if (self.resizable) {
            resizeHint.style.display = 'none';
        }

        self.dragging = self.resizing = false;
    },

    dragover = function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        return false;
    },

    drop = function(e) {
        e.preventDefault();

        if (layout.onDrop) {
            layout.onDrop(e, self, layout);
        }

        return false;
    },

    snap = function() {
        var snap = function(v) {
            var grid = layout.getGrid() || 20;
            return Math.floor(v / grid) * grid;
        };

        if (self.snapPosition) {
            self.x = snap(self.x);
            self.y = snap(self.y);
        }

        if (self.snapSize) {
            self.width = snap(self.width);
            self.height = snap(self.height);
        }
    };

    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.width = 0;
    this.height = 0;
    this.editable = false;
    this.draggable = false;
    this.resizable = false;
    this.resizeProportionally = false;
    this.droppable = false;
    this.snapSize = false;
    this.snapPosition = false;
    
    JBNLayout.Helpers.inject(this, options);

    this.node = document.createElement('div');
    this.node.className = 'view';

    this.superview = null;
    this.views = [];
    this.depth = 0;

    this.dragging = false;
    this.resizing = false;

    if (this.editable) {
        content = document.createElement('div');
        content.className = 'content';
        content.addEventListener('dblclick', dblclick, false);

        textarea = document.createElement('textarea');
        textarea.style.display = 'none';
        textarea.addEventListener('blur', blur, false);

        this.node.appendChild(content);
        this.node.appendChild(textarea);
    }

    if (this.draggable || this.resizable) {
        if (this.resizable) {
            resizeHint = document.createElement('div');
            resizeHint.className = 'resize-hint';
            resizeHint.style.display = 'none';

            this.node.setAttribute('data-resizable', true);
            this.node.appendChild(resizeHint);
        }

        this.node.addEventListener('mousedown', mousedown, false);
        document.addEventListener('mousemove', mousemove, false);
        document.addEventListener('mouseup', mouseup, false);
        document.addEventListener('keydown', mouseup, false);
    }

    if (this.droppable) {
        this.node.addEventListener('dragover', dragover, false);
        this.node.addEventListener('drop', drop, false);
    }

    /**
     *  Prevents propagation of mouse events to subviews.
     *  @return {JBNLayout.View}
    **/
    this.lock = function() {
        lock = true;
        return self;
    };

    /**
     *  @return {JBNLayout.View}
    **/
    this.unlock = function() {
        lock = false;
        return self;
    };

    /**
     *  @return {Boolean}
    **/
    this.isLocked = function() {
        return lock;
    };

    /**
     *  Adds new JBNLayout.View to view.
     *  @param {JBNLayout.Application} layout Layout which this view belongs to.
     *  @param {Object} options
     *  @see JBNLayout.View
    **/
    this.add = function(layout, options) {
        var view;

        options.z = self.depth++;

        view = new JBNLayout.View(layout, options);
        view.superview = self;

        self.views.push(view);
        self.node.appendChild(view.node);

        return view;
    };

    /**
     *  Selects view.
     *  @return {JBNLayout.View}
    **/
    this.select = function() {
        layout.withSelected('deselect');
        layout.selected = self;

        if (self.superview) {
            self.z = self.superview.depth++;
        }

        self.node.setAttribute('data-selected', true);
        self.update();
        
        return self;
    };

    /**
     *  Deselects view.
     *  @return {JBNLayout.View}
    **/
    this.deselect = function() {
        if (self.editable) {
            blur();
        }

        layout.selected = null;
        self.node.removeAttribute('data-selected');
        
        return self;
    };

    /**
     *  Removes current view from its superview.
     *  @return {Boolean}
    **/
    this.remove = function() {
        var superviewIndex;

        self.deselect();

        if (self.superview) {
            superviewIndex = self.superview.views.indexOf(self);
            self.superview.views.splice(superviewIndex, 1);
            self.superview.node.removeChild(self.node);
            return true;
        }

        return false;
    };

    /**
     *  Updates view node dimensions after changes.
     *  @return {JBNLayout.View}
    **/
    this.update = function() {
        snap();

        self.node.style.left = self.x + 'px';
        self.node.style.top = self.y + 'px';
        self.node.style.zIndex = self.z;
        self.node.style.width = self.width + 'px';
        self.node.style.height = self.height + 'px';

        if (self.resizable) {
            resizeHint.innerHTML = self.width + '&times;' + self.height;
        }
        
        return self;
    };
    
    this.setContent = function(value) {
        content.innerHTML = value;
        textarea.value = value;
        return self;
    }

    /**
     *  Outputs view as HTML string.
     *  @return {String}
    **/
    this.toHTML = function() {
        var html = [], tmp = [], i, len;

        tmp.push('<div class="view" style="');
        tmp.push('left: ' + self.x + 'px;');
        tmp.push('top: ' + self.y + 'px;');
        tmp.push('z-index: ' + self.z + ';');
        tmp.push('width: ' + self.width + 'px;');
        tmp.push('height: ' + self.height + 'px">');

        html.push(tmp.join(''));

        if (self.views.length > 0) {
            for (i = 0, len = self.views.length; i < len; i++) {
                html.push(self.views[i].toHTML());
            }
        } else if (content) {
            html.push(content.innerHTML);
        }

        html.push('</div>');

        return html.join('\n').replace(/\t/g, '');
    };

    /**
     *  Outputs view as JSON object.
     *  @return {Object}
    **/
    this.toJSON = function() {
        var json = {}, i, len, subviews = [];

        for (i = 0, len = self.views.length; i < len; i++) {
            subviews.push(self.views[i].toJSON());
        }
        
        for (property in self) {
            if (self.hasOwnProperty(property) &&
                typeof self[property] !== 'function') {
                json[property] = self[property];
            }
        }
        
        if (content) {
            json.content = content.innerHTML;
        }
        
        json.views = subviews;
        delete json.superview;
        delete json.node;

        return json;
    };

    this.update();
};
