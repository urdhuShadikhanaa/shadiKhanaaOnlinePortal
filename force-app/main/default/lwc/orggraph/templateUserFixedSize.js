import STYLE from './style.js';

const WIDTH = 360;
const HEIGHT = 240;

const templateUserFixedSize = (go, $, self, badgeTemplate) => {
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
                        portId: self._relLinkPort,
                        cursor: 'pointer',
                        stretch: go.GraphObject.None,
                        alignment: go.Spot.Top,
                        fromLinkableSelfNode: false,
                        toLinkableSelfNode: false,
                        fromLinkable: true,
                        toLinkable: true,
                        fromLinkableDuplicates: true,
                        toLinkableDuplicates: true,
                        shadowVisible: true
                    },

                    $(
                        go.Shape,
                        'RoundedRectangle',
                        {
                            name: 'NODEBASESHAPE',
                            cursor: 'pointer',
                            isPanelMain: false,
                            stretch: go.GraphObject.None,
                            parameter1: STYLE.NODE_CORNER_RADIUS,
                            fill: STYLE.NODE_USER_FILL,
                            stroke: '#ccc',
                            strokeWidth: 2,
                            width: WIDTH,
                            height: HEIGHT,
                            shadowVisible: true
                        },
                        new go.Binding('stroke', 'isSelected', function (sel) {
                            return sel ? STYLE.NODE_USER_SELECTED_STROKE : STYLE.NODE_USER_STROKE;
                        }).ofObject(''),
                        new go.Binding('fill', 'isHighlighted', function (h) {
                            return h ? STYLE.NODE_HIGHLIGHT_COLOR : STYLE.NODE_USER_FILL;
                        }).ofObject('')
                    ),

                    $(go.Shape, 'Circle', {
                        stretch: go.GraphObject.None,
                        alignment: go.Spot.Top,
                        width: 106,
                        height: 106,
                        strokeWidth: 0,
                        stroke: STYLE.NODE_USER_STROKE,
                        fill: STYLE.NODE_USER_FILL
                    }),

                    // Heashot Circle's Colored Padding Ring
                    $(
                        go.Shape,
                        'Circle',
                        {
                            visible: true,
                            alignment: go.Spot.Top,
                            width: 90,
                            height: 90,
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
                        alignment: go.Spot.Top,
                        width: 92,
                        height: 92,
                        strokeWidth: 2,
                        stroke: '#fff',
                        fill: '#989898'
                    }),

                    // Heashot Circle's Default Icon
                    $(go.Shape, {
                        alignment: go.Spot.Top,
                        geometryString:
                            'F M 22.55,8.59c0,4.74-3.24,8.58-7.23,8.58S8.08,13.33,8.08,8.59,11.32,0,15.32,0,22.55,3.84,22.55,8.59ZM.1,27.83c-1.07-3.94,6.54-10.09,10-8.74.88.34.82.9,2.21,1.58a7,7,0,0,0,6.1.12c1.32-.68,1.22-1.34,2.1-1.7,3.27-1.37,11.09,5.21,9.9,9-.7,2.23-4.45,3-7.82,3.77a35.59,35.59,0,0,1-7.27.55c-4.31.07-6.51.09-8.86-.6S.72,30.11.1,27.83Z',
                        width: 50,
                        height: 50,
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
                            width: 92,
                            height: 92,
                            background: 'transparent',
                            isClipping: true,
                            alignment: go.Spot.TopCenter
                        },
                        $(go.Shape, 'Circle', {
                            width: 92,
                            height: 92,
                            background: 'transparent',
                            strokeWidth: 2,
                            stroke: '#00f',
                            cursor: 'pointer'
                        }),
                        $(
                            go.Picture,
                            {
                                width: 92,
                                height: 92,
                                cursor: 'pointer'
                            },
                            new go.Binding('source', 'profileImageUrlOrData')
                        )
                    )
                ),

                // Main content panel area for the node
                $(
                    go.Panel,
                    'Vertical',
                    {
                        isPanelMain: true,
                        stretch: go.GraphObject.None,
                        maxSize: new go.Size(WIDTH, HEIGHT - 80)
                    },

                    // Primary Fields
                    $(
                        go.Panel,
                        'Vertical',
                        {
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
                                itemTemplate: badgeTemplate,
                                height: 40
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

export { templateUserFixedSize };