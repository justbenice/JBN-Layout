JBNLayout.Shortcuts = function() {
    var self = this, i, len,

    modifiers = {
        meta: false,
        control: false,
        shift: false,
        alt: false
    },

    convert = function(key) {
        if (key.length === 1) {
            return toHex(key);
        } else {
            if (key === 'delete') {
                key = '007F';
            } else if (key === 'left') {
                key = 'Left';
            } else if (key === 'right') {
                key = 'Right';
            } else if (key === 'up') {
                key = 'Up';
            } else if (key === 'down') {
                key = 'Down';
            } else if (key === 'space') {
                key = '0020';
            }

            return key;
        }
    },

    toHex = function(character) {
        character = character.charCodeAt(0).toString(16).toUpperCase();

        while (character.length < 4) {
            character = '0' + character;
        }

        return character;
    },

    getModifier = function(e) {
        modifiers.meta = e.metaKey;
        modifiers.control = e.ctrlKey;
        modifiers.shift = e.shiftKey;
        modifiers.alt = e.altKey;
    },

    key = function(e) {
        var shortcut, sameType, sameKey, sameModifier;

        for (i = 0, len = self.shortcuts.length; i < len; i++) {
            shortcut = self.shortcuts[i];
            sameType = shortcut.type === e.type;
            sameKey = shortcut.key === e.keyIdentifier.replace('U+', '');
            sameModifier = shortcut.modifier && modifiers[shortcut.modifier];

            if (sameType && sameKey) {
                if (!shortcut.modifier || sameModifier) {
                    shortcut.action(e);
                    e.stopPropagation();
                    e.preventDefault();
                    return true;
                }
            }
        }

        return false;
    };

    this.shortcuts = [];

    this.add = function(type, combination, action) {
        var shortcut = {};

        combination = combination.split('+');

        if (combination.length === 2) {
            shortcut.modifier = combination[0];
            shortcut.key = convert(combination[1].toUpperCase());
        } else {
            shortcut.key = convert(combination[0]);
        }

        shortcut.type = type;
        shortcut.action = action;
        self.shortcuts.push(shortcut);

        return shortcut;
    };

    this.remove = function(shortcut) {
        self.shortcuts.splice(self.shortcuts.indexOf(shortcut), 1);
    };

    document.addEventListener('keydown', key, false);
    document.addEventListener('keyup', key, false);
};
