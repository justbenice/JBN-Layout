JBNLayout.Helpers = {
    inject: function(target, source) {
        for (property in source) {
            if (target.hasOwnProperty(property)) {
                target[property] = source[property];
            }
        }
    },
    addClassName: function(element, className) {
        var classNames = element.className.split(' ');

        if (classNames.indexOf(className) < 0) {
            classNames.push(className);
            element.className = classNames.join(' ');
        }

        return element;
    }
};
