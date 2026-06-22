import STYLE from './style.js';

const templateContact = (go, $, self, handleNodeDetailViewClicked, badgeTemplate) => {
    const template = $(
        go.Node,
        'Spot',
        {
            doubleClick: handleNodeDetailViewClicked,
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
            selectionChanged: (part) => {
                part.linksConnected.each(function (link) {
                    link.isHighlighted = part.isSelected;
                });
            },
            contextMenu: self.mainContextMenu,
            selectionAdorned: false,
            zOrder: 20,
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
                        background: 'transparent',
                        fill: STYLE.NON_KEYSTAKEHOLDER_SHAPE_COLOR,
                        stretch: go.GraphObject.Horizontal,
                        stroke: '#ccc',
                        strokeWidth: 2,
                        portId: self._relLinkPort,
                        cursor: 'pointer',
                        fromLinkable: true,
                        toLinkable: true,
                        fromLinkableDuplicates: true,
                        toLinkableDuplicates: true
                    },
                    new go.Binding('stroke', 'isSelected', function (sel) {
                        return sel ? STYLE.NODE_SELECTED_STROKE_COLOR : STYLE.NON_KEYSTAKEHOLDER_SHAPE_COLOR;
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

                    // Padding so Link doesn't get grabbed
                    $(go.Shape, 'Rectangle', {
                        row: 0,
                        column: 0,
                        width: 20,
                        height: 20,
                        fill: 'transparent',
                        strokeWidth: 0
                    }),
                    $(go.Shape, 'Rectangle', {
                        row: 0,
                        column: 1,
                        stretch: go.GraphObject.Horizontal,
                        height: 20,
                        fill: 'transparent',
                        strokeWidth: 0
                    }),
                    $(go.Shape, 'Rectangle', {
                        row: 0,
                        column: 2,
                        height: 20,
                        width: 20,
                        fill: 'transparent',
                        strokeWidth: 0
                    }),
                    $(go.Shape, 'Rectangle', {
                        row: 1,
                        column: 0,
                        stretch: go.GraphObject.Vertical,
                        width: 20,
                        fill: 'transparent',
                        strokeWidth: 0
                    }),
                    $(go.Shape, 'Rectangle', {
                        row: 1,
                        column: 2,
                        width: 20,
                        stretch: go.GraphObject.Vertical,
                        fill: 'transparent',
                        strokeWidth: 0
                    }),
                    $(go.Shape, 'Rectangle', {
                        row: 2,
                        column: 0,
                        width: 20,
                        height: 20,
                        fill: 'transparent',
                        strokeWidth: 0
                    }),
                    $(go.Shape, 'Rectangle', {
                        row: 2,
                        column: 1,
                        stretch: go.GraphObject.Horizontal,
                        height: 20,
                        fill: 'transparent',
                        strokeWidth: 0
                    }),
                    $(go.Shape, 'Rectangle', {
                        row: 2,
                        column: 2,
                        height: 20,
                        width: 20,
                        fill: 'transparent',
                        strokeWidth: 0
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
                                    font: STYLE.NON_KEYSTAKEHOLDER_NAME_FONT,
                                    stroke: STYLE.NON_KEYSTAKEHOLDER_NAME_COLOR,
                                    textAlign: 'center'
                                },
                                new go.Binding('text', 'name')
                            )
                        ),

                        $(
                            go.Panel,
                            'Table',
                            { isPanelMain: true, stretch: go.GraphObject.Fill },

                            // Padding so Link doesn't get grabbed
                            $(go.Shape, 'Rectangle', {
                                row: 0,
                                column: 0,
                                height: 20,
                                stretch: go.GraphObject.Horizontal,
                                fill: 'transparent',
                                strokeWidth: 0
                            }),

                            $(go.Shape, 'Rectangle', {
                                row: 0,
                                column: 2,
                                height: 20,
                                stretch: go.GraphObject.Horizontal,
                                fill: 'transparent',
                                strokeWidth: 0
                            }),

                            $(
                                go.TextBlock,
                                {
                                    row: 0,
                                    column: 1,
                                    height: 20,
                                    font: '12pt sans-serif',
                                    visible: false,
                                    textAlign: 'center',
                                    cursor: 'pointer'
                                },
                                new go.Binding('text', 'title'),
                                new go.Binding('visible', 'title', function (ttl) {
                                    return ttl !== null && ttl !== '';
                                }),
                                new go.Binding('stroke', 'isSelected', function (sel) {
                                    return sel ? '#fff' : STYLE.NON_KEYSTAKEHOLDER_NAME_COLOR;
                                }).ofObject()
                            )
                        ),

                        // Badges
                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                alignment: go.Spot.Left,
                                shadowVisible: false,
                                margin: new go.Margin(10, 0, 0, 0),
                                stretch: go.GraphObject.Horizontal,
                                itemTemplate: badgeTemplate
                            },
                            new go.Binding('visible', 'badges', (badges) => {
                                if (!Array.isArray(badges)) {
                                    return false;
                                }

                                if (badges.length <= 0) {
                                    return false;
                                }

                                return true;
                            }),
                            new go.Binding('itemArray', 'badges')
                        )
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

export { templateContact };