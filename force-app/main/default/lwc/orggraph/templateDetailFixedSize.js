import STYLE from './style.js';
import { isLightColor } from 'c/utils';

const WIDTH = 360;
const HEIGHT = 240;

const templateDetailFixedSize = (
    go,
    $,
    self,
    handleNodeDetailViewClicked,
    extendedFieldsTemplate,
    extendedFieldsTopTemplate,
    extendedFieldsTopForUrlTemplate,
    svgAvatarUrl,
    badgeTemplate
) => {
    const template = $(
        go.Node,
        'Spot',
        {
            doubleClick: handleNodeDetailViewClicked,
            mouseEnter: (e, node) => {
                const shape = node.findObject('HEADSHOT_OVERLAY');

                if (shape) {
                    shape.opacity = 0.5;
                }
            },
            mouseLeave: (e, node) => {
                const shape = node.findObject('HEADSHOT_OVERLAY');

                if (shape) {
                    shape.opacity = 0.0;
                }
            },
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
            name: 'STAKEHOLDER',
            contextMenu: self.mainContextMenu,
            selectionAdorned: false,
            zOrder: 20,
            isShadowed: true,
            shadowColor: '#999',
            shadowBlur: 20,
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
        new go.Binding('shadowColor', 'isSelected', (sel) => {
            return sel ? '#ccc' : '#999';
        }).ofObject(),
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
                    parameter1: STYLE.NODE_CORNER_RADIUS + 1 * STYLE.NODE_SELECTED_BOUNDARY_SIZE,
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
                        shadowVisible: false
                    },

                    // Lowest level circle behind node box, hold border line
                    $(go.Shape, 'Circle', {
                        visible: true,
                        stretch: go.GraphObject.Fill,
                        alignment: go.Spot.TopCenter,
                        width: STYLE.NODE_HEAD_ICON_WIDTH + 42,
                        height: STYLE.NODE_HEAD_ICON_HEIGHT + 42,
                        strokeWidth: 4,
                        stroke: 'transparent',
                        shadowVisible: true,
                        fill: '#fff'
                    }),

                    // Highlight underlay fill
                    $(
                        go.Shape,
                        'RoundedRectangle',
                        {
                            cursor: 'pointer',
                            stretch: go.GraphObject.None,
                            width: WIDTH,
                            height: HEIGHT,
                            parameter1: 15,
                            fill: '#fff',
                            strokeWidth: 0,
                            shadowVisible: true
                        },
                        new go.Binding('fill', 'isHighlighted', (h) => {
                            return h ? STYLE.NODE_HIGHLIGHT_COLOR : '#fff';
                        }).ofObject('')
                    ),

                    // Bottom edge support value
                    $(
                        go.Panel,
                        'Vertical',
                        {
                            isPanelMain: true,
                            stretch: go.GraphObject.None,
                            width: WIDTH,
                            height: HEIGHT
                        },

                        $(go.Shape, 'RoundedTopRectangle', {
                            stretch: go.GraphObject.None,
                            width: WIDTH,
                            height: HEIGHT - 35,
                            parameter1: STYLE.NODE_CORNER_RADIUS,
                            background: 'transparent',
                            fill: 'transparent',
                            strokeWidth: 0,
                            shadowVisible: true
                        }),

                        $(
                            go.Panel,
                            'Spot',
                            {
                                stretch: go.GraphObject.None,
                                width: WIDTH,
                                height: 35
                            },

                            $(
                                go.Shape,
                                'RoundedBottomRectangle',
                                {
                                    stretch: go.GraphObject.None,
                                    width: WIDTH - 0.5,
                                    height: 35,
                                    parameter1: 15,
                                    fill: '#fff',
                                    strokeWidth: 0,
                                    shadowVisible: false
                                },
                                new go.Binding('fill', 'supportColor', (val) => {
                                    return val ? val : '#fff';
                                })
                            ),

                            // Support Text ie CHAMPION, SUPPORTER, BLOCKER
                            $(
                                go.Panel,
                                'Position',
                                $(
                                    go.TextBlock,
                                    {
                                        font: 'bold 12pt sans-serif',
                                        stroke: STYLE.NODE_SUPPORT_DEFAULT_BUTTON_FONT_COLOR,
                                        position: new go.Point(25, 4),
                                        visible: false
                                    },
                                    new go.Binding('text', 'supportLabel', (val) => {
                                        return val.toUpperCase();
                                    }),
                                    new go.Binding('stroke', 'supportColor', (val) => {
                                        const color = val;
                                        let textColor = STYLE.NODE_NAME_COLOR;

                                        if (color) {
                                            textColor = isLightColor(color) ? '#000000' : '#ffffff';
                                        }

                                        return textColor;
                                    }),
                                    new go.Binding('visible', 'supportLabel', (val) => {
                                        if (val && val.length > 0) {
                                            return true;
                                        }

                                        return false;
                                    })
                                )
                            )
                        )
                    ),

                    // Next level circle behind profile, masking backing shape border
                    $(
                        go.Shape,
                        'Circle',
                        {
                            visible: true,
                            stretch: go.GraphObject.Fill,
                            alignment: go.Spot.TopCenter,
                            width: STYLE.NODE_HEAD_ICON_WIDTH + 42,
                            height: STYLE.NODE_HEAD_ICON_HEIGHT + 42,
                            strokeWidth: 0,
                            stroke: 'transparent',
                            shadowVisible: false,
                            fill: '#fff'
                        },
                        new go.Binding('fill', 'isHighlighted', (h) => {
                            return h ? STYLE.NODE_HIGHLIGHT_COLOR : '#fff';
                        }).ofObject('')
                    ),

                    // Headshot/Profile Image
                    $(
                        go.Panel,
                        'Spot',
                        {
                            isClipping: true,
                            background: 'transparent',
                            visible: true,
                            alignment: go.Spot.Top
                        },
                        $(go.Shape, 'Circle', {
                            width: 100,
                            fill: '#fff',
                            strokeWidth: 0
                        }),
                        $(go.Picture, {
                            desiredSize: new go.Size(100, 100),
                            source: svgAvatarUrl
                        }),
                        new go.Binding('visible', 'profileImageUrlOrData', (profileImageUrlData) => {
                            if (profileImageUrlData && profileImageUrlData.length > 0) {
                                return false;
                            }

                            return true;
                        })
                    ),

                    // The actual proflie image circle, if the graphic source is provided
                    $(
                        go.Panel,
                        'Spot',
                        {
                            cursor: 'pointer',
                            width: 100,
                            height: 100,
                            background: 'transparent',
                            isClipping: true,
                            alignment: go.Spot.Top
                        },
                        $(go.Shape, 'Circle', {
                            width: 100,
                            height: 100,
                            background: 'transparent',
                            strokeWidth: 2,
                            stroke: '#00f',
                            cursor: 'pointer'
                        }),
                        $(
                            go.Picture,
                            {
                                width: 100,
                                height: 100,
                                cursor: 'pointer'
                            },
                            new go.Binding('source', 'profileImageUrlOrData')
                        )
                    ),

                    // Hover highlight circle if enabled
                    $(go.Shape, 'Circle', {
                        name: 'HEADSHOT_OVERLAY',
                        visible: false,
                        opacity: 0.0,
                        stretch: go.GraphObject.Fill,
                        alignment: go.Spot.TopCenter,
                        width: 100,
                        height: 100,
                        strokeWidth: 0,
                        stroke: '#fff',
                        shadowVisible: false,
                        background: 'transparent',
                        fill: '#fff'
                    }),

                    // Primary Fields
                    $(
                        go.Panel,
                        'Vertical',
                        {
                            stretch: go.GraphObject.None,
                            width: WIDTH,
                            height: HEIGHT
                        },

                        // Social Icons
                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                defaultAlignment: go.Spot.Right,
                                shadowVisible: false,
                                margin: new go.Margin(5, STYLE.NODE_RIGHT_PADDING, 0, 260),
                                stretch: go.GraphObject.None,
                                itemTemplate: extendedFieldsTopForUrlTemplate,
                                width: 110,
                                height: 40
                            },
                            new go.Binding('itemArray', 'additionalFields')
                        ),

                        // Primary Fields
                        $(
                            go.Panel,
                            'Vertical',
                            {
                                alignment: go.Spot.Center,
                                stretch: go.GraphObject.Vertical,
                                cursor: 'pointer',
                                width: WIDTH - STYLE.NODE_LEFT_PADDING - STYLE.NODE_RIGHT_PADDING,
                                margin: new go.Margin(15, STYLE.NODE_RIGHT_PADDING, 5, STYLE.NODE_LEFT_PADDING),
                                height: HEIGHT - 45 - 20 - 40 - 40 // SocialIcon[height+margins](45),  Primary Field padding(20), Support(40), Badges(40),
                            },

                            // Name
                            $(
                                go.Panel,
                                'Horizontal',
                                {
                                    alignment: go.Spot.Center
                                },
                                $(
                                    go.TextBlock,
                                    {
                                        font: 'bold 18pt sans-serif',
                                        alignment: go.Spot.Center,
                                        textAlign: 'left',
                                        stroke: STYLE.NODE_NAME_COLOR,
                                        shadowVisible: false
                                    },
                                    new go.Binding('text', 'name')
                                )
                            ),

                            // Title
                            $(
                                go.Panel,
                                'Horizontal',
                                {
                                    alignment: go.Spot.Center
                                },
                                $(
                                    go.TextBlock,
                                    {
                                        font: '11pt sans-serif',
                                        alignment: go.Spot.Center,
                                        textAlign: 'left',
                                        stroke: STYLE.NODE_TITLE_COLOR,
                                        visible: false,
                                        shadowVisible: false
                                    },
                                    new go.Binding('text', 'title'),
                                    new go.Binding('visible', 'title', (ttl) => {
                                        return ttl !== null && ttl !== '';
                                    })
                                )
                            ),

                            // Additional Fields to be in the main section
                            $(
                                go.Panel,
                                'Vertical',
                                {
                                    stretch: go.GraphObject.Horizontal, // Take up whole available width
                                    defaultAlignment: go.Spot.Center, // Thus no need to specify alignment on each element
                                    itemTemplate: extendedFieldsTopTemplate // The Panel created for each item in Panel.itemArray
                                },
                                new go.Binding('visible', 'additionalFields', (fields) => {
                                    if (!Array.isArray(fields)) {
                                        return false;
                                    }

                                    return fields.some((item) => {
                                        if (item.isMainSection) {
                                            return true;
                                        }

                                        return false;
                                    });
                                }),
                                new go.Binding('itemArray', 'additionalFields')
                            ),

                            // Influence Text
                            $(
                                go.Panel,
                                'Horizontal',
                                {
                                    alignment: go.Spot.Center,
                                    visible: false
                                },
                                $(
                                    go.TextBlock,
                                    {
                                        font: '11pt sans-serif',
                                        stroke: STYLE.NODE_TITLE_COLOR,
                                        alignment: go.Spot.Center
                                    },
                                    new go.Binding('text', 'influenceLabel', (val) => {
                                        return val;
                                    })
                                ),
                                new go.Binding('visible', 'influenceLabel', (val) => {
                                    if (val && val.length > 0) {
                                        return true;
                                    }

                                    return false;
                                })
                            )
                        ),

                        // Badges
                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                alignment: go.Spot.Center,
                                shadowVisible: false,
                                margin: new go.Margin(5, STYLE.NODE_RIGHT_PADDING, 10, STYLE.NODE_LEFT_PADDING),
                                stretch: go.GraphObject.None,
                                itemTemplate: badgeTemplate,
                                height: 30,
                                width: WIDTH - STYLE.NODE_LEFT_PADDING - STYLE.NODE_RIGHT_PADDING
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

export { templateDetailFixedSize };