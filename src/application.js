JBNLayout.Application = function(node, options) {
	var self = this,
		i, len, shortcut,
	
	mousedown = function(e) {
		self.withSelected('deselect');
	};
	
	this.grid = 20;
	
	if (node) {
		this.node = node;
		this.view = new JBNLayout.View(options);
		this.node.appendChild(this.view.node);
	
		JBNLayout.Helpers.addClassName(this.node, 'layout');
		JBNLayout.Helpers.addClassName(this.view.node, 'superview');
	}
	
	if (JBNLayout.Shortcut) {
		this.shortcuts = new JBNLayout.Shortcuts();
		
		this.shortcuts.add('delete', function(e) {
			self.withSelected('remove');
		});
	}
	
	this.withSelected = function(action) {
		if (self.selected) {
			self.selected[action]();
		}
	}
	
	this.withEach = function(action) {
		var i, len,
		
		collect = function(view) {
			if (!view) {
				return;
			}
			
			for (i=0, len=view.views.length; i<len; i++) {
				action(view.views[i]);
				collect(view.views[i]);
			}
		};
		
		action(self.view);
		collect(self.view);
	}
	
	document.addEventListener('mousedown', mousedown, false);
	
	window.layout = this;
}

JBNLayout.Application.prototype = {
	get grid() {
		return this._grid;
	},
	set grid(value) {
		if (this.view) {
			this.withEach(function(view) {
				view.update();
			});
		}
		
		this._grid = value;
	}
}
