import STYLE from './style.js';

const WIDTH = 360;
const HEIGHT = 240;

const templatePlaceholderFixedSize = (go, $, self, badgeTemplate) => {
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
                self.handleNodeDroppedOnPlaceholder(node);
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
            isShadowed: false,
            shadowColor: '#ccc',
            shadowBlur: 25,
            shadowOffset: new go.Point(0, 0),
            portId: '__standard',
            fromSpot: go.Spot.Bottom,
            toSpot: go.Spot.Top,
            fromLinkable: false,
            toLinkable: false,
            fromLinkableSelfNode: false,
            toLinkableSelfNode: false,
            fromLinkableDuplicates: false,
            toLinkableDuplicates: false
        },
        new go.Binding('layerName', 'isSelected', (sel) => {
            return sel ? 'Foreground' : '';
        }).ofObject(),
        new go.Binding('zOrder', 'isSelected', (sel) => {
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
                        fill: 'transparent',
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
                        portId: self._relLinkPort,
                        fromLinkableSelfNode: false,
                        toLinkableSelfNode: false,
                        cursor: 'pointer',
                        stretch: go.GraphObject.Fill,
                        parameter1: STYLE.NODE_CORNER_RADIUS,
                        stroke: 'transparent',
                        strokeWidth: 0,
                        fromLinkable: true,
                        toLinkable: true,
                        fromLinkableDuplicates: true,
                        toLinkableDuplicates: true,
                        width: WIDTH,
                        height: HEIGHT
                    },
                    new go.Binding('stroke', 'isSelected', (sel) => {
                        return sel ? STYLE.NODE_SELECTED_STROKE_COLOR : STYLE.NODE_STROKE_COLOR;
                    }).ofObject(''),
                    new go.Binding('fill', 'isHighlighted', (h) => {
                        return h ? STYLE.NODE_HIGHLIGHT_COLOR : '#eeeeee';
                    }).ofObject('')
                ),

                // Blocking Shape for Dragging instead of Drawing
                $(
                    go.Shape,
                    'RoundedRectangle',
                    {
                        name: 'KSBlocker',
                        cursor: 'pointer',
                        stretch: go.GraphObject.Fill,
                        parameter1: STYLE.NODE_CORNER_RADIUS,
                        fill: '#eeeeee',
                        stroke: STYLE.NODE_STROKE_COLOR,
                        strokeWidth: 4,
                        strokeDashArray: [10, 10],
                        width: WIDTH,
                        height: HEIGHT
                    },
                    new go.Binding('stroke', 'isSelected', (sel) => {
                        return sel ? STYLE.NODE_SELECTED_STROKE_COLOR : STYLE.NODE_STROKE_COLOR;
                    }).ofObject('')
                ),

                // Main content panel area for the node
                $(
                    go.Panel,
                    'Vertical',
                    {
                        isPanelMain: true,
                        stretch: go.GraphObject.Fill,
                        background: 'transparent',
                        maxSize: new go.Size(WIDTH, HEIGHT - 30)
                    },

                    // Primary Fields
                    $(
                        go.Panel,
                        'Vertical',
                        {
                            row: 0,
                            column: 0,
                            alignment: go.Spot.Center,
                            stretch: go.GraphObject.Fill,
                            cursor: 'pointer',
                            padding: new go.Margin(20, 20, 20, 20),
                            maxSize: new go.Size(WIDTH, HEIGHT - 80)
                        },
                        $(
                            go.TextBlock,
                            {
                                font: STYLE.NODE_NAME_FONT,
                                alignment: go.Spot.Center,
                                textAlign: 'center',
                                stroke: STYLE.NODE_NAME_COLOR,
                                editable: true
                            },
                            new go.Binding('text', 'name').makeTwoWay((newLabel, nodeData) => {
                                const event = new CustomEvent('updateplaceholderlabel', {
                                    detail: { nodeData: nodeData, newLabel: newLabel }
                                });

                                self.dispatchEvent(event);
                            })
                        ),
                        $(
                            go.TextBlock,
                            {
                                font: '14pt sans-serif',
                                alignment: go.Spot.Center,
                                textAlign: 'center',
                                stroke: STYLE.NODE_TITLE_COLOR,
                                editable: true
                            },
                            new go.Binding('text', 'title').makeTwoWay((newDescription, nodeData) => {
                                const event = new CustomEvent('updateplaceholderdescription', {
                                    detail: { nodeData: nodeData, newDescription: newDescription }
                                });

                                self.dispatchEvent(event);
                            })
                        )
                    ),

                    // Badges
                    $(
                        go.Panel,
                        'Horizontal',
                        {
                            alignment: go.Spot.Left,
                            shadowVisible: false,
                            margin: new go.Margin(10, 10, 0, 10),
                            stretch: go.GraphObject.Horizontal,
                            itemTemplate: badgeTemplate,
                            height: 30
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
        ),

        // Overlay Tree Expander
        $('TreeExpanderButton', {
            margin: new go.Margin(4, 0, 0, 0),
            alignment: new go.Spot(0.5, 1, 0, -STYLE.NODE_SELECTED_BOUNDARY_SIZE)
        })
    );

    return template;
};

export { templatePlaceholderFixedSize };