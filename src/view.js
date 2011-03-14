JBNLayout.View = function(options) {
	var self = this,
		dragStart, resizeStart,

	stopPropagation = function(e) {
		if (self.width - e.layerX < 16 && self.height - e.layerY < 16) {
			return;
		}
		
		e.stopPropagation();
		return;
	},

	dblclick = function(e) {
		var cursor = self.textarea.value.length;
		
		self.content.style.display = 'none';
		
		self.textarea.style.display = 'block';
		self.textarea.value = self.content.innerHTML;
		self.textarea.focus();
		
		self.textarea.setSelectionRange(cursor, cursor);
		self.textarea.addEventListener('mousedown', stopPropagation);
		self.textarea.addEventListener('keydown', stopPropagation);
	},
	
	blur = function(e) {
		self.content.style.display = 'block';
		self.content.innerHTML = self.textarea.value;
		
		self.textarea.style.display = 'none';
		self.textarea.removeEventListener('mousedown', stopPropagation);
		self.textarea.removeEventListener('keydown', stopPropagation);
	},

	mousedown = function(e) {
		var selfX, selfY,
		
		targetIsDescendant = function() {
			var nodes = self.node.getElementsByTagName(e.target.nodeName);
			nodes = Array.prototype.slice.call(nodes);
			return nodes.indexOf(e.target) > -1;
		};
		
		if (self.superview && self.superview.lock) {
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
		
			resizeStart = {
				x: e.pageX,
				y: e.pageY,
				width: self.width,
				height: self.height
			};
			
			self.resizeHint.style.display = 'block';
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
			self.width = resizeStart.width + e.pageX - resizeStart.x;
			
			if (self.resizeProportionally) {
				self.height = self.width * resizeStart.height / resizeStart.width;
			} else {
				self.height = resizeStart.height + e.pageY - resizeStart.y;
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
			((self.superview && self.superview.lock) || self.lock);
		
		if (!(self.dragging || self.resizing) || preventLocked) {
			return;
		}
		
		if (self.resizable) {
			self.resizeHint.style.display = 'none';
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
		
		self.add({
			x: e.clientX,
			y: e.clientY,
			width: 100,
			height: 100,
			draggable: true,
			editable: true
		});
		
		return false;
	},

	snap = function() {
		var snap = function(v) {
			var grid = window.layout.grid || 20;
			return Math.floor(v / grid) * grid;
		}
	
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
	
	this.lock = false;
	this.superview = null;
	this.views = [];
	this.depth = 0;

	this.dragging = false;
	this.resizing = false;
	
	if (this.editable) {
		this.content = document.createElement('div');
		this.content.className = 'content';
		this.content.addEventListener('dblclick', dblclick, false);
		
		this.textarea = document.createElement('textarea');
		this.textarea.style.display = 'none';
		this.textarea.addEventListener('blur', blur, false);
		
		this.node.appendChild(this.content);
		this.node.appendChild(this.textarea);
	}

	if (this.draggable || this.resizable) {
		if (this.resizable) {
			this.resizeHint = document.createElement('div');
			this.resizeHint.className = 'resize-hint';
			this.resizeHint.style.display = 'none';
			
			this.node.setAttribute('data-resizable', true);
			this.node.appendChild(this.resizeHint);
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
	
	this.add = function(options) {
		var view;
		
		options.z = self.depth++;
		
		view = new JBNLayout.View(options);		
		view.superview = self;		
		
		self.views.push(view);
		self.node.appendChild(view.node);
		
		return view;
	}
	
	this.select = function() {
		layout.withSelected('deselect');
		layout.selected = self;
		
		if (self.superview) {
			self.z = self.superview.depth++;
		}
		
		self.node.setAttribute('data-selected', true);
		self.update();
	}
	
	this.deselect = function() {
		if (self.editable) {
			blur();
		}
		
		layout.selected = null;
		self.node.removeAttribute('data-selected');
	}
	
	this.remove = function() {
		var superviewIndex;
		
		self.deselect();
		
		if (self.superview) {
			superviewIndex = self.superview.views.indexOf(self);
			self.superview.views.splice(superviewIndex, 1);
			self.superview.node.removeChild(self.node);
		}
		
		return false;
	}

	this.update = function() {
		snap();
	
		self.node.style.left = self.x + 'px';
		self.node.style.top = self.y + 'px';
		self.node.style.zIndex = self.z;
		self.node.style.width = self.width + 'px';
		self.node.style.height = self.height + 'px';
		
		if (self.resizable) {
			self.resizeHint.innerHTML = [self.width, self.height].join('&times');
		}
	}
	
	this.toHTML = function() {
		var html = [], i, len;
		
		html.push('<div class="view" style="\
			left: ' + self.x + 'px; top: ' + self.y + 'px; z-index: ' + self.z + '; \
			width: ' + self.width + 'px; height: ' + self.height + 'px">');
		
		for (i=0, len=self.views.length; i<len; i++) {
			html.push(self.views[i].toHTML());
		}
		
		html.push('</div>');
		
		return html.join('\n').replace(/\t/g, '');
	}
	
	this.toJSON = function() {
		var json, i, len, subviews = [];
		
		for (i=0, len=self.views.length; i<len; i++) {
			subviews.push(self.views[i].toJSON());
		}
		
		json = {
			x: self.x,
			y: self.y,
			z: self.z,
			width: self.width,
			height: self.height,
			views: subviews
		};
		
		return json;
	}

	this.update();
};
