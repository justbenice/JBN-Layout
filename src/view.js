JBN.Layout.View = function(layout, options) {
    var self = this,
        dragStart, resStart,
        content, textarea,

    dragEventListeners = function(action) {
        action = action === 'add' ? 'addEventListener' : 'removeEventListener';
        self.node[action]('mousedown', mousedown, false);
        document[action]('mousemove', mousemove, false);
        document[action]('mouseup', mouseup, false);
        document[action]('keydown', mouseup, false);
    },

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
        textarea.addEventListener('mousedown', stopPropagation, false);
        textarea.addEventListener('keydown', stopPropagation, false);

        e.stopPropagation();
        e.preventDefault();
    },

    blur = function(e) {
        content.style.display = 'block';
        content.innerHTML = textarea.value;

        textarea.style.display = 'none';
        textarea.removeEventListener('mousedown', stopPropagation, false);
        textarea.removeEventListener('keydown', stopPropagation, false);
        
        self.content = textarea.value;
        self.change();
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

        if (self.resizable && selfX < 16 && selfY < 16) {
            self.resizing = true;

            resStart = {
                x: e.pageX,
                y: e.pageY,
                width: self.width,
                height: self.height
            };
        }

        if (!self.resizing && self.draggable) {
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
    };
    
    this.node = document.createElement('div');
    this.node.className = 'view';
    
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.width = 0;
    this.height = 0;
    
    this.resizeProportionally = false;
    this.droppable = false;
    this.snapSize = false;
    this.snapPosition = false;

    this.layout = layout;
    this.superview = null;
    this.views = [];
    this.depth = 0;
    this.lock = false;

    this.dragging = false;
    this.resizing = false;
    
    Object.defineProperty(self, 'content', {
        set: function(value) {
            var changed = self._content !== value;

            if (!changed) {
                return;
            }

            self._content = value;
            
            content.innerHTML = value;
            textarea.value = value;
        },
        get: function() {
            return self._content;
        }
    });
    
    Object.defineProperty(self, 'editable', {
        set: function(value) {
            var changed = self._editable !== value,
                html;

            if (!changed) {
                return;
            }

            self._editable = value;

            if (self.editable) {
                html = self.node.innerHTML;
                self.node.innerHTML = '';

                content = document.createElement('div');
                content.className = 'content';
                content.addEventListener('dblclick', dblclick, false);
                self.node.appendChild(content);

                textarea = document.createElement('textarea');
                textarea.style.display = 'none';
                textarea.addEventListener('blur', blur, false);
                self.node.appendChild(textarea);

                self.content = html;
            } else {
                html = content.innerHTML;

                content.removeEventListener('dblclick', dblclick, false);
                self.node.removeChild(content);

                textarea.removeEventListener('blur', blur, false);
                self.node.removeChild(textarea);

                self.node.innerHTML = html;
            }
        },
        get: function() {
            return self._editable;
        }
    });

    Object.defineProperty(this, 'draggable', {
        set: function(value) {
            var changed = self._draggable !== value;

            if (!changed) {
                return;
            }

            self._draggable = value;

            if (self.draggable && !self.resizable) {
                dragEventListeners('add');
            }

            if (!self.draggable && !self.resizable) {
                dragEventListeners('remove');
            }
        },
        get: function() {
            return self._draggable;
        }
    });

    Object.defineProperty(this, 'resizable', {
        set: function(value) {
            var changed = self._resizable !== value;

            if (!changed) {
                return;
            }

            self._resizable = value;

            if (self.resizable) {
                self.node.setAttribute('data-resizable', true);
            } else {
                self.node.removeAttribute('data-resizable');
            }

            if (self.resizable && !self.draggable) {
                dragEventListeners('add');
            }

            if (!self.resizable && !self.draggable) {
                dragEventListeners('remove');
            }
        },
        get: function() {
            return self._resizable;
        }
    });

    Object.defineProperty(this, 'droppable', {
        set: function(value) {
            var changed = self._droppable !== value;

            if (!changed) {
                return;
            }

            self._droppable = value;

            if (self.droppable) {
                self.node.addEventListener('dragover', dragover, false);
                self.node.addEventListener('drop', drop, false);
            } else {
                self.node.removeEventListener('dragover', dragover, false);
                self.node.removeEventListener('drop', drop, false);
            }
        },
        get: function() {
            return self._droppable;
        }
    });
    
    JBN.Layout.Helpers.inject(this, options);
    
    this.update();
}

