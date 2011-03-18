JBN.Layout.Helpers = {
    inject: function(target, source) {
        for (property in source) {
            if (target.hasOwnProperty(property)) {
                target[property] = source[property];
            }
        }
        
        return target;
    },
    addClassName: function(element, className) {
        var classNames = element.className.split(' ');

        if (classNames.indexOf(className) < 0) {
            classNames.push(className);
            element.className = classNames.join(' ');
        }

        return element;
    },
    clone: function(obj) {
        var clone = {};
        
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (typeof(obj[i])=="object") {
                    clone[i] = JBN.Layout.Helpers.clone(obj[i]);
                } else {
                    clone[i] = obj[i];
                }
            }
        }
        
        return clone;
    }
};
