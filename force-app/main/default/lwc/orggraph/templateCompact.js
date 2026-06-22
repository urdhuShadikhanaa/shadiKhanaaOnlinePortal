import STYLE from './style.js';
import { isLightColor } from 'c/utils';

const templateCompact = (go, $, self, handleNodeDetailViewClicked, badgeTemplate) => {
    const template = $(
        go.Node,
        'Spot',
        {
            doubleClick: handleNodeDetailViewClicked,
            mouseDragEnter: (e, node) => {
                const selection = node.diagram.selection;

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
            name: 'STAKEHOLDER',
            contextMenu: self.mainContextMenu,
            selectionAdorned: false,
            zOrder: 20,
            isShadowed: false,
            shadowColor: '#ccc',
            shadowBlur: 25,
            shadowOffset: new go.Point(0, 0),
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
                    parameter1: STYLE.NODE_CORNER_RADIUS + 0.5 * STYLE.NODE_SELECTED_BOUNDARY_SIZE,
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
                { stretch: go.GraphObject.Fill, margin: new go.Margin(STYLE.NODE_SELECTED_BOUNDARY_SIZE) },

                // Rounded Backing Shape
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
                        fill: '#fff',
                        stroke: 'transparent',
                        strokeWidth: 5,
                        fromLinkable: true,
                        toLinkable: true,
                        fromLinkableDuplicates: true,
                        toLinkableDuplicates: true,
                        shadowVisible: false
                    },
                    new go.Binding('fill', 'supportColor', (val) => {
                        return val ? val : '#ccc';
                    })
                ),

                // Highlighted Overlay Shade
                $(
                    go.Shape,
                    'RoundedRectangle',
                    {
                        cursor: 'pointer',
                        stretch: go.GraphObject.Fill,
                        parameter1: STYLE.NODE_CORNER_RADIUS,
                        fill: 'transparent',
                        stroke: 'transparent'
                    },
                    new go.Binding('fill', 'isHighlighted', (h) => {
                        return h ? STYLE.NODE_HIGHLIGHT_COLOR : 'transparent';
                    }).ofObject('')
                ),

                // Main content panel area for the node
                $(
                    go.Panel,
                    'Vertical',
                    {
                        isPanelMain: true,
                        padding: new go.Margin(50, 30, 30, 30),
                        alignment: go.Spot.Center,
                        stretch: go.GraphObject.Fill,
                        cursor: 'pointer'
                    },

                    $(
                        go.TextBlock,
                        {
                            font: 'bold 26pt sans-serif',
                            alignment: go.Spot.Center,
                            textAlign: 'center',
                            stroke: STYLE.NODE_NAME_COLOR
                        },
                        new go.Binding('text', 'name'),
                        new go.Binding('stroke', 'supportColor', (val) => {
                            const color = val;
                            let textColor = STYLE.NODE_NAME_COLOR;

                            if (color) {
                                textColor = isLightColor(color) ? '#000000' : '#ffffff';
                            }

                            return textColor;
                        })
                    ),

                    $(
                        go.TextBlock,
                        {
                            font: '18pt sans-serif',
                            alignment: go.Spot.Center,
                            textAlign: 'center',
                            stroke: STYLE.NODE_NAME_COLOR,
                            visible: false
                        },
                        new go.Binding('text', 'title'),
                        new go.Binding('visible', 'title', (t) => {
                            return !!t;
                        }),
                        new go.Binding('stroke', 'supportColor', (val) => {
                            const color = val;
                            let textColor = STYLE.NODE_NAME_COLOR;

                            if (color) {
                                textColor = isLightColor(color) ? '#000000' : '#ffffff';
                            }

                            return textColor;
                        })
                    ),

                    $(
                        go.Panel,
                        'Horizontal',
                        {
                            alignment: go.Spot.Left,
                            shadowVisible: false,
                            margin: new go.Margin(15, 0, 0, 0),
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
        ),

        // Overlay Tree Expander
        $('TreeExpanderButton', {
            margin: new go.Margin(4, 0, 0, 0),
            alignment: new go.Spot(0.5, 1, 0, -STYLE.NODE_SELECTED_BOUNDARY_SIZE)
        })
    );

    return template;
};

export { templateCompact };