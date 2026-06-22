import STYLE from './style.js';

const templateUser = (go, $, self, badgeTemplate) => {
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
            selectionChanged: (part) => {
                part.linksConnected.each(function (link) {
                    link.isHighlighted = part.isSelected;
                });
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
            fromLinkable: false,
            toLinkable: false,
            fromLinkableSelfNode: false,
            toLinkableSelfNode: false,
            fromLinkableDuplicates: false,
            toLinkableDuplicates: false
        },
        new go.Binding('shadowColor', 'isSelected', (sel) => {
            return sel ? '#ccc' : '#999';
        }).ofObject(),
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

                // Custom relationship links root to the shape
                $(
                    go.Panel,
                    'Spot',
                    {
                        name: 'NODEBASESHAPE',
                        portId: self._relLinkPort,
                        cursor: 'pointer',
                        stretch: go.GraphObject.Fill,
                        alignment: go.Spot.Top,
                        fromLinkableSelfNode: false,
                        toLinkableSelfNode: false,
                        fromLinkable: true,
                        toLinkable: true,
                        fromLinkableDuplicates: true,
                        toLinkableDuplicates: true,
                        shadowVisible: true
                    },

                    $(go.Shape, 'RoundedRectangle', {
                        stretch: go.GraphObject.Fill,
                        isPanelMain: false,
                        parameter1: STYLE.NODE_CORNER_RADIUS * 0.75,
                        fill: 'transparent',
                        stroke: 'transparent',
                        strokeWidth: 0,
                        shadowVisible: false
                    }),

                    $(go.Shape, 'Circle', {
                        visible: true,
                        stretch: go.GraphObject.Fill,
                        alignment: go.Spot.TopCenter,
                        width: STYLE.NODE_HEAD_ICON_WIDTH + 17,
                        height: STYLE.NODE_HEAD_ICON_HEIGHT + 17,
                        background: 'transparent',
                        strokeWidth: 0,
                        stroke: STYLE.NODE_USER_STROKE,
                        fill: STYLE.NODE_USER_FILL
                    }),

                    // Rounded Backing Shape
                    $(
                        go.Shape,
                        'RoundedRectangle',
                        {
                            cursor: 'pointer',
                            stretch: go.GraphObject.Fill,
                            parameter1: STYLE.NODE_CORNER_RADIUS * 0.75,
                            fill: STYLE.NODE_USER_FILL,
                            stroke: '#ccc',
                            strokeWidth: 2,
                            shadowVisible: true
                        },
                        new go.Binding('stroke', 'isSelected', function (sel) {
                            return sel ? STYLE.NODE_USER_SELECTED_STROKE : STYLE.NODE_USER_STROKE;
                        }).ofObject(''),
                        new go.Binding('fill', 'isHighlighted', function (h) {
                            return h ? STYLE.NODE_HIGHLIGHT_COLOR : STYLE.NODE_USER_FILL;
                        }).ofObject('')
                    ),

                    // Headshot/Profile Image URL

                    // Heashot Circle's Colored Padding Ring
                    $(
                        go.Shape,
                        'Circle',
                        {
                            visible: true,
                            alignment: go.Spot.TopCenter,
                            width: STYLE.NODE_HEAD_ICON_WIDTH + 13,
                            height: STYLE.NODE_HEAD_ICON_HEIGHT + 13,
                            strokeWidth: 0,
                            stroke: '#fff'
                        },
                        new go.Binding('fill', 'isHighlighted', function (h) {
                            return h ? STYLE.NODE_HIGHLIGHT_COLOR : STYLE.NODE_USER_FILL;
                        }).ofObject('')
                    ),

                    // White Ringed Gray Circle Behind Heashot Icon
                    $(go.Shape, 'Circle', {
                        visible: true,
                        alignment: go.Spot.TopCenter,
                        width: STYLE.NODE_HEAD_ICON_WIDTH + 2,
                        height: STYLE.NODE_HEAD_ICON_HEIGHT + 2,
                        strokeWidth: 2,
                        stroke: '#fff',
                        fill: '#989898'
                    }),

                    // Heashot Circle's Default Icon
                    $(go.Shape, {
                        alignment: go.Spot.TopCenter,
                        geometryString:
                            'F M 22.55,8.59c0,4.74-3.24,8.58-7.23,8.58S8.08,13.33,8.08,8.59,11.32,0,15.32,0,22.55,3.84,22.55,8.59ZM.1,27.83c-1.07-3.94,6.54-10.09,10-8.74.88.34.82.9,2.21,1.58a7,7,0,0,0,6.1.12c1.32-.68,1.22-1.34,2.1-1.7,3.27-1.37,11.09,5.21,9.9,9-.7,2.23-4.45,3-7.82,3.77a35.59,35.59,0,0,1-7.27.55c-4.31.07-6.51.09-8.86-.6S.72,30.11.1,27.83Z',
                        width: STYLE.NODE_HEAD_ICON_WIDTH * 0.45,
                        height: STYLE.NODE_HEAD_ICON_HEIGHT * 0.45,
                        fill: '#fff',
                        stroke: 'transparent',
                        strokeWidth: 0,
                        name: 'KSProfileIcon',
                        visible: true
                    }),

                    $(
                        go.Panel,
                        'Spot',
                        {
                            cursor: 'pointer',
                            width: STYLE.NODE_HEAD_ICON_WIDTH,
                            height: STYLE.NODE_HEAD_ICON_HEIGHT,
                            background: 'transparent',
                            isClipping: true,
                            alignment: go.Spot.TopCenter
                        },
                        $(go.Shape, 'Circle', {
                            width: STYLE.NODE_HEAD_ICON_WIDTH,
                            height: STYLE.NODE_HEAD_ICON_HEIGHT,
                            background: 'transparent',
                            strokeWidth: 2,
                            stroke: '#00f',
                            cursor: 'pointer'
                        }),
                        $(
                            go.Picture,
                            {
                                width: STYLE.NODE_HEAD_ICON_WIDTH,
                                height: STYLE.NODE_HEAD_ICON_HEIGHT,
                                cursor: 'pointer'
                            },
                            new go.Binding('source', 'profileImageUrlOrData')
                        )
                    ),

                    // Main content panel area for the node
                    $(
                        go.Panel,
                        'Table',
                        { isPanelMain: true, stretch: go.GraphObject.Fill },

                        $(go.RowColumnDefinition, {
                            column: 0,
                            width: 3 * STYLE.NODE_CORNER_RADIUS
                        }),
                        $(go.RowColumnDefinition, { column: 1, minimum: STYLE.NODE_CONTENT_PANEL_WIDTH }),
                        $(go.RowColumnDefinition, { column: 2, width: 3 * STYLE.NODE_CORNER_RADIUS }),

                        // Top padding blockout
                        $(go.Shape, 'Rectangle', {
                            row: 0,
                            column: 1,
                            stretch: go.GraphObject.Horizontal,
                            margin: new go.Margin(0, 0, 0, 0),
                            height: 50,
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
                                alignment: go.Spot.Center,
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
                                        font: STYLE.NODE_NAME_FONT,
                                        alignment: go.Spot.Center,
                                        textAlign: 'center',
                                        stroke: '#fff',
                                        shadowVisible: false
                                    },
                                    new go.Binding('text', 'name'),
                                    new go.Binding('stroke', 'isHighlighted', function (h) {
                                        return h ? '#000' : '#fff';
                                    }).ofObject('')
                                )
                            ),
                            $(
                                go.Panel,
                                'Horizontal',
                                {
                                    alignment: go.Spot.Center
                                },
                                $(
                                    go.TextBlock,
                                    {
                                        font: STYLE.NODE_TITLE_FONT,
                                        alignment: go.Spot.Center,
                                        textAlign: 'center',
                                        stroke: '#fff',
                                        visible: false,
                                        shadowVisible: false
                                    },
                                    new go.Binding('text', 'title'),
                                    new go.Binding('visible', 'title', (ttl) => {
                                        return ttl !== null && ttl !== '';
                                    }),
                                    new go.Binding('stroke', 'isHighlighted', function (h) {
                                        return h ? '#000' : '#fff';
                                    }).ofObject('')
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
                                return !(Array.isArray(fields) && fields.length > 0) ? 40 : 10;
                            })
                        )
                    )
                ),

                // Blocking Shape for Dragging instead of Drawing
                $(
                    go.Panel,
                    'Spot',
                    {
                        name: 'UBlocker',
                        stretch: go.GraphObject.Fill,
                        fromLinkable: false,
                        toLinkable: false,
                        fromLinkableSelfNode: false,
                        toLinkableSelfNode: false,
                        fromLinkableDuplicates: false,
                        toLinkableDuplicates: false,
                        fromEndSegmentLength: 0,
                        toEndSegmentLength: 0
                    },
                    $(go.Shape, 'RoundedRectangle', {
                        visible: true,
                        cursor: 'pointer',
                        stretch: go.GraphObject.Fill,
                        alignment: go.Spot.Top,
                        isPanelMain: true,
                        parameter1: STYLE.NODE_CORNER_RADIUS * 0.75,
                        fill: 'transparent',
                        stroke: 'transparent',
                        strokeWidth: 2,
                        shadowVisible: false
                    }),
                    $(go.Shape, 'Circle', {
                        visible: true,
                        cursor: 'pointer',
                        isPanelMain: false,
                        alignment: go.Spot.TopCenter,
                        width: STYLE.NODE_HEAD_ICON_WIDTH + 14,
                        height: STYLE.NODE_HEAD_ICON_HEIGHT + 14,
                        background: 'transparent',
                        strokeWidth: 2,
                        stroke: 'transparent',
                        fill: 'transparent'
                    }),

                    // Overlay Tree Expander
                    $('TreeExpanderButton', {
                        margin: new go.Margin(0, 0, 0, 0),
                        alignment: new go.Spot(0.5, 1, 0, 0)
                    })
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

export { templateUser };