JBN.Layout.View.prototype = {
    /**
     *  Prevents propagation of mouse events to subviews.
     *  @return {JBN.Layout.View}
    **/
    lock: function() {
        this.lock = true;
        return this;
    },

    /**
     *  @return {JBN.Layout.View}
    **/
    unlock: function() {
        this.lock = false;
        return this;
    },

    /**
     *  @return {Boolean}
    **/
    isLocked: function() {
        return this.lock;
    },

    /**
     *  Adds new JBN.Layout.View to view.
     *  @param {JBN.Layout.Application} layout Layout which this view belongs to.
     *  @param {Object} options
     *  @see JBN.Layout.View
    **/
    add: function(layout, options) {
        var view;

        options.z = this.depth++;

        view = new JBN.Layout.View(layout, options);
        view.superview = this;

        this.views.push(view);
        this.node.appendChild(view.node);
        
        this.change();

        return view;
    },

    /**
     *  Selects view.
     *  @return {JBN.Layout.View}
    **/
    select: function() {
        this.layout.withSelected('deselect');
        this.layout.selected = this;

        if (this.superview) {
            this.z = this.superview.depth++;
        }
        
        this.node.setAttribute('data-selected', true);
        this.update();

        return this;
    },

    /**
     *  Deselects view.
     *  @return {JBN.Layout.View}
    **/
    deselect: function() {
        if (this.editable) {
            blur();
        }

        this.layout.selected = null;
        this.node.removeAttribute('data-selected');

        return this;
    },

    /**
     *  Removes current view from its superview.
     *  @return {Boolean}
    **/
    remove: function() {
        var superviewIndex;

        this.deselect();

        if (this.superview) {
            superviewIndex = this.superview.views.indexOf(this);
            this.superview.views.splice(superviewIndex, 1);
            this.superview.node.removeChild(this.node);
            return true;
        }
        
        this.change();

        return false;
    },

    /**
     *  Updates view node dimensions after changes.
     *  @return {JBN.Layout.View}
    **/
    update: function() {
        this.snap();

        this.node.style.left = this.x + 'px';
        this.node.style.top = this.y + 'px';
        this.node.style.zIndex = this.z;
        this.node.style.width = this.width + 'px';
        this.node.style.height = this.height + 'px';
        
        this.change();

        return this;
    },
    
    change: function() {
        if (this.layout.onChange) {
            this.layout.onChange(self, this.layout);
        }
    },
    
    snap: function() {
        var self = this;
        
        var snap = function(v) {
            var grid = self.layout.grid || 10;
            return Math.floor(v / grid) * grid;
        };

        if (this.snapPosition) {
            this.x = snap(this.x);
            this.y = snap(this.y);
        }

        if (this.snapSize) {
            this.width = snap(this.width);
            this.height = snap(this.height);
        }
    },

    /**
     *  Outputs view as HTML string.
     *  @return {String}
    **/
    toHTML: function() {
        var html = [], tmp = [], i, len;

        tmp.push('<div class="view" style="');
        tmp.push('left: ' + this.x + 'px;');
        tmp.push('top: ' + this.y + 'px;');
        tmp.push('z-index: ' + this.z + ';');
        tmp.push('width: ' + this.width + 'px;');
        tmp.push('height: ' + this.height + 'px">');

        html.push(tmp.join(''));

        if (this.views.length > 0) {
            for (var i = 0, len = this.views.length; i < len; i++) {
                html.push(this.views[i].toHTML());
            }
        } else if (content) {
            html.push(content.innerHTML);
        }

        html.push('</div>');

        return html.join('\n').replace(/\t/g, '');
    },

    /**
     *  Outputs view as JSON object.
     *  @return {Object}
    **/
    toJSON: function() {
        var json = {}, i, len, subviews = [];

        for (var i = 0, len = this.views.length; i < len; i++) {
            subviews.push(this.views[i].toJSON());
        }

        for (property in this) {
            if (this.hasOwnProperty(property) &&
                typeof this[property] !== 'function') {
                property = property.replace('_', '');
                json[property] = this[property];
            }
        }

        if (content) {
            json.content = content.innerHTML;
        }

        json.views = subviews;
        delete json.superview;
        delete json.node;

        return json;
    }
}
