import STYLE from './style.js';

const templateLead = (go, $, self, badgeTemplate) => {
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
            name: 'LEAD',
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
                        stroke: STYLE.NODE_LEAD_STROKE,
                        fill: STYLE.NODE_LEAD_FILL
                    }),

                    // Rounded Backing Shape
                    $(
                        go.Shape,
                        'RoundedRectangle',
                        {
                            cursor: 'pointer',
                            stretch: go.GraphObject.Fill,
                            parameter1: STYLE.NODE_CORNER_RADIUS * 0.75,
                            fill: STYLE.NODE_LEAD_FILL,
                            stroke: '#ccc',
                            strokeWidth: 2,
                            shadowVisible: true
                        },
                        new go.Binding('stroke', 'isSelected', function (sel) {
                            return sel ? STYLE.NODE_LEAD_SELECTED_STROKE : STYLE.NODE_LEAD_STROKE;
                        }).ofObject(''),
                        new go.Binding('fill', 'isHighlighted', function (h) {
                            return h ? STYLE.NODE_HIGHLIGHT_COLOR : STYLE.NODE_LEAD_FILL;
                        }).ofObject('')
                    ),

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
                            return h ? STYLE.NODE_HIGHLIGHT_COLOR : STYLE.NODE_LEAD_FILL;
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
                            'F M 78,44H50H22c-2,0-2.8,2.5-1.1,3.6L35.5,57c0.7,0.5,1.1,1.4,0.8,2.2l-5.5,18.3c-0.6,2,2,3.4,3.5,1.9l14.2-15c0.8-0.9,2.2-0.9,3,0l14.2,15c1.4,1.5,4,0.1,3.5-1.9l-5.5-18.3c-0.2-0.8,0.1-1.7,0.8-2.2l14.6-9.4C80.8,46.5,80,44,78,44 x F M 41.1,28.7c-0.2,5,4,9.3,8.8,9.4c5.5,0,9.8-5.5,8.8-10.8c-0.8-4.1-4.6-7.5-9.2-7.3C44.9,20.1,41.2,24.1,41.1,28.7z',
                        width: STYLE.NODE_HEAD_ICON_WIDTH * 0.45,
                        height: STYLE.NODE_HEAD_ICON_HEIGHT * 0.45,
                        fill: '#fff',
                        stroke: 'transparent',
                        strokeWidth: 0,
                        name: 'KSProfileIcon',
                        visible: true
                    }),

                    // #endregion

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
                            )
                        ),

                        // Badges
                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                row: 2,
                                column: 1,
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

export { templateLead };