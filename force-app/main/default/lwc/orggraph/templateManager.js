import STYLE from './style.js';

const templateManager = (go, $, self) => {
    const template = $(
        go.Node,
        'Spot',
        {
            mouseDragEnter: (e, node) => {
                var selection = node.diagram.selection;

                if (!self.canDropNodes(selection, node)) {
                    return;
                }
                node.isHighlighted = true;
                self.lightenNodes(selection);
            },
            mouseDragLeave: (e, node) => {
                node.isHighlighted = false;
                self.darkenNodes(node.diagram.selection);
            },
            mouseDrop: (e, node) => {
                node.isHighlighted = false;
                self.handleNodeDropped(node);
                self.darkenNodes(node.diagram.selection);
            },
            name: 'USER',
            contextMenu: self.mainContextMenu,
            selectionAdorned: false,
            zOrder: 20,
            isShadowed: true,
            shadowColor: '#999',
            shadowBlur: 15,
            shadowOffset: new go.Point(0, 0),
            deletable: false,
            portId: '__standard',
            fromSpot: new go.Spot(0.5, 1, 0, 8.5 - STYLE.NODE_SELECTED_BOUNDARY_SIZE), // Bottom
            toSpot: new go.Spot(0.5, 0, 0, 3 + STYLE.NODE_SELECTED_BOUNDARY_SIZE), // Top
            fromLinkable: false,
            toLinkable: false,
            fromLinkableSelfNode: false,
            toLinkableSelfNode: false,
            fromLinkableDuplicates: false,
            toLinkableDuplicates: false
        },
        new go.Binding('layerName', 'isSelected', function (sel) {
            return sel ? 'Foreground' : '';
        }).ofObject(),
        new go.Binding('zOrder', 'isSelected', function (sel) {
            return sel ? 25 : 20;
        }).ofObject(),
        new go.Binding('location', 'location', (loc) => {
            return new go.Point(loc.x, loc.y);
        }).makeTwoWay((newLoc) => {
            return {
                x: newLoc.x,
                y: newLoc.y
            };
        }),

        // Wrapper for Selection Highlight
        $(
            go.Panel,
            'Auto',
            { stretch: go.GraphObject.Fill },
            $(
                go.Shape,
                'RoundedRectangle',
                {
                    parameter1: STYLE.NODE_CORNER_RADIUS,
                    fill: 'transparent',
                    strokeWidth: 0,
                    shadowVisible: false,
                    stretch: go.GraphObject.Fill,
                    contextMenu: false
                },
                new go.Binding('fill', 'isSelected', (h) => {
                    return h ? STYLE.NODE_SELECTED_UNDERLAY_COLOR : 'transparent';
                }).ofObject('')
            ),

            // Surrounding Content
            $(
                go.Panel,
                'Spot',
                { stretch: go.GraphObject.Fill, margin: new go.Margin(1.5 * STYLE.NODE_SELECTED_BOUNDARY_SIZE) },

                // Overall backing shape
                $(
                    go.Panel,
                    'Spot',
                    { stretch: go.GraphObject.Fill },
                    $(go.Shape, 'Rectangle', {
                        isPanelMain: false,
                        fill: 'rgba(128,0,0,0.0)',
                        stroke: '#999',
                        strokeWidth: 0,
                        shadowVisible: false,
                        stretch: go.GraphObject.Fill
                    })
                ),

                // Rounded Backing Shape
                // Custom relationship links root to the shape
                $(
                    go.Shape,
                    'RoundedRectangle',
                    {
                        name: 'NODEBASESHAPE',
                        portId: self._relLinkPort,
                        fromLinkableSelfNode: false,
                        toLinkableSelfNode: false,
                        cursor: 'pointer',
                        stretch: go.GraphObject.Fill,
                        parameter1: '40',
                        fill: STYLE.NON_KEYSTAKEHOLDER_SHAPE_COLOR,
                        stroke: '#ccc',
                        strokeWidth: 0,
                        fromLinkable: true,
                        toLinkable: true,
                        fromLinkableDuplicates: true,
                        toLinkableDuplicates: true,
                        shadowVisible: false
                    },
                    new go.Binding('stroke', 'isSelected', function (sel) {
                        return sel ? STYLE.NON_KEYSTAKEHOLDER_SHAPE_COLOR : STYLE.NON_KEYSTAKEHOLDER_SHAPE_COLOR;
                    }).ofObject(''),
                    new go.Binding('fill', 'isHighlighted', function (h) {
                        return h ? STYLE.NODE_HIGHLIGHT_COLOR : STYLE.NON_KEYSTAKEHOLDER_SHAPE_COLOR;
                    }).ofObject('')
                ),

                // Main content panel area for the node
                $(
                    go.Panel,
                    'Table',
                    { isPanelMain: true, stretch: go.GraphObject.Fill },

                    $(go.RowColumnDefinition, { column: 0, width: 2 * STYLE.NODE_CORNER_RADIUS }),
                    $(go.RowColumnDefinition, { column: 1, minimum: STYLE.NODE_CONTENT_PANEL_WIDTH }),
                    $(go.RowColumnDefinition, { column: 2, width: 2 * STYLE.NODE_CORNER_RADIUS }),

                    // Top padding blockout
                    $(go.Shape, 'Rectangle', {
                        row: 0,
                        column: 1,
                        stretch: go.GraphObject.Horizontal,
                        margin: new go.Margin(0, 0, 0, 0),
                        height: 35,
                        strokeWidth: 0,
                        fill: 'transparent'
                    }),

                    // Primary Fields
                    $(
                        go.Panel,
                        'Vertical',
                        {
                            row: 1,
                            column: 1,
                            alignment: go.Spot.Left,
                            stretch: go.GraphObject.Horizontal,
                            cursor: 'pointer'
                        },
                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                alignment: go.Spot.Center
                            },
                            $(
                                go.TextBlock,
                                {
                                    font: '16pt sans-serif',
                                    stroke: STYLE.NON_KEYSTAKEHOLDER_NAME_COLOR,
                                    textAlign: 'center',
                                    shadowVisible: false
                                },
                                new go.Binding('text', 'name')
                            )
                        ),

                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                alignment: go.Spot.Left,
                                padding: new go.Margin(0, 20, 0, 0)
                            },
                            $(
                                go.TextBlock,
                                {
                                    font: STYLE.NODE_TITLE_FONT,
                                    alignment: go.Spot.Left,
                                    textAlign: 'left',
                                    stroke: '#fff',
                                    visible: false,
                                    shadowVisible: false
                                },
                                new go.Binding('text', 'title'),
                                new go.Binding('visible', 'title', (ttl) => {
                                    return ttl !== null && ttl !== '';
                                })
                            )
                        )
                    ),

                    // Bottom padding blockout
                    $(
                        go.Shape,
                        'Rectangle',
                        {
                            row: 99,
                            column: 1,
                            stretch: go.GraphObject.Horizontal,
                            margin: new go.Margin(0, 0, 0, 0),
                            height: 40,
                            strokeWidth: 0,
                            fill: 'transparent'
                        },
                        new go.Binding('height', 'additionalFields', (fields) => {
                            return !(Array.isArray(fields) && fields.length > 0) ? 30 : 10;
                        })
                    )
                )
            )
        ),

        // Overlay Tree Expander
        $('TreeExpanderButton', {
            margin: new go.Margin(4, 0, 0, 0),
            alignment: new go.Spot(0.5, 1, 0, -STYLE.NODE_SELECTED_BOUNDARY_SIZE)
        })
    );

    return template;
};

export { templateManager };