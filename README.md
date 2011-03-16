    var layout = new JBNLayout.Application(document.getElementsByTagName('div')[0], {
        width: 400,
        height: 300,
        draggable: true,
        resizable: true,
        droppable: true,
        snapSize: true
    });

    layout.view.node.addEventListener('dblclick', function(e) {
        layout.onDrop(e, layout.view, layout);
    });

    layout.onDrop = function(e, view, layout) {
        view.add(layout, {
            x: e.clientX - view.x,
            y: e.clientY - view.y,
            width: 100,
            height: 100,
            draggable: true,
            editable: true,
            resizable: true
        });
    }

    var shortcuts = new JBNLayout.Shortcuts();

    shortcuts.add('keydown', 'delete', function(e) {
        layout.withSelected('remove');
    });

    shortcuts.add('keydown', 'space', function(e) {
        layout.view.lock = true;
    });

    shortcuts.add('keyup', 'space', function(e) {
        layout.view.lock = false;
    });